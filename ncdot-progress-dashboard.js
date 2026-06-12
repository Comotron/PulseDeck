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
    latitude: 34.6183,
    longitude: -79.0086,
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
    budget: 212.0,
    spent: 137.4,
    physical: 63,
    status: "Under Review",
    latitude: 35.7312,
    longitude: -78.7974,
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
    latitude: 35.2032,
    longitude: -80.8431,
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
    latitude: 35.5951,
    longitude: -82.5515,
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
    latitude: 34.366,
    longitude: -77.713,
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
    latitude: 35.2313,
    longitude: -75.624,
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
    detail: "6 active contracts refreshed with estimate, payment, and milestone data.",
    time: "Jun 10, 2026 2:15 AM ET",
    tone: "green",
  },
  {
    title: "Estimate #18 posted for I-5986",
    detail: "Physical progress advanced to 71% after girder installation and shoulder drainage work.",
    time: "Jun 9, 2026 4:40 PM ET",
    tone: "blue",
  },
  {
    title: "Scope review opened for R-5700",
    detail: "Utility relocation variance moved the Raleigh corridor package into amber review.",
    time: "Jun 9, 2026 11:25 AM ET",
    tone: "amber",
  },
  {
    title: "Delay flag escalated on I-2513AA",
    detail: "Retaining wall sequencing and weather impacts pushed the Asheville connector behind baseline.",
    time: "Jun 8, 2026 3:18 PM ET",
    tone: "red",
  },
  {
    title: "Final estimate routed for R-2633BA",
    detail: "Hampstead bypass package entered closeout review after substantial completion.",
    time: "Jun 6, 2026 9:05 AM ET",
    tone: "gray",
  },
];

const statusMeta = {
  "Active / On Schedule": {
    short: "On Schedule",
    className: "status-positive",
    gauge: "#10B981",
  },
  "Under Review": {
    short: "Under Review",
    className: "status-warning",
    gauge: "#F59E0B",
  },
  "Delayed / Behind Schedule": {
    short: "Delayed",
    className: "status-critical",
    gauge: "#EF4444",
  },
  "Completed / Final Estimate": {
    short: "Final Estimate",
    className: "status-muted",
    gauge: "#64748B",
  },
};

const allStatuses = Object.keys(statusMeta);
const allDivisions = Array.from({ length: 14 }, (_, index) => index + 1);

let activeSection = "dashboard";
let projectFilters = { query: "", status: "all", division: "all" };
let sortState = { key: "stip", direction: "asc" };
let syncState = {
  lastSyncAt: "2026-06-10T06:15:00.000Z",
  lastSyncType: "nightly",
};

const SYNC_STORAGE_KEY = "ncdot-progress-dashboard-sync-state";
const SYNC_TIME_ZONE = "America/New_York";
const DAILY_SYNC_HOUR = 2;

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 2 : 1,
  }).format(value >= 1000 ? value / 1000 : value) + (value >= 1000 ? "B" : "M");

const percent = (project) => Math.round((project.spent / project.budget) * 100);

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
  const syncTypeLabel = syncState.lastSyncType === "manual" ? "Manual HiCAMS Sync Complete" : "HiCAMS Sync Complete";

  const dataCycleStatus = document.getElementById("dataCycleStatus");
  const dataCycleTime = document.getElementById("dataCycleTime");
  const nextSyncLabel = document.getElementById("nextSyncLabel");
  const autoSyncMeta = document.getElementById("autoSyncMeta");
  const manualSyncMeta = document.getElementById("manualSyncMeta");

  if (dataCycleStatus) dataCycleStatus.textContent = syncTypeLabel;
  if (dataCycleTime) dataCycleTime.textContent = formatSyncDate(lastSync);
  if (nextSyncLabel) nextSyncLabel.textContent = `Next daily refresh: ${formatSyncDate(nextSync)}`;
  if (autoSyncMeta) autoSyncMeta.textContent = `Runs daily at 2:00 AM ET. Next refresh: ${formatSyncDate(nextSync)}.`;
  if (manualSyncMeta) manualSyncMeta.textContent = `Last sync: ${formatSyncDate(lastSync)}.`;
}

function addSyncActivity(type) {
  const isManual = type === "manual";
  activities.unshift({
    title: isManual ? "Manual HiCAMS sync completed" : "Daily HiCAMS sync completed",
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
  }, Math.min(delay, 2147483647));
}

function initSyncCycle() {
  loadSyncState();
  if (shouldAutoSyncNow()) performSync("auto");
  else updateSyncUI();
  scheduleDailyAutoRefresh();
}

function statusBadge(status, compact = false) {
  const meta = statusMeta[status];
  return `
    <span class="status-badge ${meta.className}">
      ${compact ? meta.short : status}
    </span>
  `;
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
      aria-label="Open NCDOT project page for ${project.stip}"
    >
      <i data-lucide="external-link" class="h-4 w-4" aria-hidden="true"></i>
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
      label: "Total Active Contracts",
      value: totalContracts,
      detail: "Across Divisions 1, 3, 5, 6, 10, and 13",
      icon: "briefcase-business",
      glow: "glow-blue",
    },
    {
      label: "Total STIP Allocation Value",
      value: formatCurrency(totalBudget),
      detail: "$906.5M spent to date",
      icon: "landmark",
      glow: "glow-blue",
    },
    {
      label: "On-Schedule Rate",
      value: `${onScheduleRate}%`,
      detail: `${onSchedule} of ${totalContracts} contracts green`,
      icon: "circle-check-big",
      glow: "glow-green",
    },
    {
      label: "Critical / Delayed Projects",
      value: critical,
      detail: "Requires executive review",
      icon: "triangle-alert",
      glow: "glow-gold",
    },
  ];

  document.getElementById("metricStrip").innerHTML = metrics
    .map(
      (metric) => `
        <article class="metric-card glass ${metric.glow}">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">${metric.label}</p>
              <p class="mt-4 font-mono text-3xl font-bold text-white">${metric.value}</p>
            </div>
            <div class="metric-icon">
              <i data-lucide="${metric.icon}" class="h-5 w-5" aria-hidden="true"></i>
            </div>
          </div>
          <p class="mt-5 text-sm leading-relaxed text-slate-400">${metric.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderDashboardRows() {
  document.getElementById("dashboardProjectRows").innerHTML = projects
    .map(
      (project) => `
        <div class="summary-grid-row data-row cursor-pointer" data-project-row="${project.id}" tabindex="0" role="row">
          <div class="summary-cell td td-strong" role="cell" data-label="STIP ID">
            <div class="flex items-center gap-2">
              <span>${project.stip}</span>
              ${ncdotProjectLink(project, "NCDOT")}
            </div>
          </div>
          <div class="summary-cell td" role="cell" data-label="Division">${divisionBadge(project.division)}</div>
          <div class="summary-cell td" role="cell" data-label="Route">${project.description}</div>
          <div class="summary-cell td" role="cell" data-label="Physical">
            <div class="flex items-center gap-3">
              <div class="progress-track flex-1">
                <div class="progress-fill" style="width:${project.physical}%; background:${statusMeta[project.status].gauge}"></div>
              </div>
              <span class="font-mono text-sm font-bold text-white">${project.physical}%</span>
            </div>
          </div>
          <div class="summary-cell td" role="cell" data-label="Status">${statusBadge(project.status, true)}</div>
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
      (activity, index) => `
        <li class="relative grid grid-cols-[1rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
          ${index === activities.length - 1 ? "" : '<span class="absolute left-2 top-4 h-full w-px bg-white/10"></span>'}
          <span class="activity-dot ${toneMap[activity.tone]}"></span>
          <div>
            <p class="text-sm font-semibold text-white">${activity.title}</p>
            <p class="mt-1 text-sm leading-5 text-slate-400">${activity.detail}</p>
            <time class="mt-2 block font-mono text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">${activity.time}</time>
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
    const matchesDivision = projectFilters.division === "all" || project.division === Number(projectFilters.division);
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
  document.getElementById("projectCountLabel").textContent = `${filtered.length} of ${projects.length} contracts shown`;
  document.getElementById("activeFilterChips").innerHTML = chips
    .map((chip) => `<span class="filter-chip">${chip}</span>`)
    .join("");
}

function renderProjectsTable() {
  const filtered = sortedFilteredProjects();
  renderActiveChips(filtered);
  const rows = filtered
    .map((project) => {
      const financial = percent(project);
      return `
        <div class="project-grid-row data-row cursor-pointer" data-project-row="${project.id}" tabindex="0" role="row">
          <div class="project-cell td td-strong" role="cell" data-label="STIP ID">${project.stip}</div>
          <div class="project-cell td font-mono text-slate-300" role="cell" data-label="Contract">${project.contract}</div>
          <div class="project-cell td" role="cell" data-label="Division">${divisionBadge(project.division)}</div>
          <div class="project-cell td" role="cell" data-label="County">${project.county}</div>
          <div class="project-cell td leading-5" role="cell" data-label="Description / Route">${project.description}</div>
          <div class="project-cell td td-muted" role="cell" data-label="Contractor">${project.contractor}</div>
          <div class="project-cell td" role="cell" data-label="Financial Progress">
            <div class="w-full">
              <div class="mb-2 flex justify-between font-mono text-xs font-bold text-slate-400">
                <span>${formatCurrency(project.spent)}</span>
                <span>${formatCurrency(project.budget)}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width:${financial}%"></div>
              </div>
              <p class="mt-2 text-xs text-slate-500">${financial}% spent vs. budgeted</p>
            </div>
          </div>
          <div class="project-cell td" role="cell" data-label="Physical Progress">
            <div class="flex items-center gap-3">
              <div class="gauge relative" style="--value:${project.physical}; --gauge-color:${statusMeta[project.status].gauge}">
                <span>${project.physical}%</span>
              </div>
              <span class="text-sm font-semibold text-slate-400">HiCAMS</span>
            </div>
          </div>
          <div class="project-cell td" role="cell" data-label="Status">${statusBadge(project.status)}</div>
          <div class="project-cell td" role="cell" data-label="NCDOT Link">${ncdotProjectLink(project)}</div>
        </div>
      `;
    })
    .join("");

  document.getElementById("projectsTableBody").innerHTML =
    rows ||
    '<div class="td py-10 text-center text-sm font-semibold text-slate-500">No contracts match the selected filters.</div>';
  if (window.lucide) lucide.createIcons();
}

function showSection(section) {
  activeSection = section;
  document.querySelectorAll(".page-section").forEach((element) => element.classList.toggle("active", element.id === section));
  document.querySelectorAll("[data-section]").forEach((button) => button.classList.toggle("active", button.dataset.section === section));
}

function openDrawer(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;
  const meta = statusMeta[project.status];
  const financial = percent(project);
  document.getElementById("drawerContent").innerHTML = `
    <div class="border-b border-white/10 px-6 py-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Project Detail</p>
          <h2 id="drawerTitle" class="hero-gradient-text mt-3 text-3xl font-bold">${project.stip}</h2>
          <p class="mt-3 text-sm leading-relaxed text-slate-300">${project.description}</p>
        </div>
        <button id="closeDrawer" class="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:border-blue-400/40 hover:bg-blue-400/10 hover:text-white" type="button" data-close-drawer aria-label="Close project detail">
          <i data-lucide="x" class="h-5 w-5" aria-hidden="true"></i>
        </button>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        ${statusBadge(project.status)}
        ${ncdotProjectLink(project, "Open NCDOT project page")}
      </div>
    </div>
    <div class="space-y-5 px-6 py-5">
      <section class="drawer-panel-section">
        <div class="grid grid-cols-2 gap-3">
          <div class="p-4">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Contract</p>
            <p class="mt-2 font-mono font-bold text-white">${project.contract}</p>
          </div>
          <div class="p-4">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-500">Division / County</p>
            <p class="mt-2 font-semibold text-white">Division ${project.division}, ${project.county}</p>
          </div>
        </div>
      </section>

      <section class="drawer-panel-section">
        <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500">Progress</h3>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div class="mb-2 flex justify-between text-sm font-semibold text-slate-300">
              <span>Spent vs. Budgeted</span>
              <span>${financial}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${financial}%"></div>
            </div>
            <p class="mt-2 text-sm text-slate-400">${formatCurrency(project.spent)} spent of ${formatCurrency(project.budget)}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="gauge relative" style="--value:${project.physical}; --gauge-color:${meta.gauge}">
              <span>${project.physical}%</span>
            </div>
            <div>
              <p class="font-semibold text-white">Physical Progress</p>
              <p class="text-sm text-slate-400">Current HiCAMS estimate</p>
            </div>
          </div>
        </div>
      </section>

      <section class="drawer-panel-section">
        <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500">Key Dates</h3>
        <dl class="mt-4 grid gap-3 sm:grid-cols-2">
          ${[
            ["Letting Date", project.dates.letting],
            ["Award Date", project.dates.award],
            ["Completion Date", project.dates.completion],
            ["Last Estimate Thru Date", project.dates.estimate],
          ]
            .map(
              ([label, value]) => `
                <div class="drawer-date-box">
                  <dt class="text-xs font-semibold uppercase tracking-widest text-slate-500">${label}</dt>
                  <dd class="mt-2 font-semibold text-white">${value}</dd>
                </div>
              `
            )
            .join("")}
        </dl>
      </section>

      <section class="drawer-panel-section">
        <h3 class="text-xs font-semibold uppercase tracking-widest text-slate-500">NCDOT Contact Person</h3>
        <div class="mt-4 flex items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-xl border border-blue-400/30 bg-blue-400/10 text-blue-200">
            <i data-lucide="user-round" class="h-5 w-5" aria-hidden="true"></i>
          </div>
          <div>
            <p class="font-semibold text-white">${project.contact.name}</p>
            <p class="text-sm text-slate-400">${project.contact.phone}</p>
          </div>
        </div>
      </section>
    </div>
  `;

  const drawer = document.getElementById("projectDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  drawer.classList.remove("hidden");
  backdrop.classList.remove("hidden");
  requestAnimationFrame(() => drawer.classList.remove("translate-x-full"));
  if (window.lucide) lucide.createIcons();
  document.getElementById("closeDrawer").focus();
}

function closeDrawer() {
  const drawer = document.getElementById("projectDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  drawer.classList.add("translate-x-full");
  window.setTimeout(() => {
    drawer.classList.add("hidden");
    backdrop.classList.add("hidden");
  }, 180);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-drawer]");
    if (closeButton) {
      closeDrawer();
      return;
    }

    const externalProjectLink = event.target.closest("[data-external-project]");
    if (externalProjectLink) {
      return;
    }

    const navButton = event.target.closest("[data-section]");
    if (navButton) showSection(navButton.dataset.section);

    const projectTrigger = event.target.closest("[data-project-row]");
    if (projectTrigger) openDrawer(projectTrigger.dataset.projectRow);
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.closest("[data-external-project]")) return;

    const projectTrigger = event.target.closest("[data-project-row]");
    if (projectTrigger && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openDrawer(projectTrigger.dataset.projectRow);
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

  document.getElementById("resetProjectFilters").addEventListener("click", () => {
    projectFilters = { query: "", status: "all", division: "all" };
    document.getElementById("projectSearch").value = "";
    renderProjectFilters();
    renderProjectsTable();
  });

  document.getElementById("forceSyncButton").addEventListener("click", () => {
    const button = document.getElementById("forceSyncButton");
    button.disabled = true;
    button.classList.add("syncing");
    button.querySelector("span").textContent = "Syncing...";
    window.setTimeout(() => {
      performSync("manual");
      button.disabled = false;
      button.classList.remove("syncing");
      button.querySelector("span").textContent = "Force Sync";
      if (window.lucide) lucide.createIcons();
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

function boot() {
  initSyncCycle();
  renderMetrics();
  renderDashboardRows();
  renderActivityLog();
  renderProjectFilters();
  renderProjectsTable();
  bindEvents();
  if (window.lucide) lucide.createIcons();
}

document.addEventListener("DOMContentLoaded", boot);
