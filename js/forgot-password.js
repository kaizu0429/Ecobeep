document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Handle form submission
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear previous messages
        hideMessages();
        
        // Get form data
        const email = document.getElementById('email').value.trim();
        
        // Validate email
        if (!email) {
            showError('Please enter your email address');
            return;
        }
        
        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        // Show loading state
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending...</span>';
        
        // Create FormData object
        const formData = new FormData();
        formData.append('email', email);
        
        console.log('Sending verification code to:', email);
        
        // Send AJAX request to PHP backend
        fetch('forgot-password-process.php', {
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
            return response.text();
        })
        .then(text => {
            console.log('Raw response:', text);
            try {
                const data = JSON.parse(text);
                console.log('Parsed response:', data);
                
                if (data.success) {
                    showSuccess(data.message || 'Verification code sent! Redirecting...');
                    
                    // Redirect to verify code page after 2 seconds
                    setTimeout(() => {
                        window.location.href = 'verify-code.html?email=' + encodeURIComponent(email);
                    }, 2000);
                } else {
                    showError(data.message || 'Email not found in our system');
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
    
    // Email validation function
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
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
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    emailInput.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.classList.remove('focused');
        }
    });
});