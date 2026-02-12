<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start session
session_start();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array(
        'success' => false,
        'message' => 'Method Not Allowed'
    ));
    exit;
}

// Response array
$response = array('success' => false, 'message' => '');

// Get form data
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$category = isset($_POST['category']) ? trim($_POST['category']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

// Validate inputs
if (empty($name) || empty($email) || empty($category) || empty($message)) {
    $response['message'] = 'Please fill in all fields';
    echo json_encode($response);
    exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $response['message'] = 'Please enter a valid email address';
    echo json_encode($response);
    exit;
}

// Database configuration
$servername = "localhost";
$db_username = "root";
$db_password = "";
$dbname = "ecobeep";

try {
    // Create connection
    $conn = new mysqli($servername, $db_username, $db_password, $dbname);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    // Create feedback table if it doesn't exist
    $createTableSQL = "CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $conn->query($createTableSQL);
    
    // Insert feedback
    $stmt = $conn->prepare("INSERT INTO feedback (name, email, category, message) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $email, $category, $message);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Thank you! Your feedback has been received.';
        
        // Optional: Send email notification
        // $to = "support@ecobeep.com";
        // $subject = "New Feedback: " . $category;
        // $body = "Name: $name\nEmail: $email\nCategory: $category\n\nMessage:\n$message";
        // mail($to, $subject, $body);
    } else {
        $response['message'] = 'Failed to save feedback. Please try again.';
    }
    
    $stmt->close();
    $conn->close();
    
} catch (Exception $e) {
    $response['message'] = 'Database error. Please try again later.';
    error_log("Feedback error: " . $e->getMessage());
}

// Output JSON response
echo json_encode($response);
exit;
?>