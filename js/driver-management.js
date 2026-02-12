/**
 * ECOBEEP - Driver Management Module (DIAGNOSTIC VERSION)
 * This version has extensive console logging to help diagnose button issues
 */

// API Configuration
const DM_API_BASE = '../php/';
const DM_API_ENDPOINTS = {
    getAllDrivers: DM_API_BASE + 'driver-management-api.php?action=get_all_drivers',
    addDriver: DM_API_BASE + 'driver-management-api.php?action=add_driver',
    assignVehicle: DM_API_BASE + 'assign-driver-api.php?action=assign_driver',
    unassignDriver: DM_API_BASE + 'assign-driver-api.php?action=unassign_driver',
    suspendDriver: DM_API_BASE + 'driver-management-api.php?action=suspend_driver',
    reactivateDriver: DM_API_BASE + 'driver-management-api.php?action=reactivate_driver',
    setOnLeave: DM_API_BASE + 'driver-management-api.php?action=set_on_leave',
    returnFromLeave: DM_API_BASE + 'driver-management-api.php?action=return_from_leave',
    terminateDriver: DM_API_BASE + 'driver-management-api.php?action=terminate_driver',
    getArchivedDrivers: DM_API_BASE + 'driver-management-api.php?action=get_archived_drivers',
    getAvailableVehicles: DM_API_BASE + 'get-unassigned-vehicles.php',
    getStats: DM_API_BASE + 'driver-management-api.php?action=get_stats'
};

// State Management
let dmAllDrivers = [];
let dmCurrentFilter = 'all';

console.log('🚀 Driver Management JS loaded - DIAGNOSTIC VERSION');

// Initialize when Driver Management page is loaded
function initDriverManagement() {
    console.log('✅ Initializing Driver Management...');
    loadDriverManagementData();
}

// Load all driver management data
async function loadDriverManagementData() {
    try {
        console.log('📊 Loading driver management data...');
        showDMLoading();
        
        await Promise.all([
            loadDMStats(),
            loadAllDrivers()
        ]);
        
        console.log('✅ Driver Management data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading driver management data:', error);
        showDMMessage('Failed to load data. Please refresh the page.', 'error');
    }
}

// Load statistics
async function loadDMStats() {
    try {
        const response = await fetch(DM_API_ENDPOINTS.getStats);
        const data = await response.json();
        
        if (data.success) {
            updateDMStats(data.stats);
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Update statistics display
function updateDMStats(stats) {
    document.getElementById('dmStatTotalDrivers').textContent = stats.total_drivers || 0;
    document.getElementById('dmStatAvailable').textContent = stats.available || 0;
    document.getElementById('dmStatAssigned').textContent = stats.assigned || 0;
    document.getElementById('dmStatSuspended').textContent = stats.suspended || 0;
    
    document.getElementById('dmTotalVehicles').textContent = stats.total_vehicles || 0;
    document.getElementById('dmAssignedVehicles').textContent = stats.vehicles_assigned || 0;
    document.getElementById('dmAvailableVehicles').textContent = stats.vehicles_unassigned || 0;
}

// Load all drivers
async function loadAllDrivers() {
    try {
        console.log('📥 Fetching drivers from API...');
        const response = await fetch(DM_API_ENDPOINTS.getAllDrivers);
        const data = await response.json();
        
        console.log('📦 API Response:', data);
        
        if (data.success) {
            dmAllDrivers = data.drivers || [];
            console.log(`👥 Total drivers loaded: ${dmAllDrivers.length}`);
            
            // Log first driver for debugging
            if (dmAllDrivers.length > 0) {
                console.log('🔍 First driver data:', dmAllDrivers[0]);
            }
            
            displayDrivers(dmAllDrivers);
        } else {
            console.error('❌ API returned error:', data.error);
            displayEmptyState();
        }
    } catch (error) {
        console.error('❌ Error fetching drivers:', error);
        displayEmptyState();
    }
}

// Display drivers in table
function displayDrivers(drivers) {
    console.log('🎨 Displaying drivers in table...');
    const tbody = document.getElementById('driverMgmtTableBody');
    
    if (!tbody) {
        console.error('❌ ERROR: driverMgmtTableBody not found in DOM!');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (drivers.length === 0) {
        console.log('⚠️ No drivers to display');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="dm-empty-state">
                    <i class="fas fa-users"></i>
                    <p>No drivers found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    console.log(`✏️ Creating rows for ${drivers.length} drivers...`);
    drivers.forEach((driver, index) => {
        console.log(`Creating row ${index + 1} for driver:`, driver.first_name, driver.last_name);
        const row = createDriverRow(driver);
        tbody.appendChild(row);
    });
    console.log('✅ All driver rows created');
}

// Create driver table row
function createDriverRow(driver) {
    const tr = document.createElement('tr');
    
    const driverName = driver.full_name || `${driver.first_name} ${driver.last_name}`;
    
    // Determine status
    const dbStatus = (driver.status || 'available').toLowerCase();
    const hasAssignment = driver.assignment_id !== null;
    const actualStatus = (dbStatus === 'available' && hasAssignment) ? 'assigned' : dbStatus;
    
    console.log(`🏷️ Driver ${driverName}: dbStatus=${dbStatus}, hasAssignment=${hasAssignment}, actualStatus=${actualStatus}`);
    
    const assignmentInfo = driver.assignment_vehicle ? 
        `<div class="dm-assignment-info"><i class="fas fa-bus"></i> ${driver.assignment_vehicle}</div>` : 
        `<div class="dm-no-assignment">Not assigned</div>`;
    
    const dateHired = driver.date_hired ? new Date(driver.date_hired).toLocaleDateString() : 'N/A';
    
    // Get action buttons
    const actionButtons = getDriverActions(driver);
    console.log(`🔘 Buttons for ${driverName}:`, actionButtons.substring(0, 100) + '...');
    
    tr.innerHTML = `
        <td><strong>${driverName}</strong></td>
        <td>${driver.license_number || 'N/A'}</td>
        <td>
            ${driver.phone ? `<div><i class="fas fa-phone"></i> ${driver.phone}</div>` : ''}
            ${driver.email ? `<div style="font-size: 12px; color: #6b7280;"><i class="fas fa-envelope"></i> ${driver.email}</div>` : ''}
        </td>
        <td><span class="dm-status-badge ${actualStatus}">${getStatusLabel(actualStatus)}</span></td>
        <td>${assignmentInfo}</td>
        <td>${dateHired}</td>
        <td>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                ${actionButtons}
            </div>
        </td>
    `;
    
    return tr;
}

function getStatusLabel(status) {
    const labels = {
        'available': 'Available',
        'assigned': 'Assigned',
        'suspended': 'Suspended',
        'on_leave': 'On Leave',
        'on leave': 'On Leave',
        'leave': 'On Leave',
        'terminated': 'Terminated'
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

// Get action buttons based on driver status
function getDriverActions(driver) {
    const dbStatus = (driver.status || '').toLowerCase();
    const hasAssignment = driver.assignment_id !== null;
    const status = (dbStatus === 'available' && hasAssignment) ? 'assigned' : dbStatus;
    
    console.log(`🔨 Building buttons for status: ${status}, hasAssignment: ${hasAssignment}`);
    
    let buttons = '';
    let buttonCount = 0;
    
    // 🚗 ASSIGN
    if (!hasAssignment && status === 'available') {
        buttons += `<button class="dm-action-btn assign" onclick="openDMAssignVehicleModal(${driver.id}, '${escapeHtml(driver.full_name || driver.first_name + ' ' + driver.last_name)}')">
            <i class="fas fa-bus"></i> Assign
        </button>`;
        buttonCount++;
        console.log('  ✅ Added ASSIGN button');
    }
    
    // ❌ UNASSIGN
    if (hasAssignment) {
        buttons += `<button class="dm-action-btn unassign" onclick="unassignDriverFromVehicle(${driver.assignment_id}, '${escapeHtml(driver.full_name || driver.first_name + ' ' + driver.last_name)}')">
            <i class="fas fa-times"></i> Unassign
        </button>`;
        buttonCount++;
        console.log('  ✅ Added UNASSIGN button');
    }
    
    // 📅 ON LEAVE
    if (status === 'available' || status === 'assigned') {
        buttons += `<button class="dm-action-btn leave" onclick="openDMLeaveModal(${driver.id}, '${escapeHtml(driver.full_name || driver.first_name + ' ' + driver.last_name)}')">
            <i class="fas fa-calendar-times"></i> On Leave
        </button>`;
        buttonCount++;
        console.log('  ✅ Added ON LEAVE button');
    }
    
    // ✅ RETURN
    if (status === 'leave' || status === 'on leave' || status === 'on_leave') {
        buttons += `<button class="dm-action-btn return" onclick="openDMReturnFromLeaveModal(${driver.id}, '${escapeHtml(driver.full_name || driver.first_name + ' ' + driver.last_name)}')">
            <i class="fas fa-user-check"></i> Return
        </button>`;
        buttonCount++;
        console.log('  ✅ Added RETURN button');
    }
    
    // 🔄 REACTIVATE
    if (status === 'suspended') {
        buttons += `<button class="dm-action-btn reactivate" onclick="openDMReactivateModal(${driver.id}, '${escapeHtml(driver.full_name || driver.first_name + ' ' + driver.last_name)}')">
            <i class="fas fa-undo"></i> Reactivate
        </button>`;
        buttonCount++;
        console.log('  ✅ Added REACTIVATE button');
    }
    
    // ⏸️ SUSPEND
    if (status !== 'suspended' && status !== 'terminated' && status !== 'leave' && status !== 'on leave' && status !== 'on_leave') {
        buttons += `<button class="dm-action-btn suspend" onclick="openDMSuspendModal(${driver.id}, '${escapeHtml(driver.full_name || driver.first_name + ' ' + driver.last_name)}')">
            <i class="fas fa-user-clock"></i> Suspend
        </button>`;
        buttonCount++;
        console.log('  ✅ Added SUSPEND button');
    }
    
    // 🚫 TERMINATE
    if (status !== 'terminated') {
        buttons += `<button class="dm-action-btn terminate" onclick="openDMTerminateModal(${driver.id}, '${escapeHtml(driver.full_name || driver.first_name + ' ' + driver.last_name)}')">
            <i class="fas fa-user-times"></i> Terminate
        </button>`;
        buttonCount++;
        console.log('  ✅ Added TERMINATE button');
    }
    
    console.log(`  📊 Total buttons created: ${buttonCount}`);
    
    if (buttonCount === 0) {
        console.warn('  ⚠️ WARNING: No buttons were created for this driver!');
    }
    
    return buttons;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Filter drivers by status
function filterDriversByStatus(status) {
    console.log(`🔍 Filtering by status: ${status}`);
    dmCurrentFilter = status;
    
    document.querySelectorAll('.js-filter-pill').forEach(pill => {
        pill.classList.remove('active');
        if (pill.getAttribute('data-status') === status) {
            pill.classList.add('active');
        }
    });
    
    let filteredDrivers = dmAllDrivers;
    
    if (status !== 'all') {
        filteredDrivers = dmAllDrivers.filter(driver => {
            const dbStatus = (driver.status || '').toLowerCase();
            const hasAssignment = driver.assignment_id !== null;
            const actualStatus = (dbStatus === 'available' && hasAssignment) ? 'assigned' : dbStatus;
            const filterStatus = status.toLowerCase();
            
            if (filterStatus === 'leave') {
                return actualStatus.includes('leave');
            }
            
            return actualStatus === filterStatus;
        });
    }
    
    console.log(`✅ Filtered to ${filteredDrivers.length} drivers`);
    displayDrivers(filteredDrivers);
}

// Filter drivers by search
function filterDriversTable() {
    const searchInput = document.getElementById('driverMgmtSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    console.log(`🔍 Searching for: "${searchTerm}"`);
    
    let filteredDrivers = dmAllDrivers;
    
    if (dmCurrentFilter !== 'all') {
        filteredDrivers = filteredDrivers.filter(driver => {
            const dbStatus = (driver.status || '').toLowerCase();
            const hasAssignment = driver.assignment_id !== null;
            const actualStatus = (dbStatus === 'available' && hasAssignment) ? 'assigned' : dbStatus;
            
            return actualStatus === dmCurrentFilter || 
                   (dmCurrentFilter === 'leave' && actualStatus.includes('leave'));
        });
    }
    
    if (searchTerm) {
        filteredDrivers = filteredDrivers.filter(driver => {
            const driverName = (driver.full_name || `${driver.first_name} ${driver.last_name}`).toLowerCase();
            const license = (driver.license_number || '').toLowerCase();
            const phone = (driver.phone || '').toLowerCase();
            const email = (driver.email || '').toLowerCase();
            
            return driverName.includes(searchTerm) ||
                   license.includes(searchTerm) ||
                   phone.includes(searchTerm) ||
                   email.includes(searchTerm);
        });
    }
    
    displayDrivers(filteredDrivers);
}

// ========== MODAL FUNCTIONS (Placeholder - Your originals) ==========

function openAddDriverModalDM() {
    document.getElementById('addDriverDMModalOverlay').style.display = 'flex';
    document.getElementById('dmDriverFirstName').value = '';
    document.getElementById('dmDriverLastName').value = '';
    document.getElementById('dmDriverLicense').value = '';
    document.getElementById('dmDriverPhone').value = '';
    document.getElementById('dmDriverEmail').value = '';
    document.getElementById('dmDriverAddress').value = '';
    document.getElementById('dmDriverEmergency').value = '';
    document.getElementById('dmDriverHired').value = '';
}

function closeAddDriverDMModal() {
    document.getElementById('addDriverDMModalOverlay').style.display = 'none';
}

function closeAddDriverDMModalOutside(event) {
    if (event.target.id === 'addDriverDMModalOverlay') {
        closeAddDriverDMModal();
    }
}

async function submitAddDriverDM() {
    const firstName = document.getElementById('dmDriverFirstName').value.trim();
    const lastName = document.getElementById('dmDriverLastName').value.trim();
    const license = document.getElementById('dmDriverLicense').value.trim();
    const phone = document.getElementById('dmDriverPhone').value.trim();
    const email = document.getElementById('dmDriverEmail').value.trim();
    const address = document.getElementById('dmDriverAddress').value.trim();
    const emergency = document.getElementById('dmDriverEmergency').value.trim();
    const hired = document.getElementById('dmDriverHired').value;
    
    if (!firstName || !lastName || !license) {
        showDMMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.addDriver, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                license_number: license,
                phone: phone,
                email: email,
                address: address,
                emergency_contact: emergency,
                date_hired: hired
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDMMessage(data.message || 'Driver added successfully!', 'success');
            closeAddDriverDMModal();
            loadDriverManagementData();
        } else {
            showDMMessage(data.message || 'Failed to add driver', 'error');
        }
    } catch (error) {
        console.error('Error adding driver:', error);
        showDMMessage('Failed to add driver. Please try again.', 'error');
    }
}

async function openDMAssignVehicleModal(driverId, driverName) {
    console.log(`🚗 Opening assign modal for driver ${driverId}: ${driverName}`);
    document.getElementById('dmAssignDriverId').value = driverId;
    document.getElementById('dmAssignDriverDisplay').value = driverName;
    document.getElementById('dmAssignNotes').value = '';
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.getAvailableVehicles);
        const data = await response.json();
        
        const select = document.getElementById('dmAssignVehicleSelect');
        select.innerHTML = '<option value="">-- Select a vehicle --</option>';
        
        if (data.success && data.vehicles && data.vehicles.length > 0) {
            data.vehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.plate_number} (${vehicle.passenger_capacity} seats)`;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = '<option value="">No available vehicles</option>';
        }
    } catch (error) {
        console.error('Error loading vehicles:', error);
    }
    
    document.getElementById('dmAssignVehicleModalOverlay').style.display = 'flex';
}

function closeDMAssignVehicleModal() {
    document.getElementById('dmAssignVehicleModalOverlay').style.display = 'none';
}

function closeDMAssignVehicleModalOutside(event) {
    if (event.target.id === 'dmAssignVehicleModalOverlay') {
        closeDMAssignVehicleModal();
    }
}

async function submitDMAssignVehicle() {
    const driverId = document.getElementById('dmAssignDriverId').value;
    const vehicleId = document.getElementById('dmAssignVehicleSelect').value;
    const notes = document.getElementById('dmAssignNotes').value;
    
    if (!vehicleId) {
        showDMMessage('Please select a vehicle', 'error');
        return;
    }
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.assignVehicle, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driver_id: parseInt(driverId),
                vehicle_id: parseInt(vehicleId),
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDMMessage(data.message || 'Vehicle assigned successfully!', 'success');
            closeDMAssignVehicleModal();
            loadDriverManagementData();
        } else {
            showDMMessage(data.message || 'Failed to assign vehicle', 'error');
        }
    } catch (error) {
        console.error('Error assigning vehicle:', error);
        showDMMessage('Failed to assign vehicle. Please try again.', 'error');
    }
}

async function unassignDriverFromVehicle(assignmentId, driverName) {
    console.log(`❌ Unassigning driver ${driverName}, assignment ${assignmentId}`);
    if (!confirm(`Are you sure you want to unassign ${driverName} from their vehicle?`)) {
        return;
    }
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.unassignDriver, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignment_id: parseInt(assignmentId) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDMMessage(data.message || 'Driver unassigned successfully!', 'success');
            loadDriverManagementData();
        } else {
            showDMMessage(data.message || 'Failed to unassign driver', 'error');
        }
    } catch (error) {
        console.error('Error unassigning driver:', error);
        showDMMessage('Failed to unassign driver. Please try again.', 'error');
    }
}

function openDMSuspendModal(driverId, driverName) {
    console.log(`⏸️ Opening suspend modal for ${driverName}`);
    document.getElementById('dmSuspendDriverId').value = driverId;
    document.getElementById('dmSuspendDriverDisplay').value = driverName;
    document.getElementById('dmSuspendReason').value = '';
    document.getElementById('dmSuspendNotes').value = '';
    document.getElementById('dmSuspendDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('dmSuspendModalOverlay').style.display = 'flex';
}

function closeDMSuspendModal() {
    document.getElementById('dmSuspendModalOverlay').style.display = 'none';
}

function closeDMSuspendModalOutside(event) {
    if (event.target.id === 'dmSuspendModalOverlay') {
        closeDMSuspendModal();
    }
}

async function submitSuspendDriver() {
    const driverId = document.getElementById('dmSuspendDriverId').value;
    const reason = document.getElementById('dmSuspendReason').value;
    const notes = document.getElementById('dmSuspendNotes').value.trim();
    const date = document.getElementById('dmSuspendDate').value;
    
    if (!reason || !notes) {
        showDMMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.suspendDriver, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driver_id: parseInt(driverId),
                reason: reason,
                notes: notes,
                suspension_date: date
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDMMessage(data.message || 'Driver suspended successfully', 'success');
            closeDMSuspendModal();
            loadDriverManagementData();
        } else {
            showDMMessage(data.message || 'Failed to suspend driver', 'error');
        }
    } catch (error) {
        console.error('Error suspending driver:', error);
        showDMMessage('Failed to suspend driver. Please try again.', 'error');
    }
}

function openDMReactivateModal(driverId, driverName) {
    console.log(`🔄 Opening reactivate modal for ${driverName}`);
    document.getElementById('dmReactivateDriverId').value = driverId;
    document.getElementById('dmReactivateDriverDisplay').value = driverName;
    document.getElementById('dmReactivateNotes').value = '';
    document.getElementById('dmReactivateDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('dmReactivateModalOverlay').style.display = 'flex';
}

function closeDMReactivateModal() {
    document.getElementById('dmReactivateModalOverlay').style.display = 'none';
}

function closeDMReactivateModalOutside(event) {
    if (event.target.id === 'dmReactivateModalOverlay') {
        closeDMReactivateModal();
    }
}

async function submitReactivateDriver() {
    const driverId = document.getElementById('dmReactivateDriverId').value;
    const reactivateDate = document.getElementById('dmReactivateDate').value;
    const notes = document.getElementById('dmReactivateNotes').value.trim();
    
    if (!reactivateDate) {
        showDMMessage('Please select a reactivation date', 'error');
        return;
    }
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.reactivateDriver, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driver_id: parseInt(driverId),
                reactivation_date: reactivateDate,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDMMessage(data.message || 'Driver reactivated successfully', 'success');
            closeDMReactivateModal();
            loadDriverManagementData();
        } else {
            showDMMessage(data.message || 'Failed to reactivate driver', 'error');
        }
    } catch (error) {
        console.error('Error reactivating driver:', error);
        showDMMessage('Failed to reactivate driver. Please try again.', 'error');
    }
}

function openDMTerminateModal(driverId, driverName) {
    console.log(`🚫 Opening terminate modal for ${driverName}`);
    document.getElementById('dmTerminateDriverId').value = driverId;
    document.getElementById('dmTerminateDriverDisplay').value = driverName;
    document.getElementById('dmTerminateReason').value = '';
    document.getElementById('dmTerminateNotes').value = '';
    document.getElementById('dmTerminateDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('dmTerminateModalOverlay').style.display = 'flex';
}

function closeDMTerminateModal() {
    document.getElementById('dmTerminateModalOverlay').style.display = 'none';
}

function closeDMTerminateModalOutside(event) {
    if (event.target.id === 'dmTerminateModalOverlay') {
        closeDMTerminateModal();
    }
}

async function submitTerminateDriver() {
    const driverId = document.getElementById('dmTerminateDriverId').value;
    const reason = document.getElementById('dmTerminateReason').value;
    const notes = document.getElementById('dmTerminateNotes').value.trim();
    const date = document.getElementById('dmTerminateDate').value;
    
    if (!reason || !notes) {
        showDMMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to terminate this driver? This action will archive the driver and cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.terminateDriver, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driver_id: parseInt(driverId),
                termination_reason: reason,
                notes: notes,
                termination_date: date
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDMMessage(data.message || 'Driver terminated and archived successfully', 'success');
            closeDMTerminateModal();
            loadDriverManagementData();
        } else {
            showDMMessage(data.message || 'Failed to terminate driver', 'error');
        }
    } catch (error) {
        console.error('Error terminating driver:', error);
        showDMMessage('Failed to terminate driver. Please try again.', 'error');
    }
}

function openDMLeaveModal(driverId, driverName) {
    console.log(`📅 Opening leave modal for ${driverName}`);
    document.getElementById('dmLeaveDriverId').value = driverId;
    document.getElementById('dmLeaveDriverDisplay').value = driverName;
    document.getElementById('dmLeaveType').value = '';
    document.getElementById('dmLeaveStartDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('dmLeaveEndDate').value = '';
    document.getElementById('dmLeaveNotes').value = '';
    document.getElementById('dmLeaveModalOverlay').style.display = 'flex';
}

function closeDMLeaveModal() {
    document.getElementById('dmLeaveModalOverlay').style.display = 'none';
}

function closeDMLeaveModalOutside(event) {
    if (event.target.id === 'dmLeaveModalOverlay') {
        closeDMLeaveModal();
    }
}

async function submitSetOnLeave() {
    const driverId = document.getElementById('dmLeaveDriverId').value;
    const leaveType = document.getElementById('dmLeaveType').value;
    const startDate = document.getElementById('dmLeaveStartDate').value;
    const endDate = document.getElementById('dmLeaveEndDate').value;
    const notes = document.getElementById('dmLeaveNotes').value.trim();
    
    if (!leaveType || !startDate) {
        showDMMessage('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.setOnLeave, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driver_id: parseInt(driverId),
                leave_type: leaveType,
                start_date: startDate,
                end_date: endDate,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDMMessage(data.message || 'Driver set on leave successfully', 'success');
            closeDMLeaveModal();
            loadDriverManagementData();
        } else {
            showDMMessage(data.message || 'Failed to set driver on leave', 'error');
        }
    } catch (error) {
        console.error('Error setting driver on leave:', error);
        showDMMessage('Failed to set driver on leave. Please try again.', 'error');
    }
}

function openDMReturnFromLeaveModal(driverId, driverName) {
    console.log(`✅ Opening return from leave modal for ${driverName}`);
    document.getElementById('dmReturnDriverId').value = driverId;
    document.getElementById('dmReturnDriverDisplay').value = driverName;
    document.getElementById('dmReturnDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('dmReturnNotes').value = '';
    document.getElementById('dmReturnFromLeaveModalOverlay').style.display = 'flex';
}

function closeDMReturnFromLeaveModal() {
    document.getElementById('dmReturnFromLeaveModalOverlay').style.display = 'none';
}

function closeDMReturnFromLeaveModalOutside(event) {
    if (event.target.id === 'dmReturnFromLeaveModalOverlay') {
        closeDMReturnFromLeaveModal();
    }
}

async function submitReturnFromLeave() {
    const driverId = document.getElementById('dmReturnDriverId').value;
    const returnDate = document.getElementById('dmReturnDate').value;
    const notes = document.getElementById('dmReturnNotes').value.trim();
    
    if (!returnDate) {
        showDMMessage('Please select a return date', 'error');
        return;
    }
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.returnFromLeave, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                driver_id: parseInt(driverId),
                return_date: returnDate,
                notes: notes
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDMMessage(data.message || 'Driver returned from leave successfully', 'success');
            closeDMReturnFromLeaveModal();
            loadDriverManagementData();
        } else {
            showDMMessage(data.message || 'Failed to return driver from leave', 'error');
        }
    } catch (error) {
        console.error('Error returning driver from leave:', error);
        showDMMessage('Failed to return driver from leave. Please try again.', 'error');
    }
}

async function viewArchivedDrivers() {
    document.getElementById('dmArchivedModalOverlay').style.display = 'flex';
    
    try {
        const response = await fetch(DM_API_ENDPOINTS.getArchivedDrivers);
        const data = await response.json();
        
        console.log('📦 Archived drivers API response:', data); // Debug log
        
        const tbody = document.getElementById('archivedDriversTableBody');
        tbody.innerHTML = '';
        
        if (data.success && data.archived && data.archived.length > 0) {
            data.archived.forEach(driver => {
                console.log('🔍 Processing archived driver:', driver); // Debug log
                
                const driverName = driver.full_name || `${driver.first_name} ${driver.last_name}`;
                
                // Try multiple possible field names for termination date
                const termDateRaw = driver.terminated_date || driver.termination_date || driver.date_terminated;
                const termDate = termDateRaw ? new Date(termDateRaw).toLocaleDateString() : 'N/A';
                
                // Try multiple possible field names for termination reason
                const reason = driver.termination_reason || driver.terminated_reason || driver.reason || 'N/A';
                
                // Try multiple possible field names for notes
                const notes = driver.notes || driver.termination_notes || driver.details || '-';
                
                tr.innerHTML = `
                    <td><strong>${driverName}</strong></td>
                    <td>${driver.license_number || 'N/A'}</td>
                    <td>${termDate}</td>
                    <td>${reason}</td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${notes}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #9ca3af;">
                        <i class="fas fa-inbox"></i>
                        <p style="margin-top: 10px;">No archived drivers</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading archived drivers:', error);
        document.getElementById('archivedDriversTableBody').innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p style="margin-top: 10px;">Failed to load archived drivers</p>
                </td>
            </tr>
        `;
    }
}
function closeDMArchivedModal() {
    document.getElementById('dmArchivedModalOverlay').style.display = 'none';
}

function closeDMArchivedModalOutside(event) {
    if (event.target.id === 'dmArchivedModalOverlay') {
        closeDMArchivedModal();
    }
}

// ========== UTILITY FUNCTIONS ==========

function showDMLoading() {
    const tbody = document.getElementById('driverMgmtTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="dm-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading drivers...</p>
                </td>
            </tr>
        `;
    }
}

function displayEmptyState() {
    const tbody = document.getElementById('driverMgmtTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="dm-empty-state">
                    <i class="fas fa-users"></i>
                    <p>No drivers found</p>
                    <button class="btn-submit" onclick="openAddDriverModalDM()" style="margin-top: 15px;">
                        <i class="fas fa-user-plus"></i> Add Your First Driver
                    </button>
                </td>
            </tr>
        `;
    }
}

function showDMMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `dm-message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// Auto-initialize when the Driver Management page becomes active
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded, setting up event listeners...');
    const driverMgmtLink = document.querySelector('.nav-link[data-page="driver-mgmt"]');
    if (driverMgmtLink) {
        console.log('✅ Found driver management nav link');
        driverMgmtLink.addEventListener('click', function() {
            console.log('🖱️ Driver Management link clicked');
            setTimeout(() => {
                initDriverManagement();
            }, 100);
        });
    } else {
        console.error('❌ Driver management nav link not found!');
    }
});

// Export functions for global access
window.initDriverManagement = initDriverManagement;
window.filterDriversByStatus = filterDriversByStatus;
window.filterDriversTable = filterDriversTable;
window.openAddDriverModalDM = openAddDriverModalDM;
window.closeAddDriverDMModal = closeAddDriverDMModal;
window.closeAddDriverDMModalOutside = closeAddDriverDMModalOutside;
window.submitAddDriverDM = submitAddDriverDM;
window.openDMAssignVehicleModal = openDMAssignVehicleModal;
window.closeDMAssignVehicleModal = closeDMAssignVehicleModal;
window.closeDMAssignVehicleModalOutside = closeDMAssignVehicleModalOutside;
window.submitDMAssignVehicle = submitDMAssignVehicle;
window.unassignDriverFromVehicle = unassignDriverFromVehicle;
window.openDMSuspendModal = openDMSuspendModal;
window.closeDMSuspendModal = closeDMSuspendModal;
window.closeDMSuspendModalOutside = closeDMSuspendModalOutside;
window.submitSuspendDriver = submitSuspendDriver;
window.openDMReactivateModal = openDMReactivateModal;
window.closeDMReactivateModal = closeDMReactivateModal;
window.closeDMReactivateModalOutside = closeDMReactivateModalOutside;
window.submitReactivateDriver = submitReactivateDriver;
window.openDMTerminateModal = openDMTerminateModal;
window.closeDMTerminateModal = closeDMTerminateModal;
window.closeDMTerminateModalOutside = closeDMTerminateModalOutside;
window.submitTerminateDriver = submitTerminateDriver;
window.openDMLeaveModal = openDMLeaveModal;
window.closeDMLeaveModal = closeDMLeaveModal;
window.closeDMLeaveModalOutside = closeDMLeaveModalOutside;
window.submitSetOnLeave = submitSetOnLeave;
window.openDMReturnFromLeaveModal = openDMReturnFromLeaveModal;
window.closeDMReturnFromLeaveModal = closeDMReturnFromLeaveModal;
window.closeDMReturnFromLeaveModalOutside = closeDMReturnFromLeaveModalOutside;
window.submitReturnFromLeave = submitReturnFromLeave;
window.viewArchivedDrivers = viewArchivedDrivers;
window.closeDMArchivedModal = closeDMArchivedModal;
window.closeDMArchivedModalOutside = closeDMArchivedModalOutside;

console.log('✅ Driver Management JS - DIAGNOSTIC VERSION loaded with extensive logging');