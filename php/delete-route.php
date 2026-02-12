<?php
// delete-route.php - Delete a route

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

// Validate route ID
if (!isset($_POST['routeId']) || empty($_POST['routeId'])) {
    echo json_encode(['success' => false, 'message' => 'Route ID is required']);
    exit;
}

$routeId = intval($_POST['routeId']);

try {
    // Check if route exists
    $checkSql = "SELECT route_name FROM routes WHERE id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("i", $routeId);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Route not found']);
        $checkStmt->close();
        $conn->close();
        exit;
    }
    
    $routeData = $checkResult->fetch_assoc();
    $routeName = $routeData['route_name'];
    $checkStmt->close();
    
    // Optional: Check if route is being used in other tables (jeeps, schedules, etc.)
    // If you have foreign key relationships, you might want to check before deleting
    
    /*
    $usageSql = "SELECT COUNT(*) as count FROM jeeps WHERE route_id = ?";
    $usageStmt = $conn->prepare($usageSql);
    $usageStmt->bind_param("i", $routeId);
    $usageStmt->execute();
    $usageResult = $usageStmt->get_result();
    $usageData = $usageResult->fetch_assoc();
    
    if ($usageData['count'] > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Cannot delete route. It is currently assigned to ' . $usageData['count'] . ' jeep(s).'
        ]);
        $usageStmt->close();
        $conn->close();
        exit;
    }
    $usageStmt->close();
    */
    
    // Delete the route
    $sql = "DELETE FROM routes WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $routeId);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Route "' . $routeName . '" deleted successfully'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Route not found or already deleted'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete route: ' . $stmt->error
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
