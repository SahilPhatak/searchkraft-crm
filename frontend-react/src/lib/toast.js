// Production showToast(): a pill at the bottom centre, gone after 2.2s.
// Kept as a plain function so any module (including non-React code) can call it.
export function showToast(msg, color) {
  const existing = document.getElementById('sk-toast')
  if (existing) existing.remove()
  const t = document.createElement('div')
  t.id = 'sk-toast'
  t.textContent = msg
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:${color || 'var(--accent)'};color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;font-weight:600;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.18);pointer-events:none`
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2200)
}
