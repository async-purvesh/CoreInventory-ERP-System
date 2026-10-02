const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema({
  product_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  old_quantity: { type: Number, required: true },
  new_quantity: { type: Number, required: true },
  reason:       { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('Adjustment', adjustmentSchema);
