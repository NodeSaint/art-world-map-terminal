'use strict';

// Draw latitude/longitude grid lines onto the pixel grid
function drawGrid(pixelGrid, width, height, project, theme, zoom) {
  const gridColour = theme.grid;

  // Determine grid spacing based on zoom
  let spacing = 30;
  if (zoom >= 3) spacing = 15;
  if (zoom >= 6) spacing = 10;
  if (zoom >= 8) spacing = 5;

  // Draw longitude lines
  for (let lon = -180; lon <= 180; lon += spacing) {
    for (let py = 0; py < height; py++) {
      // Convert pixel y back to approximate latitude for this line
      // We sample at this pixel row
      const lat = 85 - (py / height) * 170;
      const [x, y] = project(lon, lat);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        // Only draw on ocean pixels (don't overwrite land) — use dotted pattern
        if (y % 3 === 0) {
          const existing = pixelGrid[y][x];
          if (!existing || existing.type === 'ocean') {
            pixelGrid[y][x] = { type: 'grid', colour: gridColour };
          }
        }
      }
    }
  }

  // Draw latitude lines
  for (let lat = -60; lat <= 80; lat += spacing) {
    for (let px = 0; px < width; px++) {
      const lon = -180 + (px / width) * 360;
      const [x, y] = project(lon, lat);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        if (x % 3 === 0) {
          const existing = pixelGrid[y][x];
          if (!existing || existing.type === 'ocean') {
            pixelGrid[y][x] = { type: 'grid', colour: gridColour };
          }
        }
      }
    }
  }
}

module.exports = { drawGrid };
