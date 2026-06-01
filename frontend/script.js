// State
let tasks = [];
let monthlyExpenses = [];
let tripPeople = [];
let tripExpenses = [];
let notes = [];
let categories = ["Food 🍔", "Travel ✈️", "Health 🏥", "Leisure 🎮"];
let currentCurrency = "$";

let viewDate = new Date();
let selectedDate = null;

document.addEventListener('DOMContentLoaded', () => {
    checkActiveSession();
    initApp();
});

function checkActiveSession() {
    const session = localStorage.getItem('myBuddySession');
    if (session) {
        currentUser = session;
        loadUserData();
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
        updateDashboard();
    }
}

function initApp() {
    initTheme();
    renderCalendar();
    renderMiniCalendar();
    updateDashboard();
}

function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        themeBtn.innerText = document.body.classList.contains('dark-theme') ? 'Light Mode' : 'Dark Mode';
    });
}

// 🔐 Authentication
function toggleAuth(showSignup) {
    document.getElementById('login-form').classList.toggle('hidden', showSignup);
    document.getElementById('signup-form').classList.toggle('hidden', !showSignup);
}

function handleRegister() {
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    if (!user || !pass) return alert("Please fill all fields!");

    let users = JSON.parse(localStorage.getItem('myBuddyUsers') || '[]');
    if (users.find(u => u.username === user)) return alert("Username already exists!");

    users.push({ username: user, password: pass });
    localStorage.setItem('myBuddyUsers', JSON.stringify(users));
    alert("Account created! You can now sign in.");
    toggleAuth(false);
}

function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    let users = JSON.parse(localStorage.getItem('myBuddyUsers') || '[]');
    const adminExists = users.find(u => u.username === 'admin');
    if (!adminExists) { // Auto-create default admin if not exists
        users.push({ username: 'admin', password: 'admin' });
        localStorage.setItem('myBuddyUsers', JSON.stringify(users));
    }

    const foundUser = users.find(u => u.username === user && u.password === pass);

    if (foundUser) {
        document.getElementById('login-overlay').classList.add('hidden');
        document.getElementById('app-wrapper').classList.remove('hidden');
        currentUser = user;
        localStorage.setItem('myBuddySession', user);
        loadUserData();
        updateDashboard();
    } else {
        alert("Invalid credentials. Try creating an account!");
    }
}

function handleLogout() {
    localStorage.removeItem('myBuddySession');
    location.reload();
}

// 🧭 Global Currency
function updateCurrency() {
    currentCurrency = document.getElementById('currency-select').value;
    updateDashboard();
    renderMonthlyExpenses();
    calculateTripSplit();
}

function formatVal(num) {
    return `${currentCurrency}${num.toFixed(2)}`;
}

// 🗺️ Navigation
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.querySelector(`[onclick="showView('${viewId}')"]`).classList.add('active');

    const titles = {
        'dashboard': 'Dashboard',
        'tasks': 'Task Planner',
        'calendar': 'Calendar',
        'monthly-expenses': 'Monthly Budget',
        'trip-splitter': 'Trip Splitter',
        'notes': 'My Notes'
    };
    document.getElementById('view-title').innerText = titles[viewId];
}

// 📊 Dashboard Refinement
function updateDashboard() {
    // Important Tasks Summary
    const important = tasks.filter(t => t.important && !t.completed).slice(0, 4);
    const summaryList = document.getElementById('important-tasks-summary');
    summaryList.innerHTML = important.length ? important.map(t => `
        <div class="summary-item">
            <div>
                <strong>${t.name}</strong><br>
                <small style="opacity:0.6">${t.date}</small>
            </div>
            <span class="text-accent" style="font-size:12px">${t.time}</span>
        </div>
    `).join('') : '<p style="opacity:0.5; font-size:13px;">No critical tasks. Savor the peace!</p>';

    // Budget Health
    const totalExp = monthlyExpenses.reduce((s, e) => s + e.amt, 0);
    const totalTrip = tripExpenses.reduce((s, e) => s + e.amt, 0);
    document.getElementById('dash-monthly-amt').innerText = formatVal(totalExp);
    document.getElementById('dash-trip-amt').innerText = formatVal(totalTrip);

    renderMiniCalendar();
}

// 📅 Mini Calendar Preview
function renderMiniCalendar() {
    const grid = document.getElementById('mini-calendar-grid');
    const monthLabel = document.getElementById('mini-cal-month');
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    monthLabel.innerText = months[now.getMonth()];
    grid.innerHTML = '';

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(now.getFullYear(), now.getMonth() + 1, d);
        const div = document.createElement('div');
        div.className = 'mini-day';
        div.innerText = d;
        if (d === now.getDate()) div.classList.add('today');
        if (tasks.some(t => t.date === dateStr)) div.classList.add('has-task');
        grid.appendChild(div);
    }
}

// ✅ Advanced Tasks
function addTask() {
    const name = document.getElementById('task-name').value;
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value;
    const notes = document.getElementById('task-notes').value;
    const important = document.getElementById('task-important-toggle').checked;

    if (!name || !date) return alert("Fill mandatory fields");

    tasks.push({ id: Date.now(), name, date, time, notes, important, completed: false });
    resetTaskFields();
    renderAllTasks();
    renderCalendar();
    updateDashboard();
}

function resetTaskFields() {
    document.getElementById('task-name').value = '';
    document.getElementById('task-date').value = '';
    document.getElementById('task-time').value = '';
    document.getElementById('task-notes').value = '';
    document.getElementById('task-important-toggle').checked = false;
}

function renderAllTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = tasks.sort((a, b) => new Date(a.date) - new Date(b.date)).map(t => `
        <div class="card glass mt-10">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="${t.completed ? 'text-decoration: line-through; opacity:0.5' : ''}">
                        ${t.important ? '<span style="color:#f59e0b">★</span> ' : ''}${t.name}
                    </h3>
                    <p style="font-size:13px; color:var(--text-muted)">${t.date} | ${t.time}</p>
                    ${t.notes ? `<p style="font-size:12px; margin-top:8px; font-weight:300;">${t.notes}</p>` : ''}
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <button class="star-btn ${t.important ? 'active' : ''}" onclick="toggleImportant(${t.id})">★</button>
                    <input type="checkbox" ${t.completed ? 'checked' : ''} onclick="toggleTask(${t.id})">
                </div>
            </div>
        </div>
    `).join('');
}

function toggleImportant(id) {
    const t = tasks.find(x => x.id === id);
    if (t) t.important = !t.important;
    renderAllTasks();
}

function toggleTask(id) {
    const t = tasks.find(x => x.id === id);
    if (t) t.completed = !t.completed;
    renderAllTasks();
    renderCalendar();
    updateDashboard();
}

// 📅 Main Calendar
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const head = document.getElementById('calendar-month-year');
    const dayLabels = document.getElementById('calendar-days');
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    head.innerText = `${months[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    dayLabels.innerHTML = days.map(d => `<div>${d}</div>`).join('');
    grid.innerHTML = '';

    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = formatDate(viewDate.getFullYear(), viewDate.getMonth() + 1, d);
        const div = document.createElement('div');
        div.className = 'cal-day';
        div.innerText = d;
        if (dateStr === formatDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())) div.classList.add('today');
        if (tasks.some(t => t.date === dateStr)) div.classList.add('has-task');
        if (selectedDate === dateStr) div.classList.add('selected');
        div.onclick = () => openDayPanel(dateStr);
        grid.appendChild(div);
    }
}

function changeMonth(d) { viewDate.setMonth(viewDate.getMonth() + d); renderCalendar(); }

function openDayPanel(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
    const panel = document.getElementById('calendar-day-panel');
    const list = document.getElementById('panel-tasks');
    document.getElementById('panel-date').innerText = dateStr;

    const dayTasks = tasks.filter(t => t.date === dateStr);
    panel.classList.remove('hidden');
    list.innerHTML = dayTasks.length ?
        dayTasks.map(t => `<div class="summary-item"><strong>${t.name}</strong> ${t.time}</div>`).join('') :
        '<p style="opacity:0.5; font-size:14px;">Free as a bird!</p>';
}

function closeDayPanel() { document.getElementById('calendar-day-panel').classList.add('hidden'); selectedDate = null; renderCalendar(); }

// 💰 Budget Logic
function addMonthlyExpense() {
    const desc = document.getElementById('exp-desc').value;
    const amt = parseFloat(document.getElementById('exp-amt').value);
    let cat = document.getElementById('exp-cat').value;
    const custom = document.getElementById('custom-cat').value;

    if (custom) {
        cat = custom;
        if (!categories.includes(cat)) {
            categories.push(cat);
            document.getElementById('exp-cat').innerHTML += `<option value="${cat}">${cat}</option>`;
        }
    }

    if (!desc || isNaN(amt)) return alert("Invalid inputs");
    monthlyExpenses.push({ desc, amt, cat, id: Date.now() });

    document.getElementById('exp-desc').value = '';
    document.getElementById('exp-amt').value = '';
    document.getElementById('custom-cat').value = '';
    renderMonthlyExpenses();
}

function renderMonthlyExpenses() {
    const total = monthlyExpenses.reduce((s, e) => s + e.amt, 0);
    document.getElementById('total-monthly-amt').innerText = formatVal(total);

    const breakdown = {};
    monthlyExpenses.forEach(e => breakdown[e.cat] = (breakdown[e.cat] || 0) + e.amt);
    const list = document.getElementById('category-list');
    list.innerHTML = Object.entries(breakdown).map(([c, a]) => `
        <div class="summary-item">
            <span>${c}</span>
            <strong class="text-accent">${formatVal(a)}</strong>
        </div>
    `).join('');
    updateDashboard();
}

// ✈️ Trip Logic
function addTripPerson() {
    const name = document.getElementById('trip-person').value;
    if (!name || tripPeople.includes(name)) return;
    tripPeople.push(name);
    document.getElementById('trip-person').value = '';
    renderTripPeople();
}

function renderTripPeople() {
    document.getElementById('trip-people-list').innerHTML = tripPeople.map(p => `<span class="pill">${p}</span>`).join('');
    document.getElementById('trip-exp-payer').innerHTML = tripPeople.map(p => `<option value="${p}">${p}</option>`).join('');
}

function addTripExpense() {
    const d = document.getElementById('trip-exp-desc').value;
    const a = parseFloat(document.getElementById('trip-exp-amt').value);
    const p = document.getElementById('trip-exp-payer').value;
    if (!d || isNaN(a) || !p) return alert("Error");
    tripExpenses.push({ desc: d, amt: a, payer: p });
    document.getElementById('trip-exp-desc').value = '';
    document.getElementById('trip-exp-amt').value = '';
    calculateTripSplit();
}

function calculateTripSplit() {
    if (tripPeople.length < 2) return;
    let total = tripExpenses.reduce((s, e) => s + e.amt, 0);
    let share = total / tripPeople.length;
    let bals = {};
    tripPeople.forEach(p => bals[p] = -share);
    tripExpenses.forEach(e => bals[e.payer] += e.amt);

    let ps = [], rs = [];
    Object.keys(bals).forEach(p => {
        if (bals[p] < -0.01) ps.push({ n: p, a: -bals[p] });
        else if (bals[p] > 0.01) rs.push({ n: p, a: bals[p] });
    });

    let s = [];
    let i = 0, j = 0;
    while (i < ps.length && j < rs.length) {
        let p = ps[i], r = rs[j], m = Math.min(p.a, r.a);
        s.push(`<strong>${p.n}</strong> pays ${formatVal(m)} to <strong>${r.n}</strong>`);
        p.a -= m; r.a -= m;
        if (p.a <= 0) i++; if (r.a <= 0) j++;
    }
    document.getElementById('trip-settlements').innerHTML = s.map(x => `<div class="summary-item accent-border">${x}</div>`).join('') || '<p>All set!</p>';
    updateDashboard();
}


// 📝 Notes Logic
function renderNotes() {
    const grid = document.getElementById('notes-grid');
    if (!grid) return;
    grid.innerHTML = notes.map(n => `
        <div class="card glass note-card">
            <button class="btn-delete-note" onclick="deleteNote(${n.id})">×</button>
            <h3>${n.title}</h3>
            <p>${n.content}</p>
        </div>
    `).join('') || '<p style="opacity:0.5; grid-column: 1/-1; text-align: center;">No notes yet. Start writing!</p>';
}

function addNote() {
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;
    if (!title && !content) return alert("Note cannot be empty!");

    notes.push({ id: Date.now(), title: title || "Untitled Note", content });
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    renderNotes();
}

function deleteNote(id) {
    notes = notes.filter(n => n.id !== id);
    renderNotes();
}


// 💾 Data Persistence
function saveUserData() {
    if (!currentUser) return;
    const data = {
        tasks,
        monthlyExpenses,
        tripPeople,
        tripExpenses,
        notes,
        categories,
        currentCurrency
    };
    localStorage.setItem(`myBuddyData_${currentUser}`, JSON.stringify(data));
    console.log("Data saved for:", currentUser);
}

function loadUserData() {
    if (!currentUser) return;
    const raw = localStorage.getItem(`myBuddyData_${currentUser}`);
    if (raw) {
        const data = JSON.parse(raw);
        tasks = data.tasks || [];
        monthlyExpenses = data.monthlyExpenses || [];
        tripPeople = data.tripPeople || [];
        tripExpenses = data.tripExpenses || [];
        categories = data.categories || ["Food 🍔", "Travel ✈️", "Health 🏥", "Leisure 🎮"];
        currentCurrency = data.currentCurrency || "$";

        // Update UI states
        renderAllTasks();
        renderCalendar();
        renderMonthlyExpenses();
        renderTripPeople();
        renderNotes();
        console.log("Data loaded for:", currentUser);
    } else {
        // Reset state for new user
        tasks = [];
        monthlyExpenses = [];
        tripPeople = [];
        tripExpenses = [];
        renderAllTasks();
        renderCalendar();
        renderMonthlyExpenses();
        renderTripPeople();
        renderNotes();
    }
}

// Wrap functions for auto-save
const _addTask = addTask;
addTask = function () { _addTask(); saveUserData(); }

const _toggleTask = toggleTask;
toggleTask = function (id) { _toggleTask(id); saveUserData(); }

const _addExp = addMonthlyExpense;
addMonthlyExpense = function () { _addExp(); saveUserData(); }

const _addTripPerson = addTripPerson;
addTripPerson = function () { _addTripPerson(); saveUserData(); }

const _addTripExp = addTripExpense;
addTripExpense = function () { _addTripExp(); saveUserData(); }

const _addNote = addNote;
addNote = function () { _addNote(); saveUserData(); }

const _deleteNote = deleteNote;
deleteNote = function (id) { _deleteNote(id); saveUserData(); }

const _updateCurr = updateCurrency;
updateCurrency = function () { _updateCurr(); saveUserData(); }

function formatDate(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
