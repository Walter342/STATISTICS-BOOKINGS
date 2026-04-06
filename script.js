// ==========================
// 🔥 EMAILJS INIT - WITH YOUR KEYS
// ==========================
(function(){
    emailjs.init("1kg7gX_6ulHh6j_VO"); // Your Public Key
})();

// ==========================
// 🔥 CONFIGURATION
// ==========================
const SLOT_CAPACITY = 15;
const YOUR_WHATSAPP_NUMBER = "27761417827"; // Formatted with country code (no 0, no +)
const YOUR_EMAILJS_SERVICE_ID = "service_1vyk8fs";
const YOUR_EMAILJS_TEMPLATE_ID = "template_0ik1s0f";

// ==========================
// 📅 YOUR CUSTOM AVAILABILITY
// ==========================
const CUSTOM_AVAILABILITY = {
    // Monday, April 6th 2026
    "2026-04-06": ["15:00 - 16:30"],
    
    // Tuesday, April 7th 2026
    "2026-04-07": ["13:00 - 14:30"]
};

// ==========================
// 📦 BOOKINGS DATA
// ==========================
let bookings = JSON.parse(localStorage.getItem("bookings")) || {};

// ==========================
// 🧹 CLEAN OLD BOOKINGS (older than 5 days)
// ==========================
function cleanOldBookings() {
    let today = new Date();
    let changed = false;

    for (let key in bookings) {
        let datePart = key.split("_")[0];
        let bookingDate = new Date(datePart);
        let diffDays = (today - bookingDate) / (1000 * 60 * 60 * 24);

        if (diffDays > 5) {
            delete bookings[key];
            changed = true;
        }
    }

    if (changed) {
        localStorage.setItem("bookings", JSON.stringify(bookings));
    }
}
cleanOldBookings();

// ==========================
// 🎤 VOICE WELCOME
// ==========================
window.onload = function() {
    speechSynthesis.speak(
        new SpeechSynthesisUtterance("Welcome to Statistics Booking. Stats is fun. Maximum 15 students per slot.")
    );
    
    renderDashboard();
    updateTimeSlotOptions();
};

// ==========================
// 📅 GET ALL SLOTS FROM CUSTOM AVAILABILITY
// ==========================
function getAllSlots() {
    const slots = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let dateStr in CUSTOM_AVAILABILITY) {
        const slotDate = new Date(dateStr);
        
        if (slotDate < today) continue;
        
        const timeSlots = CUSTOM_AVAILABILITY[dateStr];
        
        timeSlots.forEach(time => {
            slots.push({
                date: dateStr,
                time: time
            });
        });
    }
    
    slots.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
    });
    
    return slots;
}

// ==========================
// 📅 FORMAT DATE
// ==========================
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
    });
}

// ==========================
// 📊 RENDER DASHBOARD
// ==========================
function renderDashboard() {
    const slotsGrid = document.getElementById("slotsGrid");
    if (!slotsGrid) return;

    const slots = getAllSlots();
    
    let totalBookings = 0;
    let availableSlotsCount = 0;
    
    slots.forEach(slot => {
        const key = `${slot.date}_${slot.time}`;
        const booked = bookings[key] || 0;
        totalBookings += booked;
        if (booked < SLOT_CAPACITY) availableSlotsCount++;
    });
    
    document.getElementById("totalSlots").innerText = slots.length;
    document.getElementById("totalBookings").innerText = totalBookings;
    document.getElementById("availableSlots").innerText = availableSlotsCount;
    
    slotsGrid.innerHTML = "";
    
    if (slots.length === 0) {
        slotsGrid.innerHTML = '<div style="text-align:center; padding:40px;">📭 No upcoming slots available. Check back later for new dates!</div>';
        return;
    }
    
    slots.forEach(slot => {
        const key = `${slot.date}_${slot.time}`;
        const booked = bookings[key] || 0;
        const remaining = SLOT_CAPACITY - booked;
        const isFull = booked >= SLOT_CAPACITY;
        const percentage = (booked / SLOT_CAPACITY) * 100;
        
        const slotCard = document.createElement("div");
        slotCard.className = `slot-card ${isFull ? 'full' : 'available'}`;
        
        slotCard.innerHTML = `
            <div class="slot-date">📅 ${formatDate(slot.date)}</div>
            <div class="slot-time">⏰ ${slot.time}</div>
            <div class="slot-count">👥 ${booked}/${SLOT_CAPACITY} students</div>
            <div class="progress-bar">
                <div class="progress-fill ${isFull ? 'full' : ''}" style="width: ${percentage}%"></div>
            </div>
            <div class="slot-status">
                ${isFull ? '<span class="status-full">❌ FULLY BOOKED</span>' : `<span class="status-available">✅ ${remaining} spot${remaining !== 1 ? 's' : ''} left</span>`}
            </div>
        `;
        
        slotsGrid.appendChild(slotCard);
    });
}

// ==========================
// 🔄 UPDATE TIME SLOT OPTIONS
// ==========================
function updateTimeSlotOptions() {
    const dateInput = document.getElementById("date");
    const timeSelect = document.getElementById("time");
    
    if (!dateInput || !timeSelect) return;
    
    const selectedDate = dateInput.value;
    if (!selectedDate) {
        timeSelect.innerHTML = '<option value="">Select date first</option>';
        return;
    }
    
    const availableTimes = CUSTOM_AVAILABILITY[selectedDate] || [];
    
    if (availableTimes.length === 0) {
        timeSelect.innerHTML = '<option value="">No slots available on this date</option>';
        return;
    }
    
    const currentTime = timeSelect.value;
    
    timeSelect.innerHTML = '<option value="">Select time slot</option>';
    
    availableTimes.forEach(time => {
        const key = `${selectedDate}_${time}`;
        const booked = bookings[key] || 0;
        const isFull = booked >= SLOT_CAPACITY;
        
        const option = document.createElement("option");
        option.value = time;
        option.textContent = isFull ? `${time} ❌ FULL (${booked}/${SLOT_CAPACITY})` : `${time} (${SLOT_CAPACITY - booked} spots left)`;
        option.disabled = isFull;
        
        timeSelect.appendChild(option);
    });
    
    if (currentTime && Array.from(timeSelect.options).some(opt => opt.value === currentTime && !opt.disabled)) {
        timeSelect.value = currentTime;
    }
}

// ==========================
// 📧 SEND EMAIL NOTIFICATION
// ==========================
async function sendEmailNotification(name, email, date, time) {
    try {
        await emailjs.send(YOUR_EMAILJS_SERVICE_ID, YOUR_EMAILJS_TEMPLATE_ID, {
            student_name: name,
            student_email: email,
            booking_date: formatDate(date),
            booking_time: time,
            location: "💻 Online Consultation",
            remaining_spots: SLOT_CAPACITY - ((bookings[`${date}_${time}`] || 0) + 1)
        });
        return true;
    } catch (error) {
        console.error("Email failed:", error);
        return false;
    }
}

// ==========================
// 📱 SEND WHATSAPP NOTIFICATION
// ==========================
function sendWhatsAppNotification(name, email, date, time) {
    const key = `${date}_${time}`;
    const newCount = (bookings[key] || 0) + 1;
    const remaining = SLOT_CAPACITY - newCount;
    
    let msg = `📊 *NEW STATS BOOKING*%0A%0A` +
        `👤 Name: ${name}%0A` +
        `📧 Email: ${email}%0A` +
        `📅 Date: ${formatDate(date)}%0A` +
        `⏰ Time: ${time}%0A` +
        `📍 Location: Online Consultation%0A%0A` +
        `📊 Slot Status: ${newCount}/${SLOT_CAPACITY} booked%0A` +
        `✅ Remaining spots: ${remaining}`;
    
    window.open(`https://wa.me/${YOUR_WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}

// ==========================
// 💬 SHOW MESSAGE
// ==========================
function showMessage(text, color, isError = false) {
    const msg = document.getElementById("message");
    msg.innerText = text;
    msg.style.color = color;
    
    if (!isError) {
        setTimeout(() => {
            if (msg.innerText === text) {
                msg.innerText = "";
            }
        }, 5000);
    }
}

// ==========================
// 📅 BOOKING SUBMIT
// ==========================
document.getElementById("bookingForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    if (!name || !email || !date || !time) {
        showMessage("❌ Please fill in all fields", "orange");
        return;
    }

    if (!email.includes("@") || !email.includes(".")) {
        showMessage("❌ Please enter a valid email address", "orange");
        return;
    }

    const key = `${date}_${time}`;
    const currentBookings = bookings[key] || 0;

    if (currentBookings >= SLOT_CAPACITY) {
        showMessage(`❌ This slot is FULLY BOOKED (${SLOT_CAPACITY}/${SLOT_CAPACITY}). Please try another time slot.`, "red", true);
        updateTimeSlotOptions();
        renderDashboard();
        return;
    }

    const confirmMsg = confirm(`📊 Confirm your booking:\n\n👤 Name: ${name}\n📅 Date: ${formatDate(date)}\n⏰ Time: ${time}\n📍 Location: Online\n\nRemaining spots: ${SLOT_CAPACITY - (currentBookings + 1)}/${SLOT_CAPACITY}\n\nProceed?`);
    if (!confirmMsg) return;

    bookings[key] = currentBookings + 1;
    localStorage.setItem("bookings", JSON.stringify(bookings));

    try {
        await sendEmailNotification(name, email, date, time);
    } catch(e) { 
        console.error(e);
    }
    
    sendWhatsAppNotification(name, email, date, time);

    const remaining = SLOT_CAPACITY - bookings[key];
    showMessage(`✅ SUCCESS! ${name}, you booked ${formatDate(date)} at ${time}. ${remaining} spot${remaining !== 1 ? 's' : ''} left. Check WhatsApp & Email.`, "lightgreen");

    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("time").value = "";
    
    renderDashboard();
    updateTimeSlotOptions();

    speechSynthesis.speak(new SpeechSynthesisUtterance(`Booking successful for ${name}. ${remaining} spots remaining for this slot`));
});

// ==========================
// 🔄 EVENT LISTENERS
// ==========================
document.getElementById("date").addEventListener("change", function() {
    updateTimeSlotOptions();
});

setInterval(() => {
    bookings = JSON.parse(localStorage.getItem("bookings")) || {};
    renderDashboard();
    updateTimeSlotOptions();
}, 30000);

// Set date picker limits
const dateInput = document.getElementById("date");
if (dateInput) {
    const availableDates = Object.keys(CUSTOM_AVAILABILITY).sort();
    
    if (availableDates.length > 0) {
        dateInput.min = availableDates[0];
        dateInput.max = availableDates[availableDates.length - 1];
    }
    
    dateInput.addEventListener("input", function() {
        if (!CUSTOM_AVAILABILITY[this.value]) {
            showMessage("⚠️ No consultations available on this date. Please check dashboard for available dates.", "orange");
            document.getElementById("time").innerHTML = '<option value="">No slots available</option>';
        }
    });
}