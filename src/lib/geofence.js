// Point-in-polygon (ray casting) for the FR-6.11 on-device geofence check.
// Runs entirely client-side against a cached warning-polygon set so it
// works offline — the whole point of a "guest safety net."

export function isPointInPolygon(lat, lon, polygon) {
  // polygon: array of {lat, lon}
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lon, yi = polygon[i].lat;
    const xj = polygon[j].lon, yj = polygon[j].lat;
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function findIntersectingWarnings(lat, lon, warnings) {
  return warnings.filter((w) => isPointInPolygon(lat, lon, w.coordinates));
}
