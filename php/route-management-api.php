<?php
/**
 * ECOBEEP - Route Management API
 * Handles all route management operations
 */

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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
    die(json_encode(['success' => false, 'error' => 'Database connection failed']));
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'get_all_routes':
        getAllRoutes($pdo);
        break;
    case 'get_stats':
        getRouteStats($pdo);
        break;
    case 'add_route':
        addRoute($pdo);
        break;
    case 'update_route':
        updateRoute($pdo);
        break;
    case 'delete_route':
        deleteRoute($pdo);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

// Get all routes
function getAllRoutes($pdo) {
    try {
        $sql = "SELECT 
                    id,
                    route_name,
                    code,
                    distance,
                    regular_fare,
                    student_fare,
                    pwd_senior_fare,
                    status,
                    created_at,
                    updated_at
                FROM routes
                ORDER BY route_name";
        
        $stmt = $pdo->query($sql);
        $routes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'routes' => $routes
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

// Get route statistics
function getRouteStats($pdo) {
    try {
        $stats = [];
        
        // Total routes
        $stats['total_routes'] = (int)$pdo->query("SELECT COUNT(*) FROM routes")->fetchColumn();
        
        // Active routes
        $stats['active_routes'] = (int)$pdo->query("
            SELECT COUNT(*) FROM routes WHERE status = 'active'
        ")->fetchColumn();
        
        // Total distance
        $stats['total_distance'] = (float)$pdo->query("
            SELECT COALESCE(SUM(distance), 0) FROM routes WHERE status = 'active'
        ")->fetchColumn();
        
        // Average fare
        $stats['avg_fare'] = (float)$pdo->query("
            SELECT COALESCE(AVG(regular_fare), 0) FROM routes WHERE status = 'active'
        ")->fetchColumn();
        
        // Round values
        $stats['total_distance'] = round($stats['total_distance'], 2);
        $stats['avg_fare'] = round($stats['avg_fare'], 2);
        
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

// Add new route
function addRoute($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $routeName = trim($input['route_name']);
        $code = trim($input['code']);
        $distance = floatval($input['distance']);
        $regularFare = floatval($input['regular_fare']);
        $studentFare = isset($input['student_fare']) ? floatval($input['student_fare']) : 0;
        $pwdSeniorFare = isset($input['pwd_senior_fare']) ? floatval($input['pwd_senior_fare']) : 0;
        $status = isset($input['status']) ? $input['status'] : 'active';
        
        if (empty($routeName) || empty($code)) {
            echo json_encode(['success' => false, 'message' => 'Route name and code are required']);
            return;
        }
        
        if ($distance <= 0) {
            echo json_encode(['success' => false, 'message' => 'Distance must be greater than 0']);
            return;
        }
        
        if ($regularFare <= 0) {
            echo json_encode(['success' => false, 'message' => 'Regular fare must be greater than 0']);
            return;
        }
        
        // Check for duplicate code
        $stmt = $pdo->prepare("SELECT id FROM routes WHERE code = ?");
        $stmt->execute([$code]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Route code already exists']);
            return;
        }
        
        $sql = "INSERT INTO routes (route_name, code, distance, regular_fare, student_fare, pwd_senior_fare, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $routeName,
            $code,
            $distance,
            $regularFare,
            $studentFare,
            $pwdSeniorFare,
            $status
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Route "' . $routeName . '" added successfully'
        ]);
        
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo json_encode(['success' => false, 'message' => 'Route code already exists']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add route: ' . $e->getMessage()]);
        }
    }
}

// Update route
function updateRoute($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $routeId = (int)$input['id'];
        $routeName = trim($input['route_name']);
        $code = trim($input['code']);
        $distance = floatval($input['distance']);
        $regularFare = floatval($input['regular_fare']);
        $studentFare = isset($input['student_fare']) ? floatval($input['student_fare']) : 0;
        $pwdSeniorFare = isset($input['pwd_senior_fare']) ? floatval($input['pwd_senior_fare']) : 0;
        $status = isset($input['status']) ? $input['status'] : 'active';
        
        if (empty($routeName) || empty($code)) {
            echo json_encode(['success' => false, 'message' => 'Route name and code are required']);
            return;
        }
        
        if ($distance <= 0) {
            echo json_encode(['success' => false, 'message' => 'Distance must be greater than 0']);
            return;
        }
        
        if ($regularFare <= 0) {
            echo json_encode(['success' => false, 'message' => 'Regular fare must be greater than 0']);
            return;
        }
        
        // Check if route exists
        $stmt = $pdo->prepare("SELECT route_name FROM routes WHERE id = ?");
        $stmt->execute([$routeId]);
        $existingRoute = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingRoute) {
            echo json_encode(['success' => false, 'message' => 'Route not found']);
            return;
        }
        
        // Check for duplicate code (excluding current route)
        $stmt = $pdo->prepare("SELECT id FROM routes WHERE code = ? AND id != ?");
        $stmt->execute([$code, $routeId]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Route code already exists']);
            return;
        }
        
        $sql = "UPDATE routes 
                SET route_name = ?, 
                    code = ?, 
                    distance = ?, 
                    regular_fare = ?, 
                    student_fare = ?, 
                    pwd_senior_fare = ?, 
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $routeName,
            $code,
            $distance,
            $regularFare,
            $studentFare,
            $pwdSeniorFare,
            $status,
            $routeId
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Route "' . $routeName . '" updated successfully'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update route: ' . $e->getMessage()
        ]);
    }
}

// Delete route
function deleteRoute($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $routeId = (int)$input['id'];
        
        // Get route name before deleting
        $stmt = $pdo->prepare("SELECT route_name FROM routes WHERE id = ?");
        $stmt->execute([$routeId]);
        $route = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$route) {
            echo json_encode(['success' => false, 'message' => 'Route not found']);
            return;
        }
        
        $stmt = $pdo->prepare("DELETE FROM routes WHERE id = ?");
        $stmt->execute([$routeId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Route "' . $route['route_name'] . '" deleted successfully'
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to delete route: ' . $e->getMessage()
        ]);
    }
}
?>