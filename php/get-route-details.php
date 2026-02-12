<?php
// get-route-details.php - Fetch single route details for editing

header('Content-Type: application/json');
session_start();

// Check if user is logged in (optional - adjust based on your auth system)
// if (!isset($_SESSION['user_id'])) {
//     echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
//     exit;
// }

// Include database connection
require_once 'config.php'; // Adjust this to your database connection file

// Get route ID from GET parameter
if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'Route ID is required']);
    exit;
}

$routeId = intval($_GET['id']);

try {
    // Prepare SQL statement
    $sql = "SELECT id, route_name, code, distance, regular_fare, student_fare, 
            pwd_senior_fare, status, created_at, updated_at 
            FROM routes 
            WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $routeId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $route = $result->fetch_assoc();
        
        echo json_encode([
            'success' => true,
            'data' => $route
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Route not found'
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
