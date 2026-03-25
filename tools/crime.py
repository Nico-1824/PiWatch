from datetime import datetime, timedelta

# NOTE: Free crime APIs for San Diego (SD Open Data Portal, SpotCrime) block
# programmatic access. This mock data simulates what the real digest would look
# like. Future enhancement: integrate a paid API such as CrimeMapping or
# request direct SDPD data access.

def get_crime_summary():
    """
    Returns a simulated 24-hour crime summary for the SDSU area.
    Mocked for demo purposes — structure matches what a real API would return.
    """
    now = datetime.now()
    yesterday = (now - timedelta(days=1)).date()

    mock_incidents = {
        "Disturbance": 4,
        "Vehicle Theft": 3,
        "Burglary": 2,
        "Suspicious Person": 2,
        "Vandalism": 1
    }

    total = sum(mock_incidents.values())

    return {
        "total": total,
        "incidents": mock_incidents,
        "date": str(yesterday),
        "as_of": now.strftime("%Y-%m-%d %H:%M:%S")
    }


if __name__ == "__main__":
    summary = get_crime_summary()
    print(f"\nCrime Summary for {summary['date']} near SDSU:")
    print(f"Total incidents: {summary['total']}")
    for call_type, count in sorted(
        summary["incidents"].items(), key=lambda x: x[1], reverse=True
    ):
        print(f"  {call_type}: {count}")