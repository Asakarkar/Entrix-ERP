const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['stock-in', 'stock-out', 'transfer'], required: true },
  quantity: { type: Number, min: 0.000001, required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  sourceWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  note: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  created: { type: Date, default: Date.now },
});

schema.plugin(require('mongoose-autopopulate'));
for (const path of ['product', 'warehouse', 'sourceWarehouse', 'destinationWarehouse']) {
  schema.path(path).options.autopopulate = true;
}

module.exports = mongoose.model('InventoryMovement', schema);
