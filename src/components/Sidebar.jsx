// ============================================================
// Sidebar.jsx — CrisisLink AI Navigation
// Clean Google-style flat sidebar, emergency indicator,
// improved active states, AI mode display
// ============================================================

import { LayoutDashboard, MessageSquareWarning, Map, AlertTriangle, Zap } from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, emergencyMode }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'report', label: 'Report Emergency', icon: MessageSquareWarning },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'incidentsList', label: 'Incidents', icon: AlertTriangle },
  ];

  return (
    <aside className="sidebar" style={{
      background: emergencyMode ? '#1A0000' : '#FFFFFF',
      borderRight: emergencyMode ? '1px solid #EA4335' : '1px solid #E2E8F0',
      transition: 'background 0.6s ease, border-color 0.6s ease',
      display: 'flex', flexDirection: 'column', width: '260px', height: '100%', zIndex: 10
    }}>
      {/* Logo Area */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: emergencyMode ? '1px solid rgba(234,67,53,0.3)' : '1px solid #F1F5F9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: emergencyMode ? '#EA4335' : '#4285F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: emergencyMode
              ? '0 4px 12px rgba(234,67,53,0.4)'
              : '0 4px 12px rgba(66,133,244,0.3)',
            transition: 'all 0.5s ease'
          }}>
            <Zap size={18} color="#fff" />
          </div>
          <div>
            <div style={{
              fontSize: '1.05rem', fontWeight: 700, fontFamily: 'Outfit, sans-serif',
              color: emergencyMode ? '#fff' : '#111827',
              transition: 'color 0.5s ease'
            }}>
              CrisisLink <span style={{ color: emergencyMode ? '#FF8A80' : '#4285F4' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: emergencyMode ? 'rgba(255,255,255,0.5)' : '#94A3B8', fontWeight: 500 }}>
              Kozhikode Command
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isEmergencyReport = item.id === 'report';
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.7rem 0.875rem', borderRadius: '12px',
                border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem', textAlign: 'left', width: '100%',
                background: isActive
                  ? (emergencyMode ? 'rgba(234,67,53,0.2)' : '#EBF3FE')
                  : 'transparent',
                color: isActive
                  ? (emergencyMode ? '#FF8A80' : '#4285F4')
                  : (emergencyMode ? 'rgba(255,255,255,0.7)' : '#64748B'),
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = emergencyMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC';
                  e.currentTarget.style.color = emergencyMode ? '#fff' : '#374151';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = emergencyMode ? 'rgba(255,255,255,0.7)' : '#64748B';
                }
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.id === 'incidentsList' && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700,
                  background: emergencyMode ? '#EA4335' : '#F1F5F9',
                  color: emergencyMode ? '#fff' : '#94A3B8',
                  padding: '0.1rem 0.5rem', borderRadius: '9999px'
                }}>
                  Live
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1rem 0.75rem',
        borderTop: emergencyMode ? '1px solid rgba(234,67,53,0.3)' : '1px solid #F1F5F9',
      }}>
        {/* Emergency Mode Indicator */}
        {emergencyMode && (
          <div style={{
            padding: '0.7rem 0.875rem', background: 'rgba(234,67,53,0.15)',
            borderRadius: '12px', border: '1px solid rgba(234,67,53,0.3)',
            marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            animation: 'sidebarEmgPulse 2s ease-in-out infinite alternate'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EA4335', animation: 'blink 1s infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FF6B6B', letterSpacing: '0.04em' }}>
              EMERGENCY MODE
            </span>
          </div>
        )}

        <div style={{
          padding: '0.7rem 0.875rem',
          background: emergencyMode ? 'rgba(139,92,246,0.15)' : '#F9F5FF',
          borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#7C3AED', boxShadow: '0 0 8px rgba(124,58,237,0.6)'
          }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: emergencyMode ? '#C4B5FD' : '#7C3AED' }}>
            AI: {import.meta.env?.VITE_GEMINI_API_KEY ? 'Live (Gemini)' : 'Simulated'}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes sidebarEmgPulse { 0%{opacity:0.7;} 100%{opacity:1;} }
        @keyframes blink { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
      `}</style>
    </aside>
  );
}
