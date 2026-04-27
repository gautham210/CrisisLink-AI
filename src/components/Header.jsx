// ============================================================
// Header.jsx — CrisisLink AI Top Bar
// Emergency mode: red background, pulsing indicator
// Normal mode: clean Google-style flat header
// ============================================================

import { Bell, User, Cpu, AlertTriangle } from 'lucide-react';

export default function Header({ navigateTo, emergencyMode, activeIncidentCount = 0 }) {
  return (
    <header
      className="top-header"
      style={{
        background: emergencyMode
          ? 'linear-gradient(135deg, #EA4335 0%, #C62828 100%)'
          : '#FFFFFF',
        borderBottom: emergencyMode ? 'none' : '1px solid #E2E8F0',
        transition: 'background 0.6s ease, border-color 0.6s ease',
        boxShadow: emergencyMode ? '0 4px 24px rgba(234,67,53,0.35)' : '0 1px 4px rgba(0,0,0,0.04)'
      }}
    >
      {/* Left: Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Emergency active indicator */}
        {emergencyMode ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            padding: '0.3rem 0.9rem', borderRadius: '9999px',
            fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em',
            animation: 'emergencyHeaderPulse 1.5s ease-in-out infinite alternate'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#fff', animation: 'blink 1s infinite'
            }} />
            🚨 EMERGENCY — {activeIncidentCount} ACTIVE
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#F0FDF4', color: '#15803D',
              padding: '0.3rem 0.75rem', borderRadius: '9999px',
              fontSize: '0.82rem', fontWeight: 600
            }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#34A853', animation: 'pulseGreen 2s infinite'
              }} />
              System Active
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#F3F0FF', color: '#7C3AED',
              padding: '0.3rem 0.75rem', borderRadius: '9999px',
              fontSize: '0.82rem', fontWeight: 600
            }}>
              <Cpu size={13} />
              AI Core Online
            </div>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-ghost"
          style={{ padding: '0.5rem', color: emergencyMode ? 'rgba(255,255,255,0.8)' : '#64748B' }}
        >
          <Bell size={19} />
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          paddingLeft: '1rem',
          borderLeft: emergencyMode ? '1px solid rgba(255,255,255,0.3)' : '1px solid #E2E8F0'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: emergencyMode ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <User size={18} color={emergencyMode ? '#fff' : '#64748B'} />
          </div>
          <div>
            <div style={{
              fontSize: '0.85rem', fontWeight: 600,
              color: emergencyMode ? '#fff' : '#111827'
            }}>
              Commander
            </div>
            <div style={{ fontSize: '0.73rem', color: emergencyMode ? 'rgba(255,255,255,0.75)' : '#94A3B8' }}>
              Kozhikode HQ
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes emergencyHeaderPulse { 0%{opacity:0.85;} 100%{opacity:1;} }
        @keyframes blink { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
        @keyframes pulseGreen {
          0%{box-shadow:0 0 0 0 rgba(52,168,83,0.4);}
          70%{box-shadow:0 0 0 6px rgba(52,168,83,0);}
          100%{box-shadow:0 0 0 0 rgba(52,168,83,0);}
        }
      `}</style>
    </header>
  );
}
