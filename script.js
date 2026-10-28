// ===== Data =====
const events = [
   { id: "E01", name: "Inter-Department Quiz",       category: "Academic", date: "12 Nov 2026", venue: "Seminar Hall",      seats: 40 },
   { id: "E02", name: "Web Design Contest",          category: "Technical", date: "14 Nov 2026", venue: "Computer Lab",     seats: 30 },
   { id: "E03", name: "Poster Presentation",         category: "Academic", date: "18 Nov 2026", venue: "Main Auditorium", seats: 50 },
   { id: "E04", name: "Elocution Competition",       category: "Literary", date: "20 Nov 2026", venue: "Conference Room", seats: 25 },
   { id: "E05", name: "Dance & Music Fest",          category: "Cultural", date: "25 Nov 2026", venue: "Open Stage",        seats: 60 },
   { id: "E06", name: "Science Exhibition",          category: "Science",   date: "28 Nov 2026", venue: "Exhibition Block", seats: 45 },
];

const STORAGE_KEY = "cerpRegistrations";
let registrations = loadRegistrations();
// ===== Storage helpers =====
function loadRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (err) {
    return [];
  }
}
function saveRegistrations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
  } catch (err) { /* storage unavailable: keep in-memory data */ }
}
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, ch => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]
  ));
}
function seatsLeft(eventId) {
  const ev = events.find(e => e.id === eventId);
  const taken = registrations.filter(r => r.eventId === eventId).length;
  return ev.seats - taken;
}
// ===== DOM Elements =====
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");
const navLinks = document.querySelectorAll(".nav-link");
const regForm = document.getElementById("regForm");
const formMessage = document.getElementById("formMessage");
const eventSelect = document.getElementById("eventSelect");
const searchInput = document.getElementById("searchInput");
const filterEvent = document.getElementById("filterEvent");
const regBody = document.getElementById("regBody");
const noResults = document.getElementById("noResults");
// ===== Page Navigation =====
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
  document.getElementById(pageId).classList.add("active-page");
  navLinks.forEach(link => {
    link.classList.toggle("active", link.dataset.section === pageId);
  });
  siteNav.classList.remove("open");
}
navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showPage(link.dataset.section);
  });
});
navToggle.addEventListener("click", () => {
  siteNav.classList.toggle("open");
});

// ===== Render: Events Table =====
function renderEventsTable() {
  const tbody = document.querySelector("#eventsTable tbody");
  tbody.innerHTML = events.map(ev => {
    const left = seatsLeft(ev.id);
    return `
      <tr>
        <td>${ev.name}</td>
        <td>${ev.category}</td>
        <td>${ev.date}</td>
        <td>${ev.venue}</td>
        <td>${left > 0 ? left : '<span class="badge-full">Full</span>'}</td>
      </tr>`;
  }).join("");
}





// ===== Render: Event dropdowns =====
function populateEventDropdowns() {
  eventSelect.innerHTML = '<option value="">Select event</option>' +
    events.map(ev => `<option value="${ev.id}">${ev.name} (${ev.date})</option>`).join("");
  filterEvent.innerHTML = '<option value="all">All Events</option>' +
    events.map(ev => `<option value="${ev.id}">${ev.name}</option>`).join("");
}

// ===== Render: Dashboard Stats =====
function renderDashboardStats() {
  const totalSeats = events.reduce((sum, ev) => sum + ev.seats, 0);
  document.getElementById("totalEvents").textContent = events.length;
  document.getElementById("totalRegistrations").textContent = registrations.length;
  document.getElementById("seatsLeft").textContent = totalSeats - registrations.length;
}

// ===== Registration Form =====
function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = "form-message " + type;
}

regForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("fullName").value.trim();
  const regNo = document.getElementById("regNo").value.trim().toUpperCase();
  const dept = document.getElementById("department").value;
  const email = document.getElementById("email").value.trim();
  const eventId = eventSelect.value;

    if (!name || !regNo || !dept || !email || !eventId) {
      return showMessage("Please fill in all the fields.", "error");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showMessage("Please enter a valid email address.", "error");
    }
    if (registrations.some(r => r.regNo === regNo && r.eventId === eventId)) {
      return showMessage("This register number is already registered for the event.", "error");
    }
    if (seatsLeft(eventId) <= 0) {
      return showMessage("Sorry, this event is full.", "error");
    }

  registrations.push({ name, regNo, dept, email, eventId });
  saveRegistrations();
  refreshAll();
  regForm.reset();
  showMessage("Registration successful! See you at the event.", "ok");
});

// ===== Render: Registrations (with search / filter) =====
function renderRegistrations() {
  const term = searchInput.value.trim().toLowerCase();
  const eventFilter = filterEvent.value;

    const rows = registrations
      .map((r, index) => ({ ...r, index }))
      .filter(r => eventFilter === "all" || r.eventId === eventFilter)
      .filter(r => !term ||
        r.name.toLowerCase().includes(term) ||
        r.regNo.toLowerCase().includes(term) ||
        r.dept.toLowerCase().includes(term));

    noResults.hidden = rows.length > 0;
    regBody.innerHTML = rows.map(r => {
      const ev = events.find(e => e.id === r.eventId);
      return `
        <tr>
          <td>${escapeHTML(r.name)}</td>
          <td>${escapeHTML(r.regNo)}</td>
          <td>${escapeHTML(r.dept)}</td>
          <td>${ev.name}</td>
          <td><button class="btn cancel-btn" data-index="${r.index}">Cancel</button></td>
        </tr>`;
    }).join("");
}

regBody.addEventListener("click", (e) => {
  const btn = e.target.closest(".cancel-btn");
  if (!btn) return;
  registrations.splice(Number(btn.dataset.index), 1);
  saveRegistrations();
  refreshAll();
});





searchInput.addEventListener("input", renderRegistrations);
filterEvent.addEventListener("change", renderRegistrations);

// ===== Refresh & Init =====
function refreshAll() {
  renderEventsTable();
  renderDashboardStats();
  renderRegistrations();
}

document.addEventListener("DOMContentLoaded", () => {
  populateEventDropdowns();
  refreshAll();
  showPage("home");
});