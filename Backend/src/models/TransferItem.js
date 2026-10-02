const mongoose = require('mongoose');

const transferItemSchema = new mongoose.Schema({
  transfer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transfer', required: true },
  product_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:    { type: Number, required: true },
});

module.exports = mongoose.model('TransferItem', transferItemSchema);
