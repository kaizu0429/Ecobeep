// ========== SCHEDULING & DISPATCH JAVASCRIPT ==========

// Sample Data
const shiftsData = {
    morning: [
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Philcoa → SM North Edsa", status: "Active" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Litex → Fairview Center Mall", status: "Active" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Monumento → MOA", status: "Active" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Philcoa → SM North Edsa", status: "Active" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Litex → Fairview Center Mall", status: "Active" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Monumento → MOA", status: "Active" }
    ],
    afternoon: [
        { driver: "Pedro Santos", plate: "ABC123", time: "02:00 PM - 10:00 PM", route: "QC Circle → Cubao", status: "Active" },
        { driver: "Maria Garcia", plate: "XYZ789", time: "02:00 PM - 10:00 PM", route: "Caloocan → Manila", status: "Active" },
        { driver: "Ricardo Dalisay", plate: "DEF456", time: "02:00 PM - 10:00 PM", route: "Fairview → Quezon Ave", status: "Active" },
        { driver: "Anna Reyes", plate: "GHI789", time: "02:00 PM - 10:00 PM", route: "Commonwealth → Cubao", status: "Active" },
        { driver: "Jose Martinez", plate: "JKL012", time: "02:00 PM - 10:00 PM", route: "Novaliches → Blumentritt", status: "Active" },
        { driver: "Linda Cruz", plate: "MNO345", time: "02:00 PM - 10:00 PM", route: "Fairview → España", status: "Active" },
        { driver: "Roberto Lim", plate: "PQR678", time: "02:00 PM - 10:00 PM", route: "Lagro → Cubao", status: "Active" },
        { driver: "Carmen Santos", plate: "STU901", time: "02:00 PM - 10:00 PM", route: "SM North → Quiapo", status: "Active" }
    ],
    night: [
        { driver: "Roberto Cruz", plate: "DEF456", time: "10:00 PM - 06:00 AM", route: "Marikina → Pasig", status: "Active" },
        { driver: "Ana Lopez", plate: "GHI789", time: "10:00 PM - 06:00 AM", route: "Taguig → BGC", status: "Active" },
        { driver: "Miguel Torres", plate: "JKL012", time: "10:00 PM - 06:00 AM", route: "Pasay → NAIA", status: "Active" },
        { driver: "Elena Mendoza", plate: "MNO345", time: "10:00 PM - 06:00 AM", route: "Makati → Ortigas", status: "Active" },
        { driver: "David Gonzales", plate: "PQR678", time: "10:00 PM - 06:00 AM", route: "Manila → Pasig", status: "Active" }
    ],
    midnight: [
        { driver: "Carlos Reyes", plate: "JKL012", time: "08:00 AM - 08:00 PM", route: "Makati → Ortigas", status: "Active" },
        { driver: "Lisa Tan", plate: "MNO345", time: "08:00 AM - 08:00 PM", route: "Pasay → NAIA", status: "Active" },
        { driver: "Benjamin Castro", plate: "STU901", time: "08:00 AM - 08:00 PM", route: "Quezon City → Makati", status: "Active" },
        { driver: "Sofia Ramos", plate: "VWX234", time: "08:00 AM - 08:00 PM", route: "Manila → Taguig", status: "Active" },
        { driver: "Rafael Diaz", plate: "YZA567", time: "08:00 AM - 08:00 PM", route: "Pasig → Mandaluyong", status: "Active" }
    ]
};

const scheduleData = {
    "2026-01-01": [
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Philcoa → SM North Edsa" }
    ],
    "2026-01-12": [
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Philcoa → SM North Edsa" },
        { driver: "Ricardo Dalisay", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Litex → Fairview Center Mall" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Monumento → MOA" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Philcoa → SM North Edsa" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Litex → Fairview Center Mall" },
        { driver: "Juan Dela Cross", plate: "FCKU213", time: "06:00 AM - 02:00 PM", route: "Monumento → MOA" }
    ]
};

const vehiclesData = [
    { id: 1, name: "Jeep - 20260001", plate: "FCKU420", driver: "Juan Dela Cross", status: "assigned" },
    { id: 2, name: "Jeep - 20260002", plate: "NFC143", driver: "Ben Dover", status: "available" },
    { id: 3, name: "Jeep - 20260003", plate: "LOL696", driver: "Ben Ternaton", status: "maintenance" }
];

// Tab Navigation for Scheduling Sub-pages
const schedTabBtns = document.querySelectorAll('.sched-tab-btn');
const schedPageContents = document.querySelectorAll('.sched-page-content');

schedTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        schedTabBtns.forEach(b => b.classList.remove('active'));
        schedPageContents.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        
        const pageId = 'sched-' + btn.getAttribute('data-sched-page');
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
        }
        
        // Generate calendar if Driver Schedule tab is clicked
        if (pageId === 'sched-driver-schedule') {
            generateSchedCalendar();
        }
    });
});

// Initialize Scheduling Page
function initSchedulingPage() {
    loadShiftsData();
    loadVehiclesData();
}

// Load Shifts Data
function loadShiftsData() {
    const shiftsContainer = document.getElementById('shiftsContainer');
    if (!shiftsContainer) return;
    
    shiftsContainer.innerHTML = '';
    
    const shiftNames = {
        morning: 'Morning Shift',
        afternoon: 'Afternoon Shift',
        night: 'Night Shift',
        midnight: 'Midnight?? Graveyard?? Shift'
    };
    
    const shiftTimes = {
        morning: '06:00 AM - 02:00 PM',
        afternoon: '02:00 PM - 10:00 PM',
        night: '10:00 PM - 06:00 AM',
        midnight: '08:00 AM - 08:00 PM'
    };
    
    Object.keys(shiftsData).forEach(shiftKey => {
        const shiftCount = shiftsData[shiftKey].length;
        const isAssigned = shiftKey === 'afternoon';
        
        const card = document.createElement('div');
        card.className = 'sched-shift-card';
        card.innerHTML = `
            <div class="sched-shift-info">
                <h3>${shiftNames[shiftKey]}</h3>
                <p class="sched-shift-time">${shiftTimes[shiftKey]}</p>
            </div>
            <div class="sched-shift-actions">
                <span class="sched-badge ${isAssigned ? 'sched-badge-assigned' : 'sched-badge-available'}">
                    ${shiftCount} ${isAssigned ? 'Assigned' : 'Available'}
                </span>
                <button class="sched-btn-link" onclick="viewSchedShiftDetails('${shiftKey}')">See Details</button>
            </div>
        `;
        shiftsContainer.appendChild(card);
    });
}

// Load Vehicles Data
function loadVehiclesData() {
    const vehiclesList = document.getElementById('vehiclesList');
    if (!vehiclesList) return;
    
    vehiclesList.innerHTML = '';
    
    vehiclesData.forEach(vehicle => {
        const item = document.createElement('div');
        item.className = 'sched-vehicle-item';
        
        let badgeClass = 'sched-badge-available';
        let badgeText = 'Available';
        
        if (vehicle.status === 'assigned') {
            badgeClass = 'sched-badge-active';
            badgeText = 'Assigned';
        } else if (vehicle.status === 'maintenance') {
            badgeClass = 'sched-badge-assigned';
            badgeText = 'Maintenance';
        }
        
        item.innerHTML = `
            <div class="sched-vehicle-marker"></div>
            <div class="sched-vehicle-details">
                <h4>${vehicle.name}</h4>
                <p class="sched-vehicle-info">${vehicle.plate} • ${vehicle.driver}</p>
            </div>
            <div class="sched-vehicle-status">
                <span class="sched-badge ${badgeClass}">${badgeText}</span>
                <button class="sched-btn-link">See Details</button>
            </div>
        `;
        vehiclesList.appendChild(item);
    });
}

// Filter Shifts
function filterShifts() {
    const filter = document.getElementById('shiftFilter').value;
    const cards = document.querySelectorAll('.sched-shift-card');
    
    cards.forEach(card => {
        const shiftName = card.querySelector('h3').textContent.toLowerCase();
        if (filter === 'all' || shiftName.includes(filter.toLowerCase().replace(' shift', ''))) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// View Shift Details
function viewSchedShiftDetails(shiftType) {
    const shiftNames = {
        morning: 'Morning Shift',
        afternoon: 'Afternoon Shift',
        night: 'Night Shift',
        midnight: 'Midnight?? Graveyard?? Shift'
    };
    
    // Hide shift management
    document.getElementById('sched-shift-management').classList.remove('active');
    
    // Show shift details view
    const detailsView = document.getElementById('shiftDetailsView');
    detailsView.style.display = 'block';
    
    // Update title
    document.getElementById('shiftDetailsTitle').textContent = shiftNames[shiftType];
    
    // Populate table
    const tbody = document.getElementById('shiftDetailsBody');
    tbody.innerHTML = '';
    
    const shifts = shiftsData[shiftType] || [];
    shifts.forEach(shift => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="sched-driver-info">${shift.driver}</div>
                <div class="sched-plate-info">${shift.plate}</div>
            </td>
            <td>${shift.time}</td>
            <td>${shift.route}</td>
            <td><span class="sched-badge sched-badge-active">${shift.status}</span></td>
            <td>
                <button class="sched-btn-link">Edit</button> | 
                <button class="sched-btn-link">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Back to Shift List
function backToShiftList() {
    document.getElementById('shiftDetailsView').style.display = 'none';
    document.getElementById('sched-shift-management').classList.add('active');
}

// Calendar functionality
let currentSchedDate = new Date(2026, 0, 1); // January 2026

function generateSchedCalendar() {
    const year = currentSchedDate.getFullYear();
    const month = currentSchedDate.getMonth();
    
    // Update calendar title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('schedMonthNumber').textContent = String(month + 1).padStart(2, '0');
    document.getElementById('schedMonthName').textContent = monthNames[month];
    document.getElementById('schedYear').textContent = year;
    
    // Get calendar grid container
    const calendarGrid = document.getElementById('schedCalendarGrid');
    
    // Clear previous calendar
    calendarGrid.innerHTML = '';
    
    // Create weekdays header
    const weekdaysDiv = document.createElement('div');
    weekdaysDiv.className = 'sched-calendar-weekdays';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'sched-calendar-weekday';
        dayDiv.textContent = day;
        weekdaysDiv.appendChild(dayDiv);
    });
    calendarGrid.appendChild(weekdaysDiv);
    
    // Create days grid
    const daysDiv = document.createElement('div');
    daysDiv.className = 'sched-calendar-days';
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'sched-calendar-day other-month';
        dayDiv.textContent = daysInPrevMonth - i;
        daysDiv.appendChild(dayDiv);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'sched-calendar-day';
        dayDiv.textContent = day;
        
        // Format date for checking schedule
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if this date has schedule
        if (scheduleData[dateStr]) {
            dayDiv.classList.add('has-schedule');
            dayDiv.style.cursor = 'pointer';
            dayDiv.addEventListener('click', () => viewSchedScheduleDetails(dateStr));
        }
        
        // Highlight specific dates
        if ((month === 0 && day === 1) || (month === 0 && day === 12)) {
            dayDiv.classList.add('highlight');
        }
        
        daysDiv.appendChild(dayDiv);
    }
    
    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'sched-calendar-day other-month';
        dayDiv.textContent = i;
        daysDiv.appendChild(dayDiv);
    }
    
    calendarGrid.appendChild(daysDiv);
}

function changeSchedMonth(direction) {
    currentSchedDate.setMonth(currentSchedDate.getMonth() + direction);
    generateSchedCalendar();
}

function viewSchedScheduleDetails(dateStr) {
    // Hide calendar view
    document.getElementById('calendarView').style.display = 'none';
    document.getElementById('backToCalendarBtn').style.display = 'inline-flex';
    document.getElementById('calendarTitle').textContent = '';
    
    // Show schedule details view
    const detailsView = document.getElementById('scheduleDetailsView');
    detailsView.style.display = 'block';
    
    // Format date for title
    const date = new Date(dateStr);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    document.getElementById('scheduleDateTitle').textContent = formattedDate;
    
    // Populate schedule table
    const tbody = document.getElementById('scheduleDetailsBody');
    tbody.innerHTML = '';
    
    const schedules = scheduleData[dateStr] || [];
    schedules.forEach(schedule => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="sched-driver-info">${schedule.driver}</div>
                <div class="sched-plate-info">${schedule.plate}</div>
            </td>
            <td>${schedule.time}</td>
            <td>${schedule.route}</td>
            <td>
                <button class="sched-btn-link">Edit</button> | 
                <button class="sched-btn-link">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function backToCalendarView() {
    document.getElementById('scheduleDetailsView').style.display = 'none';
    document.getElementById('calendarView').style.display = 'block';
    document.getElementById('backToCalendarBtn').style.display = 'none';
    document.getElementById('calendarTitle').textContent = 'SELECT A DATE';
}

function viewFullCalendar() {
    alert('Full calendar view - Feature coming soon!');
}

// Add Shift Modal Functions
function openAddShiftModal() {
    document.getElementById('addShiftModalOverlay').classList.add('active');
}

function closeAddShiftModal() {
    document.getElementById('addShiftModalOverlay').classList.remove('active');
    clearShiftForm();
}

function closeAddShiftModalOutside(event) {
    if (event.target.id === 'addShiftModalOverlay') {
        closeAddShiftModal();
    }
}

function clearShiftForm() {
    document.getElementById('shiftDriverName').value = '';
    document.getElementById('shiftRoutePath').value = '';
    document.getElementById('shiftPlateNumber').value = '';
    document.getElementById('shiftStartTime').value = '';
    document.getElementById('shiftEndTime').value = '';
}

function submitAddShift() {
    const driverName = document.getElementById('shiftDriverName').value;
    const routePath = document.getElementById('shiftRoutePath').value;
    const plateNumber = document.getElementById('shiftPlateNumber').value;
    const startTime = document.getElementById('shiftStartTime').value;
    const endTime = document.getElementById('shiftEndTime').value;
    
    if (!driverName || !routePath || !plateNumber || !startTime || !endTime) {
        alert('Please fill in all fields');
        return;
    }
    
    alert('Shift added successfully!');
    closeAddShiftModal();
    // Here you would normally save to database
}

// Filter functions
function filterShiftDetails() {
    const searchTerm = document.getElementById('shiftDetailsSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#shiftDetailsBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterScheduleDetails() {
    const searchTerm = document.getElementById('scheduleDetailsSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#scheduleDetailsBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Initialize when scheduling page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Listen for scheduling page activation
    const schedNavLinks = document.querySelectorAll('.nav-link[data-page="scheduling"]');
    schedNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(() => {
                initSchedulingPage();
            }, 100);
        });
    });
});
