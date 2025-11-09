import React, { useEffect, useState } from "react";
import axios from "axios";

export default function LocationSelector({ onSelect }) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    axios
      .get(API_BASE + "/states")
      .then((res) => setStates(res.data.states))
      .catch(() => setStates([]));
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
      });
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
        <select value={state} onChange={(e) => onStateChange(e.target.value)}>
          <option value="">Select state</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>City</label>
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={!state}
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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
