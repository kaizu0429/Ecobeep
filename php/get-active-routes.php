<?php
header('Content-Type: application/json');

// Database connection
require_once 'db.php';

try {
    // Count routes with status 'active'
    $sql = "SELECT COUNT(*) as active 
            FROM routes 
            WHERE status = 'active'";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $row = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'active' => (int)$row['active']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'active' => 0
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'active' => 0,
        'error' => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>