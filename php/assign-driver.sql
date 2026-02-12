-- ============================================
-- ECOBEEP - ASSIGN DRIVER DATABASE SCHEMA
-- ============================================

-- 1. Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) GENERATED ALWAYS AS (CONCAT(first_name, ' ', last_name)) STORED,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available', -- available, assigned, on_leave, suspended
    date_hired DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create vehicle_assignments table
CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    assigned_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    unassigned_date DATETIME NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, completed
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    INDEX idx_vehicle_status (vehicle_id, status),
    INDEX idx_driver_status (driver_id, status)
);

-- 3. Insert sample drivers (for testing)
INSERT INTO drivers (first_name, last_name, license_number, phone, email, status, date_hired) VALUES
('Juan', 'Dela Cruz', 'DL-001-2024', '0912-345-6789', 'juan.delacruz@email.com', 'available', '2024-01-15'),
('Pedro', 'Santos', 'DL-002-2024', '0923-456-7890', 'pedro.santos@email.com', 'available', '2024-02-01'),
('Maria', 'Garcia', 'DL-003-2024', '0934-567-8901', 'maria.garcia@email.com', 'available', '2024-01-20'),
('Jose', 'Reyes', 'DL-004-2024', '0945-678-9012', 'jose.reyes@email.com', 'available', '2024-03-01'),
('Ana', 'Torres', 'DL-005-2024', '0956-789-0123', 'ana.torres@email.com', 'on_leave', '2023-12-10'),
('Carlos', 'Lopez', 'DL-006-2024', '0967-890-1234', 'carlos.lopez@email.com', 'available', '2024-01-05');

-- ============================================
-- VIEWS FOR EASY QUERYING
-- ============================================

-- View: Current active assignments with vehicle and driver details
CREATE OR REPLACE VIEW active_assignments AS
SELECT 
    va.id as assignment_id,
    va.vehicle_id,
    v.plate_number,
    v.model_number,
    va.driver_id,
    d.full_name as driver_name,
    d.phone as driver_phone,
    d.license_number,
    va.assigned_date,
    va.notes,
    TIMESTAMPDIFF(HOUR, va.assigned_date, NOW()) as hours_assigned
FROM vehicle_assignments va
JOIN vehicles v ON va.vehicle_id = v.id
JOIN drivers d ON va.driver_id = d.id
WHERE va.status = 'active'
ORDER BY va.assigned_date DESC;

-- View: Available (unassigned) vehicles
CREATE OR REPLACE VIEW available_vehicles AS
SELECT 
    v.id,
    v.plate_number,
    v.model_number,
    v.engine_number,
    v.passenger_capacity,
    v.status
FROM vehicles v
WHERE NOT EXISTS (
    SELECT 1 FROM vehicle_assignments va 
    WHERE va.vehicle_id = v.id 
    AND va.status = 'active'
)
ORDER BY v.plate_number;

-- View: Available drivers
CREATE OR REPLACE VIEW available_drivers AS
SELECT 
    d.id,
    d.full_name,
    d.first_name,
    d.last_name,
    d.license_number,
    d.phone,
    d.email,
    d.date_hired,
    DATEDIFF(NOW(), d.date_hired) as days_employed
FROM drivers d
WHERE d.status = 'available'
ORDER BY d.full_name;

-- ============================================
-- USEFUL QUERIES (for reference)
-- ============================================

/*
-- Get all active assignments
SELECT * FROM active_assignments;

-- Get unassigned vehicles
SELECT * FROM available_vehicles;

-- Get available drivers
SELECT * FROM available_drivers;

-- Get driver statistics
SELECT 
    status,
    COUNT(*) as count
FROM drivers
GROUP BY status;

-- Get vehicle assignment statistics  
SELECT 
    COUNT(*) as total_vehicles,
    SUM(CASE WHEN va.id IS NOT NULL THEN 1 ELSE 0 END) as assigned,
    SUM(CASE WHEN va.id IS NULL THEN 1 ELSE 0 END) as unassigned
FROM vehicles v
LEFT JOIN vehicle_assignments va ON v.id = va.vehicle_id AND va.status = 'active';
*/