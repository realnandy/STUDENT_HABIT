const API_URL = 'http://localhost:5000/api';

let allTasks = [];
let editingTaskId = null;
let currentFilters = {
  subject: 'All',
  priority: 'All',
  status: 'All',
  search: '',
  sort: 'deadline'
};

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    document.getElementById('userName').textContent = `Welcome, ${user.name}`;
  }

  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeButton();

  loadTasks();
  loadStats();

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('addTaskBtn').addEventListener('click', openAddTaskModal);
  document.getElementById('cancelTaskBtn').addEventListener('click', closeModal);
  document.querySelector('.close-modal').addEventListener('click', closeModal);
  document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    renderTasks();
  });

  document.getElementById('filterSubject').addEventListener('change', (e) => {
    currentFilters.subject = e.target.value;
    renderTasks();
  });

  document.getElementById('filterPriority').addEventListener('change', (e) => {
    currentFilters.priority = e.target.value;
    renderTasks();
  });

  document.getElementById('filterStatus').addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    renderTasks();
  });

  document.getElementById('sortBy').addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    loadTasks();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('taskModal').classList.contains('hidden')) {
      closeModal();
    }
  });

  document.getElementById('taskModal').addEventListener('click', (e) => {
    if (e.target.id === 'taskModal') {
      closeModal();
    }
  });

  const themeToggle = document.createElement('button');
  themeToggle.className = 'theme-toggle';
  themeToggle.id = 'themeToggle';
  themeToggle.textContent = 'Toggle Theme';
  themeToggle.addEventListener('click', toggleTheme);
  document.body.appendChild(themeToggle);
});

async function loadTasks() {
  try {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (currentFilters.subject !== 'All') params.append('subject', currentFilters.subject);
    if (currentFilters.priority !== 'All') params.append('priority', currentFilters.priority);
    if (currentFilters.status !== 'All') params.append('status', currentFilters.status);
    if (currentFilters.sort) params.append('sort', currentFilters.sort);
    
    const response = await fetch(`${API_URL}/tasks?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load tasks');
    }
    
    const data = await response.json();
    allTasks = data.tasks;
    
    updateSubjectFilter();
    renderTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function loadStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tasks/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load stats');
    }
    
    const stats = await response.json();
    
    document.getElementById('statTotal').textContent = stats.totalTasks;
    document.getElementById('statCompleted').textContent = stats.completedTasks;
    document.getElementById('statPending').textContent = stats.pendingTasks;
    document.getElementById('statOverdue').textContent = stats.overdueTasks;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function updateSubjectFilter() {
  const subjects = [...new Set(allTasks.map(t => t.subject))];
  const filterSelect = document.getElementById('filterSubject');
  const subjectList = document.getElementById('subjectList');
  
  filterSelect.innerHTML = '<option value="All">All Subjects</option>';
  subjectList.innerHTML = '';
  
  subjects.forEach(subject => {
    filterSelect.innerHTML += `<option value="${subject}">${subject}</option>`;
    subjectList.innerHTML += `<option value="${subject}">`;
  });
}

function renderTasks() {
  const taskList = document.getElementById('taskList');
  const emptyState = document.getElementById('emptyState');
  
  let filteredTasks = allTasks.filter(task => {
    const matchesSearch = currentFilters.search === '' || 
      task.title.toLowerCase().includes(currentFilters.search) ||
      task.description?.toLowerCase().includes(currentFilters.search) ||
      task.subject.toLowerCase().includes(currentFilters.search);
    
    return matchesSearch;
  });
  
  if (filteredTasks.length === 0) {
    taskList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  taskList.innerHTML = filteredTasks.map(task => {
    const deadline = new Date(task.deadline);
    const now = new Date();
    const isOverdue = deadline < now && task.status === 'Pending';
    const formattedDeadline = formatDate(deadline);
    
    return `
      <div class="task-card priority-${task.priority.toLowerCase()} ${task.status === 'Completed' ? 'completed' : ''}">
        <div class="task-header">
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          <span class="task-status ${task.status.toLowerCase()}">${task.status}</span>
        </div>
        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          <div class="task-meta-item">
            <span class="label">Subject:</span>
            <span>${escapeHtml(task.subject)}</span>
          </div>
          <div class="task-meta-item">
            <span class="label">Priority:</span>
            <span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
          </div>
          <div class="task-meta-item task-deadline ${isOverdue ? 'overdue' : ''}">
            <span class="label">Deadline:</span>
            <span>${formattedDeadline}${isOverdue ? ' (Overdue)' : ''}</span>
          </div>
        </div>
        <div class="task-actions">
          ${task.status === 'Pending' ? 
            `<button class="btn btn-success btn-sm" onclick="toggleTaskStatus('${task._id}', 'Completed')">Mark Complete</button>` :
            `<button class="btn btn-secondary btn-sm" onclick="toggleTaskStatus('${task._id}', 'Pending')">Mark Pending</button>`
          }
          <button class="btn btn-secondary btn-sm" onclick="openEditTaskModal('${task._id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTask('${task._id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function formatDate(date) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openAddTaskModal() {
  editingTaskId = null;
  document.getElementById('modalTitle').textContent = 'Add New Task';
  document.getElementById('saveTaskBtn').textContent = 'Add Task';
  document.getElementById('taskForm').reset();
  document.getElementById('taskId').value = '';
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);
  document.getElementById('taskDeadline').value = tomorrow.toISOString().slice(0, 16);
  
  document.getElementById('taskModal').classList.remove('hidden');
}

function openEditTaskModal(taskId) {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;
  
  editingTaskId = taskId;
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('saveTaskBtn').textContent = 'Update Task';
  document.getElementById('taskId').value = taskId;
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskSubject').value = task.subject;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskDeadline').value = new Date(task.deadline).toISOString().slice(0, 16);
  
  document.getElementById('taskModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('taskModal').classList.add('hidden');
  editingTaskId = null;
}

async function handleTaskSubmit(e) {
  e.preventDefault();
  
  const taskData = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    subject: document.getElementById('taskSubject').value,
    priority: document.getElementById('taskPriority').value,
    deadline: document.getElementById('taskDeadline').value
  };
  
  try {
    const token = localStorage.getItem('token');
    const url = editingTaskId ? `${API_URL}/tasks/${editingTaskId}` : `${API_URL}/tasks`;
    const method = editingTaskId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      throw new Error(editingTaskId ? 'Failed to update task' : 'Failed to create task');
    }
    
    closeModal();
    loadTasks();
    loadStats();
    showToast(editingTaskId ? 'Task updated successfully' : 'Task created successfully', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function toggleTaskStatus(taskId, status) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update task status');
    }
    
    loadTasks();
    loadStats();
    showToast(`Task marked as ${status.toLowerCase()}`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
    
    loadTasks();
    loadStats();
    showToast('Task deleted successfully', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton();
}

function updateThemeButton() {
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const theme = document.documentElement.getAttribute('data-theme');
    themeToggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
}

function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
