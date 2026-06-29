(() => {
  const SYNC_STORAGE_KEY = "ncdot-progress-dashboard-sync-state";
  const DEFAULT_SYNC_STATE = {
    lastSyncAt: "2026-06-10T06:15:00.000Z",
    lastSyncType: "nightly",
  };
  const TIME_ZONE = "America/New_York";
  const syncDayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  });
  const syncTimeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: TIME_ZONE,
  });
  const clockDayFormatter = new Intl.DateTimeFormat([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const clockTimeFormatter = new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
  });

  function readSyncState() {
    try {
      return JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY) || "null") || DEFAULT_SYNC_STATE;
    } catch {
      return DEFAULT_SYNC_STATE;
    }
  }

  function formatSyncDate(dateInput) {
    const date = new Date(dateInput);
    return `${syncDayFormatter.format(date)}, ${syncTimeFormatter.format(date)}`;
  }

  function isPreviewRoute() {
    return window.location.pathname === "/preview"
      || window.location.pathname.startsWith("/preview/")
      || new URLSearchParams(window.location.search).has("preview");
  }

  class PulseHeader extends HTMLElement {
    connectedCallback() {
      if (this.clockTimer) this.disconnectedCallback();

      const active = this.getAttribute("active") || "home";
      const root = isPreviewRoute() ? "/preview" : this.getAttribute("root") || ".";
      const homeHref = `${root}/`;
      const dashboardHref = `${root}/project-dashboard/`;

      this.innerHTML = `
        <header class="site-header">
          <div class="header-main">
            <a class="brand" href="${homeHref}" aria-label="PulseDeck home">
              <span class="brand-icon" aria-hidden="true">
                <svg viewBox="0 0 40 40" focusable="false">
                  <path d="M6 22h8l3-8 6 15 4-9h7"></path>
                </svg>
              </span>
              <span class="brand-copy">
                <strong>PulseDeck</strong>
                <small>North Carolina Transportation Intelligence</small>
              </span>
            </a>

            <div class="header-status" aria-label="Current system status">
              <div class="header-status-item sync-header-item">
                <span class="status-indicator status-ok" aria-hidden="true"></span>
                <span>
                  <small>HiCAMS</small>
                  <strong data-header-sync>Sync status loading</strong>
                </span>
              </div>
              <div class="header-status-item time-header-item">
                <i data-lucide="clock-3" aria-hidden="true"></i>
                <span>
                  <small data-day-label>Today</small>
                  <strong data-time-label>--:--</strong>
                </span>
              </div>
              <span class="preview-badge" data-preview-badge hidden>Review preview</span>
            </div>
          </div>

          <nav class="site-nav" aria-label="Primary navigation">
            <a class="${active === "home" ? "active" : ""}" href="${homeHref}" ${active === "home" ? 'aria-current="page"' : ""}>
              <i data-lucide="house" aria-hidden="true"></i>
              Home
            </a>
            <a class="${active === "dashboard" ? "active" : ""}" href="${dashboardHref}" ${active === "dashboard" ? 'aria-current="page"' : ""}>
              <i data-lucide="hard-hat" aria-hidden="true"></i>
              Project Dashboard
            </a>
          </nav>
        </header>
      `;

      this.syncElement = this.querySelector("[data-header-sync]");
      this.dayElement = this.querySelector("[data-day-label]");
      this.timeElement = this.querySelector("[data-time-label]");
      this.previewElement = this.querySelector("[data-preview-badge]");

      this.updateClock();
      this.updateSync(readSyncState());
      this.previewElement.hidden = !isPreviewRoute();
      this.clockTimer = window.setInterval(() => this.updateClock(), 30_000);
      this.syncHandler = (event) => this.updateSync(event.detail || readSyncState());
      window.addEventListener("pulsedeck:sync-updated", this.syncHandler);

      if (window.lucide) window.lucide.createIcons();
    }

    disconnectedCallback() {
      if (this.clockTimer) window.clearInterval(this.clockTimer);
      if (this.syncHandler) window.removeEventListener("pulsedeck:sync-updated", this.syncHandler);
      this.clockTimer = 0;
      this.syncHandler = null;
    }

    updateClock() {
      const now = new Date();
      this.dayElement.textContent = clockDayFormatter.format(now);
      this.timeElement.textContent = clockTimeFormatter.format(now);
    }

    updateSync(state) {
      const type = state.lastSyncType === "manual" ? "Manual sync" : "Nightly sync";
      this.syncElement.textContent = `${type} complete · ${formatSyncDate(state.lastSyncAt)}`;
    }
  }

  window.PulseDeckSync = {
    storageKey: SYNC_STORAGE_KEY,
    defaultState: DEFAULT_SYNC_STATE,
    timeZone: TIME_ZONE,
    formatSyncDate,
    read: readSyncState,
  };

  if (!customElements.get("pulse-header")) customElements.define("pulse-header", PulseHeader);
})();
