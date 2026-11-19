import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/request/request';
import './inventory.css';

const { Text, Title } = Typography;

function listFrom(response, label) {
  if (Array.isArray(response?.result)) return response.result;
  throw new Error(response?.message || `Unable to load ${label}.`);
}

function resultFrom(response, label) {
  if (response?.success && response.result !== undefined) return response.result;
  throw new Error(response?.message || `Unable to load ${label}.`);
}

function showError(error) {
  notification.error({
    message: 'Inventory request failed',
    description: error?.message || 'Please try again.',
  });
}

function referenceName(value, field = 'name') {
  if (value && typeof value === 'object') return value[field] || '—';
  return '—';
}

function InventoryForm({ form, modal, data, onFinish, onCancel, saving }) {
  useEffect(() => {
    form.resetFields();
    if (!modal) return;
    const record = modal.record;
    if (modal.kind === 'product') {
      form.setFieldsValue({
        ...record,
        category: record?.category?._id || record?.category || undefined,
        unitPrice: record?.unitPrice ?? 0,
        stockThreshold: record?.stockThreshold ?? 0,
        unit: record?.unit || 'units',
      });
    } else if (record) {
      form.setFieldsValue(record);
    }
  }, [data.categories, form, modal]);

  if (!modal || !['product', 'category', 'warehouse'].includes(modal.kind)) return null;

  return (
    <Modal
      title={`${modal.record ? 'Edit' : 'Add'} ${modal.kind}`}
      open
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {modal.kind === 'product' && (
          <>
            <Form.Item name="name" label="Product name" rules={[{ required: true }]}>
              <Input maxLength={120} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
                  <Input maxLength={40} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="category" label="Category">
                  <Select
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    options={data.categories.map((category) => ({
                      value: category._id,
                      label: category.name,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={8}>
                <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
                  <Input maxLength={24} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="unitPrice" label="Unit price" rules={[{ required: true }]}>
                  <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="stockThreshold" label="Low-stock threshold" rules={[{ required: true }]}>
                  <InputNumber min={0} precision={3} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} maxLength={500} />
            </Form.Item>
          </>
        )}
        {modal.kind === 'category' && (
          <>
            <Form.Item name="name" label="Category name" rules={[{ required: true }]}>
              <Input maxLength={100} />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} maxLength={500} />
            </Form.Item>
          </>
        )}
        {modal.kind === 'warehouse' && (
          <>
            <Form.Item name="name" label="Warehouse name" rules={[{ required: true }]}>
              <Input maxLength={100} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="code" label="Warehouse code" rules={[{ required: true }]}>
                  <Input maxLength={32} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="location" label="Location">
                  <Input maxLength={150} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
        <div className="inventory-form-actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
        </div>
      </Form>
    </Modal>
  );
}

function MovementForm({ form, modal, data, onFinish, onCancel, saving }) {
  useEffect(() => {
    form.resetFields();
    if (modal) form.setFieldsValue({ productId: modal.productId, quantity: 1 });
  }, [form, modal]);
  if (!modal || !['stock-in', 'stock-out', 'transfer'].includes(modal.kind)) return null;

  return (
    <Modal
      title={modal.kind === 'transfer' ? 'Transfer stock' : modal.kind === 'stock-in' ? 'Stock in' : 'Stock out'}
      open
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="productId" label="Product" rules={[{ required: true }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={data.products.map((product) => ({
              value: product._id,
              label: `${product.name} (${product.sku})`,
            }))}
          />
        </Form.Item>
        {modal.kind === 'transfer' ? (
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="sourceWarehouseId" label="From warehouse" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={data.warehouses.map((warehouse) => ({
                    value: warehouse._id,
                    label: warehouse.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="destinationWarehouseId" label="To warehouse" rules={[{ required: true }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={data.warehouses.map((warehouse) => ({
                    value: warehouse._id,
                    label: warehouse.name,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        ) : (
          <Form.Item name="warehouseId" label="Warehouse" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={data.warehouses.map((warehouse) => ({
                value: warehouse._id,
                label: warehouse.name,
              }))}
            />
          </Form.Item>
        )}
        <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
          <InputNumber min={0.000001} precision={3} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="note" label="Note">
          <Input.TextArea rows={2} maxLength={300} />
        </Form.Item>
        <div className="inventory-form-actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            {modal.kind === 'transfer' ? 'Transfer' : 'Save movement'}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export default function Inventory() {
  const [form] = Form.useForm();
  const [movementForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('stock');
  const [modal, setModal] = useState(null);
  const [movementModal, setMovementModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({
    products: [],
    categories: [],
    warehouses: [],
    stock: [],
    lowStock: [],
    history: [],
    summary: { productCount: 0, warehouseCount: 0, totalUnits: 0, lowStockCount: 0 },
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        productsResponse,
        categoriesResponse,
        warehousesResponse,
        stockResponse,
        lowStockResponse,
        historyResponse,
        summaryResponse,
      ] = await Promise.all([
        request.listAll({ entity: 'product' }),
        request.listAll({ entity: 'category' }),
        request.listAll({ entity: 'warehouse' }),
        request.get({ entity: 'inventory/stock' }),
        request.get({ entity: 'inventory/low-stock' }),
        request.get({ entity: 'inventory/history' }),
        request.get({ entity: 'inventory/summary' }),
      ]);
      setData({
        products: listFrom(productsResponse, 'products'),
        categories: listFrom(categoriesResponse, 'categories'),
        warehouses: listFrom(warehousesResponse, 'warehouses'),
        stock: listFrom(stockResponse, 'stock'),
        lowStock: listFrom(lowStockResponse, 'low-stock alerts'),
        history: listFrom(historyResponse, 'inventory history'),
        summary: resultFrom(summaryResponse, 'inventory summary'),
      });
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stockByProduct = useMemo(() => {
    const totals = new Map();
    for (const stock of data.stock) {
      const productId = stock.product?._id;
      if (productId) totals.set(productId, (totals.get(productId) || 0) + stock.quantity);
    }
    return totals;
  }, [data.stock]);

  const saveEntity = async (values) => {
    setSaving(true);
    try {
      const entity = modal.kind;
      const payload = { ...values };
      if (entity === 'product' && !payload.category) payload.category = null;
      const response = modal.record
        ? await request.update({ entity, id: modal.record._id, jsonData: payload })
        : await request.create({ entity, jsonData: payload });
      if (!response?.success) throw new Error(response?.message || `Unable to save ${entity}.`);
      setModal(null);
      await loadData();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntity = async (kind, record) => {
    try {
      if (kind === 'product' && (stockByProduct.get(record._id) || 0) > 0) {
        notification.warning({
          message: 'Product has stock',
          description: 'Transfer or remove its stock before deleting this product.',
        });
        return;
      }
      if (kind === 'category' && data.products.some((product) => product.category?._id === record._id || product.category === record._id)) {
        notification.warning({
          message: 'Category is in use',
          description: 'Move or delete its products before deleting this category.',
        });
        return;
      }
      if (kind === 'warehouse' && data.stock.some((stock) => stock.warehouse?._id === record._id && stock.quantity > 0)) {
        notification.warning({
          message: 'Warehouse has stock',
          description: 'Transfer or remove its stock before deleting this warehouse.',
        });
        return;
      }
      const response = await request.delete({ entity: kind, id: record._id });
      if (!response?.success) throw new Error(response?.message || `Unable to delete ${kind}.`);
      await loadData();
    } catch (error) {
      showError(error);
    }
  };

  const submitMovement = async (values) => {
    setSaving(true);
    try {
      const transfer = movementModal.kind === 'transfer';
      const response = await request.post({
        entity: transfer ? 'inventory/transfer' : 'inventory/movement',
        jsonData: transfer
          ? values
          : { ...values, type: movementModal.kind },
      });
      if (!response?.success) throw new Error(response?.message || 'Unable to save the stock movement.');
      notification.success({ message: response.message || 'Inventory updated.' });
      setMovementModal(null);
      await loadData();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  const actionButtons = (kind, record) => (
    <Space>
      <Button
        aria-label={`Edit ${record.name}`}
        type="text"
        icon={<EditOutlined />}
        onClick={() => setModal({ kind, record })}
      />
      <Button
        aria-label={`Delete ${record.name}`}
        type="text"
        danger
        icon={<DeleteOutlined />}
        onClick={() => deleteEntity(kind, record)}
      />
    </Space>
  );

  const productColumns = [
    { title: 'Product', dataIndex: 'name', key: 'name', render: (name, record) => <><Text strong>{name}</Text><br /><Text type="secondary">{record.sku}</Text></> },
    { title: 'Category', key: 'category', render: (_, record) => referenceName(record.category) },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    { title: 'On hand', key: 'onHand', render: (_, record) => `${stockByProduct.get(record._id) || 0} ${record.unit || ''}` },
    { title: 'Unit price', dataIndex: 'unitPrice', key: 'unitPrice', render: (value) => Number(value || 0).toFixed(2) },
    { title: 'Low-stock threshold', dataIndex: 'stockThreshold', key: 'stockThreshold' },
    { title: '', key: 'actions', align: 'right', render: (_, record) => actionButtons('product', record) },
  ];

  const categoryColumns = [
    { title: 'Category', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', render: (value) => value || '—' },
    { title: 'Products', key: 'products', render: (_, record) => data.products.filter((product) => (product.category?._id || product.category) === record._id).length },
    { title: '', key: 'actions', align: 'right', render: (_, record) => actionButtons('category', record) },
  ];

  const warehouseColumns = [
    { title: 'Warehouse', dataIndex: 'name', key: 'name', render: (name, record) => <><Text strong>{name}</Text><br /><Text type="secondary">{record.code}</Text></> },
    { title: 'Location', dataIndex: 'location', key: 'location', render: (value) => value || '—' },
    { title: 'Stock units', key: 'units', render: (_, record) => data.stock.filter((stock) => stock.warehouse?._id === record._id).reduce((total, stock) => total + stock.quantity, 0) },
    { title: '', key: 'actions', align: 'right', render: (_, record) => actionButtons('warehouse', record) },
  ];

  const stockColumns = [
    { title: 'Product', key: 'product', render: (_, record) => record.product ? <><Text strong>{record.product.name}</Text><br /><Text type="secondary">{record.product.sku}</Text></> : '—' },
    { title: 'Warehouse', key: 'warehouse', render: (_, record) => referenceName(record.warehouse) },
    { title: 'Available', key: 'quantity', render: (_, record) => `${record.quantity} ${record.product?.unit || ''}` },
    { title: 'Threshold', key: 'threshold', render: (_, record) => record.product?.stockThreshold ?? 0 },
    { title: 'Status', key: 'status', render: (_, record) => record.quantity <= (record.product?.stockThreshold || 0) ? <Tag color="error">Low stock</Tag> : <Tag color="success">In stock</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => setMovementModal({ kind: 'stock-in', productId: record.product?._id })}>Stock in</Button>
          <Button size="small" disabled={!record.product || record.quantity <= 0} onClick={() => setMovementModal({ kind: 'stock-out', productId: record.product?._id })}>Stock out</Button>
          <Button size="small" icon={<SwapOutlined />} onClick={() => setMovementModal({ kind: 'transfer', productId: record.product?._id })}>Transfer</Button>
        </Space>
      ),
    },
  ];

  const lowStockColumns = [
    { title: 'Product', key: 'product', render: (_, record) => <><Text strong>{record.product.name}</Text><br /><Text type="secondary">{record.product.sku}</Text></> },
    { title: 'Warehouse', key: 'warehouse', render: (_, record) => record.warehouse.name },
    { title: 'Available', key: 'quantity', render: (_, record) => `${record.quantity} ${record.product.unit || ''}` },
    { title: 'Threshold', dataIndex: 'threshold', key: 'threshold' },
    { title: '', key: 'action', render: (_, record) => <Button size="small" onClick={() => setMovementModal({ kind: 'stock-in', productId: record.product._id })}>Receive stock</Button> },
  ];

  const historyColumns = [
    { title: 'Date', dataIndex: 'created', key: 'created', render: (value) => value ? dayjs(value).format('MMM D, YYYY h:mm A') : '—' },
    { title: 'Product', key: 'product', render: (_, record) => record.product ? <><Text strong>{record.product.name}</Text><br /><Text type="secondary">{record.product.sku}</Text></> : '—' },
    { title: 'Movement', dataIndex: 'type', key: 'type', render: (type) => <Tag color={type === 'stock-in' ? 'green' : type === 'stock-out' ? 'orange' : 'blue'}>{type === 'stock-in' ? 'Stock in' : type === 'stock-out' ? 'Stock out' : 'Transfer'}</Tag> },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'From / Warehouse', key: 'source', render: (_, record) => record.type === 'transfer' ? referenceName(record.sourceWarehouse) : referenceName(record.warehouse) },
    { title: 'To', key: 'destination', render: (_, record) => record.type === 'transfer' ? referenceName(record.destinationWarehouse) : '—' },
    { title: 'Note', dataIndex: 'note', key: 'note', render: (value) => value || '—' },
  ];

  const tabContent = {
    stock: (
      <>
        <div className="inventory-section-heading">
          <div><Title level={4}>Stock by warehouse</Title><Text type="secondary">Balances, stock movements, and transfers.</Text></div>
          <Space wrap>
            <Button icon={<InboxOutlined />} onClick={() => setMovementModal({ kind: 'stock-in' })}>Stock in</Button>
            <Button icon={<InboxOutlined />} onClick={() => setMovementModal({ kind: 'stock-out' })}>Stock out</Button>
            <Button icon={<SwapOutlined />} onClick={() => setMovementModal({ kind: 'transfer' })}>Transfer</Button>
          </Space>
        </div>
        {data.stock.length ? <Table rowKey="_id" columns={stockColumns} dataSource={data.stock} loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: true }} /> : <Empty description="Create a product and warehouse, then receive stock." />}
      </>
    ),
    products: (
      <>
        <div className="inventory-section-heading">
          <div><Title level={4}>Products</Title><Text type="secondary">Set prices, categories, units, and low-stock thresholds.</Text></div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ kind: 'product' })}>Add product</Button>
        </div>
        <Table rowKey="_id" columns={productColumns} dataSource={data.products} loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: true }} />
      </>
    ),
    categories: (
      <>
        <div className="inventory-section-heading">
          <div><Title level={4}>Categories</Title><Text type="secondary">Organize products into categories.</Text></div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ kind: 'category' })}>Add category</Button>
        </div>
        <Table rowKey="_id" columns={categoryColumns} dataSource={data.categories} loading={loading} pagination={{ pageSize: 8 }} />
      </>
    ),
    warehouses: (
      <>
        <div className="inventory-section-heading">
          <div><Title level={4}>Warehouses</Title><Text type="secondary">Manage stock locations.</Text></div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal({ kind: 'warehouse' })}>Add warehouse</Button>
        </div>
        <Table rowKey="_id" columns={warehouseColumns} dataSource={data.warehouses} loading={loading} pagination={{ pageSize: 8 }} />
      </>
    ),
    alerts: (
      <>
        <div className="inventory-section-heading">
          <div><Title level={4}>Low-stock alerts</Title><Text type="secondary">Products at or below their configured threshold.</Text></div>
        </div>
        {data.lowStock.length ? <Table rowKey={(record) => `${record.product._id}-${record.warehouse._id}`} columns={lowStockColumns} dataSource={data.lowStock} loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: true }} /> : <Empty description="No products are below their stock thresholds." />}
      </>
    ),
    history: (
      <>
        <div className="inventory-section-heading">
          <div><Title level={4}>Inventory history</Title><Text type="secondary">The latest 250 stock-in, stock-out, and transfer records.</Text></div>
        </div>
        <Table rowKey="_id" columns={historyColumns} dataSource={data.history} loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: true }} />
      </>
    ),
  };

  return (
    <main className="inventory-page">
      <header className="inventory-header">
        <div>
          <Text className="inventory-eyebrow">OPERATIONS</Text>
          <Title level={2}>Inventory</Title>
          <Text type="secondary">Products, stock movements, and warehouse balances in one place.</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Refresh</Button>
      </header>
      <Row gutter={[16, 16]} className="inventory-metrics">
        <Col xs={12} lg={6}><Card><Statistic title="Products" value={data.summary.productCount} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Warehouses" value={data.summary.warehouseCount} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Units on hand" value={data.summary.totalUnits} /></Card></Col>
        <Col xs={12} lg={6}><Card><Statistic title="Low-stock alerts" value={data.summary.lowStockCount} valueStyle={data.summary.lowStockCount ? { color: '#cf1322' } : undefined} /></Card></Col>
      </Row>
      {data.lowStock.length > 0 && (
        <Alert
          className="inventory-alert"
          type="warning"
          showIcon
          message={`${data.lowStock.length} product/warehouse balance${data.lowStock.length === 1 ? '' : 's'} at or below threshold`}
          description="Review the Low-stock alerts tab and receive stock to restore availability."
        />
      )}
      <Card className="inventory-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'stock', label: 'Stock', children: tabContent.stock },
            { key: 'products', label: 'Products', children: tabContent.products },
            { key: 'categories', label: 'Categories', children: tabContent.categories },
            { key: 'warehouses', label: 'Warehouses', children: tabContent.warehouses },
            { key: 'alerts', label: <span>Low stock {data.lowStock.length > 0 && <Tag color="error">{data.lowStock.length}</Tag>}</span>, children: tabContent.alerts },
            { key: 'history', label: 'History', children: tabContent.history },
          ]}
        />
      </Card>
      <InventoryForm
        form={form}
        modal={modal}
        data={data}
        onFinish={saveEntity}
        onCancel={() => setModal(null)}
        saving={saving}
      />
      <MovementForm
        form={movementForm}
        modal={movementModal}
        data={data}
        onFinish={submitMovement}
        onCancel={() => setMovementModal(null)}
        saving={saving}
      />
    </main>
  );
}
