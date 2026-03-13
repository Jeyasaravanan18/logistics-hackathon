"""
Weather Service — fetches weather disruptions from OpenWeatherMap API.
Falls back to rich mock data when API key is missing or rate-limited.
"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

# Key Indian logistics hubs to monitor
MONITORED_CITIES = [
    {"name": "Chennai", "lat": 13.0827, "lon": 80.2707},
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    {"name": "Delhi", "lat": 28.6139, "lon": 77.2090},
    {"name": "Bangalore", "lat": 12.9716, "lon": 77.5946},
    {"name": "Kolkata", "lat": 22.5726, "lon": 88.3639},
    {"name": "Hyderabad", "lat": 17.3850, "lon": 78.4867},
    {"name": "Pune", "lat": 18.5204, "lon": 73.8567},
    {"name": "Ahmedabad", "lat": 23.0225, "lon": 72.5714},
    {"name": "Nagpur", "lat": 21.1458, "lon": 79.0882},
    {"name": "Kochi", "lat": 9.9312, "lon": 76.2673},
]

WEATHER_SEVERITY_MAP = {
    "Thunderstorm": "HIGH",
    "Drizzle": "MEDIUM",
    "Rain": "MEDIUM",
    "Snow": "HIGH",
    "Fog": "MEDIUM",
    "Mist": "LOW",
    "Haze": "LOW",
    "Dust": "MEDIUM",
    "Sand": "MEDIUM",
    "Ash": "HIGH",
    "Squall": "HIGH",
    "Tornado": "HIGH",
    "Extreme": "HIGH",
    "Smoke": "MEDIUM",
    "Clear": "LOW",   # Include clear — useful baseline for routes   
    "Clouds": "LOW",  # Fetch all conditions so the AI pipeline has full coverage
}




def _map_weather_to_disruption(city: dict, weather_data: dict) -> dict | None:
    """Convert OpenWeatherMap API response to unified disruption dict."""
    main = weather_data.get("weather", [{}])[0].get("main", "Clear")
    desc = weather_data.get("weather", [{}])[0].get("description", "")
    severity = WEATHER_SEVERITY_MAP.get(main, "LOW")
    if not severity:
        return None

    # Extract real data from the API
    temp = weather_data.get("main", {}).get("temp", "N/A")
    humidity = weather_data.get("main", {}).get("humidity", "N/A")
    wind_speed = weather_data.get("wind", {}).get("speed", 0)
    from datetime import datetime
    ts = datetime.utcfromtimestamp(weather_data.get("dt", 0)).strftime("%Y-%m-%dT%H:%M:%S") if weather_data.get("dt") else "2026-03-12T13:00:00"

    return {
        "id": f"W-{city['name'][:3].upper()}",
        "type": "weather",
        "subtype": f"{main} / {desc.title()}",
        "location": city["name"],
        "lat": city["lat"],
        "lon": city["lon"],
        "severity": severity,
        "description": (
            f"{desc.title()} in {city['name']}. "
            f"Temp: {temp}°C, Humidity: {humidity}%, Wind: {wind_speed} m/s. "
            f"Potential impact on road and logistics routes."
        ),
        "source": "OpenWeatherMap (Live)",
        "timestamp": ts,
    }


async def fetch_weather_disruptions() -> list[dict]:
    """Fetch weather disruptions for all monitored cities."""
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == "your_openweathermap_key_here":
        raise ValueError("Missing OpenWeatherMap API Key. Synthetic data is disabled for production.")

    disruptions = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for city in MONITORED_CITIES:
            try:
                resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={
                        "lat": city["lat"],
                        "lon": city["lon"],
                        "appid": OPENWEATHER_API_KEY,
                        "units": "metric",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    disruption = _map_weather_to_disruption(city, data)
                    if disruption:
                        disruptions.append(disruption)
            except Exception as e:
                print(f"[WeatherService] Error fetching {city['name']}: {e}")

    return disruptions
