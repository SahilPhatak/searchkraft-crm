// Production #auth-loading screen (public/index.html lines 34–37).
// Stays up until CRM data is loaded, so users never see a blank page while Render wakes up.
export function LoadingScreen({ message = 'Loading SearchKraft CRM…' }) {
  return (
    <div id="auth-loading" style={{ position: 'fixed', inset: '0', background: '#0f1b3d', zIndex: '99999', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: 'system-ui,sans-serif' }}>{message}</div>
    </div>
  )
}
