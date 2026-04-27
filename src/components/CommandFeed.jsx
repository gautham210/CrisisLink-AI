// ============================================================
// CommandFeed.jsx — Live Command Activity Feed
// Two modes:
//   'full'    → map overlay panel (last 10, scrollable, big)
//   'compact' → dashboard card (last 4, condensed)
// New entries slide in from top, color-coded by event type.
// Optional subtle audio tick via Web Audio API (no files needed).
// ============================================================

import { useEffect, useRef } from 'react';

export const FEED_TYPES = {
  dispatch:   { icon: '🚑', color: '#EA4335', bg: '#FEF2F2', label: 'DISPATCH' },
  fire:       { icon: '🚒', color: '#C62828', bg: '#FEF2F2', label: 'FIRE'     },
  police:     { icon: '🚓', color: '#1557A0', bg: '#EFF6FF', label: 'POLICE'   },
  signal:     { icon: '🚦', color: '#34A853', bg: '#F0FDF4', label: 'SIGNAL'   },
  hospital:   { icon: '🏥', color: '#4285F4', bg: '#EFF6FF', label: 'HOSPITAL' },
  reroute:    { icon: '🚗', color: '#FBBC05', bg: '#FFFBEB', label: 'REROUTE'  },
  ai:         { icon: '🧠', color: '#7C3AED', bg: '#F5F3FF', label: 'AI'       },
  system:     { icon: '⚡', color: '#7C3AED', bg: '#F5F3FF', label: 'SYSTEM'   },
  simulation: { icon: '🔴', color: '#7C3AED', bg: '#F5F3FF', label: 'SIM'      },
  clear:      { icon: '✅', color: '#34A853', bg: '#F0FDF4', label: 'CLEAR'    },
  traffic:    { icon: '📡', color: '#FBBC05', bg: '#FFFBEB', label: 'TRAFFIC'  },
};

// Singleton Web Audio context — one per page session
let _audioCtx = null;

export function playCommandTick() {
  try {
    if (!_audioCtx) {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') _audioCtx.resume();

    const osc  = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.connect(gain);
    gain.connect(_audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0, _audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.055, _audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + 0.09);
    osc.start(_audioCtx.currentTime);
    osc.stop(_audioCtx.currentTime + 0.09);
  } catch { /* audio not supported — silent fallback */ }
}

// ── Helper to build a feed entry object ────────────────────────
export function makeFeedEntry(type, message) {
  return {
    id: `feed-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    message,
    time: new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }),
  };
}

// ── Main Component ──────────────────────────────────────────────
export default function CommandFeed({
  entries     = [],
  mode        = 'full',        // 'full' | 'compact'
  soundEnabled = false,
}) {
  const scrollRef  = useRef(null);
  const prevLenRef = useRef(entries.length);

  useEffect(() => {
    if (entries.length > prevLenRef.current) {
      if (soundEnabled) playCommandTick();
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }
    prevLenRef.current = entries.length;
  }, [entries.length, soundEnabled]);

  const maxVisible = mode === 'full' ? 10 : 4;
  const visible    = entries.slice(0, maxVisible);

  // ── COMPACT mode ──────────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0',
        borderRadius: '14px', overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          padding: '0.65rem 1rem', borderBottom: '1px solid #F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFAFA',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.8rem', color: '#111827', letterSpacing: '0.02em' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', background: '#34A853',
              display: 'inline-block', animation: 'cfLiveDot 2s ease-in-out infinite', flexShrink: 0,
            }} />
            LIVE FEED
          </div>
          <span style={{
            fontSize: '0.66rem', color: '#94A3B8', fontWeight: 600,
            background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px',
          }}>
            {entries.length} events
          </span>
        </div>

        <div style={{ padding: '0.2rem 0' }}>
          {visible.length === 0 ? (
            <div style={{ padding: '0.7rem 1rem', fontSize: '0.77rem', color: '#94A3B8' }}>
              Awaiting system events…
            </div>
          ) : visible.map((entry, idx) => (
            <CompactEntry key={entry.id} entry={entry} isNew={idx === 0} />
          ))}
        </div>
        <CfStyles />
      </div>
    );
  }

  // ── FULL mode (map overlay) ────────────────────────────────────
  return (
    <div style={{
      width: '272px',
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(14px)',
      border: '1px solid rgba(226,232,240,0.9)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.65rem 1rem',
        borderBottom: '1px solid rgba(241,245,249,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(250,250,250,0.95)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          fontWeight: 700, fontSize: '0.78rem', color: '#111827', letterSpacing: '0.04em',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%', background: '#34A853',
            display: 'inline-block', animation: 'cfLiveDot 2s ease-in-out infinite', flexShrink: 0,
          }} />
          COMMAND FEED
        </div>
        <span style={{
          fontSize: '0.62rem', fontWeight: 700, color: '#34A853',
          background: '#F0FDF4', border: '1px solid #BBF7D0',
          padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.05em',
        }}>
          LIVE
        </span>
      </div>

      {/* Entry list */}
      <div ref={scrollRef} style={{
        maxHeight: '280px', overflowY: 'auto',
        scrollbarWidth: 'thin', scrollbarColor: '#E2E8F0 transparent',
      }}>
        {visible.length === 0 ? (
          <div style={{ padding: '1.25rem', fontSize: '0.77rem', color: '#94A3B8', textAlign: 'center' }}>
            System initializing…
          </div>
        ) : visible.map((entry, idx) => (
          <FullEntry key={entry.id} entry={entry} isNew={idx === 0} />
        ))}
      </div>
      <CfStyles />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────
function FullEntry({ entry, isNew }) {
  const cfg = FEED_TYPES[entry.type] || FEED_TYPES.system;
  return (
    <div style={{
      display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
      padding: '0.5rem 0.875rem',
      borderBottom: '1px solid #F8FAFC',
      animation: isNew ? 'cfSlideIn 0.3s ease' : 'none',
    }}>
      <span style={{ fontSize: '0.875rem', flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.77rem', color: '#374151', lineHeight: 1.45, display: 'block' }}>
          {entry.message}
        </span>
        <span style={{ fontSize: '0.66rem', color: '#94A3B8', display: 'block', marginTop: '2px' }}>
          {entry.time}
        </span>
      </div>
      <span style={{
        fontSize: '0.57rem', fontWeight: 700, color: cfg.color,
        background: cfg.bg, padding: '2px 5px', borderRadius: '3px',
        flexShrink: 0, letterSpacing: '0.04em', marginTop: '2px',
        border: `1px solid ${cfg.color}30`,
      }}>
        {cfg.label}
      </span>
    </div>
  );
}

function CompactEntry({ entry, isNew }) {
  const cfg = FEED_TYPES[entry.type] || FEED_TYPES.system;
  return (
    <div style={{
      display: 'flex', gap: '0.45rem', alignItems: 'center',
      padding: '0.35rem 1rem',
      borderBottom: '1px solid #F8FAFC',
      animation: isNew ? 'cfSlideIn 0.3s ease' : 'none',
    }}>
      <span style={{ fontSize: '0.8rem', flexShrink: 0 }}>{cfg.icon}</span>
      <span style={{ fontSize: '0.775rem', color: '#64748B', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.message}
      </span>
      <span style={{ fontSize: '0.62rem', color: '#94A3B8', flexShrink: 0 }}>{entry.time}</span>
    </div>
  );
}

// ── Scoped keyframes ────────────────────────────────────────────
function CfStyles() {
  return (
    <style>{`
      @keyframes cfLiveDot  { 0%,100%{opacity:0.35;} 50%{opacity:1;} }
      @keyframes cfSlideIn  { from{opacity:0;transform:translateY(-7px);} to{opacity:1;transform:translateY(0);} }
    `}</style>
  );
}
