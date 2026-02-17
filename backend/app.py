import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles


# Load environment variables from backend/.env
load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
WEATHER_BASE_URL = "http://api.weatherapi.com/v1/current.json"

app = FastAPI(
    title="UK Weather Backend",
    description="Happy-path backend for the UK Weather Finder React app.",
    version="1.0.0",
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add frontend deployment URL here if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_weather_emoji(weather_code):

    if weather_code == 1000:  # Sunny/Clear
        return "☀"
    elif weather_code in [1003, 1006, 1009]:  # Cloudy
        return "☁"
    elif weather_code in [1030, 1135, 1147]:  # Mist/Fog
        return "🌫"
    elif weather_code in [1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246]:  # Rain
        return "🌧"
    elif weather_code in [1066, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258]:  # Snow
        return "❄"
    elif weather_code in [1087, 1273, 1276, 1279, 1282]:  # Thunder
        return "⛈"
    elif weather_code in [1114, 1117, 1204, 1207, 1237, 1249, 1252, 1261, 1264]:  # Sleet/Ice
        return "🧊"
    else:
        return "🌤"


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/weather")
def get_weather(city, uid = "anonymous"):


    params = {
        "key": WEATHER_API_KEY,
        "q": city,
        "aqi": "no",
    }

    response = requests.get(WEATHER_BASE_URL, params=params, timeout=5)
    
    data = response.json()

    location = data["location"]
    current = data["current"]
    condition = current["condition"]

    temp_c = current["temp_c"]
    feelslike_c = current["feelslike_c"]
    humidity = current["humidity"]
    description = condition["text"]
    code = condition["code"]
    icon_raw = condition["icon"]

    # Fix icon URL (WeatherAPI returns paths starting with //)
    icon_url = "https:" + icon_raw if icon_raw.startswith("//") else icon_raw

    emoji = get_weather_emoji(code)

    result = {
        "city": location["name"],
        "country": location["country"],
        "localtime": location["localtime"],
        "temperature": temp_c,             
        "feels_like": feelslike_c,     
        "humidity": humidity,
        "description": description,
        "icon": icon_url,
        "code": code,
        "emoji": emoji,
    }

    return result

uk_cities = [
    "Bath", "Birmingham", "Bradford", "Brighton & Hove", "Bristol", "Cambridge",
    "Canterbury", "Carlisle", "Chelmsford", "Chester", "Chichester", "Colchester",
    "Coventry", "Derby", "Doncaster", "Durham", "Ely", "Exeter", "Gloucester",
    "Hereford", "Kingston upon Hull", "Lancaster", "Leeds", "Leicester", "Lichfield",
    "Lincoln", "Liverpool", "London", "Manchester", "Milton Keynes", "Newcastle upon Tyne",
    "Norwich", "Nottingham", "Oxford", "Peterborough", "Plymouth", "Portsmouth",
    "Preston", "Ripon", "Salford", "Salisbury", "Sheffield", "Southampton",
    "Southend-on-Sea", "St Albans", "Stoke on Trent", "Sunderland", "Truro",
    "Wakefield", "Wells", "Westminster", "Winchester", "Wolverhampton", "Worcester",
    "York", "Armagh", "Bangor, Northern Ireland", "Belfast", "Lisburn", "Londonderry",
    "Newry", "Aberdeen", "Dundee", "Dunfermline", "Edinburgh", "Glasgow", "Inverness",
    "Perth", "Stirling", "Bangor, Wales", "Cardiff", "Newport, Wales", "St Asaph",
    "St Davids", "Swansea", "Wrexham"
]

def find_best_city(date: str):
    max_temp = -100
    min_rain = 100
    best_city = ""

    for city in uk_cities:
        try:
            url = "http://api.weatherapi.com/v1/forecast.json"
            params = {
                "key": WEATHER_API_KEY,
                "q": city,
                "dt": date,
            }
            response = requests.get(url, params=params, timeout=5)
            data = response.json()

            if "forecast" in data and data["location"]["country"] == "United Kingdom":
                forecast_day = data["forecast"]["forecastday"][0]["day"]
                temp = forecast_day["maxtemp_c"]
                rain = forecast_day["daily_chance_of_rain"]

                if temp > max_temp and rain < min_rain:
                    max_temp = temp
                    min_rain = rain
                    region = data["location"]["region"] or ""
                    best_city = (
                        f"{data['location']['name']}, {region}"
                        if region
                        else data["location"]["name"]
                    )
        except Exception as e:
            print(f"Skipping {city} due to error: {e}")

    return {
        "date": date,
        "max_temp": max_temp,
        "min_rain": min_rain,
        "best_city": best_city,
        "icon": forecast_day["condition"]["icon"]
    }


@app.get("/api/best-city")
def best_city_endpoint(date: str):
    if not date:
        raise HTTPException(
            status_code=400,
            detail="Query parameter 'date' is required, e.g. /api/best-city?date=2025-11-21",
        )

    result = find_best_city(date)

    if not result["best_city"]:
        raise HTTPException(status_code=404, detail="No suitable city found")

    return result


@app.get("/api/hottest-city")
def get_hottest_uk_city():
    max_temp = -100
    hottest_city = None

    for city in uk_cities:
        try:
            params = {
                "key": WEATHER_API_KEY, 
                "q": city, 
                "aqi": "no"
            }
            
            response = requests.get(WEATHER_BASE_URL, params=params, timeout=5)
            data = response.json()

            if "current" in data and data["location"]["country"] == "United Kingdom":
                temp = data["current"]["temp_c"]
                if temp > max_temp:
                    max_temp = temp
                    hottest_city = {
                        "city": data["location"]["name"],
                        "region": data["location"]["region"],
                        "country": data["location"]["country"],
                        "temp_c": temp,
                        "localtime": data["location"]["localtime"],
                        "condition": data["current"]["condition"]["text"],
                        "icon": data["current"]["condition"]["icon"]
                    }
        except Exception as e:
            print(f"Skipping {city} due to error: {e}")

    return hottest_city

app.mount("/", StaticFiles(directory="static", html=True), name="static")

# NOTE FOR YOUR GROUP:
# Run locally:
#   1. Activate venv
#   2. cd backend
#   3. pip install -r requirements.txt   (first time)
#   4. Create backend/.env with WEATHER_API_KEY=your_real_key_here
#   5. uvicorn app:app --reload
#   6. cd frontend
#   7. npm install
#   8. npm start -> can then view frontend in browser
#
# Test:
#   - http://127.0.0.1:8000/api/health
#   - http://127.0.0.1:8000/api/weather?city=London
#
# The React frontend calls:
#   http://127.0.0.1:8000/api/weather?city=<cityname>
