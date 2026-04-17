const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let tasks = [
  {
    id: 1,
    title: 'Set up project structure',
    description: 'Initialize project, folders, and basic UI.',
    assignedTo: 'member@demo.com',
    status: 'In Progress',
    priority: 'High',
    createdBy: 'admin@demo.com'
  },
  {
    id: 2,
    title: 'Write documentation',
    description: 'Prepare final project documentation and usage notes.',
    assignedTo: 'member@demo.com',
    status: 'Pending',
    priority: 'Medium',
    createdBy: 'admin@demo.com'
  }
];

const users = [
  { email: 'admin@demo.com', password: 'admin123', role: 'Admin', name: 'Project Admin' },
  { email: 'member@demo.com', password: 'member123', role: 'Member', name: 'Team Member' }
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Task Management System' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid login credentials.' });
  }

  res.json({
    message: 'Login successful.',
    user: { email: user.email, role: user.role, name: user.name }
  });
});

app.get('/api/tasks', (req, res) => {
  const { email, role } = req.query;
  if (!email || !role) {
    return res.status(400).json({ message: 'Email and role are required.' });
  }

  const filteredTasks = role === 'Admin'
    ? tasks
    : tasks.filter(task => task.assignedTo === email);

  res.json(filteredTasks);
});

app.post('/api/tasks', (req, res) => {
  const { userEmail, role, title, description, assignedTo, priority } = req.body;

  if (role !== 'Admin') {
    return res.status(403).json({ message: 'Only Admin can create tasks.' });
  }

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ message: 'Task title must be at least 3 characters long.' });
  }

  if (!description || description.trim().length < 5) {
    return res.status(400).json({ message: 'Description must be at least 5 characters long.' });
  }

  if (!assignedTo) {
    return res.status(400).json({ message: 'Assigned user email is required.' });
  }

  const newTask = {
    id: tasks.length ? Math.max(...tasks.map(task => task.id)) + 1 : 1,
    title: title.trim(),
    description: description.trim(),
    assignedTo,
    status: 'Pending',
    priority: priority || 'Medium',
    createdBy: userEmail
  };

  tasks.push(newTask);
  res.status(201).json({ message: 'Task created successfully.', task: newTask });
});

app.put('/api/tasks/:id/status', (req, res) => {
  const taskId = Number(req.params.id);
  const { status, role, email } = req.body;

  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  const allowedStatuses = ['Pending', 'In Progress', 'Completed'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  if (role !== 'Admin' && task.assignedTo !== email) {
    return res.status(403).json({ message: 'You can update only your assigned tasks.' });
  }

  task.status = status;
  res.json({ message: 'Task status updated successfully.', task });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
