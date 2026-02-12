-- =====================================================
-- ECOBEEP - Maintenance Tables Setup
-- Run this SQL to add maintenance tracking to your existing database
-- This works with your existing 'vehicles' table
-- =====================================================

-- Vehicle Maintenance Status Table
-- Links to your existing vehicles table
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    last_service_date DATE DEFAULT NULL,
    next_service_date DATE DEFAULT NULL,
    health_percentage INT DEFAULT 100,
    maintenance_status ENUM('Operational', 'Maintenance', 'Repair', 'Inspection') DEFAULT 'Operational',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vehicle (vehicle_id)
);

-- Scheduled Maintenance Table
CREATE TABLE IF NOT EXISTS scheduled_maintenance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    scheduled_date DATE NOT NULL,
    estimated_cost DECIMAL(10, 2) DEFAULT 0.00,
    description TEXT,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Maintenance History Table
CREATE TABLE IF NOT EXISTS maintenance_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,
    cost DECIMAL(10, 2) DEFAULT 0.00,
    service_provider VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_scheduled_maintenance_date ON scheduled_maintenance(scheduled_date);
CREATE INDEX idx_scheduled_maintenance_status ON scheduled_maintenance(status);
CREATE INDEX idx_maintenance_history_date ON maintenance_history(service_date);
CREATE INDEX idx_maintenance_history_vehicle ON maintenance_history(vehicle_id);

-- =====================================================
-- Insert sample maintenance data for your existing vehicle
-- (Mitsubishi - plate number from your screenshot)
-- =====================================================

-- First, let's add maintenance status for your existing vehicle
-- Replace '1' with the actual ID if different
INSERT INTO vehicle_maintenance (vehicle_id, last_service_date, next_service_date, health_percentage, maintenance_status)
SELECT id, '2026-01-15', '2026-02-15', 85, 'Operational'
FROM vehicles 
WHERE plate_number LIKE '%Mitsubushi%' OR model_number LIKE '%Mitsubushi%'
ON DUPLICATE KEY UPDATE health_percentage = 85;

-- Add some sample scheduled maintenance
INSERT INTO scheduled_maintenance (vehicle_id, maintenance_type, scheduled_date, estimated_cost, description, status)
SELECT id, 'Oil Change', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 1200.00, 'Regular oil and filter change', 'pending'
FROM vehicles LIMIT 1;

INSERT INTO scheduled_maintenance (vehicle_id, maintenance_type, scheduled_date, estimated_cost, description, status)
SELECT id, 'Tire Rotation', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 800.00, 'Rotate all tires', 'pending'
FROM vehicles LIMIT 1;

-- Add some sample maintenance history
INSERT INTO maintenance_history (vehicle_id, maintenance_type, service_date, cost, service_provider, notes)
SELECT id, 'Engine Tune-up', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 3500.00, 'AutoCare Center', 'Complete engine tune-up'
FROM vehicles LIMIT 1;

INSERT INTO maintenance_history (vehicle_id, maintenance_type, service_date, cost, service_provider, notes)
SELECT id, 'Oil Change', DATE_SUB(CURDATE(), INTERVAL 15 DAY), 1200.00, 'Quick Lube Shop', 'Oil and filter replacement'
FROM vehicles LIMIT 1;