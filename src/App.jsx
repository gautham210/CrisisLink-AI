// ============================================================
// App.jsx — CrisisLink AI Root (v4 — Production Polish)
// Adds:
//   - feedEntries state with addFeedEntry(type, message)
//   - Simulation burst: 3 incidents in first 3s on start
//   - emergencyMode watcher → feed entry
//   - trafficMode change → feed entry
//   - All props threaded to children
// ============================================================

import { useState, useMemo, useCallback, useEffect, useRef, Component } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EmergencyChat from './components/EmergencyChat';
import MapVisualization from './components/MapVisualization';
import IncidentDetail from './components/IncidentDetail';
import AlertSimulation from './components/AlertSimulation';
import useIncidentSimulator, { buildSimulatedIncident } from './hooks/useIncidentSimulator';
import { makeFeedEntry } from './components/CommandFeed';

// ── Error Boundary ─────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '1.5rem',
          background: '#F8FAFC', fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ color: '#111827' }}>System Error</h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>
            CrisisLink AI encountered an error. Please refresh the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '0.6rem 1.5rem', background: '#4285F4', color: '#fff',
              border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Seed Incident ──────────────────────────────────────────────
const SEED_INCIDENT = {
  id: 'INC-101',
  type: 'Fire',
  location: 'Medical College Junction',
  description: 'Multi-story building fire — multiple persons trapped on upper floors. Black smoke visible from 2km radius.',
  severity: 'CRITICAL',
  actions: [
    'Dispatch Fire Engine (Ladder Unit)',
    'Deploy Ambulance for casualty management',
    'Activate emergency corridor on Mavoor Road',
    'Evacuate 300m exclusion zone',
    'Notify trauma center at Govt Medical College',
  ],
  responders: ['Fire Dept', 'Ambulance', 'Police'],
  route: 'Mavoor Rd → Thondayad → Medical College',
  explanation: 'Structural smoke sensors and 3 civilian reports cross-referenced. OSRM computed fastest corridor via Mavoor Road, bypassing bypass congestion.',
  confidence: '97.4%',
  eta: '4m',
  priority: 10,
  safetyTips: [
    'Evacuate all buildings within 300m immediately',
    'Do not use elevators during evacuation',
    'Keep roads clear for approaching fire engines',
    'Move to upwind direction if smoke is visible',
  ],
  dispatchOrigin: { name: 'Beach Fire Station', distance: '3.2 km', type: 'fire', lat: 11.2592, lng: 75.7810 },
  status: 'active',
  timestamp: new Date().toISOString(),
};

// ── Root App ───────────────────────────────────────────────────
export default function App() {
  const [currentView, setCurrentView]       = useState('map');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [trafficMode, setTrafficMode]       = useState('Medium');
  const [incidents, setIncidents]           = useState([SEED_INCIDENT]);
  const [alerts, setAlerts]                 = useState([]);
  const [isSimulating, setIsSimulating]     = useState(false);
  const [feedEntries, setFeedEntries]       = useState([]);

  // Ref so burst callbacks can read latest isSimulating without stale closure
  const isSimulatingRef = useRef(false);
  useEffect(() => { isSimulatingRef.current = isSimulating; }, [isSimulating]);

  // ── Emergency mode: any active CRITICAL/HIGH incident ─────────
  const emergencyMode = useMemo(
    () => incidents.some(i =>
      i.status === 'active' &&
      (i.severity?.toUpperCase() === 'CRITICAL' || i.severity?.toUpperCase() === 'HIGH')
    ),
    [incidents]
  );

  const activeIncidentCount = useMemo(
    () => incidents.filter(i => i.status === 'active').length,
    [incidents]
  );

  // ── Feed ──────────────────────────────────────────────────────
  /**
   * addFeedEntry — decoupled from specific triggers so any
   * sub-system (incidents, simulation, AI, traffic) can log.
   */
  const addFeedEntry = useCallback((type, message) => {
    setFeedEntries(prev => [makeFeedEntry(type, message), ...prev].slice(0, 50));
  }, []);

  // Watch emergencyMode → log to feed
  const prevEmergencyRef = useRef(false);
  useEffect(() => {
    if (emergencyMode && !prevEmergencyRef.current) {
      addFeedEntry('system', '🔴 Emergency mode activated — all corridors at maximum');
    } else if (!emergencyMode && prevEmergencyRef.current) {
      addFeedEntry('clear', 'Emergency mode released — returning to standby');
    }
    prevEmergencyRef.current = emergencyMode;
  }, [emergencyMode, addFeedEntry]);

  // ── Alerts ────────────────────────────────────────────────────
  const triggerAlert = useCallback((message) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 5000);
  }, []);

  // ── Incidents ─────────────────────────────────────────────────
  const addIncident = useCallback((newIncident) => {
    setIncidents(prev => [newIncident, ...prev]);
    triggerAlert(`🚨 Emergency confirmed — dispatching responders`);

    // Cascade multiple feed entries so the feed feels alive
    const typeMap = { Fire: 'fire', Medical: 'dispatch', Accident: 'reroute', Crime: 'police', Police: 'police' };
    const feedType = typeMap[newIncident.type] || 'dispatch';
    addFeedEntry(feedType, `${newIncident.type} reported at ${newIncident.location}`);

    setTimeout(() => addFeedEntry('signal', `Signal corridor activated — route cleared`), 600);
    setTimeout(() => addFeedEntry('hospital',
      `${newIncident.dispatchOrigin?.name || 'Nearest unit'} alerted — ETA ${newIncident.eta}`
    ), 1200);
    setTimeout(() => {
      triggerAlert(`🚦 Signal corridor activated — route cleared`);
      addFeedEntry('ai', `AI dispatch: ${newIncident.confidence || '—'} confidence · priority ${newIncident.priority}/10`);
    }, 1800);
  }, [triggerAlert, addFeedEntry]);

  const clearAllIncidents = useCallback(() => {
    setIncidents([]);
    setIsSimulating(false);
    addFeedEntry('clear', 'All incidents cleared — system reset to normal');
    triggerAlert('🗑️ All incidents cleared — system reset to normal');
  }, [triggerAlert, addFeedEntry]);

  // ── Traffic mode change ───────────────────────────────────────
  const handleTrafficChange = useCallback((mode) => {
    setTrafficMode(mode);
    addFeedEntry('traffic', `Traffic density changed → ${mode} mode`);
  }, [addFeedEntry]);

  // ── Simulation toggle (with burst) ────────────────────────────
  const handleSimulationToggle = useCallback(() => {
    setIsSimulating(prev => {
      const next = !prev;
      if (next) {
        // Feed + toast
        addFeedEntry('simulation', '⚡ Multi-incident simulation activated');
        triggerAlert('⚡ Simulation Started — Multi-Incident Scenario');

        // Burst: fire 3 incidents at 800 / 1800 / 3000 ms
        [800, 1800, 3000].forEach((delay, idx) => {
          setTimeout(() => {
            if (!isSimulatingRef.current) return;
            const inc = buildSimulatedIncident();
            // addIncident will push to state — but we need the latest addIncident
            // Use functional update to avoid stale ref issue
            setIncidents(p => [inc, ...p]);
            triggerAlert(`🔴 [SIM ${idx + 1}/3] ${inc.type} at ${inc.location}`);
            const typeMap = { Fire: 'fire', Medical: 'dispatch', Accident: 'reroute', Crime: 'police', Police: 'police' };
            addFeedEntry(typeMap[inc.type] || 'dispatch', `[SIM] ${inc.type} at ${inc.location}`);
            setTimeout(() => addFeedEntry('signal', `Signal override: ${inc.location} corridor`), 500);
          }, delay);
        });
      } else {
        addFeedEntry('system', 'Simulation stopped — returning to standby');
        triggerAlert('🛑 Simulation stopped');
      }
      return next;
    });
  }, [addFeedEntry, triggerAlert]);

  // ── Navigation ────────────────────────────────────────────────
  const navigateTo = useCallback((view, incidentId = null) => {
    setCurrentView(view);
    if (incidentId) setSelectedIncidentId(incidentId);
  }, []);

  // ── Simulator hook (normal cadence, post-burst) ───────────────
  useIncidentSimulator({
    isSimulating,
    incidents,
    onAddIncident: addIncident,
    onTriggerAlert: triggerAlert,
  });

  const isMapView = currentView === 'map';

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          emergencyMode={emergencyMode}
          isSimulating={isSimulating}
        />

        <main className="main-content">
          <Header
            navigateTo={navigateTo}
            emergencyMode={emergencyMode}
            activeIncidentCount={activeIncidentCount}
          />

          <div className={isMapView ? 'map-view-area' : 'view-area'}>
            {currentView === 'dashboard' && (
              <Dashboard
                incidents={incidents}
                navigateTo={navigateTo}
                trafficMode={trafficMode}
                setTrafficMode={handleTrafficChange}
                emergencyMode={emergencyMode}
                isSimulating={isSimulating}
                onSimulationToggle={handleSimulationToggle}
                onClearIncidents={clearAllIncidents}
                feedEntries={feedEntries}
              />
            )}

            {currentView === 'report' && (
              <EmergencyChat addIncident={addIncident} navigateTo={navigateTo} />
            )}

            {currentView === 'map' && (
              <MapVisualization
                incidents={incidents}
                trafficMode={trafficMode}
                emergencyMode={emergencyMode}
                onNavigate={navigateTo}
                feedEntries={feedEntries}
              />
            )}

            {currentView === 'incident' && (
              <IncidentDetail
                incident={incidents.find(i => i.id === selectedIncidentId)}
                navigateTo={navigateTo}
              />
            )}

            {currentView === 'incidentsList' && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700 }}>All Incidents</h2>
                    <p style={{ color: '#64748B', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                      {incidents.length} incident{incidents.length !== 1 ? 's' : ''} logged
                    </p>
                  </div>
                  {incidents.length > 0 && (
                    <button
                      onClick={clearAllIncidents}
                      style={{
                        padding: '0.5rem 1rem', background: '#FEE2E2', color: '#EA4335',
                        border: '1px solid #FCA5A5', borderRadius: '10px', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 600, fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      🗑️ Clear All
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {incidents.map(inc => {
                    const sev = inc.severity?.toUpperCase();
                    const sevColor = sev === 'CRITICAL' ? '#EA4335' : sev === 'HIGH' ? '#FBBC05' : '#34A853';
                    return (
                      <div
                        key={inc.id}
                        className="card card-hover"
                        onClick={() => navigateTo('incident', inc.id)}
                        style={{
                          cursor: 'pointer', padding: '1rem 1.25rem',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          border: `1px solid ${sev === 'CRITICAL' ? '#FEE2E2' : '#E2E8F0'}`,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                            <span style={{
                              padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem',
                              fontWeight: 700, background: `${sevColor}18`, color: sevColor,
                              border: `1px solid ${sevColor}40`
                            }}>{sev}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{inc.type}</span>
                            {inc.isSimulated && (
                              <span style={{ fontSize: '0.72rem', color: '#7C3AED', background: '#F3F0FF', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 600 }}>SIM</span>
                            )}
                            <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
                              {new Date(inc.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>📍 {inc.location}</p>
                        </div>
                        <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: '#4285F4' }}>
                          Details →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <AlertSimulation alerts={alerts} />
        </main>
      </div>
    </ErrorBoundary>
  );
}
