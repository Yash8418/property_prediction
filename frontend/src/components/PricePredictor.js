import React, { useState } from "react";
import axios from "axios";
import LocationSelector from "./LocationSelector";
import MapView from "./MapView";
import "./Tooltip.css"; // ✅ new small CSS file for tooltip styles

export default function PricePredictor() {
  const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

  const [loc, setLoc] = useState({});
  const [form, setForm] = useState({
    area_sqft: "",
    bedrooms: "",
    age_of_property: "",
    // ready_to_move: false,
    furnished: false,
    median_income: "",
  });
  const [forecastYears, setForecastYears] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const onLocSelect = (location) => {
    setLoc(location);
    setResult(null);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const doPredict = async () => {
    setLoading(true);
    setResult(null);
    try {
      const medianIncomeNum = parseFloat(form.median_income);

      const payload = {
        state: loc.state || "",
        city: loc.city || "",
        area_sqft: parseFloat(form.area_sqft) || 0,
        bhk: parseInt(form.bedrooms) || 0,
        age_of_property: parseInt(form.age_of_property) || 0,
        // ready_to_move: form.ready_to_move,
        furnished: form.furnished,
        median_income: medianIncomeNum,
      };

      const endpoint = forecastYears > 0 ? "/predict_future" : "/predict";
      const postData =
        forecastYears > 0
          ? { property: payload, years_ahead: forecastYears }
          : payload;

      const res = await axios.post(API_BASE + endpoint, postData);

      if (res.data.message) {
        alert(res.data.message);
        setResult(null);
      } else {
        setResult({
          predicted_price: res.data.predicted_price,
          price_per_sqft: res.data.price_per_sqft,
        });
      }
    } catch (err) {
      alert(
        "Error contacting backend: " +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const InfoIcon = ({ text }) => (
    <span className="info-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="15"
        fill="currentColor"
        className="bi bi-info-square"
        viewBox="0 0 16 16"
      >
        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
      </svg>
      <span className="tooltip-text">{text}</span>
    </span>
  );

  return (
    <div>
      <h3>India Real Estate Price Predictor & Forecast</h3>
      <LocationSelector onSelect={onLocSelect} />

      <div className="form-grid">
        <div className="form-row">
          <label>
            Area (sq ft) <InfoIcon text="Total carpet/built-up area in square feet." />
          </label>
          <input
            name="area_sqft"
            value={form.area_sqft}
            onChange={onChange}
            placeholder="e.g., 1200"
          />
        </div>
        <div className="form-row">
          <label>
            Bedrooms (BHK) <InfoIcon text="Number of bedrooms (BHK)." />
          </label>
          <input
            name="bedrooms"
            value={form.bedrooms}
            onChange={onChange}
            placeholder="e.g., 3"
          />
        </div>

        <div className="form-row">
          <label>
            Age of Property (years){" "}
            <InfoIcon text="How old the property is in years." />
          </label>
          <input
            name="age_of_property"
            value={form.age_of_property}
            onChange={onChange}
            placeholder="e.g., 10"
          />
        </div>
        {/* <div className="form-row">
          <label>
            Ready to Move? <InfoIcon text="Check if the property is ready for possession." />
          </label>
          <input
            type="checkbox"
            name="ready_to_move"
            checked={form.ready_to_move}
            onChange={onChange}
          />
        </div> */}

        <div className="form-row">
          <label>
            Furnished? <InfoIcon text="Check if the property is fully or semi-furnished." />
          </label>
          <input
            type="checkbox"
            name="furnished"
            checked={form.furnished}
            onChange={onChange}
          />
        </div>
        <div className="form-row">
          <label>
            Median Income (in lakhs INR){" "}
            <InfoIcon text="Average family annual income in lakhs." />
          </label>
          <input
            name="median_income"
            value={form.median_income}
            onChange={onChange}
            placeholder="e.g., 8.5"
          />
        </div>

        <div className="form-row full">
          <label>
            Forecast Years{" "}
            <InfoIcon text="Choose how many years ahead you want to predict." />
          </label>
          <select
            value={forecastYears}
            onChange={(e) => setForecastYears(parseInt(e.target.value))}
          >
            {[...Array(11).keys()].map((year) => (
              <option key={year} value={year}>
                {year === 0 ? "Current Price" : `+${year} Years`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button className="btn" onClick={doPredict} disabled={loading}>
        {loading ? "Working..." : "Predict & Forecast"}
      </button>

      {result && (
        <div className="result mt-4">
          <div>
            <strong>Predicted Total Price (INR): </strong>
            {formatCurrency(result.predicted_price)}
          </div>
          <div>
            <strong>Predicted Price per Sq Ft (INR): </strong>
            {formatCurrency(result.price_per_sqft)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <MapView lat={loc.latitude} lon={loc.longitude} />
      </div>
    </div>
  );
}
