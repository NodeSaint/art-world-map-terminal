'use strict';

const { createProjector, createInverseProjector } = require('./projection');
const { themes, getLandColour } = require('./themes');
const { drawGrid } = require('./grid');
const { drawLabels } = require('./labels');

// Point-in-polygon test using ray casting
function pointInPolygon(px, py, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// ANSI truecolor escape sequences
function fg(r, g, b) { return `\x1b[38;2;${r};${g};${b}m`; }
function bg(r, g, b) { return `\x1b[48;2;${r};${g};${b}m`; }
const RESET = '\x1b[0m';

// Render the map and return the output string
function render(opts) {
  const {
    countries,
    themeName = 'midnight',
    zoom = 1,
    centreLon = 0,
    centreLat = 0,
    projection = 'mercator',
    showGrid = false,
    showLabels = false,
    showBorders = true,
    asciiMode = false,
    live = false,
  } = opts;

  const termWidth = process.stdout.columns || 80;
  const termRows = process.stdout.rows || 24;
  const statusRows = live ? 2 : 0;
  const termHeight = termRows - statusRows;
  const width = termWidth;
  const height = termHeight * 2;  // half-block doubling

  const theme = themes[themeName] || themes.midnight;

  // Create pixel grid: each cell stores { type, colour, ... }
  const pixelGrid = new Array(height);
  for (let y = 0; y < height; y++) {
    pixelGrid[y] = new Array(width);
    for (let x = 0; x < width; x++) {
      pixelGrid[y][x] = { type: 'ocean', colour: theme.ocean };
    }
  }

  const project = createProjector({
    projection, centreLon, centreLat, zoom, width, height,
  });

  // For each country, project and fill polygons
  for (const country of countries) {
    const countryColour = getLandColour(theme, country.index, country.centroid[1]);

    for (const polygon of country.polygons) {
      // Project all vertices
      const projected = polygon.map(([lon, lat]) => project(lon, lat));

      // Find bounding box in pixel space
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      for (const [x, y] of projected) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }

      // Clamp to grid
      minX = Math.max(0, Math.floor(minX));
      maxX = Math.min(width - 1, Math.ceil(maxX));
      minY = Math.max(0, Math.floor(minY));
      maxY = Math.min(height - 1, Math.ceil(maxY));

      // Skip if completely off screen
      if (minX > width || maxX < 0 || minY > height || maxY < 0) continue;

      // Skip very wide polygons that span the whole screen (anti-meridian wrap artifacts)
      if (maxX - minX > width * 0.8 && zoom <= 2) continue;

      // Fill using point-in-polygon for each pixel in bounding box
      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          if (pointInPolygon(px, py, projected)) {
            pixelGrid[py][px] = { type: 'land', colour: countryColour, countryIndex: country.index };
          }
        }
      }

      // Draw borders
      if (showBorders && (termWidth >= 60)) {
        for (let i = 0; i < projected.length - 1; i++) {
          drawLine(pixelGrid, width, height,
            projected[i][0], projected[i][1],
            projected[i + 1][0], projected[i + 1][1],
            theme.border);
        }
      }
    }
  }

  // Draw grid if enabled
  if (showGrid) {
    drawGrid(pixelGrid, width, height, project, theme, zoom);
  }

  // Draw labels if enabled
  if (showLabels) {
    drawLabels(pixelGrid, width, height, countries, project, theme, zoom);
  }

  // Compose output string using half-block characters
  let output = '\x1b[2J\x1b[H'; // clear screen + cursor home
  output += '\x1b[?25l';          // hide cursor

  if (asciiMode) {
    output += renderAscii(pixelGrid, width, height, termHeight);
  } else {
    output += renderTruecolor(pixelGrid, width, height, termHeight);
  }

  // Status bar in live mode
  if (live) {
    output += renderStatusBar(theme, themeName, centreLat, centreLon, zoom, termWidth);
  }

  return output;
}

function renderTruecolor(pixelGrid, width, height, termHeight) {
  let out = '';

  for (let row = 0; row < termHeight; row++) {
    const topY = row * 2;
    const botY = row * 2 + 1;

    let prevFg = null;
    let prevBg = null;

    for (let x = 0; x < width; x++) {
      const top = pixelGrid[topY] && pixelGrid[topY][x];
      const bot = pixelGrid[botY] && pixelGrid[botY][x];

      if (!top || !bot) {
        out += ' ';
        continue;
      }

      // Handle label characters specially
      if (top.type === 'label') {
        const fgKey = `${top.colour[0]},${top.colour[1]},${top.colour[2]}`;
        const bgC = top.bg || [0, 0, 0];
        const bgKey = `${bgC[0]},${bgC[1]},${bgC[2]}`;
        if (fgKey !== prevFg || bgKey !== prevBg) {
          out += fg(top.colour[0], top.colour[1], top.colour[2]);
          out += bg(bgC[0], bgC[1], bgC[2]);
          prevFg = fgKey;
          prevBg = bgKey;
        }
        out += top.char;
        continue;
      }

      const topC = top.colour;
      const botC = bot.colour;

      const topKey = `${topC[0]},${topC[1]},${topC[2]}`;
      const botKey = `${botC[0]},${botC[1]},${botC[2]}`;

      if (topKey === botKey) {
        // Both same colour — full block, use background colour
        if (botKey !== prevBg) {
          out += bg(topC[0], topC[1], topC[2]);
          prevBg = botKey;
        }
        out += ' ';
      } else {
        // Use ▀ — foreground is top, background is bottom
        if (topKey !== prevFg) {
          out += fg(topC[0], topC[1], topC[2]);
          prevFg = topKey;
        }
        if (botKey !== prevBg) {
          out += bg(botC[0], botC[1], botC[2]);
          prevBg = botKey;
        }
        out += '▀';
      }
    }

    out += RESET;
    if (row < termHeight - 1) out += '\n';
    prevFg = null;
    prevBg = null;
  }

  return out;
}

function renderAscii(pixelGrid, width, height, termHeight) {
  let out = '';
  // In ASCII mode, just use one row per terminal row (no half-blocks)
  for (let row = 0; row < termHeight; row++) {
    const y = Math.min(row * 2, height - 1);
    for (let x = 0; x < width; x++) {
      const pixel = pixelGrid[y] && pixelGrid[y][x];
      if (!pixel) { out += ' '; continue; }
      switch (pixel.type) {
        case 'land': out += '#'; break;
        case 'ocean': out += '.'; break;
        case 'grid': out += ':'; break;
        case 'label': out += pixel.char; break;
        default: out += ' ';
      }
    }
    if (row < termHeight - 1) out += '\n';
  }
  return out;
}

function renderStatusBar(theme, themeName, centreLat, centreLon, zoom, width) {
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);
  const lat = centreLat.toFixed(1);
  const lon = centreLon.toFixed(1);
  const line = `\u2500`.repeat(width);

  const status = ` terra  |  ${time}  |  theme: ${themeName}  |  `
    + `centre: ${lat}\u00b0, ${lon}\u00b0  |  zoom: ${zoom}x  |  `
    + `q: quit  arrows: pan  +/-: zoom  t/g/l/b: toggle`;

  const statusTrunc = status.slice(0, width);

  let out = '\n';
  out += bg(theme.statusBg[0], theme.statusBg[1], theme.statusBg[2]);
  out += fg(theme.statusFg[0], theme.statusFg[1], theme.statusFg[2]);
  out += statusTrunc.padEnd(width);
  out += RESET;

  return out;
}

// Bresenham's line algorithm for drawing borders
function drawLine(pixelGrid, width, height, x0, y0, x1, y1, colour) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);

  // Skip lines that span too far (anti-meridian artifacts)
  if (Math.abs(x1 - x0) > width * 0.5) return;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let steps = 0;
  const maxSteps = dx + dy + 1;

  while (steps++ < maxSteps) {
    if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
      const existing = pixelGrid[y0][x0];
      if (existing && existing.type === 'land') {
        pixelGrid[y0][x0] = { type: 'border', colour };
      }
    }

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

module.exports = { render };
