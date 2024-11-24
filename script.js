let latitude = 52.2297; // Default latitude for Warsaw
let longitude = 21.0122; // Default longitude for Warsaw

function  toTextualDescription(degree){
    if (degree>337.5) return 'Północny';
    if (degree>292.5) return 'Północno-Zachodni';
    if(degree>247.5) return 'Zachodni';
    if(degree>202.5) return 'Południowo-Zachodni';
    if(degree>157.5) return 'Południowy';
    if(degree>122.5) return 'Południowo-Wchodni';
    if(degree>67.5) return 'Wschodni';
    if(degree>22.5){return 'Północno-Wschodni';}
    return 'Północny';
}

// Function to get current position
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            }
        );
    });
}

// Async function to use await
async function fetchLocation() {
    try {
        const position = await getCurrentPosition();
        latitude = position.latitude;
        longitude = position.longitude;
        return position;
    } catch (error) {
        console.error("Error getting location:", error);
    }
}

// Fetch city name from Open-Meteo
async function getCityName(latitude, longitude) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pl`);
        const data = await response.json();
        const address = data.address;
        console.log(`city data ${address}`);
        return `${(address.city || address.town || address.village)}, ${address.suburb || address.municipality}`;
    } catch (error) {
        console.error("Error fetching city name:", error);
        return "Warszawa";
    }
}

// Fetch nearest river based on coordinates
async function getNearestRiver(latitude, longitude) {
    try {
        const response = await fetch(`https://meteo.imgw.pl/api/geo/v3/revers/all/${latitude}/${longitude}/1`);
        const data = await response.json();
        return data; // Return the river data for further processing if needed
    } catch (error) {
        console.error("Error fetching nearest river:", error);
    }
}

// Fetch weather data
async function fetchWeather(latitude, longitude) {
    const cityName = await getCityName(latitude, longitude);
    //https://api.open-meteo.com/v1/forecast?latitude=52.2297&longitude=21.0122&current_weather=true&timezone=Europe/Warsaw
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=Europe/Warsaw`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const weather = data.current_weather;

        const windDirection = toTextualDescription(weather.winddirection)
        document.getElementById("weather-widget").innerHTML = `
            <h2 class="text-xl">Aktualna pogoda w: ${cityName}:</h2>
            <p>Temperatura: ${weather.temperature} °C</p>
            <p>Wiatr ${windDirection} ${weather.windspeed} km/h</p>
        `;
    } catch (error) {
        document.getElementById("weather-widget").innerText = 'Pogoda: Brak danych';
    }
}

// Get organization name from URL fragment
const hash = window.location.hash.substring(1);
const name = decodeURIComponent(DOMPurify.sanitize(hash));

function home() {
    const location = `${window.location.origin}#MojaOrganizacja`;
    document.getElementById("main").replaceChildren();
    document.getElementById("main").classList.add("max-w-xl");
    document.getElementById("main").innerHTML =
    `
    <div class="text-center text-yellow-400 text-2xl justify-center items-center space-y-10">
        <div class="text-4xl">
            Witaj w Spi***olinie!
        </div>
        <div>
            Aby zobaczyć zegar spi***oliny w adresie URL
            podaj po hashu nazwę swojej organizacji.
        </div>
        <div>
            Jak przedstawiono poniżej:
        </div>
        <a href="${location}" class="text-blue-200 break-all">${location}</a>
    </div>
    `;
}

if (!name) {
    home();
} else {
    document.getElementById("organization-name").innerText = name;

    // Initialize calendar and name days
    const today = new Date();
    document.getElementById("calendar").innerText =
        today.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Initialize and fetch namedays
    const url = 'https://nameday.abalin.net/api/V1/today';

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ country: 'pl', timezone: 'Europe/Warsaw' })
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

    // Fetch weather and nearest river after location is determined
    fetchLocation()
        .then(() => {
            getCityName(latitude, longitude)
            .then(() => {
                fetchWeather(latitude, longitude);
                getNearestRiver(latitude, longitude)
                    .then(riverData => {
                        const {name, ID} = riverData[0].base_catchment;
                        fetch(`https://hydro-back.imgw.pl/list/home/catchment?catchmentCode=${ID}`)
                            .then(data => data.json())
                            .then(data => {
                                const station = data.stations[0];
                                const level = station.currentState.value;
                                let state;
                                switch(station.statusCode){
                                    case "low":
                                        state = "niski";
                                        break;
                                    case "medium":
                                        state = "średni";
                                        break;
                                    case "high":
                                        state = "wysoki";
                                        break;
                                }

                                console.log(data)
                                document.getElementById("water").innerHTML = `
                                    <div>
                                        Stan wody w rzecze ${name} wynosi: ${level}cm - ${state}
                                    </div>
                                    `
                            });
                });
            })
        });
}

// Function to show the cookie popup
function showCookiePopup() {
    document.getElementById('cookie-popup').classList.remove('hidden');
}

// Function to handle accepting cookies
function understood() {
    document.getElementById('cookie-popup').classList.add('hidden');
}
window.onload = () => {
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
};

window.addEventListener("hashchange", function() {
    window.location.reload();
});
window.onload = showCookiePopup;
