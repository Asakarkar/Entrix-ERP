const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true, uppercase: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  description: { type: String, trim: true },
  unit: { type: String, trim: true, default: 'units' },
  unitPrice: { type: Number, min: 0, default: 0 },
  stockThreshold: { type: Number, min: 0, default: 0 },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

schema.index({ sku: 1 }, { unique: true });
schema.plugin(require('mongoose-autopopulate'));
schema.path('category').options.autopopulate = true;
schema.pre('findOneAndUpdate', function setUpdatedDate() {
  this.set({ updated: new Date() });
});

module.exports = mongoose.model('Product', schema);
