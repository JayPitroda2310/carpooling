// Lightweight geocoding + routing + route-corridor matching.
// - geocode: free-text → coordinates (Photon / OpenStreetMap, biased to Vadodara)
// - routeBetween: shortest driving route polyline (OSRM public server)
// - corridorMatch: is a pickup→drop pair within a route's 500m corridor, in order?

export interface LatLng {
  lat: number;
  lng: number;
}

/** [lng, lat] pairs — matches OSRM/GeoJSON ordering. */
export type Polyline = [number, number][];

const BIAS = { lat: 22.3072, lon: 73.1812 }; // Vadodara

/** Free text → best matching coordinate in India (null if not found). */
export async function geocode(query: string): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  const url =
    `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}` +
    `&lat=${BIAS.lat}&lon=${BIAS.lon}&bbox=68,6,98,38&limit=1&lang=en`;
  const res = await fetch(url);
  const data = await res.json();
  const f = data.features?.[0];
  if (!f?.geometry?.coordinates) return null;
  const [lng, lat] = f.geometry.coordinates;
  return { lat, lng };
}

/** Shortest driving route between two points as a [lng,lat] polyline (null on failure). */
export async function routeBetween(a: LatLng, b: LatLng): Promise<Polyline | null> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  const coords = data.routes?.[0]?.geometry?.coordinates;
  return Array.isArray(coords) && coords.length > 1 ? (coords as Polyline) : null;
}

const DEG = Math.PI / 180;

/** Project lng/lat to local meters (equirectangular — fine at city scale). */
function toXY(lng: number, lat: number, lat0: number): [number, number] {
  return [lng * 111320 * Math.cos(lat0 * DEG), lat * 111320];
}

/** Distance (m) from a projected point to a segment, plus the projection's t (0–1). */
function projectToSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): { dist: number; t: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return { dist: Math.hypot(p[0] - a[0], p[1] - a[1]), t: 0 };
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  const cx = a[0] + t * dx;
  const cy = a[1] + t * dy;
  return { dist: Math.hypot(p[0] - cx, p[1] - cy), t };
}

/** Nearest distance (m) from a point to the route, and how far along the route that is (m). */
function nearestOnRoute(point: LatLng, route: Polyline, lat0: number) {
  const p = toXY(point.lng, point.lat, lat0);
  let best = { dist: Infinity, along: 0 };
  let cumulative = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = toXY(route[i][0], route[i][1], lat0);
    const b = toXY(route[i + 1][0], route[i + 1][1], lat0);
    const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const { dist, t } = projectToSegment(p, a, b);
    if (dist < best.dist) best = { dist, along: cumulative + t * segLen };
    cumulative += segLen;
  }
  return best;
}

export interface CorridorResult {
  onRoute: boolean;
  pickupDist: number; // metres pickup is off the route
  dropDist: number; // metres drop is off the route
}

/**
 * True when both pickup and drop lie within `halfWidth` metres of the route
 * AND pickup comes before drop along the route. Default 500m to each side.
 */
export function corridorMatch(
  pickup: LatLng,
  drop: LatLng,
  route: Polyline,
  halfWidth = 500
): CorridorResult {
  if (!route || route.length < 2) {
    return { onRoute: false, pickupDist: Infinity, dropDist: Infinity };
  }
  const lat0 = route[Math.floor(route.length / 2)][1];
  const pu = nearestOnRoute(pickup, route, lat0);
  const dr = nearestOnRoute(drop, route, lat0);
  const onRoute = pu.dist <= halfWidth && dr.dist <= halfWidth && pu.along < dr.along;
  return { onRoute, pickupDist: Math.round(pu.dist), dropDist: Math.round(dr.dist) };
}
