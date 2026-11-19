const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, min: 0, required: true, default: 0 },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

schema.index({ product: 1, warehouse: 1 }, { unique: true });
schema.plugin(require('mongoose-autopopulate'));
schema.path('product').options.autopopulate = true;
schema.path('warehouse').options.autopopulate = true;

module.exports = mongoose.model('InventoryStock', schema);
