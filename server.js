require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Open-Meteo Geocoding API to get coordinates from city name
async function getCoordinates(city) {
  try {
    const response = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0];
      return {
        lat: location.latitude,
        lon: location.longitude,
        name: location.name,
        country: location.country
      };
    }
    throw new Error('City not found');
  } catch (error) {
    console.error('Error in geocoding:', error.message);
    throw error;
  }
}

// Open-Meteo Current Weather API route
app.get('/api/weather', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    let latitude, longitude, locationName, locationCountry;
    
    if (lat && lon) {
      latitude = lat;
      longitude = lon;
    } else if (city) {
      try {
        const locationData = await getCoordinates(city);
        latitude = locationData.lat;
        longitude = locationData.lon;
        locationName = locationData.name;
        locationCountry = locationData.country;
      } catch (error) {
        return res.status(404).json({ error: 'City not found. Please try another location.' });
      }
    } else {
      return res.status(400).json({ error: 'City name or coordinates required' });
    }
    
    // Get current weather data
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`;
    
    const response = await axios.get(url);
    
    // Format the response to match the structure our front-end expects
    const weatherData = {
      name: locationName || 'Unknown',
      sys: {
        country: locationCountry || 'Unknown'
      },
      coord: {
        lat: latitude,
        lon: longitude
      },
      main: {
        temp: response.data.current.temperature_2m,
        feels_like: response.data.current.apparent_temperature,
        humidity: response.data.current.relative_humidity_2m,
        pressure: response.data.current.surface_pressure
      },
      wind: {
        speed: response.data.current.wind_speed_10m,
        deg: response.data.current.wind_direction_10m,
        gust: response.data.current.wind_gusts_10m
      },
      weather: [
        {
          id: response.data.current.weather_code,
          main: getWeatherMain(response.data.current.weather_code),
          description: getWeatherDescription(response.data.current.weather_code),
          icon: getWeatherIcon(response.data.current.weather_code)
        }
      ],
      visibility: 10000, // Open-Meteo doesn't provide this directly, using default
      clouds: {
        all: getCloudiness(response.data.current.weather_code)
      },
      dt: new Date(response.data.current.time).getTime() / 1000
    };
    
    res.json(weatherData);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Open-Meteo Forecast API route
app.get('/api/forecast', async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    let latitude, longitude;
    
    if (lat && lon) {
      latitude = lat;
      longitude = lon;
    } else if (city) {
      try {
        const locationData = await getCoordinates(city);
        latitude = locationData.lat;
        longitude = locationData.lon;
      } catch (error) {
        return res.status(404).json({ error: 'City not found. Please try another location.' });
      }
    } else {
      return res.status(400).json({ error: 'City name or coordinates required' });
    }
    
    // Get 5-day forecast data
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
    
    const response = await axios.get(url);
    
    // Format the response to match the structure expected by our front-end
    const forecastData = {
      list: response.data.daily.time.map((time, index) => {
        return {
          dt: new Date(time).getTime() / 1000,
          main: {
            temp: (response.data.daily.temperature_2m_max[index] + response.data.daily.temperature_2m_min[index]) / 2,
            feels_like: (response.data.daily.apparent_temperature_max[index] + response.data.daily.apparent_temperature_min[index]) / 2,
            temp_min: response.data.daily.temperature_2m_min[index],
            temp_max: response.data.daily.temperature_2m_max[index],
            humidity: 0, // Not directly provided by Open-Meteo in daily
            pressure: 0  // Not directly provided by Open-Meteo in daily
          },
          weather: [
            {
              id: response.data.daily.weather_code[index],
              main: getWeatherMain(response.data.daily.weather_code[index]),
              description: getWeatherDescription(response.data.daily.weather_code[index]),
              icon: getWeatherIcon(response.data.daily.weather_code[index])
            }
          ],
          wind: {
            speed: response.data.daily.wind_speed_10m_max[index]
          },
          clouds: {
            all: getCloudiness(response.data.daily.weather_code[index])
          },
          pop: response.data.daily.precipitation_sum[index] > 0 ? 0.5 : 0 // Probability of precipitation estimation
        };
      })
    };
    
    res.json(forecastData);
  } catch (error) {
    console.error('Error fetching forecast data:', error.message);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

// Helper functions to convert Open-Meteo weather codes to our format
function getWeatherMain(code) {
  const codes = {
    0: 'Clear',
    1: 'Clear',
    2: 'Partly cloudy',
    3: 'Cloudy',
    45: 'Fog',
    48: 'Fog',
    51: 'Drizzle',
    53: 'Drizzle',
    55: 'Drizzle',
    56: 'Freezing Drizzle',
    57: 'Freezing Drizzle',
    61: 'Rain',
    63: 'Rain',
    65: 'Rain',
    66: 'Freezing Rain',
    67: 'Freezing Rain',
    71: 'Snow',
    73: 'Snow',
    75: 'Snow',
    77: 'Snow Grains',
    80: 'Rain Showers',
    81: 'Rain Showers',
    82: 'Rain Showers',
    85: 'Snow Showers',
    86: 'Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm'
  };
  return codes[code] || 'Unknown';
}

function getWeatherDescription(code) {
  const descriptions = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    56: 'light freezing drizzle',
    57: 'dense freezing drizzle',
    61: 'slight rain',
    63: 'moderate rain',
    65: 'heavy rain',
    66: 'light freezing rain',
    67: 'heavy freezing rain',
    71: 'slight snow fall',
    73: 'moderate snow fall',
    75: 'heavy snow fall',
    77: 'snow grains',
    80: 'slight rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    85: 'slight snow showers',
    86: 'heavy snow showers',
    95: 'slight thunderstorm',
    96: 'thunderstorm with slight hail',
    99: 'thunderstorm with heavy hail'
  };
  return descriptions[code] || 'unknown weather';
}

function getWeatherIcon(code) {
  // Map Open-Meteo codes to similar OpenWeather icons
  const icons = {
    0: '01d', // Clear sky
    1: '01d', // Mainly clear
    2: '02d', // Partly cloudy
    3: '04d', // Overcast
    45: '50d', // Fog
    48: '50d', // Depositing rime fog
    51: '09d', // Light drizzle
    53: '09d', // Moderate drizzle
    55: '09d', // Dense drizzle
    56: '09d', // Light freezing drizzle
    57: '09d', // Dense freezing drizzle
    61: '10d', // Slight rain
    63: '10d', // Moderate rain
    65: '10d', // Heavy rain
    66: '13d', // Light freezing rain
    67: '13d', // Heavy freezing rain
    71: '13d', // Slight snow fall
    73: '13d', // Moderate snow fall
    75: '13d', // Heavy snow fall
    77: '13d', // Snow grains
    80: '09d', // Slight rain showers
    81: '09d', // Moderate rain showers
    82: '09d', // Violent rain showers
    85: '13d', // Slight snow showers
    86: '13d', // Heavy snow showers
    95: '11d', // Slight thunderstorm
    96: '11d', // Thunderstorm with slight hail
    99: '11d'  // Thunderstorm with heavy hail
  };
  return icons[code] || '01d';
}

function getCloudiness(code) {
  // Estimate cloudiness percentage based on weather code
  const cloudiness = {
    0: 0,   // Clear sky
    1: 10,  // Mainly clear
    2: 50,  // Partly cloudy
    3: 90,  // Overcast
  };
  return cloudiness[code] !== undefined ? cloudiness[code] : 50;
}

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 