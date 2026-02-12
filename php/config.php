<?php
// =====================================================
//  DATABASE CONFIGURATION
//  For InfinityFree Hosting
// =====================================================

// Database connection settings
// IMPORTANT: Replace these with your InfinityFree database credentials
    $DB_HOST = 'sql200.infinityfree.com';
    $DB_USER = 'if0_41006648';
    $DB_PASS = 'Apatkazero123';
    $DB_NAME = 'if0_41006648_ecobeep_db';

// Create database connection
function getDBConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        // Check connection
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        // Set charset to utf8mb4 for proper character encoding
        $conn->set_charset("utf8mb4");
        
        return $conn;
    } catch (Exception $e) {
        // Log error (don't expose sensitive info to users)
        error_log("Database Connection Error: " . $e->getMessage());
        return null;
    }
}

// Close database connection
function closeDBConnection($conn) {
    if ($conn) {
        $conn->close();
    }
}

// Sanitize input to prevent SQL injection
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Generate unique transaction code
function generateTransactionCode() {
    return 'TXN-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
}

// Format currency for display
function formatCurrency($amount) {
    return '₱ ' . number_format($amount, 2);
}

// Set timezone
date_default_timezone_set('Asia/Manila');

// Enable error reporting for development (disable in production)
// ini_set('display_errors', 1);
// error_reporting(E_ALL);

// For production, use this instead:
ini_set('display_errors', 0);
error_reporting(0);
?>
