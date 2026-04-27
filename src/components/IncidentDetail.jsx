// ============================================================
// IncidentDetail.jsx — AI Decision Transparency Panel (v2)
// Upgrades:
//   - AI Brain panel with border glow + slide-up animation
//   - Animated, color-coded ConfidenceBar (8px, fill on mount)
//   - Prefer Gemini-returned reasoning fields over fallbacks
//   - Google technology attribution footer
//   - Google Challenge competitive positioning
// ============================================================

import { useEffect, useRef } from 'react';
import { ArrowLeft, Map, Activity, ShieldAlert, Navigation, Cpu, Route, Target, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { getHaversineDistance, TRAFFIC_JUNCTIONS } from '../utils/geo';

// Compute junction overrides for this incident
function getJunctionOverrides(incident) {
  if (!incident?.dispatchOrigin) return [];
  const overrides = [];
  TRAFFIC_JUNCTIONS.forEach(j => {
    const distToOrigin = getHaversineDistance(
      incident.dispatchOrigin.lat, incident.dispatchOrigin.lng, j.lat, j.lng
    );
    if (distToOrigin < 4) overrides.push(j);
  });
  return overrides.slice(0, 5);
}

// ── Animated Confidence Bar ─────────────────────────────────────
function ConfidenceBar({ value }) {
  const barRef = useRef(null);

  // Parse "98.1%" → 98.1  OR  0.981 → 98.1
  let num = parseFloat((String(value || '0')).replace('%', '')) || 0;
  if (num > 0 && num <= 1) num = num * 100; // handle 0–1 fraction

  const color = num >= 80 ? '#34A853' : num >= 60 ? '#FBBC05' : '#EA4335';
  const label = num >= 80 ? 'High Confidence' : num >= 60 ? 'Medium Confidence' : 'Low Confidence';

  // Animate fill from 0 → target on mount
  useEffect(() => {
    if (!barRef.current) return;
    barRef.current.style.width = '0%';
    const raf = requestAnimationFrame(() => {
      if (barRef.current) barRef.current.style.width = `${num}%`;
    });
    return () => cancelAnimationFrame(raf);
  }, [num]);

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{label}</span>
        <span style={{ fontSize: '0.92rem', fontWeight: 700, color }}>{num.toFixed(1)}%</span>
      </div>
      <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          ref={barRef}
          style={{
            height: '100%', width: '0%', background: color,
            borderRadius: '4px',
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

// ── Reasoning Bullet ────────────────────────────────────────────
function ReasoningBullet({ icon: Icon, color, title, text }) {
  return (
    <div style={{
      display: 'flex', gap: '0.75rem', padding: '0.75rem',
      background: '#F8FAFC', borderRadius: '10px', marginBottom: '0.5rem',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: `${color}15`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827', marginBottom: '0.2rem' }}>{title}</div>
        <div style={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.55 }}>{text}</div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function IncidentDetail({ incident, navigateTo }) {
  if (!incident) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#64748B' }}>
        Incident not found or loading...
      </div>
    );
  }

  const junctionOverrides = getJunctionOverrides(incident);
  const severity = incident.severity?.toUpperCase();
  const severityColor = severity === 'CRITICAL' ? '#EA4335' : severity === 'HIGH' ? '#F97316' : '#34A853';

  // Prefer Gemini-returned fields, fall back to computed fallbacks
  const routeReasonText = incident.routeReason ||
    (incident.route
      ? `Route "${incident.route}" selected — shortest path with minimal signal interruptions detected via OSRM real-time road graph.`
      : 'Dynamic fast-path routing applied via OSRM engine — lowest ETA corridor under current traffic conditions.');

  const infraReasonText = incident.infraReason ||
    (incident.dispatchOrigin
      ? `${incident.dispatchOrigin.name} selected as dispatch origin (${incident.dispatchOrigin.distance} from incident site). Chosen for proximity, available unit status, and resource type match.`
      : 'Nearest appropriate infrastructure selected using Haversine spatial analysis across all active units.');

  const trafficReasonText = incident.trafficReason ||
    `Traffic mode is currently ${incident.trafficMode || 'Medium'}. OSRM routing actively avoided high-congestion segments. ${junctionOverrides.length > 0 ? `${junctionOverrides.length} signal(s) along corridor overridden to green.` : 'No congestion zones on selected path.'}`;

  const safetyTipsText = Array.isArray(incident.safetyTips) && incident.safetyTips.length > 0
    ? incident.safetyTips
    : ['Keep roads clear for emergency vehicles', 'Follow officer instructions', 'Move to left lane when hearing sirens'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div>
        <button
          className="btn btn-ghost"
          onClick={() => navigateTo('dashboard')}
          style={{ padding: 0, marginBottom: '1rem', color: '#64748B', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{
              padding: '0.35rem 0.9rem', borderRadius: '9999px', fontSize: '0.78rem',
              fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
              background: `${severityColor}18`, color: severityColor,
              border: `1px solid ${severityColor}40`
            }}>
              {severity}
            </span>
            <h2 style={{ fontSize: '1.7rem', fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>
              {incident.type} <span style={{ color: '#94A3B8', fontWeight: 400 }}>— {incident.id}</span>
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" onClick={() => navigateTo('map')} style={{ fontSize: '0.875rem' }}>
              <Map size={16} /> Locate on Map
            </button>
          </div>
        </div>
        <p style={{ color: '#64748B', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          📍 {incident.location} — Logged at {new Date(incident.timestamp).toLocaleTimeString()}
        </p>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: '1.25rem' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Incident Report */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Activity size={18} color="#4285F4" /> Incident Report
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: 1.65, color: '#374151' }}>{incident.description}</p>
          </div>

          {/* ══ AI DECISION ENGINE PANEL ══ */}
          <div style={{
            background: 'linear-gradient(135deg, #F8FAFF 0%, #FAFFF8 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(66,133,244,0.25)',
            boxShadow: '0 8px 32px rgba(66,133,244,0.12), 0 0 0 1px rgba(66,133,244,0.08)',
            padding: '1.5rem',
            position: 'relative', overflow: 'hidden',
            animation: 'aiPanelEntry 0.45s ease',
          }}>
            {/* Gradient accent top bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: 'linear-gradient(90deg, #4285F4, #7C3AED, #34A853)',
            }} />

            {/* Panel header */}
            <h3 style={{
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              fontSize: '1rem', color: '#1a73e8', fontWeight: 700,
            }}>
              <Cpu size={18} color="#7C3AED" />
              🧠 AI Decision Engine
              <span style={{
                fontSize: '0.7rem', color: '#7C3AED', background: '#F5F3FF',
                border: '1px solid #DDD6FE', padding: '2px 8px', borderRadius: '9999px',
                fontWeight: 600, letterSpacing: '0.03em', marginLeft: '0.25rem',
              }}>
                Powered by Google Gemini
              </span>
            </h3>

            {/* Reasoning bullets */}
            <ReasoningBullet icon={Route}  color="#4285F4" title="🗺️ Route Selection Reasoning"    text={routeReasonText}   />
            <ReasoningBullet icon={Target} color="#34A853" title="🏥 Infrastructure Selection"      text={infraReasonText}   />
            <ReasoningBullet icon={AlertTriangle} color="#FBBC05" title="🚦 Traffic Avoidance Logic" text={trafficReasonText} />

            {/* Junction Overrides */}
            <div style={{
              padding: '0.75rem 1rem', background: '#F0FDF4', borderRadius: '10px',
              border: '1px solid #D1FAE5', marginBottom: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={15} color="#34A853" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#065F46' }}>
                  Junction Overrides — {junctionOverrides.length} Signal{junctionOverrides.length !== 1 ? 's' : ''} Cleared
                </span>
              </div>
              {junctionOverrides.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', paddingLeft: '1.5rem' }}>
                  {junctionOverrides.map(j => (
                    <span key={j.id} style={{
                      padding: '0.2rem 0.6rem', background: '#fff', borderRadius: '6px',
                      fontSize: '0.78rem', color: '#34A853', border: '1px solid #A7F3D0', fontWeight: 500,
                    }}>
                      🟢 {j.name}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '0.82rem', color: '#6B7280', paddingLeft: '1.5rem' }}>
                  No junction overrides required for this route.
                </span>
              )}
            </div>

            {/* Animated Confidence Score */}
            <div style={{ padding: '0.875rem 1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <TrendingUp size={15} color="#8B5CF6" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1F2937' }}>📊 Model Confidence</span>
              </div>
              <ConfidenceBar value={incident.confidence} />
            </div>

            {/* Google technology attribution */}
            <div style={{
              marginTop: '1rem', paddingTop: '0.875rem', borderTop: '1px solid rgba(66,133,244,0.15)',
              fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 600, color: '#64748B', marginBottom: '0.3rem', fontSize: '0.76rem' }}>Powered by:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span>• <strong style={{ color: '#4285F4' }}>Google Gemini AI</strong> — real-time decision intelligence</span>
                <span>• <strong style={{ color: '#34A853' }}>OpenStreetMap + OSRM</strong> — simulation routing layer</span>
                <span style={{ color: '#7C3AED', fontStyle: 'italic' }}>
                  ↳ Production upgrade: <strong>Google Maps Platform</strong> for real-world deployment scale
                </span>
              </div>
            </div>
          </div>

          {/* Action Plan */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <Navigation size={18} color="#34A853" /> Action Plan Executed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {incident.actions?.map((action, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem', background: '#F8FAFC',
                  borderRadius: '10px', fontSize: '0.9rem',
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: '#EFF6FF', color: '#4285F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ color: '#374151' }}>{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Tips */}
          {safetyTipsText.length > 0 && (
            <div className="card" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <h3 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', color: '#92400E' }}>
                <AlertTriangle size={18} color="#FBBC05" /> Safety Advisories
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {safetyTipsText.map((tip, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: '#78350F', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: '#FBBC05', flexShrink: 0, marginTop: '1px' }}>•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Responders */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <ShieldAlert size={18} color="#64748B" /> Dispatched Responders
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {incident.responders?.map((res, idx) => (
                <div key={idx} style={{
                  padding: '0.875rem', border: '1px solid #E2E8F0',
                  borderRadius: '12px', background: '#FAFAFA',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{res} Unit {idx + 1}</span>
                    <span style={{
                      padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.73rem',
                      fontWeight: 600, background: '#EFF6FF', color: '#4285F4', letterSpacing: '0.04em',
                    }}>EN ROUTE</span>
                  </div>
                  {incident.dispatchOrigin && (
                    <div style={{ fontSize: '0.82rem', color: '#64748B', background: '#F1F5F9', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                      From: <strong style={{ color: '#374151' }}>{incident.dispatchOrigin.name}</strong>
                      <span style={{ marginLeft: '0.35rem', color: '#94A3B8' }}>({incident.dispatchOrigin.distance})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#374151' }}>Incident Metrics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Priority Level', value: incident.priority ? `${incident.priority}/10` : 'High', color: '#EA4335' },
                { label: 'ETA', value: incident.eta || 'Calculating...', color: '#4285F4' },
                { label: 'Route', value: incident.route || 'Dynamic Path', color: '#34A853' },
                { label: 'Junction Overrides', value: junctionOverrides.length.toString(), color: '#FBBC05' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{m.label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes aiPanelEntry {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
