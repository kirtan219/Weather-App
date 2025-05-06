// Weather Patterns Analysis JavaScript
// This script handles the data visualization and analysis for historical weather patterns in Indian metro cities

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const citySelect = document.getElementById('city-select');
    const cityDescription = document.getElementById('city-description');
    const tempTrend = document.getElementById('temp-trend');
    const tempChange = document.getElementById('temp-change');
    const rainTrend = document.getElementById('rain-trend');
    const rainChange = document.getElementById('rain-change');
    const extremeEvents = document.getElementById('extreme-events');
    const mainChart = document.getElementById('main-chart');
    const tempPredictionChart = document.getElementById('temp-prediction-chart');
    const rainPredictionChart = document.getElementById('rain-prediction-chart');
    const predictionText = document.getElementById('prediction-text');
    const infraRecommendation = document.getElementById('infra-recommendation');
    const agriRecommendation = document.getElementById('agri-recommendation');
    const waterRecommendation = document.getElementById('water-recommendation');
    const energyRecommendation = document.getElementById('energy-recommendation');
    const loadingContainer = document.querySelector('.loading-container');
    const mainContent = document.querySelector('main');
    
    // Chart objects
    let mainChartObj = null;
    let tempPredictionChartObj = null;
    let rainPredictionChartObj = null;
    
    // Show loading initially
    showLoading();
    
    // Check if there's a city from Current Weather page in localStorage
    checkSavedCity();
    
    // Event Listeners
    citySelect.addEventListener('change', updateDashboard);
    
    // Chart type buttons
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateMainChart(e.target.dataset.chart);
        });
    });
    
    // Prediction period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updatePredictions(e.target.dataset.period);
        });
    });
    
    // Initialize dashboard with default city
    updateDashboard();
    
    // Function to check for saved city in localStorage
    function checkSavedCity() {
        const savedMetroCity = localStorage.getItem('selectedMetroCity');
        if (savedMetroCity) {
            // Set the select element to the saved city value
            citySelect.value = savedMetroCity;
            
            // Add info about the original city if it's different
            const originalCity = localStorage.getItem('selectedCity');
            const originalCountry = localStorage.getItem('selectedCountry');
            
            if (originalCity && originalCity.toLowerCase() !== savedMetroCity) {
                // Create or update info element
                let infoElement = document.querySelector('.city-match-info');
                if (!infoElement) {
                    infoElement = document.createElement('div');
                    infoElement.className = 'city-match-info';
                    citySelect.parentNode.appendChild(infoElement);
                }
                
                infoElement.textContent = `Showing data for ${cityNames[savedMetroCity]} - closest match to ${originalCity}, ${originalCountry}`;
                infoElement.style.display = 'block';
            }
        }
    }
    
    function updateDashboard() {
        showLoading();
        const city = citySelect.value;
        
        // Save the selected city back to localStorage
        localStorage.setItem('selectedMetroCity', city);
        
        // Update city insights
        updateCityInsights(city);
        
        // Update main chart (default: temperature)
        updateMainChart('temperature');
        
        // Update predictions (default: short-term)
        updatePredictions('short');
        
        // Update recommendations
        updateRecommendations(city);
        
        // Hide loading spinner after data is loaded
        hideLoading();
    }
    
    // Helper functions for loading state
    function showLoading() {
        loadingContainer.style.display = 'flex';
        mainContent.style.display = 'none';
    }
    
    function hideLoading() {
        loadingContainer.style.display = 'none';
        mainContent.style.display = 'block';
    }
    
    function updateCityInsights(city) {
        const cityData = getHistoricalData(city);
        
        // Update city description
        cityDescription.textContent = cityDescriptions[city];
        
        // Calculate temperature trend
        const tempTrendData = calculateTrend(cityData.temperature);
        tempTrend.textContent = tempTrendData.description;
        tempChange.textContent = `${tempTrendData.change > 0 ? '+' : ''}${tempTrendData.change.toFixed(1)}°C over 25 years`;
        tempChange.className = `change-value ${tempTrendData.change > 0 ? 'negative' : 'positive'}`;
        
        // Calculate rainfall trend
        const rainTrendData = calculateTrend(cityData.rainfall);
        rainTrend.textContent = rainTrendData.description;
        rainChange.textContent = `${rainTrendData.change > 0 ? '+' : ''}${rainTrendData.change.toFixed(1)}% over 25 years`;
        rainChange.className = `change-value ${rainTrendData.change > 0 ? 'positive' : 'negative'}`;
        
        // Update extreme events
        extremeEvents.textContent = extremeEventsData[city];
    }
    
    function updateMainChart(chartType) {
        const city = citySelect.value;
        const cityData = getHistoricalData(city);
        
        // Clear existing chart
        if (mainChartObj) {
            mainChartObj.destroy();
        }
        
        let chartData, chartOptions;
        
        if (chartType === 'temperature') {
            chartData = {
                labels: cityData.years,
                datasets: [
                    {
                        label: 'Average Temperature (°C)',
                        data: cityData.temperature,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            };
            
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${cityNames[city]} - Historical Temperature (1998-2023)`
                    }
                }
            };
            
            // Remove extreme events description if it exists
            const extremeEventDescription = document.querySelector('.extreme-events-description');
            if (extremeEventDescription) {
                extremeEventDescription.remove();
            }
        } else if (chartType === 'rainfall') {
            chartData = {
                labels: cityData.years,
                datasets: [
                    {
                        label: 'Annual Rainfall (mm)',
                        data: cityData.rainfall,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }
                ]
            };
            
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Rainfall (mm)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${cityNames[city]} - Historical Rainfall (1998-2023)`
                    }
                }
            };
            
            // Remove extreme events description if it exists
            const extremeEventDescription = document.querySelector('.extreme-events-description');
            if (extremeEventDescription) {
                extremeEventDescription.remove();
            }
        } else if (chartType === 'extreme') {
            chartData = {
                labels: cityData.years,
                datasets: [
                    {
                        label: 'Extreme Weather Events',
                        data: cityData.extremeEvents,
                        borderColor: '#f39c12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }
                ]
            };
            
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Number of Events'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `${cityNames[city]} - Extreme Weather Events (1998-2023)`
                    }
                }
            };
            
            // Add extreme events description
            const chartWrapper = document.querySelector('.chart-wrapper');
            let extremeEventDescription = document.querySelector('.extreme-events-description');
            
            if (!extremeEventDescription) {
                extremeEventDescription = document.createElement('div');
                extremeEventDescription.className = 'extreme-events-description';
                chartWrapper.parentNode.insertBefore(extremeEventDescription, chartWrapper.nextSibling);
            }
            
            extremeEventDescription.innerHTML = `
                <div class="chart-info">
                    <h4><i class="fas fa-info-circle"></i> About Extreme Weather Events</h4>
                    <p>This chart shows the frequency of extreme weather events including heat waves, heavy precipitation, 
                    cyclones, floods, and droughts. Climate change is increasing both the frequency and intensity of these events. 
                    For ${cityNames[city]}, the data indicates a ${getExtremeEventsIncreasePercentage(cityData.extremeEvents)}% increase in extreme events 
                    over the past 25 years.</p>
                    <p>These events have significant impacts on infrastructure, agriculture, water resources, and public health. 
                    The resilience recommendations provided aim to address these growing challenges.</p>
                </div>
            `;
        }
        
        // Create new chart
        mainChartObj = new Chart(mainChart, {
            type: 'line',
            data: chartData,
            options: chartOptions
        });
    }
    
    function updatePredictions(period) {
        const city = citySelect.value;
        const predictionsData = getPredictionData(city, period);
        
        // Update temperature prediction chart
        if (tempPredictionChartObj) {
            tempPredictionChartObj.destroy();
        }
        
        tempPredictionChartObj = new Chart(tempPredictionChart, {
            type: 'line',
            data: {
                labels: predictionsData.years,
                datasets: [
                    {
                        label: 'Predicted Temperature (°C)',
                        data: predictionsData.temperature,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Update rainfall prediction chart
        if (rainPredictionChartObj) {
            rainPredictionChartObj.destroy();
        }
        
        rainPredictionChartObj = new Chart(rainPredictionChart, {
            type: 'line',
            data: {
                labels: predictionsData.years,
                datasets: [
                    {
                        label: 'Predicted Rainfall (mm)',
                        data: predictionsData.rainfall,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Rainfall (mm)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Update prediction text
        predictionText.textContent = predictionsData.summary;
    }
    
    function updateRecommendations(city) {
        const recommendations = cityRecommendations[city];
        
        infraRecommendation.textContent = recommendations.infrastructure;
        agriRecommendation.textContent = recommendations.agriculture;
        waterRecommendation.textContent = recommendations.water;
        energyRecommendation.textContent = recommendations.energy;
    }
    
    function calculateTrend(data) {
        // Simple trend calculation
        const firstDecade = data.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
        const lastDecade = data.slice(-10).reduce((a, b) => a + b, 0) / 10;
        const change = lastDecade - firstDecade;
        
        let description;
        if (Math.abs(change) < 0.5) {
            description = "Relatively stable with minor fluctuations over the past 25 years.";
        } else if (change > 0) {
            description = `Showing an increasing trend with an average rise of ${change.toFixed(1)} over the past 25 years.`;
        } else {
            description = `Showing a decreasing trend with an average drop of ${Math.abs(change).toFixed(1)} over the past 25 years.`;
        }
        
        return {
            change,
            description
        };
    }
    
    // Helper function to calculate the percentage increase in extreme events
    function getExtremeEventsIncreasePercentage(extremeEventsData) {
        // Calculate average of first 5 years vs last 5 years
        const firstFiveYearsAvg = extremeEventsData.slice(0, 5).reduce((sum, value) => sum + value, 0) / 5;
        const lastFiveYearsAvg = extremeEventsData.slice(-5).reduce((sum, value) => sum + value, 0) / 5;
        
        // Calculate percentage increase
        const increase = ((lastFiveYearsAvg - firstFiveYearsAvg) / firstFiveYearsAvg) * 100;
        
        return Math.round(increase);
    }
});

// City display names
const cityNames = {
    'delhi': 'Delhi',
    'mumbai': 'Mumbai',
    'kolkata': 'Kolkata',
    'chennai': 'Chennai',
    'bangalore': 'Bangalore',
    'hyderabad': 'Hyderabad',
    'ahmedabad': 'Ahmedabad',
    'pune': 'Pune',
    'jaipur': 'Jaipur',
    'lucknow': 'Lucknow'
};

// City descriptions
const cityDescriptions = {
    'delhi': 'Delhi has a humid subtropical climate with extremely hot summers, mild winters, and a significant monsoon season. Located in Northern India, it exhibits continental climate characteristics with large temperature variations between summer and winter.',
    'mumbai': 'Mumbai features a tropical climate with hot, humid summers and mild winters. Located on the western coast of India, this financial capital experiences abundant rainfall during the Southwest Monsoon season from June to September.',
    'kolkata': 'Kolkata has a tropical wet-and-dry climate with hot and humid summers and mild winters. Located in Eastern India, it experiences heavy rainfall during the monsoon season and is influenced by its proximity to the Bay of Bengal.',
    'bangalore': 'Bangalore enjoys a mild, moderate climate throughout the year due to its high elevation. Located in Southern India, this tech hub experiences pleasant temperatures year-round, earning it the nickname "Air-Conditioned City."',
    'chennai': 'Chennai features a hot and humid climate classified as tropical wet and dry. Located on the southeastern coast of India, it receives rainfall from both the southwest and northeast monsoons, with most precipitation occurring between October and December.',
    'hyderabad': 'Hyderabad has a tropical savanna climate with hot summers and warm winters. Located in South-Central India on the Deccan Plateau, it receives moderate rainfall primarily during the monsoon season from June to September.',
    'ahmedabad': 'Ahmedabad has a hot semi-arid climate with marginally less rain than required for a tropical savanna climate. Located in Western India, it experiences extremely hot summers, mild winters, and moderate rainfall concentrated in the monsoon months.',
    'pune': 'Pune has a tropical wet and dry climate with hot summers and mild winters. Located on the leeward side of the Western Ghats, this cultural and educational hub enjoys moderate rainfall and pleasant weather for most of the year.',
    'jaipur': 'Jaipur has a hot semi-arid climate with hot summers, mild winters, and low annual rainfall. Located in the semi-desert lands of Rajasthan, the "Pink City" experiences extremes of temperature with hot days and significantly cooler nights.',
    'lucknow': 'Lucknow has a humid subtropical climate with cool, dry winters, hot summers, and a monsoon season. Located in the Indo-Gangetic Plain of North India, the "City of Nawabs" experiences a wide range of temperatures throughout the year.'
};

// Extreme events descriptions
const extremeEventsData = {
    'delhi': 'Delhi has experienced an increasing frequency of heat waves, with record temperatures exceeding 45°C in recent years. Severe air pollution episodes are increasingly common, especially during winter months.',
    'mumbai': 'Mumbai has witnessed more frequent extreme rainfall events, including the historic 2005 floods. Sea level rise and storm surges are increasingly threatening coastal areas.',
    'kolkata': 'Kolkata has faced multiple cyclones and flooding events, with increasing intensity. Urban heat island effect is becoming more pronounced in densely populated areas.',
    'bangalore': 'Bangalore has experienced increasing water scarcity, with droughts affecting the city in 2016, 2019, and 2023. Heavy rainfall events causing urban flooding have become more frequent.',
    'chennai': 'Chennai faced a severe drought in 2019 following multiple years of rainfall deficiency. The 2015 floods caused extensive damage to infrastructure and displaced thousands of residents.',
    'hyderabad': 'Hyderabad experienced record-breaking floods in 2020 that submerged parts of the city. Heat waves are becoming more frequent and intense during summer months.',
    'ahmedabad': 'Ahmedabad has faced increasing heat waves, with temperatures exceeding 48°C in recent years. The city implemented India\'s first Heat Action Plan in 2013 to address rising heat-related mortality.',
    'pune': 'Pune has experienced more frequent urban flooding events in recent years, especially in 2019 and 2021. The city has also seen increasing water scarcity and droughts in surrounding rural areas.',
    'jaipur': 'Jaipur has witnessed intensifying heat waves and longer dry spells. Water scarcity is becoming more severe, affecting both urban and rural populations in the region.',
    'lucknow': 'Lucknow has experienced increasing heat waves and more erratic monsoon patterns. Episodes of severe air pollution during winter months have become more frequent and prolonged.'
};

// City-specific recommendations for climate resilience
const cityRecommendations = {
    'delhi': {
        infrastructure: 'Implement heat-resistant building materials and designs. Enhance drainage systems to handle sudden heavy rainfall events.',
        agriculture: 'Promote drought-resistant crop varieties and efficient irrigation techniques in surrounding agricultural areas.',
        water: 'Prioritize rainwater harvesting and groundwater recharge. Implement water recycling systems for urban usage.',
        energy: 'Expand renewable energy capacity, especially solar, to reduce fossil fuel dependency during peak summer demand.'
    },
    'mumbai': {
        infrastructure: 'Strengthen coastal infrastructure against sea level rise and storm surges. Improve drainage systems in flood-prone areas.',
        agriculture: 'Develop salt-tolerant crop varieties for coastal regions. Implement crop diversification strategies for changing rainfall patterns.',
        water: 'Focus on stormwater management and flood control. Protect and restore mangroves as natural barriers.',
        energy: 'Develop decentralized energy systems that can withstand flooding and extreme weather events.'
    },
    'kolkata': {
        infrastructure: 'Upgrade drainage systems and implement flood-resistant construction. Develop improved early warning systems for cyclones.',
        agriculture: 'Promote climate-smart agriculture techniques and flood-resistant crop varieties in the surrounding delta region.',
        water: 'Focus on flood management and wetland conservation. Implement water purification systems for post-flood scenarios.',
        energy: 'Develop cyclone-resistant renewable energy infrastructure. Implement microgrids for community resilience.'
    },
    'bangalore': {
        infrastructure: 'Implement water-sensitive urban design. Restore and preserve urban lakes as water storage and flood mitigation.',
        agriculture: 'Develop water-efficient agricultural practices and drought-resistant crop varieties for surrounding regions.',
        water: 'Prioritize water conservation, recycling, and rainwater harvesting. Restore traditional water bodies.',
        energy: 'Expand rooftop solar and develop energy efficiency programs to reduce grid strain during dry periods.'
    },
    'chennai': {
        infrastructure: 'Restore urban wetlands and implement flood-resilient construction techniques. Develop reliable early warning systems.',
        agriculture: 'Implement salinity-resistant crop varieties in coastal areas. Develop water-efficient agriculture techniques.',
        water: 'Focus on integrated water resource management. Restore traditional water harvesting structures like temple tanks.',
        energy: 'Expand renewable energy capacity, especially wind and solar. Develop resilient energy distribution systems.'
    },
    'hyderabad': {
        infrastructure: 'Restore urban lakes and implement permeable surfaces to reduce runoff. Develop heat-resistant urban planning.',
        agriculture: 'Promote drought-resistant crop varieties and efficient irrigation techniques in surrounding regions.',
        water: 'Restore and interconnect the historic network of lakes. Implement comprehensive watershed management.',
        energy: 'Develop solar capacity and energy efficiency programs to reduce grid strain during heat waves.'
    },
    'ahmedabad': {
        infrastructure: 'Implement cool roofs and heat-reflective building materials. Expand green spaces to mitigate urban heat island effect.',
        agriculture: 'Promote drought-resistant crops and water-efficient farming practices in surrounding rural areas.',
        water: 'Invest in water conservation and rainwater harvesting. Restore traditional stepwells and water bodies.',
        energy: 'Expand solar power initiatives and energy-efficient cooling systems to reduce peak demand during heat waves.'
    },
    'pune': {
        infrastructure: 'Improve urban drainage systems and implement watershed management. Promote green building practices in new developments.',
        agriculture: 'Support climate-smart agriculture and water-efficient farming in surrounding regions.',
        water: 'Focus on rainwater harvesting and groundwater recharge. Restore river systems and traditional water conservation structures.',
        energy: 'Develop decentralized renewable energy systems and energy-efficient building standards.'
    },
    'jaipur': {
        infrastructure: 'Implement heat-resistant materials and water-sensitive urban design. Restore traditional water harvesting structures.',
        agriculture: 'Promote drought-resistant crops and water conservation techniques in surrounding arid regions.',
        water: 'Revive traditional rainwater harvesting systems like step wells and johads. Implement strict groundwater management.',
        energy: 'Expand solar energy capacity and develop passive cooling techniques for buildings.'
    },
    'lucknow': {
        infrastructure: 'Improve flood management systems and drainage infrastructure. Implement heat-resistant urban design.',
        agriculture: 'Promote climate-resilient agriculture practices in the surrounding fertile plains.',
        water: 'Focus on river restoration and flood management. Implement comprehensive water quality improvement measures.',
        energy: 'Develop renewable energy capacity and energy-efficient building designs to reduce urban heat island effect.'
    }
};

// Function to generate historical weather data for a city
function getHistoricalData(city) {
    // Years from 1998 to 2023
    const years = Array.from({length: 26}, (_, i) => 1998 + i);
    
    // Base values for each city with realistic Indian climate data
    const baseValues = {
        'delhi': { temp: 25.1, rainfall: 650, extremeEvents: 2 },
        'mumbai': { temp: 27.2, rainfall: 2200, extremeEvents: 3 },
        'kolkata': { temp: 26.8, rainfall: 1600, extremeEvents: 4 },
        'chennai': { temp: 28.6, rainfall: 1400, extremeEvents: 3 },
        'bangalore': { temp: 23.5, rainfall: 900, extremeEvents: 1 },
        'hyderabad': { temp: 26.2, rainfall: 820, extremeEvents: 2 },
        'ahmedabad': { temp: 27.5, rainfall: 750, extremeEvents: 3 },
        'pune': { temp: 24.8, rainfall: 720, extremeEvents: 2 },
        'jaipur': { temp: 25.6, rainfall: 650, extremeEvents: 2 },
        'lucknow': { temp: 25.8, rainfall: 950, extremeEvents: 2 }
    };
    
    // Temperature trends (warming)
    const tempTrends = {
        'delhi': 0.05,      // +1.25°C over 25 years
        'mumbai': 0.03,     // +0.75°C over 25 years
        'kolkata': 0.04,    // +1.00°C over 25 years
        'chennai': 0.038,   // +0.95°C over 25 years
        'bangalore': 0.042, // +1.05°C over 25 years
        'hyderabad': 0.046, // +1.15°C over 25 years
        'ahmedabad': 0.055, // +1.37°C over 25 years
        'pune': 0.040,      // +1.00°C over 25 years
        'jaipur': 0.052,    // +1.30°C over 25 years
        'lucknow': 0.048    // +1.20°C over 25 years
    };
    
    // Rainfall variability trends
    const rainfallTrends = {
        'delhi': { trend: -0.2, variability: 150 },       // Slight decrease with high variability
        'mumbai': { trend: 4, variability: 400 },         // Increase with high variability
        'kolkata': { trend: 1.5, variability: 300 },      // Slight increase with variability
        'chennai': { trend: -2, variability: 350 },       // Decrease with high variability
        'bangalore': { trend: -1.8, variability: 200 },   // Decrease with moderate variability
        'hyderabad': { trend: -0.5, variability: 180 },   // Slight decrease with moderate variability
        'ahmedabad': { trend: -1.0, variability: 170 },   // Decrease with moderate variability
        'pune': { trend: -0.8, variability: 160 },        // Slight decrease with moderate variability
        'jaipur': { trend: -1.5, variability: 140 },      // Decrease with moderate variability
        'lucknow': { trend: -0.3, variability: 200 }      // Slight decrease with high variability
    };
    
    // Extreme event trends (increasing)
    const extremeTrends = {
        'delhi': 0.15,      // Increasing trend of extreme events
        'mumbai': 0.2,
        'kolkata': 0.18,
        'chennai': 0.22,
        'bangalore': 0.12,
        'hyderabad': 0.16,
        'ahmedabad': 0.19,
        'pune': 0.14,
        'jaipur': 0.17,
        'lucknow': 0.16
    };
    
    // Generate data with trends and some variability
    const temperature = years.map((year, index) => {
        // Add trend + some natural variability
        return (baseValues[city].temp + (index * tempTrends[city]) + (Math.random() * 0.6 - 0.3)).toFixed(1);
    });
    
    const rainfall = years.map((year, index) => {
        // Add trend + cyclical pattern + significant variability
        const cyclical = Math.sin(index / 3) * (rainfallTrends[city].variability / 3);
        return Math.round(baseValues[city].rainfall + (index * rainfallTrends[city].trend) + cyclical + (Math.random() * rainfallTrends[city].variability - rainfallTrends[city].variability/2));
    });
    
    const extremeEvents = years.map((year, index) => {
        // Round to integers with increasing trend
        return Math.max(0, Math.round(baseValues[city].extremeEvents + (index * extremeTrends[city]) + (Math.random() * 1.5 - 0.5)));
    });
    
    return {
        years,
        temperature,
        rainfall,
        extremeEvents
    };
}

// Function to generate prediction data for a city
function getPredictionData(city, period) {
    // Define the prediction years based on period
    let predictionYears;
    switch (period) {
        case 'short':
            predictionYears = Array.from({length: 5}, (_, i) => 2024 + i);
            break;
        case 'medium':
            predictionYears = Array.from({length: 10}, (_, i) => 2024 + i);
            break;
        case 'long':
            predictionYears = Array.from({length: 25}, (_, i) => 2024 + i);
            break;
        default:
            predictionYears = Array.from({length: 5}, (_, i) => 2024 + i);
    }
    
    // Latest historical data to start predictions
    const historicalData = getHistoricalData(city);
    const lastTemp = parseFloat(historicalData.temperature[historicalData.temperature.length - 1]);
    const lastRainfall = historicalData.rainfall[historicalData.rainfall.length - 1];
    
    // Temperature prediction factors based on climate models
    const tempFactors = {
        'short': {
            'delhi': 0.06,
            'mumbai': 0.04,
            'kolkata': 0.055,
            'chennai': 0.05,
            'bangalore': 0.045,
            'hyderabad': 0.058,
            'ahmedabad': 0.065,
            'pune': 0.048,
            'jaipur': 0.062,
            'lucknow': 0.057
        },
        'medium': {
            'delhi': 0.07,
            'mumbai': 0.05,
            'kolkata': 0.065,
            'chennai': 0.06,
            'bangalore': 0.055,
            'hyderabad': 0.068,
            'ahmedabad': 0.075,
            'pune': 0.058,
            'jaipur': 0.072,
            'lucknow': 0.067
        },
        'long': {
            'delhi': 0.08,
            'mumbai': 0.06,
            'kolkata': 0.075,
            'chennai': 0.07,
            'bangalore': 0.065,
            'hyderabad': 0.078,
            'ahmedabad': 0.085,
            'pune': 0.068,
            'jaipur': 0.082,
            'lucknow': 0.077
        }
    };
    
    // Rainfall prediction factors
    const rainfallFactors = {
        'short': {
            'delhi': -0.4,
            'mumbai': 6,
            'kolkata': 2.5,
            'chennai': -2.5,
            'bangalore': -2.5,
            'hyderabad': -1.0,
            'ahmedabad': -1.2,
            'pune': -1.0,
            'jaipur': -1.8,
            'lucknow': -0.6
        },
        'medium': {
            'delhi': -0.5,
            'mumbai': 8,
            'kolkata': 3.5,
            'chennai': -3.0,
            'bangalore': -3.0,
            'hyderabad': -1.5,
            'ahmedabad': -1.6,
            'pune': -1.4,
            'jaipur': -2.2,
            'lucknow': -0.8
        },
        'long': {
            'delhi': -0.7,
            'mumbai': 12,
            'kolkata': 5.0,
            'chennai': -4.0,
            'bangalore': -4.5,
            'hyderabad': -2.5,
            'ahmedabad': -2.7,
            'pune': -2.4,
            'jaipur': -3.0,
            'lucknow': -1.2
        }
    };
    
    // Generate prediction data
    const temperature = predictionYears.map((year, index) => {
        return (lastTemp + (index * tempFactors[period][city]) + (Math.random() * 0.3 - 0.15)).toFixed(1);
    });
    
    const rainfall = predictionYears.map((year, index) => {
        const cyclical = Math.sin(index / 3) * 50;
        return Math.round(lastRainfall + (index * rainfallFactors[period][city]) + cyclical + (Math.random() * 100 - 50));
    });
    
    // Prediction summaries
    const summaries = {
        'short': {
            'delhi': 'Delhi is projected to experience continued warming at an accelerated rate, with average temperatures rising by approximately 0.3°C over the next 5 years. Annual rainfall is expected to decrease slightly, with more extreme distribution - longer dry periods punctuated by intense rainfall events. Heat waves are likely to become more frequent and intense.',
            'mumbai': 'Mumbai is projected to see moderate warming of approximately 0.2°C over the next 5 years. More concerning is the predicted increase in extreme rainfall events, with annual rainfall becoming more concentrated in fewer, more intense episodes. Rising sea levels will exacerbate coastal flooding risks during monsoon season.',
            'kolkata': 'Kolkata is expected to warm by approximately 0.25°C over the next 5 years. Rainfall patterns are likely to become more erratic, with a slight increase in total annual precipitation but more concentrated in heavy downpour events. The risk of urban flooding is projected to increase significantly.',
            'chennai': 'Chennai is projected to experience warming of about 0.25°C over the next 5 years. Rainfall patterns are expected to become increasingly erratic, with longer dry periods and more concentrated heavy rainfall events. Water scarcity during non-monsoon months may become more severe.',
            'bangalore': 'Bangalore is expected to warm by approximately 0.22°C over the next 5 years. Annual rainfall is projected to decrease slightly, with more variable distribution throughout the year. Water stress periods are likely to become more frequent and prolonged.',
            'hyderabad': 'Hyderabad is projected to warm by approximately 0.28°C over the next 5 years. Rainfall patterns are expected to become more erratic with a slight decrease in total annual precipitation. More frequent and intense heat waves are anticipated during summer months.',
            'ahmedabad': 'Ahmedabad is projected to warm by approximately 0.32°C over the next 5 years, faster than the national average. Summer temperatures are likely to become more extreme, with more days exceeding 45°C. Annual rainfall is expected to decrease slightly with increasing variability, exacerbating water stress.',
            'pune': 'Pune is expected to warm by approximately 0.24°C over the next 5 years. The city is likely to experience more erratic rainfall patterns with a slight decrease in annual precipitation. The frequency of heavy rainfall events causing urban flooding is projected to increase.',
            'jaipur': 'Jaipur is projected to warm by approximately 0.30°C over the next 5 years. Annual rainfall is expected to decrease moderately, with longer dry periods and more concentrated rainfall events. Heat waves are likely to become more frequent and intense, particularly in the summer months.',
            'lucknow': 'Lucknow is expected to warm by approximately 0.28°C over the next 5 years. Rainfall patterns are likely to become more variable with a slight decrease in annual precipitation. The city may experience more frequent extreme weather events, including heat waves and heavy rainfall episodes.'
        },
        'medium': {
            'delhi': 'Delhi is projected to warm by approximately 0.7°C over the next decade. Summer maximum temperatures are likely to increase more rapidly than winter minimums. Annual rainfall may decrease by 5-8%, with longer dry periods and more concentrated heavy rainfall events. The frequency of heat waves is expected to increase significantly.',
            'mumbai': 'Mumbai is expected to warm by approximately 0.5°C over the next decade. Annual rainfall is projected to increase by 8-10%, but with greater concentration in extreme events. Sea level rise of 5-8cm is anticipated, increasing vulnerability to storm surges and coastal flooding.',
            'kolkata': 'Kolkata is projected to warm by approximately 0.65°C over the next decade. Annual rainfall is expected to increase by 3-7%, with more extreme precipitation events. The city faces increasing risks from tropical cyclones and urban flooding as rainfall intensity increases.',
            'chennai': 'Chennai is expected to warm by approximately 0.6°C over the next decade. Rainfall patterns may become increasingly erratic, with longer dry periods and more concentrated heavy rainfall events. Water management will become increasingly challenging.',
            'bangalore': 'Bangalore is projected to warm by approximately 0.55°C over the next decade. Annual rainfall may decrease by 5-7%, with more erratic distribution. Water stress is expected to intensify, particularly during non-monsoon months.',
            'hyderabad': 'Hyderabad is projected to warm by approximately 0.68°C over the next decade. Annual rainfall may decrease slightly (2-5%), with more erratic distribution. Increasing intensity and frequency of heat waves will pose significant challenges.',
            'ahmedabad': 'Ahmedabad is projected to warm by approximately 0.75°C over the next decade. The city is likely to experience a significant increase in extreme heat days, potentially exceeding 50 days above 40°C annually by 2034. Annual rainfall may decrease by 6-8%, with more variable patterns.',
            'pune': 'Pune is expected to warm by approximately 0.58°C over the next decade. Annual rainfall is projected to decrease by 4-6%, with more erratic distribution. Water stress in surrounding agricultural areas may increase, affecting the city\'s food security.',
            'jaipur': 'Jaipur is projected to warm by approximately 0.72°C over the next decade. Annual rainfall may decrease by 8-10%, exacerbating water scarcity issues. The number of extreme heat days could increase by 30-40% compared to the previous decade.',
            'lucknow': 'Lucknow is expected to warm by approximately 0.67°C over the next decade. Monsoon patterns are likely to become increasingly unpredictable, with potential shifts in onset and withdrawal. Air quality issues may intensify, particularly during winter months.'
        },
        'long': {
            'delhi': 'Delhi could experience substantial warming of 1.5-2.0°C over the next 25 years under current emissions scenarios. Summer temperatures may regularly exceed 48°C by 2045-2050. Annual rainfall patterns could shift dramatically with 10-15% overall reduction but more extreme events. Prolonged heat waves and drought conditions are likely to become common.',
            'mumbai': 'Mumbai may warm by 1.0-1.5°C over the next 25 years. Sea level rise of 15-25cm threatens significant portions of coastal areas. Annual rainfall could increase by 15-20%, but with greater intensity and unpredictability. Extreme rainfall events (>200mm/day) may become twice as frequent by 2050.',
            'kolkata': 'Kolkata faces warming of 1.2-1.8°C over the next 25 years. Combined with sea level rise of 20-30cm, this poses significant threats to low-lying areas. Tropical cyclone intensity may increase, with heavier associated rainfall. Annual precipitation could increase by 10-15%, with more extreme distribution.',
            'chennai': 'Chennai may experience warming of 1.2-1.7°C over the next 25 years. Rainfall patterns are expected to become increasingly erratic, with more intense dry periods and more concentrated monsoon rainfall. Water scarcity may become a chronic issue by the 2040s.',
            'bangalore': 'Bangalore could warm by 1.1-1.6°C over the next 25 years. The city may face chronic water stress as annual rainfall potentially decreases by 10-15% with heightened variability. Groundwater depletion is likely to accelerate under current usage patterns.',
            'hyderabad': 'Hyderabad may warm by 1.3-1.9°C over the next 25 years. Annual rainfall patterns could shift significantly, with 5-10% overall reduction but more unpredictable distribution. Extended heat waves exceeding 45°C may become common by the 2040s.',
            'ahmedabad': 'Ahmedabad may experience substantial warming of 1.7-2.1°C over the next 25 years. Summer temperatures could regularly exceed 50°C by the 2040s. Annual rainfall may decrease by 15-20%, severely impacting water resources. Heat-related mortality could increase significantly without major adaptation measures.',
            'pune': 'Pune could warm by 1.2-1.7°C over the next 25 years. Annual rainfall may decrease by 10-15%, with more variability and intensity. The city\'s water supply systems will face significant challenges, potentially affecting its growth as an educational and technological hub.',
            'jaipur': 'Jaipur may experience warming of 1.6-2.0°C over the next 25 years. Annual rainfall could decrease by 15-25%, severely impacting water availability. Desertification processes may accelerate in surrounding regions, affecting agricultural productivity and food security.',
            'lucknow': 'Lucknow could warm by 1.4-1.9°C over the next 25 years. Significant changes in the monsoon pattern may lead to more unpredictable agricultural seasons. Heat waves could become more intense and prolonged, with potential implications for public health and energy demand.'
        }
    };
    
    return {
        years: predictionYears,
        temperature,
        rainfall,
        summary: summaries[period][city]
    };
} 