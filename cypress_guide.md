# Running Cypress Tests — UK Weather Finder

A guide for running the Cypress end-to-end test suite against the locally Dockerised app.

---

## Prerequisites

Before running any tests, make sure these two things are true:

**1. The app is reachable at `localhost:8000`.**
Open your browser and visit [http://localhost:8000](http://localhost:8000). If you see the UK Weather Finder app, you're good to go.

**2. Cypress and `wait-on` are installed.**
These are installed automatically when the project is set up (`npm install`).

---

## Running the Tests

Open your terminal, make sure you're in the project root folder (not inside `cypress/`), and run:

```bash
npx wait-on http://localhost:8000 && npx cypress run --spec "cypress/e2e/weather.cy.js"
```

### What's actually happening here?

Think of this command as two instructions chained together:

- **`npx wait-on http://localhost:8000`** — Before doing anything, this patiently knocks on `localhost:8000` every two seconds, waiting for the app to respond. It won't move on until the app is ready. This prevents the classic "tests failed because the app wasn't up yet" headache.
- **`&&`** — This just means "if the first part succeeded, go ahead and do the second part."
- **`npx cypress run --spec "cypress/e2e/weather.cy.js"`** — This runs only the weather test file, headlessly (no browser window opens — results appear in your terminal).

---

## What the Tests Cover

The test file is organised into four sections (`describe` blocks). Here's what each one checks:

### Page load
Verifies the app lands correctly before any interaction — the "UK Weather Finder" heading is visible, the `[data-cy="city-input"]` text field and `[data-cy="city-submit"]` button are present, and no weather card is shown yet.

### City weather search
- **Happy path** — types "London" into the city input, clicks search, and checks that the weather card renders correctly: city name, country, temperature (rounded), feels-like temperature (rounded), humidity percentage, description text, and the weather icon.
- **Empty input guard** — clicks search with nothing typed and verifies that no network request is fired and no weather card appears. Also checks that a whitespace-only input is correctly treated as empty.
- **Optional field degradation** — simulates an API response missing `localtime` and `icon`, and confirms the app doesn't crash — it just skips those fields gracefully.

### Hottest City
Clicks `[data-cy="hottest-submit"]` and verifies the result shows city name, region, temperature, condition text, and icon. Also checks that a loading spinner appears while the data is fetching and disappears once it arrives. Includes an edge case where `region` and `city` are identical (e.g. "Edinburgh, Edinburgh") to make sure the UI handles that without breaking.

### Best Holiday Spot
Selects a date using `[data-cy="date-select"]`, clicks `[data-cy="holiday-submit"]`, and checks that the best city name, maximum temperature, rain chance, and icon all appear. Verifies spinner behaviour. Also confirms the selected date is correctly sent to the API as part of the request URL. Includes a degradation test for a missing icon.

---

## How the Tests Use Fake Data (No Live API Needed)

The tests never call the real weather API. Instead, every network request is intercepted using `cy.intercept()` and responded to with realistic stub data defined directly in the test file — things like:

```
city: "London", temperature: 12.4, humidity: 72 ...
```

This means tests are fast, reliable, and won't fail because of API downtime, rate limits, or network issues. What's being tested is purely how the UI behaves in response to data — not whether the weather API is having a good day.

---

## Expected Output (Passing Run)

A successful run looks like this in your terminal:

```
  UK Weather Finder
    Page load
      ✓ displays the app title (1166ms)
      ✓ renders the city input and search button (444ms)
      ✓ does not show a weather card on initial load (269ms)
    City weather search
      happy path
        ✓ renders the city and country (1179ms)
        ✓ renders the local time (973ms)
        ✓ renders the weather description (857ms)
        ✓ renders the temperature rounded to the nearest degree (1354ms)
        ✓ renders the feels-like temperature rounded to the nearest degree (930ms)
        ✓ renders the humidity percentage (864ms)
        ✓ renders the weather icon with correct alt text (1024ms)
      empty input
        ✓ does not fire a network request when the input is blank (254ms)
        ✓ does not render a weather card when the input is blank (195ms)
        ✓ does not fire a network request when the input is only whitespace (398ms)
      optional field degradation
        ✓ renders the weather card without crashing when localtime is absent (834ms)
        ✓ renders the weather card without crashing when icon is absent (963ms)
        ✓ still renders core fields correctly (1050ms)
    Hottest City
      happy path
        ✓ shows a spinner while the request is in flight then hides it (525ms)
        ✓ renders the city name (672ms)
        ✓ renders the region (802ms)
        ✓ renders the temperature (869ms)
        ✓ renders the weather condition (674ms)
        ✓ renders the weather icon (776ms)
      edge case: region matches city
        ✓ renders without duplicating the location label (400ms)
    Best Holiday Spot
      happy path
        ✓ shows a spinner while the request is in flight then hides it (1024ms)
        ✓ renders the best city name (943ms)
        ✓ renders the maximum temperature (942ms)
        ✓ renders the rain chance (1120ms)
        ✓ renders the weather icon (1024ms)
        ✓ sends the selected date as a query parameter (878ms)
      optional field degradation
        ✓ renders without crashing when icon is absent (864ms)


  30 passing (29s)


  (Results)

  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ Tests:        30                                                                               │
  │ Passing:      30                                                                               │
  │ Failing:      0                                                                                │
  │ Pending:      0                                                                                │
  │ Skipped:      0                                                                                │
  │ Screenshots:  0                                                                                │
  │ Video:        false                                                                            │
  │ Duration:     28 seconds                                                                       │
  │ Spec Ran:     weather.cy.js                                                                    │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘


====================================================================================================

  (Run Finished)


       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  weather.cy.js                            00:28       30       30        -        -        - │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        00:28       30       30        -        -        -
```

30 tests, 0 failing, and `✔ All specs passed!` at the bottom means everything is working as expected.

---

## Common Failures and Fixes

| What you see | Likely cause | Fix |
|---|---|---|
| `Error: connect ECONNREFUSED localhost:8000` | Docker container isn't running | Run `docker-compose up -d` and try again |
| `wait-on` times out after 60 seconds | App is taking too long to start | Wait a moment and re-run; check Docker logs with `docker logs <container-name>` |
| `Expected to find element: [data-cy="spinner"]` | Spinner component is missing its `data-cy` attribute | Ask a developer to add `data-cy="spinner"` to the Spinner component |
| Tests pass but wrong port | `baseUrl` mismatch in config | Confirm the app is on port `8000` and that `cypress.config.js` has `baseUrl: 'http://localhost:8000'` |
| `Cannot find module 'cypress'` | Dependencies not installed | Run `npm install` from the project root |