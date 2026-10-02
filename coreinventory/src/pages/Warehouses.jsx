import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Modal, Field, DataTable, EmptyRow, PageHeader } from '../components/UI'
import { Plus, Trash2 } from 'lucide-react'

const EMPTY = { name: '', location: '', manager: '' }

export default function Warehouses() {
  const { user, warehouses, fetchWarehouses, addWarehouse, deleteWarehouse, showToast } = useStore()
  const [modal, setModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ ...EMPTY, manager: user?.name || '' })
  const [blockedProducts, setBlockedProducts] = useState([])

  useEffect(() => { fetchWarehouses() }, [])

  const openCreate = () => {
    setForm({ ...EMPTY, manager: user?.name || '' })
    setModal(true)
  }

  const submit = () => {
    if (!form.name.trim() || !form.location.trim() || !form.manager.trim()) {
      showToast('Name, location and manager are required', 'error')
      return
    }

    setBusy(true)
    addWarehouse({
      name: form.name.trim(),
      location: form.location.trim(),
      manager: form.manager.trim(),
    })
      .then(() => {
        showToast('Warehouse created', 'success')
        setModal(false)
      })
      .catch(e => showToast(e?.response?.data?.message || 'Failed to create warehouse', 'error'))
      .finally(() => setBusy(false))
  }

  const removeWarehouse = (w) => {
    if (!window.confirm(`Delete warehouse "${w.name}"?`)) return

    deleteWarehouse(w.warehouse_id)
      .then(() => showToast('Warehouse deleted', 'success'))
      .catch(e => {
        const payload = e?.response?.data
        if (payload?.products?.length) {
          setBlockedProducts(payload.products)
        }
        showToast(payload?.message || 'Failed to delete warehouse', 'error')
      })
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Warehouses"
        subtitle="Create and manage your own warehouses. Deletion is allowed only when no stock is available."
        action={<button className="btn-primary" onClick={openCreate}><Plus size={14}/>New Warehouse</button>}
      />

      <DataTable headers={['ID', 'Name', 'Location', 'Manager', 'Actions']}>
        {warehouses.length === 0
          ? <EmptyRow icon="🏬" text="No warehouses found" cols={5} />
          : warehouses.map(w => (
            <tr key={w.warehouse_id} className="table-row">
              <td className="table-td font-mono text-xs text-accent">WH-{String(w.warehouse_id).padStart(3, '0')}</td>
              <td className="table-td text-text font-medium">{w.name}</td>
              <td className="table-td text-dim text-sm">{w.location}</td>
              <td className="table-td text-dim text-sm">{w.manager}</td>
              <td className="table-td">
                <button
                  onClick={() => removeWarehouse(w)}
                  className="text-xs text-danger hover:underline font-mono flex items-center gap-1"
                >
                  <Trash2 size={10}/> Delete
                </button>
              </td>
            </tr>
          ))}
      </DataTable>

      <Modal open={modal} onClose={() => setModal(false)} title="New Warehouse">
        <div className="space-y-4">
          <Field label="Name *">
            <input className="input-field" placeholder="e.g. Main Warehouse" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Location *">
            <input className="input-field" placeholder="e.g. Pune" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Manager *">
            <input className="input-field" placeholder="e.g. Rahul Sharma" value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} />
          </Field>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={submit} disabled={busy}>{busy ? 'Saving...' : 'Create Warehouse'}</button>
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
        </div>
      </Modal>

      <Modal open={blockedProducts.length > 0} onClose={() => setBlockedProducts([])} title="Cannot Delete Warehouse">
        <div className="space-y-3">
          <p className="text-sm text-dim">This warehouse still has stock. Remove/move these quantities first:</p>
          <DataTable headers={['Product', 'SKU', 'Quantity']}>
            {blockedProducts.map((p, idx) => (
              <tr key={`${p.product_id}-${idx}`} className="table-row">
                <td className="table-td text-text">{p.product}</td>
                <td className="table-td font-mono text-xs text-accent">{p.sku || '-'}</td>
                <td className="table-td font-mono text-warning font-semibold">{p.quantity}</td>
              </tr>
            ))}
          </DataTable>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={() => setBlockedProducts([])}>OK</button>
        </div>
      </Modal>
    </div>
  )
}
