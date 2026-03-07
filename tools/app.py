from flask import Flask
from traffic import check_traffic
from weather import getWeather
from notifier import notify_weather, notify_traffic, send_startup_report

app = Flask(__name__)

@app.route("/traffic")
def getTraffic():
    traffic = check_traffic()
    notify_traffic(traffic)
    return {"traffic_index": traffic}

@app.route("/weather")
def get_weather():
    weather = getWeather()
    notify_weather(weather["weather"])
    return weather

if __name__ == "__main__":
    send_startup_report()
    app.run(host="0.0.0.0", port=8000)