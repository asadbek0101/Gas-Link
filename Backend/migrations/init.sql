-- ============================================================
-- GasLink Fleet Management - Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'dispatcher', 'viewer')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== DRIVERS TABLE ====================
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    experience VARCHAR(100) NOT NULL,
    rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    trips INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'vacation', 'sick')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== VEHICLES TABLE ====================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'stopped')),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name VARCHAR(255),
    fuel INTEGER NOT NULL DEFAULT 100 CHECK (fuel >= 0 AND fuel <= 100),
    mileage INTEGER NOT NULL DEFAULT 0,
    last_service DATE,
    lat DECIMAL(10,6),
    lng DECIMAL(10,6),
    speed INTEGER DEFAULT 0,
    heading INTEGER DEFAULT 0,
    device_id INTEGER UNIQUE,          -- maps to MQTT deviceId field
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TRIPS TABLE ====================
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_name VARCHAR(255) NOT NULL,
    driver_name VARCHAR(255) NOT NULL,
    route VARCHAR(500) NOT NULL,
    fuel_used VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'delayed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== NOTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('warning', 'info', 'error')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== SETTINGS TABLE ====================
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL DEFAULT 'Logistics Pro LLC',
    contact_email VARCHAR(255) NOT NULL DEFAULT 'admin@logisticspro.com',
    phone VARCHAR(50) DEFAULT '+998 90 123 45 67',
    timezone VARCHAR(100) DEFAULT 'Tashkent (UTC+5)',
    speed_violation_alert BOOLEAN DEFAULT TRUE,
    geofence_exit_alert BOOLEAN DEFAULT TRUE,
    low_fuel_alert BOOLEAN DEFAULT TRUE,
    maintenance_alert BOOLEAN DEFAULT FALSE,
    shift_alert BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== DEVICE TELEMETRY TABLE ====================
-- Stores real-time IoT / MQTT payloads from field devices (gas meters, trucks, etc.)
CREATE TABLE IF NOT EXISTS device_telemetry (
    id           BIGSERIAL PRIMARY KEY,
    device_id    INTEGER NOT NULL,
    flow         DECIMAL(10,4),
    pressure     DECIMAL(10,4),
    lat          DECIMAL(10,6),
    lon          DECIMAL(10,6),
    temperature  DECIMAL(8,4),
    device_time  TIMESTAMP WITH TIME ZONE,
    received_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_telemetry_device_id   ON device_telemetry(device_id);
CREATE INDEX idx_telemetry_received_at ON device_telemetry(received_at DESC);

-- ==================== INDEXES ====================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ==================== SEED DATA ====================

-- Default admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role, status) VALUES
('Asadbek', 'admin@fleetcommand.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', 'active'),
('Jamshid Aliyev', 'jamshid@fleetcommand.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager', 'active'),
('Elena Popova', 'elena@fleetcommand.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'dispatcher', 'active'),
('Sardor Rakhimov', 'sardor@fleetcommand.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'viewer', 'inactive');

-- Seed drivers
INSERT INTO drivers (name, phone, experience, rating, trips, status) VALUES
('Алишер Усманов', '+998 90 123 45 67', '5 лет', 4.90, 142, 'active'),
('Ботир Закиров', '+998 90 987 65 43', '3 года', 4.70, 98, 'active'),
('Сардор Рахимов', '+998 90 555 44 33', '1 год', 4.20, 45, 'vacation'),
('Джамшид Каримов', '+998 90 111 22 33', '8 лет', 5.00, 210, 'active'),
('Улугбек Азизов', '+998 90 777 88 99', '2 года', 4.50, 76, 'sick'),
('Фарход Нуриев', '+998 90 444 55 66', '6 лет', 4.80, 156, 'active');

-- Seed vehicles
INSERT INTO vehicles (plate, model, status, driver_name, fuel, mileage, last_service, lat, lng, speed, heading, device_id) VALUES
('A 456 BC', 'Volvo FH16', 'active', 'Алишер Усманов', 78, 124500, '2024-01-12', 41.2870, 69.2035, 65, 45, 101),
('K 789 MH', 'MAN TGX', 'active', 'Ботир Закиров', 45, 89200, '2024-02-05', 41.2920, 69.2110, 42, 90, 102),
('E 123 KX', 'Mercedes Actros', 'maintenance', 'Сардор Рахимов', 12, 210000, '2024-02-20', 41.2800, 69.1950, 0, 0, 103),
('O 555 OO', 'Kamaz 5490', 'stopped', NULL, 90, 45000, '2024-01-15', 41.2840, 69.2150, 0, 180, 104),
('T 321 TT', 'Isuzu NPR', 'active', 'Джамшид Каримов', 65, 67800, '2024-02-10', 41.2900, 69.1980, 55, 270, 105),
('P 999 PP', 'Gazelle Next', 'active', 'Улугбек Азизов', 30, 32000, '2024-02-01', 41.2950, 69.2200, 0, 0, 106);

-- Seed trips
INSERT INTO trips (vehicle_name, driver_name, route, fuel_used, status) VALUES
('КамАЗ 65115 А456ВС', 'Иванов А.С.', 'Москва → Казань', '245 л', 'active'),
('Volvo FH16 К789МН', 'Петров В.В.', 'С.Петербург → Москва', '180 л', 'completed'),
('Scania R450 Е123КХ', 'Сидоров Д.А.', 'Екатеринбург → Пермь', '320 л', 'delayed'),
('MAN TGX О555ОО', 'Козлов М.И.', 'Новосибирск → Омск', '410 л', 'active'),
('Mercedes Actros Т321ТТ', 'Смирнов К.Л.', 'Ростов → Краснодар', '120 л', 'completed'),
('DAF XF 105 В999ВВ', 'Морозов Н.П.', 'Воронеж → Тула', '95 л', 'active');

-- Seed notifications
INSERT INTO notifications (type, title, message, is_read) VALUES
('warning', 'Превышение скорости', 'Транспорт A 456 BC превысил допустимую скорость: 95 км/ч', FALSE),
('info', 'ТО завершено', 'Техобслуживание транспорта K 789 MH успешно завершено', TRUE),
('error', 'Критический уровень топлива', 'Транспорт E 123 KX — уровень топлива критически низкий', FALSE),
('warning', 'Выход из геозоны', 'Транспорт T 321 TT покинул зону: Tashkent-Center', TRUE),
('info', 'Новый водитель', 'Добавлен новый водитель: Farhod Nuriyev', TRUE);

-- Seed settings
INSERT INTO settings (company_name, contact_email, phone, timezone) VALUES
('Logistics Pro LLC', 'admin@logisticspro.com', '+998 90 123 45 67', 'Tashkent (UTC+5)');
