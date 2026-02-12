<?php
session_start();

// Error handling
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration - Auto-detect environment
if ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false) {
    // Local development
    $DB_HOST = 'localhost';
    $DB_USER = 'root';
    $DB_PASS = '';
    $DB_NAME = 'ecobeep_db';
} else {
    // InfinityFree production
    $DB_HOST = 'sql200.infinityfree.com';
    $DB_USER = 'if0_41006648';
    $DB_PASS = 'Apatkazero123';
    $DB_NAME = 'if0_41006648_ecobeep_db';
}

// Disable mysqli error reporting to prevent 500 errors
mysqli_report(MYSQLI_REPORT_OFF);

// Database connection
$conn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if ($conn->connect_error) {
    error_log('DB connection failed: ' . $conn->connect_error);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

$conn->set_charset('utf8mb4');

// Check if user is logged in (optional, adjust based on your auth system)
// if (!isset($_SESSION['user_id'])) {
//     echo json_encode(['success' => false, 'message' => 'Unauthorized']);
//     exit();
// }

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get POST data - matching exact column names from database
    $routeName = trim($_POST['route_name'] ?? '');
    $code = trim($_POST['code'] ?? '');
    $distance = $_POST['distance'] ?? 0;
    $regularFare = $_POST['regular_fare'] ?? 0;
    $studentFare = $_POST['student_fare'] ?? 0;
    $pwdSeniorFare = $_POST['pwd_senior_fare'] ?? 0;
    $status = $_POST['status'] ?? 'active';
    
    // Validation
    if (empty($routeName) || empty($code)) {
        echo json_encode(['success' => false, 'message' => 'Route name and code are required']);
        exit();
    }
    
    if ($distance <= 0) {
        echo json_encode(['success' => false, 'message' => 'Distance must be greater than 0']);
        exit();
    }
    
    if ($regularFare <= 0) {
        echo json_encode(['success' => false, 'message' => 'Regular fare must be greater than 0']);
        exit();
    }
    
    // Check if route code already exists
    $checkStmt = $conn->prepare("SELECT id FROM routes WHERE code = ?");
    if (!$checkStmt) {
        error_log('Prepare failed: ' . $conn->error);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        exit();
    }
    
    $checkStmt->bind_param("s", $code);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Route code already exists']);
        $checkStmt->close();
        $conn->close();
        exit();
    }
    $checkStmt->close();
    
    // Insert new route - matching your exact database columns
    $stmt = $conn->prepare("INSERT INTO routes (route_name, code, distance, regular_fare, student_fare, pwd_senior_fare, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        error_log('Prepare failed: ' . $conn->error);
        echo json_encode(['success' => false, 'message' => 'Database error']);
        exit();
    }
    
    $stmt->bind_param("ssdddds", $routeName, $code, $distance, $regularFare, $studentFare, $pwdSeniorFare, $status);
    
    if ($stmt->execute()) {
        $newRouteId = $conn->insert_id;
        echo json_encode([
            'success' => true, 
            'message' => 'Route added successfully',
            'route_id' => $newRouteId,
            'data' => [
                'route_name' => $routeName,
                'code' => $code,
                'distance' => $distance,
                'regular_fare' => $regularFare,
                'student_fare' => $studentFare,
                'pwd_senior_fare' => $pwdSeniorFare,
                'status' => $status
            ]
        ]);
    } else {
        error_log('Insert failed: ' . $stmt->error);
        echo json_encode(['success' => false, 'message' => 'Failed to add route']);
    }
    
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}

$conn->close();
?>