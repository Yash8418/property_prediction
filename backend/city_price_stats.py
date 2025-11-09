import pandas as pd

df = pd.read_csv("data/india_housing_prices.csv")  # update path if needed!
city_stats = df.groupby(["State", "City"]).agg(
    count=("ID", "count"),
    avg_price_per_sqft=("Price_per_SqFt", "mean"),
    min_price_per_sqft=("Price_per_SqFt", "min"),
    max_price_per_sqft=("Price_per_SqFt", "max"),
).reset_index()

print(city_stats)
# Optional: Save to CSV for use elsewhere
city_stats.to_csv("data/city_price_per_sqft_stats.csv", index=False)
