// VEHICLE DETAILS PAGE FUNCTIONALITY
// Updated to work with existing API
// ========================================

const API_URL = '../php/api-vehicles.php';
let vehiclesData = [];
let currentPage = 1;
const itemsPerPage = 6;
let selectedVehicleId = null;

// ========================================
// LOAD VEHICLES ON PAGE LOAD
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const vehicleDetailsLinks = document.querySelectorAll('.nav-link[data-page="vehicle-details"]');
    vehicleDetailsLinks.forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(loadVehicles, 100);
        });
    });
    
    const vehicleDetailsPage = document.getElementById('page-vehicle-details');
    if (vehicleDetailsPage && vehicleDetailsPage.classList.contains('active')) {
        loadVehicles();
    }
});

// ========================================
// LOAD VEHICLES FROM DATABASE
// ========================================
function loadVehicles() {
    // Get all vehicles (no pagination limit in API call)
    fetch(`${API_URL}?limit=1000`)
        .then(res => res.json())
        .then(data => {
            if (data.data) {
                vehiclesData = data.data;
                renderVehicles();
                renderPagination();
            } else {
                showError('Failed to load vehicles');
            }
        })
        .catch(err => {
            console.error('Error loading vehicles:', err);
            showError('Error connecting to server');
        });
}

// ========================================
// RENDER VEHICLES GRID
// ========================================
function renderVehicles() {
    const grid = document.getElementById('vehicleGrid');
    if (!grid) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageVehicles = vehiclesData.slice(start, end);

    if (pageVehicles.length === 0) {
        grid.innerHTML = '<div class="loading-msg">No vehicles found</div>';
        return;
    }

    grid.innerHTML = pageVehicles.map(vehicle => `
        <div class="vehicle-card" data-id="${vehicle.id}" onclick="selectVehicleCard(${vehicle.id})">
            <div class="vehicle-plate">${vehicle.plate_number}</div>
            <div class="vehicle-info">
                <i class="fas fa-user-slash" style="color: #95a5a6;"></i>
                <span style="color: #7f8c8d; font-style: italic;">No driver assigned</span>
            </div>
            <div class="vehicle-status">
                <span class="status-badge ${vehicle.status === 'Registered' ? 'status-registered' : 'status-not-registered'}">
                    ${vehicle.status}
                </span>
            </div>
            <button class="btn-available" onclick="event.stopPropagation(); viewVehicleDetails(${vehicle.id})">
                <i class="fas fa-circle" style="margin-right: 5px;"></i>
                AVAILABLE
            </button>
        </div>
    `).join('');
}

// ========================================
// SELECT VEHICLE CARD
// ========================================
function selectVehicleCard(vehicleId) {
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`.vehicle-card[data-id="${vehicleId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedVehicleId = vehicleId;
        viewVehicleDetails(vehicleId);
    }
}

// ========================================
// VIEW VEHICLE DETAILS
// ========================================
function viewVehicleDetails(id) {
    const vehicle = vehiclesData.find(v => v.id === id);
    if (!vehicle) return;

    document.getElementById('detailPlate').textContent = vehicle.plate_number;
    document.getElementById('detailModel').textContent = vehicle.model_number || '—';
    document.getElementById('detailEngine').textContent = vehicle.engine_number || '—';
    document.getElementById('detailCapacity').textContent = vehicle.passenger_capacity || '—';
    document.getElementById('detailOrCr').textContent = vehicle.or_cr || '—';
    document.getElementById('detailStatus').textContent = vehicle.status;

    document.getElementById('detailOverlay').style.display = 'flex';
}

// ========================================
// CLOSE DETAIL PANEL
// ========================================
function closeDetail(event) {
    if (event.target.id === 'detailOverlay') {
        closeDetailPanel();
    }
}

function closeDetailPanel() {
    document.getElementById('detailOverlay').style.display = 'none';
}

// ========================================
// PAGINATION
// ========================================
function renderPagination() {
    const totalPages = Math.ceil(vehiclesData.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let html = '';
    
    html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} 
             onclick="changePage(${currentPage - 1})">
             <i class="fas fa-chevron-left"></i>
             </button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                 onclick="changePage(${i})">${i}</button>`;
    }
    
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} 
             onclick="changePage(${currentPage + 1})">
             <i class="fas fa-chevron-right"></i>
             </button>`;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(vehiclesData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    selectedVehicleId = null;
    renderVehicles();
    renderPagination();
}

// ========================================
// OPEN ADD MODAL
// ========================================
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Vehicle';
    document.getElementById('modalSubmitBtn').textContent = 'Add Vehicle';
    document.getElementById('modalId').value = '';
    
    document.getElementById('formPlate').value = '';
    document.getElementById('formModel').value = '';
    document.getElementById('formEngine').value = '';
    document.getElementById('formCapacity').value = '';
    document.getElementById('formOrCr').value = '';
    document.getElementById('formStatus').value = 'Registered';
    
    document.getElementById('modalOverlay').style.display = 'flex';
}

// ========================================
// OPEN EDIT MODAL
// ========================================
function openEditModal() {
    if (!selectedVehicleId) {
        alert('Please select a vehicle first!');
        return;
    }
    
    const vehicle = vehiclesData.find(v => v.id === selectedVehicleId);
    if (!vehicle) {
        alert('Vehicle not found!');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Edit Vehicle';
    document.getElementById('modalSubmitBtn').textContent = 'Save Changes';
    document.getElementById('modalId').value = vehicle.id;
    
    document.getElementById('formPlate').value = vehicle.plate_number;
    document.getElementById('formModel').value = vehicle.model_number || '';
    document.getElementById('formEngine').value = vehicle.engine_number || '';
    document.getElementById('formCapacity').value = vehicle.passenger_capacity || '';
    document.getElementById('formOrCr').value = vehicle.or_cr || '';
    document.getElementById('formStatus').value = vehicle.status;
    
    document.getElementById('modalOverlay').style.display = 'flex';
}

// ========================================
// CLOSE MODAL
// ========================================
function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function closeModalOutside(event) {
    if (event.target.id === 'modalOverlay') {
        closeModal();
    }
}

// ========================================
// SUBMIT FORM (ADD/EDIT)
// ========================================
function submitForm() {
    const id = document.getElementById('modalId').value;
    const plateNumber = document.getElementById('formPlate').value.trim();
    const modelNumber = document.getElementById('formModel').value.trim();
    const engineNumber = document.getElementById('formEngine').value.trim();
    const passengerCapacity = document.getElementById('formCapacity').value.trim();
    const orCr = document.getElementById('formOrCr').value.trim();
    const status = document.getElementById('formStatus').value;
    
    // Validation
    if (!plateNumber || !modelNumber || !engineNumber || !passengerCapacity || !orCr) {
        alert('All fields are required!');
        return;
    }
    
    const data = {
        plate_number: plateNumber,
        model_number: modelNumber,
        engine_number: engineNumber,
        passenger_capacity: parseInt(passengerCapacity),
        or_cr: orCr,
        status: status
    };
    
    if (id) {
        // Update existing vehicle
        data.id = parseInt(id);
        
        fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                alert('Vehicle updated successfully!');
                closeModal();
                loadVehicles();
                selectedVehicleId = null;
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('Error:', err);
            alert('Error connecting to server');
        });
    } else {
        // Add new vehicle
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                alert('Vehicle added successfully!');
                closeModal();
                loadVehicles();
            } else {
                alert('Error: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(err => {
            console.error('Error:', err);
            alert('Error connecting to server');
        });
    }
}

// ========================================
// REMOVE VEHICLE
// ========================================
function removeVehicle() {
    if (!selectedVehicleId) {
        alert('Please select a vehicle first!');
        return;
    }
    
    const vehicle = vehiclesData.find(v => v.id === selectedVehicleId);
    if (!vehicle) {
        alert('Vehicle not found!');
        return;
    }
    
    if (!confirm(`Are you sure you want to remove vehicle ${vehicle.plate_number}?`)) {
        return;
    }
    
    fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedVehicleId })
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            alert('Vehicle removed successfully!');
            loadVehicles();
            selectedVehicleId = null;
        } else {
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Error connecting to server');
    });
}

// ========================================
// MARK AS INACTIVE
// ========================================
function markInactive() {
    if (!selectedVehicleId) {
        alert('Please select a vehicle first!');
        return;
    }
    
    const vehicle = vehiclesData.find(v => v.id === selectedVehicleId);
    if (!vehicle) {
        alert('Vehicle not found!');
        return;
    }
    
    if (!confirm(`Mark vehicle ${vehicle.plate_number} as inactive?`)) {
        return;
    }
    
    const data = {
        id: selectedVehicleId,
        plate_number: vehicle.plate_number,
        model_number: vehicle.model_number,
        engine_number: vehicle.engine_number,
        passenger_capacity: vehicle.passenger_capacity,
        or_cr: vehicle.or_cr,
        status: 'Not Registered'
    };
    
    fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => {
        if (data.message) {
            alert('Vehicle marked as inactive!');
            loadVehicles();
            selectedVehicleId = null;
        } else {
            alert('Error: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Error:', err);
        alert('Error connecting to server');
    });
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('vehicleSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            if (searchTerm === '') {
                renderVehicles();
                renderPagination();
                return;
            }
            
            const filtered = vehiclesData.filter(vehicle => 
                vehicle.plate_number.toLowerCase().includes(searchTerm) ||
                (vehicle.model_number && vehicle.model_number.toLowerCase().includes(searchTerm))
            );
            
            const grid = document.getElementById('vehicleGrid');
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="loading-msg">No vehicles found</div>';
                document.getElementById('pagination').innerHTML = '';
                return;
            }
            
            grid.innerHTML = filtered.map(vehicle => `
                <div class="vehicle-card" data-id="${vehicle.id}" onclick="selectVehicleCard(${vehicle.id})">
                    <div class="vehicle-plate">${vehicle.plate_number}</div>
                    <div class="vehicle-info">
                        <i class="fas fa-user-slash" style="color: #95a5a6;"></i>
                        <span style="color: #7f8c8d; font-style: italic;">No driver assigned</span>
                    </div>
                    <div class="vehicle-status">
                        <span class="status-badge ${vehicle.status === 'Registered' ? 'status-registered' : 'status-not-registered'}">
                            ${vehicle.status}
                        </span>
                    </div>
                    <button class="btn-available" onclick="event.stopPropagation(); viewVehicleDetails(${vehicle.id})">
                        <i class="fas fa-circle" style="margin-right: 5px;"></i>
                        AVAILABLE
                    </button>
                </div>
            `).join('');
            
            document.getElementById('pagination').innerHTML = '';
        });
    }
});

// ========================================
// ERROR HANDLING
// ========================================
function showError(message) {
    const grid = document.getElementById('vehicleGrid');
    if (grid) {
        grid.innerHTML = `<div class="loading-msg" style="color: #e74c3c;">${message}</div>`;
    }
}

// Make functions globally accessible
window.loadVehicles = loadVehicles;
window.selectVehicleCard = selectVehicleCard;
window.viewVehicleDetails = viewVehicleDetails;
window.closeDetail = closeDetail;
window.closeDetailPanel = closeDetailPanel;
window.changePage = changePage;
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.closeModalOutside = closeModalOutside;
window.submitForm = submitForm;
window.removeVehicle = removeVehicle;
window.markInactive = markInactive;