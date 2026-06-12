const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { TextDecoder } = require("node:util");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const DEFAULT_SYMBOLS = ["AAL", "TSLA", "VZ", "NVDA", "TMUS", "DAL", "AMZN"];
const QUOTE_CACHE_MS = 15_000;
const MALMEROADS_ORIGIN = "https://malmeroads.net";
const MALMEROADS_CACHE_MS = 60_000;
const NWS_ORIGIN = "https://api.weather.gov";
const NWS_USER_AGENT = process.env.NWS_USER_AGENT || "(PulseDeckDashboard, la.drloves@gmail.com)";
const AVIATION_WEATHER_ORIGIN = "https://aviationweather.gov";
const AVIATION_WEATHER_USER_AGENT = process.env.AVIATION_WEATHER_USER_AGENT || "PulseDeck Travel Pulse/1.0";
const AVIATION_API_ORIGIN = "https://api.aviationapi.com";
const AIRPORTS_API_ORIGIN = "https://airportsapi.com";
const TRANSITLAND_ORIGIN = "https://transit.land";
const BALLDONTLIE_ORIGIN = "https://api.balldontlie.io";
const NBA_STATS_ORIGIN = "https://api.server.nbaapi.com";
const OPENF1_ORIGIN = "https://api.openf1.org";
const FPL_ORIGIN = "https://fantasy.premierleague.com";
const AIRPORT_WEATHER_CACHE_MS = 60_000;
const AIRPORT_META_CACHE_MS = 24 * 60 * 60 * 1000;
const TRANSIT_CACHE_MS = 5 * 60 * 1000;
const NBA_GAMES_CACHE_MS = 45_000;
const NBA_STATS_CACHE_MS = 20 * 60 * 1000;
const F1_LIVE_CACHE_MS = 60_000;
const F1_OFFWEEK_CACHE_MS = 15 * 60 * 1000;
const EPL_CACHE_MS = 20 * 60 * 1000;
const TRAVEL_AIRPORT_IDS = ["KRDU", "KCLT", "KFAY", "KGSO"];
const LOCAL_AIRPORTS = {
  KRDU: {
    icao: "KRDU",
    iata: "RDU",
    faa: "RDU",
    city: "Raleigh-Durham",
    name: "Raleigh-Durham International",
    state: "NC",
    lat: 35.8776,
    lon: -78.7875,
    elevationFt: 435
  },
  KCLT: {
    icao: "KCLT",
    iata: "CLT",
    faa: "CLT",
    city: "Charlotte",
    name: "Charlotte Douglas International",
    state: "NC",
    lat: 35.2132,
    lon: -80.9514,
    elevationFt: 748
  },
  KFAY: {
    icao: "KFAY",
    iata: "FAY",
    faa: "FAY",
    city: "Fayetteville",
    name: "Fayetteville Regional",
    state: "NC",
    lat: 34.9912,
    lon: -78.8803,
    elevationFt: 189
  },
  KGSO: {
    icao: "KGSO",
    iata: "GSO",
    faa: "GSO",
    city: "Greensboro",
    name: "Piedmont Triad International",
    state: "NC",
    lat: 36.1013,
    lon: -79.9411,
    elevationFt: 925
  }
};
const NWS_FEATURE_FLAGS = new Set([
  "forecast_temperature_qv",
  "forecast_wind_speed_qv",
  "obs_station_provider"
]);
const NWS_PROXY_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type",
  "Access-Control-Allow-Private-Network": "true",
  "Vary": "Origin"
};
const quoteCache = new Map();
const malmeRoadsCache = new Map();
const travelWeatherCache = new Map();
const airportMetadataCache = new Map();
const transitCache = new Map();
const sportsCache = new Map();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Permissions-Policy": "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)"
};
const CACHEABLE_STATIC_EXTENSIONS = new Set([".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".ico"]);
const ALLOWED_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (!ALLOWED_METHODS.has(request.method)) {
      sendText(response, 405, "Method not allowed", {
        "Allow": "GET, HEAD, OPTIONS"
      });
      return;
    }

    if (request.method === "OPTIONS" && requestUrl.pathname !== "/api/nws") {
      response.writeHead(204, {
        ...SECURITY_HEADERS,
        "Allow": "GET, HEAD, OPTIONS"
      });
      response.end();
      return;
    }

    if (requestUrl.pathname === "/api/quotes") {
      await handleQuotes(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/malmeroads/source") {
      await handleMalmeRoadsSource(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/nws") {
      await handleNwsProxy(request, requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/travel/airports") {
      await handleTravelAirports(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/travel/transit") {
      await handleTravelTransit(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/sports/nba/games") {
      await handleSportsNbaGames(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/sports/nba/stats") {
      await handleSportsNbaStats(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/sports/f1") {
      await handleSportsF1(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/sports/epl") {
      await handleSportsEpl(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/sports") {
      await handleSports(requestUrl, response);
      return;
    }

    serveStaticFile(requestUrl.pathname, request.method, response);
  } catch (error) {
    sendJson(response, 500, {
      error: "Server error",
      message: error.message
    });
  }
});

server.listen(PORT, () => {
  console.log(`PulseDeck live hub running at http://localhost:${PORT}`);
});

async function handleQuotes(requestUrl, response) {
  const symbols = parseSymbols(requestUrl.searchParams.get("symbols"));
  const results = await Promise.allSettled(symbols.map((symbol) => fetchQuote(symbol)));
  const quotes = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      symbol: symbols[index],
      error: result.reason?.message || "Quote unavailable"
    };
  });

  sendJson(response, 200, {
    asOf: new Date().toISOString(),
    source: "Yahoo Finance chart feed",
    refreshSeconds: Math.round(QUOTE_CACHE_MS / 1000),
    quotes
  });
}

async function handleMalmeRoadsSource(requestUrl, response) {
  try {
    const sourcePath = normalizeMalmeRoadsPath(requestUrl.searchParams.get("path") || "/");
    const force = requestUrl.searchParams.get("force") === "1";
    const source = await fetchMalmeRoadsPage(sourcePath, force);

    sendJson(response, 200, {
      html: source.html,
      sourcePath,
      sourceUrl: source.sourceUrl,
      fetchedAt: source.fetchedAt,
      lastModified: source.lastModified,
      etag: source.etag,
      cacheStatus: source.cacheStatus,
      ageMs: Date.now() - source.fetchedAtMs
    });
  } catch (error) {
    sendJson(response, 502, {
      error: "MalmeRoads source sync failed",
      message: error.message
    });
  }
}

async function handleNwsProxy(request, requestUrl, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      ...SECURITY_HEADERS,
      ...NWS_PROXY_HEADERS
    });
    response.end();
    return;
  }

  try {
    const nwsUrl = normalizeNwsUrl(requestUrl.searchParams.get("url"));
    const featureFlags = parseNwsFeatureFlags(requestUrl.searchParams.get("featureFlags"));
    const headers = {
      "Accept": "application/geo+json",
      "User-Agent": NWS_USER_AGENT
    };

    if (featureFlags.length) {
      headers["Feature-Flags"] = featureFlags.join(",");
    }

    const upstreamResponse = await fetch(nwsUrl, { headers, redirect: "follow" });
    const body = await upstreamResponse.text();

    response.writeHead(upstreamResponse.status, {
      ...SECURITY_HEADERS,
      "Content-Type": upstreamResponse.headers.get("content-type") || "application/geo+json; charset=utf-8",
      "Cache-Control": upstreamResponse.headers.get("cache-control") || "no-store",
      ...NWS_PROXY_HEADERS
    });
    response.end(body);
  } catch (error) {
    sendJson(response, 502, {
      error: "NWS request failed",
      message: error.message
    }, NWS_PROXY_HEADERS);
  }
}

async function handleTravelAirports(requestUrl, response) {
  try {
    const force = requestUrl.searchParams.get("force") === "1";
    const payload = await loadTravelAirportPulse(force);
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 502, {
      error: "Airport pulse unavailable",
      message: error.message,
      airports: TRAVEL_AIRPORT_IDS.map((icao) => normalizeAirportPulse({
        icao,
        metadata: getLocalAirport(icao),
        metar: null,
        taf: null,
        metarError: error,
        tafError: error
      }))
    });
  }
}

async function handleTravelTransit(requestUrl, response) {
  const apiKey = process.env.TRANSITLAND_API_KEY;

  if (!apiKey) {
    sendJson(response, 200, {
      connected: false,
      status: "disabled",
      asOf: new Date().toISOString(),
      message: "Transit data not connected.",
      providers: []
    });
    return;
  }

  try {
    const force = requestUrl.searchParams.get("force") === "1";
    const payload = await loadTransitPulse(apiKey, force);
    sendJson(response, 200, payload);
  } catch (error) {
    sendJson(response, 200, {
      connected: true,
      status: "error",
      asOf: new Date().toISOString(),
      message: error.message || "TransitLand unavailable.",
      providers: []
    });
  }
}

async function handleSports(requestUrl, response) {
  const force = requestUrl.searchParams.get("force") === "1";
  const payload = await loadSportsDashboard(force);
  sendJson(response, 200, payload);
}

async function handleSportsNbaGames(requestUrl, response) {
  const force = requestUrl.searchParams.get("force") === "1";
  const payload = await loadNbaGames(force);
  sendJson(response, 200, payload);
}

async function handleSportsNbaStats(requestUrl, response) {
  const force = requestUrl.searchParams.get("force") === "1";
  const payload = await loadNbaStats(force);
  sendJson(response, 200, payload);
}

async function handleSportsF1(requestUrl, response) {
  const force = requestUrl.searchParams.get("force") === "1";
  const payload = await loadF1Signal(force);
  sendJson(response, 200, payload);
}

async function handleSportsEpl(requestUrl, response) {
  const force = requestUrl.searchParams.get("force") === "1";
  const payload = await loadEplSignal(force);
  sendJson(response, 200, payload);
}

async function loadSportsDashboard(force = false) {
  const errors = [];
  const [nbaGamesResult, nbaStatsResult, f1Result, eplResult] = await Promise.allSettled([
    loadNbaGames(force),
    loadNbaStats(force),
    loadF1Signal(force),
    loadEplSignal(force)
  ]);
  const nbaGames = unwrapSportsPayload(nbaGamesResult, "NBA games", errors, {
    status: "error",
    source: "balldontlie NBA API",
    games: [],
    message: "NBA games unavailable."
  });
  const nbaStats = unwrapSportsPayload(nbaStatsResult, "NBA Stats API", errors, {
    status: "error",
    source: "NBA Stats API",
    signal: buildNbaSignalError(new Error("NBA stats unavailable."))
  });
  const f1 = unwrapSportsPayload(f1Result, "OpenF1 API", errors, {
    status: "error",
    source: "OpenF1 API",
    signal: buildF1UnavailableSignal(new Error("F1 signal unavailable.")).signal
  });
  const epl = unwrapSportsPayload(eplResult, "FPL API", errors, {
    status: "error",
    source: "Fantasy Premier League API",
    signal: buildEplUnavailableSignal(new Error("Premier League signal unavailable.")).signal
  });
  const providerErrors = [
    ...(nbaGames.errors || []),
    ...(nbaStats.errors || []),
    ...(f1.errors || []),
    ...(epl.errors || []),
    ...errors
  ];
  const providers = {
    nbaGames: summarizeSportsProvider(nbaGames),
    nbaStats: summarizeSportsProvider(nbaStats),
    f1: summarizeSportsProvider(f1),
    epl: summarizeSportsProvider(epl)
  };

  return {
    updatedAt: new Date().toISOString(),
    status: resolveSportsStatus(providers, providerErrors),
    refreshSeconds: 60,
    nbaGames: nbaGames.games || [],
    nbaSignal: nbaStats.signal || buildNbaSignalError(new Error("NBA stat signal unavailable.")),
    f1Signal: f1.signal || buildF1UnavailableSignal(new Error("F1 signal unavailable.")).signal,
    eplSignal: epl.signal || buildEplUnavailableSignal(new Error("Premier League signal unavailable.")).signal,
    providers,
    errors: providerErrors.slice(0, 6)
  };
}

async function loadNbaGames(force = false) {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  const today = formatDateInTimeZone(new Date(), "America/New_York");

  if (!apiKey) {
    return {
      updatedAt: new Date().toISOString(),
      status: "needs_api_key",
      source: "balldontlie NBA API",
      needsApiKey: true,
      games: [],
      message: "Add BALLDONTLIE_API_KEY on the server to enable NBA Today."
    };
  }

  try {
    return await getSportsCached(`nba-games:${today}`, NBA_GAMES_CACHE_MS, force, async () => {
      const endpoint = new URL("/v1/games", BALLDONTLIE_ORIGIN);
      endpoint.searchParams.append("dates[]", today);
      endpoint.searchParams.set("per_page", "25");

      const payload = await fetchJsonWithTimeout(endpoint, {
        headers: {
          "Accept": "application/json",
          "Authorization": apiKey,
          "User-Agent": "PulseDeck Sports Pulse/1.0"
        }
      }, 8000);
      const games = Array.isArray(payload?.data)
        ? payload.data.map(normalizeBalldontlieGame)
        : [];

      return {
        updatedAt: new Date().toISOString(),
        status: "live",
        source: "balldontlie NBA API",
        date: today,
        games,
        message: games.length ? `${games.length} NBA game${games.length === 1 ? "" : "s"} tracked today.` : "No NBA games today."
      };
    });
  } catch (error) {
    return {
      updatedAt: new Date().toISOString(),
      status: "error",
      source: "balldontlie NBA API",
      date: today,
      games: [],
      message: error.message || "NBA games unavailable.",
      errors: [{ source: "balldontlie NBA API", message: error.message || "NBA games unavailable." }]
    };
  }
}

async function loadNbaStats(force = false) {
  const season = getCurrentNbaSeasonYear();

  try {
    return await getSportsCached(`nba-stats:${season}`, NBA_STATS_CACHE_MS, force, async () => {
      let statsSeason = season;
      let rows = await fetchNbaPlayerTotals(statsSeason);

      if (!rows.length) {
        statsSeason = season - 1;
        rows = await fetchNbaPlayerTotals(statsSeason);
      }

      return {
        updatedAt: new Date().toISOString(),
        status: rows.length ? "live" : "empty",
        source: "NBA Stats API",
        season: statsSeason,
        signal: normalizeNbaStatSignal(rows, statsSeason),
        message: rows.length ? "NBA stat signal connected." : "NBA stat table returned no leaders."
      };
    });
  } catch (error) {
    return {
      updatedAt: new Date().toISOString(),
      status: "error",
      source: "NBA Stats API",
      season,
      signal: buildNbaSignalError(error),
      message: error.message || "NBA stat signal unavailable.",
      errors: [{ source: "NBA Stats API", message: error.message || "NBA stat signal unavailable." }]
    };
  }
}

async function loadF1Signal(force = false) {
  const cached = sportsCache.get("f1");
  const ttl = cached?.data?.raceWeekend ? F1_LIVE_CACHE_MS : F1_OFFWEEK_CACHE_MS;

  try {
    return await getSportsCached("f1", ttl, force, async () => {
      const sessions = await fetchOpenF1Json("/v1/sessions?session_key=latest", 8000);
      const session = pickLatestOpenF1Session(sessions);

      if (!session?.session_key) {
        throw new Error("OpenF1 returned no latest session.");
      }

      const sessionKey = session.session_key;
      const [results, drivers, positions, weather] = await Promise.allSettled([
        fetchOpenF1Json(`/v1/session_result?session_key=${encodeURIComponent(sessionKey)}&position%3C=4`, 7000),
        fetchOpenF1Json(`/v1/drivers?session_key=${encodeURIComponent(sessionKey)}`, 7000),
        fetchOpenF1Json(`/v1/position?session_key=${encodeURIComponent(sessionKey)}`, 7000),
        fetchOpenF1Json(`/v1/weather?session_key=${encodeURIComponent(sessionKey)}`, 7000)
      ]);
      const driverMap = buildOpenF1DriverMap(getSettledArray(drivers));
      const topRows = normalizeOpenF1Results(getSettledArray(results), driverMap);
      const latestPositions = normalizeOpenF1Positions(getSettledArray(positions), driverMap);
      const signalRows = topRows.length ? topRows : latestPositions;
      const raceWeekend = isRaceWeekendSession(session);
      const weatherPoint = normalizeOpenF1Weather(getLatestDatedRecord(getSettledArray(weather)));

      return {
        updatedAt: new Date().toISOString(),
        status: "live",
        source: "OpenF1 API",
        raceWeekend,
        signal: {
          status: "live",
          label: raceWeekend ? "Live" : "Historical",
          isHistorical: !raceWeekend,
          meetingName: formatF1MeetingName(session),
          sessionName: session.session_name || session.session_type || "F1 session",
          circuit: session.circuit_short_name || session.location || null,
          topDriver: signalRows[0] || null,
          positions: signalRows.slice(0, 3),
          weather: weatherPoint,
          detail: signalRows.length ? "Latest session signal from OpenF1." : "Session found; timing signal pending."
        },
        message: raceWeekend ? "OpenF1 race weekend signal connected." : "OpenF1 historical signal connected."
      };
    });
  } catch (error) {
    return buildF1UnavailableSignal(error);
  }
}

async function loadEplSignal(force = false) {
  try {
    return await getSportsCached("epl-fpl", EPL_CACHE_MS, force, async () => {
      const [bootstrap, futureFixtures] = await Promise.all([
        fetchFplJson("/api/bootstrap-static/", 9000),
        fetchFplJson("/api/fixtures/?future=1", 9000).catch(() => [])
      ]);
      let fixtures = Array.isArray(futureFixtures) ? futureFixtures : [];

      if (!fixtures.length) {
        const allFixtures = await fetchFplJson("/api/fixtures/", 9000).catch(() => []);
        fixtures = Array.isArray(allFixtures) ? allFixtures : [];
      }

      return {
        updatedAt: new Date().toISOString(),
        status: "live",
        source: "Fantasy Premier League API",
        signal: normalizeEplSignal(bootstrap, fixtures),
        message: "Premier League / FPL signal connected."
      };
    });
  } catch (error) {
    return buildEplUnavailableSignal(error);
  }
}

async function getSportsCached(key, ttlMs, force, loader) {
  const cached = sportsCache.get(key);
  const now = Date.now();

  if (cached && !force && now - cached.createdAt < ttlMs) {
    return attachSportsCacheMeta(cached.data, "fresh", cached.createdAt);
  }

  try {
    const loaded = await loader();
    const createdAt = Date.now();

    sportsCache.set(key, {
      createdAt,
      data: loaded
    });

    return attachSportsCacheMeta(loaded, cached ? "updated" : "miss", createdAt);
  } catch (error) {
    if (cached) {
      return attachSportsCacheMeta(cached.data, "stale", cached.createdAt, error);
    }

    throw error;
  }
}

function attachSportsCacheMeta(data, status, createdAt, error = null) {
  const errors = error
    ? [...(data.errors || []), { source: data.source || "Sports provider", message: error.message || "Provider refresh failed." }]
    : data.errors || [];

  return {
    ...data,
    status: status === "stale" ? "cached" : data.status,
    cache: {
      ...(data.cache || {}),
      status,
      ageSeconds: Math.max(0, Math.round((Date.now() - createdAt) / 1000)),
      message: error?.message || null
    },
    errors
  };
}

function unwrapSportsPayload(result, label, errors, fallback) {
  if (result.status === "fulfilled") {
    return result.value;
  }

  errors.push({
    source: label,
    message: result.reason?.message || `${label} unavailable.`
  });

  return fallback;
}

function summarizeSportsProvider(payload) {
  return {
    status: payload.status || "unknown",
    source: payload.source || null,
    message: payload.message || null,
    needsApiKey: Boolean(payload.needsApiKey),
    cache: payload.cache || null
  };
}

function resolveSportsStatus(providers, errors) {
  if (providers.nbaGames?.needsApiKey) {
    return "needs_api_key";
  }

  if (Object.values(providers).some((provider) => provider?.cache?.status === "stale" || provider?.status === "cached")) {
    return "cached";
  }

  if (errors.length) {
    return "cached";
  }

  return "live";
}

function normalizeBalldontlieGame(game) {
  const awayScore = numberOrNull(game.visitor_team_score);
  const homeScore = numberOrNull(game.home_team_score);
  const leader = getGameLeader(awayScore, homeScore, game.status);
  const status = normalizeNbaGameStatus(game);

  return {
    id: game.id,
    date: game.date || null,
    startsAt: game.datetime || null,
    status,
    rawStatus: game.status || null,
    period: numberOrNull(game.period),
    clock: String(game.time || "").trim() || null,
    postponed: Boolean(game.postponed),
    away: {
      id: game.visitor_team?.id || null,
      abbreviation: game.visitor_team?.abbreviation || "AWY",
      name: game.visitor_team?.full_name || game.visitor_team?.name || "Away",
      score: awayScore,
      isLeader: leader === "away"
    },
    home: {
      id: game.home_team?.id || null,
      abbreviation: game.home_team?.abbreviation || "HOME",
      name: game.home_team?.full_name || game.home_team?.name || "Home",
      score: homeScore,
      isLeader: leader === "home"
    },
    leader,
    tone: status.tone
  };
}

function normalizeNbaGameStatus(game) {
  const rawStatus = String(game.status || "").trim();
  const period = Number(game.period);

  if (game.postponed) {
    return { label: "Delayed", detail: "Postponed", tone: "negative", isLive: false, isFinal: false };
  }

  if (/final/i.test(rawStatus)) {
    return { label: "Final", detail: "Final", tone: "final", isLive: false, isFinal: true };
  }

  if (/half/i.test(rawStatus)) {
    return { label: "Halftime", detail: "Halftime", tone: "warning", isLive: true, isFinal: false };
  }

  if (/qtr|quarter|1st|2nd|3rd|4th/i.test(rawStatus) || (Number.isFinite(period) && period > 0 && period < 5)) {
    return {
      label: Number.isFinite(period) && period > 0 ? `Q${period}` : rawStatus,
      detail: String(game.time || "").trim() || rawStatus,
      tone: "live",
      isLive: true,
      isFinal: false
    };
  }

  return {
    label: rawStatus || "Scheduled",
    detail: game.datetime ? formatShortDateTime(game.datetime) : rawStatus || "Scheduled",
    tone: "scheduled",
    isLive: false,
    isFinal: false
  };
}

function getGameLeader(awayScore, homeScore, status) {
  if (!Number.isFinite(awayScore) || !Number.isFinite(homeScore) || !/final|qtr|half|quarter|1st|2nd|3rd|4th/i.test(String(status || ""))) {
    return null;
  }

  if (awayScore === homeScore) {
    return "tie";
  }

  return awayScore > homeScore ? "away" : "home";
}

async function fetchNbaPlayerTotals(season) {
  const endpoint = new URL("/api/playertotals", NBA_STATS_ORIGIN);
  endpoint.searchParams.set("season", String(season));
  endpoint.searchParams.set("page", "1");
  endpoint.searchParams.set("pageSize", "8");
  endpoint.searchParams.set("sortBy", "points");
  endpoint.searchParams.set("ascending", "false");
  endpoint.searchParams.set("isPlayoff", "false");

  const payload = await fetchJsonWithTimeout(endpoint, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "PulseDeck Sports Pulse/1.0"
    }
  }, 9000);

  return Array.isArray(payload?.data) ? payload.data : [];
}

function normalizeNbaStatSignal(rows, season) {
  const leaders = rows
    .filter((row) => row?.playerName)
    .map((row) => {
      const games = numberOrNull(row.games);
      const points = numberOrNull(row.points);
      const ppg = Number.isFinite(points) && Number.isFinite(games) && games > 0 ? points / games : null;

      return {
        playerName: row.playerName,
        team: row.team || "--",
        position: row.position || "--",
        games,
        points,
        ppg,
        assists: numberOrNull(row.assists),
        rebounds: numberOrNull(row.totalRb),
        statLine: `${formatOneDecimal(ppg)} PPG`
      };
    });
  const top = leaders[0];

  if (!top) {
    return {
      status: "empty",
      label: "NBA Stat Signal",
      headline: "Leaders pending",
      season,
      leaders: [],
      detail: "No player total rows returned."
    };
  }

  return {
    status: "live",
    label: "Top scorer",
    headline: `${top.playerName} ${formatOneDecimal(top.ppg)} PPG`,
    season,
    statLabel: "Season points",
    statValue: Number.isFinite(top.points) ? Math.round(top.points).toLocaleString("en-US") : "--",
    detail: `${top.team} / ${Number.isFinite(top.games) ? `${top.games} GP` : "Games pending"}`,
    leaders: leaders.slice(0, 4)
  };
}

function buildNbaSignalError(error) {
  return {
    status: "error",
    label: "NBA Stat Signal",
    headline: "Stats offline",
    season: getCurrentNbaSeasonYear(),
    leaders: [],
    detail: error.message || "NBA stats unavailable."
  };
}

async function fetchOpenF1Json(pathname, timeoutMs = 8000) {
  const endpoint = new URL(pathname, OPENF1_ORIGIN);
  const headers = {
    "Accept": "application/json",
    "User-Agent": "PulseDeck Sports Pulse/1.0"
  };

  if (process.env.OPENF1_API_KEY) {
    headers.Authorization = `Bearer ${process.env.OPENF1_API_KEY}`;
  }

  return fetchJsonWithTimeout(endpoint, { headers }, timeoutMs);
}

function pickLatestOpenF1Session(sessions) {
  return (Array.isArray(sessions) ? sessions : [])
    .filter((session) => session?.session_key)
    .sort((a, b) => new Date(b.date_start || 0) - new Date(a.date_start || 0))[0] || null;
}

function buildOpenF1DriverMap(drivers) {
  return new Map((Array.isArray(drivers) ? drivers : []).map((driver) => [
    Number(driver.driver_number),
    {
      number: Number(driver.driver_number),
      abbreviation: driver.name_acronym || driver.broadcast_name || String(driver.driver_number),
      name: driver.full_name || driver.broadcast_name || `Driver ${driver.driver_number}`,
      team: driver.team_name || "Team pending"
    }
  ]));
}

function normalizeOpenF1Results(rows, driverMap) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => Number.isFinite(Number(row.position)))
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((row) => normalizeOpenF1Standing(row, driverMap));
}

function normalizeOpenF1Positions(rows, driverMap) {
  const latestByDriver = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const driverNumber = Number(row.driver_number);
    const previous = latestByDriver.get(driverNumber);

    if (!previous || new Date(row.date || 0) > new Date(previous.date || 0)) {
      latestByDriver.set(driverNumber, row);
    }
  });

  return [...latestByDriver.values()]
    .filter((row) => Number.isFinite(Number(row.position)))
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((row) => normalizeOpenF1Standing(row, driverMap));
}

function normalizeOpenF1Standing(row, driverMap) {
  const driverNumber = Number(row.driver_number);
  const driver = driverMap.get(driverNumber) || {
    number: driverNumber,
    abbreviation: String(driverNumber),
    name: `Driver ${driverNumber}`,
    team: "Team pending"
  };

  return {
    position: numberOrNull(row.position),
    driver,
    gap: formatF1Gap(row.gap_to_leader),
    laps: numberOrNull(row.number_of_laps),
    duration: normalizeF1Duration(row.duration)
  };
}

function normalizeOpenF1Weather(row) {
  if (!row) {
    return null;
  }

  return {
    airTempC: numberOrNull(row.air_temperature),
    trackTempC: numberOrNull(row.track_temperature),
    rainfall: numberOrNull(row.rainfall),
    humidity: numberOrNull(row.humidity),
    windSpeed: numberOrNull(row.wind_speed)
  };
}

function buildF1UnavailableSignal(error) {
  return {
    updatedAt: new Date().toISOString(),
    status: "error",
    source: "OpenF1 API",
    raceWeekend: false,
    signal: {
      status: "historical",
      label: "Historical",
      isHistorical: true,
      meetingName: "F1 signal pending",
      sessionName: "OpenF1 unavailable",
      circuit: null,
      topDriver: null,
      positions: [],
      weather: null,
      detail: error.message || "OpenF1 data unavailable."
    },
    message: error.message || "OpenF1 data unavailable.",
    errors: [{ source: "OpenF1 API", message: error.message || "OpenF1 data unavailable." }]
  };
}

async function fetchFplJson(pathname, timeoutMs = 9000) {
  const endpoint = new URL(pathname, FPL_ORIGIN);
  return fetchJsonWithTimeout(endpoint, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "PulseDeck Sports Pulse/1.0"
    }
  }, timeoutMs);
}

function normalizeEplSignal(bootstrap, fixtures) {
  const teams = new Map((bootstrap?.teams || []).map((team) => [
    team.id,
    {
      name: team.name,
      shortName: team.short_name || team.name
    }
  ]));
  const positions = new Map((bootstrap?.element_types || []).map((type) => [type.id, type.singular_name_short || type.singular_name]));
  const events = Array.isArray(bootstrap?.events) ? bootstrap.events : [];
  const elements = Array.isArray(bootstrap?.elements) ? bootstrap.elements : [];
  const now = Date.now();
  const current = events.find((event) => event.is_current)
    || events.find((event) => !event.finished && new Date(event.deadline_time).getTime() >= now)
    || [...events].reverse().find((event) => event.finished)
    || events[0]
    || null;
  const next = events.find((event) => event.is_next)
    || events.find((event) => !event.finished && new Date(event.deadline_time).getTime() >= now)
    || null;
  const topPlayer = normalizeFplTopPlayer(elements, teams, positions);
  const fixtureSignal = normalizeFplFixtures(fixtures, teams);

  return {
    status: "live",
    label: "Premier League / FPL",
    gameweek: current?.id || next?.id || null,
    gameweekLabel: current ? `GW ${current.id}` : next ? `GW ${next.id}` : "Gameweek pending",
    gameweekStatus: current?.finished ? "Complete" : current?.is_current ? "Current" : next ? "Next" : "Pending",
    deadline: next?.deadline_time || current?.deadline_time || null,
    topPlayer,
    fixtures: fixtureSignal.fixtures,
    fixtureMode: fixtureSignal.mode,
    detail: fixtureSignal.fixtures.length ? `${fixtureSignal.mode} fixtures loaded.` : "Fixtures pending."
  };
}

function normalizeFplTopPlayer(elements, teams, positions) {
  const player = [...elements]
    .filter((element) => element?.web_name)
    .sort((a, b) => Number(b.total_points || 0) - Number(a.total_points || 0))[0];

  if (!player) {
    return {
      name: "Player signal pending",
      team: "--",
      position: "--",
      points: null,
      form: null,
      selectedByPercent: null
    };
  }

  return {
    name: player.web_name,
    fullName: `${player.first_name || ""} ${player.second_name || ""}`.trim() || player.web_name,
    team: teams.get(player.team)?.shortName || "--",
    position: positions.get(player.element_type) || "--",
    points: numberOrNull(player.total_points),
    form: numberOrNull(player.form),
    selectedByPercent: numberOrNull(player.selected_by_percent)
  };
}

function normalizeFplFixtures(fixtures, teams) {
  const now = Date.now();
  const allFixtures = Array.isArray(fixtures) ? fixtures : [];
  const upcoming = allFixtures
    .filter((fixture) => fixture.kickoff_time && new Date(fixture.kickoff_time).getTime() >= now)
    .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time));
  const recent = allFixtures
    .filter((fixture) => fixture.kickoff_time && new Date(fixture.kickoff_time).getTime() < now)
    .sort((a, b) => new Date(b.kickoff_time) - new Date(a.kickoff_time));
  const picked = upcoming.length ? upcoming.slice(0, 3) : recent.slice(0, 3);

  return {
    mode: upcoming.length ? "Upcoming" : picked.length ? "Recent" : "Pending",
    fixtures: picked.map((fixture) => ({
      id: fixture.id,
      kickoff: fixture.kickoff_time || null,
      status: fixture.finished ? "Final" : fixture.started ? "Live" : "Scheduled",
      home: teams.get(fixture.team_h)?.shortName || `Team ${fixture.team_h}`,
      away: teams.get(fixture.team_a)?.shortName || `Team ${fixture.team_a}`,
      homeScore: numberOrNull(fixture.team_h_score),
      awayScore: numberOrNull(fixture.team_a_score),
      difficulty: Math.max(Number(fixture.team_h_difficulty || 0), Number(fixture.team_a_difficulty || 0)) || null
    }))
  };
}

function buildEplUnavailableSignal(error) {
  return {
    updatedAt: new Date().toISOString(),
    status: "error",
    source: "Fantasy Premier League API",
    signal: {
      status: "error",
      label: "Premier League / FPL",
      gameweek: null,
      gameweekLabel: "Gameweek pending",
      gameweekStatus: "Offline",
      topPlayer: null,
      fixtures: [],
      fixtureMode: "Pending",
      detail: error.message || "FPL data unavailable."
    },
    message: error.message || "FPL data unavailable.",
    errors: [{ source: "Fantasy Premier League API", message: error.message || "FPL data unavailable." }]
  };
}

function getSettledArray(result) {
  return result.status === "fulfilled" && Array.isArray(result.value) ? result.value : [];
}

function getLatestDatedRecord(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;
}

function getCurrentNbaSeasonYear() {
  const now = new Date();
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
}

function formatDateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function formatShortDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  });
}

function formatOneDecimal(value) {
  return Number.isFinite(value) ? value.toFixed(1) : "--";
}

function formatF1MeetingName(session = {}) {
  if (session.meeting_name) {
    return session.meeting_name;
  }

  if (session.country_name) {
    return `${session.country_name} Grand Prix`;
  }

  return session.location || "Formula 1";
}

function isRaceWeekendSession(session = {}) {
  const start = new Date(session.date_start || 0).getTime();
  const end = new Date(session.date_end || session.date_start || 0).getTime();
  const now = Date.now();
  const margin = 3 * 24 * 60 * 60 * 1000;

  return Number.isFinite(start) && Number.isFinite(end) && now >= start - margin && now <= end + margin;
}

function formatF1Gap(value) {
  if (Array.isArray(value)) {
    return formatF1Gap(value.filter((item) => item !== null && item !== undefined).at(-1));
  }

  if (value === null || value === undefined || value === 0) {
    return "Leader";
  }

  if (typeof value === "string") {
    return value;
  }

  return Number.isFinite(Number(value)) ? `+${Number(value).toFixed(3)}s` : "--";
}

function normalizeF1Duration(value) {
  if (Array.isArray(value)) {
    return normalizeF1Duration(value.filter((item) => item !== null && item !== undefined).at(-1));
  }

  return numberOrNull(value);
}

async function loadTravelAirportPulse(force = false) {
  const cacheKey = TRAVEL_AIRPORT_IDS.join(",");
  const cached = travelWeatherCache.get(cacheKey);
  const now = Date.now();

  if (cached && !force && now - cached.createdAt < AIRPORT_WEATHER_CACHE_MS) {
    return {
      ...cached.data,
      cache: {
        ...cached.data.cache,
        status: "fresh",
        ageSeconds: Math.round((now - cached.createdAt) / 1000)
      }
    };
  }

  const [metadataResult, metarResult, tafResult] = await Promise.allSettled([
    loadAirportMetadata(force),
    fetchAviationWeatherProduct("metar"),
    fetchAviationWeatherProduct("taf")
  ]);
  const metadata = metadataResult.status === "fulfilled" ? metadataResult.value : buildLocalAirportMetadata();
  const metars = metarResult.status === "fulfilled" ? metarResult.value : [];
  const tafs = tafResult.status === "fulfilled" ? tafResult.value : [];
  const metarError = metarResult.status === "rejected" ? metarResult.reason : null;
  const tafError = tafResult.status === "rejected" ? tafResult.reason : null;
  const airports = TRAVEL_AIRPORT_IDS.map((icao) => normalizeAirportPulse({
    icao,
    metadata: metadata.airports[icao] || getLocalAirport(icao),
    metar: metars.find((item) => item?.icaoId === icao),
    taf: tafs.find((item) => item?.icaoId === icao),
    metarError,
    tafError
  }));
  const payload = {
    asOf: new Date(now).toISOString(),
    source: {
      weather: "AviationWeather Data API",
      metadata: metadata.sources,
      optional: metadata.optional
    },
    refreshSeconds: Math.round(AIRPORT_WEATHER_CACHE_MS / 1000),
    cache: {
      status: cached ? "updated" : "miss",
      ageSeconds: 0
    },
    summary: buildAirportSummary(airports),
    airports
  };

  travelWeatherCache.set(cacheKey, {
    createdAt: now,
    data: payload
  });

  return payload;
}

async function loadAirportMetadata(force = false) {
  const cacheKey = TRAVEL_AIRPORT_IDS.join(",");
  const cached = airportMetadataCache.get(cacheKey);
  const now = Date.now();

  if (cached && !force && now - cached.createdAt < AIRPORT_META_CACHE_MS) {
    return {
      ...cached.data,
      cacheStatus: "fresh"
    };
  }

  const airports = buildLocalAirportMetadata().airports;
  const sources = new Set(["Local airport metadata"]);
  const optional = {
    aviationWeather: "unavailable",
    aviationApi: "unavailable",
    airportsapi: "unavailable"
  };
  const [aviationWeatherAirports, aviationApiAirports, airportsApiAirports] = await Promise.allSettled([
    fetchAviationWeatherAirports(),
    fetchAviationApiAirports(),
    fetchAirportsApiMetadata()
  ]);

  if (aviationWeatherAirports.status === "fulfilled") {
    mergeAirportMetadata(airports, aviationWeatherAirports.value, "aviationWeather");
    sources.add("AviationWeather airport data");
    optional.aviationWeather = "connected";
  }

  if (aviationApiAirports.status === "fulfilled" && aviationApiAirports.value.length) {
    mergeAirportMetadata(airports, aviationApiAirports.value, "aviationApi");
    sources.add("AviationAPI");
    optional.aviationApi = "connected";
  }

  if (airportsApiAirports.status === "fulfilled" && airportsApiAirports.value.length) {
    mergeAirportMetadata(airports, airportsApiAirports.value, "airportsapi");
    sources.add("airportsapi.com");
    optional.airportsapi = "connected";
  }

  const data = {
    airports,
    sources: [...sources],
    optional,
    cacheStatus: cached ? "updated" : "miss"
  };

  airportMetadataCache.set(cacheKey, {
    createdAt: now,
    data
  });

  return data;
}

async function loadTransitPulse(apiKey, force = false) {
  const cacheKey = "transitland:nc-airports";
  const cached = transitCache.get(cacheKey);
  const now = Date.now();

  if (cached && !force && now - cached.createdAt < TRANSIT_CACHE_MS) {
    return {
      ...cached.data,
      cache: {
        status: "fresh",
        ageSeconds: Math.round((now - cached.createdAt) / 1000)
      }
    };
  }

  const lookups = await Promise.allSettled(
    TRAVEL_AIRPORT_IDS.map((icao) => fetchTransitLandFeeds(apiKey, getLocalAirport(icao)))
  );
  const providers = lookups.flatMap((result, index) => {
    const airport = getLocalAirport(TRAVEL_AIRPORT_IDS[index]);

    if (result.status !== "fulfilled") {
      return [{
        airport: airport.iata,
        city: airport.city,
        status: "error",
        message: result.reason?.message || "Transit lookup failed."
      }];
    }

    return result.value.map((provider) => ({
      airport: airport.iata,
      city: airport.city,
      status: "connected",
      ...provider
    }));
  });
  const connectedProviders = providers.filter((provider) => provider.status === "connected");
  const data = {
    connected: true,
    status: connectedProviders.length ? "connected" : "empty",
    asOf: new Date(now).toISOString(),
    message: connectedProviders.length
      ? `${connectedProviders.length} nearby transit feed${connectedProviders.length === 1 ? "" : "s"} found.`
      : "TransitLand connected, but no nearby feeds were returned.",
    providers: providers.slice(0, 12),
    cache: {
      status: cached ? "updated" : "miss",
      ageSeconds: 0
    }
  };

  transitCache.set(cacheKey, {
    createdAt: now,
    data
  });

  return data;
}

function normalizeNwsUrl(value) {
  if (!value) {
    throw new Error("Missing NWS URL.");
  }

  const nwsUrl = new URL(value, NWS_ORIGIN);

  if (nwsUrl.origin !== NWS_ORIGIN) {
    throw new Error("Only api.weather.gov URLs can be requested.");
  }

  return nwsUrl;
}

function parseNwsFeatureFlags(value = "") {
  return String(value || "")
    .split(",")
    .map((flag) => flag.trim())
    .filter((flag) => NWS_FEATURE_FLAGS.has(flag));
}

async function fetchAviationWeatherProduct(product) {
  const productPath = product === "taf" ? "taf" : "metar";
  const endpoint = `${AVIATION_WEATHER_ORIGIN}/api/data/${productPath}?ids=${TRAVEL_AIRPORT_IDS.join(",")}&format=json`;
  const payload = await fetchJsonWithTimeout(endpoint, {
    headers: {
      "Accept": "application/json",
      "User-Agent": AVIATION_WEATHER_USER_AGENT
    }
  });

  if (!Array.isArray(payload)) {
    throw new Error(`AviationWeather ${productPath.toUpperCase()} response was not a list.`);
  }

  return payload;
}

async function fetchAviationWeatherAirports() {
  const endpoint = `${AVIATION_WEATHER_ORIGIN}/api/data/airport?ids=${TRAVEL_AIRPORT_IDS.join(",")}&format=json`;
  const payload = await fetchJsonWithTimeout(endpoint, {
    headers: {
      "Accept": "application/json",
      "User-Agent": AVIATION_WEATHER_USER_AGENT
    }
  });

  if (!Array.isArray(payload)) {
    throw new Error("AviationWeather airport response was not a list.");
  }

  return payload.map((airport) => ({
    icao: airport.icaoId,
    iata: airport.iataId,
    faa: airport.faaId,
    name: cleanAirportName(airport.name),
    state: airport.state,
    lat: airport.lat,
    lon: airport.lon,
    elevationFt: metersToFeet(airport.elev),
    runways: Array.isArray(airport.runways) ? airport.runways : [],
    source: "AviationWeather"
  }));
}

async function fetchAviationApiAirports() {
  const endpoint = `${AVIATION_API_ORIGIN}/v1/airports?apt=${TRAVEL_AIRPORT_IDS.join(",")}`;
  const response = await fetchWithTimeout(endpoint, {
    headers: {
      "Accept": "application/json",
      "User-Agent": AVIATION_WEATHER_USER_AGENT
    }
  }, 3500);
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok || !contentType.includes("json")) {
    throw new Error("AviationAPI airport data unavailable.");
  }

  const payload = await response.json();
  const records = Array.isArray(payload)
    ? payload
    : Object.entries(payload || {}).map(([icao, value]) => ({ icao, ...value }));

  return records
    .map((airport) => ({
      icao: String(airport.icao || airport.icaoId || airport.ident || airport.id || "").toUpperCase(),
      iata: airport.iata || airport.iataId,
      faa: airport.faa || airport.faaId,
      name: cleanAirportName(airport.name || airport.facility_name || airport.airport_name),
      lat: Number(airport.lat || airport.latitude),
      lon: Number(airport.lon || airport.longitude),
      source: "AviationAPI"
    }))
    .filter((airport) => TRAVEL_AIRPORT_IDS.includes(airport.icao));
}

async function fetchAirportsApiMetadata() {
  const results = await Promise.allSettled(
    TRAVEL_AIRPORT_IDS.map(async (icao) => {
      const endpoint = `${AIRPORTS_API_ORIGIN}/api/airports/${encodeURIComponent(icao)}`;
      const payload = await fetchJsonWithTimeout(endpoint, {
        headers: {
          "Accept": "application/vnd.api+json, application/json",
          "User-Agent": AVIATION_WEATHER_USER_AGENT
        }
      }, 4500);
      const attributes = payload?.data?.attributes || {};

      return {
        icao,
        iata: attributes.iata_code,
        name: cleanAirportName(attributes.name),
        lat: Number(attributes.latitude),
        lon: Number(attributes.longitude),
        elevationFt: Number(attributes.elevation),
        type: attributes.type,
        source: "airportsapi"
      };
    })
  );

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}

async function fetchTransitLandFeeds(apiKey, airport) {
  const endpoint = new URL("/api/v2/rest/feeds", TRANSITLAND_ORIGIN);
  endpoint.searchParams.set("lat", String(airport.lat));
  endpoint.searchParams.set("lon", String(airport.lon));
  endpoint.searchParams.set("radius", "35000");
  endpoint.searchParams.set("limit", "4");

  const payload = await fetchJsonWithTimeout(endpoint, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "PulseDeck Transit Pulse/1.0",
      "apikey": apiKey
    }
  }, 8000);
  const feeds = payload?.feeds || payload?.data || [];

  if (!Array.isArray(feeds)) {
    return [];
  }

  return feeds.slice(0, 4).map((feed) => ({
    name: feed.name || feed.feed_name || feed.onestop_id || feed.id || "Transit feed",
    onestopId: feed.onestop_id || feed.id,
    spec: feed.spec || feed.feed_format || "GTFS",
    updatedAt: feed.updated_at || feed.last_successful_fetch_at || feed.imported_at || null
  }));
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 8000) {
  const response = await fetchWithTimeout(url, options, timeoutMs);

  if (!response.ok) {
    throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  }

  return response.json();
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow"
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildLocalAirportMetadata() {
  return {
    airports: Object.fromEntries(TRAVEL_AIRPORT_IDS.map((icao) => [icao, getLocalAirport(icao)])),
    sources: ["Local airport metadata"],
    optional: {
      aviationWeather: "unavailable",
      aviationApi: "unavailable",
      airportsapi: "unavailable"
    }
  };
}

function getLocalAirport(icao) {
  return { ...LOCAL_AIRPORTS[icao] };
}

function mergeAirportMetadata(airports, records, source) {
  records.forEach((record) => {
    if (!record?.icao || !airports[record.icao]) {
      return;
    }

    airports[record.icao] = {
      ...airports[record.icao],
      ...removeEmptyValues(record),
      city: airports[record.icao].city,
      state: record.state || airports[record.icao].state,
      source
    };
  });
}

function normalizeAirportPulse({ icao, metadata, metar, taf, metarError, tafError }) {
  const airport = metadata || getLocalAirport(icao);
  const currentTaf = getRelevantTafPeriod(taf);
  const metarVisibility = parseVisibilityMiles(metar?.visib);
  const tafVisibility = parseVisibilityMiles(currentTaf?.visib);
  const metarCeiling = getCeiling(metar?.clouds, metar?.vertVis);
  const tafCeiling = getCeiling(currentTaf?.clouds, currentTaf?.vertVis);
  const flightCategory = normalizeFlightCategory(metar?.fltCat)
    || deriveFlightCategory(metarVisibility ?? tafVisibility, metarCeiling?.feet ?? tafCeiling?.feet)
    || "Unknown";
  const risk = scoreAirportRisk({
    flightCategory,
    metar,
    taf,
    currentTaf,
    visibilityMiles: metarVisibility ?? tafVisibility,
    ceilingFeet: metarCeiling?.feet ?? tafCeiling?.feet
  });
  const observedAt = metar?.reportTime || unixSecondsToIso(metar?.obsTime);
  const hasMetar = Boolean(metar);
  const hasTaf = Boolean(taf);

  return {
    icao,
    iata: airport.iata || icao.replace(/^K/, ""),
    faa: airport.faa || airport.iata || icao.replace(/^K/, ""),
    city: airport.city,
    state: airport.state || "NC",
    name: airport.name,
    lat: airport.lat,
    lon: airport.lon,
    flightCategory,
    observedAt,
    tempC: numberOrNull(metar?.temp),
    tempF: celsiusToFahrenheit(metar?.temp),
    wind: normalizeWind(metar || currentTaf),
    visibility: {
      miles: metarVisibility,
      text: formatVisibility(metar?.visib, metarVisibility)
    },
    ceiling: {
      feet: metarCeiling?.feet ?? null,
      text: formatCeiling(metarCeiling)
    },
    taf: {
      issuedAt: taf?.issueTime || null,
      summary: summarizeTaf(taf),
      raw: taf?.rawTAF || null
    },
    risk,
    rawMetar: metar?.rawOb || null,
    error: hasMetar
      ? null
      : metarError?.message || "METAR unavailable for this airport.",
    forecastError: hasTaf
      ? null
      : tafError?.message || "TAF unavailable for this airport."
  };
}

function buildAirportSummary(airports) {
  const ranked = airports
    .filter((airport) => !airport.error || airport.flightCategory !== "Unknown")
    .sort((a, b) => a.risk.level - b.risk.level || categoryRank(a.flightCategory) - categoryRank(b.flightCategory));
  const highest = [...airports].sort((a, b) => b.risk.level - a.risk.level)[0];
  const best = ranked[0] || airports[0];

  return {
    bestAirport: summarizeAirportSignal(best),
    highestRisk: summarizeAirportSignal(highest),
    airportsTracked: airports.length
  };
}

function summarizeAirportSignal(airport) {
  if (!airport) {
    return {
      iata: "--",
      icao: "--",
      label: "No signal",
      riskLabel: "Unknown",
      riskLevel: 1,
      tone: "unknown"
    };
  }

  return {
    iata: airport.iata,
    icao: airport.icao,
    city: airport.city,
    label: `${airport.iata} ${airport.risk.label}`,
    riskLabel: airport.risk.label,
    riskLevel: airport.risk.level,
    tone: airport.risk.tone
  };
}

function scoreAirportRisk({ flightCategory, metar, taf, currentTaf, visibilityMiles, ceilingFeet }) {
  let score = {
    VFR: 0,
    MVFR: 1,
    IFR: 2,
    LIFR: 3
  }[flightCategory] ?? 1;
  const reasons = [flightCategory === "Unknown" ? "Category pending" : flightCategory];
  const gust = Number(metar?.wgst ?? currentTaf?.wgst);
  const sustained = Number(metar?.wspd ?? currentTaf?.wspd);

  if (Number.isFinite(gust) && gust >= 35) {
    score += 2;
    reasons.push(`Gusts ${gust} kt`);
  } else if ((Number.isFinite(gust) && gust >= 25) || (Number.isFinite(sustained) && sustained >= 25)) {
    score += 1;
    reasons.push(`Wind ${Math.max(gust || 0, sustained || 0)} kt`);
  }

  if (Number.isFinite(visibilityMiles) && visibilityMiles < 3) {
    score += 2;
    reasons.push(`Visibility ${visibilityMiles} mi`);
  } else if (Number.isFinite(visibilityMiles) && visibilityMiles < 5) {
    score += 1;
    reasons.push(`Visibility ${visibilityMiles} mi`);
  }

  if (Number.isFinite(ceilingFeet) && ceilingFeet < 500) {
    score += 2;
    reasons.push(`Ceiling ${ceilingFeet} ft`);
  } else if (Number.isFinite(ceilingFeet) && ceilingFeet < 1000) {
    score += 1;
    reasons.push(`Ceiling ${ceilingFeet} ft`);
  }

  if (hasThunderstormSignal(metar?.rawOb || metar?.wxString)) {
    score += 2;
    reasons.push("Thunderstorm in METAR");
  } else if (hasThunderstormSignal(taf?.rawTAF) || hasThunderstormSignal(currentTaf?.wxString) || hasCbCloud(currentTaf?.clouds)) {
    score += 1;
    reasons.push("Storm risk in TAF");
  }

  const level = Math.max(0, Math.min(3, score));
  const labels = ["Clear", "Watch", "Delay Risk", "Ground Risk"];
  const tones = ["clear", "watch", "delay", "ground"];

  return {
    level,
    label: labels[level],
    tone: tones[level],
    reasons: [...new Set(reasons)].slice(0, 4)
  };
}

function summarizeTaf(taf) {
  if (!taf?.fcsts?.length) {
    return "Forecast pending.";
  }

  const now = Math.floor(Date.now() / 1000);
  const relevant = taf.fcsts.find((period) => period.timeFrom <= now && now < period.timeTo)
    || taf.fcsts.find((period) => period.timeFrom >= now)
    || taf.fcsts[0];
  const stormPeriod = taf.fcsts.find((period) => (
    period.timeFrom >= now - 1800
    && period.timeFrom <= now + 12 * 60 * 60
    && (hasThunderstormSignal(period.wxString) || hasCbCloud(period.clouds))
  ));
  const period = stormPeriod || relevant;
  const parts = [
    formatTafWindow(period),
    period.probability ? `${period.probability}% chance` : null,
    period.wxString || (hasCbCloud(period.clouds) ? "CB clouds" : "quiet weather"),
    normalizeWind(period).text,
    formatVisibility(period.visib, parseVisibilityMiles(period.visib)),
    formatCeiling(getCeiling(period.clouds, period.vertVis))
  ].filter(Boolean);

  return parts.join(" · ");
}

function getRelevantTafPeriod(taf) {
  const now = Math.floor(Date.now() / 1000);
  return taf?.fcsts?.find((period) => period.timeFrom <= now && now < period.timeTo)
    || taf?.fcsts?.find((period) => period.timeFrom >= now)
    || taf?.fcsts?.[0]
    || null;
}

function normalizeFlightCategory(value) {
  const category = String(value || "").trim().toUpperCase();
  return ["VFR", "MVFR", "IFR", "LIFR"].includes(category) ? category : null;
}

function deriveFlightCategory(visibilityMiles, ceilingFeet) {
  if (!Number.isFinite(visibilityMiles) && !Number.isFinite(ceilingFeet)) {
    return null;
  }

  if ((Number.isFinite(ceilingFeet) && ceilingFeet < 500) || (Number.isFinite(visibilityMiles) && visibilityMiles < 1)) {
    return "LIFR";
  }

  if ((Number.isFinite(ceilingFeet) && ceilingFeet < 1000) || (Number.isFinite(visibilityMiles) && visibilityMiles < 3)) {
    return "IFR";
  }

  if ((Number.isFinite(ceilingFeet) && ceilingFeet <= 3000) || (Number.isFinite(visibilityMiles) && visibilityMiles <= 5)) {
    return "MVFR";
  }

  return "VFR";
}

function categoryRank(category) {
  return {
    VFR: 0,
    MVFR: 1,
    IFR: 2,
    LIFR: 3,
    Unknown: 4
  }[category] ?? 4;
}

function parseVisibilityMiles(value) {
  if (Number.isFinite(value)) {
    return Number(value);
  }

  const text = String(value || "").replace(/[+SM]/gi, "").trim();

  if (!text) {
    return null;
  }

  if (text.includes("/")) {
    const pieces = text.split(/\s+/);
    const whole = Number(pieces.length > 1 ? pieces[0] : 0);
    const fraction = pieces[pieces.length - 1].split("/");
    const numerator = Number(fraction[0]);
    const denominator = Number(fraction[1]);

    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return Number(((Number.isFinite(whole) ? whole : 0) + numerator / denominator).toFixed(2));
    }
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCeiling(clouds = [], verticalVisibility) {
  if (Number.isFinite(verticalVisibility)) {
    return {
      cover: "VV",
      feet: Number(verticalVisibility)
    };
  }

  const ceilingCloud = (Array.isArray(clouds) ? clouds : [])
    .filter((cloud) => ["BKN", "OVC", "OVX", "VV"].includes(String(cloud.cover || "").toUpperCase()))
    .sort((a, b) => Number(a.base || Infinity) - Number(b.base || Infinity))[0];

  if (!ceilingCloud || !Number.isFinite(Number(ceilingCloud.base))) {
    return null;
  }

  return {
    cover: String(ceilingCloud.cover || "").toUpperCase(),
    feet: Number(ceilingCloud.base)
  };
}

function normalizeWind(source = {}) {
  const speed = numberOrNull(source.wspd);
  const gust = numberOrNull(source.wgst);
  const direction = source.wdir === "VRB" ? "VRB" : numberOrNull(source.wdir);
  const directionText = direction === "VRB"
    ? "VRB"
    : Number.isFinite(direction)
      ? `${direction}\u00b0`
      : "Calm";

  if (!Number.isFinite(speed) || speed === 0) {
    return {
      direction,
      speedKt: speed || 0,
      gustKt: gust,
      text: "Calm"
    };
  }

  return {
    direction,
    speedKt: speed,
    gustKt: gust,
    text: `${directionText} ${speed} kt${Number.isFinite(gust) ? ` G${gust}` : ""}`
  };
}

function formatVisibility(original, miles) {
  if (!Number.isFinite(miles)) {
    return "Visibility pending";
  }

  const hasPlus = String(original || "").includes("+");
  return `${miles}${hasPlus ? "+" : ""} mi`;
}

function formatCeiling(ceiling) {
  if (!ceiling?.feet) {
    return "No ceiling";
  }

  return `${ceiling.cover} ${Math.round(ceiling.feet).toLocaleString()} ft`;
}

function formatTafWindow(period) {
  if (!period?.timeFrom) {
    return "Next TAF";
  }

  return `From ${new Date(period.timeFrom * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  })}`;
}

function hasThunderstormSignal(value = "") {
  return /\b(?:TS|VCTS|TSRA|\+TSRA|-TSRA)\b/i.test(String(value || ""));
}

function hasCbCloud(clouds = []) {
  return (Array.isArray(clouds) ? clouds : []).some((cloud) => String(cloud.type || "").toUpperCase() === "CB");
}

function celsiusToFahrenheit(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round((numeric * 9) / 5 + 32) : null;
}

function metersToFeet(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 3.28084) : null;
}

function numberOrNull(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function unixSecondsToIso(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Date(numeric * 1000).toISOString() : null;
}

function cleanAirportName(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^([^/]+)\/([^/]+)\//, "")
    .trim();
}

function removeEmptyValues(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => (
    value !== null
    && value !== undefined
    && value !== ""
    && !Number.isNaN(value)
  )));
}

function normalizeMalmeRoadsPath(value) {
  let nextValue = value || "/";

  if (/^https?:\/\//i.test(nextValue)) {
    const parsed = new URL(nextValue);
    if (parsed.origin !== MALMEROADS_ORIGIN) {
      throw new Error("Only malmeroads.net pages can be synced.");
    }
    nextValue = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  if (!nextValue.startsWith("/")) {
    nextValue = `/${nextValue}`;
  }

  return nextValue.replace(/\/{2,}/g, "/");
}

async function fetchMalmeRoadsPage(sourcePath, force = false) {
  const fetchPath = sourcePath.split("#")[0] || "/";
  const cached = malmeRoadsCache.get(fetchPath);
  const now = Date.now();

  if (cached && !force && now - cached.checkedAt < MALMEROADS_CACHE_MS) {
    return {
      ...cached,
      cacheStatus: "fresh"
    };
  }

  const headers = {
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
    "User-Agent": "PulseDeck MalmeRoads Sync/1.0"
  };

  if (cached?.etag) headers["If-None-Match"] = cached.etag;
  if (cached?.lastModified) headers["If-Modified-Since"] = cached.lastModified;

  const sourceUrl = new URL(fetchPath, MALMEROADS_ORIGIN);
  const upstreamResponse = await fetch(sourceUrl, { headers, redirect: "follow" });

  if (upstreamResponse.status === 304 && cached) {
    cached.checkedAt = now;
    return {
      ...cached,
      cacheStatus: "validated"
    };
  }

  if (!upstreamResponse.ok) {
    throw new Error(`${sourceUrl.href} returned ${upstreamResponse.status}`);
  }

  const contentType = upstreamResponse.headers.get("content-type") || "text/html; charset=utf-8";
  const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
  const html = decodeSourceHtml(buffer, contentType);
  const record = {
    html,
    sourcePath: fetchPath,
    sourceUrl: upstreamResponse.url,
    fetchedAt: new Date(now).toISOString(),
    fetchedAtMs: now,
    checkedAt: now,
    lastModified: upstreamResponse.headers.get("last-modified"),
    etag: upstreamResponse.headers.get("etag")
  };

  malmeRoadsCache.set(fetchPath, record);

  return {
    ...record,
    cacheStatus: cached ? "updated" : "miss"
  };
}

function decodeSourceHtml(buffer, contentType) {
  const charset = /charset=([^;\s]+)/i.exec(contentType)?.[1]?.toLowerCase() || "utf-8";
  const decoderName = charset.includes("8859") || charset.includes("latin") || charset.includes("windows")
    ? "windows-1252"
    : "utf-8";

  return new TextDecoder(decoderName).decode(buffer);
}

function parseSymbols(value) {
  const symbols = value
    ? value.split(",").map((symbol) => symbol.trim().toUpperCase())
    : DEFAULT_SYMBOLS;

  const cleaned = symbols.filter((symbol) => /^[A-Z.]{1,8}$/.test(symbol));
  return [...new Set(cleaned)].slice(0, 12);
}

async function fetchQuote(symbol) {
  const cached = quoteCache.get(symbol);

  if (cached && Date.now() - cached.createdAt < QUOTE_CACHE_MS) {
    return cached.data;
  }

  const endpoint = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m&includePrePost=true`;
  const upstreamResponse = await fetch(endpoint, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "PulseDeck/1.0"
    }
  });

  if (!upstreamResponse.ok) {
    throw new Error(`${symbol} quote request failed: ${upstreamResponse.status}`);
  }

  const payload = await upstreamResponse.json();
  const result = payload?.chart?.result?.[0];
  const meta = result?.meta;
  const timestamps = result?.timestamp || [];
  const closeValues = result?.indicators?.quote?.[0]?.close || [];
  const volumeValues = result?.indicators?.quote?.[0]?.volume || [];

  if (!meta || !timestamps.length || !closeValues.length) {
    throw new Error(`${symbol} quote payload missing chart data`);
  }

  const latestIndex = findLatestCloseIndex(closeValues);
  const price = closeValues[latestIndex] ?? meta.regularMarketPrice;
  const marketTime = timestamps[latestIndex] ?? meta.regularMarketTime;
  const previousClose = meta.chartPreviousClose || meta.previousClose;
  const change = price - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;
  const sparkline = compactSparkline(closeValues.filter((value) => Number.isFinite(value)), 160);
  const session = inferSession(marketTime, meta.currentTradingPeriod);
  const data = {
    symbol,
    name: meta.shortName || meta.longName || symbol,
    price,
    previousClose,
    change,
    changePercent,
    currency: meta.currency || "USD",
    exchange: meta.fullExchangeName || meta.exchangeName,
    session,
    marketTime,
    volume: volumeValues[latestIndex] || meta.regularMarketVolume,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    sparkline
  };

  quoteCache.set(symbol, {
    createdAt: Date.now(),
    data
  });

  return data;
}

function findLatestCloseIndex(closeValues) {
  for (let index = closeValues.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(closeValues[index])) {
      return index;
    }
  }

  return closeValues.length - 1;
}

function compactSparkline(values, maxPoints) {
  if (values.length <= maxPoints) {
    return values;
  }

  const step = Math.ceil(values.length / maxPoints);
  return values.filter((_, index) => index % step === 0).slice(-maxPoints);
}

function inferSession(timestamp, tradingPeriod) {
  const pre = tradingPeriod?.pre;
  const regular = tradingPeriod?.regular;
  const post = tradingPeriod?.post;

  if (isWithin(timestamp, regular)) {
    return "Regular";
  }

  if (isWithin(timestamp, pre)) {
    return "Pre-market";
  }

  if (isWithin(timestamp, post)) {
    return "After-hours";
  }

  return "Closed";
}

function isWithin(timestamp, period) {
  return Boolean(period && timestamp >= period.start && timestamp <= period.end);
}

function serveStaticFile(pathname, method, response) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  } catch {
    sendText(response, 400, "Bad request");
    return;
  }

  if (decodedPath.includes("\0") || decodedPath.split(/[\\/]+/).some((segment) => segment.startsWith("."))) {
    sendText(response, 403, "Forbidden");
    return;
  }

  const filePath = path.resolve(ROOT, `.${decodedPath}`);
  const relativePath = path.relative(ROOT, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendText(response, 404, "Not found");
      return;
    }

    fs.readFile(filePath, (readError, contents) => {
      if (readError) {
        sendText(response, 404, "Not found");
        return;
      }

      response.writeHead(200, getStaticHeaders(filePath));
      response.end(method === "HEAD" ? undefined : contents);
    });
  });
}

function getStaticHeaders(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  return {
    ...SECURITY_HEADERS,
    "Content-Type": contentTypes[extension] || "application/octet-stream",
    "Cache-Control": CACHEABLE_STATIC_EXTENSIONS.has(extension)
      ? "public, max-age=3600"
      : "no-cache"
  };
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    ...SECURITY_HEADERS,
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  response.end(body);
}
