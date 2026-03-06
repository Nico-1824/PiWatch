import pytest
import os
from traffic import check_traffic

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