import React, { useState } from "react";
import "./App.css";
import HottestCity from "./components/HottestCity";
import BestHolidaySpot from "./components/BestHolidaySpot";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!city.trim()) {
      return;
    }

    const response = await fetch(`/api/weather?city=${city}`);
    const data = await response.json();

    setWeather(data);
  };

  return (
    <div className="app">
      <h1 className="title">UK Weather Finder</h1>

      {/* Search form */}
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a UK city, e.g. London"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
      </form>

      {/* Weather result (only show when we have data) */}
      {weather && (
        <div className="weather-card">
          <h2>
            {weather.city}, {weather.country}
          </h2>

          {weather.localtime && (
            <p className="localtime">Local time: {weather.localtime}</p>
          )}

          <p className="description">{weather.description}</p>

          <p className="temp">
            {Math.round(weather.temperature)} °C
            <span className="feels-like">
              {" "}
              (feels like {Math.round(weather.feels_like)} °C)
            </span>
          </p>

          <p>Humidity: {weather.humidity}%</p>

          {weather.icon && (
            <img
              src={weather.icon}
              alt={weather.description}
              className="weather-icon"
            />
          )}
        </div>
      )}

      {/* Bottom row: hottest city (left) + best holiday spot (right) */}
      <div className="bottom-row">
        <HottestCity />
        <BestHolidaySpot />
      </div>
    </div>
  );
}

export default App;
