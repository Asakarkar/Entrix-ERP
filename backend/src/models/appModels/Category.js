const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
});

schema.pre('findOneAndUpdate', function setUpdatedDate() {
  this.set({ updated: new Date() });
});

module.exports = mongoose.model('Category', schema);
