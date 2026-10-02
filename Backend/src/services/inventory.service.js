const mongoose = require('mongoose');
const {
  createWarehouse,
  getWarehouses,
  assignWarehouse,
  getUserWarehouses,
  createCategory,
  getCategories,
  createProduct,
  getProductsWithStock,
  createStock,
  getStock,
  createReceiptWithItem,
  getReceipts,
  validateReceipt,
  createDeliveryWithItem,
  getDeliveries,
  validateDelivery,
  createTransferWithItem,
  getTransfers,
  validateTransfer,
  getAdjustments,
  getProductStockQuantity,
  adjustStockQuantity,
  findProductBySku,
  getProductTotalStock,
  deleteProductById,
  getWarehouseTotalStock,
  getWarehouseStockDetails,
  deleteWarehouseById,
  getCategoryProductCount,
  deleteCategoryById,
} = require('../repositories/inventory.repository');

function toCleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parsePositiveInt(value) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null;
  }
  return numberValue;
}

function parseNonNegativeInt(value) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    return null;
  }
  return numberValue;
}

// Validate MongoDB ObjectId string
function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function mapDbError(error, fallbackMessage) {
  // Mongoose duplicate key error
  if (error && error.code === 11000) {
    return { statusCode: 409, message: 'record already exists' };
  }

  // Mongoose validation error
  if (error && error.name === 'ValidationError') {
    return { statusCode: 400, message: 'invalid reference id provided' };
  }

  // Mongoose CastError (invalid ObjectId)
  if (error && error.name === 'CastError') {
    return { statusCode: 400, message: 'invalid reference id provided' };
  }

  return { statusCode: 500, message: fallbackMessage };
}

async function createWarehouseService({ name, location, manager }) {
  const cleanName = toCleanString(name);
  const cleanLocation = toCleanString(location);
  const cleanManager = toCleanString(manager);

  if (!cleanName || !cleanLocation || !cleanManager) {
    return { statusCode: 400, message: 'name, location and manager are required' };
  }

  try {
    const warehouse = await createWarehouse({
      name: cleanName,
      location: cleanLocation,
      manager: cleanManager,
    });

    return { statusCode: 201, message: 'warehouse created successfully', data: warehouse };
  } catch (error) {
    return mapDbError(error, 'failed to create warehouse');
  }
}

async function getWarehousesService({ user_id } = {}) {
  const userId = toCleanString(user_id);
  const warehouses = await getWarehouses(userId);
  return { statusCode: 200, data: warehouses };
}

async function assignWarehouseService({ user_id, warehouse_id }) {
  const userId = toCleanString(user_id);
  const warehouseId = toCleanString(warehouse_id);

  if (!userId || !warehouseId || !isValidObjectId(warehouseId)) {
    return { statusCode: 400, message: 'user_id and warehouse_id are required' };
  }

  try {
    const assignment = await assignWarehouse({ userId, warehouseId });
    return { statusCode: 201, message: 'warehouse assigned successfully', data: assignment };
  } catch (error) {
    if (error && error.code === 11000) {
      return { statusCode: 409, message: 'warehouse already assigned to this user' };
    }

    return mapDbError(error, 'failed to assign warehouse');
  }
}

async function getUserWarehousesService() {
  const rows = await getUserWarehouses();
  return { statusCode: 200, data: rows };
}

async function createCategoryService({ name }) {
  const cleanName = toCleanString(name);

  if (!cleanName) {
    return { statusCode: 400, message: 'name is required' };
  }

  try {
    const category = await createCategory({ name: cleanName });
    return { statusCode: 201, message: 'category created successfully', data: category };
  } catch (error) {
    return mapDbError(error, 'failed to create category');
  }
}

async function getCategoriesService() {
  const categories = await getCategories();
  return { statusCode: 200, data: categories };
}

async function deleteCategoryService({ category_id }) {
  const categoryId = toCleanString(category_id);
  if (!categoryId || !isValidObjectId(categoryId)) return { statusCode: 400, message: 'valid category_id is required' };
  try {
    const count = await getCategoryProductCount(categoryId);
    if (count > 0) {
      return { statusCode: 409, message: `Cannot delete: ${count} product(s) are assigned to this category. Reassign or delete those products first.` };
    }
    await deleteCategoryById(categoryId);
    return { statusCode: 200, message: 'category deleted successfully' };
  } catch (error) {
    return mapDbError(error, 'failed to delete category');
  }
}

async function createProductService({ name, sku, category_id, unit }) {
  const cleanName = toCleanString(name);
  const cleanSku = toCleanString(sku);
  const cleanUnit = toCleanString(unit);
  const categoryId = toCleanString(category_id);

  if (!cleanName || !cleanSku || !categoryId || !isValidObjectId(categoryId) || !cleanUnit) {
    return { statusCode: 400, message: 'name, sku, category_id and unit are required' };
  }

  try {
    const product = await createProduct({
      name: cleanName,
      sku: cleanSku,
      categoryId,
      unit: cleanUnit,
    });

    return { statusCode: 201, message: 'product created successfully', data: product };
  } catch (error) {
    return mapDbError(error, 'failed to create product');
  }
}

async function getProductsWithStockService({ user_id } = {}) {
  const userId = toCleanString(user_id);
  const products = await getProductsWithStock(userId);
  return { statusCode: 200, data: products };
}

async function getProductsService() {
  return getProductsWithStockService();
}

async function createStockService({ product_id, warehouse_id, quantity }) {
  const productId = toCleanString(product_id);
  const warehouseId = toCleanString(warehouse_id);
  const parsedQuantity = parseNonNegativeInt(quantity);

  if (!productId || !isValidObjectId(productId) || !warehouseId || !isValidObjectId(warehouseId) || parsedQuantity === null) {
    return { statusCode: 400, message: 'product_id, warehouse_id and quantity are required' };
  }

  try {
    const stock = await createStock({ productId, warehouseId, quantity: parsedQuantity });
    return { statusCode: 201, message: 'stock created successfully', data: stock };
  } catch (error) {
    return mapDbError(error, 'failed to create stock');
  }
}

async function getStockService({ user_id } = {}) {
  const userId = toCleanString(user_id);
  const stockRows = await getStock(userId);
  return { statusCode: 200, data: stockRows };
}

async function createReceiptService({ supplier_name, warehouse_id, status, product_id, quantity }) {
  const supplierName = toCleanString(supplier_name);
  const warehouseId = toCleanString(warehouse_id);
  const cleanStatus = toCleanString(status);
  const productId = toCleanString(product_id);
  const parsedQty = parsePositiveInt(quantity);

  if (!supplierName || !warehouseId || !isValidObjectId(warehouseId) || !cleanStatus || !productId || !isValidObjectId(productId) || !parsedQty) {
    return { statusCode: 400, message: 'supplier_name, warehouse_id, status, product_id and quantity are required' };
  }

  try {
    const receipt = await createReceiptWithItem({
      supplierName, warehouseId, status: cleanStatus, productId, quantity: parsedQty,
    });
    return { statusCode: 201, message: 'receipt created successfully', data: receipt };
  } catch (error) {
    return mapDbError(error, 'failed to create receipt');
  }
}

async function getReceiptsService() {
  const rows = await getReceipts();
  return { statusCode: 200, data: rows };
}

async function validateReceiptService({ receipt_id }) {
  const receiptId = toCleanString(receipt_id);
  if (!receiptId || !isValidObjectId(receiptId)) return { statusCode: 400, message: 'receipt_id is required' };

  try {
    const result = await validateReceipt(receiptId);
    return { statusCode: 200, message: 'receipt validated and stock updated', data: result };
  } catch (error) {
    return { statusCode: error.statusCode || 500, message: error.message || 'failed to validate receipt' };
  }
}

async function createReceiptItemService({ receipt_id, product_id, quantity }) {
  return { statusCode: 400, message: 'use POST /receipts with product_id and quantity to create receipt with item' };
}

async function createDeliveryService({ customer_name, warehouse_id, status, product_id, quantity }) {
  const customerName = toCleanString(customer_name);
  const warehouseId = toCleanString(warehouse_id);
  const cleanStatus = toCleanString(status);
  const productId = toCleanString(product_id);
  const parsedQty = parsePositiveInt(quantity);

  if (!customerName || !warehouseId || !isValidObjectId(warehouseId) || !cleanStatus || !productId || !isValidObjectId(productId) || !parsedQty) {
    return { statusCode: 400, message: 'customer_name, warehouse_id, status, product_id and quantity are required' };
  }

  try {
    const delivery = await createDeliveryWithItem({
      customerName, warehouseId, status: cleanStatus, productId, quantity: parsedQty,
    });
    return { statusCode: 201, message: 'delivery created successfully', data: delivery };
  } catch (error) {
    return mapDbError(error, 'failed to create delivery');
  }
}

async function getDeliveriesService() {
  const rows = await getDeliveries();
  return { statusCode: 200, data: rows };
}

async function validateDeliveryService({ delivery_id }) {
  const deliveryId = toCleanString(delivery_id);
  if (!deliveryId || !isValidObjectId(deliveryId)) return { statusCode: 400, message: 'delivery_id is required' };

  try {
    const result = await validateDelivery(deliveryId);
    return { statusCode: 200, message: 'delivery validated and stock updated', data: result };
  } catch (error) {
    return { statusCode: error.statusCode || 500, message: error.message || 'failed to validate delivery' };
  }
}

async function createDeliveryItemService({ delivery_id, product_id, quantity }) {
  return { statusCode: 400, message: 'use POST /deliveries with product_id and quantity to create delivery with item' };
}

async function createTransferService({ from_warehouse, to_warehouse, status, product_id, quantity }) {
  const fromWarehouse = toCleanString(from_warehouse);
  const toWarehouse = toCleanString(to_warehouse);
  const cleanStatus = toCleanString(status);
  const productId = toCleanString(product_id);
  const parsedQty = parsePositiveInt(quantity);

  if (!fromWarehouse || !isValidObjectId(fromWarehouse) || !toWarehouse || !isValidObjectId(toWarehouse) || !cleanStatus || !productId || !isValidObjectId(productId) || !parsedQty) {
    return { statusCode: 400, message: 'from_warehouse, to_warehouse, status, product_id and quantity are required' };
  }

  if (fromWarehouse === toWarehouse) {
    return { statusCode: 400, message: 'from_warehouse and to_warehouse must be different' };
  }

  try {
    const transfer = await createTransferWithItem({
      fromWarehouse, toWarehouse, status: cleanStatus, productId, quantity: parsedQty,
    });
    return { statusCode: 201, message: 'transfer created successfully', data: transfer };
  } catch (error) {
    return mapDbError(error, 'failed to create transfer');
  }
}

async function getTransfersService() {
  const rows = await getTransfers();
  return { statusCode: 200, data: rows };
}

async function validateTransferService({ transfer_id }) {
  const transferId = toCleanString(transfer_id);
  if (!transferId || !isValidObjectId(transferId)) return { statusCode: 400, message: 'transfer_id is required' };

  try {
    const result = await validateTransfer(transferId);
    return { statusCode: 200, message: 'transfer completed and stock moved', data: result };
  } catch (error) {
    return { statusCode: error.statusCode || 500, message: error.message || 'failed to validate transfer' };
  }
}

async function createTransferItemService({ transfer_id, product_id, quantity }) {
  return { statusCode: 400, message: 'use POST /transfers with product_id and quantity to create transfer with item' };
}

async function getAdjustmentsService() {
  const rows = await getAdjustments();
  return { statusCode: 200, data: rows };
}

async function adjustStockService({ product_id, warehouse_id, new_quantity, reason }) {
  const productId = toCleanString(product_id);
  const warehouseId = toCleanString(warehouse_id);
  const newQuantity = parseNonNegativeInt(new_quantity);
  const cleanReason = toCleanString(reason);

  if (!productId || !isValidObjectId(productId) || !warehouseId || !isValidObjectId(warehouseId) || newQuantity === null || !cleanReason) {
    return { statusCode: 400, message: 'product_id, warehouse_id, new_quantity and reason are required' };
  }

  const stockRow = await getProductStockQuantity({ productId, warehouseId });
  if (!stockRow) {
    return {
      statusCode: 404,
      message: 'No stock record found for given product and warehouse',
    };
  }

  try {
    await adjustStockQuantity({
      productId,
      warehouseId,
      oldQuantity: stockRow.quantity,
      newQuantity,
      reason: cleanReason,
    });

    return { statusCode: 200, message: 'Stock adjusted successfully' };
  } catch (error) {
    return mapDbError(error, 'failed to adjust stock');
  }
}

async function getProductBySkuService({ sku }) {
  const cleanSku = toCleanString(sku);

  if (!cleanSku) {
    return { statusCode: 400, message: 'sku is required' };
  }

  const rows = await findProductBySku(cleanSku);
  if (!rows.length) {
    return { statusCode: 404, message: 'Product not found' };
  }

  return { statusCode: 200, data: rows };
}

async function deleteProductService({ product_id }) {
  const productId = toCleanString(product_id);
  if (!productId || !isValidObjectId(productId)) {
    return { statusCode: 400, message: 'valid product_id is required' };
  }

  try {
    const deleted = await deleteProductById(productId);
    if (!deleted) {
      return { statusCode: 404, message: 'product not found' };
    }
    return { statusCode: 200, message: 'product deleted successfully' };
  } catch (error) {
    return mapDbError(error, 'failed to delete product');
  }
}

async function deleteWarehouseService({ warehouse_id }) {
  const warehouseId = toCleanString(warehouse_id);
  if (!warehouseId || !isValidObjectId(warehouseId)) {
    return { statusCode: 400, message: 'valid warehouse_id is required' };
  }

  const totalStock = await getWarehouseTotalStock(warehouseId);
  if (totalStock > 0) {
    const products = await getWarehouseStockDetails(warehouseId);
    return {
      statusCode: 409,
      message: 'cannot delete warehouse with stock available',
      data: { products, totalStock },
    };
  }

  try {
    const deleted = await deleteWarehouseById(warehouseId);
    if (!deleted) {
      return { statusCode: 404, message: 'warehouse not found' };
    }
    return { statusCode: 200, message: 'warehouse deleted successfully' };
  } catch (error) {
    return mapDbError(error, 'failed to delete warehouse');
  }
}

module.exports = {
  createWarehouseService,
  getWarehousesService,
  assignWarehouseService,
  getUserWarehousesService,
  createCategoryService,
  getCategoriesService,
  deleteCategoryService,
  createProductService,
  getProductsService,
  getProductsWithStockService,
  createStockService,
  getStockService,
  createReceiptService,
  getReceiptsService,
  validateReceiptService,
  createReceiptItemService,
  createDeliveryService,
  getDeliveriesService,
  validateDeliveryService,
  createDeliveryItemService,
  createTransferService,
  getTransfersService,
  validateTransferService,
  createTransferItemService,
  getAdjustmentsService,
  adjustStockService,
  getProductBySkuService,
  deleteProductService,
  deleteWarehouseService,
};
