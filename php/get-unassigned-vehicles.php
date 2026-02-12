<?php
/**
 * ECOBEEP - Get Unassigned Vehicles API
 * Returns all vehicles that don't have active assignments
 */

// Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration - Auto-detect environment
if ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false) {
    // Local development
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
    
    $DB_HOST = 'localhost';
    $DB_USER = 'root';
    $DB_PASS = '';
    $DB_NAME = 'ecobeep_db';
} else {
    // InfinityFree production
    ini_set('display_errors', 0);
    error_reporting(0);
    
    $DB_HOST = 'sql200.infinityfree.com';
    $DB_USER = 'if0_41006648';
    $DB_PASS = 'Apatkazero123';
    $DB_NAME = 'if0_41006648_ecobeep_db';
}

// Connect
try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}

try {
    // Get all vehicles that don't have an active assignment
    $sql = "SELECT 
                v.v_id as id,
                v.v_plate_number as plate_number,
                v.v_model_number as model_number,
                v.v_passenger_capacity as passenger_capacity,
                v.v_status as status
            FROM tbl_vehicles v
            LEFT JOIN tbl_vehicle_assignments va ON v.v_id = va.v_id AND va.va_status = 'active'
            WHERE va.va_id IS NULL AND v.v_status = 'Registered'
            ORDER BY v.v_plate_number";
    
    $vehicles = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'vehicles' => $vehicles,
        'count' => count($vehicles)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'vehicles' => []
    ]);
}
?>