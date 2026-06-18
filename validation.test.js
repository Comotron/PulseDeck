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
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
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
  "NCDOT Construction Project Progress Dashboard",
  "HiCAMS",
  'id="weather"',
  'id="ncdot"',
  'id="projectsTableBody"',
].forEach((requiredText) => {
  assert.equal(index.includes(requiredText), true, `Missing required page content: ${requiredText}`);
});

assert.match(server, /requestUrl\.pathname === "\/preview"/);
assert.match(server, /requestUrl\.pathname === "\/api\/nws"/);
assert.equal(fs.existsSync(path.join(root, "material-design.css")), true);

console.log(`PulseDeck validation passed across ${files.length} text files.`);
