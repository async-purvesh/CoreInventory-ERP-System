import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell } from 'lucide-react'
import { useStore } from '../store/useStore'

const TITLES = {
  '/':'Dashboard', '/products':'Products', '/receipts':'Receipts',
  '/warehouses':'Warehouses',
  '/delivery':'Delivery Orders', '/transfers':'Internal Transfers',
  '/adjustments':'Stock Adjustments', '/history':'Move History', '/profile':'My Profile',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useStore()
  const [q, setQ] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/products?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="bg-surface border-b border-border px-6 py-3 flex items-center gap-4 flex-shrink-0">
      <div className="flex-1">
        <span className="font-serif font-semibold text-textLt text-sm">
          {TITLES[pathname] || 'CoreInventory'}
        </span>
      </div>

      {/* Search */}
      <form onSubmit={submit} className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          className="input-field pl-8 py-2 w-60 text-sm"
          placeholder="Search SKU, product…"
        />
      </form>

      {/* Role badge */}
      {user?.role && (
        <span className="hidden sm:block text-xs font-mono text-muted border border-border px-2.5 py-1 rounded-lg whitespace-nowrap">
          {user.role}
        </span>
      )}

      {/* Bell */}
      <button
        className="relative p-2 rounded-lg hover:bg-card transition-colors"
        onClick={() => navigate('/')}
      >
        <Bell size={17} className="text-dim hover:text-accentLt transition-colors"/>
        <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-danger text-bg text-[9px] rounded-full flex items-center justify-center font-mono font-bold">2</span>
      </button>
    </header>
  )
}
