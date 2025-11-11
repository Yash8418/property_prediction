import React, { useEffect, useState } from "react";
import axios from "axios";

export default function LocationSelector({ onSelect }) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || "https://property-prediction-a9pk.onrender.com";

  useEffect(() => {
    setLoadingStates(true);
    axios
      .get(API_BASE + "/states")
      .then((res) => setStates(res.data.states))
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, [API_BASE]);

  const onStateChange = (s) => {
    setState(s);
    setCity("");
    setArea("");
    if (!s) {
      setCities([]);
      onSelect && onSelect({ state: "", city: "", area: "" });
      return;
    }
    setLoadingCities(true);
    axios
      .get(`${API_BASE}/cities?state=${encodeURIComponent(s)}`)
      .then((res) => {
        const c = res.data.cities;
        setCities(c.length ? c : ["unknown"]);
        onSelect &&
          onSelect({ state: s, city: c.length ? c[0] : "unknown", area });
      })
      .catch(() => {
        setCities(["unknown"]);
        onSelect && onSelect({ state: s, city: "unknown", area });
      })
      .finally(() => setLoadingCities(false));
  };

  const onCityChange = (c) => {
    setCity(c);
    setArea("");
    onSelect && onSelect({ state, city: c, area });
  };
  const onAreaChange = (a) => {
    setArea(a);
    onSelect && onSelect({ state, city, area: a });
  };

  return (
    <div>
      <div className="form-row">
        <label>State</label>
        <select
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          disabled={loadingStates}
        >
          <option value="">Select state</option>
          {loadingStates ? (
            <option value="" disabled>
              <span className="loading">Loading...</span>
            </option>
          ) : (
            states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="form-row">
        <label>City</label>
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={!state || loadingCities}
        >
          <option value="">Select city</option>
          {loadingCities ? (
            <option value="" disabled>
              <span className="loading">Loading...</span>
            </option>
          ) : (
            cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))
          )}
        </select>
      </div>
      <div className="form-row">
        <label>Area (optional)</label>
        <input
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          placeholder="e.g Downtown"
        />
      </div>
    </div>
  );
}
