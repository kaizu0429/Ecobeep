// ============================================================
// VEHICLE DETAILS - FIXED VERSION
// ============================================================
// Note: API_URL is defined in script.js - DO NOT redeclare it here

let currentPage = 1;
let vehiclesPerPage = 8;
let allVehicles = [];
let selectedVehicleId = null;

// ============================================================
// Load Vehicles from API
// ============================================================
function loadVehicles(page = 1) {
    console.log('Loading vehicles for page:', page);
    currentPage = page;
    
    // Show loading state
    const vehicleGrid = document.getElementById('vehicleGrid');
    if (vehicleGrid) {
        vehicleGrid.innerHTML = '<div class="loading-msg">Loading vehicles...</div>';
    }
    
    // Use the API_URL from the global scope (defined in script.js)
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : '../php/api.php';
    
    fetch(`${apiUrl}?page=${page}&limit=${vehiclesPerPage}`)
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(json => {
            console.log('Vehicles data received:', json);
            
            // Check if we have data
            if (!json || !json.data) {
                throw new Error('Invalid data format received from API');
            }
            
            allVehicles = json.data;
            
            if (allVehicles.length === 0) {
                vehicleGrid.innerHTML = '<div class="loading-msg" style="color: #64748b;">No vehicles found. Click "Add Vehicle" to get started.</div>';
                return;
            }
            
            // Display vehicles
            displayVehicles(allVehicles);
            
            // Update pagination
            updatePagination(json.total, json.page, json.total_pages);
            
        })
        .catch(error => {
            console.error('Error loading vehicles:', error);
            if (vehicleGrid) {
                vehicleGrid.innerHTML = `
                    <div class="loading-msg" style="color: #ef4444;">
                        Failed to load vehicles. Check your API connection.
                        <br><small>${error.message}</small>
                    </div>
                `;
            }
        });
}

// ============================================================
// Display Vehicles in Grid
// ============================================================
function displayVehicles(vehicles) {
    const vehicleGrid = document.getElementById('vehicleGrid');
    if (!vehicleGrid) {
        console.error('vehicleGrid element not found');
        return;
    }
    
    if (!Array.isArray(vehicles)) {
        console.error('Vehicles is not an array:', vehicles);
        vehicleGrid.innerHTML = '<div class="loading-msg" style="color: #ef4444;">Error: Invalid vehicle data</div>';
        return;
    }
    
    vehicleGrid.innerHTML = '';
    
    vehicles.forEach(vehicle => {
        const card = createVehicleCard(vehicle);
        vehicleGrid.appendChild(card);
    });
}

// ============================================================
// Create Vehicle Card
// ============================================================
function createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.dataset.vehicleId = vehicle.id;
    
    // Determine status badge color
    const statusClass = vehicle.status === 'Registered' ? 'status-registered' : 'status-not-registered';
    
    card.innerHTML = `
        <div class="vehicle-card-header">
            <div class="vehicle-icon">
                <i class="fas fa-bus"></i>
            </div>
            <span class="vehicle-status ${statusClass}">
                ${vehicle.status || 'Unknown'}
            </span>
        </div>
        <div class="vehicle-card-body">
            <div class="vehicle-plate">${vehicle.plate_number || 'N/A'}</div>
            <div class="vehicle-info">
                <div class="info-row">
                    <span class="info-label">Model:</span>
                    <span class="info-value">${vehicle.model_number || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Capacity:</span>
                    <span class="info-value">${vehicle.passenger_capacity || 'N/A'} passengers</span>
                </div>
            </div>
        </div>
        <div class="vehicle-card-footer">
            <button class="btn-view-details" onclick="viewVehicleDetails(${vehicle.id})">
                <i class="fas fa-eye"></i> View Details
            </button>
        </div>
    `;
    
    // Add click handler to select card
    card.addEventListener('click', function(e) {
        // Don't select if clicking the view details button
        if (e.target.closest('.btn-view-details')) return;
        
        selectVehicle(vehicle.id);
    });
    
    return card;
}

// ============================================================
// Select Vehicle
// ============================================================
function selectVehicle(vehicleId) {
    selectedVehicleId = vehicleId;
    
    // Update visual selection
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-vehicle-id="${vehicleId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    console.log('Selected vehicle ID:', vehicleId);
}

// ============================================================
// View Vehicle Details
// ============================================================
function viewVehicleDetails(vehicleId) {
    const vehicle = allVehicles.find(v => v.id == vehicleId);
    
    if (!vehicle) {
        console.error('Vehicle not found:', vehicleId);
        return;
    }
    
    // Populate detail panel
    document.getElementById('detailPlate').textContent = vehicle.plate_number || '—';
    document.getElementById('detailModel').textContent = vehicle.model_number || '—';
    document.getElementById('detailEngine').textContent = vehicle.engine_number || '—';
    document.getElementById('detailCapacity').textContent = vehicle.passenger_capacity ? `${vehicle.passenger_capacity} passengers` : '—';
    document.getElementById('detailOrCr').textContent = vehicle.or_cr || '—';
    document.getElementById('detailStatus').textContent = vehicle.status || '—';
    
    // Show detail overlay
    const overlay = document.getElementById('detailOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

// ============================================================
// Close Detail Panel
// ============================================================
function closeDetailPanel() {
    const overlay = document.getElementById('detailOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function closeDetail(event) {
    if (event.target.id === 'detailOverlay') {
        closeDetailPanel();
    }
}

// ============================================================
// Pagination
// ============================================================
function updatePagination(total, currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => loadVehicles(currentPage - 1);
    pagination.appendChild(prevBtn);
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pagination.appendChild(pageInfo);
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => loadVehicles(currentPage + 1);
    pagination.appendChild(nextBtn);
}

// ============================================================
// Add Vehicle Modal
// ============================================================
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Vehicle';
    document.getElementById('modalSubmitBtn').textContent = 'Add Vehicle';
    document.getElementById('modalId').value = '';
    
    // Clear form
    document.getElementById('formPlate').value = '';
    document.getElementById('formModel').value = '';
    document.getElementById('formEngine').value = '';
    document.getElementById('formCapacity').value = '';
    document.getElementById('formOrCr').value = '';
    document.getElementById('formStatus').value = 'Registered';
    
    document.getElementById('modalOverlay').classList.add('active');
}

// ============================================================
// Edit Vehicle Modal
// ============================================================
function openEditModal() {
    if (!selectedVehicleId) {
        alert('Please select a vehicle to edit');
        return;
    }
    
    const vehicle = allVehicles.find(v => v.id == selectedVehicleId);
    
    if (!vehicle) {
        alert('Vehicle not found');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Edit Vehicle';
    document.getElementById('modalSubmitBtn').textContent = 'Update Vehicle';
    document.getElementById('modalId').value = vehicle.id;
    
    // Populate form
    document.getElementById('formPlate').value = vehicle.plate_number || '';
    document.getElementById('formModel').value = vehicle.model_number || '';
    document.getElementById('formEngine').value = vehicle.engine_number || '';
    document.getElementById('formCapacity').value = vehicle.passenger_capacity || '';
    document.getElementById('formOrCr').value = vehicle.or_cr || '';
    document.getElementById('formStatus').value = vehicle.status || 'Registered';
    
    document.getElementById('modalOverlay').classList.add('active');
}

// ============================================================
// Close Modal
// ============================================================
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function closeModalOutside(event) {
    if (event.target.id === 'modalOverlay') {
        closeModal();
    }
}

// ============================================================
// Submit Form (Add or Edit)
// ============================================================
function submitForm() {
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : '../php/api.php';
    const id = document.getElementById('modalId').value;
    
    const vehicleData = {
        plate_number: document.getElementById('formPlate').value.trim(),
        model_number: document.getElementById('formModel').value.trim(),
        engine_number: document.getElementById('formEngine').value.trim(),
        passenger_capacity: parseInt(document.getElementById('formCapacity').value),
        or_cr: document.getElementById('formOrCr').value.trim(),
        status: document.getElementById('formStatus').value
    };
    
    // Validation
    if (!vehicleData.plate_number || !vehicleData.model_number || !vehicleData.engine_number || 
        !vehicleData.passenger_capacity || !vehicleData.or_cr) {
        alert('Please fill in all required fields');
        return;
    }
    
    const isEdit = id !== '';
    const method = isEdit ? 'PUT' : 'POST';
    
    if (isEdit) {
        vehicleData.id = id;
    }
    
    fetch(apiUrl, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vehicleData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert(data.message || (isEdit ? 'Vehicle updated successfully' : 'Vehicle added successfully'));
        closeModal();
        loadVehicles(currentPage);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to save vehicle. Please try again.');
    });
}

// ============================================================
// Remove Vehicle
// ============================================================
function removeVehicle() {
    if (!selectedVehicleId) {
        alert('Please select a vehicle to remove');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this vehicle?')) {
        return;
    }
    
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : '../php/api.php';
    
    fetch(apiUrl, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: selectedVehicleId })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert(data.message || 'Vehicle deleted successfully');
        selectedVehicleId = null;
        loadVehicles(currentPage);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to delete vehicle. Please try again.');
    });
}

// ============================================================
// Mark as Inactive
// ============================================================
function markInactive() {
    if (!selectedVehicleId) {
        alert('Please select a vehicle to mark as inactive');
        return;
    }
    
    const vehicle = allVehicles.find(v => v.id == selectedVehicleId);
    
    if (!vehicle) {
        alert('Vehicle not found');
        return;
    }
    
    const apiUrl = typeof API_URL !== 'undefined' ? API_URL : '../php/api.php';
    
    const updatedVehicle = {
        id: vehicle.id,
        plate_number: vehicle.plate_number,
        model_number: vehicle.model_number,
        engine_number: vehicle.engine_number,
        passenger_capacity: vehicle.passenger_capacity,
        or_cr: vehicle.or_cr,
        status: 'Not Registered'
    };
    
    fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedVehicle)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Vehicle marked as inactive');
        selectedVehicleId = null;
        loadVehicles(currentPage);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update vehicle status. Please try again.');
    });
}

// ============================================================
// Initialize when DOM is ready
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Vehicle Details script loaded');
    
    // Load vehicles when navigating to vehicle details page
    const vehicleDetailsLink = document.querySelector('[data-page="vehicle-details"]');
    if (vehicleDetailsLink) {
        vehicleDetailsLink.addEventListener('click', function() {
            setTimeout(() => {
                loadVehicles(1);
            }, 100);
        });
    }
    
    // Load vehicles if we're already on the page
    const vehicleDetailsPage = document.getElementById('page-vehicle-details');
    if (vehicleDetailsPage && vehicleDetailsPage.classList.contains('active')) {
        loadVehicles(1);
    }
});

console.log('vehicle-details.js loaded successfully');