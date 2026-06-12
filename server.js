const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const DEFAULT_SYMBOLS = ["AAL", "TSLA", "VZ", "NVDA", "TMUS", "DAL", "AMZN"];
const QUOTE_CACHE_MS = 15_000;
const quoteCache = new Map();

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
