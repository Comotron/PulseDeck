const NWS_API_ORIGIN = "https://api.weather.gov";
const NWS_LOCAL_PROXY_ORIGIN = "http://localhost:8787";

// Update cadence lives here so future widgets can tune refresh timing without touching render logic.
const WEATHER_REFRESH_MS = 30 * 60 * 1000;
const MARKET_REFRESH_MS = 60 * 1000;
const TRAVEL_REFRESH_MS = 60 * 1000;
const SPORTS_REFRESH_MS = 60 * 1000;

const weatherLocations = [
  { city: "Benson", state: "NC", lat: 35.3815, lon: -78.5486 },
  { city: "Raleigh", state: "NC", lat: 35.7796, lon: -78.6382 },
  { city: "Fayetteville", state: "NC", lat: 35.0527, lon: -78.8784 },
  { city: "Greensboro", state: "NC", lat: 36.0726, lon: -79.7920 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lon: -80.8431 }
];

const marketHoldings = [
  { symbol: "AAL", label: "American Airlines", group: "Airlines" },
  { symbol: "TSLA", label: "Tesla", group: "Growth" },
  { symbol: "VZ", label: "Verizon", group: "Telecom" },
  { symbol: "NVDA", label: "NVIDIA", group: "AI / Chips" },
  { symbol: "TMUS", label: "T-Mobile US", group: "Telecom" },
  { symbol: "DAL", label: "Delta Air Lines", group: "Airlines" },
  { symbol: "AMZN", label: "Amazon", group: "Mega-cap Tech" }
];

const routeStatuses = [
  { label: "I-40 / Raleigh", status: "Clear", tone: "positive" },
  { label: "I-95 / Fayetteville", status: "Watch", tone: "warning" },
  { label: "CLT access", status: "Normal", tone: "positive" }
];

const travelAirportFallbacks = [
  { icao: "KRDU", iata: "RDU", city: "Raleigh-Durham" },
  { icao: "KCLT", iata: "CLT", city: "Charlotte" },
  { icao: "KFAY", iata: "FAY", city: "Fayetteville" },
  { icao: "KGSO", iata: "GSO", city: "Greensboro" }
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
const weatherUpdated = document.querySelector("#weatherUpdated");
const refreshWeatherButton = document.querySelector("#refreshWeather");
const marketUpdated = document.querySelector("#marketUpdated");
const refreshMarketButton = document.querySelector("#refreshMarket");
const marketFeedDot = document.querySelector("#marketFeedDot");
const marketSummary = document.querySelector("#marketSummary");
const marketPulseList = document.querySelector("#marketPulseList");
const routeStatusList = document.querySelector("#routeStatusList");
const travelUpdated = document.querySelector("#travelUpdated");
const refreshTravelButton = document.querySelector("#refreshTravel");
const travelFeedDot = document.querySelector("#travelFeedDot");
const travelSummary = document.querySelector("#travelSummary");
const airportPulseGrid = document.querySelector("#airportPulseGrid");
const transitPulse = document.querySelector("#transitPulse");
const sportsStatusChip = document.querySelector("#sportsStatusChip");
const sportsUpdated = document.querySelector("#sportsUpdated");
const refreshSportsButton = document.querySelector("#refreshSports");
const sportsFeedDot = document.querySelector("#sportsFeedDot");
const sportsPulseGrid = document.querySelector("#sportsPulseGrid");

let marketRequestInFlight = false;
let travelRequestInFlight = false;
let sportsRequestInFlight = false;

function initDashboard() {
  initClock();
  initWeatherCanvas();
  initSportsPulse();
  initTravelPulse();
  initMarketPulse();
  initRouteMonitor();
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
  const pointUrl = `${NWS_API_ORIGIN}/points/${location.lat},${location.lon}`;
  const pointData = await fetchNwsJson(pointUrl);
  const forecastUrl = pointData?.properties?.forecast;

  if (!forecastUrl) {
    throw new Error(`Forecast URL missing for ${location.city}`);
  }

  const forecastData = await fetchNwsJson(forecastUrl);
  const currentPeriod = forecastData?.properties?.periods?.[0];

  if (!currentPeriod) {
    throw new Error(`Forecast periods missing for ${location.city}`);
  }

  return currentPeriod;
}

async function fetchNwsJson(url) {
  const proxyUrl = buildNwsProxyUrl(url);
  const localProxyUrl = buildNwsProxyUrl(url, { forceLocal: true });

  try {
    return await fetchJson(proxyUrl);
  } catch (error) {
    if (proxyUrl !== localProxyUrl && isMissingNwsProxy(error)) {
      return fetchJson(localProxyUrl);
    }

    throw error;
  }
}

function buildNwsProxyUrl(url, { forceLocal = false } = {}) {
  const nwsUrl = new URL(url);

  if (nwsUrl.origin !== NWS_API_ORIGIN) {
    throw new Error("Unexpected NWS forecast URL.");
  }

  const params = new URLSearchParams({ url: nwsUrl.href });
  const proxyPath = `/api/nws?${params.toString()}`;

  if (forceLocal || window.location.protocol === "file:") {
    return `${NWS_LOCAL_PROXY_ORIGIN}${proxyPath}`;
  }

  return proxyPath;
}

function isMissingNwsProxy(error) {
  return String(error?.message || "").includes("404");
}

async function fetchJson(url, headers = { "Accept": "application/json" }) {
  const response = await fetch(url, { headers });

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
}

function renderWeatherError(city, error) {
  const card = findWeatherCard(city);
  card.className = "glass weather-card is-hazard";
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

function initSportsPulse() {
  if (!sportsPulseGrid || !refreshSportsButton) {
    return;
  }

  renderSportsSkeleton();
  refreshSportsButton.addEventListener("click", () => loadSportsPulse(true));
  loadSportsPulse();
  setInterval(loadSportsPulse, SPORTS_REFRESH_MS);
}

async function loadSportsPulse(force = false) {
  if (sportsRequestInFlight) {
    return;
  }

  sportsRequestInFlight = true;
  setSportsLoadingState(true);

  try {
    if (window.location.protocol === "file:") {
      throw new Error("Start the live hub server to enable sports signals.");
    }

    const cacheParam = force ? "?force=1" : "";
    const data = await fetchJsonWithClientTimeout(`/api/sports${cacheParam}`, 11000);
    renderSportsPulse(data);
  } catch (error) {
    renderSportsError(error);
  } finally {
    sportsRequestInFlight = false;
    setSportsLoadingState(false);
  }
}

async function fetchJsonWithClientTimeout(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Sports provider timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function renderSportsSkeleton() {
  sportsPulseGrid.innerHTML = ["NBA Today", "NBA Stat Signal", "F1 Weekend", "Premier League / FPL"]
    .map((label) => `
      <article class="glass sports-card loading">
        <div class="sports-card-header">
          <div>
            <span class="sports-card-kicker">${escapeHtml(label)}</span>
            <h4>Connecting</h4>
          </div>
          <i data-lucide="${label.includes("F1") ? "gauge" : label.includes("Premier") ? "shield" : "activity"}"></i>
        </div>
        <div class="sports-skeleton-stack">
          <span class="sports-skeleton-line wide"></span>
          <span class="sports-skeleton-line"></span>
          <span class="sports-skeleton-line short"></span>
        </div>
      </article>
    `)
    .join("");
  refreshIcons();
}

function renderSportsPulse(data) {
  const providers = data.providers || {};
  const status = data.status || "cached";

  sportsStatusChip.textContent = formatSportsStatus(status);
  sportsStatusChip.className = `sports-status-chip status-${getSportsStatusTone(status)}`;
  sportsUpdated.textContent = `Updated ${formatSportsTime(data.updatedAt)}`;
  sportsFeedDot.className = getSportsDotClass(status);
  sportsPulseGrid.innerHTML = [
    renderNbaTodayCard(data.nbaGames || [], providers.nbaGames || {}),
    renderNbaSignalCard(data.nbaSignal || {}),
    renderF1Card(data.f1Signal || {}),
    renderEplCard(data.eplSignal || {})
  ].join("");
  refreshIcons();
}

function renderNbaTodayCard(games, provider) {
  const hasKey = !provider.needsApiKey;
  const body = !hasKey
    ? renderSportsEmptyState("Needs API Key", "Add BALLDONTLIE_API_KEY on the server.")
    : games.length
      ? `<div class="sports-ticker-list">${games.slice(0, 4).map(renderNbaGameRow).join("")}</div>`
      : renderSportsEmptyState("No NBA games today", "Stat Signal stays active below.");

  return `
    <article class="glass sports-card sports-card-nba ${provider.needsApiKey ? "needs-key" : ""}">
      <div class="sports-card-header">
        <div>
          <span class="sports-card-kicker">NBA Today</span>
          <h4>Game board</h4>
        </div>
        <span class="sports-mini-chip ${provider.needsApiKey ? "is-key" : "is-live"}">${provider.needsApiKey ? "Needs key" : "Scores"}</span>
      </div>
      ${body}
      <p class="sports-card-foot">${escapeHtml(provider.message || "balldontlie score feed")}</p>
    </article>
  `;
}

function renderNbaGameRow(game) {
  const awayLeader = game.away?.isLeader ? " is-leading" : "";
  const homeLeader = game.home?.isLeader ? " is-leading" : "";
  const hasScore = Number.isFinite(game.away?.score) || Number.isFinite(game.home?.score);
  const score = hasScore
    ? `${formatSportsScore(game.away?.score)} - ${formatSportsScore(game.home?.score)}`
    : "vs";
  const status = game.status || {};
  const detail = status.detail && status.detail !== status.label ? `${status.label} / ${status.detail}` : status.label || "Scheduled";

  return `
    <div class="sports-ticker-row tone-${escapeHtml(game.tone || status.tone || "scheduled")}">
      <div class="sports-matchup">
        <strong>
          <span class="sports-team${awayLeader}">${escapeHtml(game.away?.abbreviation || "AWY")}</span>
          <span>@</span>
          <span class="sports-team${homeLeader}">${escapeHtml(game.home?.abbreviation || "HOME")}</span>
        </strong>
        <span>${escapeHtml(detail || "Scheduled")}</span>
      </div>
      <b>${escapeHtml(score)}</b>
    </div>
  `;
}

function renderNbaSignalCard(signal) {
  const leaders = Array.isArray(signal.leaders) ? signal.leaders : [];
  const body = leaders.length
    ? `
      <div class="sports-hero-stat">
        <span>${escapeHtml(signal.label || "Top scorer")}</span>
        <strong>${escapeHtml(signal.headline || "Leaders pending")}</strong>
        <em>${escapeHtml(signal.detail || formatNbaSeason(signal.season))}</em>
      </div>
      <div class="sports-compact-list">
        ${leaders.slice(0, 3).map((leader, index) => `
          <div class="sports-compact-row ${index === 0 ? "is-positive" : ""}">
            <span>${escapeHtml(leader.playerName)}</span>
            <strong>${escapeHtml(leader.statLine || "--")}</strong>
          </div>
        `).join("")}
      </div>
    `
    : renderSportsEmptyState(signal.status === "error" ? "Stats offline" : "Leaders pending", signal.detail || "NBA Stats API returned no rows.");

  return `
    <article class="glass sports-card">
      <div class="sports-card-header">
        <div>
          <span class="sports-card-kicker">NBA Stat Signal</span>
          <h4>${escapeHtml(formatNbaSeason(signal.season))}</h4>
        </div>
        <span class="sports-mini-chip ${signal.status === "error" ? "is-danger" : "is-live"}">${signal.status === "error" ? "Offline" : "Leaders"}</span>
      </div>
      ${body}
    </article>
  `;
}

function renderF1Card(signal) {
  const positions = Array.isArray(signal.positions) ? signal.positions : [];
  const top = signal.topDriver;
  const body = top
    ? `
      <div class="sports-hero-stat">
        <span>${escapeHtml(signal.meetingName || "Formula 1")}</span>
        <strong>P${escapeHtml(top.position || "1")} ${escapeHtml(top.driver?.abbreviation || "F1")}</strong>
        <em>${escapeHtml(signal.sessionName || "Session")} ${signal.circuit ? `/ ${escapeHtml(signal.circuit)}` : ""}</em>
      </div>
      <div class="sports-compact-list">
        ${positions.map((row) => `
          <div class="sports-compact-row ${row.position === 1 ? "is-positive" : ""}">
            <span>P${escapeHtml(row.position || "--")} ${escapeHtml(row.driver?.abbreviation || row.driver?.name || "--")}</span>
            <strong>${escapeHtml(row.gap || "--")}</strong>
          </div>
        `).join("")}
      </div>
      ${renderF1Weather(signal.weather)}
    `
    : renderSportsEmptyState(signal.meetingName || "F1 signal pending", signal.detail || "OpenF1 data is unavailable right now.");

  return `
    <article class="glass sports-card">
      <div class="sports-card-header">
        <div>
          <span class="sports-card-kicker">F1 Weekend</span>
          <h4>${escapeHtml(signal.sessionName || "Session pulse")}</h4>
        </div>
        <span class="sports-mini-chip ${signal.isHistorical ? "is-cached" : "is-live"}">${signal.isHistorical ? "Historical" : "Live"}</span>
      </div>
      ${body}
    </article>
  `;
}

function renderEplCard(signal) {
  const fixtures = Array.isArray(signal.fixtures) ? signal.fixtures : [];
  const player = signal.topPlayer;
  const body = `
    <div class="sports-hero-stat">
      <span>${escapeHtml(signal.gameweekStatus || "Gameweek")}</span>
      <strong>${escapeHtml(signal.gameweekLabel || "Gameweek pending")}</strong>
      <em>${player ? `${escapeHtml(player.name)} / ${escapeHtml(player.team || "--")} / ${formatSportsNumber(player.points)} pts` : escapeHtml(signal.detail || "FPL signal pending.")}</em>
    </div>
    ${player ? `
      <div class="sports-stat-strip">
        <div><span>Form</span><strong>${formatSportsNumber(player.form)}</strong></div>
        <div><span>Selected</span><strong>${formatSportsNumber(player.selectedByPercent)}%</strong></div>
      </div>
    ` : ""}
    ${fixtures.length ? `
      <div class="sports-compact-list">
        ${fixtures.slice(0, 3).map(renderEplFixtureRow).join("")}
      </div>
    ` : renderSportsEmptyState("Fixtures pending", signal.detail || "Upcoming Premier League fixtures are not published yet.")}
  `;

  return `
    <article class="glass sports-card">
      <div class="sports-card-header">
        <div>
          <span class="sports-card-kicker">Premier League / FPL</span>
          <h4>${escapeHtml(signal.fixtureMode || "Gameweek")}</h4>
        </div>
        <span class="sports-mini-chip ${signal.status === "error" ? "is-danger" : "is-live"}">FPL</span>
      </div>
      ${body}
    </article>
  `;
}

function renderEplFixtureRow(fixture) {
  const score = Number.isFinite(fixture.homeScore) || Number.isFinite(fixture.awayScore)
    ? `${formatSportsScore(fixture.homeScore)} - ${formatSportsScore(fixture.awayScore)}`
    : formatSportsDate(fixture.kickoff);

  return `
    <div class="sports-compact-row ${fixture.status === "Live" ? "is-positive" : fixture.status === "Final" ? "is-muted" : ""}">
      <span>${escapeHtml(fixture.away || "Away")} @ ${escapeHtml(fixture.home || "Home")}</span>
      <strong>${escapeHtml(score)}</strong>
    </div>
  `;
}

function renderF1Weather(weather) {
  if (!weather) {
    return "";
  }

  return `
    <div class="sports-stat-strip">
      <div><span>Track</span><strong>${formatCelsius(weather.trackTempC)}</strong></div>
      <div><span>Air</span><strong>${formatCelsius(weather.airTempC)}</strong></div>
    </div>
  `;
}

function renderSportsEmptyState(title, detail) {
  return `
    <div class="sports-empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
  `;
}

function renderSportsError(error) {
  sportsStatusChip.textContent = "Cached";
  sportsStatusChip.className = "sports-status-chip status-cached";
  sportsUpdated.textContent = "Sports offline";
  sportsFeedDot.className = "status-dot critical";
  sportsPulseGrid.innerHTML = `
    <article class="glass sports-card is-error">
      <div class="sports-card-header">
        <div>
          <span class="sports-card-kicker">Sports Pulse</span>
          <h4>Signal offline</h4>
        </div>
        <span class="sports-mini-chip is-danger">Error</span>
      </div>
      ${renderSportsEmptyState("Sports feed unavailable", error?.message || "The sports route did not respond.")}
    </article>
  `;
  refreshIcons();
}

function setSportsLoadingState(isLoading) {
  if (!refreshSportsButton) {
    return;
  }

  refreshSportsButton.disabled = isLoading;
  refreshSportsButton.classList.toggle("is-loading", isLoading);
  document.querySelectorAll(".sports-card").forEach((card) => {
    card.classList.toggle("loading", isLoading);
  });
}

function formatSportsStatus(status) {
  return {
    live: "Live",
    cached: "Cached",
    needs_api_key: "Needs API Key",
    error: "Cached"
  }[status] || "Cached";
}

function getSportsStatusTone(status) {
  return {
    live: "live",
    cached: "cached",
    needs_api_key: "key",
    error: "danger"
  }[status] || "cached";
}

function getSportsDotClass(status) {
  if (status === "live") {
    return "status-dot";
  }

  if (status === "needs_api_key" || status === "cached") {
    return "status-dot warning";
  }

  return "status-dot critical";
}

function formatSportsScore(value) {
  return Number.isFinite(value) ? String(value) : "--";
}

function formatSportsNumber(value) {
  return Number.isFinite(value) ? Number(value).toLocaleString([], { maximumFractionDigits: 1 }) : "--";
}

function formatSportsTime(value) {
  const date = new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatSportsDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function formatNbaSeason(season) {
  const numeric = Number(season);

  if (!Number.isFinite(numeric)) {
    return "Season";
  }

  return `${numeric - 1}-${String(numeric).slice(-2)}`;
}

function formatCelsius(value) {
  return Number.isFinite(value) ? `${Math.round(value)}C` : "--";
}

function initTravelPulse() {
  if (!travelUpdated || !refreshTravelButton || !airportPulseGrid) {
    return;
  }

  refreshTravelButton.addEventListener("click", () => loadTravelPulse(true));
  loadTravelPulse();
  setInterval(loadTravelPulse, TRAVEL_REFRESH_MS);
}

async function loadTravelPulse(force = false) {
  if (travelRequestInFlight) {
    return;
  }

  travelRequestInFlight = true;
  setTravelLoadingState(true);

  try {
    if (window.location.protocol === "file:") {
      throw new Error("Start the live hub server to enable airport weather.");
    }

    const cacheParam = force ? "?force=1" : "";
    const [airportResult, transitResult] = await Promise.allSettled([
      fetchJson(`/api/travel/airports${cacheParam}`),
      fetchJson(`/api/travel/transit${cacheParam}`)
    ]);

    if (airportResult.status === "fulfilled") {
      renderTravelPulse(airportResult.value);
    } else {
      renderTravelError(airportResult.reason);
    }

    if (transitResult.status === "fulfilled") {
      renderTransitPulse(transitResult.value);
    } else {
      renderTransitPulse({
        status: "error",
        message: transitResult.reason?.message || "Transit status unavailable."
      });
    }
  } catch (error) {
    renderTravelError(error);
    renderTransitPulse({
      status: "disabled",
      message: "Transit data not connected."
    });
  } finally {
    travelRequestInFlight = false;
    setTravelLoadingState(false);
  }
}

function renderTravelPulse(data) {
  const airports = Array.isArray(data.airports) ? data.airports : [];
  travelSummary.innerHTML = renderTravelSummary(data, airports);
  airportPulseGrid.innerHTML = airports.length
    ? airports.map((airport) => renderAirportCard(airport)).join("")
    : travelAirportFallbacks.map((airport) => renderAirportCard({
      ...airport,
      flightCategory: "Unknown",
      risk: { label: "Watch", tone: "watch", level: 1, reasons: ["No airport feed"] },
      error: "Airport feed returned no tracked airports."
    })).join("");

  travelUpdated.textContent = `Updated ${formatTravelTime(data.asOf)}`;
  travelFeedDot.className = getTravelDotClass(data.summary?.highestRisk?.tone);
  refreshIcons();
}

function renderTravelSummary(data, airports) {
  const summary = data.summary || {};
  const updated = formatTravelTime(data.asOf);
  const tracked = summary.airportsTracked || airports.length || travelAirportFallbacks.length;
  const best = summary.bestAirport?.label || "No signal";
  const highest = summary.highestRisk?.label || "No signal";

  return `
    <div class="travel-summary-item risk-${getRiskTone(summary.bestAirport?.tone)}">
      <span>Best airport</span>
      <strong>${escapeHtml(best)}</strong>
    </div>
    <div class="travel-summary-item risk-${getRiskTone(summary.highestRisk?.tone)}">
      <span>Highest risk</span>
      <strong>${escapeHtml(highest)}</strong>
    </div>
    <div class="travel-summary-item">
      <span>Network</span>
      <strong>${tracked} airports tracked</strong>
    </div>
    <div class="travel-summary-item">
      <span>Updated</span>
      <strong>${escapeHtml(updated)}</strong>
    </div>
  `;
}

function renderAirportCard(airport) {
  const riskTone = getRiskTone(airport.risk?.tone);
  const category = airport.flightCategory || "Unknown";
  const airportError = airport.error || airport.forecastError;
  const observed = airport.observedAt ? `METAR ${formatTravelTime(airport.observedAt)}` : "METAR pending";
  const reasons = Array.isArray(airport.risk?.reasons) ? airport.risk.reasons.join(" / ") : "";

  return `
    <article class="glass airport-card risk-${riskTone}${airportError ? " has-alert" : ""}" data-airport="${escapeHtml(airport.iata || airport.icao)}">
      <div class="airport-card-top">
        <div>
          <div class="airport-code-row">
            <strong>${escapeHtml(airport.iata || "--")}</strong>
            <span>${escapeHtml(airport.icao || "--")}</span>
          </div>
          <p>${escapeHtml(airport.city || airport.name || "Airport")}</p>
        </div>
        <span class="risk-chip risk-${riskTone}" title="${escapeHtml(reasons)}">${escapeHtml(airport.risk?.label || "Watch")}</span>
      </div>
      <div class="flight-category-row">
        <span>Flight category</span>
        <strong class="flight-${category.toLowerCase()}">${escapeHtml(category)}</strong>
      </div>
      <dl class="airport-metrics">
        <div>
          <dt>Temp</dt>
          <dd>${formatAirportTemp(airport.tempF)}</dd>
        </div>
        <div>
          <dt>Wind</dt>
          <dd>${escapeHtml(airport.wind?.text || "--")}</dd>
        </div>
        <div>
          <dt>Visibility</dt>
          <dd>${escapeHtml(airport.visibility?.text || "--")}</dd>
        </div>
        <div>
          <dt>Ceiling</dt>
          <dd>${escapeHtml(airport.ceiling?.text || "--")}</dd>
        </div>
      </dl>
      <p class="taf-summary">${escapeHtml(airport.taf?.summary || "Forecast pending.")}</p>
      <p class="airport-observed">${escapeHtml(observed)}</p>
      ${airportError ? `<p class="airport-alert">${escapeHtml(airportError)}</p>` : ""}
    </article>
  `;
}

function renderTransitPulse(data) {
  if (!transitPulse) {
    return;
  }

  const status = data?.status || "disabled";
  const providers = Array.isArray(data?.providers) ? data.providers.filter((provider) => provider.status === "connected") : [];
  const providerText = providers.length
    ? providers.slice(0, 3).map((provider) => provider.name).filter(Boolean).join(" / ")
    : data?.message || "Transit data not connected.";
  const icon = status === "connected" ? "train-front" : status === "error" ? "triangle-alert" : "plug-zap";

  transitPulse.className = `transit-pulse is-${status}`;
  transitPulse.innerHTML = `
    <i data-lucide="${icon}" aria-hidden="true"></i>
    <span>${escapeHtml(providerText || "Transit data not connected.")}</span>
  `;
  refreshIcons();
}

function renderTravelError(error) {
  travelSummary.innerHTML = `
    <div class="travel-summary-item risk-ground">
      <span>Best airport</span>
      <strong>Offline</strong>
    </div>
    <div class="travel-summary-item risk-ground">
      <span>Highest risk</span>
      <strong>No signal</strong>
    </div>
    <div class="travel-summary-item">
      <span>Network</span>
      <strong>4 airports tracked</strong>
    </div>
    <div class="travel-summary-item">
      <span>Updated</span>
      <strong>--</strong>
    </div>
  `;
  airportPulseGrid.innerHTML = travelAirportFallbacks
    .map((airport) => renderAirportCard({
      ...airport,
      flightCategory: "Unknown",
      risk: { label: "Ground Risk", tone: "ground", level: 3, reasons: ["Airport feed offline"] },
      error: error?.message || "Airport weather unavailable."
    }))
    .join("");
  travelUpdated.textContent = "Airports offline";
  travelFeedDot.className = "status-dot critical";
  refreshIcons();
}

function setTravelLoadingState(isLoading) {
  refreshTravelButton.disabled = isLoading;
  refreshTravelButton.classList.toggle("is-loading", isLoading);
  document.querySelectorAll(".airport-card").forEach((card) => {
    card.classList.toggle("loading", isLoading);
  });
}

function formatAirportTemp(value) {
  return Number.isFinite(value) ? `${Math.round(value)}&deg;F` : "--";
}

function formatTravelTime(value) {
  const date = new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getRiskTone(tone = "watch") {
  return ["clear", "watch", "delay", "ground"].includes(tone) ? tone : "watch";
}

function getTravelDotClass(tone = "watch") {
  if (tone === "ground") {
    return "status-dot critical";
  }

  if (tone === "watch" || tone === "delay") {
    return "status-dot warning";
  }

  return "status-dot";
}

function initMarketPulse() {
  renderMarketSkeleton();
  refreshMarketButton.addEventListener("click", () => loadMarketPulse());
  loadMarketPulse();
  setInterval(loadMarketPulse, MARKET_REFRESH_MS);
}

async function loadMarketPulse() {
  if (marketRequestInFlight) {
    return;
  }

  marketRequestInFlight = true;
  setMarketLoadingState(true);

  try {
    if (window.location.protocol === "file:") {
      throw new Error("Start the live hub server to enable market quotes.");
    }

    const symbols = marketHoldings.map((holding) => holding.symbol).join(",");
    const data = await fetchJson(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
    const quotes = marketHoldings.map((holding) => {
      const quote = data.quotes.find((item) => item.symbol === holding.symbol);
      return { ...holding, ...quote };
    });

    renderMarketSummary(quotes);
    renderMarketCards(quotes);
    setMarketFeedTone(quotes);
    marketUpdated.textContent = `Updated ${new Date(data.asOf || Date.now()).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })}`;
  } catch (error) {
    renderMarketError(error);
  } finally {
    marketRequestInFlight = false;
    setMarketLoadingState(false);
  }
}

function renderMarketSkeleton() {
  marketSummary.innerHTML = `
    <div class="market-summary-card">
      <span>Portfolio mood</span>
      <strong>Connecting</strong>
    </div>
    <div class="market-summary-card">
      <span>Top mover</span>
      <strong>--</strong>
    </div>
    <div class="market-summary-card">
      <span>Pressure point</span>
      <strong>--</strong>
    </div>
  `;

  marketPulseList.innerHTML = marketHoldings
    .map((holding) => `
      <article class="market-row loading">
        <div class="market-card-top">
          <div>
            <strong>${holding.symbol}</strong>
            <span>${holding.label}</span>
          </div>
          <em>${holding.group}</em>
        </div>
        <div class="market-price-row">
          <b>--</b>
          <span>Waiting</span>
        </div>
        <div class="sparkline-placeholder"></div>
        <div class="market-meta">
          <span>Quote pending</span>
          <span>--</span>
        </div>
      </article>
    `)
    .join("");
}

function renderMarketSummary(quotes) {
  const validQuotes = quotes.filter((quote) => Number.isFinite(quote.changePercent));
  const upCount = validQuotes.filter((quote) => quote.changePercent >= 0).length;
  const downCount = validQuotes.length - upCount;
  const topMover = [...validQuotes].sort((a, b) => b.changePercent - a.changePercent)[0];
  const pressurePoint = [...validQuotes].sort((a, b) => a.changePercent - b.changePercent)[0];
  const mood = getMarketMood(upCount, downCount, validQuotes.length);

  marketSummary.innerHTML = `
    <div class="market-summary-card">
      <span>Portfolio mood</span>
      <strong>${mood}</strong>
    </div>
    <div class="market-summary-card">
      <span>${upCount} up / ${downCount} down</span>
      <strong>${validQuotes.length ? "Tracking live" : "No quotes"}</strong>
    </div>
    <div class="market-summary-card ${topMover ? getMarketTone(topMover.changePercent) : ""}">
      <span>Top mover</span>
      <strong>${topMover ? `${topMover.symbol} ${formatPercent(topMover.changePercent)}` : "--"}</strong>
    </div>
    <div class="market-summary-card ${pressurePoint ? getMarketTone(pressurePoint.changePercent) : ""}">
      <span>Pressure point</span>
      <strong>${pressurePoint ? `${pressurePoint.symbol} ${formatPercent(pressurePoint.changePercent)}` : "--"}</strong>
    </div>
  `;
}

function renderMarketCards(quotes) {
  marketPulseList.innerHTML = quotes
    .map((quote) => {
      if (quote.error || !Number.isFinite(quote.price)) {
        return renderMarketCardError(quote);
      }

      const tone = getMarketTone(quote.changePercent);
      const price = formatCurrency(quote.price, quote.currency);
      const change = `${formatCurrency(quote.change, quote.currency)} ${formatPercent(quote.changePercent)}`;
      const points = getSparklinePoints(quote.sparkline || []);
      const session = quote.session || "Market";
      const quoteTime = quote.marketTime ? formatQuoteTime(quote.marketTime) : "Time pending";

      return `
        <article class="market-row ${tone}">
          <div class="market-card-top">
            <div>
              <strong>${escapeHtml(quote.symbol)}</strong>
              <span>${escapeHtml(quote.name || quote.label)}</span>
            </div>
            <em>${escapeHtml(quote.group)}</em>
          </div>
          <div class="market-price-row">
            <b>${price}</b>
            <span class="${tone === "is-up" ? "positive" : tone === "is-down" ? "critical" : "warning"}">${change}</span>
          </div>
          ${renderSparkline(points, tone)}
          <div class="market-meta">
            <span>${escapeHtml(session)} &middot; ${quoteTime}</span>
            <span>${formatVolume(quote.volume)}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderMarketCardError(quote) {
  return `
    <article class="market-row is-error">
      <div class="market-card-top">
        <div>
          <strong>${escapeHtml(quote.symbol)}</strong>
          <span>${escapeHtml(quote.label)}</span>
        </div>
        <em>${escapeHtml(quote.group)}</em>
      </div>
      <div class="market-price-row">
        <b>--</b>
        <span class="critical">Offline</span>
      </div>
      <div class="sparkline-placeholder"></div>
      <div class="market-meta">
        <span>Quote unavailable</span>
        <span>Retry</span>
      </div>
    </article>
  `;
}

function renderSparkline(points, tone) {
  if (!points) {
    return `<div class="sparkline-placeholder"></div>`;
  }

  return `
    <svg class="market-sparkline ${tone}" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${points}"></polyline>
    </svg>
  `;
}

function renderMarketError(error) {
  marketSummary.innerHTML = `
    <div class="market-summary-card is-down">
      <span>Market feed</span>
      <strong>Offline</strong>
    </div>
    <div class="market-summary-card">
      <span>Next step</span>
      <strong>Run live hub</strong>
    </div>
  `;
  marketPulseList.innerHTML = `
    <div class="empty-state market-error">
      <span>${escapeHtml(error?.message || "Live quotes unavailable.")}</span>
    </div>
  `;
  marketUpdated.textContent = "Quotes offline";
  marketFeedDot.className = "status-dot critical";
}

function setMarketLoadingState(isLoading) {
  refreshMarketButton.disabled = isLoading;
  refreshMarketButton.classList.toggle("is-loading", isLoading);
}

function setMarketFeedTone(quotes) {
  const validQuotes = quotes.filter((quote) => Number.isFinite(quote.changePercent));
  const upCount = validQuotes.filter((quote) => quote.changePercent >= 0).length;
  const tone = validQuotes.length === 0
    ? "critical"
    : upCount >= Math.ceil(validQuotes.length * 0.6)
      ? "positive"
      : upCount <= Math.floor(validQuotes.length * 0.4)
        ? "critical"
        : "warning";

  marketFeedDot.className = `status-dot ${tone}`;
}

function getMarketMood(upCount, downCount, total) {
  if (!total) {
    return "No signal";
  }

  if (upCount === total) {
    return "All green";
  }

  if (downCount === total) {
    return "Under pressure";
  }

  if (upCount >= Math.ceil(total * 0.65)) {
    return "Mostly green";
  }

  if (downCount >= Math.ceil(total * 0.65)) {
    return "Risk-off";
  }

  return "Mixed";
}

function getMarketTone(value) {
  if (!Number.isFinite(value) || Math.abs(value) < 0.01) {
    return "is-flat";
  }

  return value > 0 ? "is-up" : "is-down";
}

function getSparklinePoints(values) {
  const numericValues = values.filter((value) => Number.isFinite(value));

  if (numericValues.length < 2) {
    return "";
  }

  const sampleSize = 34;
  const step = Math.max(1, Math.floor(numericValues.length / sampleSize));
  const sampledValues = numericValues.filter((_, index) => index % step === 0).slice(-sampleSize);
  const min = Math.min(...sampledValues);
  const max = Math.max(...sampledValues);
  const spread = max - min || 1;

  return sampledValues
    .map((value, index) => {
      const x = sampledValues.length === 1 ? 0 : (index / (sampledValues.length - 1)) * 100;
      const y = 25 - ((value - min) / spread) * 22;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatCurrency(value, currency = "USD") {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat([], {
    style: "currency",
    currency,
    minimumFractionDigits: value >= 100 ? 2 : 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatVolume(value) {
  if (!Number.isFinite(value)) {
    return "Vol --";
  }

  if (value >= 1_000_000_000) {
    return `Vol ${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `Vol ${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `Vol ${(value / 1_000).toFixed(1)}K`;
  }

  return `Vol ${value}`;
}

function formatQuoteTime(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", initDashboard);
