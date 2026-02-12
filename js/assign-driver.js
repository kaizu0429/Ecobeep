/**
 * ECOBEEP - Assign Driver JavaScript (FIXED VERSION)
 * Compatible with driver-management-api.php
 * ✅ Fixed duplicate dropdown options
 * ✅ Now properly shows only AVAILABLE drivers
 */

const AD_API_BASE = '../php/';
const AD_API_ENDPOINTS = {
    // ✅ CHANGED: Use get_available_drivers instead of get_all_drivers
    getAvailableDrivers: AD_API_BASE + 'assign-driver-api.php?action=get_available_drivers',
    getStats: AD_API_BASE + 'driver-management-api.php?action=get_stats',
    assignDriver: AD_API_BASE + 'assign-driver-api.php?action=assign_driver',
    unassignDriver: AD_API_BASE + 'assign-driver-api.php?action=unassign_driver',
    getAssignments: AD_API_BASE + 'assign-driver-api.php?action=get_assignments',
    getUnassignedVehicles: AD_API_BASE + 'get-unassigned-vehicles.php',
    addDriver: AD_API_BASE + 'driver-management-api.php?action=add_driver'
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Assign Driver JS loaded (FIXED VERSION)');
    
    const assignPage = document.getElementById('page-jeep-assign');
    if (assignPage && assignPage.classList.contains('active')) {
        initAssignDriverPage();
    }
    
    document.querySelectorAll('.nav-link[data-page="jeep-assign"]').forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(() => initAssignDriverPage(), 100);
        });
    });
});

function initAssignDriverPage() {
    console.log('Initializing Assign Driver page...');
    loadAssignDriverData();
}

async function loadAssignDriverData() {
    console.log('Loading assign driver data...');
    
    try {
        showAssignLoadingState();
        await Promise.all([
            loadADStats(),
            loadAssignments(),
            loadUnassignedVehicles()
        ]);
        console.log('Assign Driver data loaded successfully');
    } catch (error) {
        console.error('Error loading assign driver data:', error);
        showEmptyState();
        showAssignAlert('Failed to load data: ' + error.message, 'error');
    }
}

function showAssignLoadingState() {
    const assignmentsBody = document.getElementById('assignmentsTableBody');
    const unassignedBody = document.getElementById('unassignedVehiclesBody');
    
    if (assignmentsBody) {
        assignmentsBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #636e72;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                    <p style="margin-top: 10px;">Loading assignments...</p>
                </td>
            </tr>
        `;
    }
    
    if (unassignedBody) {
        unassignedBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #636e72;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                    <p style="margin-top: 10px;">Loading vehicles...</p>
                </td>
            </tr>
        `;
    }
}

async function loadADStats() {
    try {
        const response = await fetch(AD_API_ENDPOINTS.getStats);
        const data = await response.json();
        
        if (data.success && data.stats) {
            updateDriverStats(data.stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateDriverStats(stats) {
    const elements = {
        'statTotalDrivers': stats.total_drivers || 0,
        'statAvailableDrivers': stats.available || 0,
        'statAssignedDrivers': stats.assigned || 0,
        'statOnLeave': stats.on_leave || 0
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
}

async function loadAssignments() {
    try {
        let response = await fetch(AD_API_ENDPOINTS.getAssignments);
        let data = await response.json();
        
        if (data.success && data.assignments) {
            updateAssignmentsTable(data.assignments);
        } else {
            updateAssignmentsTable([]);
        }
    } catch (error) {
        console.error('Error loading assignments:', error);
        updateAssignmentsTable([]);
    }
}

async function loadUnassignedVehicles() {
    try {
        const response = await fetch(AD_API_ENDPOINTS.getUnassignedVehicles);
        const data = await response.json();
        
        if (data.success && data.vehicles) {
            updateUnassignedVehiclesTable(data.vehicles);
        } else {
            updateUnassignedVehiclesTable([]);
        }
    } catch (error) {
        console.error('Error loading unassigned vehicles:', error);
        updateUnassignedVehiclesTable([]);
    }
}

function updateAssignmentsTable(assignments) {
    const tbody = document.getElementById('assignmentsTableBody');
    if (!tbody) return;
    
    if (!assignments || assignments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #636e72;">
                    <i class="fas fa-user-slash" style="font-size: 32px; margin-bottom: 10px; display: block; color: #bdc3c7;"></i>
                    No active assignments. Assign drivers to vehicles below.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = assignments.map(a => {
        const driverName = a.driver_name || (a.first_name + ' ' + a.last_name);
        const assignmentId = a.assignment_id || a.id;
        
        return `
            <tr>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-weight: 600; color: #2c3e50;">${escapeHtml(a.plate_number)}</span>
                        <span style="font-size: 0.85rem; color: #7f8c8d;">${escapeHtml(a.model_number || 'N/A')}</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-weight: 600; color: #2c3e50;">${escapeHtml(driverName)}</span>
                        <span style="font-size: 0.85rem; color: #7f8c8d;">${escapeHtml(a.license_number)}</span>
                    </div>
                </td>
                <td style="color: #7f8c8d;">${formatDate(a.assigned_date || a.assigned_at)}</td>
                <td>
                    <button class="js-btn js-btn-danger" onclick="unassignDriver(${assignmentId}, '${escapeHtml(a.plate_number)}', '${escapeHtml(driverName)}')">
                        <i class="fas fa-times"></i> Unassign
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateUnassignedVehiclesTable(vehicles) {
    const tbody = document.getElementById('unassignedVehiclesBody');
    if (!tbody) return;
    
    if (!vehicles || vehicles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #27ae60;">
                    <i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                    All vehicles are assigned! Great job!
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = vehicles.map(v => {
        return `
            <tr>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 3px;">
                        <span style="font-weight: 600; color: #2c3e50;">${escapeHtml(v.plate_number)}</span>
                        <span style="font-size: 0.85rem; color: #7f8c8d;">${escapeHtml(v.model_number || 'N/A')}</span>
                    </div>
                </td>
                <td>
                    <span style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
                        ${v.passenger_capacity || 'N/A'} seats
                    </span>
                </td>
                <td>
                    <button class="js-btn js-btn-primary" onclick="openAssignModal(${v.id}, '${escapeHtml(v.plate_number)}')">
                        <i class="fas fa-user-plus"></i> Assign Driver
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * ✅ FIXED: Now fetches only AVAILABLE drivers (d_status = 'available' AND not assigned)
 * ✅ FIXED: Removed duplicate "Select a driver" option
 * ✅ FIXED: Shows clear message when no drivers available
 */
async function openAssignModal(vehicleId, plateNumber) {
    console.log('Opening assign modal for vehicle:', vehicleId, plateNumber);
    
    const modal = document.getElementById('assignModalOverlay');
    const vehicleInput = document.getElementById('assignVehicleId');
    const vehicleDisplay = document.getElementById('assignVehicleDisplay');
    const driverSelect = document.getElementById('assignDriverSelect');
    
    if (!modal) {
        console.error('Assign modal not found');
        alert('Modal not found. Please refresh the page.');
        return;
    }
    
    if (vehicleInput) vehicleInput.value = vehicleId;
    if (vehicleDisplay) vehicleDisplay.value = plateNumber;
    
    const notesField = document.getElementById('assignNotes');
    if (notesField) notesField.value = '';
    
    if (driverSelect) {
        driverSelect.innerHTML = '<option value="">Loading drivers...</option>';
        driverSelect.disabled = true;
    }
    
    modal.style.display = 'flex';
    
    try {
        // ✅ CHANGED: Now fetches only available drivers
        const response = await fetch(AD_API_ENDPOINTS.getAvailableDrivers);
        const data = await response.json();
        
        console.log('🔍 Available Drivers API response:', data);
        
        if (data.success && data.data) {
            console.log(`📊 Available drivers: ${data.data.length}`);
            
            if (data.data.length > 0) {
                // ✅ FIXED: Only one placeholder, all drivers are guaranteed to be available
                driverSelect.innerHTML = '<option value="">-- Select a driver --</option>' +
                    data.data.map(d => {
                        const name = d.full_name || (d.first_name + ' ' + d.last_name);
                        return `<option value="${d.id}">${escapeHtml(name)} - ${escapeHtml(d.license_number)}</option>`;
                    }).join('');
                
                driverSelect.disabled = false;
                console.log(`✅ ${data.data.length} available drivers loaded`);
            } else {
                // ✅ FIXED: Clear message when no drivers available
                driverSelect.innerHTML = '<option value="">No available drivers</option>';
                driverSelect.disabled = true;
                console.warn('⚠️ No available drivers found');
                showAssignAlert('No available drivers. Drivers are either assigned, suspended, or on leave. Check driver statuses in Driver Management.', 'warning');
            }
        } else {
            driverSelect.innerHTML = '<option value="">Error loading drivers</option>';
            driverSelect.disabled = true;
            console.error('❌ API returned error:', data.error || data.message);
            showAssignAlert('Failed to load drivers', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading drivers:', error);
        driverSelect.innerHTML = '<option value="">Error loading drivers</option>';
        driverSelect.disabled = true;
        showAssignAlert('Error: ' + error.message, 'error');
    }
}

function closeAssignModal() {
    const modal = document.getElementById('assignModalOverlay');
    if (modal) modal.style.display = 'none';
}

function closeAssignModalOutside(event) {
    if (event.target.id === 'assignModalOverlay') {
        closeAssignModal();
    }
}

async function submitAssignment() {
    const vehicleId = document.getElementById('assignVehicleId')?.value;
    const driverId = document.getElementById('assignDriverSelect')?.value;
    const notes = document.getElementById('assignNotes')?.value || '';
    
    if (!driverId) {
        showAssignAlert('Please select a driver', 'warning');
        return;
    }
    
    console.log('Submitting assignment:', { vehicleId, driverId, notes });
    showAssignAlert('Assigning driver...', 'info');
    
    try {
        const response = await fetch(AD_API_ENDPOINTS.assignDriver, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vehicle_id: parseInt(vehicleId),
                driver_id: parseInt(driverId),
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAssignAlert(data.message || 'Driver assigned successfully!', 'success');
            closeAssignModal();
            loadAssignDriverData();
        } else {
            showAssignAlert('Error: ' + (data.message || data.error), 'error');
        }
    } catch (error) {
        console.error('Error assigning driver:', error);
        showAssignAlert('Network error: ' + error.message, 'error');
    }
}

async function unassignDriver(assignmentId, vehiclePlate, driverName) {
    if (!confirm(`Unassign ${driverName} from ${vehiclePlate}?`)) {
        return;
    }
    
    console.log('Unassigning:', assignmentId);
    showAssignAlert('Unassigning driver...', 'info');
    
    try {
        const response = await fetch(AD_API_ENDPOINTS.unassignDriver, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignment_id: parseInt(assignmentId) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAssignAlert(data.message || 'Driver unassigned successfully!', 'success');
            loadAssignDriverData();
        } else {
            showAssignAlert('Error: ' + (data.message || data.error), 'error');
        }
    } catch (error) {
        console.error('Error unassigning driver:', error);
        showAssignAlert('Network error: ' + error.message, 'error');
    }
}

function openAddDriverModal() {
    const modal = document.getElementById('addDriverModalOverlay');
    if (!modal) {
        alert('Add driver modal not found.');
        return;
    }
    
    const fields = ['driverFirstName', 'driverLastName', 'driverLicense', 'driverPhone', 'driverEmail'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const hiredField = document.getElementById('driverHired');
    if (hiredField) hiredField.value = new Date().toISOString().split('T')[0];
    
    modal.style.display = 'flex';
}

function closeAddDriverModal() {
    const modal = document.getElementById('addDriverModalOverlay');
    if (modal) modal.style.display = 'none';
}

function closeAddDriverModalOutside(event) {
    if (event.target.id === 'addDriverModalOverlay') {
        closeAddDriverModal();
    }
}

async function submitAddDriver() {
    const firstName = document.getElementById('driverFirstName')?.value.trim();
    const lastName = document.getElementById('driverLastName')?.value.trim();
    const license = document.getElementById('driverLicense')?.value.trim();
    const phone = document.getElementById('driverPhone')?.value.trim();
    const email = document.getElementById('driverEmail')?.value.trim();
    const hired = document.getElementById('driverHired')?.value;
    
    if (!firstName || !lastName || !license) {
        showAssignAlert('Please fill in required fields (First Name, Last Name, License)', 'warning');
        return;
    }
    
    console.log('Adding driver:', { firstName, lastName, license });
    showAssignAlert('Adding driver...', 'info');
    
    try {
        const response = await fetch(AD_API_ENDPOINTS.addDriver, {
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
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAssignAlert(data.message || 'Driver added successfully!', 'success');
            closeAddDriverModal();
            loadAssignDriverData();
        } else {
            showAssignAlert('Error: ' + (data.message || data.error), 'error');
        }
    } catch (error) {
        console.error('Error adding driver:', error);
        showAssignAlert('Network error: ' + error.message, 'error');
    }
}

function showEmptyState() {
    const assignmentsBody = document.getElementById('assignmentsTableBody');
    const unassignedBody = document.getElementById('unassignedVehiclesBody');
    
    if (assignmentsBody) {
        assignmentsBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                    Failed to load assignments. Please refresh the page.
                </td>
            </tr>
        `;
    }
    
    if (unassignedBody) {
        unassignedBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 10px; display: block;"></i>
                    Failed to load vehicles. Please refresh the page.
                </td>
            </tr>
        `;
    }
}

function showAssignAlert(message, type = 'info') {
    document.querySelectorAll('.assign-alert').forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'assign-alert';
    
    const colors = {
        success: { bg: '#d4edda', border: '#28a745', text: '#155724', icon: 'check-circle' },
        error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24', icon: 'exclamation-circle' },
        warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404', icon: 'exclamation-triangle' },
        info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460', icon: 'info-circle' }
    };
    
    const style = colors[type] || colors.info;
    
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background: ${style.bg};
        border-left: 4px solid ${style.border};
        color: ${style.text};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    
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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

if (!document.getElementById('assign-driver-animations')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'assign-driver-animations';
    styleSheet.textContent = `
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        .js-btn-danger {
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s ease;
        }
        
        .js-btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
        }
    `;
    document.head.appendChild(styleSheet);
}

window.initAssignDriverPage = initAssignDriverPage;
window.loadAssignDriverData = loadAssignDriverData;
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.closeAssignModalOutside = closeAssignModalOutside;
window.submitAssignment = submitAssignment;
window.unassignDriver = unassignDriver;
window.openAddDriverModal = openAddDriverModal;
window.closeAddDriverModal = closeAddDriverModal;
window.closeAddDriverModalOutside = closeAddDriverModalOutside;
window.submitAddDriver = submitAddDriver;

console.log('✅ Assign Driver JS loaded - FIXED VERSION (no duplicate options, only available drivers)');