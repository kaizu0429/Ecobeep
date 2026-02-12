<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);

// Start session
session_start();

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array(
        'success' => false,
        'message' => 'Method Not Allowed. Please use POST request.'
    ));
    exit;
}

// Get form data
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

// Response array
$response = array('success' => false, 'message' => '');

// Validate inputs
if (empty($username) || empty($password)) {
    $response['message'] = 'Please fill in all fields';
    echo json_encode($response);
    exit;
}

// Demo login - username: operator, password: eco2024
if ($username === 'operator' && $password === 'eco2024') {
    // Set session variables
    $_SESSION['user_id'] = 1;
    $_SESSION['username'] = 'operator';
    $_SESSION['full_name'] = 'Demo Operator';
    $_SESSION['role'] = 'operator';
    $_SESSION['logged_in'] = true;
    $_SESSION['login_time'] = time();
    
    $response['success'] = true;
    $response['message'] = 'Login successful!';
    $response['user'] = array(
        'username' => 'operator',
        'full_name' => 'Demo Operator',
        'role' => 'operator'
    );
} else {
    // Generic error message - don't reveal credentials
    $response['message'] = 'Invalid username or password';
}

// Output JSON response
echo json_encode($response);
exit;
?>