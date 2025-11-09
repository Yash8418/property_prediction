// frontend/src/App.js
import React from "react";
import "./index.css";
import PricePredictor from "./components/PricePredictor";
import StatsPanel from "./components/StatsPanel";
import History from "./components/History";

function App() {
  return (
    <div className="app">
      <div className="header">
        <div>
          <div className="title">Real Estate Price & Investment Advisor</div>
          <div className="subtitle">
            Predict prices, get investment advice, and visualize trends
          </div>
        </div>
      </div>

      <div className="grid">
        <div>
          <div className="card">
            <PricePredictor />
          </div>
          <div style={{ height: 18 }} />
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Investment Tips</h3>
            <p className="small-muted">
              This demo estimates affordability and rental ROI using simple heuristics. Not financial advice.
            </p>
          </div>
        </div>
        <div>
          <div className="card">
            <StatsPanel />
          </div>
          <div style={{ height: 12 }} />
          <div className="card">
            <History />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
