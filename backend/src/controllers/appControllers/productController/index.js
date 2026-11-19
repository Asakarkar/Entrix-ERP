const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('Product');
const InventoryStock = mongoose.model('InventoryStock');
const Product = mongoose.model('Product');

methods.delete = async (req, res) => {
  const hasStock = await InventoryStock.exists({
    product: req.params.id,
    quantity: { $gt: 0 },
  });
  if (hasStock) {
    return res.status(409).json({
      success: false,
      result: null,
      message: "Remove or transfer this product's stock before deleting it.",
    });
  }
  const result = await Product.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: { removed: true, updated: new Date() } },
    { new: true }
  );
  if (!result) {
    return res.status(404).json({ success: false, result: null, message: 'Product not found.' });
  }
  return res.status(200).json({ success: true, result, message: 'Product deleted.' });
};

module.exports = methods;
