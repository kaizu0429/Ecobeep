<?php
// edit-route.php - Update existing route

header('Content-Type: application/json');
session_start();

// Check if user is logged in (optional - adjust based on your auth system)
// if (!isset($_SESSION['user_id'])) {
//     echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
//     exit;
// }

// Include database connection
require_once 'config.php'; // Adjust this to your database connection file

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Validate required fields
$required_fields = ['routeId', 'routeName', 'code', 'distance', 'regularFare'];
foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        echo json_encode(['success' => false, 'message' => ucfirst($field) . ' is required']);
        exit;
    }
}

// Get and sanitize input
$routeId = intval($_POST['routeId']);
$routeName = trim($_POST['routeName']);
$code = trim($_POST['code']);
$distance = floatval($_POST['distance']);
$regularFare = floatval($_POST['regularFare']);
$studentFare = isset($_POST['studentFare']) ? floatval($_POST['studentFare']) : 0;
$pwdSeniorFare = isset($_POST['pwdSeniorFare']) ? floatval($_POST['pwdSeniorFare']) : 0;
$status = isset($_POST['status']) ? trim($_POST['status']) : 'active';

// Validate data
if ($distance <= 0) {
    echo json_encode(['success' => false, 'message' => 'Distance must be greater than 0']);
    exit;
}

if ($regularFare <= 0) {
    echo json_encode(['success' => false, 'message' => 'Regular fare must be greater than 0']);
    exit;
}

if ($studentFare > $regularFare) {
    echo json_encode(['success' => false, 'message' => 'Student fare cannot be higher than regular fare']);
    exit;
}

if ($pwdSeniorFare > $regularFare) {
    echo json_encode(['success' => false, 'message' => 'PWD/Senior fare cannot be higher than regular fare']);
    exit;
}

if (!in_array($status, ['active', 'inactive'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid status value']);
    exit;
}

try {
    // Check if route code already exists for a different route
    $checkSql = "SELECT id FROM routes WHERE code = ? AND id != ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("si", $code, $routeId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Route code already exists']);
        $checkStmt->close();
        $conn->close();
        exit;
    }
    $checkStmt->close();
    
    // Check if route exists
    $existsSql = "SELECT id FROM routes WHERE id = ?";
    $existsStmt = $conn->prepare($existsSql);
    $existsStmt->bind_param("i", $routeId);
    $existsStmt->execute();
    $existsResult = $existsStmt->get_result();
    
    if ($existsResult->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Route not found']);
        $existsStmt->close();
        $conn->close();
        exit;
    }
    $existsStmt->close();
    
    // Update route
    $sql = "UPDATE routes SET 
            route_name = ?, 
            code = ?, 
            distance = ?, 
            regular_fare = ?, 
            student_fare = ?, 
            pwd_senior_fare = ?, 
            status = ?,
            updated_at = NOW()
            WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssdddssi", 
        $routeName, 
        $code, 
        $distance, 
        $regularFare, 
        $studentFare, 
        $pwdSeniorFare, 
        $status,
        $routeId
    );
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Route updated successfully',
            'routeId' => $routeId
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update route: ' . $stmt->error
        ]);
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
