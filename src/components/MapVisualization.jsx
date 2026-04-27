// ============================================================
// MapVisualization.jsx — CrisisLink AI Command Map
// Complete rewrite: real OSRM network, moving vehicles,
// green wave system, emergency mode, bug fixes.
// ============================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getCoordinates, getResponderVisuals, getHaversineDistance,
  INFRASTRUCTURE_NODES, TRAFFIC_JUNCTIONS, FALLBACK_COORD,
  TRAFFIC_GRAPH_EDGES
} from '../utils/geo';
import { fetchEmergencyRoute } from '../utils/trafficNetwork';
import useTrafficNetwork from '../hooks/useTrafficNetwork';
import useVehicleSimulation from '../hooks/useVehicleSimulation';
import { Layers, Hospital, Flame, ShieldAlert, ChevronDown, ChevronRight, Activity, CarFront, Radio, Wifi } from 'lucide-react';
import CommandFeed from './CommandFeed';

// ============================================================
// Leaflet Icon Factories
// ============================================================

const createIncidentIcon = () => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="position:relative;">
    <div style="position:absolute;inset:-10px;background:#EA4335;opacity:0.25;border-radius:50%;animation:pulseRed 2s infinite;"></div>
    <div style="width:30px;height:30px;background:#fff;border:2.5px solid #EA4335;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative;z-index:2;box-shadow:0 2px 8px rgba(234,67,53,0.4);">
      <span style="display:block;width:12px;height:12px;border-radius:50%;background:#EA4335;"></span>
    </div>
  </div>`,
  iconSize: [30, 30], iconAnchor: [15, 15]
});

const createResponderIcon = (typeStr) => {
  const vis = getResponderVisuals(typeStr);
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="position:relative;">
      <div style="position:absolute;inset:-6px;background:${vis.color};opacity:0.2;border-radius:50%;animation:pulseBlue 1.5s infinite;"></div>
      <div style="width:36px;height:36px;background:#fff;border:2.5px solid ${vis.color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(0,0,0,0.25);position:relative;z-index:2;">
        ${vis.icon}
      </div>
    </div>`,
    iconSize: [36, 36], iconAnchor: [18, 18]
  });
};

const createInfraIcon = (type) => {
  const map = {
    hospital: { icon: '🏥', color: '#34A853', bg: '#F0FDF4' },
    fire:     { icon: '🚒', color: '#EA4335', bg: '#FEF2F2' },
    police:   { icon: '🚓', color: '#4285F4', bg: '#EFF6FF' },
  };
  const vis = map[type] || map.hospital;
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="width:26px;height:26px;background:${vis.bg};border:2px solid ${vis.color};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.15);">
      ${vis.icon}
    </div>`,
    iconSize: [26, 26], iconAnchor: [13, 13]
  });
};

const createJunctionIcon = (isGreen, trafficMode) => {
  const color = isGreen ? '#34A853' : (trafficMode === 'High' ? '#EA4335' : '#FBBC05');
  const ring = isGreen
    ? `<div style="position:absolute;inset:-10px;border:2.5px solid ${color};border-radius:50%;animation:junctionPulse 2s infinite;opacity:0.7;"></div>`
    : '';
  const label = isGreen
    ? `<div style="position:absolute;top:28px;white-space:nowrap;background:#fff;color:#34A853;font-weight:700;font-size:0.65rem;padding:2px 7px;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.15);border:1px solid #34A853;z-index:3;">CORRIDOR ACTIVE</div>`
    : '';
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
      ${ring}
      <div style="width:20px;height:20px;background:#fff;border:2.5px solid ${color};border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:2;display:flex;align-items:center;justify-content:center;font-size:9px;">
        ${isGreen ? '🟢' : (trafficMode === 'High' ? '🔴' : '🟡')}
      </div>
      ${label}
    </div>`,
    iconSize: [20, 20], iconAnchor: [10, 10]
  });
};

const createVehicleIcon = (vehicle) => {
  // Apply per-vehicle opacity for fade-in effect
  const alpha = (vehicle.opacity ?? 1).toFixed(3);
  if (vehicle.type === 'civilian') {
    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: `<div style="width:9px;height:9px;background:#64748B;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.25);opacity:${alpha};"></div>`,
      iconSize: [9, 9], iconAnchor: [4.5, 4.5]
    });
  }
  const colorMap = { ambulance: '#34A853', fire: '#EA4335', police: '#4285F4' };
  const color = colorMap[vehicle.type] || '#34A853';
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `<div style="position:relative;opacity:${alpha};">
      <div style="position:absolute;inset:-5px;background:${color};opacity:0.25;border-radius:50%;animation:vehicleGlow 1.5s infinite;"></div>
      <div style="width:22px;height:22px;background:#fff;border:2px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.25);position:relative;z-index:2;">
        ${vehicle.emoji}
      </div>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 11]
  });
};

// ============================================================
// Ripple icon — two staggered expanding rings for new incidents
// ============================================================
const createRippleIcon = () => L.divIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="position:relative;width:80px;height:80px;">
    <div style="position:absolute;inset:0;border-radius:50%;border:2px solid #EA4335;animation:rippleA 1.6s ease-out infinite;"></div>
    <div style="position:absolute;inset:0;border-radius:50%;border:2px solid #EA4335;animation:rippleB 1.6s ease-out 0.5s infinite;"></div>
  </div>`,
  iconSize: [80, 80],
  iconAnchor: [40, 40],
});

// ============================================================
// Map Camera Hook
// ============================================================
function MapCameraHandler({ flyTarget }) {
  const map = useMap();
  useEffect(() => {
    if (flyTarget) {
      map.flyTo([flyTarget.lat, flyTarget.lng], 16, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [flyTarget, map]);
  return null;
}

// ============================================================
// Main Component
// ============================================================
export default function MapVisualization({ incidents, trafficMode, emergencyMode, feedEntries = [] }) {
  // Memoize active incidents to prevent infinite useEffect loops (bug fix)
  const activeIncidents = useMemo(
    () => incidents.filter(i => i.status === 'active'),
    [incidents]
  );

  // UI state
  const [flyTarget, setFlyTarget] = useState(null);
  const [expandedSection, setExpandedSection] = useState('hospital');
  const [showInfra, setShowInfra] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);

  // Track new incidents for ripple animation (shown for 3s)
  const [rippleIds, setRippleIds] = useState(new Set());
  const prevIncidentCountRef = useRef(incidents.length);

  // Auto-fly to newest incident + start ripple
  useEffect(() => {
    if (incidents.length > prevIncidentCountRef.current && incidents[0]) {
      const newest = incidents[0];
      const dest = getCoordinates(newest.location);
      setFlyTarget({ lat: dest[0], lng: dest[1] });
      // Ripple for 3 seconds
      setRippleIds(prev => new Set([...prev, newest.id]));
      setTimeout(() => {
        setRippleIds(prev => { const s = new Set(prev); s.delete(newest.id); return s; });
      }, 3500);
    }
    prevIncidentCountRef.current = incidents.length;
  }, [incidents]);

  // Emergency route state { [incidentId]: { path, status } }
  const [emergencyRoutes, setEmergencyRoutes] = useState({});
  const routeFetchControllers = useRef({});

  // Traffic network from hook
  const { networkRoutes, isLoading: networkLoading, isFirstLoad, loadingPhase, progress } = useTrafficNetwork();

  // ============================================================
  // Fetch emergency routes when active incidents change (bug fixed)
  // ============================================================
  useEffect(() => {
    const incidentIds = new Set(activeIncidents.map(i => i.id));

    // Cancel routes for incidents that are no longer active
    Object.keys(routeFetchControllers.current).forEach(id => {
      if (!incidentIds.has(id)) {
        routeFetchControllers.current[id]?.abort();
        delete routeFetchControllers.current[id];
      }
    });

    // Fetch routes for new active incidents
    const fetchRoutes = async () => {
      for (const incident of activeIncidents) {
        if (emergencyRoutes[incident.id]) continue; // already fetched

        const controller = new AbortController();
        routeFetchControllers.current[incident.id] = controller;

        const dest = getCoordinates(incident.location);
        const origin = incident.dispatchOrigin
          ? [incident.dispatchOrigin.lat, incident.dispatchOrigin.lng]
          : [dest[0] - 0.02, dest[1] - 0.01];

        setEmergencyRoutes(prev => ({
          ...prev,
          [incident.id]: { status: 'loading', path: [], origin, dest }
        }));

        try {
          const path = await fetchEmergencyRoute(origin, dest, controller.signal);
          setEmergencyRoutes(prev => ({
            ...prev,
            [incident.id]: { status: 'ready', path, origin, dest }
          }));
        } catch {
          // aborted or failed — use straight line
          setEmergencyRoutes(prev => ({
            ...prev,
            [incident.id]: { status: 'ready', path: [origin, dest], origin, dest }
          }));
        }
      }
    };

    fetchRoutes();

    return () => {
      // Cleanup all pending route fetches on unmount
      Object.values(routeFetchControllers.current).forEach(c => c?.abort());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIncidents]);

  // ============================================================
  // Green Junction Detection
  // ============================================================
  const greenJunctions = useMemo(() => {
    const greens = [];
    TRAFFIC_JUNCTIONS.forEach(j => {
      for (const route of Object.values(emergencyRoutes)) {
        if (!route.path?.length) continue;
        for (const p of route.path) {
          if (getHaversineDistance(p[0], p[1], j.lat, j.lng) < 1.0) {
            greens.push(j);
            break;
          }
        }
      }
    });
    return greens;
  }, [emergencyRoutes]);

  const greenJunctionIds = useMemo(
    () => new Set(greenJunctions.map(j => j.id)),
    [greenJunctions]
  );

  // ============================================================
  // Emergency Vehicles for simulation hook
  // ============================================================
  const emergencyVehiclesForSim = useMemo(() => {
    return activeIncidents
      .filter(i => emergencyRoutes[i.id]?.status === 'ready')
      .map(i => {
        const vis = getResponderVisuals(i.type);
        const typeMap = { '🚑': 'ambulance', '🚒': 'fire', '🚓': 'police' };
        return {
          id: i.id,
          path: emergencyRoutes[i.id].path,
          type: typeMap[vis.icon] || 'ambulance',
        };
      });
  }, [activeIncidents, emergencyRoutes]);

  // Vehicle simulation hook
  const { vehicles } = useVehicleSimulation({
    networkRoutes,
    trafficMode,
    emergencyMode,
    emergencyVehicles: emergencyVehiclesForSim,
    greenJunctions,
  });

  // Stable icon factory (no re-instantiation on every render)
  const getVehicleIcon = useCallback((vehicle) => createVehicleIcon(vehicle), []);

  // ============================================================
  // Computed stats
  // ============================================================
  const activeGreenCount = greenJunctions.length;
  const vehicleCount = vehicles.length;

  // Map tile filter — brighter base, dim only in emergency
  const tileFilter = emergencyMode
    ? 'brightness(60%) saturate(85%) sepia(15%) hue-rotate(185deg)'
    : 'brightness(100%) saturate(95%) sepia(3%) hue-rotate(185deg)';

  return (
    <div
      className={`map-visualization-root animate-fade-in ${emergencyMode ? 'emergency-mode-active' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}
    >
      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        border: emergencyMode ? '2px solid #EA4335' : 'none',
        borderRadius: 0,
        boxShadow: emergencyMode ? '0 0 40px rgba(234,67,53,0.3) inset' : 'none'
      }}>

        {/* ── Map ── */}
        <MapContainer
          center={FALLBACK_COORD}
          zoom={13}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          zoomControl={false}
        >
          <MapCameraHandler flyTarget={flyTarget} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
            style={{ filter: tileFilter }}
            className="map-tile-layer"
          />

          {/* ── Road Network (OSRM traffic routes) ── */}
          {showTraffic && networkRoutes.map((route, idx) => (
            <Polyline
              key={`net-${idx}`}
              positions={route.coords}
              pathOptions={{
                color: route.isFallback ? '#CBD5E1' : '#64748B',
                weight: route.isFallback ? 1.5 : 2.5,
                opacity: emergencyMode ? 0.45 : 0.70,
                smoothFactor: 0.8,
                dashArray: route.isFallback ? '5,7' : null,
                lineCap: 'round',
              }}
            />
          ))}

          {/* ── Emergency Routes (glowing green) ── */}
          {activeIncidents.map(incident => {
            const route = emergencyRoutes[incident.id];
            if (!route || route.status !== 'ready' || !route.path.length) return null;
            return (
              <LayerGroup key={`emg-route-${incident.id}`}>
                {/* Glow underlay */}
                <Polyline
                  positions={route.path}
                  pathOptions={{
                    color: '#34A853',
                    weight: 14,
                    opacity: emergencyMode ? 0.3 : 0.15,
                    smoothFactor: 0.5,
                    lineCap: 'round',
                  }}
                />
                {/* Main route line */}
                <Polyline
                  positions={route.path}
                  pathOptions={{
                    color: '#34A853',
                    weight: 5,
                    opacity: 1,
                    smoothFactor: 0.5,
                    lineCap: 'round',
                    dashArray: '12, 6',
                  }}
                  className="emergency-route-line"
                />
              </LayerGroup>
            );
          })}

          {/* ── Infrastructure Markers ── */}
          {showInfra && INFRASTRUCTURE_NODES.map(node => (
            <Marker key={node.id} position={[node.lat, node.lng]} icon={createInfraIcon(node.type)}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', padding: '0.25rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{node.name}</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>{node.type}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Traffic Junctions ── */}
          {TRAFFIC_JUNCTIONS.map(junction => {
            const isGreen = greenJunctionIds.has(junction.id);
            return (
              <Marker
                key={junction.id}
                position={[junction.lat, junction.lng]}
                icon={createJunctionIcon(isGreen, trafficMode)}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif' }}>
                    <strong>{junction.name}</strong>
                    {isGreen && <div style={{ color: '#34A853', fontWeight: 600, fontSize: '0.8rem', marginTop: '0.25rem' }}>🟢 Corridor Active — Cleared</div>}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* ── Vehicle Markers ── */}
          {showVehicles && vehicles.map(vehicle => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={getVehicleIcon(vehicle)}
              zIndexOffset={vehicle.type === 'civilian' ? 0 : 100}
            >
              {vehicle.type !== 'civilian' && (
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif' }}>
                    <strong>{vehicle.emoji} Emergency Unit</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>En Route — Priority Override</div>
                  </div>
                </Popup>
              )}
            </Marker>
          ))}

          {/* ── Incident Destination Markers ── */}
          {activeIncidents.map(incident => {
            const destCoord = getCoordinates(incident.location);
            return (
              <Marker key={`dest-${incident.id}`} position={destCoord} icon={createIncidentIcon()}>
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif' }}>
                    <strong style={{ color: '#EA4335' }}>{incident.type}</strong>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{incident.location}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>ETA: {incident.eta}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* ── Emergency Responder Position Markers ── */}
          {activeIncidents.map(incident => {
            const route = emergencyRoutes[incident.id];
            if (!route || route.status !== 'ready') return null;
            return (
              <Marker
                key={`resp-${incident.id}`}
                // Show at dispatch origin initially (vehicle sim handles moving)
                position={route.origin}
                icon={createResponderIcon(incident.type)}
                zIndexOffset={200}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif' }}>
                    <strong>{getResponderVisuals(incident.type).label}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Dispatched — ETA {incident.eta}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          {/* ── Skeleton placeholder lines (inside MapContainer) ──
              Straight-line stand-ins span the city while OSRM routes load.
              Visible only on first-ever load, at very low opacity so the
              map still looks alive. networkRoutes will fade them out as
              real routes arrive. */}
          {networkLoading && isFirstLoad && TRAFFIC_GRAPH_EDGES.map((edge, idx) => (
            <Polyline
              key={`skel-${idx}`}
              positions={[edge.from, edge.to]}
              pathOptions={{
                color: '#94A3B8',
                weight: 1.5,
                opacity: 0.22,
                dashArray: '4, 6',
                smoothFactor: 2,
              }}
            />
          ))}
          {/* ── Ripple markers for newly created incidents ── */}
          {activeIncidents
            .filter(i => rippleIds.has(i.id))
            .map(incident => {
              const pos = getCoordinates(incident.location);
              return (
                <Marker
                  key={`ripple-${incident.id}`}
                  position={pos}
                  icon={createRippleIcon()}
                  zIndexOffset={-1}
                />
              );
            })
          }
        </MapContainer>

        {/* ── Vignette overlay rendered after map so it overlays tiles ── */}
        {emergencyMode && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 38%, rgba(234,67,53,0.10) 100%)',
            boxShadow: 'inset 0 0 100px rgba(234,67,53,0.12)',
          }} />
        )}

        {/* ── Corner loading chip — only on very first app load ── */}
        {networkLoading && isFirstLoad && (
          <div style={{
            position: 'absolute', bottom: '1.25rem', right: '1.25rem', zIndex: 400,
            background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)',
            border: '1px solid #E2E8F0', borderRadius: '12px',
            padding: '0.625rem 1rem',
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            fontFamily: 'Inter, sans-serif',
            animation: 'fadeIn 0.4s ease',
          }}>
            {/* Tiny spinner */}
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%',
              border: '2px solid #E2E8F0', borderTop: '2px solid #4285F4',
              animation: 'spin 0.8s linear infinite', flexShrink: 0
            }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827', lineHeight: 1.2 }}>
                Initializing city traffic system
              </div>
              {progress.total > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <div style={{ width: '100px', height: '3px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', background: '#4285F4', borderRadius: '2px',
                      width: `${(progress.done / progress.total) * 100}%`,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                    {progress.done}/{progress.total}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Top HUD Strip ── */}
        <div style={{
          position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          width: 'max-content', pointerEvents: 'auto'
        }}>
        {/* ── Emergency Banner (upgraded text) ── */}
          {emergencyMode && (
            <div style={{
              background: 'linear-gradient(90deg, #EA4335, #C62828)',
              color: '#fff',
              padding: '0.5rem 1.5rem', borderRadius: '9999px',
              fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(234,67,53,0.45)',
              animation: 'emergencyBanner 2s ease-in-out infinite alternate',
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'dot-blink 1s infinite' }} />
              🚨 LIVE INCIDENT RESPONSE — SYSTEM OVERRIDE ACTIVE
            </div>
          )}

          {/* Status Strip */}
          <div style={{
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            border: '1px solid #E2E8F0', borderRadius: '9999px',
            padding: '0.6rem 1.25rem', display: 'flex', gap: '1.25rem',
            alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '0.85rem', fontWeight: 500, fontFamily: 'Inter, sans-serif'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: activeIncidents.length > 0 ? '#EA4335' : '#374151' }}>
              <Activity size={15} />
              {activeIncidents.length} Active
            </div>
            <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: activeGreenCount > 0 ? '#34A853' : '#374151' }}>
              <Radio size={15} />
              {activeGreenCount} Green Corridors
            </div>
            <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#374151' }}>
              <CarFront size={15} />
              {vehicleCount} Vehicles
            </div>
            <div style={{ width: '1px', height: '16px', background: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: trafficMode === 'High' ? '#EA4335' : trafficMode === 'Medium' ? '#FBBC05' : '#34A853' }}>
              <Wifi size={15} />
              {trafficMode} Traffic
            </div>
          </div>

          {/* Layer Toggle Strip */}
          <div style={{
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            border: '1px solid #E2E8F0', borderRadius: '9999px',
            padding: '0.4rem 1rem', display: 'flex', gap: '1rem',
            alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            fontSize: '0.8rem', color: '#374151', fontFamily: 'Inter, sans-serif'
          }}>
            {[
              { key: 'infra', label: 'Infrastructure', state: showInfra, setter: setShowInfra },
              { key: 'traffic', label: 'Traffic Routes', state: showTraffic, setter: setShowTraffic },
              { key: 'vehicles', label: 'Vehicles', state: showVehicles, setter: setShowVehicles },
            ].map(({ key, label, state, setter }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={state}
                  onChange={e => setter(e.target.checked)}
                  style={{ accentColor: '#4285F4', cursor: 'pointer' }}
                />
                {label}
              </label>
            ))}
            <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '0.75rem', display: 'flex', gap: '0.75rem' }}>
              <LegendItem color="#94A3B8" label="Traffic" />
              <LegendItem color="#34A853" label="Emergency" />
              <LegendItem color="#4285F4" dash label="Infrastructure" />
            </div>
          </div>
        </div>

        {/* ── Left Sidebar: Infrastructure Panel ── */}
        <div style={{
          position: 'absolute', top: '1rem', left: '1rem', zIndex: 100,
          width: '290px', maxHeight: 'calc(100% - 2rem)',
          background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
          borderRadius: '16px', border: '1px solid #E2E8F0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="#4285F4" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Inter, sans-serif' }}>City Infrastructure</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {[
              { key: 'hospital', label: 'Hospitals', Icon: Hospital, color: '#34A853' },
              { key: 'fire', label: 'Fire Stations', Icon: Flame, color: '#EA4335' },
              { key: 'police', label: 'Police', Icon: ShieldAlert, color: '#4285F4' },
            ].map(({ key, label, Icon, color }) => (
              <div key={key} style={{ marginBottom: '0.5rem' }}>
                <button
                  onClick={() => setExpandedSection(s => s === key ? null : key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.6rem 0.75rem', background: expandedSection === key ? '#F8FAFC' : 'transparent',
                    border: '1px solid', borderColor: expandedSection === key ? '#E2E8F0' : 'transparent',
                    borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                    fontFamily: 'Inter, sans-serif', color: '#374151', transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon size={15} color={color} />
                    {label}
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 400 }}>
                      ({INFRASTRUCTURE_NODES.filter(n => n.type === key).length})
                    </span>
                  </div>
                  {expandedSection === key ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {expandedSection === key && (
                  <div style={{ paddingLeft: '0.5rem', paddingTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {INFRASTRUCTURE_NODES.filter(n => n.type === key).map(node => (
                      <button
                        key={node.id}
                        onClick={() => setFlyTarget({ lat: node.lat, lng: node.lng })}
                        style={{
                          textAlign: 'left', padding: '0.45rem 0.75rem', fontSize: '0.82rem',
                          color: '#64748B', background: 'transparent', border: 'none', borderRadius: '8px',
                          cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={e => { e.target.style.background = '#F1F5F9'; e.target.style.color = '#374151'; }}
                        onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#64748B'; }}
                      >
                        {node.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── CommandFeed overlay (bottom-left of map) ── */}
        <div style={{
          position: 'absolute', bottom: '1.25rem', left: '1.25rem', zIndex: 300,
          pointerEvents: 'auto',
        }}>
          <CommandFeed entries={feedEntries} mode="full" soundEnabled />
        </div>

      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        .map-tile-layer { filter: ${tileFilter}; }
        @keyframes pulseRed { 0%,100%{transform:scale(1);opacity:0.3;} 50%{transform:scale(1.8);opacity:0;} }
        @keyframes pulseBlue { 0%,100%{transform:scale(1);opacity:0.25;} 50%{transform:scale(1.7);opacity:0;} }
        @keyframes junctionPulse { 0%,100%{transform:scale(1);opacity:0.8;} 50%{transform:scale(1.4);opacity:0.2;} }
        @keyframes vehicleGlow { 0%,100%{opacity:0.3;transform:scale(1);} 50%{opacity:0.0;transform:scale(1.8);} }
        @keyframes emergencyBanner { 0%{opacity:0.88;} 100%{opacity:1;} }
        @keyframes dot-blink { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes rippleA {
          0%   { transform:scale(0.4); opacity:0.9; }
          100% { transform:scale(2.2); opacity:0; }
        }
        @keyframes rippleB {
          0%   { transform:scale(0.4); opacity:0.7; }
          100% { transform:scale(2.8); opacity:0; }
        }
        .emergency-route-line {
          animation: routeGlow 2s ease-in-out infinite alternate;
          filter: drop-shadow(0 0 8px rgba(52,168,83,0.9));
        }
        @keyframes routeGlow {
          0% { filter: drop-shadow(0 0 5px rgba(52,168,83,0.6)); }
          100% { filter: drop-shadow(0 0 20px rgba(52,168,83,1)); }
        }
        .leaflet-popup-content-wrapper {
          background: #fff; color: #111827; border-radius: 12px;
          border: 1px solid #E2E8F0; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          font-family: 'Inter', sans-serif;
        }
        .leaflet-popup-tip { background: #fff; }
        .custom-leaflet-icon { background: transparent; border: none; }
        .map-visualization-root .leaflet-control-attribution { display: none; }
      `}</style>
    </div>
  );
}

// Small legend item component
function LegendItem({ color, label, dash }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#64748B' }}>
      <div style={{
        width: '14px', height: '3px', background: color, borderRadius: '2px',
        backgroundImage: dash ? `repeating-linear-gradient(90deg, ${color} 0, ${color} 4px, transparent 4px, transparent 8px)` : 'none'
      }} />
      {label}
    </span>
  );
}
