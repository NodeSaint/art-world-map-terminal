'use strict';

const PI = Math.PI;
const DEG2RAD = PI / 180;
const MAX_LAT = 85.051129;  // Mercator limit

function clampLat(lat) {
  return Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
}

// Mercator projection: (lon, lat) → (x, y) normalised to [0, 1]
function mercator(lon, lat) {
  lat = clampLat(lat);
  const x = (lon + 180) / 360;
  const latRad = lat * DEG2RAD;
  const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / PI) / 2;
  return [x, y];
}

// Equirectangular projection: simple linear mapping
function equirectangular(lon, lat) {
  lat = clampLat(lat);
  const x = (lon + 180) / 360;
  const y = (90 - lat) / 180;  // flip so north is up
  return [x, y];
}

// Create a projector function with zoom and centre support
function createProjector(opts) {
  const {
    projection = 'mercator',
    centreLon = 0,
    centreLat = 0,
    zoom = 1,
    width,    // terminal columns
    height,   // pixel rows (terminal rows × 2 for half-blocks)
  } = opts;

  const projFn = projection === 'equirectangular' ? equirectangular : mercator;

  // Project centre point to get offset
  const [cx, cy] = projFn(centreLon, centreLat);

  return function project(lon, lat) {
    const [nx, ny] = projFn(lon, lat);

    // Apply zoom around centre
    const px = (nx - cx) * zoom + 0.5;
    const py = (ny - cy) * zoom + 0.5;

    // Map to pixel coordinates
    const x = Math.round(px * width);
    const y = Math.round(py * height);

    return [x, y];
  };
}

// Inverse projection: pixel → (lon, lat)
function createInverseProjector(opts) {
  const {
    projection = 'mercator',
    centreLon = 0,
    centreLat = 0,
    zoom = 1,
    width,
    height,
  } = opts;

  const projFn = projection === 'equirectangular' ? equirectangular : mercator;
  const [cx, cy] = projFn(centreLon, centreLat);

  return function inverse(px, py) {
    const nx = (px / width - 0.5) / zoom + cx;
    const ny = (py / height - 0.5) / zoom + cy;

    if (projection === 'equirectangular') {
      const lon = nx * 360 - 180;
      const lat = 90 - ny * 180;
      return [lon, lat];
    }

    // Inverse Mercator
    const lon = nx * 360 - 180;
    const lat = Math.atan(Math.sinh(PI * (1 - 2 * ny))) / DEG2RAD;
    return [lon, lat];
  };
}

module.exports = { createProjector, createInverseProjector, mercator, equirectangular };
