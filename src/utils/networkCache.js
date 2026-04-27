// ============================================================
// networkCache.js — Global Singleton Route Cache (v2)
// Tracks "ever loaded" separately from "this mount is loading"
// so the UX overlay shows exactly once per browser session.
// ============================================================

import { TRAFFIC_GRAPH_EDGES } from '../utils/geo';
import { buildTrafficNetwork } from './trafficNetwork';

// Module-level singleton — survives component unmount / remount
let _cachedRoutes = null;
let _fetchPromise = null;
let _hasEverLoaded = false;    // true once the first fetch completes

/**
 * Asynchronous getter. Returns routes from cache instantly if available,
 * otherwise starts (or joins an in-flight) OSRM fetch.
 */
export async function getNetworkRoutes(signal, onProgress) {
  if (_hasEverLoaded && _cachedRoutes) return _cachedRoutes;

  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = buildTrafficNetwork(TRAFFIC_GRAPH_EDGES, signal, onProgress)
    .then(routes => {
      _cachedRoutes = routes;
      _hasEverLoaded = true;
      _fetchPromise = null;
      return routes;
    })
    .catch(() => {
      _hasEverLoaded = true;
      _cachedRoutes = [];
      _fetchPromise = null;
      return [];
    });

  return _fetchPromise;
}

/** Synchronous — null until first fetch completes */
export function getCachedRoutes() {
  return _cachedRoutes;
}

/** True once the first OSRM fetch has fully settled (success or error) */
export function hasNetworkEverLoaded() {
  return _hasEverLoaded;
}

/** True if a fetch is currently in-flight */
export function isNetworkLoading() {
  return _fetchPromise !== null;
}
