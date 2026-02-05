import { NextResponse } from 'next/server';
import { getReadingContext } from '@/lib/context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// OpenWeatherMap API (free tier)
// Sign up at: https://openweathermap.org/api
// Free tier: 1000 calls/day, no credit card required
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

interface WeatherData {
  condition: string;
  temp: number;
  description: string;
}

async function fetchWeather(location: string): Promise<WeatherData | null> {
  if (!WEATHER_API_KEY) {
    return null;
  }

  try {
    // Use geocoding to get coordinates from location
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${WEATHER_API_KEY}`;
    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      return null;
    }

    const geoData = await geoResponse.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      return null;
    }

    const { lat, lon } = geoData[0];

    // Fetch weather data (metric units for Celsius)
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_API_KEY}`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      return null;
    }

    const weatherData = await weatherResponse.json();

    return {
      condition: weatherData.weather[0].main,
      temp: Math.round(weatherData.main.temp),
      description: weatherData.weather[0].description
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');

    if (!location) {
      return NextResponse.json({ error: 'Location required' }, { status: 400 });
    }

    // Fetch weather data
    const weather = await fetchWeather(location);

    // Get full reading context
    const context = getReadingContext(location, weather || undefined);

    return NextResponse.json(context);
  } catch (error) {
    console.error('Context API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch context' },
      { status: 500 }
    );
  }
}
