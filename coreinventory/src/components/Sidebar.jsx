import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, Warehouse, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, SlidersHorizontal, History, User, LogOut
} from 'lucide-react'
import { useStore } from '../store/useStore'
import clsx from 'clsx'

const NAV = [
  { group:'Main', items:[
    { to:'/',            icon:LayoutDashboard,   label:'Dashboard' },
    { to:'/products',    icon:Package,           label:'Products' },
    { to:'/warehouses',  icon:Warehouse,         label:'Warehouses' },
  ]},
  { group:'Operations', items:[
    { to:'/receipts',    icon:ArrowDownToLine,   label:'Receipts',           badge:'3', bc:'bg-info/10 text-info' },
    { to:'/delivery',    icon:ArrowUpFromLine,   label:'Delivery Orders',    badge:'2', bc:'bg-success/10 text-success' },
    { to:'/transfers',   icon:ArrowLeftRight,    label:'Internal Transfers' },
    { to:'/adjustments', icon:SlidersHorizontal, label:'Adjustments' },
    { to:'/history',     icon:History,           label:'Move History' },
  ]},
]

export default function Sidebar() {
  const { user, logout, showToast } = useStore()
  const navigate = useNavigate()

  const initials = (user?.name || 'U')
    .split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

  const handleLogout = () => {
    logout()
    showToast('Signed out successfully', 'info')
    navigate('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-surface border-r border-border flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md shadow-accent/20">
            <Package size={17} className="text-bg"/>
          </div>
          <div>
            <div className="font-serif font-semibold text-textLt text-[15px] tracking-tight">CoreInventory</div>
            <div className="text-xs font-mono text-muted">IMS Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV.map(group => (
          <div key={group.group}>
            <div className="text-xs font-mono text-muted uppercase tracking-widest px-3 mb-1.5">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to==='/'}
                  className={({ isActive }) => clsx('snav', isActive && 'active')}
                >
                  <item.icon size={15}/>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={clsx('font-mono text-xs px-1.5 py-0.5 rounded font-bold', item.bc)}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Profile + logout */}
      <div className="px-3 py-3 border-t border-border flex-shrink-0 space-y-0.5">
        <NavLink
          to="/profile"
          className={({ isActive }) => clsx('snav', isActive && 'active')}
        >
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-bg font-bold text-xs font-mono flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-text text-[13px] font-medium leading-none truncate">{user?.name||'User'}</div>
            <div className="text-muted text-xs mt-0.5 truncate">{user?.role||''}</div>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className="snav w-full text-danger/70 hover:text-danger hover:bg-danger/5 border-transparent"
        >
          <LogOut size={15}/>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
