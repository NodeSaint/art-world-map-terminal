'use strict';

// Each theme defines colours as [r, g, b] arrays
const themes = {
  midnight: {
    name: 'midnight',
    ocean: [10, 15, 36],
    land: [58, 90, 64],
    landRange: 30,       // how much to vary land colour per country
    border: [80, 120, 88],
    grid: [30, 40, 60],
    text: [140, 160, 150],
    statusBg: [20, 25, 45],
    statusFg: [120, 140, 130],
  },
  hacker: {
    name: 'hacker',
    ocean: [0, 0, 0],
    land: [0, 180, 0],
    landRange: 40,
    border: [0, 255, 0],
    grid: [0, 50, 0],
    text: [0, 255, 0],
    statusBg: [0, 10, 0],
    statusFg: [0, 200, 0],
  },
  satellite: {
    name: 'satellite',
    ocean: [15, 30, 60],
    land: [120, 100, 70],
    landRange: 35,
    border: [140, 120, 90],
    grid: [40, 55, 80],
    text: [200, 190, 170],
    statusBg: [10, 20, 40],
    statusFg: [160, 150, 130],
  },
  vapor: {
    name: 'vapor',
    ocean: [40, 10, 60],
    land: [0, 200, 200],
    landRange: 40,
    border: [100, 255, 255],
    grid: [60, 20, 80],
    text: [255, 100, 200],
    statusBg: [30, 5, 45],
    statusFg: [200, 80, 180],
  },
  paper: {
    name: 'paper',
    ocean: [235, 230, 220],
    land: [245, 240, 230],
    landRange: 10,
    border: [80, 80, 80],
    grid: [200, 195, 185],
    text: [60, 60, 60],
    statusBg: [220, 215, 205],
    statusFg: [80, 80, 80],
  },
  heat: {
    name: 'heat',
    ocean: [10, 15, 36],
    land: [200, 100, 50],  // base, overridden by latitude
    landRange: 0,
    border: [220, 130, 70],
    grid: [30, 40, 60],
    text: [240, 220, 200],
    statusBg: [20, 25, 45],
    statusFg: [200, 180, 160],
    // Special: land colour is computed from latitude
    heatMode: true,
  },
};

// Get land colour for a country, with per-country variation
function getLandColour(theme, countryIndex, lat) {
  if (theme.heatMode) {
    // Map latitude (-80 to 80) to blue→red gradient
    const t = Math.max(0, Math.min(1, (lat + 80) / 160));
    // Blue (poles) → green (mid) → red (equator)
    const r = Math.round(30 + 220 * t);
    const g = Math.round(80 + 120 * Math.sin(t * Math.PI));
    const b = Math.round(220 - 200 * t);
    return [r, g, b];
  }

  const base = theme.land;
  const range = theme.landRange;
  // Use a hash-like offset from country index for consistent variation
  const hash = ((countryIndex * 137 + 43) % 256) / 256;
  const offset = Math.round((hash - 0.5) * range);

  return [
    Math.max(0, Math.min(255, base[0] + offset)),
    Math.max(0, Math.min(255, base[1] + offset + Math.round((hash * 47) % 15) - 7)),
    Math.max(0, Math.min(255, base[2] + offset - Math.round((hash * 31) % 10) + 5)),
  ];
}

module.exports = { themes, getLandColour };
