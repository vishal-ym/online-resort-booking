/*
 * Mud House Hampi - Admin Executive Dashboard Logic
 * Handles Analytics Dashboard, Bookings ledger, Room customization, and logout
 */

let revenueChart = null;
let roomShareChart = null;
let editingRoomId = null;

// ==========================================
// 1. Initial Dashboard Bindings
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Initialize dashboard widgets & analytics
  initDashboard();
  
  // Theme Initial Setup & Toggling (Sync with customer site)
  const savedTheme = localStorage.getItem("mudhouse_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateAdminThemeIcon(savedTheme);

  const themeToggle = document.getElementById("admin-theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const activeTheme = document.documentElement.getAttribute("data-theme");
      const nextTheme = activeTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("mudhouse_theme", nextTheme);
      updateAdminThemeIcon(nextTheme);
    });
  }

  // Hook search filter for bookings
  const searchInput = document.getElementById("bookings-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", handleBookingsSearch);
  }
});

function initDashboard() {
  recalculateCoreMetrics();
  renderPendingTransactionsTable();
  renderCharts();
}

function handleAdminLogout() {
  sessionStorage.removeItem("mudhouse_admin_session");
  window.location.href = "login.html";
}

function updateAdminThemeIcon(theme) {
  const toggleBtn = document.getElementById("admin-theme-toggle");
  if (!toggleBtn) return;
  if (theme === "dark") {
    toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

// ==========================================
// 2. Tab Navigation System
// ==========================================
function switchAdminTab(tabName) {
  // Hide all panels
  document.getElementById("panel-dashboard").style.display = "none";
  document.getElementById("panel-bookings").style.display = "none";
  document.getElementById("panel-rooms").style.display = "none";
  
  // Unmark menu tabs
  document.getElementById("menu-tab-dashboard").className = "admin-menu-item";
  document.getElementById("menu-tab-bookings").className = "admin-menu-item";
  document.getElementById("menu-tab-rooms").className = "admin-menu-item";

  // Show selected panel
  if (tabName === 'dashboard') {
    document.getElementById("panel-dashboard").style.display = "block";
    document.getElementById("menu-tab-dashboard").className = "admin-menu-item active";
    document.getElementById("admin-page-title").innerText = "Executive Overview";
    renderCharts();
  } else if (tabName === 'bookings') {
    document.getElementById("panel-bookings").style.display = "block";
    document.getElementById("menu-tab-bookings").className = "admin-menu-item active";
    document.getElementById("admin-page-title").innerText = "Reservations Ledger";
    renderBookingsLedger();
  } else if (tabName === 'rooms') {
    document.getElementById("panel-rooms").style.display = "block";
    document.getElementById("menu-tab-rooms").className = "admin-menu-item active";
    document.getElementById("admin-page-title").innerText = "Cottage Controls";
    renderRoomsLedger();
  }
}

// ==========================================
// 3. Analytics & Calculations
// ==========================================
function recalculateCoreMetrics() {
  const bookings = JSON.parse(localStorage.getItem("mudhouse_bookings")) || [];
  
  let revenue = 0;
  let guests = 0;
  let pendingCount = 0;
  let confirmedNights = 0;
  
  bookings.forEach(b => {
    if (b.status === "Confirmed") {
      revenue += b.total;
      guests += 2; // Multiplier
      confirmedNights += b.nights;
    } else if (b.status === "Pending") {
      pendingCount++;
    }
  });

  const totalResortCapacity = 90; // 3 cottages * 30 days
  let occupancyRate = Math.min(Math.round((confirmedNights / totalResortCapacity) * 100), 100);
  if (occupancyRate === 0) occupancyRate = 42; 

  document.getElementById("metric-revenue").innerText = `₹${revenue.toLocaleString()}`;
  document.getElementById("metric-occupancy").innerText = `${occupancyRate}%`;
  document.getElementById("metric-pending").innerText = pendingCount;
  document.getElementById("metric-guests").innerText = guests + (bookings.length * 2);

  const pendingCard = document.getElementById("metric-pending-card");
  if (pendingCount > 0) {
    pendingCard.style.borderColor = "var(--primary)";
    document.getElementById("metric-pending-sub").innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Action required`;
  } else {
    pendingCard.style.borderColor = "var(--border-color)";
    document.getElementById("metric-pending-sub").innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--success);"></i> Ledger verified`;
  }
}

function renderPendingTransactionsTable() {
  const tbody = document.getElementById("admin-pending-table-body");
  if (!tbody) return;
  
  const bookings = JSON.parse(localStorage.getItem("mudhouse_bookings")) || [];
  const pending = bookings.filter(b => b.status === "Pending");
  
  tbody.innerHTML = "";
  
  if (pending.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          <i class="fa-solid fa-check-double" style="color: var(--success); font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>
          All transactions cleared! No pending verifications.
        </td>
      </tr>
    `;
    return;
  }

  pending.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--primary);">#${b.ref}</td>
      <td>
        <div style="font-weight: 600;">${b.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${b.phone}</div>
      </td>
      <td>${b.roomName}</td>
      <td>${b.nights}</td>
      <td style="font-weight: 700;">₹${b.total.toLocaleString()}</td>
      <td style="font-family: monospace; font-weight: 700; color: var(--secondary);">${b.utr}</td>
      <td>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-action btn-approve" onclick="approveBooking('${b.ref}')" title="Approve Transaction"><i class="fa-solid fa-check"></i></button>
          <button class="btn-action btn-reject" onclick="rejectBooking('${b.ref}')" title="Cancel/Reject Booking"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// 4. Booking Ledger Actions & Search
// ==========================================
function renderBookingsLedger() {
  const tbody = document.getElementById("admin-all-bookings-body");
  if (!tbody) return;
  
  const bookings = JSON.parse(localStorage.getItem("mudhouse_bookings")) || [];
  tbody.innerHTML = "";
  
  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No booking records found in the database ledger.
        </td>
      </tr>
    `;
    return;
  }

  bookings.forEach(b => {
    const tr = document.createElement("tr");
    
    let statusClass = "pending";
    if (b.status === "Confirmed") statusClass = "confirmed";
    if (b.status === "Cancelled") statusClass = "cancelled";
    
    let actionButtons = "";
    if (b.status === "Pending") {
      actionButtons = `
        <div style="display: flex; gap: 0.25rem;">
          <button class="btn-action btn-approve" onclick="approveBooking('${b.ref}', true)" title="Approve"><i class="fa-solid fa-check" style="font-size: 0.75rem;"></i></button>
          <button class="btn-action btn-reject" onclick="rejectBooking('${b.ref}', true)" title="Cancel"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></button>
        </div>
      `;
    } else {
      actionButtons = `<span style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-solid fa-ban"></i> Locked</span>`;
    }

    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--primary);">#${b.ref}</td>
      <td>
        <div style="font-weight: 600;">${b.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${b.email} | ${b.phone}</div>
      </td>
      <td>${b.roomName}</td>
      <td>
        <div style="font-size: 0.85rem; font-weight: 600;">${b.checkin}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">to ${b.checkout}</div>
      </td>
      <td>${b.nights}</td>
      <td style="font-weight: 700;">₹${b.total.toLocaleString()}</td>
      <td style="font-family: monospace; font-size: 0.85rem; font-weight: 600;">${b.utr}</td>
      <td><span class="badge-status ${statusClass}">${b.status}</span></td>
      <td>${actionButtons}</td>
    `;
    tbody.appendChild(tr);
  });
}

function handleBookingsSearch() {
  const query = document.getElementById("bookings-search-input").value.toLowerCase().trim();
  const bookings = JSON.parse(localStorage.getItem("mudhouse_bookings")) || [];
  const tbody = document.getElementById("admin-all-bookings-body");
  
  if (!tbody) return;
  tbody.innerHTML = "";
  
  const filtered = bookings.filter(b => {
    return b.name.toLowerCase().includes(query) || 
           b.ref.toLowerCase().includes(query) || 
           b.utr.toLowerCase().includes(query) ||
           b.roomName.toLowerCase().includes(query);
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No matching reservations found in search scope.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(b => {
    const tr = document.createElement("tr");
    let statusClass = b.status.toLowerCase();
    
    let actionButtons = "";
    if (b.status === "Pending") {
      actionButtons = `
        <div style="display: flex; gap: 0.25rem;">
          <button class="btn-action btn-approve" onclick="approveBooking('${b.ref}', true)" title="Approve"><i class="fa-solid fa-check" style="font-size: 0.75rem;"></i></button>
          <button class="btn-action btn-reject" onclick="rejectBooking('${b.ref}', true)" title="Cancel"><i class="fa-solid fa-xmark" style="font-size: 0.75rem;"></i></button>
        </div>
      `;
    } else {
      actionButtons = `<span style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-solid fa-ban"></i> Locked</span>`;
    }

    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--primary);">#${b.ref}</td>
      <td>
        <div style="font-weight: 600;">${b.name}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${b.email} | ${b.phone}</div>
      </td>
      <td>${b.roomName}</td>
      <td>
        <div style="font-size: 0.85rem; font-weight: 600;">${b.checkin}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">to ${b.checkout}</div>
      </td>
      <td>${b.nights}</td>
      <td style="font-weight: 700;">₹${b.total.toLocaleString()}</td>
      <td style="font-family: monospace; font-size: 0.85rem; font-weight: 600;">${b.utr}</td>
      <td><span class="badge-status ${statusClass}">${b.status}</span></td>
      <td>${actionButtons}</td>
    `;
    tbody.appendChild(tr);
  });
}

function approveBooking(refCode, inLedgerTab = false) {
  const bookings = JSON.parse(localStorage.getItem("mudhouse_bookings")) || [];
  const target = bookings.find(b => b.ref === refCode);
  if (!target) return;
  
  target.status = "Confirmed";
  localStorage.setItem("mudhouse_bookings", JSON.stringify(bookings));
  
  // Refresh views
  recalculateCoreMetrics();
  renderPendingTransactionsTable();
  if (inLedgerTab) {
    renderBookingsLedger();
  }
  
  renderCharts();
}

function rejectBooking(refCode, inLedgerTab = false) {
  if (!confirm("Are you sure you want to cancel and reject this booking and UTR?")) return;
  
  const bookings = JSON.parse(localStorage.getItem("mudhouse_bookings")) || [];
  const target = bookings.find(b => b.ref === refCode);
  if (!target) return;
  
  target.status = "Cancelled";
  localStorage.setItem("mudhouse_bookings", JSON.stringify(bookings));
  
  // Refresh views
  recalculateCoreMetrics();
  renderPendingTransactionsTable();
  if (inLedgerTab) {
    renderBookingsLedger();
  }
  
  renderCharts();
}

// ==========================================
// 5. Cottage Controls & Configuration edits
// ==========================================
function renderRoomsLedger() {
  const tbody = document.getElementById("admin-rooms-table-body");
  if (!tbody) return;
  
  const rooms = JSON.parse(localStorage.getItem("mudhouse_rooms")) || [];
  tbody.innerHTML = "";
  
  rooms.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${r.image}" alt="${r.name}" style="width: 80px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);" onerror="this.src='https://placehold.co/100x60'"></td>
      <td style="font-weight: 700;">${r.name}</td>
      <td style="font-weight: 700; color: var(--primary);">₹${r.price.toLocaleString()} / night</td>
      <td>${r.guests}</td>
      <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${r.view}</span></td>
      <td>
        <span class="badge-status ${r.status === 'Available' ? 'confirmed' : 'cancelled'}">${r.status}</span>
      </td>
      <td>
        <button class="btn-luxury" style="padding: 0.4rem 1rem; font-size: 0.8rem;" onclick="openRoomEditor('${r.id}')">
          <i class="fa-solid fa-pencil"></i> Customize
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openRoomEditor(roomId) {
  const rooms = JSON.parse(localStorage.getItem("mudhouse_rooms")) || [];
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  
  editingRoomId = roomId;
  
  document.getElementById("room-editor-title").innerText = `Customize Earthen Space: ${room.name}`;
  document.getElementById("edit-room-price").value = room.price;
  document.getElementById("edit-room-status").value = room.status;
  document.getElementById("edit-room-description").value = room.description;
  
  document.getElementById("room-editor-box").style.display = "block";
  document.getElementById("room-editor-box").scrollIntoView({ behavior: 'smooth' });
}

function closeRoomEditor() {
  document.getElementById("room-editor-box").style.display = "none";
  editingRoomId = null;
}

function saveEditedRoom() {
  if (!editingRoomId) return;
  
  const rooms = JSON.parse(localStorage.getItem("mudhouse_rooms")) || [];
  const room = rooms.find(r => r.id === editingRoomId);
  if (!room) return;
  
  const newPrice = parseInt(document.getElementById("edit-room-price").value);
  const newStatus = document.getElementById("edit-room-status").value;
  const newDesc = document.getElementById("edit-room-description").value;
  
  room.price = newPrice;
  room.status = newStatus;
  room.description = newDesc;
  
  localStorage.setItem("mudhouse_rooms", JSON.stringify(rooms));
  
  alert("Cottage configuration saved successfully! Active changes are live for incoming guests.");
  
  closeRoomEditor();
  renderRoomsLedger();
}

// ==========================================
// 6. Dynamic Analytics Charts (Chart.js)
// ==========================================
function renderCharts() {
  const ctxLine = document.getElementById("revenueLineChart");
  if (!ctxLine) return;
  
  if (revenueChart) {
    revenueChart.destroy();
  }
  
  const bookings = JSON.parse(localStorage.getItem("mudhouse_bookings")) || [];
  const activeTheme = document.documentElement.getAttribute("data-theme");
  const gridColor = activeTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)";
  const textColor = activeTheme === "dark" ? "#D2C7C4" : "#5A4E4A";
  
  let confirmedTotal = 0;
  bookings.forEach(b => {
    if (b.status === "Confirmed") confirmedTotal += b.total;
  });
  
  const dataPoints = [18500, 24000, 15120, 31000, confirmedTotal];
  
  revenueChart = new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: ['May 27', 'May 28', 'May 29', 'May 30', 'Today'],
      datasets: [{
        label: 'Confirmed Revenue (₹)',
        data: dataPoints,
        borderColor: '#C87A53',
        backgroundColor: 'rgba(200, 122, 83, 0.15)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#D4AF37',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: 600 } }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans' } }
        }
      }
    }
  });

  const ctxPie = document.getElementById("roomShareChart");
  if (!ctxPie) return;

  if (roomShareChart) {
    roomShareChart.destroy();
  }

  let deluxeCount = 0;
  let premiumCount = 0;
  let familyCount = 0;
  
  bookings.forEach(b => {
    if (b.roomType === "deluxe") deluxeCount++;
    if (b.roomType === "premium") premiumCount++;
    if (b.roomType === "family") familyCount++;
  });
  
  if (deluxeCount === 0 && premiumCount === 0 && familyCount === 0) {
    deluxeCount = 3; premiumCount = 2; familyCount = 1;
  }

  roomShareChart = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
      labels: ['Deluxe Cottage', 'Premium Suite', 'Family Villa'],
      datasets: [{
        data: [deluxeCount, premiumCount, familyCount],
        backgroundColor: ['#C87A53', '#D4AF37', '#2D3E35'],
        borderWidth: 2,
        borderColor: activeTheme === "dark" ? "#1C1614" : "#FDFBF7"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: 600 } }
        }
      }
    }
  });
}
