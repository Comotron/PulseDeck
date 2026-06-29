const { projects, statusMeta } = window.PulseDeckData;
const activities = [...window.PulseDeckData.activities];
const allStatuses = Object.keys(statusMeta);
const allDivisions = Array.from({ length: 14 }, (_, index) => index + 1);
const SYNC_STORAGE_KEY = window.PulseDeckSync.storageKey;
const DAILY_SYNC_HOUR = 2;
const currencyFormatters = {
  millions: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }),
  billions: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }),
};
const projectSearchText = new Map(
  projects.map((project) => [
    project.id,
    [
      project.stip,
      project.contract,
      project.route,
      project.county,
      project.description,
      project.contractor,
      project.status,
    ]
      .join(" ")
      .toLowerCase(),
  ])
);

let projectFilters = { query: "", status: "all", division: "all" };
let sortState = { key: "contract", direction: "asc" };
let syncState = window.PulseDeckSync.read();
let lastDrawerTrigger = null;
let dashboardEventsBound = false;
let dailySyncTimer = 0;

const formatCurrency = (value) =>
  value >= 1000
    ? `${currencyFormatters.billions.format(value / 1000)}B`
    : `${currencyFormatters.millions.format(value)}M`;

const estimatePercent = (project) =>
  Math.round((project.currentEstimate / project.awardAmount) * 100);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshNcdotIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function saveSyncState() {
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(syncState));
  window.dispatchEvent(new CustomEvent("pulsedeck:sync-updated", { detail: syncState }));
}

function formatSyncDate(dateInput) {
  return window.PulseDeckSync.formatSyncDate(dateInput);
}

function nextDailySyncDate(fromDate = new Date()) {
  const next = new Date(fromDate);
  next.setHours(DAILY_SYNC_HOUR, 0, 0, 0);
  if (next <= fromDate) next.setDate(next.getDate() + 1);
  return next;
}

function shouldAutoSyncNow() {
  const now = new Date();
  const lastSync = new Date(syncState.lastSyncAt);
  const todaySync = new Date(now);
  todaySync.setHours(DAILY_SYNC_HOUR, 0, 0, 0);
  return now >= todaySync && lastSync < todaySync;
}

function updateSyncUI() {
  const lastSync = new Date(syncState.lastSyncAt);
  const nextSync = nextDailySyncDate();
  const isManual = syncState.lastSyncType === "manual";
  const updates = {
    dataCycleStatus: isManual ? "Manual HiCAMS Sync Complete" : "HiCAMS Sync Complete",
    dataCycleTime: formatSyncDate(lastSync),
    nextSyncLabel: `Next daily refresh: ${formatSyncDate(nextSync)}`,
    autoSyncMeta: `Runs daily at 2:00 AM ET. Next refresh: ${formatSyncDate(nextSync)}.`,
    manualSyncMeta: `Last sync: ${formatSyncDate(lastSync)}.`,
  };

  Object.entries(updates).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  });
  window.dispatchEvent(new CustomEvent("pulsedeck:sync-updated", { detail: syncState }));
}

function addSyncActivity(type) {
  activities.unshift({
    title: type === "manual" ? "Manual HiCAMS sync completed" : "Daily HiCAMS sync completed",
    detail: "Contract estimates, physical progress, schedule status, and dashboard cycle refreshed.",
    time: formatSyncDate(syncState.lastSyncAt),
    tone: "green",
  });
  activities.splice(6);
  renderActivityLog();
}

function performSync(type = "manual") {
  syncState = {
    lastSyncAt: new Date().toISOString(),
    lastSyncType: type,
  };
  saveSyncState();
  updateSyncUI();
  addSyncActivity(type);
}

function scheduleDailyAutoRefresh() {
  const nextSync = nextDailySyncDate();
  const delay = Math.max(0, nextSync.getTime() - Date.now());
  if (dailySyncTimer) window.clearTimeout(dailySyncTimer);
  dailySyncTimer = window.setTimeout(() => {
    dailySyncTimer = 0;
    performSync("auto");
    scheduleDailyAutoRefresh();
  }, Math.min(delay, 2_147_483_647));
}

function initSyncCycle() {
  if (shouldAutoSyncNow()) performSync("auto");
  else updateSyncUI();
  scheduleDailyAutoRefresh();
}

function statusBadge(status, compact = false) {
  const meta = statusMeta[status];
  return `<span class="status-badge ${meta.className}">${compact ? meta.short : escapeHtml(status)}</span>`;
}

function divisionBadge(division) {
  return `<span class="division-badge">Div ${division}</span>`;
}

function ncdotProjectLink(project, label = "Official NCDOT page") {
  return `
    <a
      class="external-project-link"
      href="${project.ncdotUrl}"
      target="_blank"
      rel="noopener noreferrer"
      data-external-project
      aria-label="Open official NCDOT project page for ${project.stip}"
    >
      <i data-lucide="external-link" aria-hidden="true"></i>
      <span>${label}</span>
    </a>
  `;
}

function renderMetrics() {
  const totalContracts = projects.length;
  const totalAward = projects.reduce((sum, project) => sum + project.awardAmount, 0);
  const onSchedule = projects.filter((project) => project.status === "Active / On Schedule").length;
  const atRisk = projects.filter((project) => project.status === "Under Review").length;
  const delayed = projects.filter((project) => project.status === "Delayed / Behind Schedule").length;
  const metrics = [
    {
      label: "Active contracts",
      value: totalContracts,
      detail: "Six NCDOT divisions represented",
      icon: "briefcase-business",
      tone: "primary",
    },
    {
      label: "Award value",
      value: formatCurrency(totalAward),
      detail: "Current monitored contract portfolio",
      icon: "landmark",
      tone: "primary",
    },
    {
      label: "On schedule",
      value: onSchedule,
      detail: "Healthy delivery status",
      icon: "circle-check-big",
      tone: "success",
    },
    {
      label: "At risk",
      value: atRisk,
      detail: "Under review in the current cycle",
      icon: "shield-alert",
      tone: "warning",
    },
    {
      label: "Delayed",
      value: delayed,
      detail: "Critical executive attention required",
      icon: "triangle-alert",
      tone: "critical",
    },
  ];

  document.getElementById("metricStrip").innerHTML = metrics
    .map(
      (metric) => `
        <article class="material-card metric-card metric-${metric.tone}">
          <div class="metric-card-top">
            <div>
              <small>${metric.label}</small>
              <strong>${metric.value}</strong>
            </div>
            <span class="metric-icon"><i data-lucide="${metric.icon}" aria-hidden="true"></i></span>
          </div>
          <p>${metric.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderDashboardRows() {
  document.getElementById("dashboardProjectRows").innerHTML = projects
    .map(
      (project) => `
        <div class="summary-grid-row" data-project-row="${project.id}" tabindex="0" role="row">
          <div class="summary-primary" role="cell">
            <span>${project.contract}</span>
            <small>${project.stip}</small>
          </div>
          <div role="cell">${divisionBadge(project.division)}</div>
          <div class="summary-route" role="cell">
            <strong>${escapeHtml(project.route)}</strong>
            <span>${escapeHtml(project.description)}</span>
          </div>
          <div class="progress-inline" role="cell">
            <div class="progress-track">
              <div class="progress-fill" style="width:${project.physical}%;background:${statusMeta[project.status].gauge}"></div>
            </div>
            <span class="progress-value">${project.physical}%</span>
          </div>
          <div role="cell">${statusBadge(project.status, true)}</div>
        </div>
      `
    )
    .join("");
}

function renderActivityLog() {
  const toneMap = {
    green: "activity-green",
    blue: "activity-blue",
    amber: "activity-amber",
    red: "activity-red",
    gray: "activity-gray",
  };

  document.getElementById("activityLog").innerHTML = activities
    .map(
      (activity) => `
        <li class="activity-item">
          <span class="activity-dot ${toneMap[activity.tone]}" aria-hidden="true"></span>
          <div>
            <strong>${escapeHtml(activity.title)}</strong>
            <p>${escapeHtml(activity.detail)}</p>
            <time>${escapeHtml(activity.time)}</time>
          </div>
        </li>
      `
    )
    .join("");
}

function sortedFilteredProjects() {
  const query = projectFilters.query.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    const matchesQuery = !query || (projectSearchText.get(project.id) || "").includes(query);
    const matchesStatus = projectFilters.status === "all" || project.status === projectFilters.status;
    const matchesDivision =
      projectFilters.division === "all" || project.division === Number(projectFilters.division);
    return matchesQuery && matchesStatus && matchesDivision;
  });

  return filtered.sort((a, b) => {
    const direction = sortState.direction === "asc" ? 1 : -1;
    const getValue = (project) => {
      if (sortState.key === "lastUpdate") return new Date(project.dates.estimate).getTime();
      return project[sortState.key];
    };
    const left = getValue(a);
    const right = getValue(b);
    if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
    return String(left).localeCompare(String(right), undefined, { numeric: true }) * direction;
  });
}

function renderProjectFilters() {
  const statusSelect = document.getElementById("statusFilter");
  statusSelect.innerHTML = [
    '<option value="all">All statuses</option>',
    ...allStatuses.map((status) => `<option value="${status}">${statusMeta[status].short}</option>`),
  ].join("");
  statusSelect.value = projectFilters.status;

  const divisionSelect = document.getElementById("divisionFilter");
  divisionSelect.innerHTML = [
    '<option value="all">All divisions</option>',
    ...allDivisions.map((division) => `<option value="${division}">Division ${division}</option>`),
  ].join("");
  divisionSelect.value = projectFilters.division;
}

function renderActiveChips(filtered) {
  const chips = [];
  if (projectFilters.query) chips.push(`Search: ${projectFilters.query}`);
  if (projectFilters.status !== "all") chips.push(statusMeta[projectFilters.status].short);
  if (projectFilters.division !== "all") chips.push(`Division ${projectFilters.division}`);

  document.getElementById("projectCountLabel").textContent =
    `${filtered.length} of ${projects.length} contracts shown`;
  document.getElementById("activeFilterChips").innerHTML = chips
    .map((chip) => `<span class="filter-chip">${escapeHtml(chip)}</span>`)
    .join("");
}

function renderProjectsTable() {
  const filtered = sortedFilteredProjects();
  renderActiveChips(filtered);

  const rows = filtered
    .map((project) => `
      <div class="project-grid-row" data-project-row="${project.id}" tabindex="0" role="row">
        <div class="project-cell primary contract-cell" role="cell" data-label="Contract ID">
          <strong>${project.contract}</strong>
          <small>${project.stip}</small>
        </div>
        <div class="project-cell" role="cell" data-label="Division">${divisionBadge(project.division)}</div>
        <div class="project-cell route-cell" role="cell" data-label="Route">
          <strong>${escapeHtml(project.route)}</strong>
          <small>${escapeHtml(project.description)}</small>
        </div>
        <div class="project-cell" role="cell" data-label="County">${escapeHtml(project.county)}</div>
        <div class="project-cell muted" role="cell" data-label="Contractor">${escapeHtml(project.contractor)}</div>
        <div class="project-cell money-cell" role="cell" data-label="Award Amount">${formatCurrency(project.awardAmount)}</div>
        <div class="project-cell money-cell" role="cell" data-label="Current Estimate">
          <strong>${formatCurrency(project.currentEstimate)}</strong>
          <small>${estimatePercent(project)}% of award</small>
        </div>
        <div class="project-cell" role="cell" data-label="Physical Progress">
          <div class="physical-progress">
            <div class="gauge" style="--value:${project.physical};--gauge-color:${statusMeta[project.status].gauge}">
              <span>${project.physical}%</span>
            </div>
            <small>HiCAMS</small>
          </div>
        </div>
        <div class="project-cell" role="cell" data-label="Schedule Status">${statusBadge(project.status, true)}</div>
        <div class="project-cell update-cell" role="cell" data-label="Last Update">
          <i data-lucide="calendar-clock" aria-hidden="true"></i>
          <span>${escapeHtml(project.dates.estimate)}</span>
        </div>
      </div>
    `)
    .join("");

  document.getElementById("projectsTableBody").innerHTML =
    rows || '<div class="empty-row">No contracts match the selected filters.</div>';
  refreshNcdotIcons();
}

function showSection(section) {
  if (!document.getElementById(section)) return;
  document.querySelectorAll(".dashboard-view").forEach((element) => {
    element.classList.toggle("active", element.id === section);
  });
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });
  window.history.replaceState({}, "", `#${section}`);
}

function openDrawer(projectId, trigger) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  lastDrawerTrigger = trigger || document.activeElement;
  const meta = statusMeta[project.status];
  const estimateShare = estimatePercent(project);
  document.getElementById("drawerContent").innerHTML = `
    <div class="drawer-header">
      <div>
        <p class="section-label">Contract detail</p>
        <h2 id="drawerTitle">${project.contract}</h2>
        <p><strong>${escapeHtml(project.route)}</strong> · ${escapeHtml(project.description)}</p>
        <div class="drawer-actions">
          ${statusBadge(project.status, true)}
          ${ncdotProjectLink(project)}
        </div>
      </div>
      <button class="icon-button" type="button" data-close-drawer aria-label="Close contract detail">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </div>
    <div class="drawer-body">
      <section class="drawer-section">
        <h3>Contract</h3>
        <dl class="drawer-grid">
          <div class="drawer-data"><dt>STIP ID</dt><dd>${project.stip}</dd></div>
          <div class="drawer-data"><dt>Division / County</dt><dd>Division ${project.division}, ${project.county}</dd></div>
          <div class="drawer-data"><dt>Contractor</dt><dd>${escapeHtml(project.contractor)}</dd></div>
          <div class="drawer-data"><dt>Last update</dt><dd>${escapeHtml(project.dates.estimate)}</dd></div>
        </dl>
      </section>

      <section class="drawer-section">
        <h3>Financial and physical progress</h3>
        <div class="drawer-progress-grid">
          <div>
            <strong>Current estimate · ${estimateShare}% of award</strong>
            <div class="progress-track"><div class="progress-fill" style="width:${Math.min(estimateShare, 100)}%"></div></div>
            <p>${formatCurrency(project.currentEstimate)} estimated against ${formatCurrency(project.awardAmount)} awarded</p>
          </div>
          <div class="physical-progress">
            <div class="gauge" style="--value:${project.physical};--gauge-color:${meta.gauge}">
              <span>${project.physical}%</span>
            </div>
            <div><strong>Physical progress</strong><p>Current HiCAMS estimate</p></div>
          </div>
        </div>
      </section>

      <section class="drawer-section">
        <h3>Key dates</h3>
        <dl class="drawer-grid">
          ${[
            ["Letting date", project.dates.letting],
            ["Award date", project.dates.award],
            ["Completion date", project.dates.completion],
            ["Last estimate through", project.dates.estimate],
          ]
            .map(
              ([label, value]) =>
                `<div class="drawer-data"><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`
            )
            .join("")}
        </dl>
      </section>

      <section class="drawer-section">
        <h3>NCDOT contact</h3>
        <div class="contact-row">
          <span class="contact-icon"><i data-lucide="user-round" aria-hidden="true"></i></span>
          <div><strong>${escapeHtml(project.contact.name)}</strong><p>${escapeHtml(project.contact.phone)}</p></div>
        </div>
      </section>
    </div>
  `;

  document.getElementById("projectDrawer").classList.remove("hidden");
  document.getElementById("drawerBackdrop").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  refreshNcdotIcons();
  document.querySelector("[data-close-drawer]")?.focus();
}

function closeDrawer() {
  document.getElementById("projectDrawer").classList.add("hidden");
  document.getElementById("drawerBackdrop").classList.add("hidden");
  document.body.style.overflow = "";
  lastDrawerTrigger?.focus?.();
}

function resetFilters() {
  projectFilters = { query: "", status: "all", division: "all" };
  document.getElementById("projectSearch").value = "";
  renderProjectFilters();
  renderProjectsTable();
}

function bindEvents() {
  if (dashboardEventsBound) return;
  dashboardEventsBound = true;

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-drawer]")) {
      closeDrawer();
      return;
    }
    if (event.target.closest("[data-external-project]")) return;

    const navButton = event.target.closest("[data-section]");
    if (navButton) showSection(navButton.dataset.section);

    const projectTrigger = event.target.closest("[data-project-row]");
    if (projectTrigger) openDrawer(projectTrigger.dataset.projectRow, projectTrigger);
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.closest("[data-external-project]")) return;
    const projectTrigger = event.target.closest("[data-project-row]");
    if (projectTrigger && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openDrawer(projectTrigger.dataset.projectRow, projectTrigger);
    }
    if (event.key === "Escape") closeDrawer();
  });

  document.getElementById("projectSearch").addEventListener("input", (event) => {
    projectFilters.query = event.target.value;
    renderProjectsTable();
  });
  document.getElementById("statusFilter").addEventListener("change", (event) => {
    projectFilters.status = event.target.value;
    renderProjectsTable();
  });
  document.getElementById("divisionFilter").addEventListener("change", (event) => {
    projectFilters.division = event.target.value;
    renderProjectsTable();
  });
  document.querySelectorAll("[data-sort]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.sort;
      sortState = {
        key,
        direction: sortState.key === key && sortState.direction === "asc" ? "desc" : "asc",
      };
      renderProjectsTable();
    });
  });

  document.getElementById("resetProjectFilters").addEventListener("click", resetFilters);
  document.getElementById("forceSyncButton").addEventListener("click", () => {
    const button = document.getElementById("forceSyncButton");
    button.disabled = true;
    button.classList.add("syncing");
    button.querySelector("span").textContent = "Syncing...";
    window.setTimeout(() => {
      performSync("manual");
      button.disabled = false;
      button.classList.remove("syncing");
      button.querySelector("span").textContent = "Force sync";
      refreshNcdotIcons();
    }, 650);
  });
  document.getElementById("drawerBackdrop").addEventListener("click", closeDrawer);
  document.querySelectorAll(".toggle-button").forEach((button) => {
    button.addEventListener("click", () => {
      const active = !button.classList.contains("active");
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "Enabled" : "Paused";
    });
  });
  document.querySelectorAll(".preference-card").forEach((button) => {
    button.addEventListener("click", () => button.classList.toggle("active"));
  });
}

function bootNcdotDashboard() {
  initSyncCycle();
  renderMetrics();
  renderDashboardRows();
  renderActivityLog();
  renderProjectFilters();
  renderProjectsTable();
  bindEvents();

  const initialSection = window.location.hash.replace("#", "");
  if (["dashboard", "projects", "settings"].includes(initialSection)) showSection(initialSection);
  refreshNcdotIcons();
}

document.addEventListener("DOMContentLoaded", bootNcdotDashboard);
