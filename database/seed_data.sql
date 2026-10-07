-- ====================================================================
-- HỆ THỐNG MỘT CỬA ĐIỆN TỬ VÀ QUẢN TRỊ HÀNH CHÍNH SỐ UBND PHƯỜNG YÊN BÁI
-- Tệp nạp dữ liệu mẫu hoàn chỉnh (Chuẩn UTF-8 Tiếng Việt có dấu 100%)
-- ====================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
USE yenbai_egov;

SET FOREIGN_KEY_CHECKS = 0;

-- Xóa dữ liệu cũ để nạp mới toàn bộ
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE application_documents;
TRUNCATE TABLE application_workflow;
TRUNCATE TABLE applications;
TRUNCATE TABLE complaints;
TRUNCATE TABLE citizens;
TRUNCATE TABLE residential_areas;
TRUNCATE TABLE administrative_procedures;
TRUNCATE TABLE users;
TRUNCATE TABLE departments;

-- 1. DANH MỤC PHÒNG BAN / BỘ PHẬN CHUYÊN MÔN
INSERT INTO departments (id, dept_code, dept_name, description) VALUES
(1, 'VP-UBND', 'Văn phòng HĐND & UBND Phường', 'Công tác lãnh đạo điều hành, văn thư số, cơ yếu, số hóa tài liệu hành chính'),
(2, 'BO_PHAN_MOT_CUA', 'Bộ phận Tiếp nhận & Trả kết quả (Một cửa)', 'Tiếp nhận, kiểm tra tính hợp lệ, cấp mã hẹn, thu phí và trả kết quả thủ tục hành chính'),
(3, 'TU_PHAP_HO_TICH', 'Bộ phận Tư pháp - Hộ tịch', 'Đăng ký hộ tịch, chứng thực điện tử, tư vấn trợ giúp pháp lý cho nhân dân'),
(4, 'DIA_CHINH_XD_DT', 'Bộ phận Địa chính - Xây dựng - Đô thị & Môi trường', 'Quản lý đất đai, trật tự xây dựng, cấp phép xây dựng nhà ở, vệ sinh môi trường đô thị'),
(5, 'LAO_DONG_TBXH', 'Bộ phận Lao động - Thương binh & Xã hội', 'Thực hiện chính sách an sinh xã hội, người có công, bảo trợ xã hội và giảm nghèo'),
(6, 'CONG_AN_PHUONG', 'Công an Phường Yên Bái', 'Quản lý cư trú, an ninh trật tự, phối hợp triển khai Đề án 06 và CSDL quốc gia về dân cư');

-- 2. TÀI KHOẢN CÁN BỘ CÔNG CHỨC PHƯỜNG (Mật khẩu mặc định: Admin@123)
-- Hash: $2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO
INSERT INTO users (id, username, password_hash, full_name, email, phone_number, department_id, role, certificate_serial, is_active) VALUES
('u0000001-0000-0000-0000-000000000001', 'admin', '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO', 'Quản trị viên Hệ thống', 'quantri@yenbai.gov.vn', '0912345678', 1, 'ADMIN', 'CA-YB-ADMIN-998811', 1),
('u0000002-0000-0000-0000-000000000002', 'motcua_lan', '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO', 'Nguyễn Thị Lan', 'lan.nt@yenbai.gov.vn', '0981234567', 2, 'MOT_CUA', 'CA-YB-MC-554422', 1),
('u0000003-0000-0000-0000-000000000003', 'chuyenvien_tuan', '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO', 'Trần Anh Tuấn', 'tuan.ta@yenbai.gov.vn', '0972345678', 3, 'CHUYEN_VIEN', 'CA-YB-TP-776633', 1),
('u0000004-0000-0000-0000-000000000004', 'chuyenvien_dung', '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO', 'Lê Hoàng Dũng', 'dung.lh@yenbai.gov.vn', '0963456789', 4, 'CHUYEN_VIEN', 'CA-YB-DC-332211', 1),
('u0000005-0000-0000-0000-000000000005', 'chuyenvien_huong', '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO', 'Nguyễn Thị Hương', 'huong.nt@yenbai.gov.vn', '0945678901', 5, 'CHUYEN_VIEN', 'CA-YB-XH-443322', 1),
('u0000006-0000-0000-0000-000000000006', 'lanhdao_hai', '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO', 'Phạm Đức Hải', 'hai.pd@yenbai.gov.vn', '0904567890', 1, 'LANH_DAO', 'VGCA-SIMPKI-001928374', 1),
('u0000007-0000-0000-0000-000000000007', 'lanhdao_hung', '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO', 'Vũ Quốc Hưng', 'hung.vq@yenbai.gov.vn', '0913579246', 1, 'LANH_DAO', 'VGCA-TOKEN-CT-99112233', 1),
('u0000008-0000-0000-0000-000000000008', 'vanthu_mai', '$2y$10$Ak.PEaNIm9avEo34a2a.1OoAPA8kn5XQkcMwzVg5AnAGgoDnX1oWO', 'Hoàng Thị Mai', 'mai.ht@yenbai.gov.vn', '0935678901', 1, 'VAN_THU', 'VGCA-TOKEN-VT-88337722', 1);

-- 3. DANH MỤC 15 THỦ TỤC HÀNH CHÍNH (TTHC) CHUẨN CẤP PHƯỜNG
INSERT INTO administrative_procedures (id, proc_code, proc_name, field_type, processing_days, fee_amount, required_documents, is_active) VALUES
(1, 'TTHC-HT-01', 'Đăng ký khai sinh thường trú', 'HO_TICH', 1, 0, '["Tờ khai đăng ký khai sinh theo mẫu", "Bản chính Giấy chứng sinh do cơ sở y tế cấp", "Bản sao CCCD hoặc xuất trình thẻ CCCD/VNeID của cha mẹ", "Giấy chứng nhận kết hôn của cha mẹ"]', 1),
(2, 'TTHC-HT-02', 'Cấp bản sao trích lục hộ tịch', 'HO_TICH', 1, 8000, '["Tờ khai cấp bản sao trích lục hộ tịch", "Bản sao CCCD hoặc xuất trình tài khoản định danh điện tử VNeID mức 2"]', 1),
(3, 'TTHC-CT-01', 'Chứng thực bản sao từ bản chính các giấy tờ, văn bản', 'CHUNG_THUC', 1, 2000, '["Bản chính giấy tờ, văn bản do cơ quan có thẩm quyền cấp", "Bản sao cần chứng thực đối chiếu"]', 1),
(4, 'TTHC-CT-02', 'Chứng thực chữ ký trong các giấy tờ, văn bản', 'CHUNG_THUC', 1, 10000, '["Bản chính CCCD của người yêu cầu chứng thực", "Giấy tờ, văn bản cần ký trực tiếp trước mặt cán bộ tiếp nhận"]', 1),
(5, 'TTHC-HT-03', 'Đăng ký kết hôn', 'HO_TICH', 3, 0, '["Tờ khai đăng ký kết hôn theo mẫu", "Bản chính Giấy xác nhận tình trạng hôn nhân (nếu cư trú khác nơi)", "Xuất trình CCCD/VNeID của hai bên nam nữ"]', 1),
(6, 'TTHC-HT-04', 'Xác nhận tình trạng hôn nhân', 'HO_TICH', 3, 0, '["Tờ khai cấp Giấy xác nhận tình trạng hôn nhân", "Bản sao CCCD người yêu cầu", "Trích lục bản án ly hôn có hiệu lực pháp luật (nếu đã từng ly hôn)"]', 1),
(7, 'TTHC-HT-05', 'Đăng ký khai tử', 'HO_TICH', 1, 0, '["Tờ khai đăng ký khai tử", "Giấy báo tử do cơ sở y tế cấp hoặc văn bản xác nhận của cơ quan công an", "Bản chính CCCD của người đã chết"]', 1),
(8, 'TTHC-HT-06', 'Đăng ký nhận cha, mẹ, con', 'HO_TICH', 3, 0, '["Tờ khai đăng ký nhận cha mẹ con", "Văn bản chứng cứ chứng minh quan hệ cha mẹ con (Kết quả giám định ADN...)", "Giấy khai sinh của người con"]', 1),
(9, 'TTHC-CT-03', 'Chứng thực hợp đồng, giao dịch về quyền sử dụng đất, nhà ở', 'CHUNG_THUC', 2, 50000, '["Dự thảo hợp đồng, giao dịch", "Giấy chứng nhận quyền sử dụng đất và tài sản gắn liền với đất", "Bản sao CCCD của các bên tham gia giao dịch"]', 1),
(10, 'TTHC-DC-01', 'Xác nhận nguồn gốc đất đai, tài sản gắn liền với đất', 'DIA_CHINH', 7, 50000, '["Đơn xin xác nhận nguồn gốc đất và thời điểm bắt đầu sử dụng đất", "Sơ đồ trích lục thửa đất do địa chính đo vẽ", "Các giấy tờ chứng minh quá trình sử dụng đất ổn định, liên tục"]', 1),
(11, 'TTHC-DC-02', 'Đăng ký biến động quyền sử dụng đất (tặng cho, thừa kế, chuyển nhượng)', 'DIA_CHINH', 10, 100000, '["Hợp đồng chuyển nhượng/tặng cho có chứng thực hoặc công chứng", "Bản gốc Giấy chứng nhận quyền sử dụng đất (Sổ đỏ)", "Tờ khai thuế thu nhập cá nhân và lệ phí trước bạ"]', 1),
(12, 'TTHC-XD-01', 'Cấp giấy phép xây dựng nhà ở riêng lẻ đô thị', 'DIA_CHINH', 15, 50000, '["Đơn đề nghị cấp giấy phép xây dựng theo mẫu", "Bản sao công chứng Giấy chứng nhận quyền sử dụng đất", "Hai bộ bản vẽ thiết kế xây dựng công trình", "Bản cam kết bảo đảm an toàn đối với công trình liền kề"]', 1),
(13, 'TTHC-XD-02', 'Xác nhận hiện trạng nhà ở, công trình xây dựng để cấp đổi sổ', 'DIA_CHINH', 5, 30000, '["Đơn đề nghị xác nhận hiện trạng nhà ở", "Bản vẽ sơ đồ nhà ở, công trình xây dựng", "Giấy chứng nhận quyền sử dụng đất"]', 1),
(14, 'TTHC-XH-01', 'Trợ cấp xã hội hàng tháng đối với người cao tuổi, người khuyết tật nặng', 'LAO_DONG_TBXH', 5, 0, '["Tờ khai đề nghị trợ cấp xã hội theo mẫu", "Bản sao Giấy xác nhận mức độ khuyết tật (đối với người khuyết tật)", "Bản sao CCCD và thông tin cư trú"]', 1),
(15, 'TTHC-XH-02', 'Xác nhận người có công với cách mạng, gia đình chính sách người có công', 'LAO_DONG_TBXH', 5, 0, '["Đơn đề nghị xác nhận chính sách ưu đãi", "Bản sao Huân huy chương, Giấy chứng nhận thương binh, liệt sĩ", "Bản sao CCCD"]', 1);

-- 4. TỔ DÂN PHỐ / ĐỊA BÀN QUẢN LÝ TẠI PHƯỜNG YÊN BÁI (8 TỔ DÂN PHỐ)
INSERT INTO residential_areas (id, area_code, area_name, area_type, manager_name, manager_phone, total_households, total_residents, description) VALUES
(1, 'TDP-01', 'Tổ dân phố số 1 (Đồng Tâm)', 'TO_DAN_PHO', 'Nguyễn Văn Hùng', '0912111222', 285, 1120, 'Khu vực trung tâm thương mại, chợ Đồng Tâm và tuyến phố kinh doanh dịch vụ sầm uất'),
(2, 'TDP-02', 'Tổ dân phố số 2 (Hồng Hà)', 'TO_DAN_PHO', 'Vũ Thị Minh', '0913222333', 310, 1260, 'Khu vực ven sông Hồng, tuyến phố ẩm thực và bến tàu du lịch truyền thống'),
(3, 'TDP-03', 'Tổ dân phố số 3 (Minh Tân)', 'TO_DAN_PHO', 'Hoàng Đình Nam', '0914333444', 240, 950, 'Khu tập thể cán bộ công chức, viên chức ngành giáo dục và y tế'),
(4, 'TDP-04', 'Tổ dân phố số 4 (Nguyễn Thái Học)', 'TO_DAN_PHO', 'Đặng Quốc Bảo', '0915444555', 350, 1420, 'Tuyến phố trung tâm hành chính, trường THPT chuyên và các cơ quan đóng trên địa bàn'),
(5, 'TDP-05', 'Tổ dân phố số 5 (Yên Ninh)', 'TO_DAN_PHO', 'Bùi Xuân Thành', '0916555666', 290, 1180, 'Khu dân cư kết hợp làng nghề truyền thống và các cơ sở sản xuất tiểu thủ công nghiệp'),
(6, 'TDP-06', 'Tổ dân phố số 6 (Nam Cường)', 'TO_DAN_PHO', 'Phạm Quang Vinh', '0917666777', 220, 890, 'Khu vực giáp ranh đô thị mới, nhiều dự án phát triển nhà ở đang triển khai'),
(7, 'TDP-07', 'Tổ dân phố số 7 (Hào Gia)', 'TO_DAN_PHO', 'Đỗ Thanh Bình', '0918777888', 265, 1050, 'Khu vực quanh hồ Hào Gia, công viên trung tâm và khu thể thao thanh thiếu nhi'),
(8, 'TDP-08', 'Tổ dân phố số 8 (Nguyễn Phúc)', 'TO_DAN_PHO', 'Lê Khắc Toàn', '0919888999', 305, 1210, 'Khu dân cư lâu đời, các cơ sở tôn giáo, di tích lịch sử và trường tiểu học');

-- 5. CƠ SỞ DỮ LIỆU DÂN CƯ MẪU (15 CÔNG DÂN THỰC TẾ)
INSERT INTO citizens (id, cccd_number, full_name, date_of_birth, gender, phone_number, email, permanent_address, current_address, residential_area_id, household_number, residence_type, occupation) VALUES
('c0000001-0000-0000-0000-000000000001', '015092008899', 'Nguyễn Văn An', '1992-05-15', 'NAM', '0988776655', 'an.nguyen92@gmail.com', 'Số 24 đường Hoàng Hoa Thám, TDP 1, Phường Yên Bái', 'Số 24 đường Hoàng Hoa Thám, TDP 1, Phường Yên Bái', 1, 'HK-TDP1-042', 'THUONG_TRU', 'Kỹ sư công nghệ thông tin'),
('c0000002-0000-0000-0000-000000000002', '015195007788', 'Trần Thị Bích', '1995-10-20', 'NU', '0977665544', 'bich.tran95@gmail.com', 'Số 58 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái', 'Số 58 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái', 4, 'HK-TDP4-118', 'THUONG_TRU', 'Giáo viên mầm non Sao Mai'),
('c0000003-0000-0000-0000-000000000003', '015088006677', 'Lê Văn Cường', '1988-03-10', 'NAM', '0966554433', 'cuong.le88@gmail.com', 'Số 102 phố Hồng Hà, TDP 2, Phường Yên Bái', 'Số 102 phố Hồng Hà, TDP 2, Phường Yên Bái', 2, 'HK-TDP2-085', 'THUONG_TRU', 'Kinh doanh dịch vụ vận tải'),
('c0000004-0000-0000-0000-000000000004', '015198005566', 'Phạm Quỳnh Dung', '1998-12-05', 'NU', '0944332211', 'dung.pham98@gmail.com', 'Số 15 ngõ 8 Minh Tân, TDP 3, Phường Yên Bái', 'Số 15 ngõ 8 Minh Tân, TDP 3, Phường Yên Bái', 3, 'HK-TDP3-034', 'THUONG_TRU', 'Giao dịch viên ngân hàng Agribank'),
('c0000005-0000-0000-0000-000000000005', '038095001234', 'Hoàng Minh Đức', '1990-08-22', 'NAM', '0933221100', 'duc.hoang90@gmail.com', 'Thôn 3, Xã Giới Phiên, TP Yên Bái', 'Số 88 đường Yên Ninh, TDP 5, Phường Yên Bái', 5, 'KT-TDP5-012', 'TAM_TRU', 'Kiến trúc sư tư vấn xây dựng'),
('c0000006-0000-0000-0000-000000000006', '015075004433', 'Vũ Đình Giang', '1975-04-18', 'NAM', '0912888999', 'giang.vu75@gmail.com', 'Số 42 đường Điện Biên, TDP 1, Phường Yên Bái', 'Số 42 đường Điện Biên, TDP 1, Phường Yên Bái', 1, 'HK-TDP1-015', 'THUONG_TRU', 'Cán bộ hưu trí'),
('c0000007-0000-0000-0000-000000000007', '015182003322', 'Đỗ Thị Hạnh', '1982-11-30', 'NU', '0983777666', 'hanh.do82@gmail.com', 'Số 19 ngách 4 phố Hồng Hà, TDP 2, Phường Yên Bái', 'Số 19 ngách 4 phố Hồng Hà, TDP 2, Phường Yên Bái', 2, 'HK-TDP2-062', 'THUONG_TRU', 'Bác sĩ Bệnh viện Đa khoa Tỉnh'),
('c0000008-0000-0000-0000-000000000008', '015099002211', 'Nguyễn Tiến Khôi', '1999-07-09', 'NAM', '0976555444', 'khoi.nguyen99@gmail.com', 'Số 76 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái', 'Số 76 đường Nguyễn Thái Học, TDP 4, Phường Yên Bái', 4, 'HK-TDP4-099', 'THUONG_TRU', 'Lập trình viên phần mềm'),
('c0000009-0000-0000-0000-000000000009', '015160001100', 'Bùi Thị Liễu', '1960-01-25', 'NU', '0903444333', 'lieu.bui60@gmail.com', 'Số 05 ngõ 12 Minh Tân, TDP 3, Phường Yên Bái', 'Số 05 ngõ 12 Minh Tân, TDP 3, Phường Yên Bái', 3, 'HK-TDP3-005', 'THUONG_TRU', 'Người cao tuổi hưởng trợ cấp'),
('c0000010-0000-0000-0000-000000000010', '015085009988', 'Đinh Xuân Mai', '1985-09-14', 'NAM', '0915333222', 'mai.dinh85@gmail.com', 'Số 112 đường Yên Ninh, TDP 5, Phường Yên Bái', 'Số 112 đường Yên Ninh, TDP 5, Phường Yên Bái', 5, 'HK-TDP5-078', 'THUONG_TRU', 'Chủ xưởng mộc mỹ nghệ'),
('c0000011-0000-0000-0000-000000000011', '015093008877', 'Phan Văn Nam', '1993-03-28', 'NAM', '0987222111', 'nam.phan93@gmail.com', 'Số 31 đường Nam Cường, TDP 6, Phường Yên Bái', 'Số 31 đường Nam Cường, TDP 6, Phường Yên Bái', 6, 'HK-TDP6-021', 'THUONG_TRU', 'Cán bộ kỹ thuật điện lực'),
('c0000012-0000-0000-0000-000000000012', '015197007766', 'Dương Thúy Oanh', '1997-06-12', 'NU', '0975111000', 'oanh.duong97@gmail.com', 'Số 08 ngõ 2 phố Hào Gia, TDP 7, Phường Yên Bái', 'Số 08 ngõ 2 phố Hào Gia, TDP 7, Phường Yên Bái', 7, 'HK-TDP7-045', 'THUONG_TRU', 'Dược sĩ nhà thuốc'),
('c0000013-0000-0000-0000-000000000013', '015080006655', 'Lý Quốc Phòng', '1980-12-01', 'NAM', '0964000999', 'phong.ly80@gmail.com', 'Số 65 đường Nguyễn Phúc, TDP 8, Phường Yên Bái', 'Số 65 đường Nguyễn Phúc, TDP 8, Phường Yên Bái', 8, 'HK-TDP8-091', 'THUONG_TRU', 'Kinh doanh vật liệu xây dựng'),
('c0000014-0000-0000-0000-000000000014', '031196005544', 'Ngô Hải Quỳnh', '1996-08-16', 'NU', '0942999888', 'quynh.ngo96@gmail.com', 'Phường Lê Lợi, TP Hải Phòng', 'Số 54 đường Hoàng Hoa Thám, TDP 1, Phường Yên Bái', 1, 'KT-TDP1-008', 'TAM_TRU', 'Chuyên viên marketing trực tuyến'),
('c0000015-0000-0000-0000-000000000015', '015070004433', 'Tạ Văn Sơn', '1970-02-03', 'NAM', '0931888777', 'son.ta70@gmail.com', 'Số 89 phố Hào Gia, TDP 7, Phường Yên Bái', 'Số 89 phố Hào Gia, TDP 7, Phường Yên Bái', 7, 'HK-TDP7-112', 'THUONG_TRU', 'Thương binh hạng 2/4');

-- 6. HỒ SƠ TIẾP NHẬN MẪU (15 HỒ SƠ Ở ĐỦ CÁC TRẠNG THÁI)
INSERT INTO applications (id, dossier_code, procedure_id, citizen_name, citizen_id_number, citizen_phone, citizen_address, status, submit_channel, submit_date, appointment_date, completed_date, current_handler_id, received_by_id, notes, rejection_reason) VALUES
-- 1. Chờ ký duyệt
('a0000001-0000-0000-0000-000000000001', '000.00.00.H49-261005-0001', 1, 'Nguyễn Văn An', '015092008899', '0988776655', 'Số 24 đường Hoàng Hoa Thám, Phường Yên Bái', 'CHO_KY_DUYET', 'TRUC_TUYEN', '2026-10-05 08:30:00', '2026-10-06 16:30:00', NULL, 'u0000003-0000-0000-0000-000000000003', 'u0000002-0000-0000-0000-000000000002', 'Đăng ký khai sinh cho con Nguyễn Minh Khôi, hồ sơ hợp lệ đầy đủ theo quy định', NULL),

-- 2. Hoàn thành
('a0000002-0000-0000-0000-000000000002', '000.00.00.H49-261006-0002', 3, 'Trần Thị Bích', '015195007788', '0977665544', 'Số 58 đường Nguyễn Thái Học, Phường Yên Bái', 'HOAN_THANH', 'TRUC_TIEP', '2026-10-06 09:15:00', '2026-10-06 15:00:00', '2026-10-06 14:30:00', 'u0000003-0000-0000-0000-000000000003', 'u0000002-0000-0000-0000-000000000002', 'Chứng thực 05 bản sao bằng cử nhân Sư phạm mầm non', NULL),

-- 3. Đang xử lý
('a0000003-0000-0000-0000-000000000003', '000.00.00.H49-261006-0003', 10, 'Lê Văn Cường', '015088006677', '0966554433', 'Số 102 phố Hồng Hà, Phường Yên Bái', 'DANG_XU_LY', 'TRUC_TIEP', '2026-10-06 10:00:00', '2026-10-15 16:30:00', NULL, 'u0000004-0000-0000-0000-000000000004', 'u0000002-0000-0000-0000-000000000002', 'Đang xác minh thực địa ranh giới thửa đất số 45 tờ bản đồ số 12', NULL),

-- 4. Chờ tiếp nhận
('a0000004-0000-0000-0000-000000000004', '000.00.00.H49-261007-0004', 2, 'Phạm Quỳnh Dung', '015198005566', '0944332211', 'Số 15 ngõ 8 Minh Tân, Phường Yên Bái', 'CHO_TIEP_NHAN', 'TRUC_TUYEN', '2026-10-07 08:05:00', '2026-10-08 11:30:00', NULL, NULL, NULL, 'Cấp 03 bản sao trích lục khai sinh bản gốc phục vụ tuyển dụng', NULL),

-- 5. Đang xử lý
('a0000005-0000-0000-0000-000000000005', '000.00.00.H49-261007-0005', 12, 'Hoàng Minh Đức', '038095001234', '0933221100', 'Số 88 đường Yên Ninh, Phường Yên Bái', 'DANG_XU_LY', 'TRUC_TIEP', '2026-10-07 08:45:00', '2026-10-24 16:30:00', NULL, 'u0000004-0000-0000-0000-000000000004', 'u0000002-0000-0000-0000-000000000002', 'Hồ sơ xin phép xây dựng nhà ở 3 tầng, đang kiểm tra mật độ xây dựng và chỉ giới đường đỏ', NULL),

-- 6. Đã ký số
('a0000006-0000-0000-0000-000000000006', '000.00.00.H49-261007-0006', 4, 'Vũ Đình Giang', '015075004433', '0912888999', 'Số 42 đường Điện Biên, Phường Yên Bái', 'DA_KY_SO', 'TRUC_TIEP', '2026-10-07 09:00:00', '2026-10-07 16:00:00', NULL, 'u0000003-0000-0000-0000-000000000003', 'u0000002-0000-0000-0000-000000000002', 'Chứng thực chữ ký trong giấy ủy quyền nhận lương hưu', NULL),

-- 7. Hoàn thành
('a0000007-0000-0000-0000-000000000007', '000.00.00.H49-261007-0007', 5, 'Nguyễn Tiến Khôi', '015099002211', '0976555444', 'Số 76 đường Nguyễn Thái Học, Phường Yên Bái', 'HOAN_THANH', 'TRUC_TIEP', '2026-10-04 14:00:00', '2026-10-07 11:30:00', '2026-10-07 10:15:00', 'u0000003-0000-0000-0000-000000000003', 'u0000002-0000-0000-0000-000000000002', 'Đăng ký kết hôn với chị Dương Thúy Oanh, đã cấp Giấy chứng nhận kết hôn', NULL),

-- 8. Trả lại / Bổ sung
('a0000008-0000-0000-0000-000000000008', '000.00.00.H49-261007-0008', 6, 'Dương Thúy Oanh', '015197007766', '0975111000', 'Số 08 ngõ 2 phố Hào Gia, Phường Yên Bái', 'TRA_LAI', 'TRUC_TUYEN', '2026-10-07 09:30:00', '2026-10-10 16:30:00', NULL, 'u0000003-0000-0000-0000-000000000003', 'u0000002-0000-0000-0000-000000000002', 'Hồ sơ xin xác nhận tình trạng hôn nhân nộp trực tuyến', 'Thiếu trích lục bản án ly hôn có hiệu lực pháp luật theo quy định tại Điều 10 Nghị định 123/2015/NĐ-CP'),

-- 9. Đang xử lý
('a0000009-0000-0000-0000-000000000009', '000.00.00.H49-261007-0009', 14, 'Bùi Thị Liễu', '015160001100', '0903444333', 'Số 05 ngõ 12 Minh Tân, Phường Yên Bái', 'DANG_XU_LY', 'TRUC_TIEP', '2026-10-07 10:15:00', '2026-10-14 16:30:00', NULL, 'u0000005-0000-0000-0000-000000000005', 'u0000002-0000-0000-0000-000000000002', 'Hồ sơ đề nghị trợ cấp xã hội người cao tuổi từ đủ 80 tuổi không có lương hưu', NULL),

-- 10. Chờ tiếp nhận
('a0000010-0000-0000-0000-000000000010', '000.00.00.H49-261007-0010', 9, 'Lý Quốc Phòng', '015080006655', '0964000999', 'Số 65 đường Nguyễn Phúc, Phường Yên Bái', 'CHO_TIEP_NHAN', 'TRUC_TIEP', '2026-10-07 10:45:00', '2026-10-09 16:30:00', NULL, NULL, 'u0000002-0000-0000-0000-000000000002', 'Chứng thực hợp đồng tặng cho quyền sử dụng đất cho con trai', NULL),

-- 11. Đang xử lý
('a0000011-0000-0000-0000-000000000011', '000.00.00.H49-261007-0011', 11, 'Đinh Xuân Mai', '015085009988', '0915333222', 'Số 112 đường Yên Ninh, Phường Yên Bái', 'DANG_XU_LY', 'TRUC_TIEP', '2026-10-07 11:00:00', '2026-10-21 16:30:00', NULL, 'u0000004-0000-0000-0000-000000000004', 'u0000002-0000-0000-0000-000000000002', 'Đăng ký biến động đất đai do chuyển nhượng 120m2 đất ở', NULL),

-- 12. Chờ ký duyệt
('a0000012-0000-0000-0000-000000000012', '000.00.00.H49-261007-0012', 15, 'Tạ Văn Sơn', '015070004433', '0931888777', 'Số 89 phố Hào Gia, Phường Yên Bái', 'CHO_KY_DUYET', 'TRUC_TIEP', '2026-10-06 08:30:00', '2026-10-13 16:30:00', NULL, 'u0000005-0000-0000-0000-000000000005', 'u0000002-0000-0000-0000-000000000002', 'Xác nhận thương binh để hưởng chế độ miễn giảm tiền thuê nhà ở', NULL);

-- 7. LỊCH SỬ LUÂN CHUYỂN HỒ SƠ (WORKFLOW TRACKING)
INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment, created_at) VALUES
('a0000001-0000-0000-0000-000000000001', 'u0000002-0000-0000-0000-000000000002', 'u0000003-0000-0000-0000-000000000003', 'CHO_TIEP_NHAN', 'DANG_XU_LY', 'TIEP_NHAN', 'Tiếp nhận hồ sơ trực tuyến hợp lệ, chuyển chuyên viên tư pháp thụ lý', '2026-10-05 08:40:00'),
('a0000001-0000-0000-0000-000000000001', 'u0000003-0000-0000-0000-000000000003', 'u0000006-0000-0000-0000-000000000006', 'DANG_XU_LY', 'CHO_KY_DUYET', 'TRINH_KY', 'Đã thẩm định thông tin khai sinh đối chiếu CSDL dân cư quốc gia hợp lệ, kính trình Lãnh đạo phê duyệt', '2026-10-05 14:20:00'),

('a0000002-0000-0000-0000-000000000002', 'u0000002-0000-0000-0000-000000000002', 'u0000003-0000-0000-0000-000000000003', 'CHO_TIEP_NHAN', 'DANG_XU_LY', 'TIEP_NHAN', 'Tiếp nhận trực tiếp tại quầy số 2', '2026-10-06 09:20:00'),
('a0000002-0000-0000-0000-000000000002', 'u0000003-0000-0000-0000-000000000003', 'u0000006-0000-0000-0000-000000000006', 'DANG_XU_LY', 'CHO_KY_DUYET', 'TRINH_KY', 'Đã đối chiếu bản gốc chính xác, kính trình Lãnh đạo ký duyệt', '2026-10-06 10:30:00'),
('a0000002-0000-0000-0000-000000000002', 'u0000006-0000-0000-0000-000000000006', 'u0000008-0000-0000-0000-000000000008', 'CHO_KY_DUYET', 'DA_KY_SO', 'KY_SO', 'Phó Chủ tịch UBND Phường ký số điện tử phê duyệt bản chứng thực', '2026-10-06 11:15:00'),
('a0000002-0000-0000-0000-000000000002', 'u0000008-0000-0000-0000-000000000008', 'u0000002-0000-0000-0000-000000000002', 'DA_KY_SO', 'HOAN_THANH', 'HOAN_THANH', 'Đóng dấu số điện tử, thu lệ phí 10.000đ và trả kết quả cho công dân', '2026-10-06 14:30:00'),

('a0000006-0000-0000-0000-000000000006', 'u0000002-0000-0000-0000-000000000002', 'u0000003-0000-0000-0000-000000000003', 'CHO_TIEP_NHAN', 'DANG_XU_LY', 'TIEP_NHAN', 'Tiếp nhận hồ sơ trực tiếp tại bộ phận Một cửa', '2026-10-07 09:05:00'),
('a0000006-0000-0000-0000-000000000006', 'u0000003-0000-0000-0000-000000000003', 'u0000006-0000-0000-0000-000000000006', 'DANG_XU_LY', 'CHO_KY_DUYET', 'TRINH_KY', 'Người yêu cầu ký trực tiếp trước mặt công chức tư pháp', '2026-10-07 10:00:00'),
('a0000006-0000-0000-0000-000000000006', 'u0000006-0000-0000-0000-000000000006', 'u0000008-0000-0000-0000-000000000008', 'CHO_KY_DUYET', 'DA_KY_SO', 'KY_SO', 'Lãnh đạo ký số phê duyệt chứng thực chữ ký', '2026-10-07 10:45:00');

-- 8. TÀI LIỆU ĐÍNH KÈM & BẢN KÝ SỐ MẪU
INSERT INTO application_documents (id, application_id, document_name, file_path, file_size, mime_type, doc_type, is_signed, signature_data, uploaded_by) VALUES
('d0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'ToKhai_DangKyKhaiSinh.pdf', '/uploads/documents/tokhai_khaisinh_001.pdf', 524288, 'application/pdf', 'HO_SO_GOC', 0, NULL, 'u0000002-0000-0000-0000-000000000002'),
('d0000002-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'GiayChungSinh_BVDKTinhYenBai.jpg', '/uploads/documents/chungsinh_001.jpg', 1048576, 'image/jpeg', 'HO_SO_GOC', 0, NULL, 'u0000002-0000-0000-0000-000000000002'),
('d0000003-0000-0000-0000-000000000002', 'a0000002-0000-0000-0000-000000000002', 'BanChungThucDienTu_BangCuNhan.pdf', '/uploads/signatures/a0000002_signed.pdf', 1572864, 'application/pdf', 'KET_QUA', 1, '{"signer_name":"Phạm Đức Hải","signer_role":"Phó Chủ tịch UBND Phường Yên Bái","certificate_serial":"VGCA-SIMPKI-001928374","timestamp":"2026-10-06 11:15:00","algorithm":"SHA256withRSA","status":"VALID_SIGNATURE"}', 'u0000006-0000-0000-0000-000000000006'),
('d0000004-0000-0000-0000-000000000006', 'a0000006-0000-0000-0000-000000000006', 'GiayUyQuyen_ChungThucChuKy.pdf', '/uploads/signatures/a0000006_signed.pdf', 840000, 'application/pdf', 'KET_QUA', 1, '{"signer_name":"Phạm Đức Hải","signer_role":"Phó Chủ tịch UBND Phường Yên Bái","certificate_serial":"VGCA-SIMPKI-001928374","timestamp":"2026-10-07 10:45:00","algorithm":"SHA256withRSA","status":"VALID_SIGNATURE"}', 'u0000006-0000-0000-0000-000000000006');

-- 9. PHẢN ÁNH - KIẾN NGHỊ HIỆN TRƯỜNG CỦA NHÂN DÂN (8 VỤ VIỆC)
INSERT INTO complaints (id, complaint_code, citizen_name, citizen_phone, citizen_cccd, category, title, description, location, status, priority, assigned_to, response, responded_at) VALUES
('p0000001-0000-0000-0000-000000000001', 'PAKN-261005-001', 'Trần Văn Mạnh', '0981999888', '015090009988', 'RAC_THAI', 'Tập kết rác thải tự phát gây ô nhiễm môi trường', 'Bãi đất trống đầu ngõ 12 đường Hồng Hà thường xuyên bị một số hộ dân đổ rác thải sinh hoạt bừa bãi, bốc mùi hôi thối vào giờ cao điểm, ảnh hưởng tới khu dân cư.', 'Đầu ngõ 12, phố Hồng Hà, TDP 2', 'DA_XU_LY', 'CAO', 'u0000004-0000-0000-0000-000000000004', 'Đội Quản lý trật tự đô thị phường đã phối hợp cùng Công ty Môi trường đô thị dọn dẹp sạch sẽ trong chiều 05/10 và cắm biển cấm đổ rác có camera giám sát.', '2026-10-06 10:00:00'),

('p0000002-0000-0000-0000-000000000002', 'PAKN-261006-002', 'Lê Thị Thu', '0972888777', '015193006655', 'LAN_CHIEM', 'Quán ăn lấn chiếm toàn bộ vỉa hè người đi bộ tại đường Nguyễn Thái Học', 'Quán cơm số 76 kê bàn ghế tràn lan ra vỉa hè, xe máy để kín lối đi của học sinh trường tiểu học gần đó, người đi bộ phải đi xuống lòng đường rất nguy hiểm.', 'Số 76 đường Nguyễn Thái Học, TDP 4', 'DANG_XU_LY', 'TRUNG_BINH', 'u0000004-0000-0000-0000-000000000004', NULL, NULL),

('p0000003-0000-0000-0000-000000000003', 'PAKN-261007-003', 'Hoàng Văn Thắng', '0963777666', '015085005544', 'DIEN_NUOC', 'Hệ thống đèn chiếu sáng công cộng ngõ 5 phố Yên Ninh bị hỏng', '3 bóng đèn cao áp chiếu sáng đầu ngõ bị mất điện 2 đêm liên tiếp gây nguy cơ mất an toàn giao thông và an ninh trật tự ban đêm.', 'Ngõ 5 đường Yên Ninh, TDP 5', 'MOI', 'TRUNG_BINH', NULL, NULL, NULL),

('p0000004-0000-0000-0000-000000000004', 'PAKN-261007-004', 'Nguyễn Thị Hoa', '0984555666', '015180004433', 'AN_NINH', 'Nhóm thanh niên tụ tập đua xe, nẹt pô đêm khuya quanh hồ Hào Gia', 'Đêm nào từ 23h đến 1h sáng cũng có nhóm thanh niên tụ tập rú ga, nẹt pô gây mất ngủ cho nhân dân quanh khu vực hồ Hào Gia.', 'Khu vực đường quanh hồ Hào Gia, TDP 7', 'DANG_XU_LY', 'CAO', 'u0000004-0000-0000-0000-000000000004', NULL, NULL),

('p0000005-0000-0000-0000-000000000005', 'PAKN-261007-005', 'Vũ Văn Hào', '0973666555', '015072003322', 'GIAO_THONG', 'Nắp hố ga bị sụt lún nguy hiểm trước cổng trường mầm non', 'Nắp cống thoát nước bị sụt sâu khoảng 15cm so với mặt đường, nhiều phụ huynh đưa đón con nhỏ đi xe máy bị quẹt gầm suýt ngã.', 'Trước cổng trường Mầm non Đồng Tâm, TDP 1', 'DA_XU_LY', 'KHAN_CAP', 'u0000004-0000-0000-0000-000000000004', 'UBND Phường đã yêu cầu đơn vị thi công thoát nước khắc phục, thay thế nắp đan gang chịu lực và thảm nhựa phẳng mặt đường trong sáng 07/10.', '2026-10-07 11:00:00'),

('p0000006-0000-0000-0000-000000000006', 'PAKN-261007-006', 'Phạm Thị Mai', '0962444333', '015189002211', 'MOI_TRUONG', 'Xưởng gia công cơ khí gây tiếng ồn và khói hàn trong khu dân cư', 'Xưởng hàn số 28 ngách 4 đường Nam Cường hoạt động cả buổi trưa, phát ra tiếng đập búa và mùi sơn xộc thẳng vào nhà dân xung quanh.', 'Số 28 ngách 4 đường Nam Cường, TDP 6', 'MOI', 'TRUNG_BINH', NULL, NULL, NULL);

-- 10. THÔNG BÁO TỰ ĐỘNG (SMS / ZALO MOCK)
INSERT INTO notifications (recipient_phone, recipient_name, channel, subject, message, related_type, related_id) VALUES
('0988776655', 'Nguyễn Văn An', 'SMS', 'Tiếp nhận hồ sơ DVC', 'UBND Phường Yên Bái thông báo: Hồ sơ mã [000.00.00.H49-261005-0001] của Quý khách đã được tiếp nhận. Hẹn trả kết quả ngày 06/10/2026.', 'APPLICATION', 'a0000001-0000-0000-0000-000000000001'),
('0977665544', 'Trần Thị Bích', 'SMS', 'Trả kết quả TTHC', 'UBND Phường Yên Bái thông báo: Hồ sơ [000.00.00.H49-261006-0002] đã hoàn thành. Quý khách vui lòng đến Bộ phận Một cửa nhận kết quả.', 'APPLICATION', 'a0000002-0000-0000-0000-000000000002'),
('0912888999', 'Vũ Đình Giang', 'SMS', 'Ký số hoàn tất hồ sơ', 'UBND Phường Yên Bái thông báo: Hồ sơ [000.00.00.H49-261007-0006] đã được Lãnh đạo phê duyệt ký số điện tử. Đang chuyển Bộ phận Một cửa đóng dấu trả kết quả.', 'APPLICATION', 'a0000006-0000-0000-0000-000000000006');

-- 11. NHẬT KÝ KIỂM TOÁN HỆ THỐNG BAN ĐẦU (IMMUTABLE AUDIT TRAIL)
INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, ip_address, user_agent, new_state) VALUES
('u0000001-0000-0000-0000-000000000001', 'Quản trị viên Hệ thống', 'SYSTEM_INITIALIZATION', 'SYSTEM', 'INIT-2026', '127.0.0.1', 'YenBai eWard-Gov CLI', '{"status":"SUCCESS","message":"Khởi tạo hệ thống và nạp toàn bộ danh mục TTHC chuẩn, phòng ban, tài khoản và dân cư phường"}'),
('u0000006-0000-0000-0000-000000000006', 'Phạm Đức Hải', 'APPROVE_SIGN', 'APPLICATION', 'a0000002-0000-0000-0000-000000000002', '192.168.10.15', 'Chrome 122 Windows 11', '{"signer":"Phạm Đức Hải","cert":"VGCA-SIMPKI-001928374","status":"APPROVED"}');

SET FOREIGN_KEY_CHECKS = 1;
