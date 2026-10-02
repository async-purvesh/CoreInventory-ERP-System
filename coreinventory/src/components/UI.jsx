import { useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

// ── Badge ────────────────────────────────────────────────────────
const STATUS_CLS = {
  Draft:'badge-draft', Waiting:'badge-waiting', Ready:'badge-ready',
  Done:'badge-done', Canceled:'badge-canceled',
  OK:'badge-ok', Low:'badge-low', Out:'badge-out',
}
export function Badge({ status }) {
  return <span className={clsx('badge', STATUS_CLS[status]||'badge-draft')}>{status}</span>
}

// ── Modal ────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const h = (e) => { if (e.key==='Escape') onClose() }
    if (open) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-back" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif font-semibold text-lg text-textLt">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors p-1 rounded-lg hover:bg-card">
            <X size={17}/>
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  )
}

// ── Toast ────────────────────────────────────────────────────────
export function Toast({ toast }) {
  if (!toast) return null
  const s = {
    success:'bg-success/10 border-success/30 text-success',
    error:  'bg-danger/10  border-danger/30  text-danger',
    info:   'bg-info/10    border-info/30    text-info',
    warning:'bg-warning/10 border-warning/30 text-warning',
  }
  const icon = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' }
  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-slide-up">
      <div className={clsx('flex items-center gap-3 px-5 py-3 rounded-xl border font-mono text-sm font-medium shadow-2xl shadow-black/40', s[toast.type])}>
        <span>{icon[toast.type]}</span>
        <span className="font-sans">{toast.msg}</span>
      </div>
    </div>
  )
}

// ── Form field wrapper ───────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

// ── Page header ──────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Empty state row ──────────────────────────────────────────────
export function EmptyRow({ icon, text, cols = 9 }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-16 text-center text-muted font-mono text-sm">
        <div className="text-3xl mb-2 opacity-40">{icon}</div>
        {text}
      </td>
    </tr>
  )
}

// ── Data table wrapper ───────────────────────────────────────────
export function DataTable({ headers, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {headers.map(h => <th key={h} className="table-th">{h}</th>)}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}
