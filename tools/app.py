import time
import threading
from flask import Flask
from traffic import check_traffic
from weather import getWeather
from notifier import notify_weather, notify_traffic, send_startup_report, notify_crime_summary

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

def daily_crime_job():
    """
    Background thread that sends a crime digest every day at 8:00 AM.
    On first run, waits until the next 8:00 AM before firing.
    """
    while True:
        now = datetime.now()

        # Calculate seconds until next 8:00 AM
        next_run = now.replace(hour=8, minute=0, second=0, microsecond=0)
        if now >= next_run:
            # Already past 8am today, schedule for tomorrow
            next_run = next_run.replace(day=now.day + 1)

        wait_seconds = (next_run - now).total_seconds()
        print(f"Crime digest scheduled in {wait_seconds/3600:.1f} hours at {next_run.strftime('%Y-%m-%d %H:%M:%S')}")

        time.sleep(wait_seconds)
        notify_crime_summary()
        

@app.route('/health')
def health():
    return {"status": "ok"}, 200
  
  
  
  

if __name__ == "__main__":
    from datetime import datetime

    send_startup_report()

    # Start the daily crime digest background thread
    crime_thread = threading.Thread(target=daily_crime_job, daemon=True)
    crime_thread.start()

    app.run(host="0.0.0.0", port=8000)