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
const NWS_FEATURE_FLAGS = new Set([
  "forecast_temperature_qv",
  "forecast_wind_speed_qv",
  "obs_station_provider"
]);
const quoteCache = new Map();
const malmeRoadsCache = new Map();

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

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (requestUrl.pathname === "/api/quotes") {
      await handleQuotes(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/malmeroads/source") {
      await handleMalmeRoadsSource(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === "/api/nws") {
      await handleNwsProxy(requestUrl, response);
      return;
    }

    serveStaticFile(requestUrl.pathname, response);
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

async function handleNwsProxy(requestUrl, response) {
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
      "Content-Type": upstreamResponse.headers.get("content-type") || "application/geo+json; charset=utf-8",
      "Cache-Control": upstreamResponse.headers.get("cache-control") || "no-store"
    });
    response.end(body);
  } catch (error) {
    sendJson(response, 502, {
      error: "NWS request failed",
      message: error.message
    });
  }
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

function serveStaticFile(pathname, response) {
  const decodedPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  const filePath = path.resolve(ROOT, `.${decodedPath}`);

  if (!filePath.startsWith(ROOT)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
    });
    response.end(contents);
  });
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(body);
}
