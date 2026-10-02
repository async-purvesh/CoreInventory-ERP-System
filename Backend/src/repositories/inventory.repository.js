const mongoose = require('mongoose');
const Warehouse = require('../models/Warehouse');
const UserWarehouse = require('../models/UserWarehouse');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const Delivery = require('../models/Delivery');
const DeliveryItem = require('../models/DeliveryItem');
const Transfer = require('../models/Transfer');
const TransferItem = require('../models/TransferItem');
const Adjustment = require('../models/Adjustment');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function increaseStockHelper(productId, warehouseId, quantity, session) {
  const opts = session ? { session } : {};
  const existing = await Stock.findOne({ product_id: productId, warehouse_id: warehouseId }, null, opts);
  if (existing) {
    existing.quantity += quantity;
    await existing.save(opts);
  } else {
    await Stock.create([{ product_id: productId, warehouse_id: warehouseId, quantity }], opts);
  }
}

async function decreaseStockHelper(productId, warehouseId, quantity, session) {
  const opts = session ? { session } : {};
  await Stock.findOneAndUpdate(
    { product_id: productId, warehouse_id: warehouseId },
    [{ $set: { quantity: { $max: [0, { $subtract: ['$quantity', quantity] }] } } }],
    opts
  );
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

async function createWarehouse({ name, location, manager }) {
  const warehouse = await Warehouse.create({ name, location, manager });
  const obj = warehouse.toObject();
  return { ...obj, warehouse_id: obj._id };
}

async function getWarehouses(userId) {
  if (userId) {
    const assignments = await UserWarehouse.find({ user_id: userId }).lean();
    const warehouseIds = assignments.map(a => a.warehouse_id);
    const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } }).sort({ _id: -1 }).lean();
    return warehouses.map(w => ({ ...w, warehouse_id: w._id }));
  }
  const warehouses = await Warehouse.find().sort({ _id: -1 }).lean();
  return warehouses.map(w => ({ ...w, warehouse_id: w._id }));
}

async function assignWarehouse({ userId, warehouseId }) {
  const assignment = await UserWarehouse.create({ user_id: userId, warehouse_id: warehouseId });
  return assignment.toObject();
}

async function getUserWarehouses() {
  const rows = await UserWarehouse.find()
    .populate('warehouse_id', 'name')
    .sort({ assigned_at: -1 })
    .lean();

  // We also need user names – look them up
  const User = require('../models/User');
  const userIds = [...new Set(rows.map(r => r.user_id))];
  const users = await User.find({ user_id: { $in: userIds } }, 'user_id name').lean();
  const userMap = Object.fromEntries(users.map(u => [u.user_id, u.name]));

  return rows.map(r => ({
    user_id: r.user_id,
    user_name: userMap[r.user_id] || '',
    warehouse_id: r.warehouse_id?._id || r.warehouse_id,
    warehouse_name: r.warehouse_id?.name || '',
    assigned_at: r.assigned_at,
  }));
}

// ─── Categories ───────────────────────────────────────────────────────────────

async function createCategory({ name }) {
  const category = await Category.create({ name });
  const obj = category.toObject();
  return { ...obj, category_id: obj._id };
}

async function getCategories() {
  const categories = await Category.find().sort({ _id: -1 }).lean();
  return categories.map(c => ({ ...c, category_id: c._id }));
}

async function getCategoryProductCount(categoryId) {
  return Product.countDocuments({ category_id: categoryId });
}

async function deleteCategoryById(categoryId) {
  await Category.findByIdAndDelete(categoryId);
}

// ─── Products ─────────────────────────────────────────────────────────────────

async function createProduct({ name, sku, categoryId, unit }) {
  const product = await Product.create({ name, sku, category_id: categoryId, unit });
  const obj = product.toObject();
  return { ...obj, id: obj._id };
}

async function getProductsWithStock(userId) {
  let matchStage = {};

  if (userId) {
    // Get warehouse IDs assigned to this user
    const assignments = await UserWarehouse.find({ user_id: userId }).lean();
    const userWarehouseIds = assignments.map(a => a.warehouse_id);

    const pipeline = [
      {
        $lookup: {
          from: 'categories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'catDoc',
        },
      },
      { $unwind: { path: '$catDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'stocks',
          let: { pid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$product_id', '$$pid'] },
                    { $in: ['$warehouse_id', userWarehouseIds] },
                  ],
                },
              },
            },
          ],
          as: 'stockDocs',
        },
      },
      {
        $project: {
          id: '$_id',
          name: 1,
          sku: 1,
          uom: '$unit',
          category_id: 1,
          cat: { $ifNull: ['$catDoc.name', 'Uncategorized'] },
          stock: { $sum: '$stockDocs.quantity' },
        },
      },
      { $sort: { _id: -1 } },
    ];
    return Product.aggregate(pipeline);
  }

  // Admin: all products with total stock
  const pipeline = [
    {
      $lookup: {
        from: 'categories',
        localField: 'category_id',
        foreignField: '_id',
        as: 'catDoc',
      },
    },
    { $unwind: { path: '$catDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'stocks',
        localField: '_id',
        foreignField: 'product_id',
        as: 'stockDocs',
      },
    },
    {
      $project: {
        id: '$_id',
        name: 1,
        sku: 1,
        uom: '$unit',
        category_id: 1,
        cat: { $ifNull: ['$catDoc.name', 'Uncategorized'] },
        stock: { $sum: '$stockDocs.quantity' },
      },
    },
    { $sort: { _id: -1 } },
  ];
  return Product.aggregate(pipeline);
}

// ─── Stock ────────────────────────────────────────────────────────────────────

async function createStock({ productId, warehouseId, quantity }) {
  const stock = await Stock.create({ product_id: productId, warehouse_id: warehouseId, quantity });
  return stock.toObject();
}

async function getStock(userId) {
  let filter = {};
  if (userId) {
    const assignments = await UserWarehouse.find({ user_id: userId }).lean();
    const warehouseIds = assignments.map(a => a.warehouse_id);
    filter.warehouse_id = { $in: warehouseIds };
  }

  const rows = await Stock.find(filter)
    .populate('product_id', 'name')
    .populate('warehouse_id', 'name')
    .sort({ _id: -1 })
    .lean();

  return rows.map(r => ({
    stock_id: r._id,
    quantity: r.quantity,
    product_id: r.product_id?._id || r.product_id,
    product: r.product_id?.name || '',
    warehouse_id: r.warehouse_id?._id || r.warehouse_id,
    warehouse: r.warehouse_id?.name || '',
  }));
}

// ─── Receipts ─────────────────────────────────────────────────────────────────

async function createReceiptWithItem({ supplierName, warehouseId, status, productId, quantity }) {
  const session = await mongoose.startSession();
  try {
    let receipt;
    await session.withTransaction(async () => {
      [receipt] = await Receipt.create([{ supplier_name: supplierName, warehouse_id: warehouseId, status }], { session });
      await ReceiptItem.create([{ receipt_id: receipt._id, product_id: productId, quantity }], { session });

      if (status === 'Done') {
        await increaseStockHelper(productId, warehouseId, quantity, session);
      }
    });
    return receipt.toObject();
  } finally {
    session.endSession();
  }
}

async function getReceipts() {
  const receipts = await Receipt.find()
    .populate('warehouse_id', 'name')
    .sort({ _id: -1 })
    .lean();

  // Get all receipt items in one go
  const receiptIds = receipts.map(r => r._id);
  const items = await ReceiptItem.find({ receipt_id: { $in: receiptIds } })
    .populate('product_id', 'name')
    .lean();

  const itemMap = {};
  for (const item of items) {
    if (!itemMap[item.receipt_id.toString()]) {
      itemMap[item.receipt_id.toString()] = item;
    }
  }

  return receipts.map(r => {
    const item = itemMap[r._id.toString()];
    return {
      receipt_id: r._id,
      supplier: r.supplier_name,
      status: r.status,
      date: r.created_at ? r.created_at.toISOString().slice(0, 10) : '',
      wh: r.warehouse_id?.name || '',
      warehouse_id: r.warehouse_id?._id || r.warehouse_id,
      product: item?.product_id?.name || '',
      product_id: item?.product_id?._id || item?.product_id || '',
      qty: item?.quantity || 0,
    };
  });
}

async function validateReceipt(receiptId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const receipt = await Receipt.findById(receiptId).session(session);
      if (!receipt) throw Object.assign(new Error('receipt not found'), { statusCode: 404 });
      if (receipt.status === 'Done') throw Object.assign(new Error('receipt already validated'), { statusCode: 409 });

      receipt.status = 'Done';
      await receipt.save({ session });

      const items = await ReceiptItem.find({ receipt_id: receiptId }).session(session).lean();
      for (const item of items) {
        await increaseStockHelper(item.product_id, receipt.warehouse_id, item.quantity, session);
      }

      result = { receipt_id: receiptId, status: 'Done' };
    });
    return result;
  } finally {
    session.endSession();
  }
}

// ─── Deliveries ───────────────────────────────────────────────────────────────

async function createDeliveryWithItem({ customerName, warehouseId, status, productId, quantity }) {
  const session = await mongoose.startSession();
  try {
    let delivery;
    await session.withTransaction(async () => {
      [delivery] = await Delivery.create([{ customer_name: customerName, warehouse_id: warehouseId, status }], { session });
      await DeliveryItem.create([{ delivery_id: delivery._id, product_id: productId, quantity }], { session });

      if (status === 'Done') {
        const stockRow = await Stock.findOne({ product_id: productId, warehouse_id: warehouseId }).session(session);
        const available = stockRow?.quantity ?? 0;
        if (available < quantity) {
          throw Object.assign(
            new Error(`Insufficient stock. Available: ${available}, requested: ${quantity}`),
            { statusCode: 409 }
          );
        }
        await decreaseStockHelper(productId, warehouseId, quantity, session);
      }
    });
    return delivery.toObject();
  } finally {
    session.endSession();
  }
}

async function getDeliveries() {
  const deliveries = await Delivery.find()
    .populate('warehouse_id', 'name')
    .sort({ _id: -1 })
    .lean();

  const deliveryIds = deliveries.map(d => d._id);
  const items = await DeliveryItem.find({ delivery_id: { $in: deliveryIds } })
    .populate('product_id', 'name')
    .lean();

  const itemMap = {};
  for (const item of items) {
    if (!itemMap[item.delivery_id.toString()]) {
      itemMap[item.delivery_id.toString()] = item;
    }
  }

  return deliveries.map(d => {
    const item = itemMap[d._id.toString()];
    return {
      delivery_id: d._id,
      customer: d.customer_name,
      status: d.status,
      date: d.created_at ? d.created_at.toISOString().slice(0, 10) : '',
      wh: d.warehouse_id?.name || '',
      warehouse_id: d.warehouse_id?._id || d.warehouse_id,
      product: item?.product_id?.name || '',
      product_id: item?.product_id?._id || item?.product_id || '',
      qty: item?.quantity || 0,
    };
  });
}

async function validateDelivery(deliveryId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const delivery = await Delivery.findById(deliveryId).session(session);
      if (!delivery) throw Object.assign(new Error('delivery not found'), { statusCode: 404 });
      if (delivery.status === 'Done') throw Object.assign(new Error('delivery already validated'), { statusCode: 409 });

      const items = await DeliveryItem.find({ delivery_id: deliveryId }).session(session).lean();

      // Pre-check stock availability
      for (const item of items) {
        const stockRow = await Stock.findOne({ product_id: item.product_id, warehouse_id: delivery.warehouse_id }).session(session);
        const available = stockRow?.quantity ?? 0;
        if (available < item.quantity) {
          const product = await Product.findById(item.product_id).session(session);
          const pName = product?.name || `Product #${item.product_id}`;
          throw Object.assign(
            new Error(`Insufficient stock for "${pName}". Available: ${available}, requested: ${item.quantity}`),
            { statusCode: 409 }
          );
        }
      }

      delivery.status = 'Done';
      await delivery.save({ session });

      for (const item of items) {
        await decreaseStockHelper(item.product_id, delivery.warehouse_id, item.quantity, session);
      }

      result = { delivery_id: deliveryId, status: 'Done' };
    });
    return result;
  } finally {
    session.endSession();
  }
}

// ─── Transfers ────────────────────────────────────────────────────────────────

async function createTransferWithItem({ fromWarehouse, toWarehouse, status, productId, quantity }) {
  const session = await mongoose.startSession();
  try {
    let transfer;
    await session.withTransaction(async () => {
      [transfer] = await Transfer.create([{ from_warehouse: fromWarehouse, to_warehouse: toWarehouse, status }], { session });
      await TransferItem.create([{ transfer_id: transfer._id, product_id: productId, quantity }], { session });

      if (status === 'Done') {
        const stockRow = await Stock.findOne({ product_id: productId, warehouse_id: fromWarehouse }).session(session);
        const available = stockRow?.quantity ?? 0;
        if (available < quantity) {
          throw Object.assign(
            new Error(`Insufficient stock in source warehouse. Available: ${available}, requested: ${quantity}`),
            { statusCode: 409 }
          );
        }
        await decreaseStockHelper(productId, fromWarehouse, quantity, session);
        await increaseStockHelper(productId, toWarehouse, quantity, session);
      }
    });
    return transfer.toObject();
  } finally {
    session.endSession();
  }
}

async function getTransfers() {
  const transfers = await Transfer.find()
    .populate('from_warehouse', 'name')
    .populate('to_warehouse', 'name')
    .sort({ _id: -1 })
    .lean();

  const transferIds = transfers.map(t => t._id);
  const items = await TransferItem.find({ transfer_id: { $in: transferIds } })
    .populate('product_id', 'name')
    .lean();

  const itemMap = {};
  for (const item of items) {
    if (!itemMap[item.transfer_id.toString()]) {
      itemMap[item.transfer_id.toString()] = item;
    }
  }

  return transfers.map(t => {
    const item = itemMap[t._id.toString()];
    return {
      transfer_id: t._id,
      status: t.status,
      date: t.created_at ? t.created_at.toISOString().slice(0, 10) : '',
      from: t.from_warehouse?.name || '',
      to: t.to_warehouse?.name || '',
      from_warehouse: t.from_warehouse?._id || t.from_warehouse,
      to_warehouse: t.to_warehouse?._id || t.to_warehouse,
      product: item?.product_id?.name || '',
      product_id: item?.product_id?._id || item?.product_id || '',
      qty: item?.quantity || 0,
    };
  });
}

async function validateTransfer(transferId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const transfer = await Transfer.findById(transferId).session(session);
      if (!transfer) throw Object.assign(new Error('transfer not found'), { statusCode: 404 });
      if (transfer.status === 'Done') throw Object.assign(new Error('transfer already completed'), { statusCode: 409 });

      const items = await TransferItem.find({ transfer_id: transferId }).session(session).lean();

      // Pre-check stock availability
      for (const item of items) {
        const stockRow = await Stock.findOne({ product_id: item.product_id, warehouse_id: transfer.from_warehouse }).session(session);
        const available = stockRow?.quantity ?? 0;
        if (available < item.quantity) {
          const product = await Product.findById(item.product_id).session(session);
          const pName = product?.name || `Product #${item.product_id}`;
          throw Object.assign(
            new Error(`Insufficient stock for "${pName}" in source warehouse. Available: ${available}, requested: ${item.quantity}`),
            { statusCode: 409 }
          );
        }
      }

      transfer.status = 'Done';
      await transfer.save({ session });

      for (const item of items) {
        await decreaseStockHelper(item.product_id, transfer.from_warehouse, item.quantity, session);
        await increaseStockHelper(item.product_id, transfer.to_warehouse, item.quantity, session);
      }

      result = { transfer_id: transferId, status: 'Done' };
    });
    return result;
  } finally {
    session.endSession();
  }
}

// ─── Adjustments ──────────────────────────────────────────────────────────────

async function getAdjustments() {
  const rows = await Adjustment.find()
    .populate('product_id', 'name')
    .populate('warehouse_id', 'name')
    .sort({ _id: -1 })
    .lean();

  return rows.map(a => ({
    adjustment_id: a._id,
    recorded: a.old_quantity,
    counted: a.new_quantity,
    reason: a.reason,
    date: a.created_at ? a.created_at.toISOString().slice(0, 10) : '',
    product: a.product_id?.name || '',
    location: a.warehouse_id?.name || '',
  }));
}

async function adjustStockQuantity({ productId, warehouseId, oldQuantity, newQuantity, reason }) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Adjustment.create([{ product_id: productId, warehouse_id: warehouseId, old_quantity: oldQuantity, new_quantity: newQuantity, reason }], { session });
      await Stock.findOneAndUpdate(
        { product_id: productId, warehouse_id: warehouseId },
        { $set: { quantity: newQuantity } },
        { session }
      );
    });
  } finally {
    session.endSession();
  }
}

async function getProductStockQuantity({ productId, warehouseId }) {
  const row = await Stock.findOne({ product_id: productId, warehouse_id: warehouseId }).lean();
  return row || null;
}

async function findProductBySku(sku) {
  const product = await Product.findOne({ sku }).lean();
  if (!product) return [];

  const stockRows = await Stock.find({ product_id: product._id })
    .populate('warehouse_id', 'name')
    .lean();

  const category = await Category.findById(product.category_id).lean();

  if (stockRows.length === 0) {
    return [{
      product_id: product._id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      category: category?.name || '',
      warehouse: '',
      quantity: 0,
    }];
  }

  return stockRows.map(s => ({
    product_id: product._id,
    name: product.name,
    sku: product.sku,
    unit: product.unit,
    category: category?.name || '',
    warehouse: s.warehouse_id?.name || '',
    quantity: s.quantity,
  }));
}

async function getProductTotalStock(productId) {
  const result = await Stock.aggregate([
    { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: null, total_stock: { $sum: '$quantity' } } },
  ]);
  return result[0]?.total_stock || 0;
}

async function deleteProductById(productId) {
  const session = await mongoose.startSession();
  try {
    let deleted = null;
    await session.withTransaction(async () => {
      await Adjustment.deleteMany({ product_id: productId }, { session });
      await TransferItem.deleteMany({ product_id: productId }, { session });
      await DeliveryItem.deleteMany({ product_id: productId }, { session });
      await ReceiptItem.deleteMany({ product_id: productId }, { session });
      await Stock.deleteMany({ product_id: productId }, { session });

      deleted = await Product.findByIdAndDelete(productId, { session }).lean();
    });
    return deleted;
  } finally {
    session.endSession();
  }
}

async function getWarehouseTotalStock(warehouseId) {
  const result = await Stock.aggregate([
    { $match: { warehouse_id: new mongoose.Types.ObjectId(warehouseId) } },
    { $group: { _id: null, total_stock: { $sum: '$quantity' } } },
  ]);
  return result[0]?.total_stock || 0;
}

async function getWarehouseStockDetails(warehouseId) {
  const rows = await Stock.find({ warehouse_id: warehouseId, quantity: { $gt: 0 } })
    .populate('product_id', 'name sku')
    .sort({ 'product_id.name': 1 })
    .lean();

  return rows.map(r => ({
    product_id: r.product_id?._id || r.product_id,
    product: r.product_id?.name || '',
    sku: r.product_id?.sku || '',
    quantity: r.quantity,
  }));
}

async function deleteWarehouseById(warehouseId) {
  const session = await mongoose.startSession();
  try {
    let deleted = null;
    await session.withTransaction(async () => {
      await Adjustment.deleteMany({ warehouse_id: warehouseId }, { session });
      await Transfer.deleteMany({ $or: [{ from_warehouse: warehouseId }, { to_warehouse: warehouseId }] }, { session });
      await Delivery.deleteMany({ warehouse_id: warehouseId }, { session });
      await Receipt.deleteMany({ warehouse_id: warehouseId }, { session });
      await UserWarehouse.deleteMany({ warehouse_id: warehouseId }, { session });
      await Stock.deleteMany({ warehouse_id: warehouseId }, { session });

      deleted = await Warehouse.findByIdAndDelete(warehouseId, { session }).lean();
    });
    return deleted;
  } finally {
    session.endSession();
  }
}

module.exports = {
  createWarehouse,
  getWarehouses,
  assignWarehouse,
  getUserWarehouses,
  createCategory,
  getCategories,
  getCategoryProductCount,
  deleteCategoryById,
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
};
