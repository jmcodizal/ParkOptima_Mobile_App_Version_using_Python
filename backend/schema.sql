CREATE DATABASE IF NOT EXISTS parkoptima_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE parkoptima_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(50) NOT NULL DEFAULT 'vehicle_owner',
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(32) NULL,
  password_hash VARCHAR(255) NULL,
  password_salt VARCHAR(255) NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  plate VARCHAR(32) NOT NULL,
  make VARCHAR(100) NULL,
  model VARCHAR(100) NULL,
  color VARCHAR(64) NULL,
  type VARCHAR(50) DEFAULT 'Car',
  registered_at DATETIME NULL,
  pin_hash VARCHAR(255) NULL,
  pin_salt VARCHAR(255) NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_vehicles_plate (plate),
  KEY idx_vehicles_owner (owner_id),
  CONSTRAINT fk_vehicles_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0.00,
  currency VARCHAR(8) DEFAULT 'PHP',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_wallets_user (user_id),
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS parking_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_uuid VARCHAR(36) NOT NULL,
  vehicle_id INT NOT NULL,
  owner_user_id INT NOT NULL,
  attendant_id INT NULL,
  start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME NULL,
  duration_seconds INT NULL,
  status ENUM('active','completed','cancelled','no_show') NOT NULL DEFAULT 'active',
  fee DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(8) DEFAULT 'PHP',
  notes VARCHAR(500) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sessions_uuid (session_uuid),
  KEY idx_sessions_status (status),
  CONSTRAINT fk_sessions_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sessions_attendant FOREIGN KEY (attendant_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_uuid VARCHAR(36) NOT NULL,
  session_id INT NULL,
  user_id INT NOT NULL,
  attendant_id INT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'PHP',
  method VARCHAR(50) DEFAULT 'cash',
  status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  reference VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_transactions_uuid (transaction_uuid),
  KEY idx_transactions_user (user_id),
  CONSTRAINT fk_transactions_session FOREIGN KEY (session_id) REFERENCES parking_sessions(id) ON DELETE SET NULL,
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_transactions_attendant FOREIGN KEY (attendant_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS owner_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_user_id INT NOT NULL,
  system_option VARCHAR(100) DEFAULT 'Parking Owner',
  motor_fee DECIMAL(10,2) DEFAULT 5.00,
  four_wheeler_fee DECIMAL(10,2) DEFAULT 20.00,
  parking_capacity INT DEFAULT 100,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_owner_settings_user (owner_user_id),
  CONSTRAINT fk_owner_settings_user FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details VARCHAR(500) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_created_at (created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO users (id, role, first_name, last_name, email, phone, password_hash, password_salt, is_active) VALUES
  (1, 'parking_owner', 'Park', 'Owner', 'owner@parkoptima.com', '09170000001', NULL, NULL, 1),
  (2, 'parking_attendant', 'Ana', 'Attendant', 'attendant@parkoptima.com', '09170000002', NULL, NULL, 1),
  (3, 'vehicle_owner', 'John', 'Doe', 'jdoe@parkoptima.com', '09170000003', NULL, NULL, 1);

INSERT IGNORE INTO owner_settings (owner_user_id, system_option, motor_fee, four_wheeler_fee, parking_capacity) VALUES
  (1, 'Parking Owner', 3.00, 30.00, 100);

INSERT IGNORE INTO vehicles (id, owner_id, plate, make, model, color, type, registered_at, pin_hash, pin_salt, is_active) VALUES
  (1, 3, 'ABC-123', 'Toyota', 'Vios', 'Silver', 'Car', NOW(), 'seed', 'seed', 1),
  (2, 3, 'XYZ-789', 'Honda', 'City', 'Black', 'Car', NOW(), 'seed', 'seed', 1);

INSERT IGNORE INTO parking_sessions (id, session_uuid, vehicle_id, owner_user_id, attendant_id, start_time, end_time, duration_seconds, status, fee, currency, notes) VALUES
  (1, 'sess-001', 1, 3, 2, DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, 7200, 'active', 20.00, 'PHP', 'Active session'),
  (2, 'sess-002', 2, 3, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 23 HOUR), 3600, 'completed', 30.00, 'PHP', 'Completed session');

INSERT IGNORE INTO transactions (id, transaction_uuid, session_id, user_id, attendant_id, amount, currency, method, status, reference, created_at) VALUES
  (1, 'txn-001', 1, 3, 2, 20.00, 'PHP', 'cash', 'completed', 'REF-001', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (2, 'txn-002', 2, 3, 2, 5.00, 'PHP', 'card', 'pending', 'REF-002', DATE_SUB(NOW(), INTERVAL 1 DAY));

INSERT IGNORE INTO audit_logs (id, user_id, role, action, details, created_at) VALUES
  (1, 1, 'parking_owner', 'Login', 'Owner logged in', NOW()),
  (2, 2, 'parking_attendant', 'Entry', 'Attendant scanned vehicle', NOW()),
  (3, 3, 'vehicle_owner', 'Vehicle registered', 'Initial vehicle registration', NOW());
