const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const Product = mongoose.model('Product');
const Warehouse = mongoose.model('Warehouse');
const InventoryStock = mongoose.model('InventoryStock');
const InventoryMovement = mongoose.model('InventoryMovement');

function inventoryError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function respondWithError(res, error) {
  const status = error.status || (error.code === 11000 ? 409 : 500);
  return res.status(status).json({
    success: false,
    result: null,
    message: error.message,
  });
}

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function stockKey(product, warehouse) {
  const productId = product?._id || product;
  const warehouseId = warehouse?._id || warehouse;
  return `${productId}:${warehouseId}`;
}

async function getActiveReferences(productId, warehouseIds) {
  if (!validId(productId) || warehouseIds.some((id) => !validId(id))) {
    throw inventoryError('Select a valid product and warehouse.');
  }
  const [product, warehouses] = await Promise.all([
    Product.findOne({ _id: productId, removed: false }),
    Warehouse.find({ _id: { $in: warehouseIds }, removed: false }),
  ]);
  if (!product) throw inventoryError('Product not found.', 404);
  if (warehouses.length !== new Set(warehouseIds.map(String)).size) {
    throw inventoryError('One or more warehouses were not found.', 404);
  }
  return { product, warehouses };
}

async function addStock(product, warehouse, quantity) {
  try {
    return await InventoryStock.findOneAndUpdate(
      { product, warehouse },
      { $inc: { quantity }, $set: { updated: new Date() } },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return InventoryStock.findOneAndUpdate(
      { product, warehouse },
      { $inc: { quantity }, $set: { updated: new Date() } },
      { new: true, runValidators: true }
    );
  }
}

async function removeStock(product, warehouse, quantity) {
  const stock = await InventoryStock.findOneAndUpdate(
    { product, warehouse, quantity: { $gte: quantity } },
    { $inc: { quantity: -quantity }, $set: { updated: new Date() } },
    { new: true, runValidators: true }
  );
  if (stock) return stock;

  const exists = await InventoryStock.exists({ product, warehouse });
  if (!exists) throw inventoryError('There is no stock for this product in the selected warehouse.', 409);
  throw inventoryError('The requested quantity exceeds available stock.', 409);
}

async function saveMovement(movement) {
  return new InventoryMovement(movement).save();
}

async function rollback(actions, originalError) {
  try {
    for (const action of actions) await action();
  } catch (rollbackError) {
    throw new Error(`${originalError.message}; stock rollback failed: ${rollbackError.message}`);
  }
  throw originalError;
}

async function movement(req, res) {
  try {
    const { productId, warehouseId, type, quantity, note } = req.body;
    const amount = Number(quantity);
    if (!['stock-in', 'stock-out'].includes(type)) {
      throw inventoryError('Movement type must be stock-in or stock-out.');
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw inventoryError('Quantity must be greater than zero.');
    }
    const { product } = await getActiveReferences(productId, [warehouseId]);
    if (type === 'stock-in') {
      await addStock(product._id, warehouseId, amount);
    } else {
      await removeStock(product._id, warehouseId, amount);
    }

    try {
      const result = await saveMovement({
        product: product._id,
        type,
        quantity: amount,
        warehouse: warehouseId,
        note,
        createdBy: req.admin?._id,
      });
      return res.status(200).json({ success: true, result, message: 'Stock updated.' });
    } catch (error) {
      const undo = type === 'stock-in'
        ? () => removeStock(product._id, warehouseId, amount)
        : () => addStock(product._id, warehouseId, amount);
      return await rollback([undo], error);
    }
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function transfer(req, res) {
  try {
    const { productId, sourceWarehouseId, destinationWarehouseId, quantity, note } = req.body;
    const amount = Number(quantity);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw inventoryError('Quantity must be greater than zero.');
    }
    if (String(sourceWarehouseId) === String(destinationWarehouseId)) {
      throw inventoryError('Choose two different warehouses.');
    }
    const { product } = await getActiveReferences(productId, [sourceWarehouseId, destinationWarehouseId]);
    await removeStock(product._id, sourceWarehouseId, amount);
    try {
      await addStock(product._id, destinationWarehouseId, amount);
    } catch (error) {
      return await rollback([() => addStock(product._id, sourceWarehouseId, amount)], error);
    }

    try {
      const result = await saveMovement({
        product: product._id,
        type: 'transfer',
        quantity: amount,
        sourceWarehouse: sourceWarehouseId,
        destinationWarehouse: destinationWarehouseId,
        note,
        createdBy: req.admin?._id,
      });
      return res.status(200).json({ success: true, result, message: 'Stock transferred.' });
    } catch (error) {
      return await rollback(
        [
          () => removeStock(product._id, destinationWarehouseId, amount),
          () => addStock(product._id, sourceWarehouseId, amount),
        ],
        error
      );
    }
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function listStock(req, res) {
  try {
    const items = await InventoryStock.find()
      .populate('product')
      .populate('warehouse')
      .sort({ updated: -1 });
    return res.status(200).json({
      success: true,
      result: items.filter((item) => item.product && !item.product.removed && item.warehouse && !item.warehouse.removed),
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function listLowStock(req, res) {
  try {
    const [products, warehouses, stocks] = await Promise.all([
      Product.find({ removed: false }).sort({ name: 1 }),
      Warehouse.find({ removed: false }).sort({ name: 1 }),
      InventoryStock.find(),
    ]);
    const quantities = new Map(stocks.map((stock) => [stockKey(stock.product, stock.warehouse), stock.quantity]));
    const result = [];
    for (const product of products) {
      for (const warehouse of warehouses) {
        const quantity = quantities.get(stockKey(product._id, warehouse._id)) || 0;
        if (quantity <= product.stockThreshold) {
          result.push({ product, warehouse, quantity, threshold: product.stockThreshold });
        }
      }
    }
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function listHistory(req, res) {
  try {
    const result = await InventoryMovement.find()
      .populate('product')
      .populate('warehouse')
      .populate('sourceWarehouse')
      .populate('destinationWarehouse')
      .sort({ created: -1 })
      .limit(250);
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function summary(req, res) {
  try {
    const [products, warehouses, lowStock] = await Promise.all([
      Product.countDocuments({ removed: false }),
      Warehouse.countDocuments({ removed: false }),
      listLowStockData(),
    ]);
    const stocks = await InventoryStock.find();
    return res.status(200).json({
      success: true,
      result: {
        productCount: products,
        warehouseCount: warehouses,
        totalUnits: stocks.reduce((total, stock) => total + stock.quantity, 0),
        lowStockCount: lowStock,
      },
    });
  } catch (error) {
    return respondWithError(res, error);
  }
}

async function listLowStockData() {
  const [products, warehouses, stocks] = await Promise.all([
    Product.find({ removed: false }),
    Warehouse.find({ removed: false }),
    InventoryStock.find(),
  ]);
  const quantities = new Map(stocks.map((stock) => [stockKey(stock.product, stock.warehouse), stock.quantity]));
  let count = 0;
  for (const product of products) {
    for (const warehouse of warehouses) {
      if ((quantities.get(stockKey(product._id, warehouse._id)) || 0) <= product.stockThreshold) count += 1;
    }
  }
  return count;
}

const controller = createCRUDController('InventoryMovement');
controller.movement = movement;
controller.transfer = transfer;
controller.stock = listStock;
controller.lowStock = listLowStock;
controller.history = listHistory;
controller.inventorySummary = summary;

module.exports = controller;
