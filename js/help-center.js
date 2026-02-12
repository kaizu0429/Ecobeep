<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EcoBeep - Help Center</title>
    <link rel="stylesheet" href="../css/help-center.css">
</head>
<body>
    <!-- Navigation Bar -->
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-brand">
                <img src="ecobeeplogo_nobg.png" alt="EcoBeep Logo" class="nav-logo">
                <span class="nav-title">OPERATOR PORTAL</span>
            </div>
            <ul class="nav-links">
                <li><a href="index.html">HOME</a></li>
                <li><a href="about-us.html">ABOUT US</a></li>
                <li><a href="help-center.html" class="active">HELP CENTER</a></li>
                <li><a href="login.html">LOG IN</a></li>
            </ul>
        </div>
    </nav>

    <!-- Hero Section -->
    <div class="hero">
        <h1>HOW CAN WE HELP YOU?</h1>
        <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="searchInput" placeholder="Search for help...">
        </div>
    </div>

    <!-- Contact Info Section (Below Search Bar) -->
    <div class="contact-info-section">
        <h3>Contact us</h3>
        <div class="contact-details">
            <p><strong>Email:</strong> support@driver.com</p>
            <p><strong>Phone:</strong> +63 912 345 6789</p>
        </div>
    </div>

    <!-- Main Content -->
    <div class="content-wrapper">
        <!-- Tab Buttons - Driver is default -->
        <div class="tab-buttons">
            <button class="tab-btn active" data-tab="driver">Driver</button>
            <button class="tab-btn" data-tab="passenger">Passenger</button>
        </div>

        <!-- DRIVER CONTENT - Active by default -->
        <div id="driver-tab" class="tab-content active">
            <div class="faq-grid">
                <div class="faq-card">
                    <h3>Account & Access</h3>
                    <ul>
                        <li>How do I register as a jeepney driver?</li>
                        <li>How do I log in to the driver dashboard or mobile app?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Shift & Route Management</h3>
                    <ul>
                        <li>How do I view my assigned shifts?</li>
                        <li>How do I check my assigned jeepney and route?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Compliance & Requirements</h3>
                    <ul>
                        <li>What documents do I need to upload for compliance?</li>
                        <li>How do I check if my compliance documents are approved?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Earnings & Payouts</h3>
                    <ul>
                        <li>How do I view my daily or weekly earnings?</li>
                        <li>How do fare collections get calculated?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Safety & Incident Reporting</h3>
                    <ul>
                        <li>How do I report an accident or safety concern?</li>
                        <li>What steps should I take if there's a serious incident on the road?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Notifications & Alerts</h3>
                    <ul>
                        <li>How do I enable or disable push notifications?</li>
                        <li>How do I customize which notifications I receive?</li>
                    </ul>
                </div>
            </div>

            <div class="feedback-section">
                <button class="feedback-btn">Have concerns? Send feedback</button>
            </div>
        </div>

        <!-- PASSENGER CONTENT -->
        <div id="passenger-tab" class="tab-content">
            <div class="faq-grid">
                <div class="faq-card">
                    <h3>Account & Access</h3>
                    <ul>
                        <li>How do I create a passenger account?</li>
                        <li>How do I log in to the passenger app?</li>
                        <li>How do I manage my account security?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>RFID Usage & Trips</h3>
                    <ul>
                        <li>How do I use my RFID card when boarding a jeepney?</li>
                        <li>How do I check my trip history?</li>
                        <li>What should I do if my RFID card doesn't scan properly?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Payments & Balance</h3>
                    <ul>
                        <li>How do I check my balance?</li>
                        <li>How do fare deductions work when I scan?</li>
                        <li>What should I do if my balance didn't update?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Lost & Found</h3>
                    <ul>
                        <li>How do I contact the operator about lost belongings?</li>
                        <li>What steps should I take if my RFID card is lost or stolen?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Safety & Incident Reporting</h3>
                    <ul>
                        <li>How do I report an accident or safety concern during a trip?</li>
                        <li>How do I track the resolution of an incident report?</li>
                    </ul>
                </div>

                <div class="faq-card">
                    <h3>Notifications & Alerts</h3>
                    <ul>
                        <li>How do I enable or disable push notifications?</li>
                        <li>How do I customize which notifications I receive?</li>
                    </ul>
                </div>
            </div>

            <div class="feedback-section">
                <button class="feedback-btn">Have concerns? Send feedback</button>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
        <div class="footer-container">
            <div class="footer-left">
                <a href="#">Terms and Policies</a>
                <span class="separator">•</span>
                <a href="#">Privacy Notice</a>
            </div>
            <div class="footer-center">
                <p>&copy; EcoBeep 2026</p>
            </div>
            <div class="footer-right">
                <p>New Operator? <a href="#">Contact us</a></p>
            </div>
        </div>
    </footer>

    <!-- Feedback Modal -->
    <div id="feedbackModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Send Feedback</h2>
                <span class="close-btn">&times;</span>
            </div>
            <form id="feedbackForm" class="feedback-form">
                <div class="form-group">
                    <label for="feedbackName">Name</label>
                    <input type="text" id="feedbackName" name="name" placeholder="Enter your name" required>
                </div>

                <div class="form-group">
                    <label for="feedbackEmail">Email</label>
                    <input type="email" id="feedbackEmail" name="email" placeholder="Enter your email" required>
                </div>

                <div class="form-group">
                    <label for="feedbackCategory">Category</label>
                    <select id="feedbackCategory" name="category" required>
                        <option value="">Select a category</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                        <option value="question">Question</option>
                        <option value="complaint">Complaint</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="feedbackMessage">Message</label>
                    <textarea id="feedbackMessage" name="message" rows="5" placeholder="Tell us your feedback..." required></textarea>
                </div>

                <div id="feedbackError" class="error-message"></div>
                <div id="feedbackSuccess" class="success-message"></div>

                <div class="form-actions">
                    <button type="button" class="btn-cancel">Cancel</button>
                    <button type="submit" class="btn-submit-feedback">Submit Feedback</button>
                </div>
            </form>
        </div>
    </div>

    <script src="../js/help-center.js"></script>
</body>
</html>