<?php
header('Content-Type: application/json');

// Database connection
require_once 'db.php';

try {
    // Count vehicles with status 'Available' or 'Registered' and not assigned
    $sql = "SELECT COUNT(*) as available 
            FROM vehicles 
            WHERE status = 'Registered'";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $row = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'available' => (int)$row['available']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'available' => 0
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'available' => 0,
        'error' => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>