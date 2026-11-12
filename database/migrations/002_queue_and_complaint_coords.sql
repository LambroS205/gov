-- ====================================================================
-- Migration: 002_queue_and_complaint_coords.sql
-- Thêm bảng Hàng đợi Bốc số (Queue) và Tọa độ Phản ánh Hiện trường (GIS)
-- Đơn vị: UBND Phường Yên Bái (YenBai eWard-Gov)
-- ====================================================================

USE yenbai_egov;

-- 1. Bảng Phiếu bốc số thứ tự Một cửa (Queue Tickets)
CREATE TABLE IF NOT EXISTS queue_tickets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(10) NOT NULL,
    counter_type ENUM('HO_TICH', 'CHUNG_THUC', 'DIA_CHINH', 'LAO_DONG_TBXH', 'KHAC') NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    citizen_name VARCHAR(100) NULL,
    citizen_phone VARCHAR(15) NULL,
    counter_no INT UNSIGNED DEFAULT 1,
    status ENUM('CHO', 'DANG_GOI', 'DA_PHUC_VU', 'BO_QUA') NOT NULL DEFAULT 'CHO',
    called_by CHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    called_at DATETIME NULL,
    completed_at DATETIME NULL,
    CONSTRAINT fk_queue_user FOREIGN KEY (called_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_queue_status (status),
    INDEX idx_queue_created (created_at),
    INDEX idx_queue_type (counter_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bổ sung trường tọa độ GIS vào bảng complaints (nếu chưa có)
ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL AFTER location,
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL AFTER latitude;

-- 3. Cập nhật tọa độ thực tế tại khu vực UBND Phường Yên Bái cho các phản ánh hiện có
UPDATE complaints
SET latitude = 21.716800, longitude = 104.896500
WHERE complaint_code = 'PA-2610-001' AND latitude IS NULL;

UPDATE complaints
SET latitude = 21.718200, longitude = 104.899200
WHERE complaint_code = 'PA-2610-002' AND latitude IS NULL;

UPDATE complaints
SET latitude = 21.714500, longitude = 104.893100
WHERE complaint_code = 'PA-2610-003' AND latitude IS NULL;

UPDATE complaints
SET latitude = 21.720100, longitude = 104.901500
WHERE complaint_code = 'PA-2610-004' AND latitude IS NULL;

UPDATE complaints
SET latitude = 21.715300, longitude = 104.894800
WHERE complaint_code = 'PA-2610-005' AND latitude IS NULL;

UPDATE complaints
SET latitude = 21.717600, longitude = 104.898400
WHERE complaint_code = 'PA-2610-006' AND latitude IS NULL;

UPDATE complaints
SET latitude = 21.719000, longitude = 104.895500
WHERE complaint_code = 'PA-2610-007' AND latitude IS NULL;

UPDATE complaints
SET latitude = 21.713800, longitude = 104.897200
WHERE complaint_code = 'PA-2610-008' AND latitude IS NULL;

