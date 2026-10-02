// import { useState } from 'react'
// import { useStore } from '../store/useStore'
// import { Modal, Field, Badge, DataTable, EmptyRow, PageHeader } from '../components/UI'
// import { Plus, CheckCircle, Download, useEffect } from 'lucide-react'

// const STEPS = ['Pick','Pack','Validate']

// export default function Delivery() {
//   const { deliveries, products, addDelivery, validateDelivery, advanceStep, showToast } = useStore()
//   const [modal, setModal] = useState(false)
//   const [form, setForm]   = useState({ customer:'', product:'', qty:'', step:'Pick' })

//   const submit = () => {
//     if (!form.customer.trim()||!form.product||!form.qty) { showToast('Customer, product and qty required','error'); return }
//     const ref = addDelivery({ ...form, qty:parseInt(form.qty) })
//     showToast(`Delivery order ${ref} created`,'success')
//     setModal(false)
//     setForm({ customer:'', product:'', qty:'', step:'Pick' })
//   }

//   return (
//     <div className="p-6 space-y-5 animate-fade-in">
//       <PageHeader
//         title="Delivery Orders — Outgoing"
//         subtitle="Pick → Pack → Validate. Stock decreases on validation."
//         action={<button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/>New Delivery</button>}
//       />
//       <DataTable headers={['Ref #','Customer','Product','Qty','Step','Status','Date','Actions']}>
//         {deliveries.length===0 ? <EmptyRow icon="📤" text="No delivery orders" cols={8}/> :
//           deliveries.map(d => {
//             const si = STEPS.indexOf(d.step)
//             return (
//               <tr key={d.ref} className="table-row">
//                 <td className="table-td font-mono text-xs text-accent">{d.ref}</td>
//                 <td className="table-td text-text font-medium">{d.customer}</td>
//                 <td className="table-td text-dim text-sm">{d.product}</td>
//                 <td className="table-td font-mono text-danger font-semibold">-{d.qty}</td>
//                 <td className="table-td">
//                   <div className="flex items-center gap-1">
//                     {STEPS.map((s,i)=>(
//                       <span key={s} className={`text-xs font-mono px-1.5 py-0.5 rounded transition-colors
//                         ${i<=si?'bg-accent/15 text-accentLt':'bg-border/40 text-muted'}`}>{s}</span>
//                     ))}
//                   </div>
//                 </td>
//                 <td className="table-td"><Badge status={d.status}/></td>
//                 <td className="table-td text-dim text-xs">{d.date}</td>
//                 <td className="table-td">
//                   {d.status!=='Done' ? (
//                     <div className="flex items-center gap-2">
//                       {si<2 && <button onClick={()=>{ advanceStep(d.ref); showToast('Step advanced','info') }} className="text-xs text-info hover:underline font-mono flex items-center gap-0.5"><ChevronRight size={11}/>Next</button>}
//                       <button onClick={()=>{ validateDelivery(d.ref); showToast(`${d.ref} validated`,'success') }} className="text-xs text-success hover:underline font-mono flex items-center gap-0.5"><CheckCircle size={11}/>Validate</button>
//                     </div>
//                   ) : <span className="text-xs text-muted font-mono">Shipped ✓</span>}
//                 </td>
//               </tr>
//             )
//           })
//         }
//       </DataTable>

//       <Modal open={modal} onClose={()=>setModal(false)} title="New Delivery Order">
//         <div className="space-y-4">
//           <Field label="Customer *"><input className="input-field" placeholder="e.g. Tata Motors" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/></Field>
//           <Field label="Product *">
//             <select className="select-field w-full" value={form.product} onChange={e=>setForm({...form,product:e.target.value})}>
//               <option value="">Select product…</option>
//               {products.map(p=><option key={p.id}>{p.name}</option>)}
//             </select>
//           </Field>
//           <div className="grid grid-cols-2 gap-4">
//             <Field label="Quantity *"><input className="input-field" type="number" placeholder="10" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></Field>
//             <Field label="Starting Step">
//               <select className="select-field w-full" value={form.step} onChange={e=>setForm({...form,step:e.target.value})}>
//                 {STEPS.map(s=><option key={s}>{s}</option>)}
//               </select>
//             </Field>
//           </div>
//         </div>
//         <div className="flex gap-3 mt-6">
//           <button className="btn-primary flex-1" onClick={submit}>Create Order</button>
//           <button className="btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
//         </div>
//       </Modal>
//     </div>
//   )
// }



import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Modal, Field, Badge, DataTable, EmptyRow, PageHeader } from '../components/UI'
import { Plus, CheckCircle, Download } from 'lucide-react'

const STEPS = ['Pick','Pack','Validate']

const downloadDelivery = (d) => {
  const content = `
COREINVENTORY — DELIVERY ORDER VOUCHER
=======================================
Ref #      : DLV-${String(d.delivery_id).padStart(3,'0')}
Date       : ${d.date ? new Date(d.date).toLocaleDateString() : ''}
Customer   : ${d.customer}
Product    : ${d.product}
Quantity   : -${d.qty}
Step       : ${d.step}
Status     : ${d.status}
=======================================
This delivery order has been validated.
  `.trim()

  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `DLV-${String(d.delivery_id).padStart(3,'0')}-delivery.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Delivery() {
    const { deliveries, products, warehouses, stockRows,
      addDelivery, validateDelivery, showToast,
      fetchDeliveries, fetchProducts, fetchWarehouses, fetchStock } = useStore()
  const [modal, setModal] = useState(false)
  const [busy,  setBusy]  = useState(false)
  const EMPTY = { customer:'', product_id:'', qty:'', warehouse_id:'', status:'Draft' }
  const [form, setForm]   = useState(EMPTY)

  useEffect(() => { fetchDeliveries(); fetchProducts(); fetchWarehouses(); fetchStock() }, [])

  // Products with stock in the selected warehouse (for filtered dropdown)
  const availableProducts = useMemo(() => {
    if (!form.warehouse_id) return []
    const whId = parseInt(form.warehouse_id)
    const ids = new Set(stockRows.filter(r => r.warehouse_id === whId && r.quantity > 0).map(r => r.product_id))
    return products.filter(p => ids.has(p.id))
  }, [form.warehouse_id, products, stockRows])

  // Available qty for selected product+warehouse combo
  const availableQty = useMemo(() => {
    if (!form.product_id || !form.warehouse_id) return null
    const row = stockRows.find(r => r.product_id === parseInt(form.product_id) && r.warehouse_id === parseInt(form.warehouse_id))
    return row ? row.quantity : 0
  }, [form.product_id, form.warehouse_id, stockRows])

  const submit = () => {
    if (!form.customer.trim())                          { showToast('Customer name is required', 'error'); return }
    if (!parseInt(form.warehouse_id))                   { showToast('Please select a warehouse', 'error'); return }
    if (!parseInt(form.product_id))                     { showToast('Please select a product', 'error'); return }
    if (!parseInt(form.qty) || parseInt(form.qty) < 1) { showToast('Enter a valid quantity (> 0)', 'error'); return }
    if (availableQty !== null && parseInt(form.qty) > availableQty) {
      showToast(`Insufficient stock — only ${availableQty} units available in this warehouse`, 'error'); return
    }
    setBusy(true)
    addDelivery({ customer: form.customer, product_id: parseInt(form.product_id), qty: parseInt(form.qty), warehouse_id: parseInt(form.warehouse_id), status: form.status })
      .then(() => { showToast('Delivery order created', 'success'); setModal(false); setForm(EMPTY) })
      .catch(e => showToast(e?.response?.data?.message || 'Failed to create delivery', 'error'))
      .finally(() => setBusy(false))
  }

  const validate = (d) => {
    validateDelivery(d.delivery_id)
      .then(() => showToast('Delivery validated — stock updated', 'success'))
      .catch(e => showToast(e?.response?.data?.message || 'Validation failed', 'error'))
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Delivery Orders — Outgoing"
        subtitle="Pick → Pack → Validate. Stock decreases on validation."
        action={<button className="btn-primary" onClick={()=>setModal(true)}><Plus size={14}/>New Delivery</button>}
      />
      <DataTable headers={['Ref #','Customer','Product','Qty','Step','Status','Date','Actions','Download']}>
        {deliveries.length===0 ? <EmptyRow icon="📤" text="No delivery orders" cols={9}/> :
          deliveries.map(d => (
            <tr key={d.delivery_id} className="table-row">
              <td className="table-td font-mono text-xs text-accent">DLV-{String(d.delivery_id).padStart(3,'0')}</td>
              <td className="table-td text-text font-medium">{d.customer}</td>
              <td className="table-td text-dim text-sm">{d.product}</td>
              <td className="table-td font-mono text-danger font-semibold">-{d.qty}</td>
              <td className="table-td text-dim text-sm">{d.wh}</td>
              <td className="table-td"><Badge status={d.status}/></td>
              <td className="table-td text-dim text-xs">{d.date ? new Date(d.date).toLocaleDateString() : ''}</td>

              <td className="table-td">
                {d.status !== 'Done'
                  ? <button onClick={() => validate(d)} className="text-xs text-success hover:underline font-mono flex items-center gap-1"><CheckCircle size={11}/>Validate</button>
                  : <span className="text-xs text-muted font-mono">Shipped ✓</span>
                }
              </td>
              <td className="table-td">
                <button onClick={() => d.status === 'Done' ? downloadDelivery(d) : null}
                  className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded ${d.status === 'Done' ? 'text-accent hover:underline cursor-pointer' : 'text-muted cursor-not-allowed opacity-50'}`}>
                  <Download size={12}/> PDF
                </button>
              </td>
            </tr>
          ))
        }
      </DataTable>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Delivery Order">
        <div className="space-y-4">
          <Field label="Customer *">
            <input className="input-field" placeholder="e.g. Tata Motors" value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})}/>
          </Field>
          <Field label="Warehouse *">
            <select className="select-field w-full" value={form.warehouse_id} onChange={e=>setForm({...form,warehouse_id:e.target.value,product_id:''})}>
              <option value="">Select warehouse…</option>
              {warehouses.map(w=><option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
            </select>
          </Field>
          <Field label="Product *">
            <select className="select-field w-full" value={form.product_id} onChange={e=>setForm({...form,product_id:e.target.value})} disabled={!form.warehouse_id}>
              <option value="">{form.warehouse_id ? (availableProducts.length ? 'Select product…' : 'No products with stock') : 'Select warehouse first…'}</option>
              {availableProducts.map(p => {
                const row = stockRows.find(r => r.product_id === p.id && r.warehouse_id === parseInt(form.warehouse_id))
                return <option key={p.id} value={p.id}>{p.name} — stock: {row?.quantity ?? 0} {p.uom}</option>
              })}
            </select>
          </Field>
          <Field label="Quantity *">
            <input className="input-field" type="number" min="1" placeholder="10" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/>
            {availableQty !== null && (
              <p className={`text-xs mt-1 font-mono ${parseInt(form.qty||0) > availableQty ? 'text-danger font-semibold' : 'text-dim'}`}>
                {parseInt(form.qty||0) > availableQty
                  ? `⚠ Exceeds available stock (${availableQty})`
                  : `Available in warehouse: ${availableQty}`}
              </p>
            )}
          </Field>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            className="btn-primary flex-1 disabled:opacity-50"
            onClick={submit}
            disabled={busy || (availableQty !== null && parseInt(form.qty||0) > availableQty)}
          >{busy ? 'Saving...' : 'Create Order'}</button>
          <button className="btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  )
}