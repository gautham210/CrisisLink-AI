// ============================================================
// useIncidentSimulator.js — Auto Incident Generator
// Spawns realistic incidents across Kozhikode automatically.
// Max 4 concurrent active incidents. ~18–35s interval.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { COORDINATE_MAP, getCoordinates, getNearestInfrastructure } from '../utils/geo';

const INCIDENT_TEMPLATES = [
  {
    type: 'Fire',
    severities: ['HIGH', 'CRITICAL'],
    descriptions: [
      'Commercial building fire — smoke visible from multiple streets.',
      'Residential structure fire, persons may be trapped inside.',
      'Vehicle fire on main road, risk of fuel tank ignition.',
    ],
    actions: [
      'Dispatch Fire Engine (Ladder Unit)',
      'Deploy Ambulance for injury triage',
      'Establish 200m exclusion zone',
      'Notify nearest hospital of potential casualties',
    ],
    responders: ['Fire Dept', 'Ambulance'],
    safetyTips: ['Evacuate immediately via nearest exit', 'Do not re-enter building', 'Stay upwind of smoke'],
  },
  {
    type: 'Accident',
    severities: ['MEDIUM', 'HIGH', 'CRITICAL'],
    descriptions: [
      'Multi-vehicle collision blocking both lanes, injuries reported.',
      'Truck vs auto-rickshaw collision — one person unconscious.',
      'Chain accident involving 4 vehicles, fuel leakage detected.',
    ],
    actions: [
      'Dispatch Ambulance with ALS crew',
      'Deploy Traffic Police for road clearance',
      'Alert trauma center for incoming casualties',
      'Activate alternate traffic diversion route',
    ],
    responders: ['Ambulance', 'Police'],
    safetyTips: ['Do not move injured persons', 'Keep emergency lane clear', 'Turn hazard lights on'],
  },
  {
    type: 'Medical',
    severities: ['HIGH', 'CRITICAL'],
    descriptions: [
      'Cardiac arrest reported — victim unresponsive, bystander CPR active.',
      'Multiple casualties at public event — suspected mass poisoning.',
      'Severe allergic reaction, patient in anaphylactic shock.',
    ],
    actions: [
      'Dispatch Ambulance with ALS crew immediately',
      'Alert ER at nearest hospital',
      'Dispatch Police for crowd control',
      'Prepare trauma bay at receiving hospital',
    ],
    responders: ['Ambulance'],
    safetyTips: ['Keep victim calm and still', 'Do not give food or water', 'Maintain clear airway'],
  },
  {
    type: 'Police',
    severities: ['MEDIUM', 'HIGH'],
    descriptions: [
      'Armed robbery in progress at commercial establishment.',
      'Large public disturbance — crowd growing at intersection.',
      'Stolen vehicle pursuit heading toward city center.',
    ],
    actions: [
      'Dispatch Rapid Response Unit',
      'Seal off surrounding 3-block perimeter',
      'Alert neighboring stations for backup',
      'Coordinate with traffic control for clearance',
    ],
    responders: ['Police'],
    safetyTips: ['Stay indoors', 'Do not approach suspects', 'Call 100 with any information'],
  },
];

// Filter to more recognizable Kozhikode zones
const SIM_LOCATIONS = [
  'Medical College', 'Beach Road', 'Mavoor Road', 'Thondayad',
  'Nadakkavu', 'Palayam', 'Kallai', 'Eranhipalam', 'Chevayur',
  'Malaparamba', 'East Hill', 'West Hill'
];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function buildSimulatedIncident() {
  const template = pickRandom(INCIDENT_TEMPLATES);
  const location = pickRandom(SIM_LOCATIONS);
  const severity = pickRandom(template.severities);
  const description = pickRandom(template.descriptions);
  const etaMinutes = Math.floor(Math.random() * 8) + 3;
  const priority = severity === 'CRITICAL' ? 10 : severity === 'HIGH' ? 8 : 6;
  const confidence = (85 + Math.random() * 13).toFixed(1) + '%';

  const coords = getCoordinates(location);
  const nearest = getNearestInfrastructure(template.type, coords[0], coords[1]);

  return {
    id: `SIM-${Date.now().toString(36).toUpperCase()}`,
    type: template.type,
    location,
    severity,
    description,
    actions: template.actions,
    responders: template.responders,
    safetyTips: template.safetyTips,
    route: 'Dynamic Fast-Path (OSRM)',
    explanation: `Simulation engine: ${template.type} incident auto-detected at ${location}. OSRM computed optimal corridor route.`,
    confidence,
    eta: `${etaMinutes}m`,
    priority,
    status: 'active',
    isSimulated: true,
    timestamp: new Date().toISOString(),
    dispatchOrigin: {
      name: nearest.node.name,
      distance: `${nearest.distanceKm.toFixed(1)} km`,
      type: nearest.node.type,
      lat: nearest.node.lat,
      lng: nearest.node.lng,
    },
  };
}

const MAX_SIM_CONCURRENT = 4;
const MIN_DELAY_MS = 18000;
const MAX_DELAY_MS = 35000;

export default function useIncidentSimulator({
  isSimulating,
  incidents,
  onAddIncident,
  onTriggerAlert,
}) {
  const timerRef = useRef(null);
  const isSimulatingRef = useRef(isSimulating);
  const incidentsRef = useRef(incidents);

  // Keep refs in sync without recreating the timer
  useEffect(() => { isSimulatingRef.current = isSimulating; }, [isSimulating]);
  useEffect(() => { incidentsRef.current = incidents; }, [incidents]);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);

    timerRef.current = setTimeout(() => {
      if (!isSimulatingRef.current) return;

      const activeSim = incidentsRef.current.filter(
        i => i.isSimulated && i.status === 'active'
      ).length;

      if (activeSim < MAX_SIM_CONCURRENT) {
        const incident = buildSimulatedIncident();
        onAddIncident(incident);
        onTriggerAlert(
          `🔴 [SIMULATION] ${incident.type} at ${incident.location} — Severity: ${incident.severity}`
        );
      }

      scheduleNext(); // chain next
    }, delay);
  }, [onAddIncident, onTriggerAlert]);

  useEffect(() => {
    if (isSimulating) {
      // Burst is handled in App.jsx — simulator starts normal cadence immediately
      scheduleNext();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [isSimulating, scheduleNext]);
}
