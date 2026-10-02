const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  from_warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  to_warehouse:   { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  status:         { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('Transfer', transferSchema);
