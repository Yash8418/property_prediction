import os
import joblib
import sqlite3
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from fastapi.responses import JSONResponse

app = FastAPI(title="India Real Estate Price Predictor")

MODEL_PATH = "model.pkl"
DATA_PATH = os.path.join("data", "india_housing_prices.csv")
DB_PATH = "predictions.db"
ANNUAL_APPRECIATION_RATE = 0.07  # 7% yearly growth assumption

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- DATABASE --------------------
def init_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            state TEXT,
            city TEXT,
            bedrooms INTEGER,
            age_of_property REAL,
            furnished BOOLEAN,
            area_sqft REAL,
            median_income REAL,
            predicted_price REAL,
            predicted_price_per_sqft REAL,
            years_ahead INTEGER
        )
    """)
    conn.commit()
    return conn

DB = init_db()

# -------------------- MODEL --------------------
def get_model():
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=500, detail="Model not found. Train model first.")
    return joblib.load(MODEL_PATH)


# ✅ Centralized prediction logic (Updated to use CSV data)
def make_prediction(req):
    city_data_path = os.path.join("data", "city_price_per_sqft_stats.csv")

    if not os.path.exists(city_data_path):
        raise HTTPException(status_code=500, detail="City price data not found")

    df_prices = pd.read_csv(city_data_path)

    # Match state and city (case-insensitive)
    match = df_prices[
        (df_prices["State"].str.lower() == req.state.strip().lower()) &
        (df_prices["City"].str.lower() == req.city.strip().lower())
    ]

    if match.empty:
        raise HTTPException(status_code=404, detail=f"No data for city '{req.city}' in state '{req.state}'")

    # Get average price per sqft (in lakhs → convert to INR)
    avg_price_per_sqft_lakhs = float(match.iloc[0]["avg_price_per_sqft"])
    avg_price_per_sqft_inr = avg_price_per_sqft_lakhs * 100000

    # Compute total price
    total_price_inr = avg_price_per_sqft_inr * req.area_sqft

    return total_price_inr, avg_price_per_sqft_inr

# -------------------- API ROUTES --------------------
@app.get("/states")
def states():
    if not os.path.exists(DATA_PATH):
        return JSONResponse(status_code=404, content={"error": "Data not found"})
    df = pd.read_csv(DATA_PATH)
    return {"states": sorted(df["State"].dropna().unique().tolist())}


@app.get("/cities")
def cities(state: str):
    if not os.path.exists(DATA_PATH):
        return JSONResponse(status_code=404, content={"error": "Data not found"})
    df = pd.read_csv(DATA_PATH)
    cities_list = df[df["State"].str.lower() == state.lower()]["City"].dropna().unique().tolist()
    cities_list = sorted(cities_list)
    if not cities_list:
        return {"message": f"🏗️ Still working on adding real data for cities in {state}!"}
    return {"cities": cities_list}


# -------------------- REQUEST MODELS --------------------
class PropertyRequest(BaseModel):
    state: str
    city: str = None
    area_sqft: float
    bhk: int
    age_of_property: float
    furnished: bool
    median_income: float


class ForecastRequest(BaseModel):
    property: PropertyRequest
    years_ahead: int = 0


# -------------------- ENDPOINTS --------------------
@app.post("/predict")
def predict(req: PropertyRequest):
    city_data_path = os.path.join("data", "city_price_per_sqft_stats.csv")

    # ✅ Check for city data file
    if not os.path.exists(city_data_path):
        return JSONResponse(status_code=404, content={"error": "Data not found"})

    df_prices = pd.read_csv(city_data_path)
    available_cities = df_prices["City"].str.strip().str.lower().unique().tolist()

    # ✅ Validate city availability
    if req.city and req.city.strip().lower() not in available_cities:
        return JSONResponse(
            status_code=200,
            content={"message": f"🏗️ Still working on adding data for {req.city}!"}
        )

    # ✅ Make base prediction safely
    try:
        total_price_now, price_per_sqft_now = make_prediction(req)
    except Exception as e:
        print("Prediction error:", e)
        return JSONResponse(status_code=500, content={"error": "Prediction failed."})

    # ✅ Furnishing adjustment (works for both bool & string)
    furnished_factor = 1.0
    furnished_text = str(req.furnished or "").strip().lower()

    if "fully" in furnished_text or furnished_text == "true":
        furnished_factor = 1.10   # +10%
    elif "semi" in furnished_text:
        furnished_factor = 1.05   # +5%
    elif "unfurnished" in furnished_text or furnished_text == "false":
        furnished_factor = 0.95   # -5%

    total_price_now *= furnished_factor
    price_per_sqft_now *= furnished_factor

    # ✅ Save prediction in DB
    try:
        cur = DB.cursor()
        cur.execute("""
            INSERT INTO predictions (
                timestamp, state, city, bedrooms, age_of_property, furnished,
                area_sqft, median_income, predicted_price, predicted_price_per_sqft, years_ahead
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (
            time.strftime("%Y-%m-%d %H:%M:%S"),
            req.state,
            req.city or "unknown",
            req.bhk,
            req.age_of_property,
            furnished_text or "unknown",
            req.area_sqft,
            req.median_income,
            round(float(total_price_now), 2),
            round(float(price_per_sqft_now), 2),
            0
        ))
        DB.commit()
    except Exception as e:
        print("DB save failed:", e)

    # ✅ Return final results
    return {
        "predicted_price": round(float(total_price_now), 2),
        "price_per_sqft": round(float(price_per_sqft_now), 2),
        "furnished_factor": furnished_factor
    }


@app.post("/predict_future")
def predict_future(req: ForecastRequest):
    city_data_path = os.path.join("data", "city_price_per_sqft_stats.csv")

    if not os.path.exists(city_data_path):
        return JSONResponse(status_code=404, content={"error": "City price data not found"})

    df_prices = pd.read_csv(city_data_path)
    available_cities = df_prices["City"].str.strip().str.lower().unique().tolist()

    prop = req.property
    years_ahead = req.years_ahead or 0

    # ✅ Check if city exists in database
    if prop.city and prop.city.strip().lower() not in available_cities:
        return JSONResponse(
            status_code=200,
            content={"message": f"🏗️ Still working on adding data for {prop.city}!"}
        )

    # ✅ Base prediction safely
    try:
        total_price_now, price_per_sqft_now = make_prediction(prop)
    except Exception as e:
        print("Prediction error:", e)
        return JSONResponse(
            status_code=500,
            content={"error": "Prediction model failed. Please check your input values."}
        )

    # ✅ Furnishing adjustment
    furnished_factor = 1.0
    furnished_text = str(prop.furnished or req.furnished or "").strip().lower()

    if "fully" in furnished_text or furnished_text == "true":
        furnished_factor = 1.10   # +10%
    elif "semi" in furnished_text:
        furnished_factor = 1.05   # +5%
    elif "unfurnished" in furnished_text or furnished_text == "false":
        furnished_factor = 0.95   # -5%

    total_price_now *= furnished_factor
    price_per_sqft_now *= furnished_factor

    # ✅ Apply yearly growth for the future
    growth_rate = ANNUAL_APPRECIATION_RATE
    future_price = total_price_now * ((1 + growth_rate) ** years_ahead)
    future_price_per_sqft = price_per_sqft_now * ((1 + growth_rate) ** years_ahead)

    # ✅ Save to database (safe execution)
    try:
        cur = DB.cursor()
        cur.execute("""
            INSERT INTO predictions (
                timestamp, state, city, bedrooms, age_of_property, furnished,
                area_sqft, median_income, predicted_price, predicted_price_per_sqft, years_ahead
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (
            time.strftime("%Y-%m-%d %H:%M:%S"),
            prop.state,
            prop.city or "unknown",
            prop.bhk,
            prop.age_of_property,
            furnished_text or "unknown",
            prop.area_sqft,
            prop.median_income,
            round(float(future_price), 2),
            round(float(future_price_per_sqft), 2),
            years_ahead
        ))
        DB.commit()
    except Exception as e:
        print("DB save failed:", e)

    # ✅ Return clean JSON result
    return {
        "predicted_price": round(float(future_price), 2),
        "price_per_sqft": round(float(future_price_per_sqft), 2),
        "furnished_factor": furnished_factor,
        "years_ahead": years_ahead
    }



@app.get("/history")
def history(limit: int = 50):
    cur = DB.cursor()
    cur.execute("""
        SELECT id, timestamp, state, city, bedrooms, age_of_property, furnished,
               area_sqft, median_income, predicted_price, predicted_price_per_sqft, years_ahead
        FROM predictions ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = cur.fetchall()
    cols = ["id", "timestamp", "state", "city", "bedrooms", "age_of_property",
            "furnished", "area_sqft", "median_income", "predicted_price", "predicted_price_per_sqft",
            "years_ahead"]
    return {"history": [dict(zip(cols, row)) for row in rows]}
