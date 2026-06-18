const NWS_API_ORIGIN = "https://api.weather.gov";
const WEATHER_REFRESH_MS = 30 * 60 * 1000;

const weatherLocations = [
  { city: "Benson", state: "NC", lat: 35.3815, lon: -78.5486 },
  { city: "Raleigh", state: "NC", lat: 35.7796, lon: -78.6382 },
  { city: "Fayetteville", state: "NC", lat: 35.0527, lon: -78.8784 },
  { city: "Greensboro", state: "NC", lat: 36.0726, lon: -79.792 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lon: -80.8431 },
];

const skyIcons = {
  sunny: `
    <svg viewBox="0 0 64 64" role="img" aria-label="Sunny">
      <circle cx="32" cy="32" r="12" fill="currentColor"></circle>
      <path d="M32 6v10M32 48v10M6 32h10M48 32h10M13.6 13.6l7.1 7.1M43.3 43.3l7.1 7.1M50.4 13.6l-7.1 7.1M20.7 43.3l-7.1 7.1" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"></path>
    </svg>`,
  cloudy: `
    <svg viewBox="0 0 64 64" role="img" aria-label="Cloudy">
      <path d="M23 45h25a10 10 0 0 0 0-20h-1A16 16 0 0 0 17 29a8 8 0 0 0 6 16Z" fill="currentColor" opacity=".92"></path>
      <path d="M14 48h29a8 8 0 0 0 0-16h-2a13 13 0 0 0-24-4 10 10 0 0 0-3 20Z" fill="currentColor" opacity=".46"></path>
    </svg>`,
  rainy: `
    <svg viewBox="0 0 64 64" role="img" aria-label="Rain">
      <path d="M22 34h26a9 9 0 0 0 0-18h-1A15 15 0 0 0 19 20a8 8 0 0 0 3 14Z" fill="currentColor" opacity=".82"></path>
      <path d="M20 43l-4 9M33 43l-4 9M46 43l-4 9" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"></path>
    </svg>`,
  hazard: `
    <svg viewBox="0 0 64 64" role="img" aria-label="Hazard weather">
      <path d="M22 36h26a9 9 0 0 0 0-18h-1A15 15 0 0 0 19 22a8 8 0 0 0 3 14Z" fill="currentColor" opacity=".68"></path>
      <path d="M34 34l-8 14h10l-5 10 13-17H34l5-7Z" fill="currentColor"></path>
    </svg>`,
};

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function isStaticDeployment() {
  return window.location.protocol === "file:" || window.location.hostname.endsWith(".github.io");
}

function renderHomeOverview() {
  const { projects } = window.PulseDeckData;
  const onSchedule = projects.filter((project) => project.status === "Active / On Schedule").length;
  const atRisk = projects.filter((project) => project.status === "Under Review").length;
  const delayed = projects.filter((project) => project.status === "Delayed / Behind Schedule").length;
  const syncState = window.PulseDeckSync.read();

  document.getElementById("homeTotalContracts").textContent = projects.length;
  document.getElementById("homeOnSchedule").textContent = onSchedule;
  document.getElementById("homeAtRisk").textContent = atRisk;
  document.getElementById("homeDelayed").textContent = delayed;
  document.getElementById("homeSyncSummary").textContent =
    `HiCAMS updated ${window.PulseDeckSync.formatSyncDate(syncState.lastSyncAt)}`;
}

function preservePreviewNavigation() {
  if (!window.location.pathname.startsWith("/preview")) return;
  document.querySelectorAll('a[href="project-dashboard/"]').forEach((link) => {
    link.href = "/preview/project-dashboard/";
  });
}

function initWeatherCanvas() {
  const refreshButton = document.getElementById("refreshWeather");
  refreshButton?.addEventListener("click", loadWeatherCanvas);
  loadWeatherCanvas();
  window.setInterval(loadWeatherCanvas, WEATHER_REFRESH_MS);
}

async function loadWeatherCanvas() {
  const weatherUpdated = document.getElementById("weatherUpdated");
  const refreshButton = document.getElementById("refreshWeather");

  if (weatherUpdated) weatherUpdated.textContent = "Updating NWS";
  refreshButton?.classList.add("is-loading");
  refreshButton?.setAttribute("aria-busy", "true");
  setWeatherLoadingState(true);

  const weatherResults = await Promise.allSettled(
    weatherLocations.map((location) => fetchNwsForecast(location))
  );

  weatherResults.forEach((result, index) => {
    const location = weatherLocations[index];
    if (result.status === "fulfilled") {
      renderWeatherCard(location.city, result.value);
    } else {
      renderWeatherError(location.city, result.reason);
    }
  });

  const successCount = weatherResults.filter((result) => result.status === "fulfilled").length;
  const updatedTime = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  setWeatherLoadingState(false);
  refreshButton?.classList.remove("is-loading");
  refreshButton?.removeAttribute("aria-busy");

  if (weatherUpdated) {
    weatherUpdated.textContent = successCount
      ? `${updatedTime} · ${successCount}/${weatherLocations.length} reporting`
      : "NWS unavailable";
  }
}

async function fetchNwsForecast(location) {
  const pointUrl = `${NWS_API_ORIGIN}/points/${location.lat},${location.lon}`;
  const pointData = await fetchNwsJson(pointUrl);
  const forecastUrl = pointData?.properties?.forecast;

  if (!forecastUrl) throw new Error(`Forecast URL missing for ${location.city}`);

  const forecastData = await fetchNwsJson(forecastUrl);
  const currentPeriod = forecastData?.properties?.periods?.[0];

  if (!currentPeriod) throw new Error(`Forecast periods missing for ${location.city}`);
  return currentPeriod;
}

async function fetchNwsJson(url) {
  const requestUrl = isStaticDeployment() ? url : buildNwsProxyUrl(url);

  try {
    return await fetchJson(requestUrl);
  } catch (error) {
    if (requestUrl !== url) return fetchJson(url);
    throw error;
  }
}

function buildNwsProxyUrl(url) {
  const nwsUrl = new URL(url);
  if (nwsUrl.origin !== NWS_API_ORIGIN) throw new Error("Unexpected NWS forecast URL.");
  return `/api/nws?${new URLSearchParams({ url: nwsUrl.href }).toString()}`;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/geo+json, application/json" },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function renderWeatherCard(city, period) {
  const card = findWeatherCard(city);
  if (!card) return;

  const skin = getWeatherSkin(period.shortForecast, period.icon);
  card.className = `material-card weather-card compact-weather-card ${skin.className}`;
  card.querySelector(".weather-temp").textContent = `${period.temperature}\u00b0${period.temperatureUnit}`;
  card.querySelector(".weather-sky-element").innerHTML = skin.icon;
  card.querySelector(".weather-condition").textContent = period.shortForecast;
  card.querySelector(".weather-meta").textContent =
    `${period.windSpeed || "Wind pending"} ${period.windDirection || ""}`.trim();
}

function renderWeatherError(city, error) {
  const card = findWeatherCard(city);
  if (!card) return;

  card.className = "material-card weather-card compact-weather-card is-hazard";
  card.querySelector(".weather-temp").textContent = "--\u00b0F";
  card.querySelector(".weather-sky-element").innerHTML = skyIcons.hazard;
  card.querySelector(".weather-condition").textContent = "Forecast unavailable";
  card.querySelector(".weather-meta").textContent = error?.message || "NWS request failed";
}

function findWeatherCard(city) {
  return document.querySelector(`.weather-card[data-city="${city}"]`);
}

function setWeatherLoadingState(isLoading) {
  document.querySelectorAll(".weather-card").forEach((card) => {
    card.classList.toggle("loading", isLoading);
  });
}

function getWeatherSkin(shortForecast = "", iconUrl = "") {
  const text = `${shortForecast} ${iconUrl}`.toLowerCase();
  if (text.includes("rain") || text.includes("showers") || text.includes("thunder")) {
    return { className: "is-rainy", icon: skyIcons.rainy };
  }
  if (text.includes("sunny") || text.includes("clear")) {
    return { className: "is-sunny", icon: skyIcons.sunny };
  }
  if (text.includes("cloudy") || text.includes("overcast")) {
    return { className: "is-cloudy", icon: skyIcons.cloudy };
  }
  if (text.includes("fog") || text.includes("wind") || text.includes("snow") || text.includes("hazard")) {
    return { className: "is-hazard", icon: skyIcons.hazard };
  }
  return { className: "is-cloudy", icon: skyIcons.cloudy };
}

function bootHome() {
  preservePreviewNavigation();
  renderHomeOverview();
  initWeatherCanvas();
  refreshIcons();
}

document.addEventListener("DOMContentLoaded", bootHome);
