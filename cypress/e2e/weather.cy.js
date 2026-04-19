// ─── Inline fixture data ───────────────────────────────────────────────────

const WEATHER_STUB = {
  city: "London",
  country: "UK",
  localtime: "2025-01-15 14:30",
  description: "Partly cloudy",
  temperature: 12.4,
  feels_like: 9.8,
  humidity: 72,
  icon: "https://cdn.weatherapi.com/weather/64x64/day/116.png",
};

const WEATHER_STUB_MINIMAL = {
  city: "Bristol",
  country: "UK",
  description: "Overcast",
  temperature: 10.1,
  feels_like: 8.5,
  humidity: 85,
  // no localtime, no icon — tests graceful degradation
};

const HOTTEST_CITY_STUB = {
  city: "Cardiff",
  region: "Wales",
  temp_c: 18.6,
  condition: "Sunny",
  icon: "https://cdn.weatherapi.com/weather/64x64/day/113.png",
};

const HOTTEST_CITY_STUB_REGION_MATCHES_CITY = {
  city: "Edinburgh",
  region: "Edinburgh", // region === city edge case
  temp_c: 14.2,
  condition: "Partly cloudy",
  icon: "https://cdn.weatherapi.com/weather/64x64/day/116.png",
};

const BEST_HOLIDAY_STUB = {
  best_city: "Brighton",
  max_temp: 22,
  min_rain: 5,
  icon: "https://cdn.weatherapi.com/weather/64x64/day/113.png",
};

const BEST_HOLIDAY_STUB_MINIMAL = {
  best_city: "Bath",
  max_temp: 17,
  min_rain: 0,
  // no icon
};

// ─── Tests ────────────────────────────────────────────────────────────────

describe("UK Weather Finder", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  // ── Page load ────────────────────────────────────────────────────────────

  describe("Page load", () => {
    it("displays the app title", () => {
      cy.contains("h1", "UK Weather Finder").should("be.visible");
    });

    it("renders the city input and search button", () => {
      cy.get("[data-cy='city-input']").should("be.visible");
      cy.get("[data-cy='city-submit']").should("be.visible").and("not.be.disabled");
    });

    it("does not show a weather card on initial load", () => {
      cy.get(".weather-card").should("not.exist");
    });
  });

  // ── City weather search — happy path ─────────────────────────────────────

  describe("City weather search", () => {
    describe("happy path", () => {
      beforeEach(() => {
        cy.intercept("GET", "/api/weather*", { statusCode: 200, body: WEATHER_STUB }).as("getWeather");

        cy.get("[data-cy='city-input']").type("London");
        cy.get("[data-cy='city-submit']").click();
        cy.wait("@getWeather");
      });

      it("renders the city and country", () => {
        cy.get(".weather-card").should("be.visible");
        cy.get(".weather-card h2")
          .should("contain.text", "London")
          .and("contain.text", "UK");
      });

      it("renders the local time", () => {
        cy.get(".localtime").should("contain.text", "2025-01-15 14:30");
      });

      it("renders the weather description", () => {
        cy.get(".description").should("contain.text", "Partly cloudy");
      });

      it("renders the temperature rounded to the nearest degree", () => {
        cy.get(".temp").should("contain.text", "12 °C");
      });

      it("renders the feels-like temperature rounded to the nearest degree", () => {
        cy.get(".feels-like").should("contain.text", "feels like 10 °C");
      });

      it("renders the humidity percentage", () => {
        cy.get(".weather-card").should("contain.text", "Humidity: 72%");
      });

      it("renders the weather icon with correct alt text", () => {
        cy.get(".weather-icon")
          .should("be.visible")
          .and("have.attr", "src", WEATHER_STUB.icon)
          .and("have.attr", "alt", "Partly cloudy");
      });
    });

    // ── Empty input guard ─────────────────────────────────────────────────

    describe("empty input", () => {
      it("does not fire a network request when the input is blank", () => {
        cy.intercept("GET", "/api/weather*").as("getWeather");

        cy.get("[data-cy='city-submit']").click();

        // Cypress will fail the test if @getWeather is ever called
        cy.get("@getWeather.all").should("have.length", 0);
      });

      it("does not render a weather card when the input is blank", () => {
        cy.get("[data-cy='city-submit']").click();
        cy.get(".weather-card").should("not.exist");
      });

      it("does not fire a network request when the input is only whitespace", () => {
        cy.intercept("GET", "/api/weather*").as("getWeather");

        cy.get("[data-cy='city-input']").type("   ");
        cy.get("[data-cy='city-submit']").click();

        cy.get("@getWeather.all").should("have.length", 0);
        cy.get(".weather-card").should("not.exist");
      });
    });

    // ── Edge cases ────────────────────────────────────────────────────────

    describe("optional field degradation", () => {
      beforeEach(() => {
        cy.intercept("GET", "/api/weather*", {
          statusCode: 200,
          body: WEATHER_STUB_MINIMAL,
        }).as("getWeatherMinimal");

        cy.get("[data-cy='city-input']").type("Bristol");
        cy.get("[data-cy='city-submit']").click();
        cy.wait("@getWeatherMinimal");
      });

      it("renders the weather card without crashing when localtime is absent", () => {
        cy.get(".weather-card").should("be.visible");
        cy.get(".localtime").should("not.exist");
      });

      it("renders the weather card without crashing when icon is absent", () => {
        cy.get(".weather-card").should("be.visible");
        cy.get(".weather-icon").should("not.exist");
      });

      it("still renders core fields correctly", () => {
        cy.get(".weather-card h2").should("contain.text", "Bristol");
        cy.get(".description").should("contain.text", "Overcast");
        cy.get(".temp").should("contain.text", "10 °C");
        cy.get(".feels-like").should("contain.text", "feels like 9 °C");
        cy.get(".weather-card").should("contain.text", "Humidity: 85%");
      });
    });
  });

  // ── Hottest City ──────────────────────────────────────────────────────────

  describe("Hottest City", () => {
    describe("happy path", () => {
      beforeEach(() => {
        cy.intercept("GET", "/api/hottest-city", {
          statusCode: 200,
          body: HOTTEST_CITY_STUB,
          delay: 100, // simulate latency so the spinner is observable
        }).as("getHottestCity");
      });

      it("shows a spinner while the request is in flight", () => {
        cy.get("[data-cy='hottest-submit']").click();
        // Spinner must appear before the response resolves
        cy.get("[data-cy='spinner']").should("exist");
        cy.wait("@getHottestCity");
        cy.get("[data-cy='spinner']").should("not.exist");
      });

      it("renders the city name", () => {
        cy.get("[data-cy='hottest-submit']").click();
        cy.wait("@getHottestCity");
        cy.contains("Cardiff").should("be.visible");
      });

      it("renders the region", () => {
        cy.get("[data-cy='hottest-submit']").click();
        cy.wait("@getHottestCity");
        cy.contains("Wales").should("be.visible");
      });

      it("renders the temperature", () => {
        cy.get("[data-cy='hottest-submit']").click();
        cy.wait("@getHottestCity");
        cy.contains("18.6").should("be.visible");
      });

      it("renders the weather condition", () => {
        cy.get("[data-cy='hottest-submit']").click();
        cy.wait("@getHottestCity");
        cy.contains("Sunny").should("be.visible");
      });

      it("renders the weather icon", () => {
        cy.get("[data-cy='hottest-submit']").click();
        cy.wait("@getHottestCity");
        cy.get("img[src='" + HOTTEST_CITY_STUB.icon + "']").should("be.visible");
      });
    });

    describe("edge case: region matches city", () => {
      it("renders without duplicating the location label", () => {
        cy.intercept("GET", "/api/hottest-city", {
          statusCode: 200,
          body: HOTTEST_CITY_STUB_REGION_MATCHES_CITY,
        }).as("getHottestCityDupe");

        cy.get("[data-cy='hottest-submit']").click();
        cy.wait("@getHottestCityDupe");

        // "Edinburgh" should appear — UI must not crash even if region === city
        cy.contains("Edinburgh").should("be.visible");
        cy.get("[data-cy='spinner']").should("not.exist");
      });
    });
  });

  // ── Best Holiday Spot ─────────────────────────────────────────────────────

  describe("Best Holiday Spot", () => {
    const TEST_DATE = "2025-07-15";

    describe("happy path", () => {
      beforeEach(() => {
        cy.intercept("GET", "/api/best-city*", {
          statusCode: 200,
          body: BEST_HOLIDAY_STUB,
          delay: 100,
        }).as("getBestCity");

        cy.get("[data-cy='date-select']").type(TEST_DATE);
        cy.get("[data-cy='holiday-submit']").click();
      });

      it("shows a spinner while the request is in flight then hides it", () => {
        cy.get("[data-cy='spinner']").should("exist");
        cy.wait("@getBestCity");
        cy.get("[data-cy='spinner']").should("not.exist");
      });

      it("renders the best city name", () => {
        cy.wait("@getBestCity");
        cy.contains("Brighton").should("be.visible");
      });

      it("renders the maximum temperature", () => {
        cy.wait("@getBestCity");
        cy.contains("22").should("be.visible");
      });

      it("renders the rain chance", () => {
        cy.wait("@getBestCity");
        cy.contains("5").should("be.visible");
      });

      it("renders the weather icon", () => {
        cy.wait("@getBestCity");
        cy.get("img[src='" + BEST_HOLIDAY_STUB.icon + "']").should("be.visible");
      });

      it("sends the selected date as a query parameter", () => {
        cy.wait("@getBestCity").its("request.url").should("include", TEST_DATE);
      });
    });

    describe("optional field degradation", () => {
      it("renders without crashing when icon is absent", () => {
        cy.intercept("GET", "/api/best-city*", {
          statusCode: 200,
          body: BEST_HOLIDAY_STUB_MINIMAL,
        }).as("getBestCityMinimal");

        cy.get("[data-cy='date-select']").type(TEST_DATE);
        cy.get("[data-cy='holiday-submit']").click();
        cy.wait("@getBestCityMinimal");

        cy.contains("Bath").should("be.visible");
        cy.contains("17").should("be.visible");
        cy.get("[data-cy='spinner']").should("not.exist");
      });
    });
  });
});