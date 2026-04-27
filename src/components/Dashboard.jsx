// ============================================================
// Dashboard.jsx — CrisisLink AI Command Overview (v3)
// Added: Simulation Mode toggle, Clear All button,
// SIM badge on simulated incidents, improved layout
// ============================================================

import { Activity, ShieldAlert, Users, Plus, Navigation, Cpu, Wifi, CheckCircle2, AlertTriangle, Play, Square, Trash2, Zap } from 'lucide-react';
import CommandFeed from './CommandFeed';

function MetricCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}`, padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '2.2rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.5rem' }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({
  incidents, navigateTo, trafficMode, setTrafficMode,
  emergencyMode, isSimulating, onSimulationToggle, onClearIncidents, feedEntries = []
}) {
  const activeIncidents = incidents.filter(i => i.status === 'active');
  const criticalCount = incidents.filter(i => i.severity?.toUpperCase() === 'CRITICAL').length;
  const simCount = incidents.filter(i => i.isSimulated && i.status === 'active').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Emergency Banner ── */}
      {emergencyMode && (
        <div style={{
          background: 'linear-gradient(135deg, #EA4335, #C62828)',
          borderRadius: '14px', padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          boxShadow: '0 4px 20px rgba(234,67,53,0.3)'
        }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={19} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: '0.1rem' }}>
              🔴 Emergency Mode Active
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
              {criticalCount} critical incident{criticalCount !== 1 ? 's' : ''} — Signal corridors overridden, responders en route
            </div>
          </div>
          <div style={{ padding: '0.3rem 0.9rem', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', color: '#fff', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            LIVE
          </div>
        </div>
      )}

      {/* ── Simulation Active Banner ── */}
      {isSimulating && (
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
          borderRadius: '14px', padding: '0.875rem 1.5rem',
          display: 'flex', alignItems: 'center', gap: '1rem',
          boxShadow: '0 4px 16px rgba(124,58,237,0.3)'
        }}>
          <Zap size={18} color="#fff" />
          <div style={{ flex: 1, color: '#fff' }}>
            <span style={{ fontWeight: 700 }}>Simulation Running</span>
            <span style={{ opacity: 0.8, fontSize: '0.875rem', marginLeft: '0.75rem' }}>
              {simCount}/{4} simulated incident{simCount !== 1 ? 's' : ''} active — generating every 18–35s
            </span>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }} />
        </div>
      )}

      {/* ── Top Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>City Overview</h2>
          <p style={{ color: '#64748B', marginTop: '0.2rem', fontSize: '0.875rem' }}>
            Real-time intelligence — Kozhikode Emergency HQ
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          {/* Simulation Toggle */}
          <button
            onClick={onSimulationToggle}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1rem', borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
              background: isSimulating ? '#7C3AED' : '#F3F0FF',
              color: isSimulating ? '#fff' : '#7C3AED',
              boxShadow: isSimulating ? '0 2px 8px rgba(124,58,237,0.4)' : 'none'
            }}
          >
            {isSimulating ? <Square size={14} /> : <Play size={14} />}
            {isSimulating ? 'Stop Sim' : 'Run Simulation'}
          </button>

          {/* Clear All Incidents */}
          {incidents.length > 0 && (
            <button
              onClick={onClearIncidents}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.55rem 1rem', borderRadius: '10px',
                border: '1px solid #FCA5A5', background: '#FEF2F2',
                color: '#EA4335', cursor: 'pointer', fontWeight: 600,
                fontSize: '0.85rem', fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s ease'
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}

          <button className="btn btn-ghost" onClick={() => navigateTo('map')}
            style={{ fontSize: '0.875rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <Navigation size={15} /> Live Map
          </button>
          <button className="btn btn-danger" onClick={() => navigateTo('report')}
            style={{ fontSize: '0.875rem', borderRadius: '10px' }}>
            <Plus size={15} /> Report Emergency
          </button>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <MetricCard label="Active Incidents" value={activeIncidents.length} color="#FBBC05" icon={Activity} sub={`${incidents.length} total logged`} />
        <MetricCard label="Critical Cases" value={criticalCount} color="#EA4335" icon={ShieldAlert} sub="Immediate response triggered" />
        <MetricCard label="Responders Active" value={activeIncidents.length * 2} color="#4285F4" icon={Users} sub="Across all units" />
      </div>

      {/* ── Traffic Control ── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <Navigation size={17} color="#4285F4" /> Traffic Simulation Control
          </h3>
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '12px', padding: '3px', gap: '2px' }}>
            {['Low', 'Medium', 'High'].map(mode => (
              <button
                key={mode}
                onClick={() => setTrafficMode(mode)}
                style={{
                  background: trafficMode === mode
                    ? (mode === 'High' ? '#EA4335' : mode === 'Medium' ? '#FBBC05' : '#34A853')
                    : 'transparent',
                  color: trafficMode === mode ? '#fff' : '#64748B',
                  border: 'none', padding: '0.4rem 1rem', borderRadius: '10px',
                  cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease',
                  fontSize: '0.85rem', fontFamily: 'Inter, sans-serif'
                }}
              >{mode}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {[
            { mode: 'Low', desc: '20 vehicles, faster, lighter', color: '#34A853' },
            { mode: 'Medium', desc: '50 vehicles, balanced flow', color: '#FBBC05' },
            { mode: 'High', desc: '80 vehicles, dense + slow', color: '#EA4335' },
          ].map(({ mode, desc, color }) => (
            <div key={mode} style={{
              padding: '0.75rem', background: trafficMode === mode ? `${color}10` : '#F8FAFC',
              border: `1px solid ${trafficMode === mode ? `${color}40` : '#E2E8F0'}`,
              borderRadius: '10px', transition: 'all 0.2s ease'
            }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: trafficMode === mode ? color : '#374151', marginBottom: '0.2rem' }}>{mode}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── System Status ── */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={17} color="#7C3AED" /> System Status
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          {[
            { icon: CheckCircle2, label: 'AI Engine', value: import.meta.env?.VITE_GEMINI_API_KEY ? 'Live (Gemini)' : 'Simulated', color: '#34A853' },
            { icon: Wifi, label: 'OSRM Routing', value: 'Connected', color: '#4285F4' },
            { icon: Activity, label: 'Traffic', value: `${trafficMode} Mode`, color: '#FBBC05' },
            { icon: ShieldAlert, label: 'Emergency', value: emergencyMode ? 'ACTIVE' : 'Standby', color: emergencyMode ? '#EA4335' : '#94A3B8' },
            { icon: Zap, label: 'Simulation', value: isSimulating ? 'RUNNING' : 'Off', color: isSimulating ? '#7C3AED' : '#94A3B8' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Icon size={17} color={color} />
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live Command Feed (compact) ── */}
      <CommandFeed entries={feedEntries} mode="compact" soundEnabled />

      {/* ── Incidents Feed ── */}
      <div>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', paddingBottom: '0.625rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Recent Incidents</span>
          {incidents.length > 0 && (
            <button className="btn btn-ghost" onClick={() => navigateTo('incidentsList')} style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}>
              View All →
            </button>
          )}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {incidents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8', background: '#F8FAFC', borderRadius: '14px', border: '1px dashed #E2E8F0' }}>
              <CheckCircle2 size={28} color="#E2E8F0" style={{ margin: '0 auto 0.625rem' }} />
              <div style={{ fontWeight: 600, color: '#CBD5E1' }}>No active incidents</div>
              <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>City status: Normal</div>
            </div>
          ) : (
            incidents.slice(0, 6).map(inc => {
              const sev = inc.severity?.toUpperCase();
              const sevColor = sev === 'CRITICAL' ? '#EA4335' : sev === 'HIGH' ? '#FBBC05' : '#34A853';
              return (
                <div
                  key={inc.id}
                  className="card card-hover"
                  onClick={() => navigateTo('incident', inc.id)}
                  style={{
                    cursor: 'pointer', padding: '0.875rem 1.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: `1px solid ${sev === 'CRITICAL' ? '#FEE2E2' : '#E2E8F0'}`,
                    background: sev === 'CRITICAL' ? '#FFFBFB' : '#fff'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.18rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem',
                        fontWeight: 700, background: `${sevColor}18`, color: sevColor,
                        border: `1px solid ${sevColor}40`
                      }}>{sev}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>{inc.type}</span>
                      {inc.isSimulated && (
                        <span style={{ fontSize: '0.68rem', color: '#7C3AED', background: '#F3F0FF', padding: '0.12rem 0.45rem', borderRadius: '9999px', fontWeight: 700 }}>SIM</span>
                      )}
                      <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>{new Date(inc.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ color: '#64748B', fontSize: '0.82rem' }}>📍 {inc.location}</p>
                  </div>
                  <button className="btn btn-ghost" style={{ fontSize: '0.78rem', color: '#4285F4', flexShrink: 0 }}>
                    Details →
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
      `}</style>
    </div>
  );
}
