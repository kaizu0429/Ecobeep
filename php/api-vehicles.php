<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// ==========================
// DATABASE CONNECTION
// ==========================
$DB_HOST = 'sql200.infinityfree.com';
$DB_USER = 'if0_41006648';
$DB_PASS = 'Apatkazero123';
$DB_NAME = 'if0_41006648_ecobeep_db';

$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);


if ($conn->connect_error) {
    echo json_encode(["error" => $conn->connect_error]);
    exit;
}

// ==========================
// GET VEHICLES
// ==========================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 1000;

    $result = $conn->query("SELECT * FROM vehicles ORDER BY id DESC LIMIT $limit");

    $vehicles = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $vehicles[] = $row;
        }
    }

    echo json_encode(["data" => $vehicles]);
    exit;
}

// ==========================
// ADD VEHICLE
// ==========================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $conn->prepare("INSERT INTO vehicles 
        (plate_number, model_number, engine_number, passenger_capacity, or_cr, status)
        VALUES (?, ?, ?, ?, ?, ?)");

    $stmt->bind_param(
        "sssiss",
        $data['plate_number'],
        $data['model_number'],
        $data['engine_number'],
        $data['passenger_capacity'],
        $data['or_cr'],
        $data['status']
    );

    if ($stmt->execute()) {
        echo json_encode(["message" => "Vehicle added successfully"]);
    } else {
        echo json_encode(["error" => $stmt->error]);
    }

    exit;
}

// ==========================
// UPDATE VEHICLE
// ==========================
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {

    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $conn->prepare("UPDATE vehicles SET
        plate_number=?,
        model_number=?,
        engine_number=?,
        passenger_capacity=?,
        or_cr=?,
        status=?
        WHERE id=?");

    $stmt->bind_param(
        "sssissi",
        $data['plate_number'],
        $data['model_number'],
        $data['engine_number'],
        $data['passenger_capacity'],
        $data['or_cr'],
        $data['status'],
        $data['id']
    );

    if ($stmt->execute()) {
        echo json_encode(["message" => "Vehicle updated successfully"]);
    } else {
        echo json_encode(["error" => $stmt->error]);
    }

    exit;
}

// ==========================
// DELETE VEHICLE
// ==========================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $conn->prepare("DELETE FROM vehicles WHERE id=?");
    $stmt->bind_param("i", $data['id']);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Vehicle deleted successfully"]);
    } else {
        echo json_encode(["error" => $stmt->error]);
    }

    exit;
}

$conn->close();
?>
