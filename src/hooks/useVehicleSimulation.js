// ============================================================
// useVehicleSimulation.js — Custom Hook (v3)
// Gradual vehicle spawn: vehicles fade in over 2–4s with
// per-vehicle random delay so traffic feels like it was
// always there — not injected all at once.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { interpolatePosition, getPathLength } from '../utils/trafficNetwork';
import { getHaversineDistance } from '../utils/geo';

const MAX_VEHICLES = 80;

const VEHICLES_PER_ROUTE = { Low: 2, Medium: 4, High: 6 };
const TOTAL_CAP          = { Low: 20, Medium: 50, High: 80 };
const BASE_SPEED = {
  civilian: { Low: 0.055, Medium: 0.035, High: 0.022 },
  emergency: 0.095,
};

// How long (ms) the full spawn-in wave takes
const SPAWN_WINDOW_MS = 3500;

function makeCivilianVehicle(uid, routeIndex, route, trafficMode, progressOffset, spawnDelayMs) {
  const coords = route.coords;
  if (!coords || coords.length < 2) return null;
  const pathLen = getPathLength(coords);
  const base = BASE_SPEED.civilian[trafficMode] || BASE_SPEED.civilian.Medium;
  const variance = 0.65 + Math.random() * 0.70;
  return {
    id: `civ-${uid}`,
    type: 'civilian',
    emoji: '🚗',
    routeIndex,
    progress: progressOffset,
    speed: (base * variance) / pathLen,
    pathLen,
    direction: Math.random() > 0.35 ? 1 : -1,
    isDead: false,
    // Fade-in fields
    opacity: 0,
    spawnAt: Date.now() + spawnDelayMs,   // when this vehicle should appear
    fadeDuration: 600 + Math.random() * 400, // 600–1000ms fade
  };
}

function makeEmergencyVehicle(uid, path, vehicleType) {
  if (!path || path.length < 2) return null;
  const pathLen = getPathLength(path);
  const emojiMap = { ambulance: '🚑', fire: '🚒', police: '🚓' };
  return {
    id: `emg-${uid}`,
    type: vehicleType,
    emoji: emojiMap[vehicleType] || '🚑',
    routeIndex: -1,
    emergencyPath: path,
    progress: 0,
    direction: 1,
    speed: BASE_SPEED.emergency / pathLen,
    pathLen,
    isDead: false,
    opacity: 1, // emergency vehicles appear instantly — no fade
    spawnAt: 0,
    fadeDuration: 300,
  };
}

function buildCivilianPool(networkRoutes, trafficMode, existingEmergency) {
  if (!networkRoutes?.length) return existingEmergency || [];

  const targetTotal = TOTAL_CAP[trafficMode] || TOTAL_CAP.Medium;
  const emgCount = existingEmergency?.length || 0;
  const civSlots = Math.min(targetTotal - emgCount, MAX_VEHICLES - emgCount);
  const perRoute = VEHICLES_PER_ROUTE[trafficMode] || VEHICLES_PER_ROUTE.Medium;

  const newCivs = [];
  let uid = 0;
  const now = Date.now();

  for (let ri = 0; ri < networkRoutes.length && newCivs.length < civSlots; ri++) {
    const route = networkRoutes[ri];
    const count = Math.min(perRoute, civSlots - newCivs.length);
    for (let j = 0; j < count; j++) {
      const baseOffset = j / count;
      const jitter = (Math.random() - 0.5) * (1 / count) * 0.8;
      const startProgress = Math.min(Math.max(baseOffset + jitter, 0), 0.98);

      // Stagger spawn across SPAWN_WINDOW_MS so vehicles fade in gradually
      const spawnDelay = Math.random() * SPAWN_WINDOW_MS;

      const v = makeCivilianVehicle(uid++, ri, route, trafficMode, startProgress, spawnDelay);
      if (v) newCivs.push(v);
    }
  }

  return [...(existingEmergency || []), ...newCivs];
}

export default function useVehicleSimulation({
  networkRoutes,
  trafficMode,
  emergencyMode,
  emergencyVehicles,
  greenJunctions,
}) {
  const [vehicles, setVehicles] = useState([]);
  const rafRef       = useRef(null);
  const lastTimeRef  = useRef(null);
  const poolRef      = useRef([]);

  // Rebuild civilian pool on route/mode change
  const rebuildPool = useCallback(() => {
    const existingEmg = poolRef.current.filter(v => v.type !== 'civilian');
    poolRef.current = buildCivilianPool(networkRoutes, trafficMode, existingEmg);
  }, [networkRoutes, trafficMode]);

  useEffect(() => { rebuildPool(); }, [rebuildPool]);

  // Sync emergency vehicles (instant opacity — no fade needed)
  useEffect(() => {
    if (!emergencyVehicles) return;
    const emgIds = new Set(emergencyVehicles.map(e => `emg-${e.id}`));
    const filtered = poolRef.current.filter(v => v.type === 'civilian' || emgIds.has(v.id));
    const existingEmgIds = new Set(filtered.filter(v => v.type !== 'civilian').map(v => v.id));
    const newEmg = emergencyVehicles
      .filter(e => !existingEmgIds.has(`emg-${e.id}`))
      .map(e => makeEmergencyVehicle(e.id, e.path, e.type))
      .filter(Boolean);
    poolRef.current = [...filtered, ...newEmg].slice(0, MAX_VEHICLES);
  }, [emergencyVehicles]);

  // RAF animation loop
  useEffect(() => {
    if (!networkRoutes?.length) return;

    const tick = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = timestamp;

      const now = Date.now();

      // Collect emergency vehicle positions for proximity dimming
      const emgPositions = poolRef.current
        .filter(v => v.type !== 'civilian' && v.emergencyPath)
        .map(v => interpolatePosition(v.emergencyPath, Math.max(0, Math.min(v.progress, 1))));

      poolRef.current = poolRef.current.map(vehicle => {
        // ── Fade-in logic ──────────────────────────────────
        let opacity = vehicle.opacity;
        if (vehicle.type === 'civilian') {
          if (now < vehicle.spawnAt) {
            // Not yet time to appear — skip position update too
            return vehicle;
          }
          if (opacity < 1) {
            const elapsed = now - vehicle.spawnAt;
            opacity = Math.min(elapsed / vehicle.fadeDuration, 1);
          }
        }

        // ── Movement ───────────────────────────────────────
        const path = vehicle.type === 'civilian'
          ? networkRoutes[vehicle.routeIndex]?.coords
          : vehicle.emergencyPath;

        if (!path || path.length < 2) return { ...vehicle, opacity };

        const curPos = interpolatePosition(path, vehicle.progress);
        let speedMod = 1.0;

        // Yield near green corridor junctions
        if (vehicle.type === 'civilian' && greenJunctions?.length > 0) {
          for (const junc of greenJunctions) {
            if (getHaversineDistance(curPos[0], curPos[1], junc.lat, junc.lng) < 0.35) {
              speedMod = 0.15;
              break;
            }
          }
        }

        // Emergency vehicle proximity: dim + slow civilians nearby
        if (vehicle.type === 'civilian' && emgPositions.length > 0) {
          for (const ep of emgPositions) {
            if (getHaversineDistance(curPos[0], curPos[1], ep[0], ep[1]) < 0.28) {
              speedMod = Math.min(speedMod, 0.25);
              opacity = Math.min(opacity, 0.35); // traffic yielding visual
              break;
            }
          }
        }

        // Emergency speed boost
        if (vehicle.type !== 'civilian' && emergencyMode) speedMod = 1.6;

        const step = vehicle.speed * dt * speedMod * vehicle.direction;
        let newProgress = vehicle.progress + step;

        // Seamless loops for civilians, clamp for emergency
        if (vehicle.type === 'civilian') {
          if (newProgress > 1.0) newProgress = 0.01;
          if (newProgress < 0.0) newProgress = 0.99;
        } else {
          newProgress = Math.min(newProgress, 1.0);
        }

        return { ...vehicle, progress: newProgress, opacity };
      });

      // Render only vehicles that have started appearing
      const rendered = poolRef.current
        .filter(v => !v.isDead && (v.type !== 'civilian' || Date.now() >= v.spawnAt))
        .map(v => {
          const path = v.type === 'civilian'
            ? networkRoutes[v.routeIndex]?.coords
            : v.emergencyPath;
          if (!path) return null;
          const [lat, lng] = interpolatePosition(path, Math.max(0, Math.min(v.progress, 1)));
          return { id: v.id, type: v.type, emoji: v.emoji, lat, lng, opacity: v.opacity };
        })
        .filter(Boolean);

      setVehicles(rendered);
      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [networkRoutes, emergencyMode, greenJunctions]);

  return { vehicles };
}
