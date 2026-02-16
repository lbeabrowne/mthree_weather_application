import React, { useState } from "react";
import Spinner from "./Spinner";

function HottestCity() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHottestCity = async () => {
    setLoading(true);
    setData(null); // Clear old result during load

    try {
      const res = await fetch("/api/hottest-city");
      const result = await res.json();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hottest-card">
      <h2 className="hottest-title">Hottest UK City Right Now</h2>

      <button onClick={fetchHottestCity} className="search-button">
        Find Hottest City
      </button>

      {/* Spinner appears ONLY while loading */}
      {loading && <Spinner />}

      {/* Show result once loading is done */}
      {!loading && data && (
        <div className="hottest-result">
          <h3>
            {data.city}
            {data.region && data.region !== data.city ? `, ${data.region}` : ""}
          </h3>
          <p>Temperature: {data.temp_c} °C</p>
          <p>Condition: {data.condition}</p>
          <img src={data.icon} alt="icon" />
        </div>
      )}
    </div>
  );
}

export default HottestCity;
