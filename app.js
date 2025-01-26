document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
    const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
    const API_KEY = 'f01f27222f30a5d6377319b3e9f77947';
    
    // DOM Elements
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const locationBtn = document.getElementById('Btn');
    const errorMessage = document.getElementById('errorMessage');
    const cityUnavailable = document.getElementById('cityUnavailable');
    const weatherResult = document.getElementById('weatherResult');
    const favoriteBtn = document.getElementById('btn-fav');
    const favoritesList = document.getElementById('favoritesList');
    const hourlyForecastContainer = document.querySelector('.hourly-cards');
    const mainWeatherIcon = document.querySelector('.weather-icon');
  
    // Get appropriate weather icon
    function getWeatherIcon(condition) {
        const iconMap = {
            'clear': 'animated/day.svg',
            'clouds': 'animated/cloudy.svg',
            'rain': 'animated/rainy.svg',
            'snow': 'animated/snowy.svg',
            'thunderstorm': 'animated/thunder.svg',
            'drizzle': 'animated/rainy.svg'
        };
        return iconMap[condition] || 'animated/day.svg';
    }
  
    // Fetch weather data by city name
  async function fetchWeatherByCity(city) {
    try {
        const response = await fetch(`${API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=fr`);
        
        if (!response.ok) {
            // Show city unavailable message
            cityUnavailable.classList.add('active');
            weatherResult.style.display = 'none';
            return;
        }
        
        // Hide city unavailable message if city is found
        cityUnavailable.classList.remove('active');
        weatherResult.style.display = 'block';
        
        const data = await response.json();
        updateWeatherUI(data);
        fetchHourlyForecast(city);
    } catch (error) {
        cityUnavailable.classList.add('active');
        weatherResult.style.display = 'none';
        showError('Ville non trouvée');
    }
  }
  
    // Fetch hourly forecast
    async function fetchHourlyForecast(city) {
        try {
            const response = await fetch(`${FORECAST_API_URL}?q=${city}&appid=${API_KEY}&units=metric&lang=fr`);
            const data = await response.json();
            updateHourlyForecast(data);
        } catch (error) {
            console.error('Erreur de prévisions horaires:', error);
        }
    }
  
    // Update hourly forecast UI
    function updateHourlyForecast(data) {
        const hourlyData = data.list.slice(0, 5).map(item => ({
            time: new Date(item.dt * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            temp: Math.round(item.main.temp),
            icon: getWeatherIcon(item.weather[0].main.toLowerCase())
        }));
  
        hourlyForecastContainer.innerHTML = hourlyData.map(hour => `
            <div class="hourly-card">
                <span class="hour">${hour.time}</span>
                <img src="${hour.icon}" alt="Hour Icon">
                <span class="hourly-temp">${hour.temp}°C</span>
            </div>
        `).join('');
    }
  
    // Fetch weather data by geolocation
    function fetchWeatherByLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(`${API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=fr`);
                    const data = await response.json();
                    updateWeatherUI(data);
                    fetchHourlyForecast(data.name);
                } catch (error) {
                    showError('Impossible de récupérer la météo');
                }
            }, () => {
                showError('Autorisation de localisation refusée');
            });
        } else {
            showError('Géolocalisation non supportée');
        }
    }
  
    // Update UI with weather data
    function updateWeatherUI(data) {
        // Clear previous error
        errorMessage.textContent = '';
  
        // Update main weather details
        document.querySelector('.weather-header h2').textContent = data.name;
        document.querySelector('.current-temperature').textContent = `${Math.round(data.main.temp)}°C`;
        
        // Update weather icon based on condition
        const mainCondition = data.weather[0].main.toLowerCase();
        mainWeatherIcon.src = getWeatherIcon(mainCondition);
  
        // Update precipitation
        const precipitationElement = document.querySelector('.precipitation-percentage');
        precipitationElement.textContent = data.clouds ? `${data.clouds.all}%` : '0%';
    }
  
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        weatherResult.style.opacity = '0.5';
    }
  
    // Add to favorites
    function addToFavorites() {
        const cityName = document.querySelector('.weather-header h2').textContent;
        if (cityName && cityName !== 'City') {
            let favorites = JSON.parse(localStorage.getItem('weatherFavorites') || '[]');
            
            // Check if city already exists
            if (!favorites.includes(cityName)) {
                // Add to favorites
                favorites.push(cityName);
                localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
                renderFavorites();
            }
        }
    }
  
    // Render favorites list
    function renderFavorites() {
        const favorites = JSON.parse(localStorage.getItem('weatherFavorites') || '[]');
        favoritesList.innerHTML = favorites.map(city => 
            `<div class="favorite-item">
                <span>${city}</span>
                <button class="voir-btn" data-city="${city}">Voir</button>
                <button class="supprimer-btn" data-city="${city}">Supprimer</button>
            </div>`
        ).join('');
  
        // Add event listeners for Voir and Supprimer buttons
        document.querySelectorAll('.voir-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const city = btn.dataset.city;
                fetchWeatherByCity(city);
            });
        });
  
        document.querySelectorAll('.supprimer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const city = btn.dataset.city;
                removeFromFavorites(city);
            });
        });
    }
  
    // Remove from favorites
    function removeFromFavorites(city) {
        let favorites = JSON.parse(localStorage.getItem('weatherFavorites') || '[]');
        const updatedFavorites = favorites.filter(fav => fav !== city);
        localStorage.setItem('weatherFavorites', JSON.stringify(updatedFavorites));
        renderFavorites();
    }
  
    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
    });
  
    locationBtn.addEventListener('click', fetchWeatherByLocation);
    favoriteBtn.addEventListener('click', addToFavorites);
  
    // Initialize favorites
    renderFavorites();
  
    // Clear initial UI
    document.querySelector('.weather-header h2').textContent = 'City';
    document.querySelector('.current-temperature').textContent = '—°C';
    document.querySelector('.precipitation-percentage').textContent = '—%';
    hourlyForecastContainer.innerHTML = `
      <div class="hourly-card">
          <span class="hour">14:00</span>
          <img src="animated/day.svg" alt="Hour Icon">
          <span class="hourly-temp">23°C</span>
      </div>
      <div class="hourly-card">
          <span class="hour">15:00</span>
          <img src="animated/day.svg" alt="Hour Icon">
          <span class="hourly-temp">24°C</span>
      </div>
      <div class="hourly-card">
          <span class="hour">16:00</span>
          <img src="animated/day.svg" alt="Hour Icon">
          <span class="hourly-temp">25°C</span>
      </div>
      <div class="hourly-card">
          <span class="hour">17:00</span>
          <img src="animated/day.svg" alt="Hour Icon">
          <span class="hourly-temp">24°C</span>
      </div>
      <div class="hourly-card">
          <span class="hour">18:00</span>
          <img src="animated/day.svg" alt="Hour Icon">
          <span class="hourly-temp">22°C</span>
      </div>
  `;
    mainWeatherIcon.src = 'animated/day.svg';
  });