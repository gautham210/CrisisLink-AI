// ============================================================
// geo.js — Kozhikode Spatial Intelligence Layer
// Expanded: 10 junctions, fixed coordinate mutation bug,
// comprehensive location map, OSRM graph edge definitions
// ============================================================

export const FALLBACK_COORD = [11.2588, 75.7804];

// Extended coordinate map for AI location parsing
export const COORDINATE_MAP = {
  'Medical College': [11.2733, 75.8350],
  'Medical College Junction': [11.2733, 75.8350],
  'Beach Road': [11.2588, 75.7804],
  'Kozhikode Beach': [11.2588, 75.7804],
  'Beach': [11.2588, 75.7804],
  'Mavoor Rd': [11.2680, 75.8118],
  'Mavoor Road': [11.2680, 75.8118],
  'Bypass': [11.2825, 75.8450],
  'Thondayad': [11.2628, 75.8152],
  'Malaparamba': [11.2840, 75.8085],
  'Eranhipalam': [11.2740, 75.7890],
  'Nadakkavu': [11.2585, 75.7780],
  'Palayam': [11.2480, 75.7800],
  'SM Street': [11.2510, 75.7810],
  'Mananchira': [11.2550, 75.7820],
  'Chevayur': [11.2920, 75.8230],
  'Feroke': [11.1790, 75.8410],
  'West Hill': [11.2870, 75.7650],
  'Kallai': [11.2270, 75.7930],
  'Aster MIMS': [11.2890, 75.7846],
  'IQRAA': [11.2269, 75.8023],
  'City Center': [11.2510, 75.7810],
  'Meenchanda': [11.2270, 75.7930],
  'East Hill': [11.2630, 75.8050],
};

export function getCoordinates(locationString) {
  if (!locationString) return FALLBACK_COORD;
  const foundKey = Object.keys(COORDINATE_MAP).find(key =>
    locationString.toLowerCase().includes(key.toLowerCase())
  );
  return foundKey ? COORDINATE_MAP[foundKey] : FALLBACK_COORD;
}

// ============================================================
// INFRASTRUCTURE NODES — no coordinate mutation (bug fix)
// Pre-computed precise locations for all facilities
// ============================================================
export const INFRASTRUCTURE_NODES = [
  // --- Hospitals ---
  { id: 'h1', name: 'Government Medical College', type: 'hospital', lat: 11.2733, lng: 75.8350 },
  { id: 'h2', name: 'Baby Memorial Hospital', type: 'hospital', lat: 11.2582, lng: 75.7808 },
  { id: 'h3', name: 'IQRAA International Hospital', type: 'hospital', lat: 11.2271, lng: 75.8025 },
  { id: 'h4', name: 'Aster MIMS Kozhikode', type: 'hospital', lat: 11.2892, lng: 75.7848 },
  { id: 'h5', name: 'National Hospital', type: 'hospital', lat: 11.2561, lng: 75.7811 },
  { id: 'h6', name: 'Fathima Hospital', type: 'hospital', lat: 11.2487, lng: 75.7797 },
  { id: 'h7', name: 'Comtrust Eye Hospital', type: 'hospital', lat: 11.2478, lng: 75.7818 },
  { id: 'h8', name: 'Koyili Hospital', type: 'hospital', lat: 11.2602, lng: 75.7753 },

  // --- Fire Stations ---
  { id: 'f1', name: 'Beach Fire Station', type: 'fire', lat: 11.2592, lng: 75.7810 },
  { id: 'f2', name: 'Meenchanda Fire Station', type: 'fire', lat: 11.2272, lng: 75.7932 },
  { id: 'f3', name: 'West Hill Fire Station', type: 'fire', lat: 11.2872, lng: 75.7652 },
  { id: 'f4', name: 'Feroke Fire Station', type: 'fire', lat: 11.1792, lng: 75.8412 },

  // --- Police Stations ---
  { id: 'p1', name: 'Nadakkavu Police Station', type: 'police', lat: 11.2587, lng: 75.7782 },
  { id: 'p2', name: 'Kozhikode Town Police', type: 'police', lat: 11.2482, lng: 75.7803 },
  { id: 'p3', name: 'Kasaba Police Station', type: 'police', lat: 11.2567, lng: 75.7827 },
  { id: 'p4', name: 'Medical College Police', type: 'police', lat: 11.2731, lng: 75.8356 },
];

// ============================================================
// TRAFFIC JUNCTIONS — 10 major intersections in Kozhikode
// ============================================================
export const TRAFFIC_JUNCTIONS = [
  { id: 'j1',  name: 'Thondayad Junction',     lat: 11.2628, lng: 75.8152 },
  { id: 'j2',  name: 'Malaparamba Junction',    lat: 11.2840, lng: 75.8085 },
  { id: 'j3',  name: 'Eranhipalam Junction',    lat: 11.2740, lng: 75.7890 },
  { id: 'j4',  name: 'Mavoor Road Junction',    lat: 11.2550, lng: 75.7865 },
  { id: 'j5',  name: 'Palayam Junction',        lat: 11.2510, lng: 75.7810 },
  { id: 'j6',  name: 'Nadakkavu Junction',      lat: 11.2585, lng: 75.7785 },
  { id: 'j7',  name: 'Kallai Junction',         lat: 11.2270, lng: 75.7935 },
  { id: 'j8',  name: 'East Hill Junction',      lat: 11.2630, lng: 75.8050 },
  { id: 'j9',  name: 'Chevayur Junction',       lat: 11.2920, lng: 75.8230 },
  { id: 'j10', name: 'Medical College Junction', lat: 11.2730, lng: 75.8350 },
];

// ============================================================
// TRAFFIC GRAPH EDGES — infra ↔ junction + junction ↔ junction
// Each edge = { from: [lat,lng], to: [lat,lng], label }
// Kept to ~22 edges to avoid OSRM rate limiting
// ============================================================
export const TRAFFIC_GRAPH_EDGES = [
  // === Junction ↔ Junction (main corridor backbone) ===
  { from: [11.2628, 75.8152], to: [11.2840, 75.8085], label: 'Thondayad–Malaparamba' },
  { from: [11.2840, 75.8085], to: [11.2920, 75.8230], label: 'Malaparamba–Chevayur' },
  { from: [11.2840, 75.8085], to: [11.2730, 75.8350], label: 'Malaparamba–MedCollege' },
  { from: [11.2628, 75.8152], to: [11.2730, 75.8350], label: 'Thondayad–MedCollege' },
  { from: [11.2628, 75.8152], to: [11.2630, 75.8050], label: 'Thondayad–EastHill' },
  { from: [11.2630, 75.8050], to: [11.2740, 75.7890], label: 'EastHill–Eranhipalam' },
  { from: [11.2740, 75.7890], to: [11.2585, 75.7785], label: 'Eranhipalam–Nadakkavu' },
  { from: [11.2585, 75.7785], to: [11.2510, 75.7810], label: 'Nadakkavu–Palayam' },
  { from: [11.2510, 75.7810], to: [11.2550, 75.7865], label: 'Palayam–MavourRd' },
  { from: [11.2550, 75.7865], to: [11.2270, 75.7935], label: 'MavuurRd–Kallai' },
  { from: [11.2550, 75.7865], to: [11.2628, 75.8152], label: 'MavuurRd–Thondayad' },

  // === Hospital ↔ Junction (major) ===
  { from: [11.2733, 75.8350], to: [11.2628, 75.8152], label: 'GovtMedical–Thondayad' },
  { from: [11.2892, 75.7848], to: [11.2840, 75.8085], label: 'AsterMIMS–Malaparamba' },
  { from: [11.2582, 75.7808], to: [11.2585, 75.7785], label: 'BabyMemorial–Nadakkavu' },
  { from: [11.2582, 75.7808], to: [11.2510, 75.7810], label: 'BabyMemorial–Palayam' },
  { from: [11.2271, 75.8025], to: [11.2270, 75.7935], label: 'IQRAA–Kallai' },

  // === Fire Station ↔ Junction ===
  { from: [11.2592, 75.7810], to: [11.2585, 75.7785], label: 'BeachFire–Nadakkavu' },
  { from: [11.2872, 75.7652], to: [11.2740, 75.7890], label: 'WestHillFire–Eranhipalam' },
  { from: [11.2272, 75.7932], to: [11.2270, 75.7935], label: 'MeenchandaFire–Kallai' },

  // === Police Station ↔ Junction ===
  { from: [11.2587, 75.7782], to: [11.2585, 75.7785], label: 'Nadakkavu Police–Junction' },
  { from: [11.2482, 75.7803], to: [11.2510, 75.7810], label: 'KozhikodeTown–Palayam' },

  // === Long-distance corridors ===
  { from: [11.1792, 75.8412], to: [11.2270, 75.7935], label: 'Feroke–Kallai Corridor' },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestInfrastructure(incidentTypeStr, destLat, destLng) {
  const typeStr = (incidentTypeStr || '').toLowerCase();
  let allowedTypes = ['hospital', 'police', 'fire'];
  if (typeStr.includes('fire') || typeStr.includes('explosion')) allowedTypes = ['fire'];
  else if (typeStr.includes('accident') || typeStr.includes('crash')) allowedTypes = ['hospital', 'police'];
  else if (typeStr.includes('medical') || typeStr.includes('health') || typeStr.includes('heart') || typeStr.includes('ambulance')) allowedTypes = ['hospital'];
  else if (typeStr.includes('crime') || typeStr.includes('assault') || typeStr.includes('robbery')) allowedTypes = ['police'];

  const candidates = INFRASTRUCTURE_NODES.filter(n => allowedTypes.includes(n.type));
  const pool = candidates.length > 0 ? candidates : INFRASTRUCTURE_NODES;

  let nearest = pool[0];
  let minDistance = Infinity;
  pool.forEach(node => {
    const dist = getHaversineDistance(node.lat, node.lng, destLat, destLng);
    if (dist < minDistance) { minDistance = dist; nearest = node; }
  });
  return { node: nearest, distanceKm: minDistance };
}

export function getResponderVisuals(incidentTypeStr) {
  const t = (incidentTypeStr || '').toLowerCase();
  if (t.includes('fire') || t.includes('explosion')) return { icon: '🚒', color: '#EA4335', label: 'Fire Engine' };
  if (t.includes('police') || t.includes('crime') || t.includes('assault')) return { icon: '🚓', color: '#4285F4', label: 'Police Unit' };
  return { icon: '🚑', color: '#34A853', label: 'Ambulance' };
}
