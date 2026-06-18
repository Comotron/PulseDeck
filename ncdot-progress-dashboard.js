const projects = [
  {
    id: "i-5986",
    stip: "I-5986",
    contract: "C204800",
    division: 6,
    county: "Robeson",
    description: "I-95 widening and bridge rehabilitation near Lumberton",
    contractor: "Flatiron Branch Civil JV",
    budget: 403.8,
    spent: 289.2,
    physical: 71,
    status: "Active / On Schedule",
    dates: {
      letting: "Jan 18, 2024",
      award: "Feb 21, 2024",
      completion: "Nov 12, 2027",
      estimate: "May 31, 2026",
    },
    contact: { name: "Angela McRae, PE", phone: "(910) 486-1234" },
    ncdotUrl: "https://www.ncdot.gov/projects/i-95-widening/Pages/default.aspx",
  },
  {
    id: "r-5700",
    stip: "R-5700",
    contract: "C204775",
    division: 5,
    county: "Wake",
    description: "NC 540 interchange and corridor improvements near Raleigh",
    contractor: "Blythe Construction Inc.",
    budget: 212,
    spent: 137.4,
    physical: 63,
    status: "Under Review",
    dates: {
      letting: "Sep 19, 2023",
      award: "Oct 24, 2023",
      completion: "Aug 18, 2026",
      estimate: "Jun 7, 2026",
    },
    contact: { name: "Marcus Benton", phone: "(919) 707-2400" },
    ncdotUrl: "https://www.ncdot.gov/projects/complete-540/Pages/default.aspx",
  },
  {
    id: "u-6039",
    stip: "U-6039",
    contract: "C204920",
    division: 10,
    county: "Mecklenburg",
    description: "I-485 managed lanes and US 74 interchange upgrades",
    contractor: "Lane Construction Corporation",
    budget: 318.6,
    spent: 152.9,
    physical: 48,
    status: "Active / On Schedule",
    dates: {
      letting: "Mar 12, 2024",
      award: "Apr 16, 2024",
      completion: "Feb 27, 2028",
      estimate: "May 31, 2026",
    },
    contact: { name: "Tiffany Caldwell, PE", phone: "(704) 983-4400" },
    ncdotUrl: "https://www.ncdot.gov/projects/us-74-express-lanes/Pages/default.aspx",
  },
  {
    id: "i-2513aa",
    stip: "I-2513AA",
    contract: "C204600",
    division: 13,
    county: "Buncombe",
    description: "I-26 Asheville connector structures and retaining walls",
    contractor: "Archer Western Construction",
    budget: 147.5,
    spent: 126.3,
    physical: 82,
    status: "Delayed / Behind Schedule",
    dates: {
      letting: "Jun 20, 2022",
      award: "Jul 27, 2022",
      completion: "Dec 19, 2026",
      estimate: "Jun 7, 2026",
    },
    contact: { name: "Daniel Pressley", phone: "(828) 250-3000" },
    ncdotUrl: "https://www.ncdot.gov/projects/asheville-i-26-connector/Pages/default.aspx",
  },
  {
    id: "r-2633ba",
    stip: "R-2633BA",
    contract: "C204501",
    division: 3,
    county: "New Hanover",
    description: "US 17 Hampstead bypass grading, drainage, and bridges",
    contractor: "Barnhill Contracting Company",
    budget: 185.2,
    spent: 169.6,
    physical: 93,
    status: "Completed / Final Estimate",
    dates: {
      letting: "Nov 15, 2021",
      award: "Dec 21, 2021",
      completion: "Apr 30, 2026",
      estimate: "May 31, 2026",
    },
    contact: { name: "Eleanor Wilkes", phone: "(910) 341-2000" },
    ncdotUrl: "https://www.ncdot.gov/projects/us-17-hampstead-bypass/Pages/default.aspx",
  },
  {
    id: "b-5642",
    stip: "B-5642",
    contract: "C204845",
    division: 1,
    county: "Dare",
    description: "NC 12 dune stabilization and bridge preservation on Hatteras Island",
    contractor: "S.T. Wooten Corporation",
    budget: 64.9,
    spent: 31.1,
    physical: 46,
    status: "Active / On Schedule",
    dates: {
      letting: "Dec 13, 2023",
      award: "Jan 17, 2024",
      completion: "Sep 15, 2026",
      estimate: "Jun 7, 2026",
    },
    contact: { name: "Heather Twiddy", phone: "(252) 482-1850" },
    ncdotUrl: "https://www.ncdot.gov/projects/nc-12-south/Pages/default.aspx",
  },
];

const activities = [
  {
    title: "HiCAMS nightly sync completed",
    detail: "Six active contracts refreshed with estimate, payment, and milestone data.",
    time: "Jun 10, 2026 at 2:15 AM ET",
    tone: "green",
  },
  {
    title: "Estimate #18 posted for I-5986",
    detail: "Physical progress advanced to 71% after girder installation and shoulder drainage work.",
    time: "Jun 9, 2026 at 4:40 PM ET",
    tone: "blue",
  },
  {
    title: "Scope review opened for R-5700",
    detail: "Utility relocation variance moved the Raleigh package into amber review.",
    time: "Jun 9, 2026 at 11:25 AM ET",
    tone: "amber",
  },
  {
    title: "Delay flag escalated on I-2513AA",
    detail: "Retaining wall sequencing and weather impacts pushed the Asheville connector behind baseline.",
    time: "Jun 8, 2026 at 3:18 PM ET",
    tone: "red",
  },
  {
    title: "Final estimate routed for R-2633BA",
    detail: "Hampstead bypass package entered closeout review after substantial completion.",
    time: "Jun 6, 2026 at 9:05 AM ET",
    tone: "gray",
  },
];

const statusMeta = {
  "Active / On Schedule": {
    short: "On Schedule",
    className: "status-positive",
    gauge: "#146c2e",
  },
  "Under Review": {
    short: "Under Review",
    className: "status-warning",
    gauge: "#855300",
  },
  "Delayed / Behind Schedule": {
    short: "Delayed",
    className: "status-critical",
    gauge: "#b3261e",
  },
  "Completed / Final Estimate": {
    short: "Final Estimate",
    className: "status-muted",
    gauge: "#747775",
  },
};

const allStatuses = Object.keys(statusMeta);
const allDivisions = Array.from({ length: 14 }, (_, index) => index + 1);
const SYNC_STORAGE_KEY = "ncdot-progress-dashboard-sync-state";
const SYNC_TIME_ZONE = "America/New_York";
const DAILY_SYNC_HOUR = 2;

let activeSection = "dashboard";
let projectFilters = { query: "", status: "all", division: "all" };
let sortState = { key: "stip", direction: "asc" };
let syncState = {
  lastSyncAt: "2026-06-10T06:15:00.000Z",
  lastSyncType: "nightly",
};
let lastDrawerTrigger = null;

const formatCurrency = (value) =>
  `${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 2 : 1,
  }).format(value >= 1000 ? value / 1000 : value)}${value >= 1000 ? "B" : "M"}`;

const percent = (project) => Math.round((project.spent / project.budget) * 100);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshNcdotIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function loadSyncState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SYNC_STORAGE_KEY) || "null");
    if (saved?.lastSyncAt) syncState = saved;
  } catch {
    localStorage.removeItem(SYNC_STORAGE_KEY);
  }
}

function saveSyncState() {
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(syncState));
}

function formatSyncDate(dateInput) {
  const date = new Date(dateInput);
  const day = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: SYNC_TIME_ZONE,
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: SYNC_TIME_ZONE,
  }).format(date);
  return `${day} at ${time}`;
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
  const syncTypeLabel = isManual ? "Manual sync complete" : "Nightly sync complete";

  const updates = {
    dataCycleStatus: isManual ? "Manual HiCAMS Sync Complete" : "HiCAMS Sync Complete",
    dataCycleTime: formatSyncDate(lastSync),
    nextSyncLabel: `Next daily refresh: ${formatSyncDate(nextSync)}`,
    autoSyncMeta: `Runs daily at 2:00 AM ET. Next refresh: ${formatSyncDate(nextSync)}.`,
    manualSyncMeta: `Last sync: ${formatSyncDate(lastSync)}.`,
    headerSyncStatus: `${syncTypeLabel} · ${formatSyncDate(lastSync)}`,
  };

  Object.entries(updates).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  });
}

function addSyncActivity(type) {
  activities.unshift({
    title: type === "manual" ? "Manual HiCAMS sync completed" : "Daily HiCAMS sync completed",
    detail: "Project estimates, financial progress, and dashboard cycle status refreshed.",
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
  window.setTimeout(() => {
    performSync("auto");
    scheduleDailyAutoRefresh();
  }, Math.min(delay, 2_147_483_647));
}

function initSyncCycle() {
  loadSyncState();
  if (shouldAutoSyncNow()) {
    performSync("auto");
  } else {
    updateSyncUI();
  }
  scheduleDailyAutoRefresh();
}

function statusBadge(status, compact = false) {
  const meta = statusMeta[status];
  return `<span class="status-badge ${meta.className}">${compact ? meta.short : escapeHtml(status)}</span>`;
}

function divisionBadge(division) {
  return `<span class="division-badge">Div ${division}</span>`;
}

function ncdotProjectLink(project, label = "NCDOT page") {
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
  const totalBudget = projects.reduce((sum, project) => sum + project.budget, 0);
  const onSchedule = projects.filter((project) => project.status === "Active / On Schedule").length;
  const critical = projects.filter((project) => project.status === "Delayed / Behind Schedule").length;
  const onScheduleRate = Math.round((onSchedule / totalContracts) * 100);
  const metrics = [
    {
      label: "Total active contracts",
      value: totalContracts,
      detail: "Across Divisions 1, 3, 5, 6, 10, and 13",
      icon: "briefcase-business",
    },
    {
      label: "Total STIP allocation",
      value: formatCurrency(totalBudget),
      detail: "$906.5M spent to date",
      icon: "landmark",
    },
    {
      label: "On-schedule rate",
      value: `${onScheduleRate}%`,
      detail: `${onSchedule} of ${totalContracts} contracts currently green`,
      icon: "circle-check-big",
    },
    {
      label: "Critical / delayed",
      value: critical,
      detail: "Requires executive review",
      icon: "triangle-alert",
    },
  ];

  document.getElementById("metricStrip").innerHTML = metrics
    .map(
      (metric) => `
        <article class="material-card metric-card">
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
          <div class="summary-primary" role="cell">${project.stip}</div>
          <div role="cell">${divisionBadge(project.division)}</div>
          <div class="summary-route" role="cell">${escapeHtml(project.description)}</div>
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
    const matchesQuery =
      !query ||
      [project.stip, project.contract, project.county, project.description, project.contractor, project.status]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesStatus = projectFilters.status === "all" || project.status === projectFilters.status;
    const matchesDivision =
      projectFilters.division === "all" || project.division === Number(projectFilters.division);
    return matchesQuery && matchesStatus && matchesDivision;
  });

  return filtered.sort((a, b) => {
    const direction = sortState.direction === "asc" ? 1 : -1;
    const getValue = (project) => {
      if (sortState.key === "financial") return percent(project);
      if (sortState.key === "physical") return project.physical;
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
    ...allStatuses.map((status) => `<option value="${status}">${status}</option>`),
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
  if (projectFilters.status !== "all") chips.push(projectFilters.status);
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
    .map((project) => {
      const financial = percent(project);
      return `
        <div class="project-grid-row" data-project-row="${project.id}" tabindex="0" role="row">
          <div class="project-cell primary" role="cell" data-label="STIP ID">${project.stip}</div>
          <div class="project-cell" role="cell" data-label="Contract">${project.contract}</div>
          <div class="project-cell" role="cell" data-label="Division">${divisionBadge(project.division)}</div>
          <div class="project-cell" role="cell" data-label="County">${project.county}</div>
          <div class="project-cell" role="cell" data-label="Description / Route">${escapeHtml(project.description)}</div>
          <div class="project-cell muted" role="cell" data-label="Contractor">${escapeHtml(project.contractor)}</div>
          <div class="project-cell" role="cell" data-label="Financial Progress">
            <div class="financial-progress">
              <div class="financial-values">
                <span>${formatCurrency(project.spent)}</span>
                <span>${formatCurrency(project.budget)}</span>
              </div>
              <div class="progress-track"><div class="progress-fill" style="width:${financial}%"></div></div>
              <p>${financial}% spent vs. budgeted</p>
            </div>
          </div>
          <div class="project-cell" role="cell" data-label="Physical Progress">
            <div class="physical-progress">
              <div class="gauge" style="--value:${project.physical};--gauge-color:${statusMeta[project.status].gauge}">
                <span>${project.physical}%</span>
              </div>
              <small>HiCAMS</small>
            </div>
          </div>
          <div class="project-cell" role="cell" data-label="Status">${statusBadge(project.status)}</div>
          <div class="project-cell" role="cell" data-label="NCDOT Link">${ncdotProjectLink(project, "Open")}</div>
        </div>
      `;
    })
    .join("");

  document.getElementById("projectsTableBody").innerHTML =
    rows || '<div class="empty-row">No contracts match the selected filters.</div>';
  refreshNcdotIcons();
}

function showSection(section, shouldScroll = false) {
  if (!document.getElementById(section)) return;
  activeSection = section;
  document.querySelectorAll(".dashboard-view").forEach((element) => {
    element.classList.toggle("active", element.id === section);
  });
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });
  if (shouldScroll) {
    document.getElementById("ncdot")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function openDrawer(projectId, trigger) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  lastDrawerTrigger = trigger || document.activeElement;
  const meta = statusMeta[project.status];
  const financial = percent(project);
  document.getElementById("drawerContent").innerHTML = `
    <div class="drawer-header">
      <div>
        <p class="section-label">Project detail</p>
        <h2 id="drawerTitle">${project.stip}</h2>
        <p>${escapeHtml(project.description)}</p>
        <div class="drawer-actions">
          ${statusBadge(project.status)}
          ${ncdotProjectLink(project, "Official NCDOT page")}
        </div>
      </div>
      <button class="icon-button" type="button" data-close-drawer aria-label="Close project detail">
        <i data-lucide="x" aria-hidden="true"></i>
      </button>
    </div>
    <div class="drawer-body">
      <section class="drawer-section">
        <h3>Contract</h3>
        <dl class="drawer-grid">
          <div class="drawer-data"><dt>Contract number</dt><dd>${project.contract}</dd></div>
          <div class="drawer-data"><dt>Division / County</dt><dd>Division ${project.division}, ${project.county}</dd></div>
        </dl>
      </section>

      <section class="drawer-section">
        <h3>Progress</h3>
        <div class="drawer-progress-grid">
          <div>
            <strong>Spent vs. budgeted · ${financial}%</strong>
            <div class="progress-track"><div class="progress-fill" style="width:${financial}%"></div></div>
            <p>${formatCurrency(project.spent)} spent of ${formatCurrency(project.budget)}</p>
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
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-drawer]")) {
      closeDrawer();
      return;
    }

    if (event.target.closest("[data-external-project]")) return;

    const navButton = event.target.closest("[data-section]");
    if (navButton) {
      showSection(navButton.dataset.section, !navButton.closest(".dashboard-tabs"));
    }

    const projectTrigger = event.target.closest("[data-project-row]");
    if (projectTrigger) {
      openDrawer(projectTrigger.dataset.projectRow, projectTrigger);
    }
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
  refreshNcdotIcons();
}

document.addEventListener("DOMContentLoaded", bootNcdotDashboard);
