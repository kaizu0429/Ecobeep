<?php
// ============================================================
// ECOBEEP — VEHICLES API (INFINITYFREE VERSION)
// ============================================================

$DB_HOST = 'sql200.infinityfree.com';
$DB_NAME = 'if0_41006648_ecobeep_db';
$DB_USER = 'if0_41006648';
$DB_PASS = 'Apatkazero123';

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_log("API Request received: " . $_SERVER['REQUEST_METHOD'] . " " . $_SERVER['REQUEST_URI']);

// ============================================================
// Database Connection
// ============================================================
try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    error_log("Database connected successfully");
} catch (PDOException $e) {
    error_log("Database connection failed: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit;
}

// ============================================================
// CORS Headers
// ============================================================
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        
        // ==================== GET ====================
        case 'GET':
            error_log("GET request parameters: " . print_r($_GET, true));
            
            // Handle special action parameter for get_all_data
            if (isset($_GET['action']) && $_GET['action'] === 'get_all_data') {
                error_log("Fetching all data for get_all_data action");
                
                // Fetch all vehicles without pagination
                try {
                    $vehiclesStmt = $pdo->query('
                        SELECT 
                            v_id as id, 
                            v_plate_number as plate_number, 
                            v_model_number as model_number, 
                            v_engine_number as engine_number, 
                            v_passenger_capacity as passenger_capacity, 
                            v_or_cr as or_cr, 
                            v_status as status
                        FROM tbl_vehicles 
                        ORDER BY v_id ASC
                    ');
                    $vehicles = $vehiclesStmt->fetchAll();
                    error_log("Found " . count($vehicles) . " vehicles");
                } catch (PDOException $e) {
                    error_log("Error fetching vehicles: " . $e->getMessage());
                    $vehicles = [];
                }
                
                // Get maintenance history data (CORRECTED TABLE NAME)
                try {
                    $maintenanceStmt = $pdo->query('SELECT * FROM tbl_maintenance_history');
                    $maintenanceData = $maintenanceStmt->fetchAll();
                } catch (PDOException $e) {
                    error_log("Error fetching maintenance history: " . $e->getMessage());
                    $maintenanceData = [];
                }
                
                // Get vehicle maintenance data
                try {
                    $vehicleMaintenanceStmt = $pdo->query('SELECT * FROM tbl_vehicle_maintenance');
                    $vehicleMaintenance = $vehicleMaintenanceStmt->fetchAll();
                } catch (PDOException $e) {
                    error_log("Error fetching vehicle maintenance: " . $e->getMessage());
                    $vehicleMaintenance = [];
                }
                
                // Get scheduled maintenance data
                try {
                    $scheduledMaintenanceStmt = $pdo->query('SELECT * FROM tbl_scheduled_maintenance');
                    $scheduledMaintenance = $scheduledMaintenanceStmt->fetchAll();
                } catch (PDOException $e) {
                    error_log("Error fetching scheduled maintenance: " . $e->getMessage());
                    $scheduledMaintenance = [];
                }
                
                // Get driver data
                try {
                    $driverStmt = $pdo->query('SELECT * FROM tbl_drivers');
                    $drivers = $driverStmt->fetchAll();
                } catch (PDOException $e) {
                    error_log("Error fetching drivers: " . $e->getMessage());
                    $drivers = [];
                }
                
                // Get vehicle assignment data (CORRECTED TABLE NAME)
                try {
                    $assignmentStmt = $pdo->query('SELECT * FROM tbl_vehicle_assignments');
                    $assignments = $assignmentStmt->fetchAll();
                } catch (PDOException $e) {
                    error_log("Error fetching assignments: " . $e->getMessage());
                    $assignments = [];
                }
                
                // Get route data
                try {
                    $routeStmt = $pdo->query('SELECT * FROM tbl_routes');
                    $routes = $routeStmt->fetchAll();
                } catch (PDOException $e) {
                    error_log("Error fetching routes: " . $e->getMessage());
                    $routes = [];
                }
                
                $response = [
                    'success' => true,
                    'vehicles' => $vehicles,
                    'stats' => [
                        'operational' => 0,
                        'maintenance' => 0,
                        'repair' => 0,
                        'scheduled' => 0
                    ],
                    'maintenance' => $maintenanceData,
                    'vehicleMaintenance' => $vehicleMaintenance,
                    'scheduledMaintenance' => $scheduledMaintenance,
                    'drivers' => $drivers,
                    'assignments' => $assignments,
                    'routes' => $routes,
                    'upcoming' => [],
                    'history' => []
                ];
                
                error_log("Sending response with " . count($vehicles) . " vehicles");
                echo json_encode($response);
                exit;
            }
            
            // Handle single vehicle fetch by ID
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare('
                    SELECT 
                        v_id as id, 
                        v_plate_number as plate_number, 
                        v_model_number as model_number, 
                        v_engine_number as engine_number, 
                        v_passenger_capacity as passenger_capacity, 
                        v_or_cr as or_cr, 
                        v_status as status
                    FROM tbl_vehicles 
                    WHERE v_id = ?
                ');
                $stmt->execute([$_GET['id']]);
                $vehicle = $stmt->fetch();
                
                if ($vehicle) {
                    echo json_encode($vehicle);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Vehicle not found']);
                }
            } else {
                // Handle paginated vehicle list
                $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
                $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 10;
                $search = isset($_GET['search']) ? trim($_GET['search']) : '';
                $offset = ($page - 1) * $limit;
                
                $where = '';
                $params = [];
                if ($search !== '') {
                    $where = ' WHERE v_plate_number LIKE ?';
                    $params[] = '%' . $search . '%';
                }
                
                $countStmt = $pdo->prepare('SELECT COUNT(*) FROM tbl_vehicles' . $where);
                $countStmt->execute($params);
                $total = $countStmt->fetchColumn();
                
                $sql = 'SELECT v_id as id, v_plate_number as plate_number, v_model_number as model_number, 
                        v_engine_number as engine_number, v_passenger_capacity as passenger_capacity, 
                        v_or_cr as or_cr, v_status as status 
                        FROM tbl_vehicles' . $where . ' ORDER BY v_id ASC LIMIT ? OFFSET ?';
                $stmt = $pdo->prepare($sql);
                
                $i = 1;
                foreach ($params as $param) {
                    $stmt->bindValue($i++, $param);
                }
                $stmt->bindValue($i++, $limit, PDO::PARAM_INT);
                $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
                
                $stmt->execute();
                $vehicles = $stmt->fetchAll();
                
                echo json_encode([
                    'data' => $vehicles,
                    'total' => intval($total),
                    'page' => $page,
                    'limit' => $limit,
                    'total_pages' => intval(ceil($total / $limit))
                ]);
            }
            break;
        
        // ==================== POST ====================
        case 'POST':
            $input = file_get_contents('php://input');
            $body = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON']);
                exit;
            }
            
            $required = ['plate_number', 'model_number', 'engine_number', 'passenger_capacity', 'or_cr'];
            foreach ($required as $field) {
                if (!isset($body[$field]) || (trim($body[$field]) === '' && $body[$field] !== 0)) {
                    http_response_code(400);
                    echo json_encode(['error' => "$field is required"]);
                    exit;
                }
            }
            
            $status = isset($body['status']) && in_array($body['status'], ['Registered', 'Not Registered']) 
                      ? $body['status'] 
                      : 'Registered';
            
            try {
                $stmt = $pdo->prepare(
                    'INSERT INTO tbl_vehicles (v_plate_number, v_model_number, v_engine_number, v_passenger_capacity, v_or_cr, v_status) 
                     VALUES (?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([
                    trim($body['plate_number']),
                    trim($body['model_number']),
                    trim($body['engine_number']),
                    intval($body['passenger_capacity']),
                    trim($body['or_cr']),
                    $status
                ]);
                
                http_response_code(201);
                echo json_encode(['message' => 'Vehicle added successfully']);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Plate number already exists']);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to add vehicle']);
                }
            }
            break;
        
        // ==================== PUT ====================
        case 'PUT':
            $input = file_get_contents('php://input');
            $body = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON']);
                exit;
            }
            
            if (!isset($body['id']) || empty($body['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'id is required']);
                exit;
            }
            
            $status = isset($body['status']) && in_array($body['status'], ['Registered', 'Not Registered']) 
                      ? $body['status'] 
                      : 'Registered';
            
            try {
                $stmt = $pdo->prepare(
                    'UPDATE tbl_vehicles 
                     SET v_plate_number = ?, v_model_number = ?, v_engine_number = ?, 
                         v_passenger_capacity = ?, v_or_cr = ?, v_status = ? 
                     WHERE v_id = ?'
                );
                $stmt->execute([
                    trim($body['plate_number'] ?? ''),
                    trim($body['model_number'] ?? ''),
                    trim($body['engine_number'] ?? ''),
                    intval($body['passenger_capacity'] ?? 0),
                    trim($body['or_cr'] ?? ''),
                    $status,
                    intval($body['id'])
                ]);
                
                echo json_encode(['message' => 'Vehicle updated successfully']);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000) {
                    http_response_code(409);
                    echo json_encode(['error' => 'Plate number already exists']);
                } else {
                    http_response_code(500);
                    echo json_encode(['error' => 'Failed to update vehicle']);
                }
            }
            break;
        
        // ==================== DELETE ====================
        case 'DELETE':
            $input = file_get_contents('php://input');
            $body = json_decode($input, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON']);
                exit;
            }
            
            if (!isset($body['id']) || empty($body['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'id is required']);
                exit;
            }
            
            $stmt = $pdo->prepare('DELETE FROM tbl_vehicles WHERE v_id = ?');
            $stmt->execute([intval($body['id'])]);
            
            echo json_encode(['message' => 'Vehicle deleted successfully']);
            break;
        
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Server error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>