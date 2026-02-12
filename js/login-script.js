document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear previous messages
        hideMessages();
        
        // Get form data
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
        // Validate inputs
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Signing in...</span>';
        
        // Create FormData object
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('remember', remember ? '1' : '0');
        
        console.log('Attempting login with:', username);
        
        // Send AJAX request to PHP backend
        fetch('../php/login-process.php', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData,
            credentials: 'same-origin'
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text(); // Get as text first
        })
        .then(text => {
            console.log('Raw response:', text);
            try {
                const data = JSON.parse(text);
                console.log('Parsed response:', data);
                
                if (data.success) {
                    showSuccess(data.message || 'Login successful! Redirecting...');
                    
                    // Store login state in sessionStorage
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('username', data.user.username);
                    sessionStorage.setItem('full_name', data.user.full_name);
                    
                    // Redirect to dashboard after 1 second
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    showError(data.message || 'Invalid username or password');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                showError('Server response error. Response: ' + text.substring(0, 100));
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showError('Connection error. Please make sure you are running this on a PHP server (localhost).');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        });
    });
    
    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        errorMessage.style.display = 'block';
    }
    
    // Show success message
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
        successMessage.style.display = 'block';
    }
    
    // Hide all messages
    function hideMessages() {
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }
    
    // Add input animations
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
});