import pytest
from unittest.mock import patch, MagicMock

from backend.app import get_weather, get_weather_emoji


def test_get_weather_success(mocker):
    # --- Fake API JSON response ---
    fake_response = {
        "location": {
            "name": "London",
            "country": "UK",
            "localtime": "2025-01-01 12:00",
        },
        "current": {
            "temp_c": 22.5,
            "feelslike_c": 23.0,
            "humidity": 55,
            "condition": {
                "text": "Sunny",
                "code": 1000,
                "icon": "//cdn.weather.com/icon.png",
            },
        },
    }

    # --- Mock requests.get ---
    mock_get = mocker.patch("backend.app.requests.get")
    mock_get.return_value.json.return_value = fake_response

    # --- Call function ---
    result = get_weather("London")

    # --- Assertions ---
    assert result["city"] == "London"
    assert result["country"] == "UK"
    assert result["temperature"] == 22.5
    assert result["feels_like"] == 23.0
    assert result["humidity"] == 55
    assert result["description"] == "Sunny"
    assert result["code"] == 1000

    # icon URL should be fixed (starts with https:)
    assert result["icon"] == "https://cdn.weather.com/icon.png"

    # emoji should match the weather code
    assert result["emoji"] == get_weather_emoji(1000)