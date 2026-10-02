const {
  createWarehouseService,
  getWarehousesService,
  assignWarehouseService,
  getUserWarehousesService,
  createCategoryService,
  getCategoriesService,
  deleteCategoryService,
  createProductService,
  getProductsWithStockService,
  createStockService,
  getStockService,
  createReceiptService,
  getReceiptsService,
  validateReceiptService,
  createDeliveryService,
  getDeliveriesService,
  validateDeliveryService,
  createTransferService,
  getTransfersService,
  validateTransferService,
  getAdjustmentsService,
  adjustStockService,
  getProductBySkuService,
  deleteProductService,
  deleteWarehouseService,
} = require('../services/inventory.service');

async function createWarehouse(req, res) {
  const result = await createWarehouseService(req.body);
  return res.status(result.statusCode).json(result.data ? { data: result.data, message: result.message } : { message: result.message });
}

async function getWarehouses(req, res) {
  const result = await getWarehousesService({ user_id: req.user?.id || req.query.user_id });
  return res.status(result.statusCode).json(result.data);
}

async function assignWarehouse(req, res) {
  const result = await assignWarehouseService(req.body);
  return res.status(result.statusCode).json(result.data ? { data: result.data, message: result.message } : { message: result.message });
}

async function getUserWarehouses(req, res) {
  const result = await getUserWarehousesService();
  return res.status(result.statusCode).json(result.data);
}

async function createCategory(req, res) {
  const result = await createCategoryService(req.body);
  return res.status(result.statusCode).json(result.data ? { data: result.data, message: result.message } : { message: result.message });
}

async function getCategories(req, res) {
  const result = await getCategoriesService();
  return res.status(result.statusCode).json(result.data);
}

async function deleteCategory(req, res) {
  const result = await deleteCategoryService({ category_id: req.params.id });
  return res.status(result.statusCode).json({ message: result.message });
}

async function createProduct(req, res) {
  const result = await createProductService(req.body);
  return res.status(result.statusCode).json(result.data ? { data: result.data, message: result.message } : { message: result.message });
}

async function getProducts(req, res) {
  const result = await getProductsWithStockService({ user_id: req.user?.id || req.query.user_id });
  return res.status(result.statusCode).json(result.data);
}

async function createStock(req, res) {
  const result = await createStockService(req.body);
  return res.status(result.statusCode).json(result.data ? { data: result.data, message: result.message } : { message: result.message });
}

async function getStock(req, res) {
  const result = await getStockService({ user_id: req.user?.id || req.query.user_id });
  return res.status(result.statusCode).json(result.data);
}

async function createReceipt(req, res) {
  const result = await createReceiptService(req.body);
  return res.status(result.statusCode).json(result.data ? { data: result.data, message: result.message } : { message: result.message });
}

async function getReceipts(req, res) {
  const result = await getReceiptsService();
  return res.status(result.statusCode).json(result.data);
}

async function validateReceipt(req, res) {
  const result = await validateReceiptService({ receipt_id: req.params.id });
  return res.status(result.statusCode).json({ message: result.message });
}

async function createDelivery(req, res) {
  const result = await createDeliveryService(req.body);
  return res.status(result.statusCode).json(result.data ? { data: result.data, message: result.message } : { message: result.message });
}

async function getDeliveries(req, res) {
  const result = await getDeliveriesService();
  return res.status(result.statusCode).json(result.data);
}

async function validateDelivery(req, res) {
  const result = await validateDeliveryService({ delivery_id: req.params.id });
  return res.status(result.statusCode).json({ message: result.message });
}

async function createTransfer(req, res) {
  const result = await createTransferService(req.body);
  return res.status(result.statusCode).json(result.data ? { data: result.data, message: result.message } : { message: result.message });
}

async function getTransfers(req, res) {
  const result = await getTransfersService();
  return res.status(result.statusCode).json(result.data);
}

async function validateTransfer(req, res) {
  const result = await validateTransferService({ transfer_id: req.params.id });
  return res.status(result.statusCode).json({ message: result.message });
}

async function getAdjustments(req, res) {
  const result = await getAdjustmentsService();
  return res.status(result.statusCode).json(result.data);
}

async function adjustStock(req, res) {
  const result = await adjustStockService(req.body);
  return res.status(result.statusCode).json({ message: result.message });
}

async function getProductBySku(req, res) {
  const result = await getProductBySkuService({ sku: req.params.sku });
  return res.status(result.statusCode).json(result.data ? result.data : { message: result.message });
}

async function deleteProduct(req, res) {
  const result = await deleteProductService({ product_id: req.params.id });
  return res.status(result.statusCode).json({ message: result.message });
}

async function deleteWarehouse(req, res) {
  const result = await deleteWarehouseService({ warehouse_id: req.params.id });
  return res.status(result.statusCode).json(result.data ? { message: result.message, ...result.data } : { message: result.message });
}

module.exports = {
  createWarehouse,
  getWarehouses,
  assignWarehouse,
  getUserWarehouses,
  createCategory,
  getCategories,
  deleteCategory,
  createProduct,
  getProducts,
  createStock,
  getStock,
  createReceipt,
  getReceipts,
  validateReceipt,
  createDelivery,
  getDeliveries,
  validateDelivery,
  createTransfer,
  getTransfers,
  validateTransfer,
  getAdjustments,
  adjustStock,
  getProductBySku,
  deleteProduct,
  deleteWarehouse,
};
