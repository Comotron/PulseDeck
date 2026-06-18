const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const ignoredNames = new Set([".git", "live-hub.err.log", "live-hub.out.log"]);
const textExtensions = new Set([".html", ".css", ".js", ".json", ".md", ".bat"]);

function collectTextFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredNames.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTextFiles(fullPath);
    return textExtensions.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
  });
}

const files = collectTextFiles(root);
const source = files.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "project-dashboard", "index.html"), "utf8");
const header = fs.readFileSync(path.join(root, "shared-header.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

const forbiddenPatterns = [
  new RegExp([["Ma", "teo"].join(""), ["Gla", "ssmorphism"].join("")].join("[- ]"), "i"),
  new RegExp(["Market", "Route Pulse"].join(" & "), "i"),
  new RegExp(["Travel", `Air${"port Pulse"}`].join(" & "), "i"),
  new RegExp(["Malme", "Roads"].join(""), "i"),
  new RegExp(["Market", "holdings"].join(" "), "i"),
  new RegExp([`Trans${"it"}`, "Corridor Status"].join(" & "), "i"),
  new RegExp(["/api", "quotes"].join("/"), "i"),
  new RegExp(["/api", "travel"].join("/"), "i"),
];

forbiddenPatterns.forEach((pattern) => {
  assert.equal(pattern.test(source), false, `Forbidden content remains: ${pattern}`);
});

[
  "PulseDeck",
  "North Carolina Weather",
  "Open Project Dashboard",
  'id="homeQuickStats"',
  '<pulse-header active="home"',
].forEach((requiredText) => {
  assert.equal(home.includes(requiredText), true, `Missing required Home content: ${requiredText}`);
});

[
  "NCDOT Construction Project Progress Dashboard",
  "Contract Tracking",
  "Award Amount",
  "Current Estimate",
  "Physical Progress",
  "Schedule Status",
  "Last Update",
  'id="projectsTableBody"',
  'id="activityLog"',
  '<pulse-header active="dashboard"',
].forEach((requiredText) => {
  assert.equal(dashboard.includes(requiredText), true, `Missing dashboard content: ${requiredText}`);
});

assert.equal(home.includes('id="projectsTableBody"'), false, "Home must not contain the contract table.");
assert.equal(home.includes('id="activityLog"'), false, "Home must not contain recent project activity.");
assert.equal(home.includes("NCDOT Construction Project Progress Dashboard"), false, "Home must remain overview-only.");
assert.equal((header.match(/<header class="site-header">/g) || []).length, 1, "Shared header markup is missing.");
assert.equal(home.includes('<header class="site-header">'), false, "Home must use the shared header component.");
assert.equal(dashboard.includes('<header class="site-header">'), false, "Dashboard must use the shared header component.");
assert.match(header, /North Carolina Transportation Intelligence/);
assert.match(header, />\s*Home\s*</);
assert.match(header, /Project Dashboard/);
assert.match(server, /resolveStaticPath/);
assert.match(server, /\/project-dashboard/);
assert.match(server, /\/preview/);
assert.match(server, /requestUrl\.pathname === "\/api\/nws"/);
assert.equal(fs.existsSync(path.join(root, "material-design.css")), true);
assert.equal(fs.existsSync(path.join(root, "project-data.js")), true);

console.log(`PulseDeck route validation passed across ${files.length} text files.`);
