# PulseDeck Material Design

PulseDeck uses a focused Material Design interface for North Carolina weather and NCDOT construction project monitoring.

## Product scope

The site intentionally contains only:

- North Carolina Weather, powered by National Weather Service forecast data.
- NCDOT Construction Project Progress Dashboard, with HiCAMS sync state, project filtering, sorting, detail views, and official NCDOT links.

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

- `index.html` contains the complete website structure.
- `script.js` owns the weather and header behavior.
- `ncdot-progress-dashboard.js` owns project data, filters, sorting, details, and HiCAMS sync state.
- `server.js` serves the site, provides the `/preview` review route, and proxies approved NWS requests.

## Preview workflow

Run the local server and open:

`http://localhost:8787/preview`

The preview route serves the same implementation as the main page while clearly identifying review mode. Do not merge the redesign branch until the preview is approved.

## Validation

Use:

- `npm run lint`
- `npm run build`
- `npm test`

These commands check JavaScript syntax, required page content, preview routing, and removal of retired features and legacy design terminology.
