import os
import requests
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

# for current weather

city = "New York"

url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={city}"

response = requests.get(url)
data = response.json()

print("City:", data["location"]["name"])
print("Temperature (C):", data["current"]["temp_c"])
print("Condition:", data["current"]["condition"]["text"])

# for forecast

city = "New York"
date = "2025-11-20"  # format: YYYY-MM-DD

# Fetch forecast for the specific date
url = f"http://api.weatherapi.com/v1/forecast.json?key={WEATHER_API_KEY}&q={city}&dt={date}"
response = requests.get(url)
data = response.json()

# Access forecast for the given date
forecast = data["forecast"]["forecastday"][0]["day"]

print("City:", data["location"]["name"])
print("Date:", date)
print("Max Temperature (C):", forecast["maxtemp_c"])
print("Chance of Rain (%):", forecast["daily_chance_of_rain"])
print("Condition:", forecast["condition"]["text"])