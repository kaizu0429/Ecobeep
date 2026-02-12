// ==================== LOGOUT FUNCTION ====================

/**
 * Logout Function with Confirmation
 * Add this to your main script.js file
 */

function logout() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to logout?')) {
        // Optional: Clear any stored session data
        sessionStorage.clear();
        localStorage.removeItem('userSession');
        
        // Redirect to home/login page
        window.location.href = 'index.html';
    }
}

// Alternative: Logout without confirmation (instant logout)
function logoutInstant() {
    sessionStorage.clear();
    localStorage.removeItem('userSession');
    window.location.href = 'index.html';
}

// Optional: Auto logout after inactivity (30 minutes)
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert('You have been logged out due to inactivity.');
        logoutInstant();
    }, 30 * 60 * 1000); // 30 minutes
}

// Reset timer on user activity
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);

// Initialize timer on page load
resetInactivityTimer();
