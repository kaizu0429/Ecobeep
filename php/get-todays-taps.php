<?php
header('Content-Type: application/json');

// Database connection
require_once 'db.php';

try {
    // Count transactions for today
    $sql = "SELECT COUNT(*) as taps 
            FROM transactions 
            WHERE DATE(transaction_date) = CURDATE()
            AND status = 'completed'";
    
    $result = $conn->query($sql);
    
    if ($result) {
        $row = $result->fetch_assoc();
        echo json_encode([
            'success' => true,
            'taps' => (int)$row['taps']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'taps' => 0
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'taps' => 0,
        'error' => $e->getMessage()
    ]);
}

if (isset($conn)) {
    $conn->close();
}
?>