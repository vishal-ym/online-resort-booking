/*
 * Mud House Hampi - Main Customer Platform Logic
 * Handles Room Display, Seeding, Chatbot, and Checkout Modal
 */

// ==========================================
// 1. Initial State Data Seeding (LocalStorage)
// ==========================================

const DEFAULT_ROOMS = [
  {
    id: "deluxe",
    name: "Deluxe Mud Cottage",
    price: 4500,
    size: "320 sq ft",
    guests: "Max 2 Guests",
    view: "Forest & Boulder Hills",
    image: "assets/deluxe.png",
    description: "Handcrafted natural brick room featuring clay walls, ambient lighting, king size bed with organic cotton sheets, copper ceiling fan, and private sit-out deck.",
    status: "Available",
    amenities: ["Free Wi-Fi", "Mini Fridge", "Copper Fan", "Organic Linen"]
  },
  {
    id: "premium",
    name: "Premium Heritage Suite",
    price: 7500,
    size: "480 sq ft",
    guests: "Max 3 Guests",
    view: "Sunset Ruins Landscape",
    image: "assets/premium.png",
    description: "Spacious architectural masterpiece with structural archways, open-air signature stone bath, sunlit lounger bed, premium copper detailing, and sprawling sit-out area.",
    status: "Available",
    amenities: ["Free Wi-Fi", "Stone Outdoor Tub", "Air Cooler", "Deck Chairs"]
  },
  {
    id: "family",
    name: "Family Mud Villa",
    price: 11000,
    size: "720 sq ft",
    guests: "Max 5 Guests",
    view: "Organic Fruit Gardens",
    image: "assets/family.png",
    description: "Two-story premium earthen villa suited for families. Complete with traditional ethnic artwork, two deluxe bedding suites, Private patio hammock, and garden gazebo.",
    status: "Available",
    amenities: ["Free Wi-Fi", "2 En-Suite Baths", "Garden Hammock", "Coffee Maker"]
  }
];

const DEFAULT_BOOKINGS = [
  {
    ref: "MHH-1082",
    name: "Vikram Malhotra",
    email: "vikram@gmail.com",
    phone: "+91 98450 12345",
    roomType: "deluxe",
    roomName: "Deluxe Mud Cottage",
    checkin: "2026-06-08",
    checkout: "2026-06-11",
    nights: 3,
    baseRate: 13500,
    tax: 1620,
    total: 15120,
    utr: "305829374810",
    status: "Confirmed"
  },
  {
    ref: "MHH-1085",
    name: "Meera Sen",
    email: "meera.sen@outlook.com",
    phone: "+91 99160 56789",
    roomType: "premium",
    roomName: "Premium Heritage Suite",
    checkin: "2026-06-12",
    checkout: "2026-06-14",
    nights: 2,
    baseRate: 15000,
    tax: 1800,
    total: 16800,
    utr: "205938472958",
    status: "Pending"
  },
  {
    ref: "MHH-1089",
    name: "Rajesh Kulkarni",
    email: "rkulkarni@yahoo.com",
    phone: "+91 94480 98765",
    roomType: "family",
    roomName: "Family Mud Villa",
    checkin: "2026-06-20",
    checkout: "2026-06-22",
    nights: 2,
    baseRate: 22000,
    tax: 2640,
    total: 24640,
    utr: "305829184749",
    status: "Confirmed"
  }
];

function seedDatabase() {
  if (!localStorage.getItem("mudhouse_rooms")) {
    localStorage.setItem("mudhouse_rooms", JSON.stringify(DEFAULT_ROOMS));
  }
  if (!localStorage.getItem("mudhouse_bookings")) {
    localStorage.setItem("mudhouse_bookings", JSON.stringify(DEFAULT_BOOKINGS));
  }
}

// Global scope initialization
seedDatabase();

// ==========================================
// 2. DOM Elements & State Setup
// ==========================================
let currentRoomBooking = null; // Holds the selected room object during checkout
let bookingTotalAmount = 0;
let checkoutNights = 1;

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const header = document.getElementById("main-header");
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");
  
  // Date Input Constraints Setup (Min date is today)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const checkinInput = document.getElementById("checkin-date");
  const checkoutInput = document.getElementById("checkout-date");
  
  if (checkinInput && checkoutInput) {
    checkinInput.min = todayStr;
    checkinInput.value = todayStr;
    checkoutInput.min = tomorrowStr;
    checkoutInput.value = tomorrowStr;
    
    // Auto-update checkout min date based on checkin selection
    checkinInput.addEventListener("change", () => {
      const selectedCheckin = new Date(checkinInput.value);
      selectedCheckin.setDate(selectedCheckin.getDate() + 1);
      const nextDayStr = selectedCheckin.toISOString().split('T')[0];
      checkoutInput.min = nextDayStr;
      if (new Date(checkoutInput.value) <= new Date(checkinInput.value)) {
        checkoutInput.value = nextDayStr;
      }
    });
  }

  // Header Scroll Effect
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Theme Initial Setup & Toggling
  const savedTheme = localStorage.getItem("mudhouse_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener("click", () => {
    const activeTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = activeTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("mudhouse_theme", nextTheme);
    updateThemeIcon(nextTheme);
  });

  // Mobile Menu Toggling
  menuToggle.addEventListener("click", () => {
    navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
    if (navMenu.style.display === "flex") {
      navMenu.style.flexDirection = "column";
      navMenu.style.position = "absolute";
      navMenu.style.top = "100%";
      navMenu.style.left = "0";
      navMenu.style.width = "100%";
      navMenu.style.background = "var(--bg-secondary)";
      navMenu.style.padding = "2rem";
      navMenu.style.boxShadow = "var(--shadow-md)";
    }
  });

  // Render Rooms Grid
  renderRoomCards();

  // Setup Check-In / Search Action
  document.getElementById("btn-quick-check").addEventListener("click", handleSearchRooms);
  
  // Setup Chatbot Actions
  initChatbot();

  // Setup Modal Closing
  document.getElementById("checkout-modal-close").addEventListener("click", closeCheckoutModal);
  
  // Auto-sync Checkin/Checkout input dates to Checkout Modal dates
  const modalCheckin = document.getElementById("modal-checkin-date");
  const modalCheckout = document.getElementById("modal-checkout-date");
  
  modalCheckin.addEventListener("change", recalculateCheckoutCosts);
  modalCheckout.addEventListener("change", recalculateCheckoutCosts);
});

function updateThemeIcon(theme) {
  const toggleBtn = document.getElementById("theme-toggle");
  if (theme === "dark") {
    toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
}

// ==========================================
// 3. Room Showcase Rendering
// ==========================================
function renderRoomCards(filterType = "all") {
  const gridContainer = document.getElementById("rooms-grid-container");
  if (!gridContainer) return;
  
  const rooms = JSON.parse(localStorage.getItem("mudhouse_rooms"));
  gridContainer.innerHTML = "";
  
  const filtered = filterType === "all" 
    ? rooms 
    : rooms.filter(r => r.id === filterType);
    
  filtered.forEach(room => {
    const amenitiesHTML = room.amenities.map(a => `
      <div class="room-feature">
        <i class="fa-solid fa-circle-check"></i>
        <span>${a}</span>
      </div>
    `).join('');

    const card = document.createElement("div");
    card.className = "room-card";
    card.innerHTML = `
      <span class="room-badge ${room.status !== 'Available' ? 'sold-out' : ''}">${room.status}</span>
      <div class="room-image-container">
        <img src="${room.image}" alt="${room.name}" class="room-image" onerror="this.src='https://placehold.co/600x400/C87A53/ffffff?text=Mud+Cottage'">
        <div class="room-image-overlay">
          <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;"><i class="fa-solid fa-maximize"></i> ${room.size}</div>
          <div class="room-price-display">
            <div class="room-price-num">₹${room.price}</div>
            <div class="room-price-text">per night</div>
          </div>
        </div>
      </div>
      <div class="room-details">
        <h3 class="room-title">${room.name}</h3>
        <p class="room-description">${room.description}</p>
        <div class="room-features">
          <div class="room-feature"><i class="fa-solid fa-user-group"></i> <span>${room.guests}</span></div>
          <div class="room-feature"><i class="fa-solid fa-compass"></i> <span>${room.view}</span></div>
        </div>
        <div style="display:flex; flex-direction:column; gap: 0.75rem; margin-top: auto;">
          <div style="display:flex; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            ${amenitiesHTML}
          </div>
          <button class="btn-luxury btn-book-room" onclick="openCheckoutModal('${room.id}')" ${room.status !== 'Available' ? 'disabled style="background: var(--text-muted); cursor: not-allowed;"' : ''}>
            ${room.status === 'Available' ? 'Reserve Earthen Suite' : 'Fully Reserved'}
          </button>
        </div>
      </div>
    `;
    gridContainer.appendChild(card);
  });
}

// ==========================================
// 4. Quick Room Availability Search
// ==========================================
function handleSearchRooms() {
  const selectionType = document.getElementById("room-selection-type").value;
  const guests = parseInt(document.getElementById("guest-count").value);
  
  // Dynamic alerts inside AI chatbot or banner highlighting rooms
  renderRoomCards(selectionType);
  
  // Recommend rooms via chatbot if guest count is high
  const chatWindow = document.getElementById("chat-window-element");
  if (guests >= 4 && selectionType === "all") {
    // Open chat automatically to advise the guest
    chatWindow.classList.add("open");
    addBotMessage("Namaste! I noticed you are checking availability for a larger group of guests (4+ guests). I highly recommend our spacious <b>Family Mud Villa</b>. It features two en-suite bedrooms and a beautiful garden pergola tailored for families.");
  } else {
    // Scroll down to room list
    document.getElementById("rooms").scrollIntoView({ behavior: 'smooth' });
  }
}

// ==========================================
// 5. Checkout Wizard Navigation & Dynamic Billing
// ==========================================
function openCheckoutModal(roomId) {
  const rooms = JSON.parse(localStorage.getItem("mudhouse_rooms"));
  const selected = rooms.find(r => r.id === roomId);
  if (!selected) return;
  
  currentRoomBooking = selected;
  
  // Pre-fill fields
  document.getElementById("checkout-room-name").innerText = `Book ${selected.name}`;
  
  // Sync checkout dates with the Landing Bar values
  const landingCheckin = document.getElementById("checkin-date").value;
  const landingCheckout = document.getElementById("checkout-date").value;
  
  document.getElementById("modal-checkin-date").value = landingCheckin;
  document.getElementById("modal-checkout-date").value = landingCheckout;
  
  // Configure dates min properties
  document.getElementById("modal-checkin-date").min = new Date().toISOString().split('T')[0];
  
  // Update calculations
  recalculateCheckoutCosts();
  
  // Reset checkout views to Step 1
  goBackToStep(1);
  
  // Clear payment fields
  document.getElementById("upi-utr-number").value = "";
  
  // Open modal overlay
  document.getElementById("checkout-modal-overlay").classList.add("open");
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal-overlay").classList.remove("open");
}

function recalculateCheckoutCosts() {
  if (!currentRoomBooking) return;
  
  const checkinStr = document.getElementById("modal-checkin-date").value;
  const checkoutStr = document.getElementById("modal-checkout-date").value;
  
  const cin = new Date(checkinStr);
  const cout = new Date(checkoutStr);
  
  // Validate checkout comes after checkin
  if (cout <= cin) {
    const nextDay = new Date(cin);
    nextDay.setDate(nextDay.getDate() + 1);
    document.getElementById("modal-checkout-date").value = nextDay.toISOString().split('T')[0];
    checkoutNights = 1;
  } else {
    const diffTime = Math.abs(cout - cin);
    checkoutNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  const baseRate = currentRoomBooking.price * checkoutNights;
  const tax = Math.round(baseRate * 0.12);
  const total = baseRate + tax;
  
  bookingTotalAmount = total;
  
  // Update modal numbers
  document.getElementById("summary-night-count").innerText = checkoutNights;
  document.getElementById("summary-base-rate").innerText = `₹${baseRate.toLocaleString()}`;
  document.getElementById("summary-tax").innerText = `₹${tax.toLocaleString()}`;
  document.getElementById("summary-total-payable").innerText = `₹${total.toLocaleString()}`;
  document.getElementById("qr-amount-indicator").innerText = `₹${total.toLocaleString()}`;
}

// Navigation between Checkout Steps
function goBackToStep(step) {
  // Hide all panels
  document.getElementById("step-panel-1").classList.remove("active");
  document.getElementById("step-panel-2").classList.remove("active");
  document.getElementById("step-panel-3").classList.remove("active");
  
  // Un-highlight active steps indicators
  document.getElementById("step-node-1").className = "step-indicator";
  document.getElementById("step-node-2").className = "step-indicator";
  document.getElementById("step-node-3").className = "step-indicator";
  
  if (step === 1) {
    document.getElementById("step-panel-1").classList.add("active");
    document.getElementById("step-node-1").className = "step-indicator active";
  } else if (step === 2) {
    document.getElementById("step-panel-2").classList.add("active");
    document.getElementById("step-node-1").className = "step-indicator completed";
    document.getElementById("step-node-2").className = "step-indicator active";
  } else if (step === 3) {
    document.getElementById("step-panel-3").classList.add("active");
    document.getElementById("step-node-1").className = "step-indicator completed";
    document.getElementById("step-node-2").className = "step-indicator completed";
    document.getElementById("step-node-3").className = "step-indicator active";
  }
}

function proceedToPayment() {
  // Form input validation already handled by HTML5 attributes
  // Generate the dynamic QR code pointing to a UPI address
  const upiAddress = "stays@mudhousehampi";
  const merchantName = "Mud House Hampi";
  const transactionNote = `MHH Cottage ${currentRoomBooking.id}`;
  
  // Build standard UPI Deep Link URL
  const upiUrl = `upi://pay?pa=${upiAddress}&pn=${encodeURIComponent(merchantName)}&am=${bookingTotalAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
  
  // Construct dynamic QR Code from public API
  const qrEndpoint = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  
  document.getElementById("upi-qrcode").src = qrEndpoint;
  
  // Progress to step 2
  goBackToStep(2);
}

// Submit UTR Transaction Verification
function verifyUpiTransaction() {
  const utrInput = document.getElementById("upi-utr-number").value.trim();
  
  // UTR length constraint check (12-digit number)
  if (!/^\d{12}$/.test(utrInput)) {
    alert("Please enter a valid 12-digit UPI UTR number / Transaction ID.");
    return;
  }
  
  // Capture values
  const guestName = document.getElementById("guest-fullname").value;
  const guestEmail = document.getElementById("guest-email").value;
  const guestPhone = document.getElementById("guest-phone").value;
  const checkinVal = document.getElementById("modal-checkin-date").value;
  const checkoutVal = document.getElementById("modal-checkout-date").value;
  
  // Create unique Booking Reference
  const refCode = `MHH-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Prepare database record
  const newBooking = {
    ref: refCode,
    name: guestName,
    email: guestEmail,
    phone: guestPhone,
    roomType: currentRoomBooking.id,
    roomName: currentRoomBooking.name,
    checkin: checkinVal,
    checkout: checkoutVal,
    nights: checkoutNights,
    baseRate: currentRoomBooking.price * checkoutNights,
    tax: Math.round((currentRoomBooking.price * checkoutNights) * 0.12),
    total: bookingTotalAmount,
    utr: utrInput,
    status: "Pending" // Verified by admin later
  };
  
  // Load and append
  const dbBookings = JSON.parse(localStorage.getItem("mudhouse_bookings"));
  dbBookings.push(newBooking);
  localStorage.setItem("mudhouse_bookings", JSON.stringify(dbBookings));
  
  // Render Step 3 Printable Voucher details
  document.getElementById("voucher-status-badge").className = "voucher-status-stamp pending";
  document.getElementById("voucher-status-badge").innerText = "PENDING APPROVAL";
  
  document.getElementById("v-ref").innerText = `#${refCode}`;
  document.getElementById("v-name").innerText = guestName;
  document.getElementById("v-room").innerText = currentRoomBooking.name;
  document.getElementById("v-nights").innerText = `${checkoutNights} Night${checkoutNights > 1 ? 's' : ''}`;
  document.getElementById("v-checkin").innerText = formatDateString(checkinVal);
  document.getElementById("v-checkout").innerText = formatDateString(checkoutVal);
  document.getElementById("v-utr").innerText = utrInput;
  
  // Move to step 3
  goBackToStep(3);
}

function formatDateString(dateStr) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-US', options);
}

function printVoucher() {
  const printArea = document.getElementById("printable-voucher-view").innerHTML;
  const originalBody = document.body.innerHTML;
  
  // Simple clean print utility
  document.body.innerHTML = `
    <div style="padding: 3rem; font-family: 'Plus Jakarta Sans', sans-serif;">
      ${printArea}
    </div>
  `;
  window.print();
  
  // Reload current state
  document.body.innerHTML = originalBody;
  window.location.reload();
}

// ==========================================
// 6. Floating AI Chatbot Engine
// ==========================================
const CHAT_INTENTS = {
  greetings: {
    keywords: ["hi", "hello", "namaste", "hey", "hola"],
    reply: "Namaste! I am Veda, your Mud House Hampi assistant. Are you planning a getaway? I can recommend cottages, guide you through booking, or suggest tourist landmarks!"
  },
  rooms: {
    keywords: ["room", "cottage", "villa", "deluxe", "family", "suite", "bed", "ac", "air"],
    reply: "We offer three premium options: <b>Deluxe Mud Cottage</b> (king bed, cozy clay interior - ₹4,500/n), <b>Premium Heritage Suite</b> (signature outdoor stone tub, private sunset deck - ₹7,500/n), and <b>Family Mud Villa</b> (two en-suite floors, pergola seating - ₹11,000/n). None of our cottages use industrial concrete, preserving true Dravidian earth insulation!"
  },
  wifi: {
    keywords: ["internet", "wifi", "network", "speed", "work"],
    reply: "Yes, indeed! Though we encourage digital detoxes, we provide high-speed optical fiber Wi-Fi (up to 150 Mbps) across all our cottage decks and garden areas. Workations are very popular here!"
  },
  food: {
    keywords: ["food", "restaurant", "dining", "meal", "breakfast", "veg"],
    reply: "Our organic dining deck 'Bhojana' serves pure, delicious local Karnataka meals. Ingredients are harvested directly from our surrounding fruit orchards and village farms. Booking includes a complementary traditional herbal breakfast."
  },
  sightseeing: {
    keywords: ["sightseeing", "visit", "hampi", "places", "ruins", "trek", "boulder"],
    reply: "Mud House Hampi is located just 10 minutes from the legendary Virupaksha Temple and Hampi Bazaar! We arrange sunrise walks to Matanga Hill, coracle boat crossings at the Tungabhadra river, and guide-led boulder treks."
  },
  location: {
    keywords: ["location", "reach", "route", "address", "station", "airport"],
    reply: "Our resort is situated in Kaddirampura, Hampi, Karnataka. The nearest railway station is Hosapete (HPT, 12 km), which connects directly to Bengaluru and Mumbai. The nearest airport is Jindal Vijayanagar Airport in Toranagallu (VDY, 38 km)."
  },
  booking: {
    keywords: ["book", "price", "cost", "payment", "upi", "qr", "utr"],
    reply: "Booking is very straightforward! Scroll to the 'Our Sacred Spaces' section, select your check-in dates, enter guest info, scan the dynamic UPI QR code inside the modal, enter your transaction ID (UTR), and you are done! No cards required."
  }
};

function initChatbot() {
  const trigger = document.getElementById("chat-bubble-trigger");
  const chatWin = document.getElementById("chat-window-element");
  const closeBtn = document.getElementById("chat-close");
  const sendBtn = document.getElementById("chat-send");
  const userInput = document.getElementById("chat-user-input");
  
  if (!trigger || !chatWin) return;
  
  // Toggle chatbot window open/close
  trigger.addEventListener("click", () => {
    chatWin.classList.toggle("open");
  });
  
  closeBtn.addEventListener("click", () => {
    chatWin.classList.remove("open");
  });
  
  // Handle suggestion chips click
  document.querySelectorAll(".chat-suggestion-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const text = chip.getAttribute("data-query");
      addUserMessage(text);
      processUserQuery(text);
    });
  });
  
  // Handle sending message
  sendBtn.addEventListener("click", () => {
    sendMessage();
  });
  
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
  
  function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    userInput.value = "";
    
    processUserQuery(text);
  }
}

function addUserMessage(text) {
  const msgList = document.getElementById("chat-message-list");
  const userDiv = document.createElement("div");
  userDiv.className = "chat-message user";
  userDiv.innerText = text;
  msgList.appendChild(userDiv);
  msgList.scrollTop = msgList.scrollHeight;
}

function addBotMessage(text) {
  const msgList = document.getElementById("chat-message-list");
  const botDiv = document.createElement("div");
  botDiv.className = "chat-message bot";
  botDiv.innerHTML = text;
  msgList.appendChild(botDiv);
  msgList.scrollTop = msgList.scrollHeight;
}

function showTypingIndicator() {
  const msgList = document.getElementById("chat-message-list");
  const indicatorDiv = document.createElement("div");
  indicatorDiv.className = "chat-message bot typing-indicator-wrapper";
  indicatorDiv.id = "chat-typing-indicator";
  indicatorDiv.innerHTML = `
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  msgList.appendChild(indicatorDiv);
  msgList.scrollTop = msgList.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById("chat-typing-indicator");
  if (indicator) {
    indicator.remove();
  }
}

function processUserQuery(query) {
  showTypingIndicator();
  
  // Simple client-side NLP pattern matching
  setTimeout(() => {
    removeTypingIndicator();
    
    const text = query.toLowerCase();
    let reply = "Namaste! I am not entirely sure about that. But feel free to drop a query on our floating WhatsApp link, or ask me about our cottages, organic dining, and local treks!";
    
    // Check against intent matrix
    for (const key in CHAT_INTENTS) {
      const intent = CHAT_INTENTS[key];
      const match = intent.keywords.some(word => text.includes(word));
      if (match) {
        reply = intent.reply;
        break;
      }
    }
    
    // Custom recommendation system based on keywords
    if (text.includes("recommend") || text.includes("suggest") || text.includes("people") || text.includes("group")) {
      reply = "For solo travelers or couples, the <b>Deluxe Mud Cottage</b> is a cozy sanctuary. For honeymoons and romantic retreats, the <b>Premium Heritage Suite</b> is unbeatable due to its private outdoor stone bath. Families or groups of 4+ will find the <b>Family Mud Villa</b> perfect!";
    }
    
    addBotMessage(reply);
  }, 1000 + Math.random() * 500); // Organic-feeling delay
}
