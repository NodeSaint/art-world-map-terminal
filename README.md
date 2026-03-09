# terra

A beautiful, responsive world map rendered directly in your terminal using Unicode block characters and 24-bit ANSI truecolor. Pure Node.js, zero dependencies.

```
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ░░░░░░░░░░░░░░░░░░░▓▓░░░░░░▓▓▓▓░░░░░░░░░░░░░░░░░░░
  ░░░░░░░░░░░░░░▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░
  ░░░░▓▓▓▓░▓▓▓▓░░░░░░░░░▓▓▓▓▓▓▓░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓
  ░░░░░░░░▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓░░░
  ░░░░░░░░░░░▓▓▓▓▓▓▓▓▓░▓▓▓░░░░░░░░░░░▓▓░░▓▓░░▓▓░░░░
  ░░░░░░░░░░░▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓░░░░
  ░░░░░░░░░░░░░░░░░░░░░░░░░▓░░░░░░░░░░░░░▓▓▓░░░░░░░░
  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
  ─────────────────────────────────────────────────────
   terra  |  theme: midnight  |  centre: 0.0°, 0.0°
```

## Installation

```bash
# Clone and link
git clone <repo-url>
cd terra
npm link

# Then run from anywhere
terra

# Or run directly
node bin/terra.js
```

## Usage

```bash
# Quick render and exit
terra

# Live mode — interactive, resizable
terra --live

# Pick a theme
terra --theme vapor

# Zoom into Tokyo
terra --centre 35.6,139.7 --zoom 4

# Full featured
terra --live --theme hacker --grid --label --zoom 2

# ASCII fallback for basic terminals
terra --ascii
```

## Flags

| Flag | Description |
|------|-------------|
| `--live` | Interactive mode: re-renders on resize, keyboard controls |
| `--theme <name>` | Colour theme (see below) |
| `--zoom <1-10>` | Zoom level, default 1 |
| `--centre <lat,lon>` | Centre the map (also `--center`) |
| `--projection <name>` | `mercator` (default) or `equirectangular` |
| `--grid` | Show lat/lon grid lines |
| `--label` | Show country labels (ISO codes, full names at high zoom) |
| `--borders` | Show country borders (on by default) |
| `--no-borders` | Hide country borders |
| `--ascii` | ASCII fallback — no Unicode, no truecolor |
| `-h, --help` | Show help |

## Live Mode Keys

| Key | Action |
|-----|--------|
| Arrow keys | Pan the map |
| `+` / `-` | Zoom in / out |
| `t` | Cycle through themes |
| `g` | Toggle grid |
| `l` | Toggle labels |
| `b` | Toggle borders |
| `r` | Reset to default view |
| `q` | Quit |

## Themes

- **midnight** — Dark navy ocean, muted green land. The default. Calm and readable.
- **hacker** — Pure black ocean, neon green land. Matrix vibes.
- **satellite** — Dark blue ocean, brown/tan landmasses. Realistic feel.
- **vapor** — Synthwave aesthetic. Purple ocean, cyan land, pink accents.
- **paper** — Light background, subtle land shading. Like a printed map.
- **heat** — Land coloured by latitude: blues at poles, reds at equator.

## How It Works

- Parses Natural Earth GeoJSON country boundaries (110m resolution, bundled)
- Projects polygons using Mercator (or equirectangular) math
- Fills countries using ray-casting point-in-polygon tests
- Renders using Unicode half-block characters (`▀`) for double vertical resolution
- Outputs 24-bit ANSI truecolor escape sequences

## Requirements

- Node.js 14+
- A terminal with truecolor support (iTerm2, kitty, WezTerm, most modern terminals)
- Use `--ascii` for terminals without Unicode/truecolor

## Credits

World boundary data from [Natural Earth](https://www.naturalearthdata.com/) — free vector map data at 1:110m scale.

## License

MIT
