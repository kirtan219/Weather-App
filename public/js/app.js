// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loadingContainer = document.querySelector('.loading-container');
const mainContent = document.querySelector('main');
const errorContainer = document.querySelector('.error-container');
const errorMessage = document.getElementById('error-message');

// Weather Display Elements
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const temperatureElement = document.getElementById('temperature');
const weatherIcon = document.getElementById('weather-icon');
const weatherDescription = document.getElementById('weather-description');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const cloudiness = document.getElementById('cloudiness');
const forecastCards = document.getElementById('forecast-cards');

// Default city
let defaultCity = 'London';
let map = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    getWeatherData(defaultCity);
});

searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                showError('Unable to retrieve your location. Please allow location access or enter a city name.');
                console.error('Geolocation error:', error);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
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

// Functions
async function getWeatherData(city) {
    try {
        showLoading();
        
        // First use the geocoding API to get coordinates
        const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geocodingResponse = await fetch(geocodingUrl);
        const geocodingData = await geocodingResponse.json();
        
        if (!geocodingData.results || geocodingData.results.length === 0) {
            throw new Error('City not found. Please try another location.');
        }
        
        const location = geocodingData.results[0];
        const { latitude, longitude, name, country } = location;
        
        // Then get the weather data
        await getWeatherByCoordinates(latitude, longitude, name, country);
    } catch (error) {
        showError(error.message);
        console.error('Error fetching weather data:', error);
    }
}

async function getWeatherByCoordinates(lat, lon, locationName = null, locationCountry = null) {
    try {
        // Get current weather data
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();
        
        // Get location name if not provided (reverse geocoding)
        if (!locationName || !locationCountry) {
            try {
                const reverseGeocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
                const reverseGeocodingResponse = await fetch(reverseGeocodingUrl);
                const reverseGeocodingData = await reverseGeocodingResponse.json();
                
                if (reverseGeocodingData.results && reverseGeocodingData.results.length > 0) {
                    const location = reverseGeocodingData.results[0];
                    locationName = location.name;
                    locationCountry = location.country;
                }
            } catch (error) {
                console.error('Error in reverse geocoding:', error);
                locationName = "Unknown Location";
                locationCountry = "";
            }
        }
        
        // Format the data for our UI
        const formattedData = {
            name: locationName || 'Unknown',
            sys: {
                country: locationCountry || 'Unknown'
            },
            coord: {
                lat: lat,
                lon: lon
            },
            main: {
                temp: weatherData.current.temperature_2m,
                feels_like: weatherData.current.apparent_temperature,
                humidity: weatherData.current.relative_humidity_2m,
                pressure: weatherData.current.surface_pressure || weatherData.current.pressure_msl
            },
            wind: {
                speed: weatherData.current.wind_speed_10m,
                deg: weatherData.current.wind_direction_10m,
                gust: weatherData.current.wind_gusts_10m
            },
            weather: [
                {
                    id: weatherData.current.weather_code,
                    main: getWeatherMain(weatherData.current.weather_code),
                    description: getWeatherDescription(weatherData.current.weather_code),
                    icon: getWeatherIcon(weatherData.current.weather_code)
                }
            ],
            visibility: 10000, // Open-Meteo doesn't provide this directly, using default
            clouds: {
                all: getCloudiness(weatherData.current.weather_code)
            },
            dt: new Date(weatherData.current.time).getTime() / 1000
        };
        
        // Display the weather data
        displayWeatherData(formattedData);
        
        // Get forecast data
        await getForecastDataByCoordinates(lat, lon);
        
        // Initialize the map
        initMap(lat, lon);
    } catch (error) {
        showError('Unable to get weather for this location.');
        console.error('Error fetching weather data by coordinates:', error);
    }
}

async function getForecastDataByCoordinates(lat, lon) {
    try {
        // Get 5-day forecast data
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
        
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();
        
        // Format the data for our UI
        const formattedForecast = {
            list: forecastData.daily.time.map((time, index) => {
                return {
                    dt: new Date(time).getTime() / 1000,
                    main: {
                        temp: (forecastData.daily.temperature_2m_max[index] + forecastData.daily.temperature_2m_min[index]) / 2,
                        feels_like: (forecastData.daily.apparent_temperature_max[index] + forecastData.daily.apparent_temperature_min[index]) / 2,
                        temp_min: forecastData.daily.temperature_2m_min[index],
                        temp_max: forecastData.daily.temperature_2m_max[index],
                        humidity: 0, // Not directly provided by Open-Meteo in daily
                        pressure: 0  // Not directly provided by Open-Meteo in daily
                    },
                    weather: [
                        {
                            id: forecastData.daily.weather_code[index],
                            main: getWeatherMain(forecastData.daily.weather_code[index]),
                            description: getWeatherDescription(forecastData.daily.weather_code[index]),
                            icon: getWeatherIcon(forecastData.daily.weather_code[index])
                        }
                    ],
                    wind: {
                        speed: forecastData.daily.wind_speed_10m_max[index]
                    },
                    clouds: {
                        all: getCloudiness(forecastData.daily.weather_code[index])
                    },
                    pop: forecastData.daily.precipitation_sum[index] > 0 ? 0.5 : 0 // Probability of precipitation estimation
                };
            }).slice(0, 5) // Limit to 5 days
        };
        
        // Display the forecast data
        displayForecastData(formattedForecast);
    } catch (error) {
        console.error('Error fetching forecast data by coordinates:', error);
    }
}

function displayWeatherData(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    currentDate.textContent = formatDate(new Date());
    temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherDescription.textContent = data.weather[0].description;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;
    pressure.textContent = `${data.main.pressure} hPa`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    cloudiness.textContent = `${data.clouds.all}%`;
    
    hideLoading();
    showMainContent();
}

function displayForecastData(data) {
    forecastCards.innerHTML = '';
    
    // Display each day's forecast
    data.list.forEach(day => {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        forecastCard.innerHTML = `
            <div class="date">${formatDay(new Date(day.dt * 1000))}</div>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
            <div class="temp">${Math.round(day.main.temp)}°C</div>
            <div class="description">${day.weather[0].description}</div>
        `;
        
        forecastCards.appendChild(forecastCard);
    });
}

function initMap(lat, lon) {
    // Clear previous map instance if it exists
    const mapDiv = document.getElementById('windy-map');
    mapDiv.innerHTML = '';
    
    // Initialize Leaflet map
    if (map) {
        map.remove();
    }
    
    map = L.map('windy-map').setView([lat, lon], 10);
    
    // Add the OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add a marker at the location
    L.marker([lat, lon]).addTo(map)
        .bindPopup('Weather Location')
        .openPopup();
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDay(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function showLoading() {
    loadingContainer.classList.remove('hide');
    mainContent.classList.add('hide');
    errorContainer.classList.add('hide');
}

function hideLoading() {
    loadingContainer.classList.add('hide');
}

function showMainContent() {
    mainContent.classList.remove('hide');
    errorContainer.classList.add('hide');
}

function showError(message) {
    hideLoading();
    mainContent.classList.add('hide');
    errorContainer.classList.remove('hide');
    errorMessage.textContent = message;
} 