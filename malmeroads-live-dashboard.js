const SOURCE_ORIGIN = "https://malmeroads.net";
const BACKGROUND_REFRESH_MS = 120000;

const sourceRoutes = [
  {
    path: "/",
    label: "MalmeRoads Home",
    detail: "Top-level source hub and monthly update log.",
    tone: "blue",
    icon: "home"
  },
  {
    path: "/i7374nc/index.html",
    label: "I-73/74 in North Carolina",
    detail: "Progress pages, segment lists, exit lists, and source acknowledgments.",
    tone: "green",
    icon: "route"
  },
  {
    path: "/ncfutints/index.html",
    label: "NC New and Future Interstates",
    detail: "Proposed, planned, partially complete, and recently completed corridors.",
    tone: "orange",
    icon: "map"
  },
  {
    path: "/mass21c/",
    label: "Massachusetts Highways",
    detail: "Massachusetts photo pages, exit lists, and highway improvement references.",
    tone: "blue",
    icon: "signpost"
  }
];

const pageTitle = document.querySelector("#pageTitle");
const pageSubtitle = document.querySelector("#pageSubtitle");
const heroMedia = document.querySelector("#heroMedia");
const sourcePathLabel = document.querySelector("#sourcePathLabel");
const sourceStatusLabel = document.querySelector("#sourceStatusLabel");
const sourceTimeLabel = document.querySelector("#sourceTimeLabel");
const originalPageLink = document.querySelector("#originalPageLink");
const refreshSourceButton = document.querySelector("#refreshSourceButton");
const routeCards = document.querySelector("#routeCards");
const sourceReaderTitle = document.querySelector("#sourceReaderTitle");
const sourceReaderMeta = document.querySelector("#sourceReaderMeta");
const sourceContent = document.querySelector("#sourceContent");
const sourceHighlights = document.querySelector("#sourceHighlights");
const sourceSearchInput = document.querySelector("#sourceSearchInput");

let activeSourcePath = "/";
let activeController = null;
let lastSourcePayload = null;

function init() {
  renderRouteCards();
  bindNavigation();
  loadSource({ path: getPathFromUrl() });
  setInterval(() => loadSource({ path: activeSourcePath, background: true }), BACKGROUND_REFRESH_MS);
  refreshIcons();
}

function bindNavigation() {
  document.querySelectorAll("[data-source-path]").forEach((button) => {
    button.addEventListener("click", () => {
      setPath(button.dataset.sourcePath || "/");
    });
  });

  refreshSourceButton.addEventListener("click", () => {
    loadSource({ path: activeSourcePath, force: true });
  });

  sourceSearchInput.addEventListener("input", () => {
    applySearch(sourceSearchInput.value);
  });

  sourceContent.addEventListener("click", (event) => {
    const anchor = event.target.closest("a");
    if (!anchor) return;

    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== SOURCE_ORIGIN) return;

    event.preventDefault();
    setPath(`${url.pathname}${url.search}${url.hash}`);
  });

  window.addEventListener("popstate", () => {
    loadSource({ path: getPathFromUrl() });
  });
}

function getPathFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return normalizeSourcePath(params.get("source") || "/");
}

function setPath(path) {
  const normalized = normalizeSourcePath(path);
  const params = new URLSearchParams(window.location.search);
  params.set("source", normalized);
  window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadSource({ path: normalized });
}

function normalizeSourcePath(path) {
  let value = path || "/";

  if (/^https?:\/\//i.test(value)) {
    const parsed = new URL(value);
    value = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  if (!value.startsWith("/")) {
    value = `/${value}`;
  }

  return value.replace(/\/{2,}/g, "/");
}

async function loadSource({ path, force = false, background = false }) {
  activeSourcePath = normalizeSourcePath(path);
  updateActiveNav();

  if (activeController) {
    activeController.abort();
  }

  activeController = new AbortController();

  if (!background) {
    setLoading(true);
  }

  try {
    const params = new URLSearchParams({ path: activeSourcePath });
    if (force) params.set("force", "1");

    const response = await fetch(`/api/malmeroads/source?${params.toString()}`, {
      signal: activeController.signal,
      headers: { Accept: "application/json" }
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || payload.error || "Source sync failed.");
    }

    if (background && lastSourcePayload?.html === payload.html) {
      updateSyncTelemetry(payload);
      return;
    }

    lastSourcePayload = payload;
    renderSource(payload);
  } catch (error) {
    if (error.name !== "AbortError") {
      renderError(error);
    }
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  refreshSourceButton.disabled = isLoading;
  refreshSourceButton.classList.toggle("is-loading", isLoading);
  sourceStatusLabel.textContent = isLoading ? "Syncing" : sourceStatusLabel.textContent;
}

function renderSource(payload) {
  const parsed = parseSource(payload);
  pageTitle.textContent = parsed.title;
  pageSubtitle.textContent = parsed.subtitle;
  sourceReaderTitle.textContent = parsed.title;
  sourceReaderMeta.textContent = `Rendered from ${payload.sourceUrl}`;
  originalPageLink.href = payload.sourceUrl;
  sourceContent.replaceChildren(parsed.content);
  renderHeroMedia(parsed.images);
  renderHighlights(parsed.highlights);
  updateSyncTelemetry(payload);
  applySearch(sourceSearchInput.value);
  refreshIcons();
}

function parseSource(payload) {
  const documentFragment = new DOMParser().parseFromString(payload.html, "text/html");
  const sourceUrl = payload.sourceUrl || new URL(activeSourcePath, SOURCE_ORIGIN).href;
  const content = document.createElement("div");
  content.innerHTML = documentFragment.body?.innerHTML || payload.html;

  sanitizeSource(content);
  rewriteSourceUrls(content, sourceUrl);
  normalizeLegacyMarkup(content);
  wrapTables(content);

  const title = getSourceTitle(documentFragment, content);
  const subtitle = getSourceSubtitle(content, title);
  const images = [...content.querySelectorAll("img")]
    .filter((image) => image.src && !/updated\.gif$/i.test(image.src))
    .slice(0, 6)
    .map((image) => image.cloneNode(false));

  removeHeroDuplicates(content, title, subtitle);

  const highlights = extractHighlights(content);

  return {
    title,
    subtitle,
    content,
    images,
    highlights
  };
}

function sanitizeSource(container) {
  container.querySelectorAll("script, iframe, object, embed, link, meta, style").forEach((node) => node.remove());

  container.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || ["style", "bgcolor", "color", "face", "size", "align", "width", "height", "border"].includes(name)) {
        node.removeAttribute(attribute.name);
      }
    });
  });
}

function rewriteSourceUrls(container, sourceUrl) {
  container.querySelectorAll("img").forEach((image) => {
    const rawSource = image.getAttribute("src");
    if (!rawSource) {
      image.remove();
      return;
    }

    image.src = new URL(rawSource, sourceUrl).href;
    image.loading = "lazy";
    image.decoding = "async";
    if (!image.alt) image.alt = "";
  });

  container.querySelectorAll("a").forEach((anchor) => {
    const rawHref = anchor.getAttribute("href");
    if (!rawHref || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
      return;
    }

    const target = new URL(rawHref, sourceUrl);
    anchor.href = target.href;

    if (target.origin !== SOURCE_ORIGIN) {
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
    }
  });
}

function normalizeLegacyMarkup(container) {
  container.querySelectorAll("font, center").forEach((node) => {
    const replacement = document.createElement(node.tagName === "CENTER" ? "div" : "span");
    while (node.firstChild) replacement.appendChild(node.firstChild);
    node.replaceWith(replacement);
  });

  container.querySelectorAll("h1, h2, h3, h4").forEach((heading) => {
    if (!normalizeText(heading.textContent) && heading.querySelectorAll("img").length === 0) {
      heading.remove();
    }
  });
}

function wrapTables(container) {
  container.querySelectorAll("table").forEach((table) => {
    if (table.closest(".table-scroll")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function getSourceTitle(sourceDocument, content) {
  const title = displayText(sourceDocument.querySelector("title")?.textContent);
  if (title) return title;

  return [...content.querySelectorAll("h1, h2")]
    .map((heading) => displayText(heading.textContent))
    .find(Boolean) || "MalmeRoads";
}

function getSourceSubtitle(content, title) {
  return [...content.querySelectorAll("h1, h2, h3")]
    .map((heading) => displayText(heading.textContent))
    .find((text) => text && normalizedKey(text) !== normalizedKey(title) && !isSiteName(text) && !isIncidentalHeading(text))
    || "Live highway archive synchronized from MalmeRoads.Net.";
}

function removeHeroDuplicates(content, title, subtitle) {
  [...content.querySelectorAll("h1, h2, h3")].slice(0, 8).forEach((heading) => {
    const text = displayText(heading.textContent);
    if (
      normalizedKey(text) === normalizedKey(title) ||
      normalizedKey(text) === normalizedKey(subtitle) ||
      isSiteName(text) ||
      isIncidentalHeading(text)
    ) {
      heading.remove();
    }
  });
}

function extractHighlights(content) {
  const headings = [...content.querySelectorAll("h2, h3")]
    .map((heading) => displayText(heading.textContent))
    .filter((text) => text && text.length > 18)
    .slice(0, 5);

  if (headings.length) {
    return headings;
  }

  return [...content.querySelectorAll("p")]
    .map((paragraph) => displayText(paragraph.textContent))
    .filter((text) => text.length > 40)
    .slice(0, 5);
}

function renderHeroMedia(images) {
  heroMedia.replaceChildren();

  images.forEach((image) => {
    const card = document.createElement("div");
    card.className = "hero-media-card glass";
    card.appendChild(image);
    heroMedia.appendChild(card);
  });
}

function renderHighlights(highlights) {
  if (!highlights.length) {
    sourceHighlights.innerHTML = `
      <div class="empty-state">
        <i data-lucide="file-search" aria-hidden="true"></i>
        <span>No source highlights found.</span>
      </div>
    `;
    return;
  }

  sourceHighlights.innerHTML = highlights
    .map((highlight, index) => `
      <article class="highlight-card ${index === 0 ? "glow-gold" : ""}">
        <small>Signal ${String(index + 1).padStart(2, "0")}</small>
        <h3>${escapeHtml(highlight)}</h3>
        <p>Extracted from the currently synced source page.</p>
      </article>
    `)
    .join("");
}

function renderRouteCards() {
  routeCards.innerHTML = sourceRoutes
    .slice(1)
    .map((route, index) => `
      <a class="route-card ${index === 0 ? "glow-blue" : index === 1 ? "glow-orange" : "glow-green"}" href="?source=${encodeURIComponent(route.path)}" data-route-card="${escapeHtml(route.path)}" data-tone="${route.tone}">
        <div class="route-card-top">
          <small>${route.path}</small>
          <i data-lucide="${route.icon}" aria-hidden="true"></i>
        </div>
        <div>
          <div class="route-map" aria-hidden="true">
            <span class="route-node"></span>
            <span class="route-node"></span>
            <span class="route-node"></span>
            <span class="route-line"></span>
          </div>
          <h3>${escapeHtml(route.label)}</h3>
          <p>${escapeHtml(route.detail)}</p>
        </div>
        <div class="route-card-footer">
          <small>Open live source</small>
          <i data-lucide="arrow-up-right" aria-hidden="true"></i>
        </div>
      </a>
    `)
    .join("");

  routeCards.querySelectorAll("[data-route-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      event.preventDefault();
      setPath(card.dataset.routeCard || "/");
    });
  });
}

function updateSyncTelemetry(payload) {
  sourcePathLabel.textContent = activeSourcePath;
  sourceStatusLabel.textContent = payload.cacheStatus || "synced";
  sourceTimeLabel.textContent = new Date(payload.fetchedAt || Date.now()).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function updateActiveNav() {
  document.querySelectorAll("[data-source-path]").forEach((button) => {
    const routePath = button.dataset.sourcePath || "/";
    const isActive = routePath === "/"
      ? activeSourcePath === "/"
      : activeSourcePath.startsWith(routePath.replace(/index\.html$/, ""));
    button.classList.toggle("active", isActive);
  });
}

function renderError(error) {
  sourceStatusLabel.textContent = "Offline";
  sourceContent.innerHTML = `
    <div class="empty-state">
      <i data-lucide="triangle-alert" aria-hidden="true"></i>
      <span>${escapeHtml(error.message || "Source unavailable.")}</span>
    </div>
  `;
  refreshIcons();
}

function applySearch(query) {
  clearMarks(sourceContent);
  const searchTerm = normalizeText(query);
  if (searchTerm.length < 2) return;

  const walker = document.createTreeWalker(sourceContent, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.toLowerCase().includes(searchTerm.toLowerCase())) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.parentElement?.closest("mark")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const matches = [];
  while (walker.nextNode()) matches.push(walker.currentNode);
  matches.forEach((node) => markNode(node, searchTerm));
}

function clearMarks(container) {
  container.querySelectorAll("mark").forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent));
  });
}

function markNode(textNode, query) {
  const text = textNode.nodeValue;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  let index = lower.indexOf(needle);

  while (index !== -1) {
    fragment.append(document.createTextNode(text.slice(cursor, index)));
    const mark = document.createElement("mark");
    mark.textContent = text.slice(index, index + query.length);
    fragment.append(mark);
    cursor = index + query.length;
    index = lower.indexOf(needle, cursor);
  }

  fragment.append(document.createTextNode(text.slice(cursor)));
  textNode.replaceWith(fragment);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function displayText(value) {
  return normalizeText(value).replace(/([A-Za-z])(\d{4})/g, "$1 $2");
}

function normalizedKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isSiteName(value) {
  const key = normalizedKey(value);
  return key === "malmeroads" || key === "malmeroadsnet";
}

function isIncidentalHeading(value) {
  return /^(\d+)?years\d{4}/.test(normalizedKey(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", init);
