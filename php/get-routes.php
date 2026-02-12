<?php
/**
 * Get Routes API - Fetch all routes for display
 */

// Database configuration - UPDATE WITH YOUR CREDENTIALS
$db_host = 'sql200.infinityfree.com';
$db_user = 'if0_41006648';
$db_pass = 'Apatkazero123'; // ⚠️ CHANGE THIS
$db_name = 'if0_41006648_ecobeep_db';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$response = array();

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    
    $conn->set_charset("utf8mb4");
    
    // Get all routes
    $sql = "SELECT 
                r_id as id,
                r_route_name as route_name,
                r_code as code,
                r_distance as distance,
                r_regular_fare as regular_fare,
                r_student_fare as student_fare,
                r_pwd_senior_fare as pwd_senior_fare,
                r_status as status,
                r_created_at as created_at
            FROM tbl_routes
            ORDER BY r_created_at DESC";
    
    $result = $conn->query($sql);
    $routes = array();
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $routes[] = $row;
        }
    }
    
    // Calculate statistics
    $stats = array(
        'total' => count($routes),
        'active' => 0,
        'totalDistance' => 0,
        'avgFare' => 0
    );
    
    $totalFare = 0;
    foreach ($routes as $route) {
        if ($route['status'] === 'active') {
            $stats['active']++;
        }
        $stats['totalDistance'] += floatval($route['distance']);
        $totalFare += floatval($route['regular_fare']);
    }
    
    if (count($routes) > 0) {
        $stats['avgFare'] = round($totalFare / count($routes), 2);
    }
    
    $stats['totalDistance'] = round($stats['totalDistance'], 2);
    
    $response['success'] = true;
    $response['routes'] = $routes;
    $response['stats'] = $stats;
    
    $conn->close();
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = $e->getMessage();
    $response['routes'] = array();
    $response['stats'] = array(
        'total' => 0,
        'active' => 0,
        'totalDistance' => 0,
        'avgFare' => 0
    );
}

echo json_encode($response);
?>