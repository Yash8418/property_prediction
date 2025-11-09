import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor

# ---------------- PATHS ----------------
DATA_PATH = os.path.join("data", "india_housing_prices.csv")
MODEL_PATH = "model.pkl"


# ---------------- LOAD DATA ----------------
def load_data():
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=["State", "City", "Size_in_SqFt", "BHK", "Price_in_Lakhs"])
    df["City"] = df["City"].fillna("unknown")
    return df


# ---------------- FEATURE ENGINEERING ----------------
def prepare_features(df):
    df = df.copy()

    # Clean text-based features
    df["Furnished_Status"] = df["Furnished_Status"].fillna("unfurnished").str.strip().str.lower()

    # Encode furnished flag
    df["furnished"] = df["Furnished_Status"].apply(lambda x: 1 if "furnished" in x else 0)

    # 👉 Bias correction: small price lift for furnished homes
    # (Because dataset might show inverse correlation)
       # Calculate Price per SqFt as target
    df["Price_per_SqFt"] = (df["Price_in_Lakhs"] * 100000) / df["Size_in_SqFt"]

    X = df[["State", "City", "Size_in_SqFt", "BHK", "Age_of_Property", "furnished"]]
    y = df["Price_per_SqFt"]  # target = price per square foot

    return X, y



# ---------------- TRAIN MODEL ----------------
def train_and_save():
    df = load_data()
    X, y = prepare_features(df)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    cat_features = ["State", "City"]
    num_features = ["Size_in_SqFt", "BHK", "Age_of_Property", "furnished"]

    preprocessor = ColumnTransformer(transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat_features),
        ("num", StandardScaler(), num_features)
    ])

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("xgb", XGBRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        ))
    ])

    print("🔹 Training model...")
    pipeline.fit(X_train, y_train)
    print("✅ Training complete!")
    print("📈 Test R² score:", round(pipeline.score(X_test, y_test), 3))

    joblib.dump(pipeline, MODEL_PATH)
    print(f"💾 Model saved at {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save()
