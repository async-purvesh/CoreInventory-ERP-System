import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Modal, Field, Badge, DataTable, EmptyRow, PageHeader } from '../components/UI'
import { Plus, CheckCircle, ArrowRight } from 'lucide-react'



export default function Transfers() {
    const { transfers, products, warehouses, stockRows,
      addTransfer, validateTransfer, showToast,
      fetchTransfers, fetchProducts, fetchWarehouses, fetchStock } = useStore()
  const [modal, setModal] = useState(false)
  const [busy, setBusy]   = useState(false)
  const EMPTY = { product_id:'', from_warehouse:'', to_warehouse:'', qty:'' }
  const [form, setForm]   = useState(EMPTY)

  useEffect(() => { fetchTransfers(); fetchProducts(); fetchWarehouses(); fetchStock() }, [])

  // Available qty in source warehouse for selected product
  const availableQty = useMemo(() => {
    if (!form.product_id || !form.from_warehouse) return null
    const row = stockRows.find(r => r.product_id === parseInt(form.product_id) && r.warehouse_id === parseInt(form.from_warehouse))
    return row ? row.quantity : 0
  }, [form.product_id, form.from_warehouse, stockRows])

  const submit = () => {
    if (!parseInt(form.product_id))                     { showToast('Please select a product', 'error'); return }
    if (!parseInt(form.from_warehouse))                 { showToast('Please select a source warehouse', 'error'); return }
    if (!parseInt(form.to_warehouse))                   { showToast('Please select a destination warehouse', 'error'); return }
    if (form.from_warehouse === form.to_warehouse)      { showToast('Source and destination must differ', 'error'); return }
    if (!parseInt(form.qty) || parseInt(form.qty) < 1) { showToast('Enter a valid quantity (> 0)', 'error'); return }
    if (availableQty !== null && parseInt(form.qty) > availableQty) {
      showToast(`Insufficient stock — only ${availableQty} units available in source warehouse`, 'error'); return
    }
    setBusy(true)
    addTransfer({ product_id: parseInt(form.product_id), from_warehouse: parseInt(form.from_warehouse), to_warehouse: parseInt(form.to_warehouse), qty: parseInt(form.qty), status:'Scheduled' })
      .then(() => { showToast('Transfer scheduled', 'info'); setModal(false); setForm(EMPTY) })
      .catch(e => showToast(e?.response?.data?.message || 'Failed to create transfer', 'error'))
      .finally(() => setBusy(false))
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Internal Transfers"
        subtitle="Move stock between locations. Total stock unchanged — only location updated."
        action={<button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/>New Transfer</button>}
      />
      <DataTable headers={['Ref #','Product','From','','To','Qty','Status','Date','Action']}>
        {transfers.length===0 ? <EmptyRow icon="🔁" text="No transfers scheduled" cols={9}/> :
          transfers.map(t => (
            <tr key={t.transfer_id} className="table-row">
              <td className="table-td font-mono text-xs text-accent">TRF-{String(t.transfer_id).padStart(3,'0')}</td>
              <td className="table-td text-text font-medium">{t.product}</td>
              <td className="table-td text-dim text-sm">{t.from}</td>
              <td className="table-td text-muted"><ArrowRight size={13}/></td>
              <td className="table-td text-dim text-sm">{t.to}</td>
              <td className="table-td font-mono text-info font-semibold">{t.qty}</td>
              <td className="table-td"><Badge status={t.status}/></td>
              <td className="table-td text-dim text-xs">{t.date ? new Date(t.date).toLocaleDateString() : ''}</td>
              <td className="table-td">
                {t.status!=='Done'
                  ? <button onClick={() => validateTransfer(t.transfer_id).then(()=>showToast('Transfer completed','success')).catch(e=>showToast(e?.response?.data?.message||'Failed','error'))} className="text-xs text-success hover:underline font-mono flex items-center gap-1"><CheckCircle size={11}/>Complete</button>
                  : <span className="text-xs text-muted font-mono">Done ✓</span>
                }
              </td>
            </tr>
          ))
        }
      </DataTable>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Internal Transfer">
        <div className="space-y-4">
          <Field label="Product *">
            <select className="select-field w-full" value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})}>
              <option value="">Select product…</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="From *">
              <select className="select-field w-full" value={form.from_warehouse} onChange={e=>setForm({...form,from_warehouse:e.target.value})}>
                <option value="">Select warehouse…</option>
                {warehouses.map(w=><option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
              </select>
            </Field>
            <Field label="To *">
              <select className="select-field w-full" value={form.to_warehouse} onChange={e=>setForm({...form,to_warehouse:e.target.value})}>
                <option value="">Select warehouse…</option>
                {warehouses.map(w=><option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Quantity *">
            <input className="input-field" type="number" min="1" placeholder="30" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/>
            {availableQty !== null && (
              <p className={`text-xs mt-1 font-mono ${parseInt(form.qty||0) > availableQty ? 'text-danger font-semibold' : 'text-dim'}`}>
                {parseInt(form.qty||0) > availableQty
                  ? `⚠ Exceeds available stock (${availableQty})`
                  : `Available in source warehouse: ${availableQty}`}
              </p>
            )}
          </Field>
          <div className="bg-info/6 border border-info/15 rounded-lg p-3 text-xs text-dim font-mono">
            ℹ Total stock stays the same — only the location record is updated.
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            className="btn-primary flex-1 disabled:opacity-50"
            onClick={submit}
            disabled={busy || (availableQty !== null && parseInt(form.qty||0) > availableQty)}
          >{busy ? 'Saving...' : 'Schedule Transfer'}</button>
          <button className="btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
