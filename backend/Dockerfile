# Use official Python image
FROM python:3.11-slim

WORKDIR /app

# copy files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# create folder for data
RUN mkdir -p data

# Train model at build time (optional) — comment out if you want to train on first run
RUN python train_model.py || true

# Expose port
EXPOSE 8000

# Run uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
