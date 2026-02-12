<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'db_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'] ?? 0;
    $route_name = $_POST['route_name'] ?? '';
    $route_code = $_POST['route_code'] ?? '';
    $distance = $_POST['distance'] ?? 0;
    $regular_fare = $_POST['regular_fare'] ?? 0;
    $student_fare = $_POST['student_fare'] ?? 0;
    $pwd_fare = $_POST['pwd_fare'] ?? 0;
    $status = $_POST['status'] ?? 'active';
    
    // Validation
    if (empty($id) || empty($route_name) || empty($route_code)) {
        echo json_encode([
            'success' => false,
            'message' => 'Route ID, name, and code are required'
        ]);
        exit;
    }
    
    // Check if route code exists for another route
    $check_stmt = $conn->prepare("SELECT id FROM routes WHERE route_code = ? AND id != ?");
    $check_stmt->bind_param("si", $route_code, $id);
    $check_stmt->execute();
    $check_result = $check_stmt->get_result();
    
    if ($check_result->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Route code already exists for another route'
        ]);
        exit;
    }
    
    // Update route
    $stmt = $conn->prepare("UPDATE routes SET route_name = ?, route_code = ?, distance = ?, regular_fare = ?, student_fare = ?, pwd_fare = ?, status = ? WHERE id = ?");
    $stmt->bind_param("ssddddsi", $route_name, $route_code, $distance, $regular_fare, $student_fare, $pwd_fare, $status, $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Route updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update route: ' . $conn->error
        ]);
    }
    
    $stmt->close();
    $conn->close();
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
}
?>
