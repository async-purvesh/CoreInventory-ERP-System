const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  customer_name: { type: String, required: true },
  warehouse_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  status:        { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('Delivery', deliverySchema);
