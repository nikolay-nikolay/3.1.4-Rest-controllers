// ------------------------
// admin.js
// ------------------------

// DOM элементы
let currentUser = null;
let usersData = [];
let userToDelete = null;

// Базовый URL для API
const API_BASE = '/api/admin';

// ------------------------
// Инициализация
// ------------------------
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentUser();
    await loadUsers();
    setupTabSwitching();
    setupModals();
    setupForms();
});

// ------------------------
// Загрузка текущего пользователя
// ------------------------
async function loadCurrentUser() {
    try {
        const response = await fetch('/api/user', { credentials: 'same-origin' });
        if (response.ok) {
            currentUser = await response.json();
        } else {
            // fallback
            currentUser = {
                id: 1,
                username: document.getElementById('currentUsername').textContent,
                roles: ['ROLE_ADMIN', 'ROLE_USER']
            };
        }
        updateUIWithCurrentUser();
    } catch (e) {
        console.error('Ошибка при загрузке текущего пользователя:', e);
    }
}

function updateUIWithCurrentUser() {
    document.getElementById('currentUsername').textContent = currentUser.username;
    updateCurrentUserInfo();
    updateCurrentUserSidebarInfo();
}

function updateCurrentUserInfo() {
    const userInfoDiv = document.getElementById('userInfo');
    let html = '<div class="user-details">';
    html += `<h3>Данные профиля</h3>`;
    html += `<div class="detail-row"><div class="detail-label">ID:</div><div class="detail-value">${currentUser.id}</div></div>`;
    html += `<div class="detail-row"><div class="detail-label">Имя пользователя:</div><div class="detail-value">${currentUser.username}</div></div>`;
    html += `<div class="detail-row"><div class="detail-label">Роли:</div><div class="detail-value">`;
    currentUser.roles.forEach(role => {
        const badgeClass = role === 'ROLE_ADMIN' ? 'badge-admin' : 'badge-user';
        html += `<span class="badge ${badgeClass}">${role}</span>`;
    });
    html += '</div></div></div>';
    userInfoDiv.innerHTML = html;
}

function updateCurrentUserSidebarInfo() {
    const currentUserInfoDiv = document.getElementById('currentUserInfo');
    let html = `<p><strong>Текущий пользователь:</strong> ${currentUser.username}</p>`;
    html += `<p><strong>Роли:</strong> ${currentUser.roles.join(', ')}</p>`;
    currentUserInfoDiv.innerHTML = html;
}

// ------------------------
// Загрузка пользователей
// ------------------------
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`, { credentials: 'same-origin' });
        if (response.ok) {
            usersData = await response.json();
            renderUsersTable();
        } else {
            showNotification('Ошибка при загрузке пользователей', 'error');
        }
    } catch (e) {
        console.error(e);
        showNotification('Ошибка при загрузке пользователей', 'error');
    }
}

// ------------------------
// Рендер таблицы пользователей
// ------------------------
function renderUsersTable() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';

    usersData.forEach(user => {
        const row = document.createElement('tr');

        // ID
        const idCell = document.createElement('td');
        idCell.textContent = user.id;
        row.appendChild(idCell);

        // Username
        const usernameCell = document.createElement('td');
        usernameCell.textContent = user.username;
        row.appendChild(usernameCell);

        // Roles
        const rolesCell = document.createElement('td');
        if (user.roles && Array.isArray(user.roles)) {
            user.roles.forEach(role => {
                const badge = document.createElement('span');
                const roleName = role.name || role; // поддержка JSON с объектом или строкой
                badge.className = `badge ${roleName === 'ROLE_ADMIN' ? 'badge-admin' : 'badge-user'}`;
                badge.textContent = roleName;
                rolesCell.appendChild(badge);
            });
        }
        row.appendChild(rolesCell);

        // Edit button
        const editCell = document.createElement('td');
        const editButton = document.createElement('button');
        editButton.className = 'btn btn-primary';
        editButton.textContent = 'Редактировать';
        editButton.addEventListener('click', () => openEditModal(user));
        editCell.appendChild(editButton);
        row.appendChild(editCell);

        // Delete button
        const deleteCell = document.createElement('td');
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger';
        deleteButton.textContent = 'Удалить';
        deleteButton.addEventListener('click', () => openDeleteModal(user));
        deleteCell.appendChild(deleteButton);
        row.appendChild(deleteCell);

        tbody.appendChild(row);
    });
}

// ------------------------
// Переключение вкладок
// ------------------------
function setupTabSwitching() {
    document.getElementById('adminTab').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('adminTab').classList.add('active');
        document.getElementById('userTab').classList.remove('active');
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('userPanel').style.display = 'none';
    });
    document.getElementById('userTab').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('userTab').classList.add('active');
        document.getElementById('adminTab').classList.remove('active');
        document.getElementById('userPanel').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
    });
    document.getElementById('usersTabLink').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('usersTabLink').classList.add('active');
        document.getElementById('createTabLink').classList.remove('active');
        document.getElementById('usersTab').classList.add('active');
        document.getElementById('createTab').classList.remove('active');
    });
    document.getElementById('createTabLink').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('createTabLink').classList.add('active');
        document.getElementById('usersTabLink').classList.remove('active');
        document.getElementById('createTab').classList.add('active');
        document.getElementById('usersTab').classList.remove('active');
    });
}

// ------------------------
// Модальные окна
// ------------------------
function setupModals() {
    const editOverlay = document.getElementById('editModalOverlay');
    const closeEdit = document.getElementById('closeEditModal');
    const cancelEdit = document.getElementById('cancelEdit');
    closeEdit.addEventListener('click', () => editOverlay.classList.remove('active'));
    cancelEdit.addEventListener('click', () => editOverlay.classList.remove('active'));
    editOverlay.addEventListener('click', e => {
        if (e.target === editOverlay) editOverlay.classList.remove('active');
    });

    const deleteOverlay = document.getElementById('deleteModalOverlay');
    const closeDelete = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    closeDelete.addEventListener('click', () => deleteOverlay.classList.remove('active'));
    cancelDelete.addEventListener('click', () => deleteOverlay.classList.remove('active'));
    deleteOverlay.addEventListener('click', e => {
        if (e.target === deleteOverlay) deleteOverlay.classList.remove('active');
    });

    document.getElementById('saveEdit').addEventListener('click', saveUserChanges);
    document.getElementById('confirmDelete').addEventListener('click', deleteUser);
}

// ------------------------
// Формы
// ------------------------
function setupForms() {
    // Создание пользователя
    document.getElementById('createUserForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        const username = formData.get('username');
        const password = formData.get('password');
        const roleIds = Array.from(formData.getAll('roles')).map(r => parseInt(r));

        const payload = { username, password, roleIds };

        try {
            const response = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }
            await loadUsers();
            showNotification(`Пользователь ${username} создан`, 'success');
            this.reset();
            document.getElementById('usersTabLink').click();
        } catch (err) {
            console.error(err);
            showNotification(`Ошибка при создании пользователя: ${err.message}`, 'error');
        }
    });
}

// ------------------------
// Редактирование
// ------------------------
function openEditModal(user) {
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUsername').value = user.username;
    const roleSelect = document.getElementById('editRoles');
    Array.from(roleSelect.options).forEach(opt => opt.selected = false);
    if (user.roles) {
        user.roles.forEach(r => {
            Array.from(roleSelect.options).forEach(opt => {
                if (opt.text === (r.name || r)) opt.selected = true;
            });
        });
    }
    document.getElementById('editModalOverlay').classList.add('active');
}

async function saveUserChanges() {
    const userId = parseInt(document.getElementById('editUserId').value);
    const username = document.getElementById('editUsername').value;
    const password = document.getElementById('editPassword').value;
    const roleSelect = document.getElementById('editRoles');
    const roleIds = Array.from(roleSelect.selectedOptions).map(opt => parseInt(opt.value));

    const payload = { username, roleIds };
    if (password.trim() !== '') payload.password = password;

    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await response.text());
        await loadUsers();
        document.getElementById('editModalOverlay').classList.remove('active');
        document.getElementById('editPassword').value = '';
        showNotification(`Пользователь ${username} обновлён`, 'success');
    } catch (err) {
        console.error(err);
        showNotification(`Ошибка при обновлении пользователя: ${err.message}`, 'error');
    }
}

// ------------------------
// Удаление
// ------------------------
function openDeleteModal(user) {
    userToDelete = user;
    document.getElementById('deleteUserName').textContent = user.username;
    document.getElementById('deleteModalOverlay').classList.add('active');
}

async function deleteUser() {
    if (!userToDelete) return;
    const userId = userToDelete.id;
    const username = userToDelete.username;
    try {
        const response = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        if (!response.ok) throw new Error(await response.text());
        usersData = usersData.filter(u => u.id !== userId);
        renderUsersTable();
        document.getElementById('deleteModalOverlay').classList.remove('active');
        showNotification(`Пользователь ${username} удалён`, 'success');
    } catch (err) {
        console.error(err);
        showNotification(`Ошибка при удалении пользователя: ${err.message}`, 'error');
    }
}

// ------------------------
// Уведомления
// ------------------------
function showNotification(msg, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = msg;
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        border-radius: 4px; color: white; font-weight: 500; z-index:1001;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
        background-color: ${type==='success'?'#27ae60':type==='error'?'#e74c3c':'#3498db'};
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
