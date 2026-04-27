// ============================================================
// trafficNetwork.js — OSRM Route Fetcher & Traffic Graph
// Fetches real road-following routes for the traffic network.
// Sequential fetching with delay to avoid OSRM rate limiting.
// ============================================================

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';
const FETCH_DELAY_MS = 180; // ms between requests to be polite to public OSRM

/**
 * Fetch a single OSRM route between two [lat,lng] points.
 * Returns an array of [lat,lng] coordinates on success, or null on failure.
 */
export async function fetchOSRMRoute(from, to, signal) {
  try {
    const url = `${OSRM_BASE}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
  } catch {
    // AbortError or network failure — return null silently
    return null;
  }
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build the traffic network from graph edges.
 * Returns an array of route coordinate arrays.
 * Caller provides an AbortSignal for cleanup.
 */
export async function buildTrafficNetwork(edges, signal, onProgress) {
  const routes = [];
  for (let i = 0; i < edges.length; i++) {
    if (signal?.aborted) break;
    const edge = edges[i];
    const coords = await fetchOSRMRoute(edge.from, edge.to, signal);
    if (coords && coords.length > 1) {
      routes.push({ coords, label: edge.label, from: edge.from, to: edge.to });
    } else {
      // Fallback: straight line between points (flagged so we can style differently)
      routes.push({
        coords: [edge.from, edge.to],
        label: edge.label,
        from: edge.from,
        to: edge.to,
        isFallback: true
      });
    }
    onProgress?.(i + 1, edges.length);
    if (i < edges.length - 1) await sleep(FETCH_DELAY_MS);
  }
  return routes;
}

/**
 * Fetch a single emergency route between two points.
 * Returns coordinate array or straight-line fallback.
 */
export async function fetchEmergencyRoute(from, to, signal) {
  const coords = await fetchOSRMRoute(from, to, signal);
  if (coords && coords.length > 1) return coords;
  // Straight-line fallback
  return [from, to];
}

/**
 * Given a path (array of [lat,lng]) and a progress value 0..1,
 * return the interpolated [lat,lng] position.
 */
export function interpolatePosition(path, progress) {
  if (!path || path.length === 0) return [0, 0];
  if (path.length === 1) return path[0];

  const clamped = Math.min(Math.max(progress, 0), 1);
  const totalSegments = path.length - 1;
  const exactIndex = clamped * totalSegments;
  const segIndex = Math.min(Math.floor(exactIndex), totalSegments - 1);
  const frac = exactIndex - segIndex;

  const a = path[segIndex];
  const b = path[segIndex + 1];
  return [
    a[0] + (b[0] - a[0]) * frac,
    a[1] + (b[1] - a[1]) * frac
  ];
}

/**
 * Calculate total path length in degrees (approximate, good enough for speed calculations)
 */
export function getPathLength(path) {
  if (!path || path.length < 2) return 1;
  let len = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const dlat = path[i + 1][0] - path[i][0];
    const dlng = path[i + 1][1] - path[i][1];
    len += Math.sqrt(dlat * dlat + dlng * dlng);
  }
  return len || 1;
}
