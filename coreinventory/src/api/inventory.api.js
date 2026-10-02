import client from './client'

// Warehouses
export const getWarehousesApi  = (userId) => client.get('/inventory/warehouses', { params: userId ? { user_id: userId } : undefined })
export const createWarehouseApi = (data) => client.post('/inventory/warehouses', data)
export const deleteWarehouseApi = (id)   => client.delete(`/inventory/warehouses/${id}`)
export const assignWarehouseApi = (data) => client.post('/inventory/assign-warehouse', data)

// Categories
export const getCategoriesApi   = ()     => client.get('/inventory/categories')
export const createCategoryApi  = (data) => client.post('/inventory/categories', data)
export const deleteCategoryApi  = (id)   => client.delete(`/inventory/categories/${id}`)

// Products  (returns with aggregated stock)
export const getProductsApi     = ()     => client.get('/inventory/products')
export const createProductApi   = (data) => client.post('/inventory/products', data)
export const getProductBySkuApi = (sku)  => client.get(`/inventory/products/sku/${sku}`)
export const deleteProductApi   = (id)   => client.delete(`/inventory/products/${id}`)

// Stock
export const getStockApi        = ()     => client.get('/inventory/stock')
export const createStockApi     = (data) => client.post('/inventory/stock', data)

// Receipts   — create sends product_id+quantity in same call
export const getReceiptsApi     = ()     => client.get('/inventory/receipts')
export const createReceiptApi   = (data) => client.post('/inventory/receipts', data)
export const validateReceiptApi = (id)   => client.put(`/inventory/receipts/${id}/validate`)

// Deliveries
export const getDeliveriesApi     = ()     => client.get('/inventory/deliveries')
export const createDeliveryApi    = (data) => client.post('/inventory/deliveries', data)
export const validateDeliveryApi  = (id)   => client.put(`/inventory/deliveries/${id}/validate`)

// Transfers
export const getTransfersApi      = ()     => client.get('/inventory/transfers')
export const createTransferApi    = (data) => client.post('/inventory/transfers', data)
export const validateTransferApi  = (id)   => client.put(`/inventory/transfers/${id}/validate`)

// Adjustments
export const getAdjustmentsApi    = ()     => client.get('/inventory/adjustments')
export const adjustStockApi       = (data) => client.post('/inventory/adjustments', data)
