const mongoose = require('mongoose');

const receiptItemSchema = new mongoose.Schema({
  receipt_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:   { type: Number, required: true },
});

module.exports = mongoose.model('ReceiptItem', receiptItemSchema);
