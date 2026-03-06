import pytest
import os

from traffic import check_traffic
from weather import getWeather

class TestPiWatch:

    def test_traffic_api(self):
        result = check_traffic()
        assert result in [0, 1, 2, 3, 4]

    def test_traffic_api_error_handling(self):
        api_key_backup = os.getenv("TOM_TOM_API_KEY")
        os.environ["TOM_TOM_API_KEY"] = "wrongapi_key"

        result = check_traffic()
        assert result == -1
        os.environ["TOM_TOM_API_KEY"] = api_key_backup

    def test_weather_api_error_handling(self):
        api_backup = os.getenv("OPEN_WEATHER_API_KEY")
        os.environ["OPEN_WEATHER_API_KEY"] = "wrongapi"

        result = getWeather()
        os.environ["OPEN_WEATHER_API_KEY"] = api_backup
        assert result["weather"] == "Unavailable look outside" and result["temp"] == "Unavailable put your finger out the window"