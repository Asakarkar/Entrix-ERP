const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, trim: true },
    department: { type: String, trim: true },
    allocation: { type: Number, min: 0, max: 100, default: 100 },
    weeklyCapacityHours: { type: Number, min: 0, default: 40 },
    hourlyRate: { type: Number, min: 0, default: 0 },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assignee: { type: String, trim: true },
    dueDate: Date,
    estimatedHours: { type: Number, min: 0, default: 0 },
    estimatedCost: { type: Number, min: 0, default: 0 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    completedAt: Date,
  },
  { _id: true }
);

const expenseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    taskId: { type: mongoose.Schema.Types.ObjectId },
    date: { type: Date, required: true, default: Date.now },
    submittedBy: { type: String, trim: true },
  },
  { _id: true }
);

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    capacity: { type: Number, min: 0, default: 0 },
    unit: { type: String, trim: true },
    assignedTo: { type: String, trim: true },
    allocatedCost: { type: Number, min: 0, default: 0 },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema({
  removed: { type: Boolean, default: false },
  name: { type: String, required: true, trim: true },
  clientName: { type: String, trim: true },
  description: { type: String, trim: true },
  manager: { type: String, trim: true },
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  budget: { type: Number, required: true, min: 0, default: 0 },
  currency: { type: String, trim: true, uppercase: true, default: 'USD' },
  startDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  members: [memberSchema],
  tasks: [taskSchema],
  expenses: [expenseSchema],
  resources: [resourceSchema],
  updated: { type: Date, default: Date.now },
  created: { type: Date, default: Date.now },
});

projectSchema.pre('findOneAndUpdate', function setUpdatedDate() {
  this.set({ updated: new Date() });
});

module.exports = mongoose.model('Project', projectSchema);
