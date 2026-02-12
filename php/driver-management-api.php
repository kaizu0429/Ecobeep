<?php
/**
 * ECOBEEP - Driver Management API
 * Handles all driver management operations with correct table names
 */

// Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get_all_drivers':
        getAllDrivers($pdo);
        break;
    case 'get_stats':
        getStats($pdo);
        break;
    case 'add_driver':
        addDriver($pdo);
        break;
    case 'suspend_driver':
        suspendDriver($pdo);
        break;
    case 'reactivate_driver':
        reactivateDriver($pdo);
        break;
    case 'set_on_leave':
        setOnLeave($pdo);
        break;
    case 'return_from_leave':
        returnFromLeave($pdo);
        break;
    case 'terminate_driver':
        terminateDriver($pdo);
        break;
    case 'get_archived_drivers':
        getArchivedDrivers($pdo);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function getAllDrivers($pdo) {
    try {
        $sql = "SELECT 
                    d.d_id as id,
                    d.d_first_name as first_name,
                    d.d_last_name as last_name,
                    d.d_full_name as full_name,
                    d.d_license_number as license_number,
                    d.d_phone as phone,
                    d.d_email as email,
                    CASE 
                        WHEN d.d_status = 'available' AND va.va_id IS NOT NULL THEN 'assigned'
                        ELSE d.d_status
                    END as status,
                    d.d_date_hired as date_hired,
                    d.d_address as address,
                    d.d_emergency_contact as emergency_contact,
                    va.va_id as assignment_id,
                    v.v_plate_number as assignment_vehicle,
                    v.v_model_number as assignment_vehicle_model
                FROM tbl_drivers d
                LEFT JOIN tbl_vehicle_assignments va ON d.d_id = va.d_id AND va.va_status = 'active'
                LEFT JOIN tbl_vehicles v ON va.v_id = v.v_id
                WHERE d.d_status != 'terminated'
                ORDER BY d.d_first_name, d.d_last_name";
        
        $drivers = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'drivers' => $drivers
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function getStats($pdo) {
    try {
        // Total drivers (excluding terminated)
        $total = (int)$pdo->query("SELECT COUNT(*) FROM tbl_drivers WHERE d_status != 'terminated'")->fetchColumn();
        
        // Count by status
        $available = (int)$pdo->query("SELECT COUNT(*) FROM tbl_drivers WHERE d_status = 'available'")->fetchColumn();
        $onLeave = (int)$pdo->query("SELECT COUNT(*) FROM tbl_drivers WHERE d_status = 'on_leave'")->fetchColumn();
        $suspended = (int)$pdo->query("SELECT COUNT(*) FROM tbl_drivers WHERE d_status = 'suspended'")->fetchColumn();
        
        // Count assigned drivers (those with active vehicle assignments)
        $assigned = (int)$pdo->query("
            SELECT COUNT(DISTINCT d_id) 
            FROM tbl_vehicle_assignments 
            WHERE va_status = 'active'
        ")->fetchColumn();
        
        // Vehicle stats
        $totalVehicles = (int)$pdo->query("SELECT COUNT(*) FROM tbl_vehicles")->fetchColumn();
        $vehiclesAssigned = (int)$pdo->query("
            SELECT COUNT(DISTINCT v_id) 
            FROM tbl_vehicle_assignments 
            WHERE va_status = 'active'
        ")->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'stats' => [
                'total_drivers' => $total,
                'available' => $available,
                'assigned' => $assigned,
                'on_leave' => $onLeave,
                'suspended' => $suspended,
                'total_vehicles' => $totalVehicles,
                'vehicles_assigned' => $vehiclesAssigned,
                'vehicles_unassigned' => $totalVehicles - $vehiclesAssigned
            ]
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function addDriver($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $firstName = trim($input['first_name']);
        $lastName = trim($input['last_name']);
        $license = trim($input['license_number']);
        $phone = isset($input['phone']) ? trim($input['phone']) : null;
        $email = isset($input['email']) ? trim($input['email']) : null;
        $address = isset($input['address']) ? trim($input['address']) : null;
        $emergency = isset($input['emergency_contact']) ? trim($input['emergency_contact']) : null;
        $hired = isset($input['date_hired']) && !empty($input['date_hired']) ? $input['date_hired'] : null;
        
        if (empty($firstName) || empty($lastName) || empty($license)) {
            echo json_encode(['success' => false, 'message' => 'First name, last name, and license number are required']);
            return;
        }
        
        // Check for duplicate license
        $stmt = $pdo->prepare("SELECT d_id FROM tbl_drivers WHERE d_license_number = ?");
        $stmt->execute([$license]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'License number already exists']);
            return;
        }
        
        // Insert driver
        $stmt = $pdo->prepare("INSERT INTO tbl_drivers (d_first_name, d_last_name, d_license_number, d_phone, d_email, d_address, d_emergency_contact, d_date_hired, d_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')");
        $stmt->execute([$firstName, $lastName, $license, $phone, $email, $address, $emergency, $hired]);
        
        echo json_encode(['success' => true, 'message' => 'Driver added successfully']);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function suspendDriver($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $driverId = (int)$input['driver_id'];
        
        // Update driver status to suspended
        $stmt = $pdo->prepare("UPDATE tbl_drivers SET d_status = 'suspended' WHERE d_id = ?");
        $stmt->execute([$driverId]);
        
        // If driver has active assignment, unassign them
        $stmt = $pdo->prepare("UPDATE tbl_vehicle_assignments SET va_status = 'inactive', va_unassigned_date = NOW() WHERE d_id = ? AND va_status = 'active'");
        $stmt->execute([$driverId]);
        
        echo json_encode(['success' => true, 'message' => 'Driver suspended successfully']);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function reactivateDriver($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $driverId = (int)$input['driver_id'];
        
        // Update driver status to available
        $stmt = $pdo->prepare("UPDATE tbl_drivers SET d_status = 'available' WHERE d_id = ?");
        $stmt->execute([$driverId]);
        
        echo json_encode(['success' => true, 'message' => 'Driver reactivated successfully']);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function setOnLeave($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $driverId = (int)$input['driver_id'];
        
        // Update driver status to on_leave
        $stmt = $pdo->prepare("UPDATE tbl_drivers SET d_status = 'on_leave' WHERE d_id = ?");
        $stmt->execute([$driverId]);
        
        // If driver has active assignment, unassign them
        $stmt = $pdo->prepare("UPDATE tbl_vehicle_assignments SET va_status = 'inactive', va_unassigned_date = NOW() WHERE d_id = ? AND va_status = 'active'");
        $stmt->execute([$driverId]);
        
        echo json_encode(['success' => true, 'message' => 'Driver set on leave successfully']);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function returnFromLeave($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $driverId = (int)$input['driver_id'];
        
        // Update driver status to available
        $stmt = $pdo->prepare("UPDATE tbl_drivers SET d_status = 'available' WHERE d_id = ?");
        $stmt->execute([$driverId]);
        
        echo json_encode(['success' => true, 'message' => 'Driver returned from leave successfully']);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function terminateDriver($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $driverId = (int)$input['driver_id'];
        
        // Update driver status to terminated
        $stmt = $pdo->prepare("UPDATE tbl_drivers SET d_status = 'terminated' WHERE d_id = ?");
        $stmt->execute([$driverId]);
        
        // If driver has active assignment, unassign them
        $stmt = $pdo->prepare("UPDATE tbl_vehicle_assignments SET va_status = 'inactive', va_unassigned_date = NOW() WHERE d_id = ? AND va_status = 'active'");
        $stmt->execute([$driverId]);
        
        echo json_encode(['success' => true, 'message' => 'Driver terminated successfully']);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function getArchivedDrivers($pdo) {
    try {
        $sql = "SELECT 
                    d_id as id,
                    d_first_name as first_name,
                    d_last_name as last_name,
                    d_full_name as full_name,
                    d_license_number as license_number,
                    d_status as status
                FROM tbl_drivers
                WHERE d_status = 'terminated'
                ORDER BY d_first_name, d_last_name";
        
        $archived = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'archived' => $archived
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
?>