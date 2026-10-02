const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
  delivery_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', required: true },
  product_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:    { type: Number, required: true },
});

module.exports = mongoose.model('DeliveryItem', deliveryItemSchema);
