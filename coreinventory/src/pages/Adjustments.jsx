import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Modal, Field, Badge, DataTable, EmptyRow, PageHeader } from '../components/UI'
import { Plus } from 'lucide-react'
import clsx from 'clsx'



export default function Adjustments() {
    const { adjustments, products, warehouses, addAdjustment, showToast,
      fetchAdjustments, fetchProducts, fetchWarehouses } = useStore()
    const [modal,  setModal]  = useState(false)
    const [busy,   setBusy]   = useState(false)
    const EMPTY = { product_id:'', warehouse_id:'', counted:'' }
    const [form,   setForm]   = useState(EMPTY)

    useEffect(() => { fetchAdjustments(); fetchProducts(); fetchWarehouses() }, [])

    const selected  = products.find(p => p.id === parseInt(form.product_id))
  const recorded  = selected?.stock ?? 0
  const counted   = form.counted !== '' ? parseInt(form.counted) : null
  const diff      = counted !== null ? counted - recorded : null

  const submit = () => {
    if (!form.product_id || !form.warehouse_id || form.counted === '') {
      showToast('Product, warehouse and physical count required', 'error'); return
    }
    setBusy(true)
    addAdjustment({ product_id: parseInt(form.product_id), warehouse_id: parseInt(form.warehouse_id), new_quantity: parseInt(form.counted), reason: 'Manual count' })
      .then(() => { showToast(`Adjustment applied — stock set to ${form.counted}`, 'success'); setModal(false); setForm(EMPTY) })
      .catch(e => showToast(e?.response?.data?.message || 'Failed to apply adjustment', 'error'))
      .finally(() => setBusy(false))
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Stock Adjustments"
        subtitle="Correct mismatches between system records and physical count. Auto-logged to ledger."
        action={<button className="btn-primary" onClick={() => setModal(true)}><Plus size={14}/>New Adjustment</button>}
      />

      <DataTable headers={['Ref #', 'Product', 'Location', 'Recorded', 'Counted', 'Difference', 'Status']}>
        {adjustments.length === 0
          ? <EmptyRow icon="⚖️" text="No adjustments recorded" cols={7}/>
          : adjustments.map(a => {
              const d = a.counted - a.recorded
              return (
                <tr key={a.adjustment_id} className="table-row">
                  <td className="table-td font-mono text-xs text-accent">ADJ-{String(a.adjustment_id).padStart(3,'0')}</td>
                  <td className="table-td text-text font-medium">{a.product}</td>
                  <td className="table-td text-dim text-sm">{a.location}</td>
                  <td className="table-td font-mono text-dim">{a.recorded}</td>
                  <td className="table-td font-mono text-textLt font-semibold">{a.counted}</td>
                  <td className={clsx('table-td font-mono font-bold', d >= 0 ? 'text-success' : 'text-danger')}>
                    {d >= 0 ? '+' : ''}{d}
                  </td>
                  <td className="table-td"><Badge status={a.status}/></td>
                </tr>
              )
            })
        }
      </DataTable>

      <Modal open={modal} onClose={() => setModal(false)} title="New Stock Adjustment">
        <div className="space-y-4">
          <Field label="Product *">
            <select
              className="select-field w-full"
              value={form.product_id}
              onChange={e => setForm({ ...form, product_id: e.target.value })}
            >
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Location">
            <select
              className="select-field w-full"
              value={form.warehouse_id}
              onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
            >
              <option value="">Select warehouse…</option>
              {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Recorded Qty (System)">
              <input
                className="input-field opacity-50 cursor-not-allowed"
                readOnly
                value={selected ? recorded : '—'}
              />
            </Field>
            <Field label="Physical Count *">
              <input
                className="input-field"
                type="number"
                placeholder="Enter actual count"
                value={form.counted}
                onChange={e => setForm({ ...form, counted: e.target.value })}
              />
            </Field>
          </div>

          {/* Live diff display */}
          {diff !== null && (
            <div className={clsx(
              'rounded-lg p-3 text-sm font-mono font-semibold border transition-all',
              diff === 0
                ? 'bg-surface border-border text-muted'
                : diff > 0
                  ? 'bg-success/6 border-success/20 text-success'
                  : 'bg-danger/6  border-danger/20  text-danger'
            )}>
              Difference: {diff > 0 ? '+' : ''}{diff} {selected?.uom || 'units'}
              {diff === 0 && '  — no change'}
            </div>
          )}

          <div className="bg-info/6 border border-info/15 rounded-lg p-3 text-xs text-dim font-mono">
            ℹ System stock will be updated to the physical count and the change logged.
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={submit} disabled={busy}>{busy ? 'Saving...' : 'Apply Adjustment'}</button>
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
