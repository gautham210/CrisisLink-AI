// ============================================================
// AlertSimulation.jsx — Toast Notification Manager
// Clean Google-style toasts with smooth animations
// ============================================================

export default function AlertSimulation({ alerts }) {
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      gap: '0.625rem', pointerEvents: 'none'
    }}>
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="alert-toast"
          style={{
            background: '#1E293B',
            color: '#F1F5F9',
            padding: '0.875rem 1.25rem',
            borderRadius: '14px',
            fontSize: '0.875rem',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            maxWidth: '360px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.08)',
            lineHeight: 1.5,
            letterSpacing: '0.01em'
          }}
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
}
