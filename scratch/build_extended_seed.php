<?php
require_once dirname(__DIR__) . '/api/core/Database.php';

function build_extended_seed_sql(): string {
    $adminPasswordHash = '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO'; // Admin@123
    $citizenPasswordHash = '$2y$10$kLhuKKquIXctNpVrShWyRu0TdkuQboTvr1aJb4PsA0hTejxibOvru'; // Congdan@123

    $sql = "-- ====================================================================\n";
    $sql .= "-- Migration: 003_extended_realistic_mock_data.sql\n";
    $sql .= "-- Bổ sung dữ liệu mẫu quy mô lớn, chân thực (UBND Phường Yên Bái)\n";
    $sql .= "-- ====================================================================\n\n";
    $sql .= "USE yenbai_egov;\n";
    $sql .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    // 1. TÀI KHOẢN CÁN BỘ BỔ SUNG (Tổng 17 cán bộ)
    $sql .= "-- 1. CÁN BỘ BỔ SUNG\n";
    $sql .= "INSERT INTO users (id, username, password_hash, full_name, email, phone_number, department_id, role, certificate_serial, is_active) VALUES\n";
    $sql .= "('u0000009-0000-0000-0000-000000000009', 'motcua_quang', '$adminPasswordHash', 'Lê Đình Quang', 'quang.ld@yenbai.gov.vn', '0982345678', 2, 'MOT_CUA', 'CA-YB-MC-665533', 1),\n";
    $sql .= "('u0000010-0000-0000-0000-000000000010', 'motcua_minh', '$adminPasswordHash', 'Vũ Thảo Minh', 'minh.vt@yenbai.gov.vn', '0973456789', 2, 'MOT_CUA', 'CA-YB-MC-776644', 1),\n";
    $sql .= "('u0000011-0000-0000-0000-000000000011', 'motcua_linh', '$adminPasswordHash', 'Đỗ Thuỳ Linh', 'linh.dt@yenbai.gov.vn', '0964567890', 2, 'MOT_CUA', 'CA-YB-MC-887755', 1),\n";
    $sql .= "('u0000012-0000-0000-0000-000000000012', 'chuyenvien_nam', '$adminPasswordHash', 'Phạm Hải Nam', 'nam.ph@yenbai.gov.vn', '0946789012', 4, 'CHUYEN_VIEN', 'CA-YB-DC-554433', 1),\n";
    $sql .= "('u0000013-0000-0000-0000-000000000013', 'chuyenvien_nga', '$adminPasswordHash', 'Đinh Thị Thanh Nga', 'nga.dt@yenbai.gov.vn', '0937890123', 5, 'CHUYEN_VIEN', 'CA-YB-XH-665544', 1),\n";
    $sql .= "('u0000014-0000-0000-0000-000000000014', 'chuyenvien_phong', '$adminPasswordHash', 'Hoàng Tiến Phong', 'phong.ht@yenbai.gov.vn', '0918901234', 3, 'CHUYEN_VIEN', 'CA-YB-TP-887766', 1),\n";
    $sql .= "('u0000015-0000-0000-0000-000000000015', 'lanhdao_viet', '$adminPasswordHash', 'Nguyễn Quốc Việt', 'viet.nq@yenbai.gov.vn', '0905678901', 1, 'LANH_DAO', 'VGCA-SIMPKI-002839485', 1),\n";
    $sql .= "('u0000016-0000-0000-0000-000000000016', 'lanhdao_phuong', '$adminPasswordHash', 'Bùi Mai Phương', 'phuong.bm@yenbai.gov.vn', '0916789012', 1, 'LANH_DAO', 'VGCA-SIMPKI-003948576', 1),\n";
    $sql .= "('u0000017-0000-0000-0000-000000000017', 'congan_trung', '$adminPasswordHash', 'Đặng Thành Trung', 'trung.dt@yenbai.gov.vn', '0989012345', 6, 'ADMIN', 'BCA-CAYB-00112233', 1)\n";
    $sql .= "ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role), is_active = 1;\n\n";

    // 2. DÂN CƯ BỔ SUNG (Tổng 25 công dân)
    $sql .= "-- 2. CÔNG DÂN BỔ SUNG (citizens)\n";
    $sql .= "INSERT INTO citizens (id, cccd_number, full_name, date_of_birth, gender, phone_number, email, permanent_address, current_address, residential_area_id, household_number, residence_type, occupation) VALUES\n";
    $sql .= "('c0000016-0000-0000-0000-000000000016', '015094001122', 'Lương Thế Vinh', '1994-04-12', 'NAM', '0982112233', 'vinh.luong@gmail.com', 'Số 54 phố Hồng Hà, TDP 2, Phường Yên Bái', 'Số 54 phố Hồng Hà, TDP 2, Phường Yên Bái', 2, 'HK-TDP2-092', 'THUONG_TRU', 'Kế toán trưởng doanh nghiệp'),\n";
    $sql .= "('c0000017-0000-0000-0000-000000000017', '015199003344', 'Chu Thị Thanh Mai', '1999-09-18', 'NU', '0974223344', 'mai.chu@gmail.com', 'Số 12 đường Hoàng Hoa Thám, TDP 1, Phường Yên Bái', 'Số 12 đường Hoàng Hoa Thám, TDP 1, Phường Yên Bái', 1, 'HK-TDP1-055', 'THUONG_TRU', 'Điều dưỡng trạm y tế phường'),\n";
    $sql .= "('c0000018-0000-0000-0000-000000000018', '015082005566', 'Nghiêm Đình Khang', '1982-01-20', 'NAM', '0963334455', 'khang.nghiem@gmail.com', 'Số 120 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái', 'Số 120 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái', 4, 'HK-TDP4-135', 'THUONG_TRU', 'Giám đốc khách sạn'),\n";
    $sql .= "('c0000019-0000-0000-0000-000000000019', '015196007788', 'Mai Thu Thảo', '1996-07-25', 'NU', '0945445566', 'thao.mai@gmail.com', 'Số 33 ngõ 5 phố Minh Tân, TDP 3, Phường Yên Bái', 'Số 33 ngõ 5 phố Minh Tân, TDP 3, Phường Yên Bái', 3, 'HK-TDP3-048', 'THUONG_TRU', 'Nhân viên kinh doanh bất động sản'),\n";
    $sql .= "('c0000020-0000-0000-0000-000000000020', '015078009900', 'Trịnh Bá Khiêm', '1978-11-05', 'NAM', '0936556677', 'khiem.trinh@gmail.com', 'Số 74 đường Yên Ninh, TDP 5, Phường Yên Bái', 'Số 74 đường Yên Ninh, TDP 5, Phường Yên Bái', 5, 'HK-TDP5-095', 'THUONG_TRU', 'Chủ nhiệm Hợp tác xã tiểu thủ công nghiệp'),\n";
    $sql .= "('c0000021-0000-0000-0000-000000000021', '015187002233', 'Đoàn Thị Yến', '1987-03-30', 'NU', '0917667788', 'yen.doan@gmail.com', 'Số 19 đường Nam Cường, TDP 6, Phường Yên Bái', 'Số 19 đường Nam Cường, TDP 6, Phường Yên Bái', 6, 'HK-TDP6-033', 'THUONG_TRU', 'Chủ cửa hàng kim khí điện máy'),\n";
    $sql .= "('c0000022-0000-0000-0000-000000000022', '015201004455', 'Trần Hữu Phước', '2001-08-14', 'NAM', '0988778899', 'phuoc.tran@gmail.com', 'Số 26 ngõ 4 phố Hào Gia, TDP 7, Phường Yên Bái', 'Số 26 ngõ 4 phố Hào Gia, TDP 7, Phường Yên Bái', 7, 'HK-TDP7-058', 'THUONG_TRU', 'Sinh viên năm cuối ĐH Giao thông'),\n";
    $sql .= "('c0000023-0000-0000-0000-000000000023', '015165006677', 'Triệu Thị Nga', '1965-05-02', 'NU', '0979889900', 'nga.trieu@gmail.com', 'Số 92 đường Nguyễn Phúc, TDP 8, Phường Yên Bái', 'Số 92 đường Nguyễn Phúc, TDP 8, Phường Yên Bái', 8, 'HK-TDP8-105', 'THUONG_TRU', 'Cán bộ hưu trí / Chi hội trưởng phụ nữ'),\n";
    $sql .= "('c0000024-0000-0000-0000-000000000024', '015089008899', 'Bạch Quốc Toản', '1989-12-19', 'NAM', '0961990011', 'toan.bach@gmail.com', 'Số 85 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái', 'Số 85 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái', 4, 'HK-TDP4-102', 'THUONG_TRU', 'Kỹ sư trắc địa địa chính'),\n";
    $sql .= "('c0000025-0000-0000-0000-000000000025', '015195000011', 'Lưu Phương Linh', '1995-02-28', 'NU', '0943001122', 'linh.luu@gmail.com', 'Số 09 ngõ 10 phố Minh Tân, TDP 3, Phường Yên Bái', 'Số 09 ngõ 10 phố Minh Tân, TDP 3, Phường Yên Bái', 3, 'HK-TDP3-019', 'THUONG_TRU', 'Giáo viên THCS Yên Thịnh')\n";
    $sql .= "ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone_number = VALUES(phone_number);\n\n";

    // 3. TÀI KHOẢN CÔNG DÂN (25 tài khoản citizen_accounts)
    $sql .= "-- 3. TÀI KHOẢN CÔNG DÂN ĐĂNG NHẬP CỔNG DVC (25 tài khoản, Mật khẩu: Congdan@123)\n";
    $sql .= "INSERT INTO citizen_accounts (id, cccd_number, phone_number, password_hash, full_name, email, date_of_birth, gender, address, citizen_id, phone_verified_at, is_active) VALUES\n";
    
    $citizenList = [
        ['ca000001', 'c0000003', '015088006677', '0966554433', 'Lê Văn Cường', 'cuong.le88@gmail.com', '1988-03-10', 'NAM', 'Số 102 phố Hồng Hà, TDP 2, Phường Yên Bái'],
        ['ca000002', 'c0000001', '015092008899', '0988776655', 'Nguyễn Văn An', 'an.nguyen92@gmail.com', '1992-05-15', 'NAM', 'Số 24 đường Hoàng Hoa Thám, TDP 1, Phường Yên Bái'],
        ['ca000003', 'c0000002', '015195007788', '0977665544', 'Trần Thị Bích', 'bich.tran95@gmail.com', '1995-10-20', 'NU', 'Số 58 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái'],
        ['ca000004', 'c0000004', '015198005566', '0944332211', 'Phạm Quỳnh Dung', 'dung.pham98@gmail.com', '1998-12-05', 'NU', 'Số 15 ngõ 8 Minh Tân, TDP 3, Phường Yên Bái'],
        ['ca000005', 'c0000005', '038095001234', '0933221100', 'Hoàng Minh Đức', 'duc.hoang90@gmail.com', '1990-08-22', 'NAM', 'Số 88 đường Yên Ninh, TDP 5, Phường Yên Bái'],
        ['ca000006', 'c0000006', '015075004433', '0912888999', 'Vũ Đình Giang', 'giang.vu75@gmail.com', '1975-04-18', 'NAM', 'Số 42 đường Điện Biên, TDP 1, Phường Yên Bái'],
        ['ca000007', 'c0000007', '015182003322', '0983777666', 'Đỗ Thị Hạnh', 'hanh.do82@gmail.com', '1982-11-30', 'NU', 'Số 19 ngách 4 phố Hồng Hà, TDP 2, Phường Yên Bái'],
        ['ca000008', 'c0000008', '015099002211', '0976555444', 'Nguyễn Tiến Khôi', 'khoi.nguyen99@gmail.com', '1999-07-09', 'NAM', 'Số 76 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái'],
        ['ca000009', 'c0000009', '015160001100', '0903444333', 'Bùi Thị Liễu', 'lieu.bui60@gmail.com', '1960-01-25', 'NU', 'Số 05 ngõ 12 Minh Tân, TDP 3, Phường Yên Bái'],
        ['ca000010', 'c0000010', '015085009988', '0915333222', 'Đinh Xuân Mai', 'mai.dinh85@gmail.com', '1985-09-14', 'NAM', 'Số 112 đường Yên Ninh, TDP 5, Phường Yên Bái'],
        ['ca000011', 'c0000011', '015093008877', '0987222111', 'Phan Văn Nam', 'nam.phan93@gmail.com', '1993-03-28', 'NAM', 'Số 31 đường Nam Cường, TDP 6, Phường Yên Bái'],
        ['ca000012', 'c0000012', '015197007766', '0975111000', 'Dương Thúy Oanh', 'oanh.duong97@gmail.com', '1997-06-12', 'NU', 'Số 08 ngõ 2 phố Hào Gia, TDP 7, Phường Yên Bái'],
        ['ca000013', 'c0000013', '015080006655', '0964000999', 'Lý Quốc Phòng', 'phong.ly80@gmail.com', '1980-12-01', 'NAM', 'Số 65 đường Nguyễn Phúc, TDP 8, Phường Yên Bái'],
        ['ca000014', 'c0000014', '031196005544', '0942999888', 'Ngô Hải Quỳnh', 'quynh.ngo96@gmail.com', '1996-08-16', 'NU', 'Số 54 đường Hoàng Hoa Thám, TDP 1, Phường Yên Bái'],
        ['ca000015', 'c0000015', '015070004433', '0931888777', 'Tạ Văn Sơn', 'son.ta70@gmail.com', '1970-02-03', 'NAM', 'Số 89 phố Hào Gia, TDP 7, Phường Yên Bái'],
        ['ca000016', 'c0000016', '015094001122', '0982112233', 'Lương Thế Vinh', 'vinh.luong@gmail.com', '1994-04-12', 'NAM', 'Số 54 phố Hồng Hà, TDP 2, Phường Yên Bái'],
        ['ca000017', 'c0000017', '015199003344', '0974223344', 'Chu Thị Thanh Mai', 'mai.chu@gmail.com', '1999-09-18', 'NU', 'Số 12 đường Hoàng Hoa Thám, TDP 1, Phường Yên Bái'],
        ['ca000018', 'c0000018', '015082005566', '0963334455', 'Nghiêm Đình Khang', 'khang.nghiem@gmail.com', '1982-01-20', 'NAM', 'Số 120 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái'],
        ['ca000019', 'c0000019', '015196007788', '0945445566', 'Mai Thu Thảo', 'thao.mai@gmail.com', '1996-07-25', 'NU', 'Số 33 ngõ 5 phố Minh Tân, TDP 3, Phường Yên Bái'],
        ['ca000020', 'c0000020', '015078009900', '0936556677', 'Trịnh Bá Khiêm', 'khiem.trinh@gmail.com', '1978-11-05', 'NAM', 'Số 74 đường Yên Ninh, TDP 5, Phường Yên Bái'],
        ['ca000021', 'c0000021', '015187002233', '0917667788', 'Đoàn Thị Yến', 'yen.doan@gmail.com', '1987-03-30', 'NU', 'Số 19 đường Nam Cường, TDP 6, Phường Yên Bái'],
        ['ca000022', 'c0000022', '015201004455', '0988778899', 'Trần Hữu Phước', 'phuoc.tran@gmail.com', '2001-08-14', 'NAM', 'Số 26 ngõ 4 phố Hào Gia, TDP 7, Phường Yên Bái'],
        ['ca000023', 'c0000023', '015165006677', '0979889900', 'Triệu Thị Nga', 'nga.trieu@gmail.com', '1965-05-02', 'NU', 'Số 92 đường Nguyễn Phúc, TDP 8, Phường Yên Bái'],
        ['ca000024', 'c0000024', '015089008899', '0961990011', 'Bạch Quốc Toản', 'toan.bach@gmail.com', '1989-12-19', 'NAM', 'Số 85 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái'],
        ['ca000025', 'c0000025', '015195000011', '0943001122', 'Lưu Phương Linh', 'linh.luu@gmail.com', '1995-02-28', 'NU', 'Số 09 ngõ 10 phố Minh Tân, TDP 3, Phường Yên Bái'],
    ];

    $accRows = [];
    foreach ($citizenList as $c) {
        $accId = "{$c[0]}-0000-0000-0000-000000000000";
        $citId = "{$c[1]}-0000-0000-0000-000000000000";
        $accRows[] = "('$accId', '{$c[2]}', '{$c[3]}', '$citizenPasswordHash', '{$c[4]}', '{$c[5]}', '{$c[6]}', '{$c[7]}', '{$c[8]}', '$citId', NOW(), 1)";
    }
    $sql .= implode(",\n", $accRows) . "\n";
    $sql .= "ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone_number = VALUES(phone_number), phone_verified_at = NOW(), is_active = 1;\n\n";

    $sql .= "SET FOREIGN_KEY_CHECKS = 1;\n";

    return $sql;
}

file_put_contents(dirname(__DIR__) . '/database/migrations/003_extended_realistic_mock_data.sql', build_extended_seed_sql());
echo "Đã tạo database/migrations/003_extended_realistic_mock_data.sql thành công!\n";

