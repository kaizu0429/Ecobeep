// Add Route JavaScript Functions

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addRouteForm');
    const alertBox = document.getElementById('alertBox');
    
    // Auto-generate route code based on route name
    const routeNameInput = document.getElementById('routeName');
    const codeInput = document.getElementById('code');
    
    routeNameInput.addEventListener('blur', function() {
        if (codeInput.value === '') {
            suggestRouteCode();
        }
    });
    
    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Disable button and show loading
        submitButton.disabled = true;
        submitButton.textContent = 'Adding Route...';
        
        try {
            const response = await fetch('php/add-route.php', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('success', result.message);
                form.reset();
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showAlert('error', result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('error', 'An error occurred while adding the route. Please try again.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Add Route';
        }
    });
});

// Suggest route code based on route name
function suggestRouteCode() {
    const routeName = document.getElementById('routeName').value;
    if (!routeName) return;
    
    // Get first letters of each word
    const words = routeName.split('-');
    let code = 'RT-';
    
    if (words.length >= 2) {
        code += words[0].substring(0, 2).toUpperCase() + 
                words[1].substring(0, 2).toUpperCase();
    } else {
        code += routeName.substring(0, 3).toUpperCase();
    }
    
    // Add random number
    code += Math.floor(Math.random() * 100).toString().padStart(2, '0');
    
    document.getElementById('code').value = code;
}

// Form validation
function validateForm() {
    const routeName = document.getElementById('routeName').value.trim();
    const code = document.getElementById('code').value.trim();
    const distance = parseFloat(document.getElementById('distance').value);
    const regularFare = parseFloat(document.getElementById('regularFare').value);
    const studentFare = parseFloat(document.getElementById('studentFare').value);
    const pwdSeniorFare = parseFloat(document.getElementById('pwdSeniorFare').value);
    
    if (!routeName || !code) {
        showAlert('error', 'Route name and code are required.');
        return false;
    }
    
    if (distance <= 0) {
        showAlert('error', 'Distance must be greater than 0.');
        return false;
    }
    
    if (regularFare <= 0) {
        showAlert('error', 'Regular fare must be greater than 0.');
        return false;
    }
    
    if (studentFare <= 0 || pwdSeniorFare <= 0) {
        showAlert('error', 'All fare types must be greater than 0.');
        return false;
    }
    
    if (studentFare > regularFare) {
        showAlert('error', 'Student fare cannot be higher than regular fare.');
        return false;
    }
    
    if (pwdSeniorFare > regularFare) {
        showAlert('error', 'PWD/Senior fare cannot be higher than regular fare.');
        return false;
    }
    
    return true;
}

// Show alert message
function showAlert(type, message) {
    const alertBox = document.getElementById('alertBox');
    alertBox.className = 'alert alert-' + type;
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 5000);
}

// Reset form
function resetForm() {
    const form = document.getElementById('addRouteForm');
    form.reset();
    const alertBox = document.getElementById('alertBox');
    alertBox.style.display = 'none';
}

// Calculate fare based on distance (optional helper function)
function calculateFareByDistance() {
    const distance = parseFloat(document.getElementById('distance').value);
    
    if (distance > 0) {
        // Sample calculation: Base fare + (distance * rate per km)
        const baseFare = 13;
        const ratePerKm = 1.5;
        const calculatedFare = baseFare + (distance * ratePerKm);
        
        document.getElementById('regularFare').value = calculatedFare.toFixed(2);
        
        // Student and senior discounts (20% off)
        const discountedFare = calculatedFare * 0.8;
        document.getElementById('studentFare').value = discountedFare.toFixed(2);
        document.getElementById('pwdSeniorFare').value = discountedFare.toFixed(2);
    }
}

// Auto-calculate fares when distance changes (optional feature)
document.addEventListener('DOMContentLoaded', function() {
    const distanceInput = document.getElementById('distance');
    const autoCalcButton = document.createElement('button');
    autoCalcButton.type = 'button';
    autoCalcButton.className = 'btn-secondary';
    autoCalcButton.textContent = 'Auto-Calculate Fares';
    autoCalcButton.style.marginTop = '10px';
    autoCalcButton.onclick = calculateFareByDistance;
    
    // Uncomment to add auto-calculate button
    // distanceInput.parentNode.appendChild(autoCalcButton);
});