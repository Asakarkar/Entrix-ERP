const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  location: { type: String, trim: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

schema.index({ code: 1 }, { unique: true });
schema.pre('findOneAndUpdate', function setUpdatedDate() {
  this.set({ updated: new Date() });
});

module.exports = mongoose.model('Warehouse', schema);
