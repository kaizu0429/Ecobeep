/**
 * ECOBEEP - Vehicle & Driver Integration Script (FIXED)
 * Now properly displays total operational vehicles
 */

const API_BASE_URL = '../php/assign-driver-api.php';

// Global state
let allVehicles = [];
let allDrivers = [];
let allAssignments = [];

/**
 * Initialize when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load all data when app starts
    loadAllData();
    
    // Set up page navigation listeners
    setupPageNavigation();
    
    // Refresh data every 30 seconds
    setInterval(loadAllData, 30000);
});

/**
 * Load all data from API
 */
function loadAllData() {
    fetch(`${API_BASE_URL}?action=get_all_data`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store data globally
                allVehicles = data.unassigned_vehicles || [];
                allDrivers = data.available_drivers || [];
                allAssignments = data.assignments || [];
                
                // Update all relevant sections
                updateVehicleDetailsTable();
                updateDriverAssignmentTable();
                updateDriverStats(data.stats);
                updateVehicleStats(data.stats);  // ← NEW: Update vehicle stats
                updateUnassignedVehiclesTable(data.unassigned_vehicles);
            } else {
                console.error('Failed to load data:', data.message);
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });
}

/**
 * Update Vehicle Statistics (NEW FUNCTION)
 * This updates the vehicle count cards on Driver Management page
 */
function updateVehicleStats(stats) {
    // Update Total Vehicles (Driver Management page uses 'dm' prefix)
    const totalVehiclesEl = document.getElementById('dmTotalVehicles');
    if (totalVehiclesEl) {
        totalVehiclesEl.textContent = stats.total_vehicles || 0;
    }
    
    // Update Assigned Vehicles
    const assignedVehiclesEl = document.getElementById('dmAssignedVehicles');
    if (assignedVehiclesEl) {
        assignedVehiclesEl.textContent = stats.vehicles_assigned || 0;
    }
    
    // Update Available Vehicles (Unassigned)
    const availableVehiclesEl = document.getElementById('dmAvailableVehicles');
    if (availableVehiclesEl) {
        availableVehiclesEl.textContent = stats.vehicles_unassigned || 0;
    }
}

/**
 * Update Vehicle Details Table
 * Shows all vehicles with their assignment status
 */
function updateVehicleDetailsTable() {
    const tbody = document.getElementById('vehicleDetailsTableBody');
    if (!tbody) return;
    
    // Get all vehicles (both assigned and unassigned)
    fetch(`${API_BASE_URL}?action=get_all_vehicles`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                // Fallback: combine assigned and unassigned
                const allVehiclesList = [...allAssignments.map(a => ({
                    ...a,
                    status: 'assigned',
                    driver_name: a.driver_name || `${a.first_name} ${a.last_name}`
                })), ...allVehicles.map(v => ({
                    ...v,
                    status: 'available'
                }))];
                
                renderVehicleDetailsTable(allVehiclesList);
            } else {
                renderVehicleDetailsTable(data.vehicles);
            }
        });
}

/**
 * Render vehicle details table
 */
function renderVehicleDetailsTable(vehicles) {
    const tbody = document.getElementById('vehicleDetailsTableBody');
    if (!tbody) return;
    
    if (!vehicles || vehicles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <i class="fas fa-bus-slash" style="font-size: 48px; color: #95a5a6;"></i>
                    <p style="margin-top: 15px; color: #7f8c8d;">No vehicles found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = vehicles.map(v => {
        const isAssigned = v.assignment_status === 'assigned' || v.driver_name;
        const statusBadge = isAssigned 
            ? `<span class="badge badge-assigned">Assigned</span>`
            : `<span class="badge badge-available">Available</span>`;
        
        const driverInfo = isAssigned 
            ? `<div class="driver-assigned">
                <i class="fas fa-user"></i> ${escapeHtml(v.driver_name || 'N/A')}
               </div>`
            : `<div class="driver-unassigned">
                <i class="fas fa-user-slash"></i> No driver
               </div>`;
        
        const actionButton = isAssigned
            ? `<button class="btn-small btn-danger" onclick="quickUnassign(${v.assignment_id || v.id}, '${escapeHtml(v.plate_number)}')">
                <i class="fas fa-user-minus"></i> Unassign
               </button>`
            : `<button class="btn-small btn-primary" onclick="quickAssign(${v.id}, '${escapeHtml(v.plate_number)}')">
                <i class="fas fa-user-plus"></i> Assign Driver
               </button>`;
        
        return `
            <tr>
                <td><strong>${escapeHtml(v.plate_number)}</strong></td>
                <td>${escapeHtml(v.model_number || 'N/A')}</td>
                <td>${v.passenger_capacity || 'N/A'} seats</td>
                <td>${statusBadge}</td>
                <td>${driverInfo}</td>
                <td>${actionButton}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Update Driver Assignment Table (Active Assignments)
 */
function updateDriverAssignmentTable() {
    const tbody = document.getElementById('assignmentsTableBody');
    if (!tbody) return;
    
    if (!allAssignments || allAssignments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px;">
                    <i class="fas fa-user-slash" style="font-size: 48px; color: #95a5a6;"></i>
                    <p style="margin-top: 15px; color: #7f8c8d;">No active assignments</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = allAssignments.map(a => `
        <tr>
            <td>
                <div class="vehicle-info">
                    <span class="vehicle-plate">${escapeHtml(a.plate_number)}</span>
                    <span class="vehicle-model">${escapeHtml(a.model_number)}</span>
                </div>
            </td>
            <td>
                <div class="driver-info">
                    <span class="driver-name">${escapeHtml(a.driver_name || (a.first_name + ' ' + a.last_name))}</span>
                    <span class="driver-license">${escapeHtml(a.license_number)}</span>
                </div>
            </td>
            <td><span class="date-text">${formatDate(a.assigned_date)}</span></td>
            <td>
                <button class="action-btn action-btn-danger" onclick="unassignDriver(${a.assignment_id}, '${escapeHtml(a.plate_number)}', '${escapeHtml(a.driver_name || (a.first_name + ' ' + a.last_name))}')" title="Unassign Driver">
                    <i class="fas fa-times"></i> Unassign
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Update Driver Statistics
 */
function updateDriverStats(stats) {
    // Assign Driver page stats (with regular IDs)
    const totalDriversEl = document.getElementById('statTotalDrivers');
    const availableEl = document.getElementById('statAvailableDrivers');
    const assignedEl = document.getElementById('statAssignedDrivers');
    const onLeaveEl = document.getElementById('statOnLeave');
    
    if (totalDriversEl) totalDriversEl.textContent = stats.total_drivers || 0;
    if (availableEl) availableEl.textContent = stats.available || 0;
    if (assignedEl) assignedEl.textContent = stats.assigned || 0;
    if (onLeaveEl) onLeaveEl.textContent = stats.on_leave || 0;
    
    // Driver Management page stats (with 'dm' prefix)
    const dmTotalDriversEl = document.getElementById('dmStatTotalDrivers');
    const dmAvailableEl = document.getElementById('dmStatAvailable');
    const dmAssignedEl = document.getElementById('dmStatAssigned');
    const dmSuspendedEl = document.getElementById('dmStatSuspended');
    
    if (dmTotalDriversEl) dmTotalDriversEl.textContent = stats.total_drivers || 0;
    if (dmAvailableEl) dmAvailableEl.textContent = stats.available || 0;
    if (dmAssignedEl) dmAssignedEl.textContent = stats.assigned || 0;
    if (dmSuspendedEl) dmSuspendedEl.textContent = stats.inactive || 0;
}

/**
 * Update Unassigned Vehicles Table
 */
function updateUnassignedVehiclesTable(vehicles) {
    const tbody = document.getElementById('unassignedVehiclesBody');
    if (!tbody) return;
    
    if (!vehicles || vehicles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px;">
                    <i class="fas fa-check-circle" style="font-size: 48px; color: #27ae60;"></i>
                    <p style="margin-top: 15px; color: #27ae60;">All vehicles are assigned! Great job!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = vehicles.map(v => `
        <tr>
            <td>
                <div class="vehicle-info">
                    <span class="vehicle-plate">${escapeHtml(v.plate_number)}</span>
                    <span class="vehicle-model">${escapeHtml(v.model_number)}</span>
                </div>
            </td>
            <td><span class="capacity-badge">${v.passenger_capacity} seats</span></td>
            <td>
                <button class="action-btn action-btn-primary" onclick="openAssignModal(${v.id}, '${escapeHtml(v.plate_number)}')" title="Assign Driver">
                    <i class="fas fa-user-plus"></i> Assign Driver
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Quick Assign - from Vehicle Details page
 */
function quickAssign(vehicleId, plateNumber) {
    openAssignModal(vehicleId, plateNumber);
}

/**
 * Quick Unassign - from Vehicle Details page
 */
function quickUnassign(assignmentId, plateNumber) {
    if (!confirm(`Unassign driver from ${plateNumber}?`)) {
        return;
    }
    
    showAlert('Unassigning driver...', 'info');
    
    fetch(`${API_BASE_URL}?action=unassign_driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Driver unassigned successfully!', 'success');
            loadAllData(); // Refresh all tables
        } else {
            showAlert('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Network error: ' + error.message, 'error');
    });
}

/**
 * Open Assign Modal
 */
function openAssignModal(vehicleId, plateNumber) {
    const modal = document.getElementById('assignModalOverlay');
    const title = document.getElementById('assignModalTitle');
    const vehicleInput = document.getElementById('assignVehicleId');
    const vehicleDisplay = document.getElementById('assignVehicleDisplay');
    const driverSelect = document.getElementById('assignDriverSelect');
    
    if (!modal) {
        console.error('Assign modal not found');
        return;
    }
    
    if (title) title.textContent = 'Assign Driver to ' + plateNumber;
    if (vehicleInput) vehicleInput.value = vehicleId;
    if (vehicleDisplay) vehicleDisplay.value = plateNumber;
    
    // Clear form
    if (driverSelect) {
        driverSelect.innerHTML = '<option value="">Loading drivers...</option>';
        driverSelect.disabled = true;
    }
    
    const notesField = document.getElementById('assignNotes');
    if (notesField) notesField.value = '';
    
    // Fetch available drivers
    fetch(`${API_BASE_URL}?action=get_available_drivers`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data.length > 0) {
                if (driverSelect) {
                    driverSelect.innerHTML = '<option value="">-- Select a driver --</option>' +
                        data.data.map(d => 
                            `<option value="${d.id}">${escapeHtml(d.first_name + ' ' + d.last_name)} - ${escapeHtml(d.license_number)}</option>`
                        ).join('');
                    driverSelect.disabled = false;
                }
            } else {
                if (driverSelect) {
                    driverSelect.innerHTML = '<option value="">No available drivers</option>';
                }
                showAlert('No available drivers. Add drivers first.', 'warning');
            }
        })
        .catch(error => {
            console.error('Error loading drivers:', error);
            if (driverSelect) {
                driverSelect.innerHTML = '<option value="">Error loading drivers</option>';
            }
        });
    
    modal.classList.add('active');
    modal.style.display = 'flex';
}

/**
 * Close Assign Modal
 */
function closeAssignModal() {
    const modal = document.getElementById('assignModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function closeAssignModalOutside(event) {
    if (event.target.id === 'assignModalOverlay') {
        closeAssignModal();
    }
}

/**
 * Submit Assignment
 */
function submitAssignment() {
    const vehicleId = document.getElementById('assignVehicleId')?.value;
    const driverId = document.getElementById('assignDriverSelect')?.value;
    const notes = document.getElementById('assignNotes')?.value || '';
    
    if (!driverId) {
        showAlert('Please select a driver', 'warning');
        return;
    }
    
    showAlert('Assigning driver...', 'info');
    
    fetch(`${API_BASE_URL}?action=assign_driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vehicle_id: parseInt(vehicleId),
            driver_id: parseInt(driverId),
            shift: 'full_day',
            notes: notes
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Driver assigned successfully!', 'success');
            closeAssignModal();
            loadAllData(); // Refresh all tables
        } else {
            showAlert('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error assigning driver:', error);
        showAlert('Network error: ' + error.message, 'error');
    });
}

/**
 * Unassign Driver
 */
function unassignDriver(assignmentId, vehiclePlate, driverName) {
    if (!confirm(`Unassign ${driverName} from ${vehiclePlate}?`)) {
        return;
    }
    
    showAlert('Unassigning driver...', 'info');
    
    fetch(`${API_BASE_URL}?action=unassign_driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id: assignmentId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Driver unassigned successfully!', 'success');
            loadAllData(); // Refresh all tables
        } else {
            showAlert('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error unassigning driver:', error);
        showAlert('Network error: ' + error.message, 'error');
    });
}

/**
 * Open Add Driver Modal
 */
function openAddDriverModal() {
    const modal = document.getElementById('addDriverModalOverlay');
    if (!modal) {
        console.error('Add driver modal not found');
        return;
    }
    
    // Clear form
    ['driverFirstName', 'driverLastName', 'driverLicense', 'driverPhone', 'driverEmail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const hiredEl = document.getElementById('driverHired');
    if (hiredEl) hiredEl.value = new Date().toISOString().split('T')[0];
    
    modal.classList.add('active');
    modal.style.display = 'flex';
}

/**
 * Close Add Driver Modal
 */
function closeAddDriverModal() {
    const modal = document.getElementById('addDriverModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function closeAddDriverModalOutside(event) {
    if (event.target.id === 'addDriverModalOverlay') {
        closeAddDriverModal();
    }
}

/**
 * Submit Add Driver
 */
function submitAddDriver() {
    const firstName = document.getElementById('driverFirstName')?.value.trim();
    const lastName = document.getElementById('driverLastName')?.value.trim();
    const license = document.getElementById('driverLicense')?.value.trim();
    const phone = document.getElementById('driverPhone')?.value.trim();
    const email = document.getElementById('driverEmail')?.value.trim();
    const hired = document.getElementById('driverHired')?.value;
    
    if (!firstName || !lastName || !license) {
        showAlert('Please fill in required fields (First Name, Last Name, License)', 'warning');
        return;
    }
    
    showAlert('Adding driver...', 'info');
    
    fetch(`${API_BASE_URL}?action=add_driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            license_number: license,
            phone: phone,
            email: email,
            date_hired: hired
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Driver added successfully!', 'success');
            closeAddDriverModal();
            loadAllData(); // Refresh all data
        } else {
            showAlert('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error adding driver:', error);
        showAlert('Network error: ' + error.message, 'error');
    });
}

/**
 * Setup Page Navigation
 */
function setupPageNavigation() {
    // Listen for page navigation clicks
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(() => {
                const page = this.getAttribute('data-page');
                if (page === 'jeep-details' || page === 'jeep-assign') {
                    loadAllData(); // Refresh data when switching to these pages
                }
            }, 100);
        });
    });
}

/**
 * Show Alert
 */
function showAlert(message, type = 'info') {
    // Remove existing alerts
    document.querySelectorAll('.js-alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `js-alert js-alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 500;
        min-width: 300px;
        max-width: 500px;
        animation: slideInRight 0.3s ease;
    `;
    
    const colors = {
        success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724', icon: 'check-circle' },
        error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24', icon: 'exclamation-circle' },
        warning: { bg: '#fff3cd', border: '#ffeaa7', text: '#856404', icon: 'exclamation-triangle' },
        info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460', icon: 'info-circle' }
    };
    
    const style = colors[type] || colors.info;
    alertDiv.style.backgroundColor = style.bg;
    alertDiv.style.borderLeft = `4px solid ${style.border}`;
    alertDiv.style.color = style.text;
    
    alertDiv.innerHTML = `
        <i class="fas fa-${style.icon}" style="font-size: 20px;"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100%)';
        alertDiv.style.transition = 'all 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 5000);
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS animations
if (!document.getElementById('integration-styles')) {
    const style = document.createElement('style');
    style.id = 'integration-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
            display: inline-block;
        }
        
        .badge-assigned {
            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
            color: white;
        }
        
        .badge-available {
            background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
            color: white;
        }
        
        .driver-assigned {
            color: #27ae60;
            font-weight: 600;
        }
        
        .driver-unassigned {
            color: #95a5a6;
        }
        
        .btn-small {
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
        }
        
        .btn-small:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(style);
}