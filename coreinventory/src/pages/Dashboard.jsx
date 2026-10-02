import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { Badge } from '../components/UI'
import { useNavigate } from 'react-router-dom'
import { Package, AlertTriangle, XCircle, ArrowDownToLine, ArrowUpFromLine, TrendingUp, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

function qc(q) {
  if (q.startsWith('+')) return 'text-success font-mono font-semibold'
  if (q.startsWith('-')) return 'text-danger  font-mono font-semibold'
  return 'text-info font-mono font-semibold'
}

export default function Dashboard() {
  const { products, receipts, deliveries, transfers, adjustments, warehouses } = useStore()
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [warehouseFilter, setWarehouseFilter] = useState('All Warehouses')

  const low = products.filter(p => p.stock > 0 && p.stock <= 10)
  const out = products.filter(p => p.stock === 0)
  const alerts = [...out, ...low]
  const pendingReceipts = receipts.filter(r => r.status !== 'Done').length
  const pendingDeliveries = deliveries.filter(d => d.status !== 'Done').length

  const operations = useMemo(() => {
    const rows = [
      ...receipts.map(r => ({
        ref: `RCP-${String(r.receipt_id).padStart(3, '0')}`,
        type: 'Receipt',
        product: r.product,
        qty: `+${r.qty}`,
        status: r.status,
        date: r.date ? new Date(r.date).toLocaleDateString() : '',
        rawDate: r.date || '',
        warehouse: r.wh || '',
      })),
      ...deliveries.map(d => ({
        ref: `DLV-${String(d.delivery_id).padStart(3, '0')}`,
        type: 'Delivery',
        product: d.product,
        qty: `-${d.qty}`,
        status: d.status,
        date: d.date ? new Date(d.date).toLocaleDateString() : '',
        rawDate: d.date || '',
        warehouse: d.wh || '',
      })),
      ...transfers.map(t => ({
        ref: `TRF-${String(t.transfer_id).padStart(3, '0')}`,
        type: 'Transfer',
        product: t.product,
        qty: `${t.qty}`,
        status: t.status,
        date: t.date ? new Date(t.date).toLocaleDateString() : '',
        rawDate: t.date || '',
        warehouse: `${t.from || ''} -> ${t.to || ''}`,
      })),
      ...adjustments.map(a => {
        const diff = Number(a.counted) - Number(a.recorded)
        return {
          ref: `ADJ-${String(a.adjustment_id).padStart(3, '0')}`,
          type: 'Adjustment',
          product: a.product,
          qty: `${diff > 0 ? '+' : ''}${diff}`,
          status: 'Done',
          date: a.date ? new Date(a.date).toLocaleDateString() : '',
          rawDate: a.date || '',
          warehouse: a.location || '',
        }
      }),
    ]

    return rows.sort((a, b) => new Date(b.rawDate || 0) - new Date(a.rawDate || 0))
  }, [receipts, deliveries, transfers, adjustments])

  const filteredRecent = useMemo(() => {
    return operations.filter(op => {
      const typeOk = (
        typeFilter === 'All Types' ||
        (typeFilter === 'Receipts' && op.type === 'Receipt') ||
        (typeFilter === 'Delivery' && op.type === 'Delivery') ||
        (typeFilter === 'Internal' && op.type === 'Transfer') ||
        (typeFilter === 'Adjustments' && op.type === 'Adjustment')
      )

      const statusOk = statusFilter === 'All Status' || op.status === statusFilter

      const warehouseOk = (
        warehouseFilter === 'All Warehouses' ||
        op.warehouse === warehouseFilter ||
        op.warehouse.includes(warehouseFilter)
      )

      return typeOk && statusOk && warehouseOk
    }).slice(0, 10)
  }, [operations, typeFilter, statusFilter, warehouseFilter])

  const filteredScheduledTransfers = useMemo(() => {
    return transfers.filter(t => {
      if (t.status === 'Done') return false
      const statusOk = statusFilter === 'All Status' || t.status === statusFilter
      const warehouseOk = (
        warehouseFilter === 'All Warehouses' ||
        t.from === warehouseFilter ||
        t.to === warehouseFilter
      )
      return statusOk && warehouseOk
    }).slice(0, 3)
  }, [transfers, statusFilter, warehouseFilter])

  const KPIS = [
    { label:'Total Products',     val:products.length, sub:'In catalog',       icon:Package,         c:'text-textLt',  bg:'bg-card' },
    { label:'Low Stock',          val:low.length,      sub:'Need reorder',     icon:AlertTriangle,   c:'text-warning', bg:'bg-warning/8' },
    { label:'Out of Stock',       val:out.length,      sub:'Action needed',    icon:XCircle,         c:'text-danger',  bg:'bg-danger/8' },
    { label:'Pending Receipts',   val:pendingReceipts,    sub:'Awaiting arrival', icon:ArrowDownToLine, c:'text-info',    bg:'bg-info/8' },
    { label:'Pending Deliveries', val:pendingDeliveries,  sub:'Ready to ship',    icon:ArrowUpFromLine, c:'text-accent',  bg:'bg-accent/8' },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {KPIS.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-mono text-muted uppercase tracking-widest leading-tight">{k.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.bg}`}>
                <k.icon size={14} className={k.c}/>
              </div>
            </div>
            <div className={`text-3xl font-bold font-mono ${k.c}`}>{k.val}</div>
            <div className="text-xs text-muted mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-muted uppercase tracking-widest">Filter:</span>
        {['All Types','Receipts','Delivery','Internal','Adjustments'].map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors
            ${typeFilter === f ? 'border-accent text-accentLt bg-accent/6' : 'border-border text-muted hover:border-accent/50 hover:text-dim'}`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <select className="select-field text-xs py-1.5 px-3" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option>All Status</option>
            <option>Draft</option><option>Waiting</option><option>Ready</option><option>Done</option>
          </select>
          <select className="select-field text-xs py-1.5 px-3" value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}>
            <option>All Warehouses</option>
            {warehouses.map(w => <option key={w.warehouse_id} value={w.name}>{w.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent ops */}
        <div className="col-span-2 card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <span className="font-serif font-semibold text-textLt flex items-center gap-2">
              <TrendingUp size={14} className="text-accent"/> Recent Operations
            </span>
            <button onClick={()=>navigate('/history')} className="text-xs text-accentLt font-mono hover:underline flex items-center gap-1">
              View All <ArrowRight size={11}/>
            </button>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              {['Ref','Type','Product','Qty','Status','Date'].map(h=>(
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredRecent.length === 0
                ? <tr><td colSpan={6} className="table-td text-center text-muted text-xs font-mono py-4">No operations match current filters</td></tr>
                : filteredRecent.map(r => (
                <tr key={r.ref} className="table-row">
                  <td className="table-td font-mono text-xs text-accent">{r.ref}</td>
                  <td className="table-td text-dim text-xs">{r.type}</td>
                  <td className="table-td text-text">{r.product}</td>
                  <td className={clsx('table-td text-sm', qc(r.qty))}>{r.qty}</td>
                  <td className="table-td"><Badge status={r.status}/></td>
                  <td className="table-td text-dim text-xs">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Alerts */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <AlertTriangle size={13} className="text-warning"/>
              <span className="font-serif font-semibold text-textLt text-sm">Stock Alerts</span>
              <span className="ml-auto font-mono text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded">{alerts.length}</span>
            </div>
            <div className="p-4 space-y-2.5">
              {alerts.slice(0,4).map(p => (
                <div key={p.sku} className={p.stock===0
                  ? 'bg-danger/6 border border-danger/15 rounded-lg p-3'
                  : 'bg-warning/6 border border-warning/15 rounded-lg p-3'}>
                  <div className={`text-xs font-mono font-bold ${p.stock===0?'text-danger':'text-warning'}`}>
                    {p.stock===0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                  </div>
                  <div className="text-sm text-text mt-0.5 font-medium">{p.name}</div>
                  <div className="text-xs text-muted">{p.sku} · {p.stock} {p.uom} left</div>
                </div>
              ))}
              {alerts.length===0 && (
                <p className="text-center text-muted text-xs font-mono py-4">All levels OK ✓</p>
              )}
            </div>
          </div>

          {/* Scheduled transfers */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border">
              <span className="font-serif font-semibold text-textLt text-sm">Scheduled Transfers</span>
            </div>
            <div className="p-4 space-y-3">
              {filteredScheduledTransfers.map(t => (
                <div key={t.transfer_id} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-dim">{t.from} → {t.to}</div>
                    <div className="text-sm text-text font-medium">{t.product} · {t.qty}</div>
                  </div>
                  <Badge status={t.status}/>
                </div>
              ))}
              {filteredScheduledTransfers.length === 0 && (
                <p className="text-center text-muted text-xs font-mono py-4">No pending transfers match filters</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
