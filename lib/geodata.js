'use strict';

const path = require('path');
const fs = require('fs');

let cachedData = null;

function loadGeoData() {
  if (cachedData) return cachedData;

  const filePath = path.join(__dirname, '..', 'data', 'world.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const geojson = JSON.parse(raw);

  const countries = geojson.features.map((feature, index) => {
    const props = feature.properties;
    const name = props.NAME || props.ADMIN || 'Unknown';
    const iso = props.ISO_A3 && props.ISO_A3 !== '-99' ? props.ISO_A3 : (props.ADM0_A3 || '???');
    const polygons = extractPolygons(feature.geometry);

    // Compute centroid from first polygon
    let centroid = [0, 0];
    if (polygons.length > 0 && polygons[0].length > 0) {
      const ring = polygons[0];
      let sumLon = 0, sumLat = 0;
      for (const [lon, lat] of ring) {
        sumLon += lon;
        sumLat += lat;
      }
      centroid = [sumLon / ring.length, sumLat / ring.length];
    }

    return { name, iso, index, polygons, centroid };
  });

  cachedData = countries;
  return countries;
}

function extractPolygons(geometry) {
  if (!geometry) return [];

  if (geometry.type === 'Polygon') {
    // Each polygon is an array of rings; we use the outer ring (index 0)
    return geometry.coordinates.map(ring => ring.map(([lon, lat]) => [lon, lat]));
  }

  if (geometry.type === 'MultiPolygon') {
    const result = [];
    for (const polygon of geometry.coordinates) {
      // Take outer ring of each sub-polygon
      result.push(polygon[0].map(([lon, lat]) => [lon, lat]));
    }
    return result;
  }

  return [];
}

module.exports = { loadGeoData };
