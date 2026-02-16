import React, { useState } from "react";
import Spinner from "./Spinner";

function BestHolidaySpot() {
  const [date, setDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBestCity = async (event) => {
    event.preventDefault();

    if (!date) {
      return; // no date chosen, do nothing
    }

    setLoading(true);
    setData(null); // clear old result

    try {
      const res = await fetch(`/api/best-city?date=${date}`);
      const result = await res.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="best-holiday-card">
      <h2 className="card-title">Best UK Holiday Spot</h2>

      <form className="best-holiday-form" onSubmit={fetchBestCity}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="date-input"
        />
        <button type="submit" className="search-button">
          Find
        </button>
      </form>

      {loading && <Spinner />}

      {!loading && data && (
        <div className="best-holiday-result">
          <h3>{data.best_city}</h3>
          <p>Max temp: {data.max_temp} °C</p>
          <p>Chance of rain: {data.min_rain}%</p>
          <img src={data.icon} alt="icon" />
        </div>
      )}
    </div>
  );
}

export default BestHolidaySpot;
