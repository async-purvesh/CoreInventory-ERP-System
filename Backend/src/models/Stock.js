const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  product_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity:     { type: Number, required: true, default: 0 },
});

stockSchema.index({ product_id: 1, warehouse_id: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);
