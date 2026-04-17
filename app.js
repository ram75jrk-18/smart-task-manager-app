const notification = document.getElementById('notification');
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const taskFormSection = document.getElementById('taskFormSection');
const taskList = document.getElementById('taskList');
const welcomeText = document.getElementById('welcomeText');

let currentUser = null;

function showNotification(message, type = 'success') {
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');
  setTimeout(() => notification.classList.add('hidden'), 2500);
}

async function loadTasks() {
  if (!currentUser) return;
  const res = await fetch(`/api/tasks?email=${encodeURIComponent(currentUser.email)}&role=${encodeURIComponent(currentUser.role)}`);
  const tasks = await res.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  if (!tasks.length) {
    taskList.innerHTML = '<p>No tasks available.</p>';
    return;
  }

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = 'task-card';

    const canUpdate = currentUser.role === 'Admin' || task.assignedTo === currentUser.email;

    card.innerHTML = `
      <h4>${task.title}</h4>
      <p>${task.description}</p>
      <div class="task-meta">
        <span><strong>Assigned To:</strong> ${task.assignedTo}</span>
        <span><strong>Priority:</strong> ${task.priority}</span>
        <span><strong>Created By:</strong> ${task.createdBy}</span>
      </div>
      <label><strong>Status:</strong></label>
      <select ${canUpdate ? '' : 'disabled'} data-id="${task.id}">
        <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
      </select>
    `;

    const select = card.querySelector('select');
    select.addEventListener('change', async (e) => {
      const status = e.target.value;
      const response = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, role: currentUser.role, email: currentUser.email })
      });
      const data = await response.json();
      if (!response.ok) {
        showNotification(data.message, 'error');
        loadTasks();
        return;
      }
      showNotification(data.message, 'success');
      loadTasks();
    });

    taskList.appendChild(card);
  });
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    showNotification(data.message, 'error');
    return;
  }

  currentUser = data.user;
  loginSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  welcomeText.textContent = `${currentUser.name} (${currentUser.role})`; 
  if (currentUser.role === 'Admin') taskFormSection.classList.remove('hidden');
  showNotification(data.message, 'success');
  loadTasks();
});

document.getElementById('taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const assignedTo = document.getElementById('assignedTo').value.trim();
  const priority = document.getElementById('priority').value;

  if (title.length < 3) {
    showNotification('Title must be at least 3 characters.', 'error');
    return;
  }
  if (description.length < 5) {
    showNotification('Description must be at least 5 characters.', 'error');
    return;
  }

  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userEmail: currentUser.email,
      role: currentUser.role,
      title,
      description,
      assignedTo,
      priority
    })
  });

  const data = await res.json();
  if (!res.ok) {
    showNotification(data.message, 'error');
    return;
  }

  showNotification(data.message, 'success');
  e.target.reset();
  loadTasks();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  loginSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  taskFormSection.classList.add('hidden');
  taskList.innerHTML = '';
  document.getElementById('loginForm').reset();
  showNotification('Logged out successfully.', 'success');
});
