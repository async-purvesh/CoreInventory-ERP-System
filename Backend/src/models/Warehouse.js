const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  location: { type: String, required: true },
  manager:  { type: String, required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
