import { useMemo, useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { DataTable, EmptyRow, PageHeader } from '../components/UI'
import { Search } from 'lucide-react'
import clsx from 'clsx'

const TYPE_STYLE = {
  Receipt:    'bg-info/10    text-info    border border-info/20',
  Delivery:   'bg-accent/10  text-accentLt border border-accent/20',
  Transfer:   'bg-info/8     text-info/80  border border-info/15',
  Adjustment: 'bg-warning/10 text-warning  border border-warning/20',
}

function qtyClass(qty) {
  if (qty.startsWith('+')) return 'text-success'
  if (qty.startsWith('-')) return 'text-danger'
  return 'text-info'
}

export default function History() {
  const {
    user,
    warehouses,
    receipts,
    deliveries,
    transfers,
    adjustments,
    fetchWarehouses,
    fetchReceipts,
    fetchDeliveries,
    fetchTransfers,
    fetchAdjustments,
  } = useStore()
  const [q,    setQ]    = useState('')
  const [type, setType] = useState('')
  const [wh,   setWh]   = useState('')

  useEffect(() => {
    fetchWarehouses()
    fetchReceipts()
    fetchDeliveries()
    fetchTransfers()
    fetchAdjustments()
  }, [])

  const history = useMemo(() => {
    const rows = [
      ...receipts.map(r => ({
        dt: r.date || '',
        ref: `RCP-${String(r.receipt_id).padStart(3, '0')}`,
        type: 'Receipt',
        product: r.product || '-',
        from: 'Supplier',
        to: r.wh || '-',
        qty: `+${r.qty}`,
        user: user?.name || 'System',
      })),
      ...deliveries.map(d => ({
        dt: d.date || '',
        ref: `DLV-${String(d.delivery_id).padStart(3, '0')}`,
        type: 'Delivery',
        product: d.product || '-',
        from: d.wh || '-',
        to: d.customer || 'Customer',
        qty: `-${d.qty}`,
        user: user?.name || 'System',
      })),
      ...transfers.map(t => ({
        dt: t.date || '',
        ref: `TRF-${String(t.transfer_id).padStart(3, '0')}`,
        type: 'Transfer',
        product: t.product || '-',
        from: t.from || '-',
        to: t.to || '-',
        qty: `${t.qty}`,
        user: user?.name || 'System',
      })),
      ...adjustments.map(a => ({
        dt: a.date || '',
        ref: `ADJ-${String(a.adjustment_id).padStart(3, '0')}`,
        type: 'Adjustment',
        product: a.product || '-',
        from: a.location || '-',
        to: a.location || '-',
        qty: `${Number(a.counted) - Number(a.recorded) > 0 ? '+' : ''}${Number(a.counted) - Number(a.recorded)}`,
        user: user?.name || 'System',
      })),
    ]

    return rows.sort((a, b) => new Date(b.dt || 0) - new Date(a.dt || 0))
  }, [receipts, deliveries, transfers, adjustments, user])

  const filtered = history.filter(h => {
    const mq = !q    || h.product.toLowerCase().includes(q.toLowerCase()) || h.ref.toLowerCase().includes(q.toLowerCase())
    const mt = !type || h.type === type
    const mw = !wh   || h.from.includes(wh) || h.to.includes(wh)
    return mq && mt && mw
  })

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Stock Ledger — Move History"
        subtitle="Every inventory movement automatically logged with full traceability."
      />

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input
            className="input-field pl-8 py-2 w-64 text-sm"
            placeholder="Filter by product or ref…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <select className="select-field text-sm py-2" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          <option>Receipt</option>
          <option>Delivery</option>
          <option>Transfer</option>
          <option>Adjustment</option>
        </select>
        <select className="select-field text-sm py-2" value={wh} onChange={e => setWh(e.target.value)}>
          <option value="">All Locations</option>
          {warehouses.map(w => <option key={w.warehouse_id} value={w.name}>{w.name}</option>)}
        </select>
        <span className="ml-auto text-xs font-mono text-muted">
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <DataTable headers={['Date / Time','Ref #','Type','Product','From','To','Qty','User']}>
        {filtered.length === 0
          ? <EmptyRow icon="📋" text="No records match your filter" cols={8}/>
          : filtered.map((h, i) => (
            <tr key={i} className="table-row">
              <td className="table-td font-mono text-xs text-muted whitespace-nowrap">{h.dt}</td>
              <td className="table-td font-mono text-xs text-accent">{h.ref}</td>
              <td className="table-td">
                <span className={clsx('badge', TYPE_STYLE[h.type] || 'badge-draft')}>{h.type}</span>
              </td>
              <td className="table-td text-text font-medium">{h.product}</td>
              <td className="table-td text-dim text-xs">{h.from}</td>
              <td className="table-td text-dim text-xs">{h.to}</td>
              <td className={clsx('table-td font-mono font-bold text-sm', qtyClass(h.qty))}>{h.qty}</td>
              <td className="table-td text-dim text-xs">{h.user}</td>
            </tr>
          ))
        }
      </DataTable>
    </div>
  )
}
