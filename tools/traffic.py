import requests
import dotenv
import os
import json

# This tool will get the traffic around SDSU and will report if there a traffic or accidents near the area.
# We will hardcode the bounding box containing SDSU and check every 30 mins.

dotenv.load_dotenv()

def check_traffic():
    TOM_TOM_API = os.getenv("TOM_TOM_API_KEY")

    # Parameters for the API call, we will get the info for the area around SDSU
    bbox = "-117.088024,32.763647,-117.062962,32.780571" # SDSU long and lat box
    url = f"https://api.tomtom.com/traffic/services/5/incidentDetails?key={TOM_TOM_API}&bbox={bbox}&categoryFilter=1,6&timeValidityFilter=present&language=en-US"

    response = requests.get(url)
    data = response.json()
    accidentCount = 0
    trafficServerity = 0
    
    if(data.get("incidents")):
        for incident in data["incidents"]:
            if incident["properties"]["iconCategory"] == 6:
                trafficServerity += 1
            if incident["properties"]["iconCategory"] == 1:
                accidentCount += 1
                

    if accidentCount > 0 and trafficServerity > 1:
        return 1 #light traffic
    elif accidentCount >= 0 and trafficServerity > 3:
        return 2 # moderate traffic
    elif accidentCount >= 1 and trafficServerity > 3:
        return 3 # heavy traffic with accidents
    elif trafficServerity > 3:
        return 4 # dead stop traffic
    else:
        return 0









if __name__ == "__main__":
    print(check_traffic())