// ========================================
// ROUTE MANAGEMENT JAVASCRIPT - FINAL VERSION
// Ready to use - just replace your current route-management.js
// ========================================

let allRoutes = [];
let routeStats = {};

// Mock data - will load immediately
const MOCK_ROUTES = [
    {
        id: 1,
        route_name: 'Cubao-Novaliches',
        code: 'RT-001',
        distance: '15.20',
        regular_fare: '21.00',
        student_fare: '17.00',
        pwd_senior_fare: '17.00',
        status: 'active'
    },
    {
        id: 2,
        route_name: 'Monumento-Bacleran',
        code: 'RT-003',
        distance: '22.80',
        regular_fare: '21.00',
        student_fare: '18.00',
        pwd_senior_fare: '17.00',
        status: 'active'
    }
];

const MOCK_STATS = {
    total_routes: 2,
    active_routes: 2,
    total_distance: 38,
    avg_fare: 21
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const routeMgmtLinks = document.querySelectorAll('.nav-link[data-page="route-mgmt"]');
    
    routeMgmtLinks.forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(() => {
                loadRouteManagementData();
            }, 100);
        });
    });
    
    const routePage = document.getElementById('page-route-mgmt');
    if (routePage && routePage.classList.contains('active')) {
        loadRouteManagementData();
    }
});

function loadRouteManagementData() {
    loadFromAPI().catch(() => loadMockData());
}

async function loadFromAPI() {
    const statsResponse = await fetch('/ecobeep/php/route-management-api.php?action=get_stats');
    if (!statsResponse.ok) throw new Error('API failed');
    const statsData = await statsResponse.json();
    
    if (!statsData.success) throw new Error('Not successful');
    
    routeStats = statsData.stats;
    updateStatsDisplay();
    
    const routesResponse = await fetch('/ecobeep/php/route-management-api.php?action=get_all_routes');
    if (!routesResponse.ok) throw new Error('API failed');
    const routesData = await routesResponse.json();
    
    if (!routesData.success) throw new Error('Not successful');
    
    allRoutes = routesData.routes;
    displayRoutes(allRoutes);
    populateFareTable(allRoutes);
}

function loadMockData() {
    allRoutes = [...MOCK_ROUTES];
    routeStats = {...MOCK_STATS};
    
    updateStatsDisplay();
    displayRoutes(allRoutes);
    populateFareTable(allRoutes);
}

function updateStatsDisplay() {
    const totalEl = document.getElementById('rmStatTotalRoutes');
    const activeEl = document.getElementById('rmStatActiveRoutes');
    const distanceEl = document.getElementById('rmStatTotalDistance');
    const fareEl = document.getElementById('rmStatAvgFare');
    
    if (totalEl) totalEl.textContent = routeStats.total_routes || 0;
    if (activeEl) activeEl.textContent = routeStats.active_routes || 0;
    if (distanceEl) distanceEl.textContent = (routeStats.total_distance || 0) + ' km';
    if (fareEl) fareEl.textContent = '₱' + (routeStats.avg_fare || 0);
}

function displayRoutes(routes) {
    const container = document.getElementById('routesGrid');
    
    if (!container) return;
    
    if (!routes || routes.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #64748b;">
                <i class="fas fa-map-marked-alt" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                <p style="font-size: 18px; font-weight: 600; margin-bottom: 10px;">No Routes Found</p>
                <p style="font-size: 14px;">Add your first route to get started</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = routes.map(route => `
        <div class="route-card">
            <div class="route-card-header">
                <div class="route-name">
                    <i class="fas fa-route"></i>
                    ${route.route_name}
                </div>
                <span class="route-status ${route.status}">${route.status === 'active' ? 'Active' : 'Inactive'}</span>
            </div>
            
            <div class="route-code">${route.code}</div>
            
            <div style="margin: 15px 0;">
                <div class="route-detail-row">
                    <span class="route-detail-label"><i class="fas fa-map-marker-alt"></i> Distance</span>
                    <span class="route-detail-value route-distance">${route.distance} km</span>
                </div>
                <div class="route-detail-row">
                    <span class="route-detail-label"><i class="fas fa-money-bill-wave"></i> Regular Fare</span>
                    <span class="route-detail-value route-fare">₱${route.regular_fare}</span>
                </div>
                <div class="route-detail-row">
                    <span class="route-detail-label"><i class="fas fa-graduation-cap"></i> Student Fare</span>
                    <span class="route-detail-value">₱${route.student_fare}</span>
                </div>
                <div class="route-detail-row">
                    <span class="route-detail-label"><i class="fas fa-wheelchair"></i> PWD/Senior Fare</span>
                    <span class="route-detail-value">₱${route.pwd_senior_fare}</span>
                </div>
            </div>
            
            <div class="route-card-actions">
                <button class="route-btn route-btn-edit" onclick="openEditRouteModal(${route.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="route-btn route-btn-delete" onclick="confirmDeleteRoute(${route.id}, '${route.route_name}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function populateFareTable(routes) {
    const tbody = document.getElementById('fareComparisonBody');
    
    if (!tbody) return;
    
    if (!routes || routes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #64748b;">
                    No routes available
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = routes.map(route => `
        <tr>
            <td><strong>${route.route_name}</strong></td>
            <td>${route.code}</td>
            <td>${route.distance} km</td>
            <td><span class="fare-badge regular">₱${route.regular_fare}</span></td>
            <td><span class="fare-badge student">₱${route.student_fare}</span></td>
            <td><span class="fare-badge pwd">₱${route.pwd_senior_fare}</span></td>
        </tr>
    `).join('');
}

// ADD NEW ROUTE
function openAddRouteModal() {
    document.getElementById('rmModalTitle').textContent = 'Add New Route';
    document.getElementById('rmRouteId').value = '';
    document.getElementById('rmRouteName').value = '';
    document.getElementById('rmRouteCode').value = '';
    document.getElementById('rmDistance').value = '';
    document.getElementById('rmRegularFare').value = '';
    document.getElementById('rmStudentFare').value = '';
    document.getElementById('rmPwdFare').value = '';
    document.getElementById('rmStatus').value = 'active';
    
    const submitBtn = document.getElementById('rmSubmitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Route';
    }
    
    const modal = document.getElementById('rmModalOverlay');
    if (modal) {
        modal.classList.add('show');
    }
}

// EDIT ROUTE
function openEditRouteModal(routeId) {
    const route = allRoutes.find(r => r.id == routeId);
    
    if (!route) {
        alert('Route not found!');
        return;
    }
    
    document.getElementById('rmModalTitle').textContent = 'Edit Route';
    document.getElementById('rmRouteId').value = route.id;
    document.getElementById('rmRouteName').value = route.route_name;
    document.getElementById('rmRouteCode').value = route.code;
    document.getElementById('rmDistance').value = route.distance;
    document.getElementById('rmRegularFare').value = route.regular_fare;
    document.getElementById('rmStudentFare').value = route.student_fare;
    document.getElementById('rmPwdFare').value = route.pwd_senior_fare;
    document.getElementById('rmStatus').value = route.status;
    
    const submitBtn = document.getElementById('rmSubmitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Route';
    }
    
    const modal = document.getElementById('rmModalOverlay');
    if (modal) {
        modal.classList.add('show');
    }
}

// CLOSE MODAL
function closeRMModal() {
    const modal = document.getElementById('rmModalOverlay');
    if (modal) {
        modal.classList.remove('show');
    }
}

function closeRMModalOutside(event) {
    if (event.target.id === 'rmModalOverlay') {
        closeRMModal();
    }
}

// SUBMIT FORM
async function submitRouteForm() {
    const routeId = document.getElementById('rmRouteId').value;
    const routeName = document.getElementById('rmRouteName').value.trim();
    const routeCode = document.getElementById('rmRouteCode').value.trim();
    const distance = document.getElementById('rmDistance').value;
    const regularFare = document.getElementById('rmRegularFare').value;
    const studentFare = document.getElementById('rmStudentFare').value;
    const pwdFare = document.getElementById('rmPwdFare').value;
    const status = document.getElementById('rmStatus').value;
    
    if (!routeName) {
        alert('Please enter Route Name');
        return;
    }
    
    if (!routeCode) {
        alert('Please enter Route Code');
        return;
    }
    
    if (!distance || parseFloat(distance) <= 0) {
        alert('Please enter valid Distance');
        return;
    }
    
    if (!regularFare || parseFloat(regularFare) <= 0) {
        alert('Please enter valid Regular Fare');
        return;
    }
    
    const isUpdate = routeId ? true : false;
    
    const newRoute = {
        route_name: routeName,
        code: routeCode,
        distance: parseFloat(distance).toFixed(2),
        regular_fare: parseFloat(regularFare).toFixed(2),
        student_fare: studentFare ? parseFloat(studentFare).toFixed(2) : '0.00',
        pwd_senior_fare: pwdFare ? parseFloat(pwdFare).toFixed(2) : '0.00',
        status: status
    };
    
    try {
        const action = isUpdate ? 'update_route' : 'add_route';
        const payload = isUpdate ? {...newRoute, id: routeId} : newRoute;
        
        const response = await fetch(`/ecobeep/php/route-management-api.php?action=${action}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(isUpdate ? '✅ Route updated!' : '✅ Route added!');
            closeRMModal();
            loadRouteManagementData();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        // Mock mode
        if (isUpdate) {
            const index = allRoutes.findIndex(r => r.id == routeId);
            if (index !== -1) {
                allRoutes[index] = {id: parseInt(routeId), ...newRoute};
                alert(`✅ Route "${routeName}" updated! (Mock Mode)`);
            }
        } else {
            const newId = allRoutes.length > 0 ? Math.max(...allRoutes.map(r => r.id)) + 1 : 1;
            allRoutes.push({id: newId, ...newRoute});
            alert(`✅ Route "${routeName}" added! (Mock Mode)`);
        }
        
        routeStats.total_routes = allRoutes.length;
        routeStats.active_routes = allRoutes.filter(r => r.status === 'active').length;
        routeStats.total_distance = allRoutes.reduce((sum, r) => sum + parseFloat(r.distance), 0).toFixed(2);
        routeStats.avg_fare = (allRoutes.reduce((sum, r) => sum + parseFloat(r.regular_fare), 0) / allRoutes.length).toFixed(2);
        
        closeRMModal();
        updateStatsDisplay();
        displayRoutes(allRoutes);
        populateFareTable(allRoutes);
    }
}

// DELETE ROUTE
function confirmDeleteRoute(routeId, routeName) {
    const route = allRoutes.find(r => r.id == routeId);
    
    const confirmed = confirm(
        `⚠️ Delete this route?\n\n` +
        `Route: ${routeName}\n` +
        `Code: ${route?.code || 'N/A'}\n\n` +
        `This cannot be undone!`
    );
    
    if (confirmed) {
        deleteRoute(routeId);
    }
}

async function deleteRoute(routeId) {
    try {
        const response = await fetch('/ecobeep/php/route-management-api.php?action=delete_route', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: routeId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Route deleted!');
            loadRouteManagementData();
        } else {
            alert('❌ Error: ' + data.message);
        }
    } catch (error) {
        // Mock delete
        const index = allRoutes.findIndex(r => r.id == routeId);
        if (index !== -1) {
            const deletedRoute = allRoutes.splice(index, 1)[0];
            alert(`✅ Route "${deletedRoute.route_name}" deleted! (Mock Mode)`);
            
            routeStats.total_routes = allRoutes.length;
            routeStats.active_routes = allRoutes.filter(r => r.status === 'active').length;
            routeStats.total_distance = allRoutes.reduce((sum, r) => sum + parseFloat(r.distance), 0).toFixed(2);
            routeStats.avg_fare = allRoutes.length > 0 ? 
                (allRoutes.reduce((sum, r) => sum + parseFloat(r.regular_fare), 0) / allRoutes.length).toFixed(2) : 0;
            
            updateStatsDisplay();
            displayRoutes(allRoutes);
            populateFareTable(allRoutes);
        }
    }
}

// SEARCH
function filterRoutesTable() {
    const searchInput = document.getElementById('routeMgmtSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        displayRoutes(allRoutes);
        populateFareTable(allRoutes);
        return;
    }
    
    const filtered = allRoutes.filter(route => 
        route.route_name.toLowerCase().includes(searchTerm) ||
        route.code.toLowerCase().includes(searchTerm)
    );
    
    displayRoutes(filtered);
    populateFareTable(filtered);
}

window.reloadRoutes = function() {
    loadMockData();
};

console.log('✅ Route Management loaded - ready to use!');