from flask import Flask
from traffic import check_traffic
from weather import getWeather

app = Flask(__name__)

@app.route("/traffic")
def get_traffic():
    traffic = check_traffic()
    return {"traffic_index": traffic}

@app.route("/weather")
def get_weather():
    weather = getWeather()
    return weather


app.run(host="0.0.0.0", port= 8000)