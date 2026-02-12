// Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard loaded successfully');
    
    // Navigation item click handlers
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            console.log('Navigated to:', this.textContent.trim());
        });
    });
    
    // Footer item click handlers
    const footerItems = document.querySelectorAll('.footer-item');
    footerItems.forEach(item => {
        item.addEventListener('click', function() {
            const action = this.textContent.trim();
            
            if (action === 'Log Out') {
                if (confirm('Are you sure you want to log out?')) {
                    // Redirect to login page
                    window.location.href = 'login.html';
                }
            } else {
                console.log('Footer action:', action);
                // Add functionality for other footer items
            }
        });
    });
    
    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            console.log('Searching for:', searchTerm);
            // Implement search functionality here
        });
    }
    
    // Driver checkbox handlers
    const checkboxes = document.querySelectorAll('.driver-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const driverName = this.parentElement.querySelector('.driver-name').textContent;
            if (this.checked) {
                console.log('Selected driver:', driverName);
            } else {
                console.log('Deselected driver:', driverName);
            }
        });
    });
    
    // Action button handlers
    const btnBreak = document.querySelector('.btn-break');
    const btnActive = document.querySelector('.btn-active');
    const btnInactive = document.querySelector('.btn-inactive');
    
    if (btnBreak) {
        btnBreak.addEventListener('click', function() {
            const selectedDrivers = getSelectedDrivers();
            if (selectedDrivers.length === 0) {
                alert('Please select at least one driver');
                return;
            }
            console.log('Marking drivers as On Break:', selectedDrivers);
            updateDriverStatus(selectedDrivers, 'On Break');
        });
    }
    
    if (btnActive) {
        btnActive.addEventListener('click', function() {
            const selectedDrivers = getSelectedDrivers();
            if (selectedDrivers.length === 0) {
                alert('Please select at least one driver');
                return;
            }
            console.log('Marking drivers as Active:', selectedDrivers);
            updateDriverStatus(selectedDrivers, 'Active');
        });
    }
    
    if (btnInactive) {
        btnInactive.addEventListener('click', function() {
            const selectedDrivers = getSelectedDrivers();
            if (selectedDrivers.length === 0) {
                alert('Please select at least one driver');
                return;
            }
            console.log('Marking drivers as Inactive:', selectedDrivers);
            updateDriverStatus(selectedDrivers, 'Inactive');
        });
    }
    
    // View Breakdown button
    const viewBreakdownBtn = document.querySelector('.link-btn');
    if (viewBreakdownBtn) {
        viewBreakdownBtn.addEventListener('click', function() {
            console.log('View Revenue Breakdown clicked');
            // Add functionality to show detailed revenue breakdown
            alert('Revenue breakdown feature coming soon!');
        });
    }
});

// Get selected drivers
function getSelectedDrivers() {
    const selectedDrivers = [];
    const checkboxes = document.querySelectorAll('.driver-checkbox:checked');
    
    checkboxes.forEach(checkbox => {
        const driverName = checkbox.parentElement.querySelector('.driver-name').textContent;
        selectedDrivers.push(driverName);
    });
    
    return selectedDrivers;
}

// Update driver status
function updateDriverStatus(drivers, newStatus) {
    drivers.forEach(driverName => {
        // Find the driver item
        const driverItems = document.querySelectorAll('.driver-item');
        
        driverItems.forEach(item => {
            const nameElement = item.querySelector('.driver-name');
            if (nameElement && nameElement.textContent === driverName) {
                const statusElement = item.querySelector('.status');
                
                // Remove all status classes
                statusElement.classList.remove('status-active', 'status-inactive', 'status-break');
                
                // Add new status class and text
                if (newStatus === 'Active') {
                    statusElement.classList.add('status-active');
                    statusElement.textContent = 'Active';
                } else if (newStatus === 'Inactive') {
                    statusElement.classList.add('status-inactive');
                    statusElement.textContent = 'Inactive';
                } else if (newStatus === 'On Break') {
                    statusElement.classList.add('status-break');
                    statusElement.textContent = 'On Break';
                }
                
                // Uncheck the checkbox
                const checkbox = item.querySelector('.driver-checkbox');
                if (checkbox) {
                    checkbox.checked = false;
                }
            }
        });
    });
    
    alert(`Successfully updated ${drivers.length} driver(s) to ${newStatus}`);
}