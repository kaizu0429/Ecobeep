<?php
/**
 * ECOBEEP - Jeep Status API
 * Connects to your existing vehicles table
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Allow CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration - UPDATE THESE TO MATCH YOUR SETUP
$host = 'localhost';
$dbname = 'ecobeep_db';  // Change this to your database name
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}
{
 // InfinityFree
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');

    $DB_HOST = 'sql303.infinityfree.com';
    $DB_USER = 'if0_41006648';
    $DB_PASS = 'Apatkazero123';
    $DB_NAME = 'if0_41006648_ecobeep_db';
}

// Some hosts enable mysqli exceptions globally; disable to avoid hard HTTP 500s.
mysqli_report(MYSQLI_REPORT_OFF);

$conn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if ($conn->connect_error) {
    error_log('DB connection failed: ' . $conn->connect_error);
}

if (!$conn->connect_error) {
    $conn->set_charset('utf8mb4');
}

// Check if maintenance tables exist, if not create them
function ensureTablesExist($pdo) {
    // Check if vehicle_maintenance table exists
    $result = $pdo->query("SHOW TABLES LIKE 'vehicle_maintenance'");
    if ($result->rowCount() == 0) {
        // Create vehicle_maintenance table
        $pdo->exec("
            CREATE TABLE vehicle_maintenance (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                last_service_date DATE DEFAULT NULL,
                next_service_date DATE DEFAULT NULL,
                health_percentage INT DEFAULT 100,
                maintenance_status VARCHAR(50) DEFAULT 'Operational',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_vehicle (vehicle_id)
            )
        ");
    }
    
    // Check if scheduled_maintenance table exists
    $result = $pdo->query("SHOW TABLES LIKE 'scheduled_maintenance'");
    if ($result->rowCount() == 0) {
        $pdo->exec("
            CREATE TABLE scheduled_maintenance (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                maintenance_type VARCHAR(50) NOT NULL,
                scheduled_date DATE NOT NULL,
                estimated_cost DECIMAL(10, 2) DEFAULT 0.00,
                description TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }
    
    // Check if maintenance_history table exists
    $result = $pdo->query("SHOW TABLES LIKE 'maintenance_history'");
    if ($result->rowCount() == 0) {
        $pdo->exec("
            CREATE TABLE maintenance_history (
                id INT PRIMARY KEY AUTO_INCREMENT,
                vehicle_id INT NOT NULL,
                maintenance_type VARCHAR(50) NOT NULL,
                service_date DATE NOT NULL,
                cost DECIMAL(10, 2) DEFAULT 0.00,
                service_provider VARCHAR(100),
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }
}

// Ensure tables exist
try {
    ensureTablesExist($pdo);
} catch (Exception $e) {
    // Tables might already exist or there's a permission issue
}

/**
 * Get all vehicles with maintenance status
 */
function getVehiclesWithMaintenance($pdo) {
    // First, check if vehicles table exists and get its structure
    try {
        $sql = "SELECT 
                    v.id,
                    v.plate_number,
                    v.model_number,
                    v.engine_number,
                    v.passenger_capacity,
                    v.or_cr,
                    v.status as registration_status,
                    v.created_at,
                    v.updated_at,
                    COALESCE(m.last_service_date, NULL) as last_service_date,
                    COALESCE(m.next_service_date, NULL) as next_service_date,
                    COALESCE(m.health_percentage, 100) as health_percentage,
                    COALESCE(m.maintenance_status, 'Operational') as maintenance_status
                FROM vehicles v
                LEFT JOIN vehicle_maintenance m ON v.id = m.vehicle_id
                ORDER BY v.id ASC";
        
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
        // Count total vehicles as operational by default
        $sql = "SELECT COUNT(*) as total FROM vehicles";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get counts from maintenance table
        $sql = "SELECT 
                    COALESCE(m.maintenance_status, 'Operational') as status,
                    COUNT(*) as count
                FROM vehicles v
                LEFT JOIN vehicle_maintenance m ON v.id = m.vehicle_id
                GROUP BY COALESCE(m.maintenance_status, 'Operational')";
        
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
        
        // Count scheduled maintenance
        $sql = "SELECT COUNT(*) as count FROM scheduled_maintenance 
                WHERE scheduled_date >= CURDATE() 
                AND scheduled_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                AND status = 'pending'";
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
 * Get upcoming maintenance
 */
function getUpcomingMaintenance($pdo, $limit = 5) {
    try {
        $sql = "SELECT 
                    sm.id,
                    sm.vehicle_id,
                    sm.maintenance_type,
                    sm.scheduled_date,
                    sm.estimated_cost,
                    sm.description,
                    v.plate_number,
                    v.model_number
                FROM scheduled_maintenance sm
                JOIN vehicles v ON sm.vehicle_id = v.id
                WHERE sm.scheduled_date >= CURDATE()
                AND sm.status = 'pending'
                ORDER BY sm.scheduled_date ASC
                LIMIT " . (int)$limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        return [];
    }
}

/**
 * Get maintenance history
 */
function getMaintenanceHistory($pdo, $limit = 5) {
    try {
        $sql = "SELECT 
                    mh.id,
                    mh.vehicle_id,
                    mh.maintenance_type,
                    mh.service_date,
                    mh.cost,
                    mh.service_provider,
                    mh.notes,
                    v.plate_number,
                    v.model_number
                FROM maintenance_history mh
                JOIN vehicles v ON mh.vehicle_id = v.id
                ORDER BY mh.service_date DESC
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
    $sql = "SELECT id FROM vehicles WHERE plate_number = :plate";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':plate' => $plate]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result ? $result['id'] : null;
}

/**
 * Add maintenance record
 */
function addMaintenanceRecord($pdo, $data) {
    try {
        $vehicleId = getVehicleIdByPlate($pdo, $data['vehicle']);
        if (!$vehicleId) {
            return ['success' => false, 'message' => 'Vehicle not found'];
        }
        
        $sql = "INSERT INTO maintenance_history 
                (vehicle_id, maintenance_type, service_date, cost, service_provider, notes, created_at)
                VALUES (:vehicle_id, :type, :service_date, :cost, :provider, :notes, NOW())";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':vehicle_id' => $vehicleId,
            ':type' => $data['type'],
            ':service_date' => $data['service_date'],
            ':cost' => $data['cost'],
            ':provider' => $data['provider'] ?? '',
            ':notes' => $data['notes'] ?? ''
        ]);
        
        // Update or insert vehicle maintenance status
        $sql = "INSERT INTO vehicle_maintenance (vehicle_id, last_service_date, next_service_date, health_percentage, maintenance_status)
                VALUES (:vehicle_id, :last_service, DATE_ADD(:last_service2, INTERVAL 30 DAY), 100, 'Operational')
                ON DUPLICATE KEY UPDATE 
                    last_service_date = :last_service3,
                    next_service_date = DATE_ADD(:last_service4, INTERVAL 30 DAY),
                    health_percentage = 100,
                    maintenance_status = 'Operational'";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':vehicle_id' => $vehicleId,
            ':last_service' => $data['service_date'],
            ':last_service2' => $data['service_date'],
            ':last_service3' => $data['service_date'],
            ':last_service4' => $data['service_date']
        ]);
        
        return ['success' => true, 'message' => 'Maintenance record added successfully'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}

/**
 * Schedule maintenance
 */
function scheduleMaintenance($pdo, $data) {
    try {
        $vehicleId = getVehicleIdByPlate($pdo, $data['vehicle']);
        if (!$vehicleId) {
            return ['success' => false, 'message' => 'Vehicle not found'];
        }
        
        $sql = "INSERT INTO scheduled_maintenance 
                (vehicle_id, maintenance_type, scheduled_date, estimated_cost, description, status, created_at)
                VALUES (:vehicle_id, :type, :scheduled_date, :cost, :description, 'pending', NOW())";
        
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
 * Update vehicle maintenance status
 */
function updateVehicleStatus($pdo, $data) {
    try {
        $vehicleId = getVehicleIdByPlate($pdo, $data['vehicle']);
        if (!$vehicleId) {
            return ['success' => false, 'message' => 'Vehicle not found'];
        }
        
        $sql = "INSERT INTO vehicle_maintenance (vehicle_id, maintenance_status, health_percentage)
                VALUES (:vehicle_id, :status, :health)
                ON DUPLICATE KEY UPDATE 
                    maintenance_status = :status2,
                    health_percentage = :health2";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':vehicle_id' => $vehicleId,
            ':status' => $data['status'],
            ':health' => $data['health'] ?? 100,
            ':status2' => $data['status'],
            ':health2' => $data['health'] ?? 100
        ]);
        
        return ['success' => true, 'message' => 'Status updated successfully'];
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
        // Test endpoint to check database connection
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM vehicles");
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
            'message' => 'Invalid action. Use: get_vehicles, get_stats, get_upcoming, get_history, get_all_data, add_maintenance, schedule_maintenance, update_status, test'
        ]);
}
?>