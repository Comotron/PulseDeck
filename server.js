const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const NWS_ORIGIN = "https://api.weather.gov";
const NWS_USER_AGENT =
  process.env.NWS_USER_AGENT || "(PulseDeck, project-monitoring@example.com)";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
};

const nwsProxyHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type",
  "Access-Control-Allow-Private-Network": "true",
  Vary: "Origin",
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (requestUrl.pathname === "/api/nws") {
      await handleNwsProxy(request, requestUrl, response);
      return;
    }

    const staticPath = resolveStaticPath(requestUrl.pathname);
    serveStaticFile(staticPath, response);
  } catch (error) {
    sendJson(response, 500, {
      error: "Server error",
      message: error.message,
    });
  }
});

server.listen(PORT, () => {
  console.log(`PulseDeck running at http://localhost:${PORT}`);
  console.log(`Review preview: http://localhost:${PORT}/preview`);
  console.log(`Dashboard preview: http://localhost:${PORT}/preview/project-dashboard/`);
});

function resolveStaticPath(pathname) {
  let resolvedPath = pathname;

  if (resolvedPath === "/preview") {
    resolvedPath = "/";
  } else if (resolvedPath.startsWith("/preview/")) {
    resolvedPath = resolvedPath.slice("/preview".length) || "/";
  }

  if (resolvedPath === "/") return "/index.html";
  if (resolvedPath === "/project-dashboard" || resolvedPath === "/project-dashboard/") {
    return "/project-dashboard/index.html";
  }
  if (resolvedPath.endsWith("/")) return `${resolvedPath}index.html`;
  return resolvedPath;
}

async function handleNwsProxy(request, requestUrl, response) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, nwsProxyHeaders);
    response.end();
    return;
  }

  try {
    const nwsUrl = normalizeNwsUrl(requestUrl.searchParams.get("url"));
    const upstreamResponse = await fetch(nwsUrl, {
      headers: {
        Accept: "application/geo+json",
        "User-Agent": NWS_USER_AGENT,
      },
      redirect: "follow",
    });
    const body = await upstreamResponse.text();

    response.writeHead(upstreamResponse.status, {
      "Content-Type":
        upstreamResponse.headers.get("content-type") || "application/geo+json; charset=utf-8",
      "Cache-Control": upstreamResponse.headers.get("cache-control") || "no-store",
      ...nwsProxyHeaders,
    });
    response.end(body);
  } catch (error) {
    sendJson(
      response,
      502,
      {
        error: "NWS request failed",
        message: error.message,
      },
      nwsProxyHeaders
    );
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

function serveStaticFile(pathname, response) {
  const decodedPath = decodeURIComponent(pathname);
  const filePath = path.resolve(ROOT, `.${decodedPath}`);
  const relativePath = path.relative(ROOT, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      sendText(response, error.code === "ENOENT" ? 404 : 500, error.code === "ENOENT" ? "Not found" : "Read error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const shouldRevalidate = [".html", ".css", ".js"].includes(extension);
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Cache-Control": shouldRevalidate ? "no-cache" : "public, max-age=300",
    });
    response.end(contents);
  });
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(body);
}
