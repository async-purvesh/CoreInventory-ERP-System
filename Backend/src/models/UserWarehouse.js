const mongoose = require('mongoose');

const userWarehouseSchema = new mongoose.Schema({
  user_id:      { type: String, required: true },
  warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
}, {
  timestamps: { createdAt: 'assigned_at', updatedAt: false },
});

userWarehouseSchema.index({ user_id: 1, warehouse_id: 1 }, { unique: true });

module.exports = mongoose.model('UserWarehouse', userWarehouseSchema);
