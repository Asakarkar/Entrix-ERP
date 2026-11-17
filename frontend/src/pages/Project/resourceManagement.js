function normalizeEmployeeName(name) {
  return String(name || '').trim().toLowerCase();
}

export function getTaskActualCost(project, taskId) {
  return (project.expenses || []).reduce(
    (total, expense) => total + (String(expense.taskId || '') === String(taskId) ? Number(expense.amount || 0) : 0),
    0
  );
}

export function buildResourceReport(projects) {
  const employees = new Map();
  const departments = new Map();
  const allocations = [];
  const assets = [];
  const tasks = [];
  const departmentFor = (name) => {
    const departmentName = String(name || '').trim() || 'Unassigned';
    if (!departments.has(departmentName)) {
      departments.set(departmentName, {
        name: departmentName,
        employees: new Set(),
        capacityHours: 0,
        allocatedHours: 0,
        taskCount: 0,
        completedTasks: 0,
        estimatedCosts: {},
        actualCosts: {},
      });
    }
    return departments.get(departmentName);
  };
  const employeeFor = (name) => {
    const displayName = String(name || '').trim();
    const key = normalizeEmployeeName(displayName);
    if (!key) return null;
    if (!employees.has(key)) {
      employees.set(key, {
        key,
        name: displayName,
        department: 'Unassigned',
        capacityHours: 0,
        allocatedHours: 0,
        openTasks: 0,
        completedTasks: 0,
        estimatedHours: 0,
        projects: [],
      });
    }
    return employees.get(key);
  };

  (projects || []).forEach((project) => {
    const currency = project.currency || 'USD';
    const activeProject = !['on_hold', 'completed', 'cancelled'].includes(project.status);
    const projectMembers = new Map();

    (project.members || []).forEach((member) => {
      const employee = employeeFor(member.name);
      if (!employee) return;

      const memberDepartment = String(member.department || '').trim();
      if (employee.department === 'Unassigned' && memberDepartment) {
        employee.department = memberDepartment;
      }
      const capacity = Number(member.weeklyCapacityHours ?? 40);
      const allocation = Number(member.allocation ?? 100);
      const allocatedHours = capacity * allocation / 100;
      if (activeProject) {
        employee.capacityHours = Math.max(employee.capacityHours, capacity);
        employee.allocatedHours += allocatedHours;
      }
      employee.projects.push({
        project: project.name,
        status: project.status,
        allocation,
        allocatedHours: activeProject ? allocatedHours : 0,
      });
      projectMembers.set(normalizeEmployeeName(member.name), employee);
      allocations.push({
        key: `${project._id}-${member._id || member.name}`,
        project: project.name,
        status: project.status,
        employee: member.name,
        department: member.department || 'Unassigned',
        allocation,
        allocatedHours: activeProject ? allocatedHours : 0,
      });
    });

    const taskOwners = new Map();
    (project.tasks || []).forEach((task) => {
      const owner = projectMembers.get(normalizeEmployeeName(task.assignee)) || employeeFor(task.assignee);
      const departmentName = owner?.department || 'Unassigned';
      const department = departmentFor(departmentName);
      department.taskCount += 1;
      if (task.status === 'done') department.completedTasks += 1;
      department.estimatedCosts[currency] =
        (department.estimatedCosts[currency] || 0) + Number(task.estimatedCost || 0);

      if (owner) {
        if (task.status === 'done') owner.completedTasks += 1;
        else if (activeProject) {
          owner.openTasks += 1;
          owner.estimatedHours += Number(task.estimatedHours || 0);
        }
        taskOwners.set(String(task._id), { owner, department });
      } else {
        taskOwners.set(String(task._id), { owner: null, department });
      }

      tasks.push({
        key: `${project._id}-${task._id}`,
        project: project.name,
        title: task.title,
        assignee: task.assignee || 'Unassigned',
        department: departmentName,
        status: task.status,
        estimatedHours: Number(task.estimatedHours || 0),
        estimatedCost: Number(task.estimatedCost || 0),
        actualCost: getTaskActualCost(project, task._id),
        currency,
      });
    });

    (project.expenses || []).forEach((expense) => {
      const taskOwner = expense.taskId ? taskOwners.get(String(expense.taskId)) : null;
      const department = taskOwner?.department || departmentFor('Unassigned');
      const amount = Number(expense.amount || 0);
      department.actualCosts[currency] = (department.actualCosts[currency] || 0) + amount;
    });

    (project.resources || []).forEach((resource) => {
      assets.push({
        key: `${project._id}-${resource._id || resource.name}`,
        project: project.name,
        status: project.status,
        name: resource.name,
        category: resource.category || 'General',
        assignedTo: resource.assignedTo || 'Unassigned',
        quantity: Number(resource.quantity || 0),
        capacity: Number(resource.capacity || 0),
        unit: resource.unit || '',
        allocatedCost: Number(resource.allocatedCost || 0),
        currency,
      });
    });
  });

  employees.forEach((employee) => {
    const department = departmentFor(employee.department);
    department.employees.add(employee.key);
    department.capacityHours += employee.capacityHours;
    department.allocatedHours += employee.allocatedHours;
  });

  return {
    employees: Array.from(employees.values()).sort((a, b) => a.name.localeCompare(b.name)),
    departments: Array.from(departments.values()).sort((a, b) => a.name.localeCompare(b.name)),
    allocations,
    assets,
    tasks,
  };
}
