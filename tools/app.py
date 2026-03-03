from flask import Flask
from traffic import check_traffic
from weather import getWeather

app = Flask(__name__)

@app.route("/traffic")
def getTraffic():
    traffic = check_traffic()
    return {"traffic_index": traffic}

@app.route("/weather")
def get_weathre():
    weather = getWeather()
    return weather


app.run(host="0.0.0.0", port= 8000)