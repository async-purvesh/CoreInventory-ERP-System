const express = require('express');
const inventoryController = require('../controller/inventory.controller');
const identifyUser = require('../middleware/auth.middleware');

const inventoryRoute = express.Router();

inventoryRoute.post('/warehouses', inventoryController.createWarehouse);
inventoryRoute.get('/warehouses', identifyUser, inventoryController.getWarehouses);
inventoryRoute.delete('/warehouses/:id', inventoryController.deleteWarehouse);

inventoryRoute.post('/assign-warehouse', inventoryController.assignWarehouse);
inventoryRoute.get('/user-warehouses', inventoryController.getUserWarehouses);

inventoryRoute.post('/categories', inventoryController.createCategory);
inventoryRoute.get('/categories', inventoryController.getCategories);
inventoryRoute.delete('/categories/:id', inventoryController.deleteCategory);

inventoryRoute.post('/products', inventoryController.createProduct);
inventoryRoute.get('/products', identifyUser, inventoryController.getProducts);
inventoryRoute.get('/products/sku/:sku', inventoryController.getProductBySku);
inventoryRoute.delete('/products/:id', inventoryController.deleteProduct);

inventoryRoute.post('/stock', inventoryController.createStock);
inventoryRoute.get('/stock', identifyUser, inventoryController.getStock);

inventoryRoute.post('/receipts', inventoryController.createReceipt);
inventoryRoute.get('/receipts', inventoryController.getReceipts);
inventoryRoute.put('/receipts/:id/validate', inventoryController.validateReceipt);

inventoryRoute.post('/deliveries', inventoryController.createDelivery);
inventoryRoute.get('/deliveries', inventoryController.getDeliveries);
inventoryRoute.put('/deliveries/:id/validate', inventoryController.validateDelivery);

inventoryRoute.post('/transfers', inventoryController.createTransfer);
inventoryRoute.get('/transfers', inventoryController.getTransfers);
inventoryRoute.put('/transfers/:id/validate', inventoryController.validateTransfer);

inventoryRoute.post('/adjustments', inventoryController.adjustStock);
inventoryRoute.get('/adjustments', inventoryController.getAdjustments);

module.exports = inventoryRoute;
