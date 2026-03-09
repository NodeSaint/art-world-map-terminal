'use strict';

// Place country labels on the pixel grid
function drawLabels(pixelGrid, width, height, countries, project, theme, zoom) {
  const textColour = theme.text;

  for (const country of countries) {
    const [lon, lat] = country.centroid;
    const [cx, cy] = project(lon, lat);

    // Use ISO code at low zoom, full name at higher zoom
    const label = zoom >= 4 ? country.name : country.iso;

    if (!label || label === '???') continue;

    // Centre the label on the centroid
    const startX = Math.round(cx - label.length / 2);
    const y = cy;

    if (y < 0 || y >= height) continue;

    // Check if centroid is on land (at least the centre pixel)
    if (cx < 0 || cx >= width) continue;
    const centrePixel = pixelGrid[y] && pixelGrid[y][Math.round(cx)];
    if (!centrePixel || centrePixel.type !== 'land') continue;

    // Place each character
    for (let i = 0; i < label.length; i++) {
      const x = startX + i;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      pixelGrid[y][x] = {
        type: 'label',
        char: label[i],
        colour: textColour,
        bg: pixelGrid[y][x] ? pixelGrid[y][x].colour : theme.ocean,
      };
    }
  }
}

module.exports = { drawLabels };
