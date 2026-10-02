const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  supplier_name: { type: String, required: true },
  warehouse_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  status:        { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('Receipt', receiptSchema);
