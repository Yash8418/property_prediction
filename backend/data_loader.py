import pandas as pd

# Load your real dataset
DATA_PATH = "backend/data/india_housing_prices.csv"
df = pd.read_csv(DATA_PATH)

# Normalize city names
df["City"] = df["City"].str.strip().str.lower()
available_cities = df["City"].unique()

def get_city_data(city_name):
    city_name = city_name.strip().lower()
    if city_name not in available_cities:
        return {
            "status": "unavailable",
            "message": f"Still working in your city ({city_name.title()})...",
        }
    else:
        city_data = df[df["City"] == city_name]
        return {
            "status": "available",
            "count": len(city_data),
            "data": city_data.to_dict(orient="records"),
        }

if __name__ == "__main__":
    # Test
    city = input("Enter city name: ")
    print(get_city_data(city))
