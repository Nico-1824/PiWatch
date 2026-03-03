import requests
import dotenv
import os
import json

# This tool is going to get the weather in San Diego every hour and print to console.
# We will hardocde the San Diego lon and lat for now and add dynamic location later.
# First we must get the API key from the .env file, all the API, and then parse the data.

dotenv.load_dotenv()

def getWeather():
    OPEN_WEATHER_API = os.getenv("OPEN_WEATHER_API_KEY")
    lat = 32.7157
    lon = -117.1611

    try:
        response = requests.get(f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPEN_WEATHER_API}", auth=('user', 'pass'))
        data = response.json()
        weather, temp = data["weather"][0]["main"], data["main"]["temp"]
        return {"weather":weather, "temp": int((temp - 273.15) * (9/5) + 32)}
    except Exception as e:
        print(f"Error getting weather: {e}")
        return {"weather": "Unavailable look outside", "temp": "Unavailable put your finger out the window"}

if __name__ == "__main__":
    print(getWeather())