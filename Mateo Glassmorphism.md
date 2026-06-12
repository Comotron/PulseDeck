---
design_tokens:
  version: "1.0.0"
  theme: "Mateo Glassmorphism"
  framework_targets:
    deployment: "Static HTML/CSS"
    global_styles: "index.html loads raw vanilla styles.css directly"
    dashboard_styles: "Specialized dashboards may load a page stylesheet plus the Tailwind CDN"
    tailwind: "CDN utility layer only where explicitly loaded; do not rely on @apply as the baseline"
    icons: "Lucide icons; sidebar/navigation icons use a 24px footprint"
    fonts: "Google Fonts links (Geist Sans, Geist Mono)"
  palette:
    background: "#020817"
    surface_glass: "rgba(255,255,255,0.05)"
    surface_glass_strong: "rgba(255,255,255,0.08)"
    text:
      primary: "#ffffff"
      body: "#cbd5e1"
      secondary: "#94a3b8"
      muted: "#64748b"
      disabled: "#475569"
    routes:
      existing_rail: "#60a5fa"
      highway_adjacent: "#4ade80"
      greenfield: "#fb923c"
      verdict_amber: "#fbbf24"
    status:
      positive: "#34d399"
      warning: "#fbbf24"
      critical: "#f87171"
    features:
      university: "#a78bfa"
      airport: "#22d3ee"
      military: "#cbd5e1"
---

# Design System Rules & Rationale

This document serves as the absolute visual blueprint for the **Mateo Glassmorphism** theme. AI coding agents must read and strictly enforce these architectural rules before building new layout modules, refactoring components, or modifying pages.

## 1. Brand Concept & Voice
* **Vibe**: Modern infrastructure planning and high-transparency government data engine. Deep ink backdrops, luminous gradients, low-opacity glass layouts. Authoritative, precise, mathematical, and data-dense.
* **Tone**: Data-forward, transparent, completely willing to state "not realistic" directly. Accessible to both engineers and the general public.
* **Identity Wordmark**: Combine `Train` icon (`w-4 h-4`) inside a `p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30` with text `FAY–CLT HSR Study` (`text-slate-200 font-semibold text-sm tracking-wide`). Do not inject a custom graphic logomark.

## 2. Core CSS Utility Model (`styles.css` + Page Stylesheets)
This project uses a static deployment model. `index.html` loads raw vanilla `styles.css` directly. Specialized sub-dashboards, such as `ncdot-progress-dashboard.html`, may load their own page stylesheet and use the Tailwind CDN for utility classes. Do not create or depend on `app/globals.css`, Next.js-only conventions, or Tailwind `@apply` directives as the baseline environment.

Agents must utilize these precise CSS utilities when generating structures. Never write hardcoded blur/background variants inline if they conflict with these classes:

```css
/* Deep Mesh Background Canvas */
.bg-mesh {
  background: radial-gradient(ellipse at 20% 10%, rgba(59,130,246,0.13) 0%, transparent 55%), 
              radial-gradient(ellipse at 80% 50%, rgba(16,185,129,0.07) 0%, transparent 55%), 
              radial-gradient(ellipse at 50% 90%, rgba(99,102,241,0.09) 0%, transparent 55%), 
              #020817;
}

/* Glass Layers (Must always sit directly above .bg-mesh) */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.10);
}
.glass-strong {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

/* Header Text Accents */
.hero-gradient-text {
  background: linear-gradient(90deg, #60a5fa, #67e8f9, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Section Title Markers */
.section-title::after {
  content: '';
  display: block;
  width: 3rem;
  height: 3px;
  margin-top: 0.75rem;
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(59,130,246,0.9), rgba(99,102,241,0.5));
}

/* Natural-width data tables */
table {
  width: 100%;
  border-collapse: collapse;
}
```

## 3. Typography Matrix
Fonts are explicitly handled using static Google Fonts links (`Geist Sans` and `Geist Mono`).

* **Hero Titles**: `text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white`
* **Section Headings**: `text-3xl sm:text-4xl font-bold text-white` + layer with `.section-title`
* **Large Cards**: `text-xl sm:text-2xl font-bold text-white`
* **Medium Cards**: `text-base sm:text-lg font-bold text-white`
* **Body Elements**: `text-sm sm:text-base leading-relaxed text-slate-300`
* **Labels / Meta**: `text-xs font-medium text-slate-400`
* **Eyebrow / Categories**: `text-xs font-semibold uppercase tracking-widest text-slate-400`
* **Disclaimers / Footers**: `text-xs text-slate-500`

## 4. Layout Constraints, Radii, & Micro-Glows
All responsive containers must enforce `max-w-7xl mx-auto px-4 sm:px-6` with a strict section vertical padding rhythm of `py-24` (96px).

### Layout Grid Configurations (Mobile-First 1-Column Defaults)
* **Route Cards**: `grid grid-cols-1 lg:grid-cols-3 gap-6`
* **Finding Cards**: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`
* **Map Galleries**: `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5`
* **Station Cards**: `grid grid-cols-1 sm:grid-cols-2 gap-4`
* **Engineering Specs**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4`

### Boundary Radius Scale
* **Large Cards & Data Tables**: `rounded-3xl` (24px)
* **Standard Cards**: `rounded-2xl` (16px)
* **Small Inset Boxes**: `rounded-xl` (12px) (e.g., internal metric compartments within glass surfaces)
* **Pill Badges & Call-To-Actions**: `rounded-full`
* **Utility Triggers / Action Toggles**: `rounded-lg` (8px)

### Page-Specific Glow Profiles (`ncdot-progress-dashboard.css`)
Ambient status glows are page-specific dashboard utilities. Keep these definitions in `ncdot-progress-dashboard.css` unless a new page explicitly adopts the same module:
* **Alt 1 (Existing Rail)**: `.glow-blue` (`box-shadow: 0 0 40px rgba(59,130,246,0.25), 0 0 80px rgba(59,130,246,0.08)`)
* **Alt 2 (Highway Recommended)**: `.glow-green` (`box-shadow: 0 0 40px rgba(34,197,94,0.25), 0 0 80px rgba(34,197,94,0.08)`)
* **Alt 3 (Greenfield Fastest)**: `.glow-orange` (`box-shadow: 0 0 40px rgba(249,115,22,0.25), 0 0 80px rgba(249,115,22,0.08)`)
* **Final Study Verdicts**: `.glow-gold` (`box-shadow: 0 0 40px rgba(234,179,8,0.25), 0 0 80px rgba(234,179,8,0.08)`)

## 5. UI Animations & State Adjustments
* **Content Transitions**: Assign `.fade-in-up` to structural entrances (`@keyframes translateY(28px) to 0, opacity from 0 to 1 over 0.7s cubic-bezier`).
* **Route Network Paths**: Graphic SVG route components use `.route-line` mapping a slow infinity pulse loop (`opacity: 0.5` to `1` over 3 seconds).
* **Station Node Indicators**: Transit map point dots pulse dynamically using `.ping-slow` (`scale(1)` to `scale(1.5)`, opacity down to `0.25` over 2.5s).
* **Hover Interaction Limits**: Cards scale gently via `transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`. Component buttons run tight over `duration-200`.
* **Reduced Motion Requirement**: Every stylesheet that defines fades, pulses, hover scales, spinning loaders, or ambient movement must include a `@media (prefers-reduced-motion: reduce)` fallback. Glowing LED pulses, hover-state scales, route pulses, weather heartbeat pings, and ambient card fades must stabilize or fully disable when motion reduction is enabled at the operating-system level.

## 6. Implementation Guardrails ("Don'ts")
* **No Pure Dark Themes**: Never map layouts to deep pitch-black (`#000000`). Background foundations must always fall accurately to Slate-950 (`#020817`).
* **No Dark Elements on Dark Canvas**: High contrast is vital. Dark-colored text layers must never sit blindly inside darkened background frames. Primary content on glass layouts must use pure `text-white` or standard translucent `text-slate-300`. Lower-hierarchy utilities such as `text-slate-400` and `text-slate-500` are permitted for data labels, muted status timestamps, helper captions, and metadata on glass cards.
* **No Internal Table Scroll Traps**: Data tables and data-grid listings must render at their full natural vertical height down the page. Do not wrap tables in containers with `max-height`, `overflow-y: auto`, or `overflow-y: scroll`. Real `<table>` elements must use `width: 100%; border-collapse: collapse;`, and grid-based table simulations must keep their outer glass panels and row groups at `width: 100%`.

## 7. Utility Scope Map
* **Global Shell (`styles.css`)**: Owns the primary static app shell, `.bg-mesh`, `.glass`, `.glass-strong`, `.hero-gradient-text`, `.section-title`, core typography, sidebar navigation, and full-width base table rules.
* **Dashboard Module (`ncdot-progress-dashboard.css`)**: Owns NCDOT-specific dashboard controls, project grids, summary grids, metric cards, and the ambient status glow utilities `.glow-blue`, `.glow-green`, `.glow-orange`, and `.glow-gold`.
* **Transit Corridor Asset Styles (`styles.css`)**: Owns route-asset geometry and animation hooks such as `.route-line`; route pulses must remain isolated to those corridor visuals.
* **Weather Tracking Heartbeat Utility**: `.ping-slow` is a dedicated weather/status heartbeat animation. It may be used for live connection or station-node indicators only when the page also provides the required reduced-motion fallback.
