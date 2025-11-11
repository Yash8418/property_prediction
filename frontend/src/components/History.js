import React, { useState, useEffect } from "react";

// const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
  const API_BASE = process.env.REACT_APP_API_URL || "https://property-prediction-a9pk.onrender.com";


export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/history`)
      .then((res) => res.json())
      .then((data) => setHistory(data.history || []))
      .catch((err) => console.error("Error fetching history:", err));
  }, []);

  return (
    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg">
      <h2 className="text-xl font-semibold mb-3">Prediction History</h2>
      {history.length > 0 ? (
        <ul className="space-y-2">
          {history.map((item) => (
            <li
              key={item.id}
              className="bg-gray-800 p-2 rounded-lg flex justify-between"
            >
              <span>
                {item.city || item.state} - {item.bedrooms} BHK
              </span>
              <span className="text-green-400">
                ₹{item.predicted_price.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No predictions yet.</p>
      )}
    </div>
  );
}
