import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";
const API_BASE = process.env.REACT_APP_API_URL || "https://property-prediction-a9pk.onrender.com";


export default function StatsPanel({ city }) {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    if (city) {
      fetch(`${API_BASE}/stats?city=${encodeURIComponent(city)}`)
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch((err) => console.error("Error fetching stats:", err));
    } else {
      setStats([]);
    }
  }, [city]);

  return (
    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg">
      <h2 className="text-xl font-semibold mb-3">City Price Trend</h2>
      {stats.length > 0 ? (
        <LineChart width={400} height={250} data={stats}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#00e676" />
        </LineChart>
      ) : (
        <p className="text-gray-400">No trend data available.</p>
      )}
    </div>
  );
}
