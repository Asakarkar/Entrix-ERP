const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('Category');
const Product = mongoose.model('Product');
const Category = mongoose.model('Category');

methods.delete = async (req, res) => {
  const hasProducts = await Product.exists({ category: req.params.id, removed: false });
  if (hasProducts) {
    return res.status(409).json({
      success: false,
      result: null,
      message: "Move or delete this category's products before deleting it.",
    });
  }
  const result = await Category.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: { removed: true, updated: new Date() } },
    { new: true }
  );
  if (!result) {
    return res.status(404).json({ success: false, result: null, message: 'Category not found.' });
  }
  return res.status(200).json({ success: true, result, message: 'Category deleted.' });
};

module.exports = methods;
