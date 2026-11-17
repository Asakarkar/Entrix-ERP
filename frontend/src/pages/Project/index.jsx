import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
  ProjectOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '@/request/request';
import useMoney from '@/settings/useMoney';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';
import './project.css';

const { Text, Title } = Typography;
const statusLabels = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};
const statusColors = {
  planning: 'blue',
  active: 'green',
  on_hold: 'orange',
  completed: 'purple',
  cancelled: 'default',
  todo: 'default',
  in_progress: 'processing',
  done: 'success',
};
const projectFields = [
  { name: 'name', label: 'Project name', required: true },
  { name: 'clientName', label: 'Client' },
  { name: 'manager', label: 'Project manager' },
  { name: 'description', label: 'Description', multiline: true },
];

const taskStatuses = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];
const reportColumns = ['Project', 'Client', 'Status', 'Priority', 'Currency', 'Budget', 'Spent', 'Remaining budget', 'Progress %', 'Tasks total', 'Tasks complete', 'Team members', 'Start date', 'Deadline'];
const projectStatuses = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function getProjectProgress(project) {
  const tasks = project.tasks || [];
  return tasks.length ? Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100) : 0;
}

function getProjectSpend(project) {
  return (project.expenses || []).reduce((total, expense) => total + Number(expense.amount || 0), 0);
}

function formatCurrencyTotals(totals, moneyFormatter, defaultCurrency) {
  const entries = Object.entries(totals);
  if (!entries.length) return moneyFormatter({ amount: 0, currency_code: defaultCurrency });
  return entries
    .map(([currency, amount]) => moneyFormatter({ amount, currency_code: currency }))
    .join(' · ');
}

function formatDate(value) {
  return value ? dayjs(value).format('MMM D, YYYY') : '—';
}

function StatusTag({ status }) {
  return <Tag color={statusColors[status] || 'default'}>{statusLabels[status] || status}</Tag>;
}

function ProjectForm({ form, currency, initialValues, onFinish, onCancel, saving }) {
  useEffect(() => {
    form.setFieldsValue({
      ...initialValues,
      status: initialValues?.status || 'planning',
      priority: initialValues?.priority || 'medium',
      budget: initialValues?.budget ?? 0,
      currency: initialValues?.currency || currency,
      startDate: initialValues?.startDate ? dayjs(initialValues.startDate) : dayjs(),
      deadline: initialValues?.deadline ? dayjs(initialValues.deadline) : dayjs().add(30, 'day'),
    });
  }, [currency, form, initialValues]);

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Row gutter={16}>
        {projectFields.map((field) => (
          <Col key={field.name} xs={24} sm={field.multiline ? 24 : 12}>
            <Form.Item
              name={field.name}
              label={field.label}
              rules={field.required ? [{ required: true, message: 'Enter a project name' }] : []}
            >
              {field.multiline ? <Input.TextArea rows={3} /> : <Input />}
            </Form.Item>
          </Col>
        ))}
        <Col xs={24} sm={12}>
          <Form.Item name="budget" label="Project budget" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
            <Input maxLength={3} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="startDate" label="Start date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="deadline"
            label="Deadline"
            dependencies={['startDate']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue('startDate');
                  if (value && startDate && value.isBefore(startDate, 'day')) {
                    return Promise.reject(new Error('Deadline must be on or after the start date'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="status" label="Status">
            <Select options={projectStatuses} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="priority" label="Priority">
            <Select options={['low', 'medium', 'high'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
          </Form.Item>
        </Col>
      </Row>
      <div className="project-form-actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" htmlType="submit" loading={saving}>Save project</Button>
      </div>
    </Form>
  );
}

function EntryModal({ kind, open, onCancel, onSubmit, saving, members }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) form.resetFields();
  }, [form, open]);

  const fields = {
    task: (
      <>
        <Form.Item name="title" label="Task" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="assignee" label="Assign to">
          <Select allowClear showSearch options={members.map((member) => ({ value: member.name, label: member.name }))} />
        </Form.Item>
        <Form.Item name="dueDate" label="Deadline"><DatePicker style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="priority" label="Priority" initialValue="medium">
          <Select options={['low', 'medium', 'high'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
        </Form.Item>
      </>
    ),
    member: (
      <>
        <Form.Item name="name" label="Employee name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="email" label="Email"><Input type="email" /></Form.Item>
        <Form.Item name="role" label="Role / responsibility"><Input /></Form.Item>
        <Form.Item name="allocation" label="Project allocation (%)" initialValue={100}>
          <InputNumber min={0} max={100} style={{ width: '100%' }} />
        </Form.Item>
      </>
    ),
    expense: (
      <>
        <Form.Item name="description" label="Expense" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="category" label="Category"><Input placeholder="Travel, software, materials..." /></Form.Item>
        <Form.Item name="amount" label="Amount" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="date" label="Date" initialValue={dayjs()} rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="submittedBy" label="Submitted by"><Input /></Form.Item>
      </>
    ),
    resource: (
      <>
        <Form.Item name="name" label="Resource" rules={[{ required: true }]}><Input placeholder="Equipment, software, vehicle..." /></Form.Item>
        <Form.Item name="category" label="Category"><Input /></Form.Item>
        <Row gutter={12}>
          <Col span={12}><Form.Item name="quantity" label="Quantity" initialValue={1} rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
          <Col span={12}><Form.Item name="unit" label="Unit"><Input placeholder="hours, units..." /></Form.Item></Col>
        </Row>
        <Form.Item name="assignedTo" label="Allocated to">
          <Select allowClear showSearch options={members.map((member) => ({ value: member.name, label: member.name }))} />
        </Form.Item>
        <Form.Item name="allocatedCost" label="Planned cost"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
      </>
    ),
  }[kind];

  const titles = { task: 'Add task', member: 'Assign employee', expense: 'Record expense', resource: 'Allocate resource' };

  return (
    <Modal
      title={titles[kind]}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={async (values) => {
          if (await onSubmit(values)) form.resetFields();
        }}
      >
        {fields}
        <div className="project-form-actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={saving}>Add</Button>
        </div>
      </Form>
    </Modal>
  );
}

function ProjectDetails({ project, onUpdate, onAdd, onRemove }) {
  const { moneyFormatter } = useMoney();
  const now = dayjs();
  const spent = getProjectSpend(project);
  const progress = getProjectProgress(project);
  const tasks = project.tasks || [];
  const members = project.members || [];
  const expenses = project.expenses || [];
  const resources = project.resources || [];

  return (
    <div className="project-detail">
      <div className="project-detail-heading">
        <div><StatusTag status={project.status} /><Tag>{project.priority}</Tag></div>
        <Progress percent={progress} strokeColor="#1765f5" />
      </div>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Client">{project.clientName || '—'}</Descriptions.Item>
        <Descriptions.Item label="Project manager">{project.manager || '—'}</Descriptions.Item>
        <Descriptions.Item label="Timeline">{formatDate(project.startDate)} – {formatDate(project.deadline)}</Descriptions.Item>
        <Descriptions.Item label="Budget">{moneyFormatter({ amount: project.budget, currency_code: project.currency })}</Descriptions.Item>
        <Descriptions.Item label="Spent">
          <Text type={spent > project.budget ? 'danger' : undefined}>
            {moneyFormatter({ amount: spent, currency_code: project.currency })}
          </Text>
        </Descriptions.Item>
      </Descriptions>
      {project.description && <p className="project-description">{project.description}</p>}

      <section className="project-section">
        <div className="project-section-heading"><Title level={5}>Tasks <Text type="secondary">({tasks.filter((task) => task.status === 'done').length}/{tasks.length})</Text></Title><Button icon={<PlusOutlined />} onClick={() => onAdd('task')}>Add task</Button></div>
        {tasks.length ? tasks.map((task) => (
          <div className="project-entry" key={task._id || task.title}>
            <div className="project-entry-main">
              <Text strong delete={task.status === 'done'}>{task.title}</Text>
              <div className="project-entry-meta">
                {task.assignee && <span>{task.assignee}</span>}
                {task.dueDate && <span className={dayjs(task.dueDate).isBefore(now, 'day') && task.status !== 'done' ? 'project-overdue' : ''}><CalendarOutlined /> {formatDate(task.dueDate)}</span>}
                <StatusTag status={task.priority} />
              </div>
            </div>
            <Space>
              <Select
                size="small"
                value={task.status}
                options={taskStatuses}
                onChange={(status) => onUpdate({
                  tasks: tasks.map((item) => item._id === task._id ? { ...item, status, completedAt: status === 'done' ? new Date().toISOString() : null } : item),
                })}
                aria-label={`Update status for ${task.title}`}
              />
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onRemove('tasks', task._id)} aria-label={`Delete ${task.title}`} />
            </Space>
          </div>
        )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tasks yet" />}
      </section>

      <section className="project-section">
        <div className="project-section-heading"><Title level={5}>Team <Text type="secondary">({members.length})</Text></Title><Button icon={<PlusOutlined />} onClick={() => onAdd('member')}>Assign employee</Button></div>
        {members.length ? members.map((member) => (
          <div className="project-entry" key={member._id || member.name}>
            <div className="project-entry-main">
              <Space><Avatar size="small">{member.name?.[0]?.toUpperCase()}</Avatar><Text strong>{member.name}</Text></Space>
              <div className="project-entry-meta"><span>{member.role || member.email || 'Team member'}</span><span>{member.allocation}% allocation</span></div>
            </div>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onRemove('members', member._id)} aria-label={`Unassign ${member.name}`} />
          </div>
        )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No employees assigned" />}
      </section>

      <section className="project-section">
        <div className="project-section-heading"><Title level={5}>Resources <Text type="secondary">({resources.length})</Text></Title><Button icon={<PlusOutlined />} onClick={() => onAdd('resource')}>Allocate resource</Button></div>
        {resources.length ? resources.map((resource) => (
          <div className="project-entry" key={resource._id || resource.name}>
            <div className="project-entry-main">
              <Text strong>{resource.name}</Text>
              <div className="project-entry-meta">
                <span>{resource.quantity} {resource.unit || 'units'}</span>
                {resource.assignedTo && <span>{resource.assignedTo}</span>}
                {resource.category && <span>{resource.category}</span>}
              </div>
            </div>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onRemove('resources', resource._id)} aria-label={`Remove ${resource.name}`} />
          </div>
        )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No resources allocated" />}
      </section>

      <section className="project-section">
        <div className="project-section-heading"><Title level={5}>Expenses <Text type="secondary">({expenses.length})</Text></Title><Button icon={<PlusOutlined />} onClick={() => onAdd('expense')}>Record expense</Button></div>
        {expenses.length ? expenses.map((expense) => (
          <div className="project-entry" key={expense._id || `${expense.description}-${expense.date}`}>
            <div className="project-entry-main">
              <Text strong>{expense.description}</Text>
              <div className="project-entry-meta"><span>{formatDate(expense.date)}</span><span>{expense.category || 'General'}</span>{expense.submittedBy && <span>{expense.submittedBy}</span>}</div>
            </div>
            <Space>
              <Text strong>{moneyFormatter({ amount: expense.amount, currency_code: project.currency })}</Text>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => onRemove('expenses', expense._id)} aria-label={`Delete expense ${expense.description}`} />
            </Space>
          </div>
        )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No expenses recorded" />}
      </section>
    </div>
  );
}

function createCsv(columns, projects) {
  const rows = projects.map((project) => {
    const spent = getProjectSpend(project);
    const tasks = project.tasks || [];
    return [
      project.name,
      project.clientName || '',
      statusLabels[project.status] || project.status,
      project.priority,
      project.currency || '',
      project.budget,
      spent,
      Number(project.budget || 0) - spent,
      getProjectProgress(project),
      tasks.length,
      tasks.filter((task) => task.status === 'done').length,
      (project.members || []).map((member) => member.name).join('; '),
      formatDate(project.startDate),
      formatDate(project.deadline),
    ];
  });
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  return [columns, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [projectModal, setProjectModal] = useState(null);
  const [entryKind, setEntryKind] = useState(null);
  const [form] = Form.useForm();
  const { moneyFormatter, currency_code } = useMoney();
  const currentAdmin = useSelector(selectCurrentAdmin);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const response = await request.get({ entity: 'project/listAll' });
    if (response?.success) setProjects(response.result || []);
    else if (response?.result) setProjects(response.result);
    else setProjects([]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const selectedProject = projects.find((project) => project._id === selectedId);
  const filteredProjects = useMemo(() => projects.filter((project) => {
    const matchesText = `${project.name} ${project.clientName || ''} ${project.manager || ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filterStatus === 'all' || project.status === filterStatus);
  }), [filterStatus, projects, query]);

  const totals = useMemo(() => projects.reduce((summary, project) => {
    const spend = getProjectSpend(project);
    const currency = (project.currency || currency_code || 'USD').toUpperCase();
    summary.budgetByCurrency[currency] = (summary.budgetByCurrency[currency] || 0) + Number(project.budget || 0);
    summary.spendByCurrency[currency] = (summary.spendByCurrency[currency] || 0) + spend;
    summary.tasks += (project.tasks || []).length;
    summary.completedTasks += (project.tasks || []).filter((task) => task.status === 'done').length;
    if (project.status === 'active') summary.active += 1;
    if (project.status !== 'completed' && project.status !== 'cancelled' && dayjs(project.deadline).isBefore(dayjs(), 'day')) summary.overdue += 1;
    return summary;
  }, { budgetByCurrency: {}, spendByCurrency: {}, tasks: 0, completedTasks: 0, active: 0, overdue: 0 }), [currency_code, projects]);

  const saveProject = async (values) => {
    const payload = {
      ...values,
      startDate: values.startDate?.toISOString(),
      deadline: values.deadline?.toISOString(),
      currency: values.currency?.trim().toUpperCase(),
    };
    setSaving(true);
    const response = projectModal?.project
      ? await request.update({ entity: 'project', id: projectModal.project._id, jsonData: payload })
      : await request.create({ entity: 'project', jsonData: payload });
    setSaving(false);
    if (!response?.success) return;
    message.success(projectModal?.project ? 'Project updated' : 'Project created');
    const projectId = response.result?._id || projectModal?.project?._id;
    setProjectModal(null);
    await loadProjects();
    if (projectId) setSelectedId(projectId);
  };

  const updateProject = async (patch) => {
    if (!selectedProject) return;
    setSaving(true);
    const response = await request.update({ entity: 'project', id: selectedProject._id, jsonData: patch });
    if (response?.success) {
      await loadProjects();
    }
    setSaving(false);
    return Boolean(response?.success);
  };

  const addEntry = async (values) => {
    const key = `${entryKind}s`;
    const item = { ...values };
    if (item.date?.toISOString) item.date = item.date.toISOString();
    if (item.dueDate?.toISOString) item.dueDate = item.dueDate.toISOString();
    const success = await updateProject({ [key]: [...(selectedProject[key] || []), item] });
    if (success) setEntryKind(null);
    return success;
  };

  const removeEntry = (key, entryId) => {
    const items = (selectedProject[key] || []).filter((item) => item._id !== entryId);
    updateProject({ [key]: items });
  };

  const openProjectForm = (project) => {
    setProjectModal({ project });
    form.resetFields();
  };

  const downloadReport = () => {
    const blob = new Blob([`\uFEFF${createCsv(reportColumns, filteredProjects)}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-report-${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: 'Project', dataIndex: 'name', render: (name, project) => <Button type="link" className="project-name-link" onClick={() => setSelectedId(project._id)}>{name}</Button> },
    { title: 'Status', dataIndex: 'status', render: (status) => <StatusTag status={status} /> },
    { title: 'Progress', dataIndex: 'tasks', render: (_, project) => <div className="project-table-progress"><Progress percent={getProjectProgress(project)} size="small" /><Text type="secondary">{(project.tasks || []).filter((task) => task.status === 'done').length}/{(project.tasks || []).length} tasks</Text></div> },
    { title: 'Budget', dataIndex: 'budget', render: (budget, project) => moneyFormatter({ amount: budget, currency_code: project.currency }) },
    { title: 'Spent', render: (_, project) => <Text type={getProjectSpend(project) > project.budget ? 'danger' : undefined}>{moneyFormatter({ amount: getProjectSpend(project), currency_code: project.currency })}</Text> },
    { title: 'Deadline', dataIndex: 'deadline', render: (deadline, project) => <span className={dayjs(deadline).isBefore(dayjs(), 'day') && !['completed', 'cancelled'].includes(project.status) ? 'project-overdue' : ''}>{formatDate(deadline)}</span> },
    { title: 'Team', dataIndex: 'members', render: (members = []) => <span><TeamOutlined /> {members.length}</span> },
    { title: '', key: 'actions', render: (_, project) => <Button size="small" onClick={() => openProjectForm(project)}>Edit</Button> },
  ];

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <Text className="project-eyebrow">WORKSPACE / OPERATIONS</Text>
          <Title level={2}>Projects & operations</Title>
          <Text type="secondary">Plan work, manage teams and keep project budgets on track.</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openProjectForm(null)}>New project</Button>
      </div>

      <Row gutter={[16, 16]} className="project-metrics">
        <Col xs={12} xl={6}><Card><Statistic title="Total projects" value={projects.length} prefix={<ProjectOutlined />} /></Card></Col>
        <Col xs={12} xl={6}><Card><Statistic title="Active projects" value={totals.active} prefix={<ClockCircleOutlined />} /></Card></Col>
        <Col xs={12} xl={6}><Card title="Portfolio budget"><div className="project-metric-money project-currency-totals">{formatCurrencyTotals(totals.budgetByCurrency, moneyFormatter, currency_code)}</div><Text type="secondary">{formatCurrencyTotals(totals.spendByCurrency, moneyFormatter, currency_code)} spent</Text></Card></Col>
        <Col xs={12} xl={6}><Card title="Tasks completed"><div className="project-metric-money">{totals.completedTasks} <Text type="secondary">/ {totals.tasks}</Text></div><Text type={totals.overdue ? 'danger' : 'secondary'}>{totals.overdue} overdue projects</Text></Card></Col>
      </Row>

      <Card className="projects-card">
        <div className="projects-toolbar">
          <div><Title level={4}>Project portfolio</Title><Text type="secondary">{filteredProjects.length} projects</Text></div>
          <Space wrap>
            <Input.Search allowClear placeholder="Search projects" value={query} onChange={(event) => setQuery(event.target.value)} />
            <Select value={filterStatus} onChange={setFilterStatus} options={[{ value: 'all', label: 'All statuses' }, ...projectStatuses]} />
            <Button icon={<DownloadOutlined />} onClick={downloadReport}>Export report</Button>
          </Space>
        </div>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredProjects}
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: true }}
          locale={{ emptyText: loading ? 'Loading projects...' : 'Create your first project to start tracking work.' }}
          scroll={{ x: 900 }}
        />
      </Card>

      {totals.overdue > 0 && <Alert className="project-overdue-alert" type="warning" showIcon message={`${totals.overdue} project${totals.overdue === 1 ? '' : 's'} past deadline`} description="Review overdue projects and update their deadlines or status." />}

      <Drawer
        title={selectedProject?.name}
        open={Boolean(selectedProject)}
        onClose={() => setSelectedId(null)}
        width={600}
        extra={<Button onClick={() => openProjectForm(selectedProject)}>Edit project</Button>}
      >
        {selectedProject && (
          <ProjectDetails
            project={selectedProject}
            onUpdate={updateProject}
            onAdd={setEntryKind}
            onRemove={removeEntry}
          />
        )}
      </Drawer>

      <Modal
        title={projectModal?.project ? 'Edit project' : 'Create project'}
        open={Boolean(projectModal)}
        onCancel={() => setProjectModal(null)}
        footer={null}
        width={680}
        destroyOnClose
      >
        {projectModal && (
          <ProjectForm
            key={projectModal.project?._id || 'new-project'}
            form={form}
            currency={currency_code || 'USD'}
            initialValues={projectModal.project}
            onFinish={saveProject}
            onCancel={() => setProjectModal(null)}
            saving={saving}
          />
        )}
      </Modal>

      <EntryModal
        kind={entryKind}
        open={Boolean(entryKind)}
        onCancel={() => setEntryKind(null)}
        onSubmit={addEntry}
        saving={saving}
        members={selectedProject?.members || (currentAdmin?.name ? [{ name: `${currentAdmin.name} ${currentAdmin.surname || ''}`.trim() }] : [])}
      />
    </div>
  );
}
