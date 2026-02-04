const key = "b92e57938eaebc6ded1fcf3a2f5b4bc3";

const cityName = document.getElementById("cityName");
const temp = document.getElementById("temp");
const desc = document.getElementById("desc");
const extra = document.getElementById("extra");
const sun = document.getElementById("sun");
const icon = document.getElementById("icon");

const forecastBox = document.getElementById("forecast");
const hourlyBox = document.getElementById("hourly");

const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");

const toggle = document.getElementById("themeToggle");

const ctx = document.getElementById("tempChart");
let chart; // chart instance

/* ---------------- Loader & Error ---------------- */

function showLoader(v) {
  loader.classList.toggle("hidden", !v);
}

function showError(msg) {
  errorBox.innerText = msg;
  errorBox.classList.remove("hidden");
}

function hideError() {
  errorBox.classList.add("hidden");
}

/* ---------------- Current Weather ---------------- */

async function getWeatherByCity(city) {
  try {
    showLoader(true);
    hideError();

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}`
    );

    if (!res.ok) throw new Error("City not found");

    const data = await res.json();

    updateCurrent(data);
    getForecast(city);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoader(false);
  }
}

function updateCurrent(data) {
  const c = (data.main.temp - 273.15).toFixed(1);
  const feels = (data.main.feels_like - 273.15).toFixed(1);

  cityName.innerText = `${data.name}, ${data.sys.country}`;
  temp.innerText = `${c}°C`;
  desc.innerText = data.weather[0].description;

  extra.innerText =
    `Feels like ${feels}°C • Humidity ${data.main.humidity}% • Wind ${data.wind.speed} m/s`;

  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();
  sun.innerText = `Sunrise: ${sunrise} • Sunset: ${sunset}`;

  icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

/* ---------------- Forecast + Hourly + Chart ---------------- */

async function getForecast(city) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}`
  );
  const data = await res.json();

  forecastBox.innerHTML = "";
  hourlyBox.innerHTML = "";

  const temps = [];
  const labels = [];

  /* ⭐ Hourly forecast (next 12 items ≈ 36 hours) */
  for (let i = 0; i < 12; i++) {
    const item = data.list[i];
    const t = (item.main.temp - 273.15).toFixed(0);
    const hour = new Date(item.dt_txt).getHours();

    hourlyBox.innerHTML += `
      <div class="hour">
        <p>${hour}:00</p>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png"/>
        <p>${t}°C</p>
      </div>
    `;

    temps.push(t);
    labels.push(`${hour}:00`);
  }

  /* ⭐ 5-day forecast cards */
  for (let i = 0; i < data.list.length; i += 8) {
    const item = data.list[i];

    const min = (item.main.temp_min - 273.15).toFixed(0);
    const max = (item.main.temp_max - 273.15).toFixed(0);

    forecastBox.innerHTML += `
      <div class="day">
        <p>${new Date(item.dt_txt).toDateString().slice(0, 10)}</p>
        <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png"/>
        <p>${min}° / ${max}°C</p>
      </div>
    `;
  }

  /* ⭐ Temperature Chart */
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Next Hours Temp (°C)",
          data: temps,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: false } },
    },
  });
}

/* ---------------- Search ---------------- */

function searchWeather() {
  const city = document.getElementById("city").value.trim();
  if (city) getWeatherByCity(city);
}

/* Enter key search */
document.getElementById("city").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchWeather();
});

/* ---------------- Current Location ---------------- */

navigator.geolocation.getCurrentPosition(async (pos) => {
  const { latitude, longitude } = pos.coords;

  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${key}`
  );
  const data = await res.json();

  updateCurrent(data);
  getForecast(data.name);
});

/* ---------------- Theme Toggle ---------------- */

toggle.onclick = () => {
  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");
  localStorage.setItem("theme", isLight);

  toggle.innerText = isLight ? "🌙" : "☀️";
};

/* Load saved theme */
if (localStorage.getItem("theme") === "true") {
  document.body.classList.add("light");
  toggle.innerText = "🌙";
} else {
  toggle.innerText = "☀️";
}
