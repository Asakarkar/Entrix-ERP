import assert from 'node:assert/strict';
import test from 'node:test';
import { buildResourceReport } from './resourceManagement.js';

test('aggregates workload, project allocations, department performance and task costs', () => {
  const report = buildResourceReport([
    {
      _id: 'project-1',
      name: 'Website',
      status: 'active',
      currency: 'USD',
      members: [
        {
          _id: 'member-1',
          name: 'Alex Employee',
          department: 'Engineering',
          allocation: 80,
          weeklyCapacityHours: 40,
        },
      ],
      tasks: [
        {
          _id: 'task-1',
          title: 'Build API',
          assignee: 'Alex Employee',
          status: 'in_progress',
          estimatedHours: 12,
          estimatedCost: 300,
        },
      ],
      expenses: [{ taskId: 'task-1', amount: 250 }],
      resources: [{ _id: 'resource-1', name: 'Test device', quantity: 3, capacity: 4 }],
    },
    {
      _id: 'project-2',
      name: 'Mobile app',
      status: 'active',
      currency: 'USD',
      members: [
        {
          _id: 'member-2',
          name: 'Alex Employee',
          department: 'Engineering',
          allocation: 50,
          weeklyCapacityHours: 40,
        },
      ],
      tasks: [
        {
          _id: 'task-2',
          title: 'Create screens',
          assignee: 'Alex Employee',
          status: 'todo',
          estimatedHours: 8,
          estimatedCost: 100,
        },
      ],
      expenses: [],
      resources: [],
    },
  ]);

  assert.equal(report.employees.length, 1);
  assert.equal(report.employees[0].capacityHours, 40);
  assert.equal(report.employees[0].allocatedHours, 52);
  assert.equal(report.employees[0].openTasks, 2);
  assert.equal(report.employees[0].estimatedHours, 20);
  assert.equal(report.allocations.length, 2);
  assert.equal(report.departments[0].capacityHours, 40);
  assert.equal(report.departments[0].allocatedHours, 52);
  assert.equal(report.departments[0].estimatedCosts.USD, 400);
  assert.equal(report.departments[0].actualCosts.USD, 250);
  assert.equal(report.tasks.find((task) => task.key === 'project-1-task-1').actualCost, 250);
  assert.equal(report.assets[0].quantity, 3);
  assert.equal(report.assets[0].capacity, 4);
});

test('keeps task-unassociated expenses visible under the unassigned department', () => {
  const report = buildResourceReport([
    {
      _id: 'project-1',
      name: 'Website',
      status: 'active',
      currency: 'USD',
      tasks: [],
      expenses: [{ amount: 75 }],
    },
  ]);

  const unassigned = report.departments.find((department) => department.name === 'Unassigned');
  assert.equal(unassigned.actualCosts.USD, 75);
});

test('excludes closed projects from current employee capacity and workload', () => {
  const report = buildResourceReport([
    {
      _id: 'project-closed',
      name: 'Archived project',
      status: 'completed',
      members: [{ name: 'Alex Employee', allocation: 100, weeklyCapacityHours: 40 }],
      tasks: [
        {
          _id: 'task-open',
          title: 'Archived open task',
          assignee: 'Alex Employee',
          status: 'todo',
          estimatedHours: 8,
        },
      ],
    },
  ]);

  assert.equal(report.employees[0].capacityHours, 0);
  assert.equal(report.employees[0].allocatedHours, 0);
  assert.equal(report.employees[0].openTasks, 0);
  assert.equal(report.allocations[0].allocatedHours, 0);
});
