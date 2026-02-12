/**
 * ECOBEEP - Jeep Status JavaScript
 * Connects to database and displays vehicle maintenance data
 */

// API endpoint - Using unique variable name to avoid conflicts
const JEEP_STATUS_API_URL = '../php/jeep-status-api.php';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Jeep Status components when page becomes active
    initJeepStatusPage();
});

/**
 * Initialize Jeep Status Page
 */
function initJeepStatusPage() {
    // Load all data from database
    loadJeepStatusData();
    
    // Initialize filter pills
    initJeepStatusFilterPills();
    
    // Initialize search
    initJeepStatusSearch();
}

/**
 * Load all Jeep Status data from database
 */
function loadJeepStatusData() {
    console.log('Loading data from:', API_URL + '?action=get_all_data');
    
    fetch(`${JEEP_STATUS_API_URL}?action=get_all_data`)
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers.get('content-type'));
            return response.text(); // First get as text to debug
        })
        .then(text => {
            console.log('Raw response:', text.substring(0, 200)); // Log first 200 chars
            try {
                const data = JSON.parse(text);
                console.log('Parsed data:', data);
                
                if (data.success) {
                    // Update stats
                    updateStats(data.stats);
                    
                    // Update vehicles table
                    updateVehiclesTable(data.vehicles);
                    
                    // Update upcoming maintenance
                    updateUpcomingMaintenance(data.upcoming);
                    
                    // Update history
                    updateMaintenanceHistory(data.history);
                } else {
                    console.error('Failed to load data:', data.message);
                    showJeepStatusAlert('Failed to load data: ' + data.message, 'error');
                }
            } catch (e) {
                console.error('JSON Parse Error:', e);
                console.error('Response was:', text);
                showJeepStatusAlert('Error parsing server response. Check browser console for details.', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
            showJeepStatusAlert('Failed to connect to database. Please check: 1) PHP file location 2) Database connection 3) Browser console', 'error');
        });
}

/**
 * Update Statistics Cards
 */
function updateStats(stats) {
    const operational = document.getElementById('statOperational');
    const maintenance = document.getElementById('statMaintenance');
    const repair = document.getElementById('statRepair');
    const scheduled = document.getElementById('statScheduled');
    
    if (operational) operational.textContent = stats.operational || 0;
    if (maintenance) maintenance.textContent = stats.maintenance || 0;
    if (repair) repair.textContent = stats.repair || 0;
    if (scheduled) scheduled.textContent = stats.scheduled || 0;
}

/**
 * Update Vehicles Maintenance Table
 */
function updateVehiclesTable(vehicles) {
    const tbody = document.getElementById('maintenanceTableBody');
    if (!tbody) return;
    
    if (!vehicles || vehicles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #636e72;">
                    <i class="fas fa-car" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    No vehicles found. Add vehicles in Vehicle Details page.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = vehicles.map(vehicle => {
        const status = vehicle.maintenance_status || 'Operational';
        const statusClass = getStatusClass(status);
        const healthPercent = vehicle.health_percentage || 100;
        const healthClass = getHealthClass(healthPercent);
        const lastService = vehicle.last_service_date ? formatDate(vehicle.last_service_date) : 'Not recorded';
        const nextService = vehicle.next_service_date ? formatDate(vehicle.next_service_date) : 'Not scheduled';
        
        return `
            <tr data-vehicle-id="${vehicle.id}" data-status="${status.toLowerCase()}">
                <td>
                    <div class="js-vehicle-info">
                        <span class="js-vehicle-plate">${escapeHtml(vehicle.plate_number)}</span>
                        <span class="js-vehicle-model">${escapeHtml(vehicle.model_number)}</span>
                    </div>
                </td>
                <td><span class="js-status-badge js-status-${statusClass}">${status}</span></td>
                <td>${lastService}</td>
                <td>${nextService}</td>
                <td>
                    <div class="js-progress-bar">
                        <div class="js-progress-fill ${healthClass}" style="width: ${healthPercent}%"></div>
                    </div>
                    <small style="color: #636e72; font-size: 11px;">${healthPercent}%</small>
                </td>
                <td>
                    <button class="js-action-btn" title="View Details" onclick="viewVehicleDetails('${vehicle.id}', '${escapeHtml(vehicle.plate_number)}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="js-action-btn" title="Edit Status" onclick="editVehicleMaintenance('${vehicle.id}', '${escapeHtml(vehicle.plate_number)}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="js-action-btn" title="Schedule Maintenance" onclick="scheduleVehicleMaintenance('${vehicle.id}', '${escapeHtml(vehicle.plate_number)}')">
                        <i class="fas fa-calendar"></i>
                    </button>
                    <button class="js-action-btn js-action-btn-warning" title="Mark Under Maintenance" onclick="markUnderMaintenance('${vehicle.id}', '${escapeHtml(vehicle.plate_number)}', '${status}')">
                        <i class="fas fa-wrench"></i>
                    </button>
                    <button class="js-action-btn js-action-btn-danger" title="Mark Needs Repair" onclick="markNeedsRepair('${vehicle.id}', '${escapeHtml(vehicle.plate_number)}')">
                        <i class="fas fa-exclamation-triangle"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Update Upcoming Maintenance List
 */
function updateUpcomingMaintenance(upcoming) {
    const container = document.querySelector('.js-upcoming-list');
    if (!container) return;
    
    if (!upcoming || upcoming.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #636e72;">
                <i class="fas fa-calendar-check" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                No upcoming maintenance scheduled
            </div>
        `;
        return;
    }
    
    container.innerHTML = upcoming.map(item => {
        const date = new Date(item.scheduled_date);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('en-US', { month: 'short' });
        const typeClass = getMaintenanceTypeClass(item.maintenance_type);
        const typeName = getMaintenanceTypeName(item.maintenance_type);
        
        return `
            <div class="js-upcoming-item">
                <div class="js-upcoming-date">
                    <div class="js-upcoming-day">${day}</div>
                    <div class="js-upcoming-month">${month}</div>
                </div>
                <div class="js-upcoming-details">
                    <div class="js-upcoming-title">${typeName}</div>
                    <div class="js-upcoming-vehicle">${escapeHtml(item.plate_number)} - ${escapeHtml(item.model_number)}</div>
                    <span class="js-upcoming-type js-type-${typeClass}">${typeName}</span>
                    ${item.estimated_cost ? `<span style="margin-left: 8px; color: #636e72; font-size: 11px;">Est: ₱${numberFormat(item.estimated_cost)}</span>` : ''}
                    <div style="margin-top: 8px;">
                        <button class="js-mini-btn js-mini-btn-success" onclick="completeScheduledMaintenance(${item.id}, '${escapeHtml(item.plate_number)}', '${item.maintenance_type}', ${item.estimated_cost || 0})" title="Mark as completed">
                            <i class="fas fa-check"></i> Complete
                        </button>
                        <button class="js-mini-btn js-mini-btn-danger" onclick="cancelScheduledMaintenance(${item.id}, '${escapeHtml(item.plate_number)}')" title="Cancel this maintenance">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Update Maintenance History
 */
function updateMaintenanceHistory(history) {
    // Find the history container
    const cards = document.querySelectorAll('.js-card-body');
    let historyContainer = null;
    
    for (let i = cards.length - 1; i >= 0; i--) {
        if (cards[i].closest('.js-card')?.querySelector('.js-card-title')?.textContent.includes('Recent History')) {
            historyContainer = cards[i];
            break;
        }
    }
    
    if (!historyContainer) return;
    
    if (!history || history.length === 0) {
        historyContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #636e72;">
                <i class="fas fa-history" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                No maintenance history recorded
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = history.map(item => {
        const iconClass = getMaintenanceIconClass(item.maintenance_type);
        const iconColor = getMaintenanceIconColor(item.maintenance_type);
        const typeName = getMaintenanceTypeName(item.maintenance_type);
        
        return `
            <div class="js-history-item">
                <div class="js-history-icon ${iconColor}">
                    <i class="fas fa-${iconClass}"></i>
                </div>
                <div class="js-history-content">
                    <div class="js-history-title">${typeName}</div>
                    <div class="js-history-meta">${escapeHtml(item.plate_number)} - ${formatDate(item.service_date)}</div>
                </div>
                <div class="js-history-cost">₱${numberFormat(item.cost)}</div>
            </div>
        `;
    }).join('');
}

/**
 * Filter Pills Functionality
 */
function initJeepStatusFilterPills() {
    const filterPills = document.querySelectorAll('.js-filter-pill');
    
    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            
            const filterValue = this.getAttribute('data-filter');
            const tableRows = document.querySelectorAll('#maintenanceTableBody tr');
            
            tableRows.forEach(row => {
                const rowStatus = row.getAttribute('data-status');
                
                if (filterValue === 'all') {
                    row.style.display = '';
                } else if (rowStatus && rowStatus.includes(filterValue)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Search Functionality
 */
function initJeepStatusSearch() {
    const searchInput = document.getElementById('jeepStatusSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const tableRows = document.querySelectorAll('#maintenanceTableBody tr');
            
            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
}

/**
 * View Vehicle Details
 */
function viewVehicleDetails(id, plate) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'vehicleDetailModal';
    modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="modal-box">
            <button class="modal-close" onclick="document.getElementById('vehicleDetailModal').remove()">&times;</button>
            <h3 class="modal-title">Vehicle Details - ${plate}</h3>
            <div class="modal-form" id="vehicleDetailContent">
                <p style="text-align: center; color: #636e72;">Loading...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    fetch(`${JEEP_STATUS_API_URL}?action=get_vehicles`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const vehicle = data.data.find(v => v.id == id);
                if (vehicle) {
                    document.getElementById('vehicleDetailContent').innerHTML = `
                        <div style="display: grid; gap: 15px;">
                            <div><strong>Plate Number:</strong> ${escapeHtml(vehicle.plate_number)}</div>
                            <div><strong>Model:</strong> ${escapeHtml(vehicle.model_number)}</div>
                            <div><strong>Engine Number:</strong> ${escapeHtml(vehicle.engine_number || 'N/A')}</div>
                            <div><strong>Passenger Capacity:</strong> ${vehicle.passenger_capacity || 'N/A'}</div>
                            <div><strong>OR/CR:</strong> ${escapeHtml(vehicle.or_cr || 'N/A')}</div>
                            <div><strong>Registration Status:</strong> ${escapeHtml(vehicle.registration_status)}</div>
                            <hr style="border: none; border-top: 1px solid #ecf0f1;">
                            <div><strong>Maintenance Status:</strong> <span class="js-status-badge js-status-${getStatusClass(vehicle.maintenance_status || 'Operational')}">${vehicle.maintenance_status || 'Operational'}</span></div>
                            <div><strong>Health:</strong> ${vehicle.health_percentage || 100}%</div>
                            <div><strong>Last Service:</strong> ${vehicle.last_service_date ? formatDate(vehicle.last_service_date) : 'Not recorded'}</div>
                            <div><strong>Next Service:</strong> ${vehicle.next_service_date ? formatDate(vehicle.next_service_date) : 'Not scheduled'}</div>
                        </div>
                    `;
                }
            }
        });
}

/**
 * Edit Vehicle Maintenance Status
 */
function editVehicleMaintenance(id, plate) {
    const modal = document.getElementById('maintenanceModalOverlay');
    const title = document.getElementById('maintenanceModalTitle');
    const vehicleSelect = document.getElementById('maintenanceVehicle');
    
    if (modal && title) {
        title.textContent = 'Add Maintenance Record - ' + plate;
        
        fetch(`${JEEP_STATUS_API_URL}?action=get_vehicles`)
            .then(response => response.json())
            .then(data => {
                if (data.success && vehicleSelect) {
                    vehicleSelect.innerHTML = '<option value="">Choose a vehicle...</option>' +
                        data.data.map(v => `<option value="${escapeHtml(v.plate_number)}" ${v.plate_number === plate ? 'selected' : ''}>${escapeHtml(v.plate_number)} - ${escapeHtml(v.model_number)}</option>`).join('');
                }
            });
        
        modal.classList.add('active');
    }
}

/**
 * Open Quick Schedule Modal (from top button)
 */
function openQuickScheduleModal() {
    const modal = document.getElementById('scheduleModalOverlay');
    const title = document.getElementById('scheduleModalTitle');
    const vehicleSelect = document.getElementById('scheduleVehicleSelect');
    
    if (!modal || !title) {
        console.error('Schedule modal elements not found');
        showJeepStatusAlert('Error: Modal not found. Please refresh the page.', 'error');
        return;
    }
    
    console.log('Opening quick schedule modal...');
    
    // Set title
    title.textContent = 'Schedule Maintenance';
    
    // If there's a vehicle select dropdown (for general scheduling)
    if (vehicleSelect) {
        vehicleSelect.innerHTML = '<option value="">Loading vehicles...</option>';
        vehicleSelect.disabled = true;
        
        // Fetch vehicles
        fetch(`${JEEP_STATUS_API_URL}?action=get_vehicles`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.length > 0) {
                    vehicleSelect.innerHTML = '<option value="">-- Select a vehicle --</option>' +
                        data.data.map(v => 
                            `<option value="${escapeHtml(v.plate_number)}">${escapeHtml(v.plate_number)} - ${escapeHtml(v.model_number)}</option>`
                        ).join('');
                    vehicleSelect.disabled = false;
                } else {
                    vehicleSelect.innerHTML = '<option value="">No vehicles available</option>';
                }
            })
            .catch(error => {
                console.error('Error fetching vehicles:', error);
                vehicleSelect.innerHTML = '<option value="">Failed to load vehicles</option>';
            });
    }
    
    // Clear form
    document.getElementById('scheduleType').value = 'oil';
    document.getElementById('scheduleDate').value = '';
    document.getElementById('scheduleCost').value = '';
    document.getElementById('scheduleDescription').value = '';
    
    // Configure date input for FUTURE dates
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('scheduleDate');
    if (dateInput) {
        dateInput.removeAttribute('max');
        dateInput.min = today;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Open modal
    modal.classList.add('active');
    modal.classList.add('open');
}

/**
 * Schedule Vehicle Maintenance
 */
function scheduleVehicleMaintenance(id, plate) {
    const modal = document.getElementById('scheduleModalOverlay');
    const title = document.getElementById('scheduleModalTitle');
    const vehiclePlate = document.getElementById('scheduleVehiclePlate');
    const vehicleDisplay = document.getElementById('scheduleVehicleDisplay');
    
    if (!modal || !title || !vehiclePlate || !vehicleDisplay) {
        console.error('Schedule modal elements not found');
        showJeepStatusAlert('Error: Modal not found. Please refresh the page.', 'error');
        return;
    }
    
    console.log('Opening schedule modal for:', plate);
    
    // Set modal title and vehicle info
    title.textContent = 'Schedule Maintenance - ' + plate;
    vehiclePlate.value = plate;
    vehicleDisplay.value = plate;
    
    // Clear form
    document.getElementById('scheduleType').value = 'oil';
    document.getElementById('scheduleDate').value = '';
    document.getElementById('scheduleCost').value = '';
    document.getElementById('scheduleDescription').value = '';
    
    // Configure date input for FUTURE dates only
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('scheduleDate');
    if (dateInput) {
        // IMPORTANT: Remove any max date restriction
        dateInput.removeAttribute('max');
        // Set minimum date to today (can't schedule in the past)
        dateInput.min = today;
        // Set default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.value = tomorrow.toISOString().split('T')[0];
        
        console.log('Schedule date configured - Min:', today, 'Default:', dateInput.value);
    }
    
    // Open modal with both classes for compatibility
    modal.classList.add('active');
    modal.classList.add('open');
    
    console.log('Schedule modal opened successfully');
}

/**
 * Open Add Maintenance Modal
 */
function openAddMaintenanceModal() {
    const modal = document.getElementById('maintenanceModalOverlay');
    const title = document.getElementById('maintenanceModalTitle');
    const vehicleSelect = document.getElementById('maintenanceVehicle');
    
    if (!modal || !title || !vehicleSelect) {
        console.error('Modal elements not found');
        showJeepStatusAlert('Error: Modal not found. Please refresh the page.', 'error');
        return;
    }
    
    // Set title
    title.textContent = 'Add Maintenance Record';
    
    // Show loading state
    vehicleSelect.innerHTML = '<option value="">Loading vehicles...</option>';
    vehicleSelect.disabled = true;
    
    // Clear form fields
    document.getElementById('maintenanceType').value = 'oil';
    document.getElementById('maintenanceDate').value = '';
    document.getElementById('maintenanceCost').value = '';
    document.getElementById('maintenanceProvider').value = '';
    document.getElementById('maintenanceNotes').value = '';
    
    // Set date input to today as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('maintenanceDate').max = today;
    document.getElementById('maintenanceDate').value = today;
    
    // Open modal
    modal.classList.add('active');
    modal.classList.add('open');
    
    // Fetch vehicles
    console.log('Fetching vehicles for maintenance modal...');
    fetch(`${JEEP_STATUS_API_URL}?action=get_vehicles`)
        .then(response => {
            console.log('Vehicle fetch response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Vehicle data received:', data);
            
            if (data.success && data.data && data.data.length > 0) {
                // Populate select with vehicles
                vehicleSelect.innerHTML = '<option value="">-- Select a vehicle --</option>' +
                    data.data.map(v => 
                        `<option value="${escapeHtml(v.plate_number)}">${escapeHtml(v.plate_number)} - ${escapeHtml(v.model_number)}</option>`
                    ).join('');
                vehicleSelect.disabled = false;
                showJeepStatusAlert(`${data.data.length} vehicles loaded`, 'success');
            } else if (data.success && data.data.length === 0) {
                vehicleSelect.innerHTML = '<option value="">No vehicles available</option>';
                showJeepStatusAlert('No vehicles found. Please add vehicles first.', 'warning');
            } else {
                vehicleSelect.innerHTML = '<option value="">Error loading vehicles</option>';
                showJeepStatusAlert('Error loading vehicles: ' + (data.message || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error fetching vehicles:', error);
            vehicleSelect.innerHTML = '<option value="">Failed to load vehicles</option>';
            showJeepStatusAlert('Network error loading vehicles. Check console.', 'error');
        });
}

/**
 * Close Modals
 */
function closeMaintenanceModal() {
    const modal = document.getElementById('maintenanceModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('open');
        console.log('Maintenance modal closed');
    }
}

function closeMaintenanceModalOutside(event) {
    if (event.target.id === 'maintenanceModalOverlay') {
        closeMaintenanceModal();
    }
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('open');
        console.log('Schedule modal closed');
    }
}

function closeScheduleModalOutside(event) {
    if (event.target.id === 'scheduleModalOverlay') {
        closeScheduleModal();
    }
}

/**
 * Submit Maintenance Form
 */
function submitMaintenanceForm() {
    console.log('Submitting maintenance form...');
    
    const vehicle = document.getElementById('maintenanceVehicle').value;
    const type = document.getElementById('maintenanceType').value;
    const serviceDate = document.getElementById('maintenanceDate').value;
    const cost = document.getElementById('maintenanceCost').value;
    const provider = document.getElementById('maintenanceProvider').value;
    const notes = document.getElementById('maintenanceNotes').value;
    
    console.log('Form data:', { vehicle, type, serviceDate, cost, provider, notes });
    
    // Validation
    if (!vehicle) {
        showJeepStatusAlert('Please select a vehicle', 'warning');
        return;
    }
    
    if (!serviceDate) {
        showJeepStatusAlert('Please select a service date', 'warning');
        return;
    }
    
    if (!cost || parseFloat(cost) <= 0) {
        showJeepStatusAlert('Please enter a valid cost amount', 'warning');
        return;
    }
    
    // Show loading state
    showJeepStatusAlert('Adding maintenance record...', 'info');
    
    const requestData = {
        vehicle: vehicle,
        type: type,
        service_date: serviceDate,
        cost: parseFloat(cost),
        provider: provider,
        notes: notes
    };
    
    console.log('Sending request:', requestData);
    
    fetch(`${JEEP_STATUS_API_URL}?action=add_maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        
        if (data.success) {
            showJeepStatusAlert(`Maintenance record added for ${vehicle}!`, 'success');
            closeMaintenanceModal();
            
            // Ask if they want to mark vehicle as operational
            setTimeout(() => {
                if (confirm(`Mark ${vehicle} as operational now that maintenance is complete?`)) {
                    markOperational(null, vehicle);
                } else {
                    loadJeepStatusData();
                }
            }, 500);
        } else {
            showJeepStatusAlert('Error: ' + (data.message || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        console.error('Error adding maintenance:', error);
        showJeepStatusAlert('Network error: ' + error.message, 'error');
    });
}

/**
 * Submit Schedule Form
 */
function submitScheduleForm() {
    console.log('Submitting schedule form...');
    
    const plate = document.getElementById('scheduleVehiclePlate').value;
    const type = document.getElementById('scheduleType').value;
    const scheduledDate = document.getElementById('scheduleDate').value;
    const cost = document.getElementById('scheduleCost').value;
    const description = document.getElementById('scheduleDescription').value;
    
    console.log('Schedule form data:', { plate, type, scheduledDate, cost, description });
    
    // Validation
    if (!plate) {
        showJeepStatusAlert('Vehicle plate number is missing', 'error');
        return;
    }
    
    if (!scheduledDate) {
        showJeepStatusAlert('Please select a date for the scheduled maintenance', 'warning');
        return;
    }
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedDate = new Date(scheduledDate);
    
    if (schedDate < today) {
        showJeepStatusAlert('Cannot schedule maintenance in the past. Please select a future date.', 'warning');
        return;
    }
    
    // Calculate days until scheduled
    const diffTime = schedDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let message = `Schedule ${getMaintenanceTypeName(type)} for ${plate}?`;
    if (diffDays === 0) {
        message += ` (Today)`;
    } else if (diffDays === 1) {
        message += ` (Tomorrow)`;
    } else if (diffDays <= 7) {
        message += ` (In ${diffDays} days - will appear in "Scheduled This Week")`;
    } else {
        message += ` (In ${diffDays} days)`;
    }
    
    if (!confirm(message)) return;
    
    // Show loading
    showJeepStatusAlert('Scheduling maintenance...', 'info');
    
    const requestData = {
        vehicle: plate,
        type: type,
        scheduled_date: scheduledDate,
        cost: parseFloat(cost) || 0,
        description: description
    };
    
    console.log('Sending schedule request:', requestData);
    
    fetch(`${JEEP_STATUS_API_URL}?action=schedule_maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        console.log('Schedule response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Schedule response data:', data);
        
        if (data.success) {
            let successMsg = `Maintenance scheduled for ${plate} on ${scheduledDate}`;
            if (diffDays <= 7) {
                successMsg += ' (Added to "Scheduled This Week")';
            }
            showJeepStatusAlert(successMsg, 'success');
            closeScheduleModal();
            loadJeepStatusData();
        } else {
            showJeepStatusAlert('Error: ' + (data.message || 'Failed to schedule'), 'error');
        }
    })
    .catch(error => {
        console.error('Error scheduling maintenance:', error);
        showJeepStatusAlert('Network error: ' + error.message, 'error');
    });
}

/**
 * Export Maintenance Report
 */
function exportMaintenanceReport() {
    // Show export options
    const exportType = prompt(
        'Choose export format:\n\n' +
        '1 - CSV (Excel-compatible)\n' +
        '2 - Detailed Text Report\n' +
        '3 - Both formats\n\n' +
        'Enter 1, 2, or 3:',
        '1'
    );
    
    if (!exportType || !['1', '2', '3'].includes(exportType)) {
        return;
    }
    
    showJeepStatusAlert('Generating report...', 'success');
    
    fetch(`${JEEP_STATUS_API_URL}?action=get_all_data`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const timestamp = new Date().toISOString().split('T')[0];
                
                // Generate CSV format
                if (exportType === '1' || exportType === '3') {
                    generateCSVReport(data, timestamp);
                }
                
                // Generate detailed text report
                if (exportType === '2' || exportType === '3') {
                    generateDetailedReport(data, timestamp);
                }
                
                showJeepStatusAlert('Report downloaded successfully!', 'success');
            }
        })
        .catch(error => {
            showJeepStatusAlert('Error generating report: ' + error.message, 'error');
        });
}

/**
 * Generate CSV Report
 */
function generateCSVReport(data, timestamp) {
    // Main vehicle status report
    let csv = 'ECOBEEP VEHICLE MAINTENANCE REPORT\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Summary statistics
    csv += 'SUMMARY STATISTICS\n';
    csv += 'Category,Count\n';
    csv += `Operational Vehicles,${data.stats.operational}\n`;
    csv += `Under Maintenance,${data.stats.maintenance}\n`;
    csv += `Needs Repair,${data.stats.repair}\n`;
    csv += `Scheduled This Week,${data.stats.scheduled}\n`;
    csv += `Total Vehicles,${data.vehicles.length}\n\n`;
    
    // Vehicle status details
    csv += 'VEHICLE STATUS DETAILS\n';
    csv += 'Plate Number,Model,Status,Health %,Last Service,Next Service,Engine Number,Capacity,OR/CR\n';
    data.vehicles.forEach(v => {
        csv += `"${v.plate_number}","${v.model_number}","${v.maintenance_status || 'Operational'}",${v.health_percentage || 100},"${v.last_service_date || 'N/A'}","${v.next_service_date || 'N/A'}","${v.engine_number || 'N/A'}",${v.passenger_capacity || 'N/A'},"${v.or_cr || 'N/A'}"\n`;
    });
    
    // Upcoming maintenance
    if (data.upcoming && data.upcoming.length > 0) {
        csv += '\n\nUPCOMING MAINTENANCE\n';
        csv += 'Plate Number,Model,Type,Scheduled Date,Est. Cost,Description\n';
        data.upcoming.forEach(item => {
            csv += `"${item.plate_number}","${item.model_number}","${getMaintenanceTypeName(item.maintenance_type)}","${item.scheduled_date}","₱${numberFormat(item.estimated_cost || 0)}","${(item.description || '').replace(/"/g, '""')}"\n`;
        });
    }
    
    // Recent maintenance history
    if (data.history && data.history.length > 0) {
        csv += '\n\nRECENT MAINTENANCE HISTORY\n';
        csv += 'Plate Number,Model,Type,Service Date,Cost,Provider,Notes\n';
        data.history.forEach(item => {
            csv += `"${item.plate_number}","${item.model_number}","${getMaintenanceTypeName(item.maintenance_type)}","${item.service_date}","₱${numberFormat(item.cost || 0)}","${item.service_provider || 'N/A'}","${(item.notes || '').replace(/"/g, '""')}"\n`;
        });
    }
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecobeep-maintenance-report-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Generate Detailed Text Report
 */
function generateDetailedReport(data, timestamp) {
    let report = '';
    
    // Header
    report += '═══════════════════════════════════════════════════════════════\n';
    report += '              ECOBEEP VEHICLE MAINTENANCE REPORT\n';
    report += '═══════════════════════════════════════════════════════════════\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Report Date: ${timestamp}\n`;
    report += '═══════════════════════════════════════════════════════════════\n\n';
    
    // Executive Summary
    report += '📊 EXECUTIVE SUMMARY\n';
    report += '─────────────────────────────────────────────────────────────\n';
    report += `Total Vehicles: ${data.vehicles.length}\n`;
    report += `✅ Operational: ${data.stats.operational} (${Math.round(data.stats.operational/data.vehicles.length*100)}%)\n`;
    report += `🔧 Under Maintenance: ${data.stats.maintenance} (${Math.round(data.stats.maintenance/data.vehicles.length*100)}%)\n`;
    report += `⚠️  Needs Repair: ${data.stats.repair} (${Math.round(data.stats.repair/data.vehicles.length*100)}%)\n`;
    report += `📅 Scheduled This Week: ${data.stats.scheduled}\n\n`;
    
    // Fleet Health Score
    const avgHealth = data.vehicles.reduce((sum, v) => sum + (v.health_percentage || 100), 0) / data.vehicles.length;
    report += `🏥 Average Fleet Health: ${avgHealth.toFixed(1)}%\n`;
    report += '═══════════════════════════════════════════════════════════════\n\n';
    
    // Vehicles by Status
    const operational = data.vehicles.filter(v => (v.maintenance_status || 'Operational') === 'Operational');
    const underMaintenance = data.vehicles.filter(v => v.maintenance_status === 'Under Maintenance');
    const needsRepair = data.vehicles.filter(v => v.maintenance_status === 'Needs Repair');
    
    if (operational.length > 0) {
        report += '✅ OPERATIONAL VEHICLES\n';
        report += '─────────────────────────────────────────────────────────────\n';
        operational.forEach(v => {
            report += `  ${v.plate_number} - ${v.model_number}\n`;
            report += `    Health: ${v.health_percentage || 100}% | Last Service: ${v.last_service_date || 'Not recorded'}\n`;
            report += `    Next Service: ${v.next_service_date || 'Not scheduled'}\n\n`;
        });
    }
    
    if (underMaintenance.length > 0) {
        report += '🔧 UNDER MAINTENANCE\n';
        report += '─────────────────────────────────────────────────────────────\n';
        underMaintenance.forEach(v => {
            report += `  ${v.plate_number} - ${v.model_number}\n`;
            report += `    Health: ${v.health_percentage}% | Status: Under Maintenance\n`;
            report += `    Last Service: ${v.last_service_date || 'Not recorded'}\n\n`;
        });
    }
    
    if (needsRepair.length > 0) {
        report += '⚠️  NEEDS REPAIR (PRIORITY)\n';
        report += '─────────────────────────────────────────────────────────────\n';
        needsRepair.forEach(v => {
            report += `  ${v.plate_number} - ${v.model_number}\n`;
            report += `    Health: ${v.health_percentage}% | Status: Needs Repair\n`;
            report += `    Action Required: Schedule repair immediately\n\n`;
        });
    }
    
    // Upcoming Maintenance
    if (data.upcoming && data.upcoming.length > 0) {
        report += '📅 UPCOMING MAINTENANCE SCHEDULE\n';
        report += '─────────────────────────────────────────────────────────────\n';
        data.upcoming.forEach(item => {
            report += `  ${item.scheduled_date} - ${item.plate_number}\n`;
            report += `    Type: ${getMaintenanceTypeName(item.maintenance_type)}\n`;
            report += `    Est. Cost: ₱${numberFormat(item.estimated_cost || 0)}\n`;
            if (item.description) report += `    Notes: ${item.description}\n`;
            report += '\n';
        });
    }
    
    // Recent History
    if (data.history && data.history.length > 0) {
        report += '📝 RECENT MAINTENANCE HISTORY\n';
        report += '─────────────────────────────────────────────────────────────\n';
        data.history.forEach(item => {
            report += `  ${item.service_date} - ${item.plate_number}\n`;
            report += `    Type: ${getMaintenanceTypeName(item.maintenance_type)}\n`;
            report += `    Cost: ₱${numberFormat(item.cost)}\n`;
            if (item.service_provider) report += `    Provider: ${item.service_provider}\n`;
            report += '\n';
        });
    }
    
    // Footer
    report += '═══════════════════════════════════════════════════════════════\n';
    report += '                    END OF REPORT\n';
    report += '═══════════════════════════════════════════════════════════════\n';
    
    // Download as text file
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ecobeep-detailed-report-${timestamp}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Mark Vehicle Under Maintenance
 */
function markUnderMaintenance(id, plate, currentStatus) {
    // Determine the new status
    let newStatus;
    let newHealth;
    let actionText;
    
    if (currentStatus === 'Under Maintenance') {
        // If already under maintenance, mark as operational
        newStatus = 'Operational';
        newHealth = 100;
        actionText = 'operational';
    } else if (currentStatus === 'Needs Repair') {
        // If needs repair, mark as under maintenance (repair in progress)
        newStatus = 'Under Maintenance';
        newHealth = 50;
        actionText = 'under maintenance';
    } else {
        // If operational, mark as under maintenance
        newStatus = 'Under Maintenance';
        newHealth = 70;
        actionText = 'under maintenance';
    }
    
    // Confirm with user
    if (!confirm(`Mark vehicle "${plate}" as ${actionText}?`)) {
        return;
    }
    
    // Send update to server
    fetch(`${JEEP_STATUS_API_URL}?action=update_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vehicle: plate,
            status: newStatus,
            health: newHealth
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showJeepStatusAlert(`Vehicle ${plate} marked as ${actionText}!`, 'success');
            
            // If marking as under maintenance, ask if user wants to schedule completion
            if (newStatus === 'Under Maintenance') {
                setTimeout(() => {
                    if (confirm(`Would you like to schedule when this maintenance will be completed for ${plate}?`)) {
                        scheduleVehicleMaintenance(id, plate);
                    }
                }, 500);
            }
            
            // Reload the data to reflect changes
            loadJeepStatusData();
        } else {
            showJeepStatusAlert('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showJeepStatusAlert('Error updating status: ' + error.message, 'error');
    });
}

/**
 * Mark Vehicle Needs Repair
 */
function markNeedsRepair(id, plate) {
    if (!confirm(`Mark vehicle "${plate}" as needing repair? This will set health to 30%.`)) {
        return;
    }
    
    fetch(`${JEEP_STATUS_API_URL}?action=update_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vehicle: plate,
            status: 'Needs Repair',
            health: 30
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showJeepStatusAlert(`Vehicle ${plate} marked as needing repair!`, 'warning');
            
            // Ask if user wants to schedule the repair
            setTimeout(() => {
                if (confirm(`Would you like to schedule a repair date for ${plate}?`)) {
                    scheduleVehicleMaintenance(id, plate);
                }
            }, 500);
            
            loadJeepStatusData();
        } else {
            showJeepStatusAlert('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showJeepStatusAlert('Error updating status: ' + error.message, 'error');
    });
}

/**
 * Mark Vehicle Operational
 */
function markOperational(id, plate) {
    if (!confirm(`Mark vehicle "${plate}" as operational? This will set health to 100%.`)) {
        return;
    }
    
    fetch(`${JEEP_STATUS_API_URL}?action=update_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vehicle: plate,
            status: 'Operational',
            health: 100
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showJeepStatusAlert(`Vehicle ${plate} marked as operational!`, 'success');
            loadJeepStatusData();
        } else {
            showJeepStatusAlert('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showJeepStatusAlert('Error updating status: ' + error.message, 'error');
    });
}

/**
 * Complete Scheduled Maintenance
 * Moves from scheduled_maintenance to maintenance_history
 */
function completeScheduledMaintenance(scheduleId, plate, type, cost) {
    if (!confirm(`Mark this scheduled maintenance as completed for ${plate}?`)) {
        return;
    }
    
    // Prompt for actual cost if different from estimate
    const actualCost = prompt(`Enter actual cost (estimated: ₱${cost}):`, cost);
    if (actualCost === null) return; // User cancelled
    
    // Add to maintenance history
    fetch(`${JEEP_STATUS_API_URL}?action=add_maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vehicle: plate,
            type: type,
            service_date: new Date().toISOString().split('T')[0], // Today
            cost: parseFloat(actualCost) || cost,
            provider: 'Completed from schedule',
            notes: `Completed scheduled maintenance (Schedule ID: ${scheduleId})`
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Delete from scheduled maintenance
            return fetch(`${JEEP_STATUS_API_URL}?action=delete_scheduled`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ schedule_id: scheduleId })
            });
        } else {
            throw new Error(data.message);
        }
    })
    .then(response => response.json())
    .then(data => {
        showJeepStatusAlert(`Maintenance completed for ${plate}!`, 'success');
        loadJeepStatusData();
    })
    .catch(error => {
        showJeepStatusAlert('Error completing maintenance: ' + error.message, 'error');
    });
}

/**
 * Cancel Scheduled Maintenance
 */
function cancelScheduledMaintenance(scheduleId, plate) {
    if (!confirm(`Cancel scheduled maintenance for ${plate}?`)) {
        return;
    }
    
    fetch(`${JEEP_STATUS_API_URL}?action=delete_scheduled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: scheduleId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showJeepStatusAlert(`Scheduled maintenance cancelled for ${plate}`, 'success');
            loadJeepStatusData();
        } else {
            showJeepStatusAlert('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        showJeepStatusAlert('Error cancelling maintenance: ' + error.message, 'error');
    });
}

/**
 * Show Alert Message
 */
function showJeepStatusAlert(message, type = 'info') {
    document.querySelectorAll('.js-alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `js-alert js-alert-${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    alertDiv.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    
    const content = document.querySelector('.jeep-status-content');
    if (content) {
        content.insertBefore(alertDiv, content.firstChild);
        setTimeout(() => {
            alertDiv.style.opacity = '0';
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getStatusClass(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('operational')) return 'operational';
    if (s.includes('maintenance')) return 'maintenance';
    if (s.includes('repair')) return 'repair';
    if (s.includes('inspection')) return 'inspection';
    return 'operational';
}

function getHealthClass(percent) {
    if (percent >= 70) return 'green';
    if (percent >= 40) return 'orange';
    return 'red';
}

function getMaintenanceTypeClass(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('oil')) return 'oil';
    if (t.includes('tire')) return 'tire';
    if (t.includes('brake')) return 'brake';
    if (t.includes('inspection')) return 'inspection';
    return 'oil';
}

function getMaintenanceTypeName(type) {
    const typeNames = {
        'oil': 'Oil Change',
        'tire': 'Tire Rotation',
        'brake': 'Brake Service',
        'inspection': 'Inspection',
        'engine': 'Engine Tune-up',
        'battery': 'Battery Service',
        'transmission': 'Transmission Service'
    };
    return typeNames[type?.toLowerCase()] || type || 'General Service';
}

function getMaintenanceIconClass(type) {
    const icons = {
        'oil': 'oil-can',
        'tire': 'circle',
        'brake': 'compact-disc',
        'inspection': 'clipboard-check',
        'engine': 'cogs',
        'battery': 'car-battery',
        'transmission': 'cog'
    };
    return icons[type?.toLowerCase()] || 'wrench';
}

function getMaintenanceIconColor(type) {
    const colors = {
        'oil': 'orange',
        'tire': 'blue',
        'brake': 'red',
        'inspection': 'green',
        'engine': 'blue',
        'battery': 'green',
        'transmission': 'orange'
    };
    return colors[type?.toLowerCase()] || 'blue';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function numberFormat(num) {
    return parseFloat(num || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}