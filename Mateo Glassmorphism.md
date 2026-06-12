---
design_tokens:
  version: "1.0.0"
  theme: "Mateo Glassmorphism"
  framework_targets:
    tailwind: "v4.0"
    icons: "Lucide React (w-4 h-4 standard)"
    fonts: "Next.js Font Google (Geist Sans, Geist Mono)"
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

## 2. Core Global CSS Utilities (`app/globals.css`)
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
  @apply bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent;
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
```

## 3. Typography Matrix
Fonts are explicitly handled using Google Fonts via Next.js (`Geist Sans` and `Geist Mono`). 

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

### Visual Component Glow Profiles
When evaluating specific rail variants or outcomes, inject these glowing utilities:
* **Alt 1 (Existing Rail)**: `.glow-blue` (`box-shadow: 0 0 40px rgba(59,130,246,0.25), 0 0 80px rgba(59,130,246,0.08)`)
* **Alt 2 (Highway Recommended)**: `.glow-green` (`box-shadow: 0 0 40px rgba(34,197,94,0.25), 0 0 80px rgba(34,197,94,0.08)`)
* **Alt 3 (Greenfield Fastest)**: `.glow-orange` (`box-shadow: 0 0 40px rgba(249,115,22,0.25), 0 0 80px rgba(249,115,22,0.08)`)
* **Final Study Verdicts**: `.glow-gold` (`box-shadow: 0 0 40px rgba(234,179,8,0.25), 0 0 80px rgba(234,179,8,0.08)`)

## 5. UI Animations & State Adjustments
* **Content Transitions**: Assign `.fade-in-up` to structural entrances (`@keyframes translateY(28px) to 0, opacity from 0 to 1 over 0.7s cubic-bezier`).
* **Route Network Paths**: Graphic SVG route components use `.route-line` mapping a slow infinity pulse loop (`opacity: 0.5` to `1` over 3 seconds).
* **Station Node Indicators**: Transit map point dots pulse dynamically using `.ping-slow` (`scale(1)` to `scale(1.5)`, opacity down to `0.25` over 2.5s).
* **Hover Interaction Limits**: Cards scale gently via `transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`. Component buttons run tight over `duration-200`.

## 6. Implementation Guardrails ("Don'ts")
* **No Pure Dark Themes**: Never map layouts to deep pitch-black (`#000000`). Background foundations must always fall accurately to Slate-950 (`#020817`).
* **No Dark Elements on Dark Canvas**: High contrast is vital. Dark-colored text layers must never sit blindly inside darkened background frames. Text on glass layouts must continuously match pure `text-white` or standard translucent `text-slate-300`.
* **No Raw Overflows**: Data tables and map listings must always apply dedicated viewport boundary helpers like `.table-scroll` to comfortably allow horizontal scrolling on compact mobile devices.
