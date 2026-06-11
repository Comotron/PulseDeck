const NWS_USER_AGENT = "(EverythingSiteCommandCenter, contact@example.com)";
const NWS_HEADERS = {
  "Accept": "application/geo+json",
  "User-Agent": NWS_USER_AGENT
};

// Update cadence lives here so future widgets can tune refresh timing without touching render logic.
const WEATHER_REFRESH_MS = 30 * 60 * 1000;
const RESEARCH_STORAGE_KEY = "everything-site-research-log-v2";

const weatherLocations = [
  { city: "Benson", state: "NC", lat: 35.3815, lon: -78.5486 },
  { city: "Raleigh", state: "NC", lat: 35.7796, lon: -78.6382 },
  { city: "Fayetteville", state: "NC", lat: 35.0527, lon: -78.8784 },
  { city: "Greensboro", state: "NC", lat: 36.0726, lon: -79.7920 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lon: -80.8431 }
];

const marketPulse = [
  { symbol: "SPY", label: "S&P 500 ETF", change: 0.42 },
  { symbol: "QQQ", label: "Nasdaq 100 ETF", change: 0.68 },
  { symbol: "DIA", label: "Dow ETF", change: -0.18 },
  { symbol: "IWM", label: "Russell 2000 ETF", change: 0.24 }
];

const routeStatuses = [
  { label: "I-40 / Raleigh", status: "Clear", tone: "positive" },
  { label: "I-95 / Fayetteville", status: "Watch", tone: "warning" },
  { label: "CLT access", status: "Normal", tone: "positive" }
];

const projectSignals = [
  { title: "Raleigh BRT Southern Corridor", phase: "Planning", progress: 62 },
  { title: "Fayetteville corridor redevelopment", phase: "Tracking", progress: 44 },
  { title: "Benson utility expansion map", phase: "Research", progress: 28 }
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
    </svg>`
};

const dayLabel = document.querySelector("#dayLabel");
const timeLabel = document.querySelector("#timeLabel");
const globalSearch = document.querySelector("#globalSearch");
const weatherUpdated = document.querySelector("#weatherUpdated");
const refreshWeatherButton = document.querySelector("#refreshWeather");
const marketPulseList = document.querySelector("#marketPulseList");
const routeStatusList = document.querySelector("#routeStatusList");
const projectSignalList = document.querySelector("#projectSignalList");
const researchLogForm = document.querySelector("#researchLogForm");
const researchLogList = document.querySelector("#researchLogList");

function initDashboard() {
  initClock();
  initWeatherCanvas();
  initMarketPulse();
  initRouteMonitor();
  initInfrastructureSignals();
  initResearchLog();
  initSearch();
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function initClock() {
  updateClock();
  setInterval(updateClock, 30000);
}

function updateClock() {
  const now = new Date();
  dayLabel.textContent = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
  timeLabel.textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function initWeatherCanvas() {
  refreshWeatherButton.addEventListener("click", () => loadWeatherCanvas());
  loadWeatherCanvas();
  setInterval(loadWeatherCanvas, WEATHER_REFRESH_MS);
}

async function loadWeatherCanvas() {
  weatherUpdated.textContent = "Updating NWS";
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

  setWeatherLoadingState(false);
  weatherUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  })}`;
}

async function fetchNwsForecast(location) {
  const pointUrl = `https://api.weather.gov/points/${location.lat},${location.lon}`;
  const pointData = await fetchJson(pointUrl);
  const forecastUrl = pointData?.properties?.forecast;

  if (!forecastUrl) {
    throw new Error(`Forecast URL missing for ${location.city}`);
  }

  const forecastData = await fetchJson(forecastUrl);
  const currentPeriod = forecastData?.properties?.periods?.[0];

  if (!currentPeriod) {
    throw new Error(`Forecast periods missing for ${location.city}`);
  }

  return currentPeriod;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: NWS_HEADERS });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

function renderWeatherCard(city, period) {
  const card = findWeatherCard(city);
  const skin = getWeatherSkin(period.shortForecast, period.icon);

  card.className = `glass weather-card ${skin.className}`;
  card.querySelector(".weather-temp").textContent = `${period.temperature}\u00b0${period.temperatureUnit}`;
  card.querySelector(".weather-sky-element").innerHTML = skin.icon;
  card.querySelector(".weather-condition").textContent = period.shortForecast;
  card.querySelector(".weather-meta").textContent = `${period.windSpeed || "Wind pending"} ${period.windDirection || ""}`.trim();
  card.dataset.searchText = `${city} ${period.shortForecast} ${period.temperature} ${period.windSpeed || ""}`;
}

function renderWeatherError(city, error) {
  const card = findWeatherCard(city);
  card.className = "glass weather-card is-hazard";
  card.querySelector(".weather-temp").textContent = "--\u00b0F";
  card.querySelector(".weather-sky-element").innerHTML = skyIcons.hazard;
  card.querySelector(".weather-condition").textContent = "Forecast unavailable";
  card.querySelector(".weather-meta").textContent = error?.message || "NWS request failed";
  card.dataset.searchText = `${city} forecast unavailable`;
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

function initMarketPulse() {
  marketPulseList.innerHTML = marketPulse
    .map((item) => {
      const direction = item.change >= 0 ? "positive" : "critical";
      const sign = item.change >= 0 ? "+" : "";
      return `
        <div class="market-row">
          <div>
            <strong>${item.symbol}</strong>
            <span>${item.label}</span>
          </div>
          <b class="${direction}">${sign}${item.change.toFixed(2)}%</b>
        </div>
      `;
    })
    .join("");
}

function initRouteMonitor() {
  routeStatusList.innerHTML = routeStatuses
    .map((route) => `
      <div class="route-status ${route.tone}">
        <span>${route.label}</span>
        <strong>${route.status}</strong>
      </div>
    `)
    .join("");
}

function initInfrastructureSignals() {
  projectSignalList.innerHTML = projectSignals
    .map((project) => `
      <div class="project-row">
        <div class="project-row-top">
          <strong>${project.title}</strong>
          <span>${project.phase}</span>
        </div>
        <div class="progress-track">
          <span style="width: ${project.progress}%"></span>
        </div>
      </div>
    `)
    .join("");
}

function initResearchLog() {
  renderResearchLogs(readResearchLogs());

  researchLogForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(researchLogForm);
    const nextLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: formData.get("title").trim(),
      category: formData.get("category"),
      body: formData.get("body").trim(),
      createdAt: new Date().toISOString()
    };

    if (!nextLog.title || !nextLog.body) {
      return;
    }

    const logs = [nextLog, ...readResearchLogs()].slice(0, 12);
    writeResearchLogs(logs);
    renderResearchLogs(logs);
    researchLogForm.reset();
    refreshIcons();
  });
}

function readResearchLogs() {
  try {
    return JSON.parse(localStorage.getItem(RESEARCH_STORAGE_KEY)) || getDefaultResearchLogs();
  } catch {
    return getDefaultResearchLogs();
  }
}

function writeResearchLogs(logs) {
  localStorage.setItem(RESEARCH_STORAGE_KEY, JSON.stringify(logs));
}

function getDefaultResearchLogs() {
  return [
    {
      id: "seed-raleigh",
      title: "Raleigh corridor funding watch",
      category: "Infrastructure",
      body: "Track council agenda references, grant cycles, and right-of-way notes.",
      createdAt: new Date().toISOString()
    },
    {
      id: "seed-benson",
      title: "Benson development signal baseline",
      category: "Research",
      body: "Create a reference file for zoning notices, utilities, and parcel movement.",
      createdAt: new Date().toISOString()
    }
  ];
}

function renderResearchLogs(logs) {
  researchLogList.innerHTML = logs
    .map((log) => `
      <article class="research-log-entry" data-search-item data-search-text="${escapeAttribute(`${log.title} ${log.category} ${log.body}`)}">
        <div>
          <strong>${escapeHtml(log.title)}</strong>
          <span>${escapeHtml(log.category)} &middot; ${formatLogTime(log.createdAt)}</span>
        </div>
        <p>${escapeHtml(log.body)}</p>
      </article>
    `)
    .join("");
}

function formatLogTime(value) {
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function initSearch() {
  globalSearch.addEventListener("input", () => {
    const query = globalSearch.value.trim().toLowerCase();
    document.querySelectorAll("[data-search-item]").forEach((item) => {
      const searchable = (item.dataset.searchText || item.textContent || "").toLowerCase();
      item.toggleAttribute("hidden", Boolean(query) && !searchable.includes(query));
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

document.addEventListener("DOMContentLoaded", initDashboard);
