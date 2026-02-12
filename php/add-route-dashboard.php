<?php
/**
 * Route Management API - Add Route Endpoint
 * Integrates with EcoBeep Dashboard
 */

// Database configuration - UPDATE WITH YOUR CREDENTIALS
$db_host = 'sql200.infinityfree.com';
$db_user = 'if0_41006648';
$db_pass = 'Apatkazero123'; // ⚠️ CHANGE THIS
$db_name = 'if0_41006648_ecobeep_db';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$response = array();

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method");
    }
    
    // Get form data
    $routeName = trim($_POST['routeName'] ?? '');
    $code = trim($_POST['code'] ?? '');
    $distance = floatval($_POST['distance'] ?? 0);
    $regularFare = floatval($_POST['regularFare'] ?? 0);
    $studentFare = floatval($_POST['studentFare'] ?? 0);
    $pwdSeniorFare = floatval($_POST['pwdSeniorFare'] ?? 0);
    $status = trim($_POST['status'] ?? 'active');
    
    // Validation
    if (empty($routeName) || empty($code)) {
        throw new Exception("Route name and code are required");
    }
    
    if ($distance <= 0) {
        throw new Exception("Distance must be greater than 0");
    }
    
    if ($regularFare <= 0) {
        throw new Exception("Regular fare must be greater than 0");
    }
    
    if ($studentFare > $regularFare || $pwdSeniorFare > $regularFare) {
        throw new Exception("Discounted fares cannot be higher than regular fare");
    }
    
    // Check duplicate code
    $check = $conn->prepare("SELECT r_id FROM tbl_routes WHERE r_code = ?");
    $check->bind_param("s", $code);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        throw new Exception("Route code already exists");
    }
    $check->close();
    
    // Insert route
    $sql = "INSERT INTO tbl_routes (r_route_name, r_code, r_distance, r_regular_fare, r_student_fare, r_pwd_senior_fare, r_status, r_created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssdddds", $routeName, $code, $distance, $regularFare, $studentFare, $pwdSeniorFare, $status);
    
    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = "Route added successfully!";
        $response['route_id'] = $conn->insert_id;
        $response['data'] = [
            'id' => $conn->insert_id,
            'route_name' => $routeName,
            'code' => $code,
            'distance' => $distance,
            'regular_fare' => $regularFare,
            'student_fare' => $studentFare,
            'pwd_senior_fare' => $pwdSeniorFare,
            'status' => $status
        ];
    } else {
        throw new Exception("Failed to add route");
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
} finally {
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }
}

echo json_encode($response);
?>