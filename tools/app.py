from flask import Flask, request
from traffic import check_traffic
from weather import getWeather
from notifier import notify_weather, notify_traffic, send_startup_report
from chat_summary import get_summary
import json

app = Flask(__name__)

@app.route("/traffic")
def get_traffic():
    traffic = check_traffic()
    notify_traffic(traffic)
    return {"traffic_index": traffic}

@app.route("/weather")
def get_weather():
    weather = getWeather()
    notify_weather(weather["weather"])
    return weather

@app.route("/summarize", methods=["POST"])
def summarize_chat():
    data = request.get_json()
    # print(json.dump(data, indent=4))
    chatHistory = data["chat_history"]
    summary = get_summary(chatHistory)
    return {"summary": summary}






if __name__ == "__main__":
    send_startup_report()
    app.run(host="0.0.0.0", port=8000)