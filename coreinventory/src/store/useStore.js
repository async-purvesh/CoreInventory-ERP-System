import { create } from 'zustand'
import * as authApi      from '../api/auth.api'
import * as inventoryApi from '../api/inventory.api'

// ── helpers ──────────────────────────────────────────────────────
function getApiMsg(error, fallback = 'Something went wrong') {
  return error?.response?.data?.message || error?.message || fallback
}

export const useStore = create((set, get) => ({

  // ── AUTH ─────────────────────────────────────────────────────
  user:  JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,

  loginAction: async ({ email, password }) => {
    const res = await authApi.loginApi({ email, password })
    const { user, token } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token })
    return { success: true }
  },

  registerAction: async ({ name, email, password, role }) => {
    const res = await authApi.registerApi({ name, email, password, role })
    const { user, token } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token })
    return { success: true }
  },

  verifySession: async () => {
    const token = get().token || localStorage.getItem('token')
    if (!token) {
      get().logout()
      return { valid: false }
    }

    try {
      const res = await authApi.getMeApi()
      const serverUser = res?.data?.data
      if (!serverUser?.user_id) {
        get().logout()
        return { valid: false }
      }

      localStorage.setItem('user', JSON.stringify(serverUser))
      set({ user: serverUser })
      return { valid: true, user: serverUser }
    } catch (_) {
      get().logout()
      return { valid: false }
    }
  },

  updateProfileAction: async ({ name, email, role, newPassword }) => {
    const payload = { name, email, role, newPassword }
    const res = await authApi.updateMeApi(payload)
    const updatedUser = res?.data?.data
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser))
      set({ user: updatedUser })
    }
    return updatedUser
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({
      user: null,
      token: null,
      warehouses: [],
      categories: [],
      products: [],
      stockRows: [],
      receipts: [],
      deliveries: [],
      transfers: [],
      adjustments: [],
    })
  },

  // ── LOADING ──────────────────────────────────────────────────
  loading: false,

  // ── WAREHOUSES ───────────────────────────────────────────────
  warehouses: [],
  fetchWarehouses: async () => {
    try {
      const userId = get().user?.user_id
      if (!userId) {
        set({ warehouses: [] })
        return
      }
      const res = await inventoryApi.getWarehousesApi(userId)
      set({ warehouses: res.data })
    } catch (_) { set({ warehouses: [] }) }
  },

  addWarehouse: async ({ name, location, manager }) => {
    const res = await inventoryApi.createWarehouseApi({ name, location, manager })
    const warehouseId = res?.data?.data?.warehouse_id
    const userId = get().user?.user_id

    if (warehouseId && userId) {
      try {
        await inventoryApi.assignWarehouseApi({ user_id: userId, warehouse_id: warehouseId })
      } catch (_) {
        // Keep warehouse creation successful even if assignment fails.
      }
    }

    await get().fetchWarehouses()
  },

  deleteWarehouse: async (warehouseId) => {
    await inventoryApi.deleteWarehouseApi(warehouseId)
    await get().fetchWarehouses()
  },

  // ── CATEGORIES ───────────────────────────────────────────────
  categories: [],
  fetchCategories: async () => {
    try {
      const res = await inventoryApi.getCategoriesApi()
      set({ categories: res.data })
    } catch (_) { /* silent */ }
  },

  addCategory: async ({ name }) => {
    await inventoryApi.createCategoryApi({ name })
    await get().fetchCategories()
  },

  deleteCategory: async (id) => {
    await inventoryApi.deleteCategoryApi(id)
    await get().fetchCategories()
  },

  // ── PRODUCTS ─────────────────────────────────────────────────
  products: [],
  fetchProducts: async () => {
    set({ loading: true })
    try {
      const res = await inventoryApi.getProductsApi()
      // Backend returns { id, name, sku, uom, cat, category_id, stock }
      // reorder defaults to 0 (not in schema)
      set({ products: res.data.map(p => ({ ...p, reorder: 0 })) })
    } catch (_) { /* silent */ }
    finally { set({ loading: false }) }
  },

  stockRows: [],
  fetchStock: async () => {
    try {
      const res = await inventoryApi.getStockApi()
      set({ stockRows: res.data })
    } catch (_) { /* silent */ }
  },

  addProduct: async ({ name, sku, category_id, uom, stock, warehouse_id }) => {
    // category_id is now passed directly from the form
    const resolvedCatId = category_id

    if (!resolvedCatId) throw new Error('Category not found — please select a valid category')

    // warehouse_id is a MongoDB ObjectId string, don't parseInt it
    const selectedWarehouse = warehouse_id
    if (!selectedWarehouse) {
      throw new Error('Please select a warehouse for this product')
    }

    const productRes = await inventoryApi.createProductApi({ name, sku, category_id: resolvedCatId, unit: uom })
    const created = productRes.data?.data

    // Always create a stock row in the selected warehouse so product visibility is scoped correctly.
    const parsedStock = parseInt(stock) || 0
    if (created) {
      await inventoryApi.createStockApi({
        product_id:  created.id,
        warehouse_id: selectedWarehouse,
        quantity:    parsedStock,
      })
    }
    await get().fetchProducts()
    await get().fetchStock()
  },

  deleteProduct: async (id) => {
    await inventoryApi.deleteProductApi(id)
    await get().fetchProducts()
    await get().fetchStock()
  },

  updateProduct: async (id, data) => {
    get().showToast('Edit not yet supported by backend', 'warning')
  },

  // ── RECEIPTS ─────────────────────────────────────────────────
  receipts: [],
  fetchReceipts: async () => {
    try {
      const res = await inventoryApi.getReceiptsApi()
      set({ receipts: res.data })
    } catch (_) { /* silent */ }
  },

  addReceipt: async ({ supplier, product_id, qty, warehouse_id, status }) => {
    const res = await inventoryApi.createReceiptApi({
      supplier_name: supplier,
      product_id,
      quantity:      qty,
      warehouse_id,
      status,
    })
    await get().fetchReceipts()
    await get().fetchProducts()
    await get().fetchStock()
    return res.data?.data?.receipt_id
  },

  validateReceipt: async (receiptId) => {
    await inventoryApi.validateReceiptApi(receiptId)
    await get().fetchReceipts()
    await get().fetchProducts()
    await get().fetchStock()
  },

  // ── DELIVERIES ───────────────────────────────────────────────
  deliveries: [],
  fetchDeliveries: async () => {
    try {
      const res = await inventoryApi.getDeliveriesApi()
      set({ deliveries: res.data })
    } catch (_) { /* silent */ }
  },

  addDelivery: async ({ customer, product_id, qty, warehouse_id, status }) => {
    const res = await inventoryApi.createDeliveryApi({
      customer_name: customer,
      product_id,
      quantity:      qty,
      warehouse_id,
      status,
    })
    await get().fetchDeliveries()
    await get().fetchProducts()
    await get().fetchStock()
    return res.data?.data?.delivery_id
  },

  validateDelivery: async (deliveryId) => {
    await inventoryApi.validateDeliveryApi(deliveryId)
    await get().fetchDeliveries()
    await get().fetchProducts()
    await get().fetchStock()
  },

  // ── TRANSFERS ────────────────────────────────────────────────
  transfers: [],
  fetchTransfers: async () => {
    try {
      const res = await inventoryApi.getTransfersApi()
      set({ transfers: res.data })
    } catch (_) { /* silent */ }
  },

  addTransfer: async ({ product_id, from_warehouse, to_warehouse, qty, status }) => {
    const res = await inventoryApi.createTransferApi({
      product_id,
      from_warehouse,
      to_warehouse,
      quantity: qty,
      status,
    })
    await get().fetchTransfers()
    return res.data?.data?.transfer_id
  },

  validateTransfer: async (transferId) => {
    await inventoryApi.validateTransferApi(transferId)
    await get().fetchTransfers()
    await get().fetchProducts()
    await get().fetchStock()
  },

  // ── ADJUSTMENTS ──────────────────────────────────────────────
  adjustments: [],
  fetchAdjustments: async () => {
    try {
      const res = await inventoryApi.getAdjustmentsApi()
      set({ adjustments: res.data })
    } catch (_) { /* silent */ }
  },

  addAdjustment: async ({ product_id, warehouse_id, new_quantity, reason }) => {
    await inventoryApi.adjustStockApi({ product_id, warehouse_id, new_quantity, reason })
    await get().fetchAdjustments()
    await get().fetchProducts()
    await get().fetchStock()
  },

  // ── TOAST ────────────────────────────────────────────────────
  toast: null,
  showToast: (msg, type = 'info') => {
    set({ toast: { msg, type, id: Date.now() } })
    setTimeout(() => set({ toast: null }), 3200)
  },

  // ── BOOTSTRAP  (call once on app init) ───────────────────────
  bootstrap: async () => {
    const verify = await get().verifySession()
    if (!verify.valid) return

    const { fetchWarehouses, fetchCategories, fetchProducts,
            fetchStock, fetchReceipts, fetchDeliveries, fetchTransfers, fetchAdjustments } = get()
    await Promise.all([
      fetchWarehouses(),
      fetchCategories(),
      fetchProducts(),
      fetchStock(),
      fetchReceipts(),
      fetchDeliveries(),
      fetchTransfers(),
      fetchAdjustments(),
    ])
  },
}))



