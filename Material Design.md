# PulseDeck Material Design

PulseDeck uses a focused Material Design interface for North Carolina weather and NCDOT construction project monitoring.

## Product scope

The site intentionally contains two routes:

- `/` — executive Home overview with compact North Carolina weather and a concise NCDOT status summary.
- `/project-dashboard/` — NCDOT Construction Project Progress Dashboard with HiCAMS sync state, semantic KPI cards, contract tracking, sorting, filtering, detail views, and official NCDOT links.

## Design foundations

- Roboto for interface text and Roboto Mono for project values, timestamps, and identifiers.
- Tonal surfaces for hierarchy.
- Material cards with restrained elevation.
- Clear primary, success, warning, and error colors paired with text labels.
- Minimum 44-pixel interactive targets.
- Responsive layouts without nested vertical scrolling.
- Visible keyboard focus and reduced-motion support.

The shared implementation lives in `material-design.css`.

## Application structure

- `index.html` contains the Home route.
- `project-dashboard/index.html` contains the dedicated Project Dashboard route.
- `shared-header.js` renders the identical global header and navigation on both routes.
- `project-data.js` is the shared project, activity, and status dataset.
- `script.js` owns Home weather and overview behavior.
- `ncdot-progress-dashboard.js` owns dashboard filters, sorting, details, and HiCAMS sync state.
- `server.js` serves both routes, mirrors them under `/preview`, and proxies approved NWS requests.

## Preview workflow

Run the local server and open:

`http://localhost:8787/preview`

Dashboard preview:

`http://localhost:8787/preview/project-dashboard/`

The preview routes serve the same implementation while clearly identifying review mode. Do not merge the redesign branch until the preview is approved.

## Validation

Use:

- `npm run lint`
- `npm run build`
- `npm test`

These commands check JavaScript syntax, required page content, preview routing, and removal of retired features and legacy design terminology.
