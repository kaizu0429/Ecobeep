<?php
/**
 * ECOBEEP - Assign Driver API (FIXED VERSION)
 * Updated to use correct table names with tbl_ prefix
 * NOW WITH PROPER STATUS UPDATES
 */

// Error handling
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);

// Set headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration - Auto-detect environment
if ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false) {
    // Local development
    $DB_HOST = 'localhost';
    $DB_USER = 'root';
    $DB_PASS = '';
    $DB_NAME = 'ecobeep_db';
} else {
    // InfinityFree production
    $DB_HOST = 'sql200.infinityfree.com';
    $DB_USER = 'if0_41006648';
    $DB_PASS = 'Apatkazero123';
    $DB_NAME = 'if0_41006648_ecobeep_db';
}

// Disable mysqli error reporting to prevent 500 errors
mysqli_report(MYSQLI_REPORT_OFF);

// Database connection
try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    error_log('Database connection failed: ' . $e->getMessage());
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}

// Get action
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Route to correct function
switch ($action) {
    case 'test':
        handleTest($pdo);
        break;
    case 'get_all_data':
        handleGetAllData($pdo);
        break;
    case 'get_all_vehicles':
        handleGetAllVehicles($pdo);
        break;
    case 'get_available_drivers':
        handleGetAvailableDrivers($pdo);
        break;
    case 'get_vehicle_status':
        handleGetVehicleStatus($pdo);
        break;
    case 'assign_driver':
        handleAssignDriver($pdo);
        break;
    case 'unassign_driver':
        handleUnassignDriver($pdo);
        break;
    case 'add_driver':
        handleAddDriver($pdo);
        break;
    case 'update_vehicle_status':
        handleUpdateVehicleStatus($pdo);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action: ' . $action]);
}

// ============== HANDLER FUNCTIONS ==============

function handleTest($pdo) {
    try {
        $vCount = $pdo->query("SELECT COUNT(*) FROM tbl_vehicles")->fetchColumn();
        $dCount = $pdo->query("SELECT COUNT(*) FROM tbl_drivers")->fetchColumn();
        $aCount = $pdo->query("SELECT COUNT(*) FROM tbl_vehicle_assignments WHERE va_status = 'active'")->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'vehicles' => (int)$vCount,
            'drivers' => (int)$dCount,
            'active_assignments' => (int)$aCount,
            'message' => 'API working correctly'
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleGetAllData($pdo) {
    try {
        $stats = getStats($pdo);
        $assignments = getAssignments($pdo);
        $unassignedVehicles = getUnassignedVehicles($pdo);
        $availableDrivers = getAvailableDrivers($pdo);
        
        echo json_encode([
            'success' => true,
            'stats' => $stats,
            'assignments' => $assignments,
            'unassigned_vehicles' => $unassignedVehicles,
            'available_drivers' => $availableDrivers
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleGetAllVehicles($pdo) {
    try {
        $vehicles = getAllVehiclesWithStatus($pdo);
        echo json_encode(['success' => true, 'vehicles' => $vehicles]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleGetAvailableDrivers($pdo) {
    try {
        $drivers = getAvailableDrivers($pdo);
        echo json_encode(['success' => true, 'data' => $drivers]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleGetVehicleStatus($pdo) {
    try {
        $vehicleId = isset($_GET['vehicle_id']) ? (int)$_GET['vehicle_id'] : 0;
        
        if ($vehicleId <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid vehicle ID']);
            return;
        }
        
        $status = getVehicleAssignmentStatus($pdo, $vehicleId);
        echo json_encode(['success' => true, 'data' => $status]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function handleAssignDriver($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $vehicleId = (int)$input['vehicle_id'];
        $driverId = (int)$input['driver_id'];
        $notes = isset($input['notes']) ? $input['notes'] : '';
        
        // Check if vehicle exists
        $stmt = $pdo->prepare("SELECT v_id, v_plate_number, v_status FROM tbl_vehicles WHERE v_id = ?");
        $stmt->execute([$vehicleId]);
        $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$vehicle) {
            echo json_encode(['success' => false, 'message' => 'Vehicle not found']);
            return;
        }
        
        // Check if vehicle is already assigned
        $stmt = $pdo->prepare("SELECT va_id FROM tbl_vehicle_assignments WHERE v_id = ? AND va_status = 'active'");
        $stmt->execute([$vehicleId]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Vehicle is already assigned to a driver']);
            return;
        }
        
        // Check if driver exists and is available
        $stmt = $pdo->prepare("SELECT d_id, d_first_name, d_last_name, d_full_name, d_status FROM tbl_drivers WHERE d_id = ?");
        $stmt->execute([$driverId]);
        $driver = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$driver) {
            echo json_encode(['success' => false, 'message' => 'Driver not found']);
            return;
        }
        
        if ($driver['d_status'] !== 'available') {
            echo json_encode(['success' => false, 'message' => 'Driver is not available (current status: ' . $driver['d_status'] . ')']);
            return;
        }
        
        // Check if driver is already assigned to another vehicle
        $stmt = $pdo->prepare("SELECT va_id FROM tbl_vehicle_assignments WHERE d_id = ? AND va_status = 'active'");
        $stmt->execute([$driverId]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Driver is already assigned to another vehicle']);
            return;
        }
        
        // Insert assignment
        $stmt = $pdo->prepare("INSERT INTO tbl_vehicle_assignments (v_id, d_id, va_notes, va_status, va_assigned_date) VALUES (?, ?, ?, 'active', NOW())");
        $stmt->execute([$vehicleId, $driverId, $notes]);
        
        // ✅ UPDATE DRIVER STATUS TO ASSIGNED
        $stmt = $pdo->prepare("UPDATE tbl_drivers SET d_status = 'assigned' WHERE d_id = ?");
        $stmt->execute([$driverId]);
        
        // Use full_name if available
        $driverName = $driver['d_full_name'] ?? ($driver['d_first_name'] . ' ' . $driver['d_last_name']);
        
        echo json_encode([
            'success' => true, 
            'message' => $driverName . ' assigned to ' . $vehicle['v_plate_number'] . ' successfully'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function handleUnassignDriver($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $assignmentId = (int)$input['assignment_id'];
        
        // Get assignment details before unassigning
        $stmt = $pdo->prepare("
            SELECT va.d_id, v.v_plate_number, d.d_first_name, d.d_last_name, d.d_full_name
            FROM tbl_vehicle_assignments va
            JOIN tbl_vehicles v ON va.v_id = v.v_id
            JOIN tbl_drivers d ON va.d_id = d.d_id
            WHERE va.va_id = ? AND va.va_status = 'active'
        ");
        $stmt->execute([$assignmentId]);
        $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$assignment) {
            echo json_encode(['success' => false, 'message' => 'Assignment not found or already inactive']);
            return;
        }
        
        // Mark assignment as inactive
        $stmt = $pdo->prepare("UPDATE tbl_vehicle_assignments SET va_status = 'inactive', va_unassigned_date = NOW() WHERE va_id = ?");
        $stmt->execute([$assignmentId]);
        
        // ✅ UPDATE DRIVER STATUS BACK TO AVAILABLE
        $stmt = $pdo->prepare("UPDATE tbl_drivers SET d_status = 'available' WHERE d_id = ?");
        $stmt->execute([$assignment['d_id']]);
        
        // Use full_name if available
        $driverName = $assignment['d_full_name'] ?? ($assignment['d_first_name'] . ' ' . $assignment['d_last_name']);
        
        echo json_encode([
            'success' => true, 
            'message' => $driverName . ' unassigned from ' . $assignment['v_plate_number'] . ' successfully'
        ]);
        
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

function handleAddDriver($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $firstName = trim($input['first_name']);
        $lastName = trim($input['last_name']);
        $license = trim($input['license_number']);
        $phone = isset($input['phone']) ? trim($input['phone']) : null;
        $email = isset($input['email']) ? trim($input['email']) : null;
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
        
        // Insert driver - full_name will be auto-generated by your DB
        $stmt = $pdo->prepare("INSERT INTO tbl_drivers (d_first_name, d_last_name, d_license_number, d_phone, d_email, d_date_hired, d_status) VALUES (?, ?, ?, ?, ?, ?, 'available')");
        $stmt->execute([$firstName, $lastName, $license, $phone, $email, $hired]);
        
        echo json_encode(['success' => true, 'message' => 'Driver ' . $firstName . ' ' . $lastName . ' added successfully']);
        
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo json_encode(['success' => false, 'message' => 'License number already exists']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add driver: ' . $e->getMessage()]);
        }
    }
}

function handleUpdateVehicleStatus($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $vehicleId = (int)$input['vehicle_id'];
        $status = $input['status'];
        
        $stmt = $pdo->prepare("UPDATE tbl_vehicles SET v_status = ? WHERE v_id = ?");
        $stmt->execute([$status, $vehicleId]);
        
        echo json_encode(['success' => true, 'message' => 'Vehicle status updated']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}

// ============== HELPER FUNCTIONS ==============

function getStats($pdo) {
    $stats = [
        'total_drivers' => 0,
        'available' => 0,
        'assigned' => 0,
        'on_leave' => 0,
        'inactive' => 0,
        'terminated' => 0,
        'total_vehicles' => 0,
        'vehicles_assigned' => 0,
        'vehicles_unassigned' => 0
    ];
    
    // Count drivers by status directly from d_status column
    $result = $pdo->query("SELECT d_status, COUNT(*) as count FROM tbl_drivers GROUP BY d_status")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($result as $row) {
        $stats['total_drivers'] += (int)$row['count'];
        $status = strtolower($row['d_status']);
        
        // Map status to stats array
        if ($status === 'available') {
            $stats['available'] = (int)$row['count'];
        } elseif ($status === 'assigned') {
            $stats['assigned'] = (int)$row['count'];
        } elseif ($status === 'on_leave' || $status === 'on leave') {
            $stats['on_leave'] = (int)$row['count'];
        } elseif ($status === 'terminated') {
            $stats['terminated'] = (int)$row['count'];
        } elseif ($status === 'inactive') {
            $stats['inactive'] = (int)$row['count'];
        }
    }
    
    // Count vehicles
    $stats['total_vehicles'] = (int)$pdo->query("SELECT COUNT(*) FROM tbl_vehicles")->fetchColumn();
    
    // Count assigned vehicles (with active assignments)
    $stats['vehicles_assigned'] = (int)$pdo->query("SELECT COUNT(DISTINCT v_id) FROM tbl_vehicle_assignments WHERE va_status = 'active'")->fetchColumn();
    
    $stats['vehicles_unassigned'] = $stats['total_vehicles'] - $stats['vehicles_assigned'];
    
    return $stats;
}

function getAssignments($pdo) {
    $sql = "SELECT 
                va.va_id as assignment_id,
                va.va_assigned_date as assigned_date,
                va.va_notes as notes,
                v.v_id as vehicle_id,
                v.v_plate_number as plate_number,
                v.v_model_number as model_number,
                v.v_passenger_capacity as passenger_capacity,
                v.v_status as vehicle_status,
                d.d_id as driver_id,
                d.d_first_name as first_name,
                d.d_last_name as last_name,
                d.d_full_name as driver_name,
                d.d_license_number as license_number,
                d.d_phone as phone,
                d.d_status as driver_status
            FROM tbl_vehicle_assignments va
            JOIN tbl_vehicles v ON va.v_id = v.v_id
            JOIN tbl_drivers d ON va.d_id = d.d_id
            WHERE va.va_status = 'active'
            ORDER BY va.va_assigned_date DESC";
    
    return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
}

function getUnassignedVehicles($pdo) {
    // Get vehicles that don't have an active assignment
    $sql = "SELECT 
                v.v_id as id,
                v.v_plate_number as plate_number,
                v.v_model_number as model_number,
                v.v_passenger_capacity as passenger_capacity,
                v.v_status as status
            FROM tbl_vehicles v
            LEFT JOIN tbl_vehicle_assignments va ON v.v_id = va.v_id AND va.va_status = 'active'
            WHERE va.va_id IS NULL
            ORDER BY v.v_plate_number";
    
    return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
}

function getAllVehiclesWithStatus($pdo) {
    $sql = "SELECT 
                v.v_id as id,
                v.v_plate_number as plate_number,
                v.v_model_number as model_number,
                v.v_engine_number as engine_number,
                v.v_passenger_capacity as passenger_capacity,
                v.v_or_cr as or_cr,
                v.v_status as registration_status,
                CASE 
                    WHEN va.va_id IS NOT NULL THEN 'assigned'
                    ELSE 'available'
                END as assignment_status,
                va.va_id as assignment_id,
                va.va_assigned_date as assigned_date,
                d.d_full_name as driver_name,
                d.d_license_number as driver_license,
                d.d_status as driver_status
            FROM tbl_vehicles v
            LEFT JOIN tbl_vehicle_assignments va ON v.v_id = va.v_id AND va.va_status = 'active'
            LEFT JOIN tbl_drivers d ON va.d_id = d.d_id
            ORDER BY v.v_plate_number";
    
    return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
}

function getAvailableDrivers($pdo) {
    // Get drivers that have d_status = 'available'
    $sql = "SELECT 
                d.d_id as id, 
                d.d_first_name as first_name, 
                d.d_last_name as last_name, 
                d.d_full_name as full_name, 
                d.d_license_number as license_number, 
                d.d_phone as phone, 
                d.d_email as email, 
                d.d_status as status 
            FROM tbl_drivers d
            WHERE d.d_status = 'available'
            ORDER BY d.d_first_name, d.d_last_name";
    return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
}

function getVehicleAssignmentStatus($pdo, $vehicleId) {
    $sql = "SELECT 
                v.v_id as id,
                v.v_plate_number as plate_number,
                v.v_model_number as model_number,
                v.v_status as registration_status,
                CASE 
                    WHEN va.va_id IS NOT NULL THEN 'assigned'
                    ELSE 'available'
                END as assignment_status,
                va.va_id as assignment_id,
                va.va_assigned_date as assigned_date,
                d.d_full_name as driver_name,
                d.d_license_number as driver_license,
                d.d_status as driver_status
            FROM tbl_vehicles v
            LEFT JOIN tbl_vehicle_assignments va ON v.v_id = va.v_id AND va.va_status = 'active'
            LEFT JOIN tbl_drivers d ON va.d_id = d.d_id
            WHERE v.v_id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$vehicleId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?>