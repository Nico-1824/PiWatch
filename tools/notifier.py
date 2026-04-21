import smtplib
import os
import dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

dotenv.load_dotenv()

# Cooldown tracking - prevents spamming emails
last_sent = {
    "weather": None,
    "traffic": None
}
COOLDOWN_HOURS = 2

def _can_send(alert_type):
    """Check if enough time has passed since the last alert of this type."""
    last = last_sent[alert_type]
    if last is None:
        return True
    return datetime.now() - last > timedelta(hours=COOLDOWN_HOURS)

def _send_email(subject, body):
    """Core email sending logic using Gmail SMTP."""
    sender = os.getenv("PIWATCH_EMAIL")
    password = os.getenv("PIWATCH_EMAIL_PASSWORD")
    recipient = os.getenv("NOTIFY_EMAIL")

    if not all([sender, password, recipient]):
        print("Email credentials missing from .env file")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = sender
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, recipient, msg.as_string())

        print(f"Email sent: {subject}")
        return True

    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def notify_weather(weather):
    """Send an email alert if weather condition warrants it."""
    trigger_conditions = ["Rain", "Thunderstorm", "Drizzle"]

    if weather not in trigger_conditions:
        return

    if not _can_send("weather"):
        print("Weather alert on cooldown, skipping email.")
        return

    subject = f"PiWatch Alert: {weather} Detected Near SDSU"
    body = (
        f"Hi,\n\n"
        f"PiWatch has detected {weather} in the San Diego / SDSU area.\n\n"
        f"Stay safe and plan accordingly!\n\n"
        f"- PiWatch Alerts\n"
        f"Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    if _send_email(subject, body):
        last_sent["weather"] = datetime.now()

def notify_traffic(traffic_index):
    """Send an email alert if traffic level is moderate or higher (2+)."""
    levels = {
        2: "Moderate Traffic",
        3: "Heavy Traffic with Accidents",
        4: "Dead Stop Traffic"
    }

    if traffic_index < 2:
        return

    if not _can_send("traffic"):
        print("Traffic alert on cooldown, skipping email.")
        return

    level_label = levels.get(traffic_index, "Heavy Traffic")
    subject = f"PiWatch Alert: {level_label} Near SDSU"
    body = (
        f"Hi,\n\n"
        f"PiWatch has detected {level_label} in the SDSU area.\n\n"
        f"Consider alternate routes or delaying your commute.\n\n"
        f"- PiWatch Alerts\n"
        f"Sent at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    if _send_email(subject, body):
        last_sent["traffic"] = datetime.now()

def notify_crime_summary():
    """Send a daily digest email of yesterday's crime activity near SDSU."""
    from crime import get_crime_summary

    print("Generating daily crime digest...")
    summary = get_crime_summary()

    if summary["total"] == -1:
        print("Crime data unavailable, skipping email.")
        return

    # Build the breakdown lines sorted by count descending
    lines = ""
    for call_type, count in sorted(
        summary["incidents"].items(), key=lambda x: x[1], reverse=True
    ):
        lines += f"  {call_type}: {count}\n"

    if not lines:
        lines = "  No incidents reported in this area.\n"

    subject = f"PiWatch Daily Crime Digest — SDSU Area ({summary['date']})"
    body = (
        f"Hi,\n\n"
        f"Here is your PiWatch daily crime summary for the SDSU / College Area\n"
        f"for {summary['date']}:\n\n"
        f"  Total Incidents: {summary['total']}\n\n"
        f"Breakdown by incident type:\n"
        f"{lines}\n"
        f"This covers SDPD beats surrounding SDSU, College Area, and the\n"
        f"La Mesa border. Data sourced from the San Diego Police Department\n"
        f"Open Data Portal.\n\n"
        f"- PiWatch Alerts\n"
        f"Generated at: {summary['as_of']}"
    )

    _send_email(subject, body)

def send_startup_report():
    """Send an immediate status email when PiWatch first starts up."""
    from weather import getWeather
    from traffic import check_traffic
    from crime import get_crime_summary

    print("PiWatch starting up, sending initial status report...")

    weather_data = getWeather()
    traffic_index = check_traffic()
    crime_data = get_crime_summary()

    traffic_labels = {
        -1: "Unavailable",
        0: "Clear",
        1: "Light",
        2: "Moderate",
        3: "Heavy with Accidents",
        4: "Dead Stop"
    }

    weather = weather_data.get("weather", "Unavailable")
    temp = weather_data.get("temp", "Unavailable")
    traffic_label = traffic_labels.get(traffic_index, "Unknown")

    # Build crime breakdown lines
    crime_lines = ""
    for call_type, count in sorted(
        crime_data.get("incidents", {}).items(), key=lambda x: x[1], reverse=True
    ):
        crime_lines += f"    {call_type}: {count}\n"
    if not crime_lines:
        crime_lines = "    No incidents reported.\n"

    crime_total = crime_data.get("total", -1)
    crime_date = crime_data.get("date", "Unavailable")
    crime_summary_text = (
        f"  Total Incidents ({crime_date}): {crime_total}\n"
        f"{crime_lines}"
        if crime_total != -1
        else "  Crime data unavailable.\n"
    )

    subject = "PiWatch is Online — Current Status Report"
    body = (
        f"Hi,\n\n"
        f"PiWatch has just started up. Here is your current status report:\n\n"
        f"--- WEATHER ---\n"
        f"  Conditions: {weather}\n"
        f"  Temperature: {temp}°F\n\n"
        f"--- TRAFFIC ---\n"
        f"  Level: {traffic_label}\n\n"
        f"--- CRIME (Yesterday near SDSU) ---\n"
        f"{crime_summary_text}\n"
        f"You will receive alerts when conditions change.\n"
        f"  - Rain/Thunderstorm/Drizzle will trigger a weather alert\n"
        f"  - Moderate traffic or worse will trigger a traffic alert\n"
        f"  - A daily crime digest will be sent every morning at 8:00 AM\n"
        f"  - Alerts have a 2 hour cooldown to avoid spam\n\n"
        f"- PiWatch Alerts\n"
        f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    _send_email(subject, body)

    # Start cooldowns so the first poll doesn't immediately re-alert
    last_sent["weather"] = datetime.now()
    last_sent["traffic"] = datetime.now()