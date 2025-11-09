# debug_predict.py
import joblib, pandas as pd, numpy as np
MODEL = "model.pkl"
DATA = "data/india_housing_prices.csv"

print("Loading model:", MODEL)
model = joblib.load(MODEL)
print("Model loaded:", type(model))

# sample input (the one you tried)
sample = {
  "State": "Gujarat",
  "City": "Ahmedabad",
  "Size_in_SqFt": 500.0,
  "BHK": 2,
  "Age_of_Property": 10,
  "furnished": 0
}
df_sample = pd.DataFrame([sample])
print("\nSAMPLE DF\n", df_sample)

# Predict
pred = model.predict(df_sample)
print("\nraw model.predict(...) output:", pred, "shape:", np.shape(pred))

# Show dataset price per sqft distribution
df = pd.read_csv(DATA)
df = df.dropna(subset=["Price_in_Lakhs","Size_in_SqFt"])
df["price_rupees"] = df["Price_in_Lakhs"] * 100000
df["price_per_sqft"] = df["price_rupees"] / df["Size_in_SqFt"]

print("\nGLOBAL price_per_sqft stats:\n", df["price_per_sqft"].describe().round(2))
city = "ahmedabad"
city_df = df[df["City"].str.strip().str.lower() == city]
print(f"\n{city} stats (count={len(city_df)}):\n", city_df["price_per_sqft"].describe().round(2))
