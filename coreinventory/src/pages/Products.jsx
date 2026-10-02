import { useState, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Modal, Field, DataTable, EmptyRow, PageHeader } from '../components/UI'
import { Plus, Pencil, Trash2, Search, Tag, X } from 'lucide-react'
import clsx from 'clsx'

const UOMS = ['pcs','kg','ltr','mtr','box','roll']
const EMPTY = { name:'', sku:'', category_id:'', uom:'pcs', stock:'', reorder:'' }

function StockBadge({ p }) {
  if (p.stock===0)        return <span className="badge badge-out">Out</span>
  if (p.stock<=p.reorder) return <span className="badge badge-low">Low</span>
  return <span className="badge badge-ok">OK</span>
}

export default function Products() {
  const {
    products, stockRows, warehouses, categories,
    addProduct, updateProduct, deleteProduct,
    addCategory, deleteCategory, fetchCategories,
    showToast, fetchProducts, fetchStock, fetchWarehouses,
  } = useStore()

  const [modal, setModal]           = useState(false)
  const [catModal, setCatModal]     = useState(false)
  const [editId, setEditId]         = useState(null)
  const [form, setForm]             = useState({ ...EMPTY, warehouse_id:'' })
  const [q, setQ]                   = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [view, setView]             = useState('product')
  const [newCatName, setNewCatName] = useState('')
  const [catLoading, setCatLoading] = useState(false)

  useEffect(() => { fetchProducts(); fetchStock(); fetchWarehouses(); fetchCategories() }, [])

  // Warehouse breakdown per product_id → [{warehouse, qty}]
  const warehousesByProduct = useMemo(() => {
    const map = {}
    stockRows.forEach(r => {
      if (!map[r.product_id]) map[r.product_id] = []
      map[r.product_id].push({ warehouse: r.warehouse, qty: r.quantity })
    })
    return map
  }, [stockRows])

  const filtered = products.filter(p => {
    const mq = !q         || p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase())
    const mc = !catFilter || p.category_id === catFilter
    return mq && mc
  })

  const groupedRows = stockRows.filter(r => {
    const name = (r.product || '').toLowerCase()
    return !q || name.includes(q.toLowerCase())
  })

  const openCreate = () => { setEditId(null); setForm({ ...EMPTY, category_id: categories[0]?.category_id || '', warehouse_id:'' }); setModal(true) }
  const openEdit   = p  => { setEditId(p.id); setForm({ ...p, category_id: p.category_id }); setModal(true) }

  const submit = () => {
    if (!form.name.trim() || !form.sku.trim()) { showToast('Name and SKU required','error'); return }
    if (!editId && !form.category_id) { showToast('Please select a category','error'); return }
    if (!editId && !form.warehouse_id) { showToast('Please select a warehouse','error'); return }
    if (editId) {
      updateProduct(editId, { ...form, stock: parseInt(form.stock)||0, reorder: parseInt(form.reorder)||0 })
      showToast('Product updated','info')
      setModal(false)
    } else {
      addProduct(form)
        .then(() => { showToast(`Created: ${form.name}`, 'success'); setModal(false) })
        .catch(e => showToast(e?.response?.data?.message || e?.message || 'Failed to create product', 'error'))
    }
  }

  const handleAddCategory = async () => {
    const name = newCatName.trim()
    if (!name) { showToast('Category name required','error'); return }
    setCatLoading(true)
    try {
      await addCategory({ name })
      showToast(`Category "${name}" added`, 'success')
      setNewCatName('')
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to add category', 'error')
    } finally { setCatLoading(false) }
  }

  const handleDeleteCategory = async (cat) => {
    setCatLoading(true)
    try {
      await deleteCategory(cat.category_id)
      showToast(`Category "${cat.name}" deleted`, 'success')
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to delete category', 'error')
    } finally { setCatLoading(false) }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <PageHeader
        title="Products"
        subtitle="Manage product catalogue and stock levels"
        action={
          <div className="flex gap-2">
            <button className="btn-ghost flex items-center gap-1.5 text-sm" onClick={() => setCatModal(true)}>
              <Tag size={14}/> Categories
            </button>
            <button className="btn-primary" onClick={openCreate}><Plus size={14}/>New Product</button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/>
          <input
            className="input-field pl-8 py-2 w-64 text-sm"
            placeholder="Search name or SKU…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <select className="select-field text-sm py-2" value={view} onChange={e => setView(e.target.value)}>
          <option value="product">By Product</option>
          <option value="warehouse">By Product + Warehouse</option>
        </select>
        <select className="select-field text-sm py-2" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
        </select>
      </div>

      {/* Products Table */}
      {view === 'product' && (
        <DataTable headers={['SKU','Name','Category','UoM','Stock','Locations','Min. Stock','Status','Actions']}>
          {filtered.length === 0
            ? <EmptyRow icon="📦" text="No products found" cols={9}/>
            : filtered.map(p => (
              <tr key={p.id} className="table-row">
                <td className="table-td font-mono text-xs text-accent">{p.sku}</td>
                <td className="table-td text-text font-medium">{p.name}</td>
                <td className="table-td text-dim text-sm">{p.cat}</td>
                <td className="table-td text-dim text-sm">{p.uom}</td>
                <td className="table-td">
                  <span className={clsx('font-mono font-semibold', p.stock===0?'text-danger':p.stock<=p.reorder?'text-warning':'text-success')}>
                    {p.stock}
                  </span>
                  <span className="text-muted text-xs ml-1">{p.uom}</span>
                </td>
                <td className="table-td">
                  {(warehousesByProduct[p.id] || []).length === 0 ? (
                    <span className="text-xs text-muted">—</span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {(warehousesByProduct[p.id] || []).map((loc, i) => (
                        <span key={i} className="text-xs font-mono text-dim">
                          {loc.warehouse}: <span className="text-text font-semibold">{loc.qty}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="table-td font-mono text-dim text-sm">{p.reorder}</td>
                <td className="table-td"><StockBadge p={p}/></td>
                <td className="table-td">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(p)} className="text-xs text-accentLt hover:underline font-mono flex items-center gap-1"><Pencil size={10}/>Edit</button>
                    <button
                      onClick={() =>
                        deleteProduct(p.id)
                          .then(() => showToast('Product deleted','success'))
                          .catch(e => showToast(e?.response?.data?.message || 'Failed to delete product','error'))
                      }
                      className="text-xs text-danger hover:underline font-mono flex items-center gap-1"
                    ><Trash2 size={10}/>Del</button>
                  </div>
                </td>
              </tr>
            ))
          }
        </DataTable>
      )}

      {/* Product + Warehouse Table */}
      {view === 'warehouse' && (
        <DataTable headers={['Product','SKU','Warehouse','Qty','UoM']}>
          {groupedRows.length === 0
            ? <EmptyRow icon="🏬" text="No product stock rows found" cols={5}/>
            : groupedRows.map(r => (
              <tr key={r.stock_id} className="table-row">
                <td className="table-td text-text font-medium">{r.product}</td>
                <td className="table-td font-mono text-xs text-accent">{products.find(p => p.id === r.product_id)?.sku || '-'}</td>
                <td className="table-td text-dim text-sm">{r.warehouse}</td>
                <td className="table-td font-mono text-info font-semibold">{r.quantity}</td>
                <td className="table-td text-dim text-sm">{products.find(p => p.id === r.product_id)?.uom || '-'}</td>
              </tr>
            ))
          }
        </DataTable>
      )}

      {/* ── Create / Edit Product Modal ── */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Product' : 'New Product'}>
        <div className="space-y-4">
          <Field label="Product Name *">
            <input className="input-field" placeholder="e.g. Steel Rods 10mm" value={form.name} onChange={e => setForm({...form, name:e.target.value})}/>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SKU / Code *">
              <input className="input-field" placeholder="STL-010" value={form.sku} onChange={e => setForm({...form, sku:e.target.value})}/>
            </Field>
            <Field label="Unit of Measure">
              <select className="select-field w-full" value={form.uom} onChange={e => setForm({...form, uom:e.target.value})}>
                {UOMS.map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <select className="select-field w-full" value={form.category_id} onChange={e => setForm({...form, category_id:e.target.value})}>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Initial Stock">
              <input className="input-field" type="number" placeholder="0" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})}/>
            </Field>
          </div>
          <Field label="Warehouse for Initial Stock">
            <select className="select-field w-full" value={form.warehouse_id} onChange={e => setForm({...form, warehouse_id:e.target.value})}>
              <option value="">Select warehouse…</option>
              {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
            </select>
          </Field>
          <Field label="Reorder Point (Min)">
            <input className="input-field" type="number" placeholder="20" value={form.reorder} onChange={e => setForm({...form, reorder:e.target.value})}/>
          </Field>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn-primary flex-1" onClick={submit}>{editId ? 'Save Changes' : 'Create Product'}</button>
          <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
        </div>
      </Modal>

      {/* ── Manage Categories Modal ── */}
      <Modal open={catModal} onClose={() => { setCatModal(false); setNewCatName('') }} title="Manage Categories">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="input-field flex-1 text-sm"
              placeholder="New category name…"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              disabled={catLoading}
            />
            <button
              className="btn-primary px-4 text-sm whitespace-nowrap flex items-center gap-1"
              onClick={handleAddCategory}
              disabled={catLoading}
            >
              <Plus size={14}/> Add
            </button>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            {categories.length === 0 ? (
              <div className="py-8 text-center text-muted text-sm">No categories yet</div>
            ) : (
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat.category_id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-accent"/>
                      <span className="text-sm text-text font-medium">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      disabled={catLoading}
                      className="flex items-center gap-1 text-xs text-danger hover:text-danger/80 font-mono transition-colors disabled:opacity-40"
                    >
                      <X size={13}/> Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted">Categories with assigned products cannot be deleted.</p>
        </div>
        <div className="mt-4">
          <button className="btn-ghost w-full" onClick={() => { setCatModal(false); setNewCatName('') }}>Close</button>
        </div>
      </Modal>
    </div>
  )
}
