<?php
/**
 * ECOBEEP - Jeep Status API
 * InfinityFree Compatible Version
 */

// Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
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

try {
    $pdo = new PDO("mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4", $DB_USER, $DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

/**
 * Get all vehicles with maintenance status from tbl_vehicle_maintenance
 */
function getVehiclesWithMaintenance($pdo) {
    try {
        $sql = "SELECT 
                    v.v_id as id,
                    v.v_plate_number as plate_number,
                    v.v_model_number as model_number,
                    v.v_engine_number as engine_number,
                    v.v_passenger_capacity as passenger_capacity,
                    v.v_or_cr as or_cr,
                    v.v_status as registration_status,
                    v.v_created_at as created_at,
                    v.v_updated_at as updated_at,
                    COALESCE(vm.vm_last_service_date, NULL) as last_service_date,
                    COALESCE(vm.vm_next_service_date, NULL) as next_service_date,
                    COALESCE(vm.vm_health_percentage, 100) as health_percentage,
                    COALESCE(vm.vm_maintenance_status, 'Operational') as maintenance_status,
                    COALESCE(vm.vm_current_mileage, 0) as current_mileage
                FROM tbl_vehicles v
                LEFT JOIN tbl_vehicle_maintenance vm ON v.v_id = vm.v_id
                ORDER BY v.v_id ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

/**
 * Get maintenance statistics
 */
function getMaintenanceStats($pdo) {
    $stats = [
        'operational' => 0,
        'maintenance' => 0,
        'repair' => 0,
        'scheduled' => 0
    ];
    
    try {
        // Count total vehicles
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM tbl_vehicles");
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get counts from tbl_vehicle_maintenance
        $sql = "SELECT 
                    COALESCE(vm.vm_maintenance_status, 'Operational') as status,
                    COUNT(*) as count
                FROM tbl_vehicles v
                LEFT JOIN tbl_vehicle_maintenance vm ON v.v_id = vm.v_id
                GROUP BY COALESCE(vm.vm_maintenance_status, 'Operational')";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($results as $row) {
            $status = strtolower($row['status']);
            if (strpos($status, 'operational') !== false) {
                $stats['operational'] = (int)$row['count'];
            } elseif (strpos($status, 'maintenance') !== false) {
                $stats['maintenance'] = (int)$row['count'];
            } elseif (strpos($status, 'repair') !== false) {
                $stats['repair'] = (int)$row['count'];
            }
        }
        
        // If no maintenance records, all vehicles are operational
        if ($stats['operational'] == 0 && $stats['maintenance'] == 0 && $stats['repair'] == 0) {
            $stats['operational'] = $total;
        }
        
        // Count scheduled maintenance from tbl_scheduled_maintenance
        $sql = "SELECT COUNT(*) as count 
                FROM tbl_scheduled_maintenance 
                WHERE sm_scheduled_date >= CURDATE() 
                AND sm_scheduled_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                AND sm_status = 'pending'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['scheduled'] = (int)($result['count'] ?? 0);
        
    } catch (Exception $e) {
        // If error, return zeros
    }
    
    return $stats;
}

/**
 * Get upcoming maintenance from tbl_scheduled_maintenance
 */
function getUpcomingMaintenance($pdo, $limit = 5) {
    try {
        $sql = "SELECT 
                    sm.sm_id as id,
                    sm.v_id as vehicle_id,
                    sm.sm_maintenance_type as maintenance_type,
                    sm.sm_scheduled_date as scheduled_date,
                    sm.sm_estimated_cost as estimated_cost,
                    sm.sm_description as description,
                    v.v_plate_number as plate_number,
                    v.v_model_number as model_number
                FROM tbl_scheduled_maintenance sm
                JOIN tbl_vehicles v ON sm.v_id = v.v_id
                WHERE sm.sm_scheduled_date >= CURDATE()
                AND sm.sm_status = 'pending'
                ORDER BY sm.sm_scheduled_date ASC
                LIMIT " . (int)$limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        return [];
    }
}

/**
 * Get maintenance history from tbl_maintenance_history
 */
function getMaintenanceHistory($pdo, $limit = 5) {
    try {
        $sql = "SELECT 
                    mh.mh_id as id,
                    mh.v_id as vehicle_id,
                    mh.mh_maintenance_type as maintenance_type,
                    mh.mh_service_date as service_date,
                    mh.mh_cost as cost,
                    mh.mh_service_provider as service_provider,
                    mh.mh_notes as notes,
                    v.v_plate_number as plate_number,
                    v.v_model_number as model_number
                FROM tbl_maintenance_history mh
                JOIN tbl_vehicles v ON mh.v_id = v.v_id
                ORDER BY mh.mh_service_date DESC
                LIMIT " . (int)$limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        return [];
    }
}

/**
 * Get vehicle ID by plate number
 */
function getVehicleIdByPlate($pdo, $plate) {
    $sql = "SELECT v_id as id FROM tbl_vehicles WHERE v_plate_number = :plate";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':plate' => $plate]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result ? $result['id'] : null;
}

/**
 * Add maintenance record to tbl_maintenance_history
 */
function addMaintenanceRecord($pdo, $data) {
    try {
        $vehicleId = getVehicleIdByPlate($pdo, $data['vehicle']);
        if (!$vehicleId) {
            return ['success' => false, 'message' => 'Vehicle not found'];
        }
        
        // Insert into tbl_maintenance_history
        $sql = "INSERT INTO tbl_maintenance_history 
                (v_id, mh_maintenance_type, mh_service_date, mh_cost, mh_service_provider, mh_notes)
                VALUES (:vehicle_id, :type, :service_date, :cost, :provider, :notes)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':vehicle_id' => $vehicleId,
            ':type' => $data['type'],
            ':service_date' => $data['service_date'],
            ':cost' => $data['cost'],
            ':provider' => $data['provider'] ?? '',
            ':notes' => $data['notes'] ?? ''
        ]);
        
        // Update or create tbl_vehicle_maintenance record
        $checkSql = "SELECT vm_id FROM tbl_vehicle_maintenance WHERE v_id = :vehicle_id";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([':vehicle_id' => $vehicleId]);
        $exists = $checkStmt->fetch();
        
        if ($exists) {
            // Update existing record
            $sql = "UPDATE tbl_vehicle_maintenance 
                    SET vm_last_service_date = :last_service,
                        vm_next_service_date = DATE_ADD(:last_service2, INTERVAL 30 DAY),
                        vm_health_percentage = 100,
                        vm_maintenance_status = 'Operational'
                    WHERE v_id = :vehicle_id";
        } else {
            // Create new record
            $sql = "INSERT INTO tbl_vehicle_maintenance 
                    (v_id, vm_last_service_date, vm_next_service_date, vm_health_percentage, vm_maintenance_status)
                    VALUES (:vehicle_id, :last_service, DATE_ADD(:last_service2, INTERVAL 30 DAY), 100, 'Operational')";
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':vehicle_id' => $vehicleId,
            ':last_service' => $data['service_date'],
            ':last_service2' => $data['service_date']
        ]);
        
        return ['success' => true, 'message' => 'Maintenance record added successfully'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

/**
 * Schedule maintenance in tbl_scheduled_maintenance
 */
function scheduleMaintenance($pdo, $data) {
    try {
        $vehicleId = getVehicleIdByPlate($pdo, $data['vehicle']);
        if (!$vehicleId) {
            return ['success' => false, 'message' => 'Vehicle not found'];
        }
        
        $sql = "INSERT INTO tbl_scheduled_maintenance 
                (v_id, sm_maintenance_type, sm_scheduled_date, sm_estimated_cost, sm_description, sm_status)
                VALUES (:vehicle_id, :type, :scheduled_date, :cost, :description, 'pending')";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':vehicle_id' => $vehicleId,
            ':type' => $data['type'],
            ':scheduled_date' => $data['scheduled_date'],
            ':cost' => $data['cost'] ?? 0,
            ':description' => $data['description'] ?? ''
        ]);
        
        return ['success' => true, 'message' => 'Maintenance scheduled successfully'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

/**
 * Update vehicle maintenance status in tbl_vehicle_maintenance
 */
function updateVehicleStatus($pdo, $data) {
    try {
        $vehicleId = getVehicleIdByPlate($pdo, $data['vehicle']);
        if (!$vehicleId) {
            return ['success' => false, 'message' => 'Vehicle not found'];
        }
        
        // Check if record exists
        $checkSql = "SELECT vm_id FROM tbl_vehicle_maintenance WHERE v_id = :vehicle_id";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([':vehicle_id' => $vehicleId]);
        $exists = $checkStmt->fetch();
        
        if ($exists) {
            // Update existing
            $sql = "UPDATE tbl_vehicle_maintenance 
                    SET vm_maintenance_status = :status,
                        vm_health_percentage = :health
                    WHERE v_id = :vehicle_id";
        } else {
            // Create new
            $sql = "INSERT INTO tbl_vehicle_maintenance 
                    (v_id, vm_maintenance_status, vm_health_percentage)
                    VALUES (:vehicle_id, :status, :health)";
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':vehicle_id' => $vehicleId,
            ':status' => $data['status'],
            ':health' => $data['health'] ?? 100
        ]);
        
        return ['success' => true, 'message' => 'Status updated successfully'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

/**
 * Delete scheduled maintenance from tbl_scheduled_maintenance
 */
function deleteScheduledMaintenance($pdo, $data) {
    try {
        $scheduleId = $data['schedule_id'];
        
        if (!$scheduleId) {
            return ['success' => false, 'message' => 'Schedule ID is required'];
        }
        
        $sql = "DELETE FROM tbl_scheduled_maintenance WHERE sm_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $scheduleId]);
        
        return ['success' => true, 'message' => 'Scheduled maintenance deleted successfully'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

// Handle requests
$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'get_vehicles':
        $vehicles = getVehiclesWithMaintenance($pdo);
        if (isset($vehicles['error'])) {
            echo json_encode(['success' => false, 'message' => $vehicles['error']]);
        } else {
            echo json_encode(['success' => true, 'data' => $vehicles]);
        }
        break;
        
    case 'get_stats':
        echo json_encode(['success' => true, 'data' => getMaintenanceStats($pdo)]);
        break;
        
    case 'get_upcoming':
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
        echo json_encode(['success' => true, 'data' => getUpcomingMaintenance($pdo, $limit)]);
        break;
        
    case 'get_history':
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
        echo json_encode(['success' => true, 'data' => getMaintenanceHistory($pdo, $limit)]);
        break;
        
    case 'add_maintenance':
        $input = json_decode(file_get_contents('php://input'), true);
        echo json_encode(addMaintenanceRecord($pdo, $input));
        break;
        
    case 'schedule_maintenance':
        $input = json_decode(file_get_contents('php://input'), true);
        echo json_encode(scheduleMaintenance($pdo, $input));
        break;
        
    case 'update_status':
        $input = json_decode(file_get_contents('php://input'), true);
        echo json_encode(updateVehicleStatus($pdo, $input));
        break;
        
    case 'delete_scheduled':
        $input = json_decode(file_get_contents('php://input'), true);
        echo json_encode(deleteScheduledMaintenance($pdo, $input));
        break;
        
    case 'get_all_data':
        $vehicles = getVehiclesWithMaintenance($pdo);
        if (isset($vehicles['error'])) {
            echo json_encode(['success' => false, 'message' => $vehicles['error']]);
        } else {
            echo json_encode([
                'success' => true,
                'vehicles' => $vehicles,
                'stats' => getMaintenanceStats($pdo),
                'upcoming' => getUpcomingMaintenance($pdo),
                'history' => getMaintenanceHistory($pdo)
            ]);
        }
        break;
        
    case 'test':
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM tbl_vehicles");
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode([
                'success' => true, 
                'message' => 'Database connected successfully',
                'vehicle_count' => $result['count']
            ]);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
        
    default:
        echo json_encode([
            'success' => false, 
            'message' => 'Invalid action'
        ]);
}
?>