// Get organization name from URL fragment
const hash = window.location.hash.substring(1);
document.getElementById("organization-name").innerText = hash || ">>tu powinna być nazwa Twojej organizacji<<";

// Initialize calendar and name days
const today = new Date();
document.getElementById("calendar").innerText =
    today.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// Initialize and fetch namedays
    const url = 'https://nameday.abalin.net/api/V1/today';
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const params = {
      country: 'pl',
      timezone: 'Europe/Warsaw'
    };

    fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(params)  // Send the parameters as JSON
    })
  .then(response => response.json())
    .then(data => {
        const names = data.nameday.pl;
        document.getElementById("name-days").innerText = `Imieniny obchodzą: ${names}`;
    })
    .catch(error => {
        console.error('Error fetching name days:', error);
        document.getElementById("name-days").innerText = 'Imieniny: Brak danych';
    });

// Fetch weather data from Open-Meteo
function fetchWeather() {
    const latitude = 52.2297; // Warsaw latitude
    const longitude = 21.0122; // Warsaw longitude
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Europe/Warsaw`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const weather = data.current_weather;
            document.getElementById("weather-widget").innerHTML = `
                <h2 class="text-xl">Aktualna pogoda w Warszawie:</h2>
                <p>Temperatura: ${weather.temperature} °C</p>
                <p>Wiatr: ${weather.windspeed} km/h</p>
                <p>Stan: ${weather.weathercode}</p>
            `;
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            document.getElementById("weather-widget").innerText = 'Pogoda: Brak danych';
        });
}

fetchWeather(); // Call function to fetch weather

// Digital clock function
function updateDigitalClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById("digital-clock").textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateDigitalClock, 1000);
updateDigitalClock();  // Initial call to set clock immediately