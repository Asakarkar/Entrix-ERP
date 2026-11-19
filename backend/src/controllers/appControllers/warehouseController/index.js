const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

const methods = createCRUDController('Warehouse');
const InventoryStock = mongoose.model('InventoryStock');
const Warehouse = mongoose.model('Warehouse');

methods.delete = async (req, res) => {
  const hasStock = await InventoryStock.exists({
    warehouse: req.params.id,
    quantity: { $gt: 0 },
  });
  if (hasStock) {
    return res.status(409).json({
      success: false,
      result: null,
      message: "Transfer or remove this warehouse's stock before deleting it.",
    });
  }
  const result = await Warehouse.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: { removed: true, updated: new Date() } },
    { new: true }
  );
  if (!result) {
    return res.status(404).json({ success: false, result: null, message: 'Warehouse not found.' });
  }
  return res.status(200).json({ success: true, result, message: 'Warehouse deleted.' });
};

module.exports = methods;
