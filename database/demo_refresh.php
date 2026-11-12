<?php
// ====================================================================
// Script làm mới & chuẩn hóa dữ liệu Demo quy mô lớn (YenBai eWard-Gov)
// Đưa toàn bộ mốc thời gian về sát ngày hiện tại để phục vụ Demo trực quan
// ====================================================================

date_default_timezone_set('Asia/Ho_Chi_Minh');
require_once dirname(__DIR__) . '/api/core/Database.php';

function refresh_demo_data(): array {
    $db = Database::getConnection();
    $db->exec('SET NAMES utf8mb4');
    $db->exec('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Nạp lại seed_data gốc
    $seedFile = __DIR__ . '/seed_data.sql';
    if (!file_exists($seedFile)) {
        throw new RuntimeException("Không tìm thấy tệp seed_data.sql");
    }
    $db->exec(file_get_contents($seedFile));

    // 2. Chạy migration 001_citizen_accounts.sql
    $m1 = __DIR__ . '/migrations/001_citizen_accounts.sql';
    if (file_exists($m1)) {
        $db->exec(file_get_contents($m1));
    }

    // 3. Chạy migration 002_queue_and_complaint_coords.sql
    $m2 = __DIR__ . '/migrations/002_queue_and_complaint_coords.sql';
    if (file_exists($m2)) {
        $db->exec(file_get_contents($m2));
    }

    // 4. Chạy migration 003_extended_realistic_mock_data.sql (Thêm 9 cán bộ, 10 công dân, 25 tài khoản portal)
    $m3 = __DIR__ . '/migrations/003_extended_realistic_mock_data.sql';
    if (file_exists($m3)) {
        $db->exec(file_get_contents($m3));
    }

    // 5. Chuẩn bị các mốc thời gian thực tế
    $todayStr = date('Y-m-d');
    $todayYmd = date('ymd');

    // 6. Xóa các hồ sơ và phản ánh cũ để nạp bộ dữ liệu phong phú, sạch sẽ, thời gian bám sát thực tế
    $db->exec("DELETE FROM application_workflow");
    $db->exec("DELETE FROM application_documents");
    $db->exec("DELETE FROM applications");
    $db->exec("DELETE FROM complaints");
    $db->exec("DELETE FROM queue_tickets");

    // -------------------------------------------------------------
    // 7. NẠP 47 HỒ SƠ MỘT CỬA PHONG PHÚ (ĐỦ 15 TTHC, ĐÃ & CHƯA GIẢI QUYẾT)
    // -------------------------------------------------------------
    $insertApp = $db->prepare('
        INSERT INTO applications (
            id, dossier_code, procedure_id, citizen_name, citizen_id_number, citizen_phone,
            citizen_address, citizen_account_id, status, submit_channel, submit_date, appointment_date, completed_date,
            current_handler_id, received_by_id, payment_status, payment_method, receipt_number, paid_at,
            satisfaction_score, satisfaction_comment, satisfaction_date, notes, rejection_reason
        ) VALUES (
            :id, :code, :proc, :name, :cccd, :phone,
            :address, :account_id, :status, :channel, :sub_date, :app_date, :comp_date,
            :handler, :receiver, :pay_status, :pay_method, :receipt, :paid_at,
            :score, :comment, :sat_date, :notes, :rejection
        )
    ');

    $insertWf = $db->prepare('
        INSERT INTO application_workflow (
            application_id, from_user_id, to_user_id, from_status, to_status, action, comment, created_at
        ) VALUES (
            :app_id, :from_user, :to_user, :from_status, :to_status, :action, :comment, :created_at
        )
    ');

    // Danh sách cán bộ tham chiếu
    $uMotCuaLan = 'u0000002-0000-0000-0000-000000000002'; // Nguyễn Thị Lan (Một cửa)
    $uMotCuaQuang = 'u0000009-0000-0000-0000-000000000009'; // Lê Đình Quang (Một cửa)
    $uCvTuan = 'u0000003-0000-0000-0000-000000000003'; // Trần Anh Tuấn (Tư pháp)
    $uCvDung = 'u0000004-0000-0000-0000-000000000004'; // Lê Hoàng Dũng (Địa chính)
    $uCvHuong = 'u0000005-0000-0000-0000-000000000005'; // Nguyễn Thị Hương (Lao động)
    $uCvNam = 'u0000012-0000-0000-0000-000000000012'; // Phạm Hải Nam (Xây dựng)
    $uCvPhong = 'u0000014-0000-0000-0000-000000000014'; // Hoàng Tiến Phong (Hộ tịch)
    $uLdHai = 'u0000006-0000-0000-0000-000000000006'; // Phạm Đức Hải (Phó Chủ tịch)
    $uLdHung = 'u0000007-0000-0000-0000-000000000007'; // Vũ Quốc Hưng (Chủ tịch)
    $uLdViet = 'u0000015-0000-0000-0000-000000000015'; // Nguyễn Quốc Việt (Phó Chủ tịch)

    // A. 30 HỒ SƠ ĐÃ HOÀN THÀNH TRONG 30 NGÀY QUA (Tạo xu hướng đồ thị Recharts chuẩn)
    $citizenPool = [
        ['name' => 'Lê Văn Cường', 'cccd' => '015088006677', 'phone' => '0966554433', 'addr' => 'Số 102 phố Hồng Hà, TDP 2', 'acc' => 'ca000001-0000-0000-0000-000000000000'],
        ['name' => 'Nguyễn Văn An', 'cccd' => '015092008899', 'phone' => '0988776655', 'addr' => 'Số 24 đường Hoàng Hoa Thám, TDP 1', 'acc' => 'ca000002-0000-0000-0000-000000000000'],
        ['name' => 'Trần Thị Bích', 'cccd' => '015195007788', 'phone' => '0977665544', 'addr' => 'Số 58 đường Nguyễn Thái Học, TDP 4', 'acc' => 'ca000003-0000-0000-0000-000000000000'],
        ['name' => 'Phạm Quỳnh Dung', 'cccd' => '015198005566', 'phone' => '0944332211', 'addr' => 'Số 15 ngõ 8 Minh Tân, TDP 3', 'acc' => 'ca000004-0000-0000-0000-000000000000'],
        ['name' => 'Hoàng Minh Đức', 'cccd' => '038095001234', 'phone' => '0933221100', 'addr' => 'Số 88 đường Yên Ninh, TDP 5', 'acc' => 'ca000005-0000-0000-0000-000000000000'],
        ['name' => 'Vũ Đình Giang', 'cccd' => '015075004433', 'phone' => '0912888999', 'addr' => 'Số 42 đường Điện Biên, TDP 1', 'acc' => 'ca000006-0000-0000-0000-000000000000'],
        ['name' => 'Đỗ Thị Hạnh', 'cccd' => '015182003322', 'phone' => '0983777666', 'addr' => 'Số 19 ngách 4 phố Hồng Hà, TDP 2', 'acc' => 'ca000007-0000-0000-0000-000000000000'],
        ['name' => 'Nguyễn Tiến Khôi', 'cccd' => '015099002211', 'phone' => '0976555444', 'addr' => 'Số 76 đường Nguyễn Thái Học, TDP 4', 'acc' => 'ca000008-0000-0000-0000-000000000000'],
        ['name' => 'Bùi Thị Liễu', 'cccd' => '015160001100', 'phone' => '0903444333', 'addr' => 'Số 05 ngõ 12 Minh Tân, TDP 3', 'acc' => 'ca000009-0000-0000-0000-000000000000'],
        ['name' => 'Đinh Xuân Mai', 'cccd' => '015085009988', 'phone' => '0915333222', 'addr' => 'Số 112 đường Yên Ninh, TDP 5', 'acc' => 'ca000010-0000-0000-0000-000000000000'],
        ['name' => 'Phan Văn Nam', 'cccd' => '015093008877', 'phone' => '0987222111', 'addr' => 'Số 31 đường Nam Cường, TDP 6', 'acc' => 'ca000011-0000-0000-0000-000000000000'],
        ['name' => 'Dương Thúy Oanh', 'cccd' => '015197007766', 'phone' => '0975111000', 'addr' => 'Số 08 ngõ 2 phố Hào Gia, TDP 7', 'acc' => 'ca000012-0000-0000-0000-000000000000'],
        ['name' => 'Lý Quốc Phòng', 'cccd' => '015080006655', 'phone' => '0964000999', 'addr' => 'Số 65 đường Nguyễn Phúc, TDP 8', 'acc' => 'ca000013-0000-0000-0000-000000000000'],
        ['name' => 'Tạ Văn Sơn', 'cccd' => '015070004433', 'phone' => '0931888777', 'addr' => 'Số 89 phố Hào Gia, TDP 7', 'acc' => 'ca000015-0000-0000-0000-000000000000'],
        ['name' => 'Lương Thế Vinh', 'cccd' => '015094001122', 'phone' => '0982112233', 'addr' => 'Số 54 phố Hồng Hà, TDP 2', 'acc' => 'ca000016-0000-0000-0000-000000000000'],
        ['name' => 'Chu Thị Thanh Mai', 'cccd' => '015199003344', 'phone' => '0974223344', 'addr' => 'Số 12 đường Hoàng Hoa Thám, TDP 1', 'acc' => 'ca000017-0000-0000-0000-000000000000'],
        ['name' => 'Nghiêm Đình Khang', 'cccd' => '015082005566', 'phone' => '0963334455', 'addr' => 'Số 120 đường Nguyễn Thái Học, TDP 4', 'acc' => 'ca000018-0000-0000-0000-000000000000'],
        ['name' => 'Mai Thu Thảo', 'cccd' => '015196007788', 'phone' => '0945445566', 'addr' => 'Số 33 ngõ 5 phố Minh Tân, TDP 3', 'acc' => 'ca000019-0000-0000-0000-000000000000'],
        ['name' => 'Trần Hữu Phước', 'cccd' => '015201004455', 'phone' => '0988778899', 'addr' => 'Số 26 ngõ 4 phố Hào Gia, TDP 7', 'acc' => 'ca000022-0000-0000-0000-000000000000'],
        ['name' => 'Bạch Quốc Toản', 'cccd' => '015089008899', 'phone' => '0961990011', 'addr' => 'Số 85 đường Nguyễn Thái Học, TDP 4', 'acc' => 'ca000024-0000-0000-0000-000000000000']
    ];

    $comments = [
        'Cán bộ phục vụ rất niềm nở, hướng dẫn chi tiết và giải quyết đúng hẹn.',
        'Hệ thống thông báo tiến độ qua SMS rất tiện lợi, thủ tục nhanh chóng.',
        'Thủ tục đơn giản, trả kết quả trước hẹn 2 tiếng. Rất hài lòng!',
        'Cán bộ Một cửa hỗ trợ nhiệt tình, tra cứu mã QR rất hiện đại.',
        'Thời gian chờ đợi ngắn, cơ sở vật chất sảnh một cửa khang trang, mát mẻ.',
        'Rất thuận tiện, nhận kết quả điện tử có chữ ký số chuẩn xác.'
    ];

    // Tạo 30 hồ sơ hoàn thành trải từ 30 ngày trước đến hôm qua
    for ($d = 30; $d >= 1; $d--) {
        $c = $citizenPool[$d % count($citizenPool)];
        $procId = ($d % 15) + 1;
        $subDate = date('Y-m-d 08:30:00', strtotime("-$d days"));
        $appDate = date('Y-m-d 16:30:00', strtotime("-$d days + 2 days"));
        $compDate = date('Y-m-d 15:00:00', strtotime("-$d days + 1 day"));
        $paidDate = date('Y-m-d 09:00:00', strtotime("-$d days"));
        $appId = sprintf('a0000001-%04d-0000-0000-%012d', $d, $d);
        $dCode = '000.00.00.H49-' . date('ymd', strtotime("-$d days")) . sprintf('-%04d', $d);
        $receipt = 'BL-YB-' . date('ymd', strtotime("-$d days")) . sprintf('-%04d', $d + 1000);
        $fee = [0, 8000, 2000, 10000, 0, 50000, 15000, 10000, 0, 0, 100000, 20000, 0, 0, 0][$procId - 1];

        $insertApp->execute([
            ':id' => $appId,
            ':code' => $dCode,
            ':proc' => $procId,
            ':name' => $c['name'],
            ':cccd' => $c['cccd'],
            ':phone' => $c['phone'],
            ':address' => $c['addr'],
            ':account_id' => $c['acc'],
            ':status' => 'HOAN_THANH',
            ':channel' => ($d % 3 === 0) ? 'TRUC_TUYEN' : 'TRUC_TIEP',
            ':sub_date' => $subDate,
            ':app_date' => $appDate,
            ':comp_date' => $compDate,
            ':handler' => $uCvTuan,
            ':receiver' => $uMotCuaLan,
            ':pay_status' => ($fee > 0) ? 'DA_THANH_TOAN' : 'MIEN_PHI',
            ':pay_method' => ($fee > 0) ? 'CHUYEN_KHOAN_QR' : null,
            ':receipt' => ($fee > 0) ? $receipt : null,
            ':paid_at' => ($fee > 0) ? $paidDate : null,
            ':score' => 5,
            ':comment' => $comments[$d % count($comments)],
            ':sat_date' => $compDate,
            ':notes' => 'Hồ sơ đã trả kết quả thành công và công dân đánh giá hài lòng.',
            ':rejection' => null
        ]);

        // Ghi workflow hoàn thành
        $insertWf->execute([
            ':app_id' => $appId,
            ':from_user' => null,
            ':to_user' => $uMotCuaLan,
            ':from_status' => 'CHO_TIEP_NHAN',
            ':to_status' => 'CHO_TIEP_NHAN',
            ':action' => 'TIEP_NHAN',
            ':comment' => 'Tiếp nhận hồ sơ hợp lệ tại Bộ phận Một cửa',
            ':created_at' => $subDate
        ]);
        $insertWf->execute([
            ':app_id' => $appId,
            ':from_user' => $uMotCuaLan,
            ':to_user' => $uCvTuan,
            ':from_status' => 'CHO_TIEP_NHAN',
            ':to_status' => 'DANG_XU_LY',
            ':action' => 'PHAN_CONG',
            ':comment' => 'Chuyển chuyên viên thẩm định hồ sơ',
            ':created_at' => date('Y-m-d H:i:s', strtotime("$subDate + 1 hour"))
        ]);
        $insertWf->execute([
            ':app_id' => $appId,
            ':from_user' => $uCvTuan,
            ':to_user' => $uLdHai,
            ':from_status' => 'DANG_XU_LY',
            ':to_status' => 'CHO_KY_DUYET',
            ':action' => 'TRINH_KY',
            ':comment' => 'Hồ sơ đủ điều kiện, lập tờ trình đề nghị Lãnh đạo phê duyệt',
            ':created_at' => date('Y-m-d H:i:s', strtotime("$subDate + 4 hours"))
        ]);
        $insertWf->execute([
            ':app_id' => $appId,
            ':from_user' => $uLdHai,
            ':to_user' => $uMotCuaLan,
            ':from_status' => 'CHO_KY_DUYET',
            ':to_status' => 'DA_KY_SO',
            ':action' => 'KY_SO',
            ':comment' => 'Phó Chủ tịch UBND Phường đã phê duyệt và ký số điện tử đóng dấu đỏ',
            ':created_at' => date('Y-m-d H:i:s', strtotime("$compDate - 2 hours"))
        ]);
        $insertWf->execute([
            ':app_id' => $appId,
            ':from_user' => $uMotCuaLan,
            ':to_user' => null,
            ':from_status' => 'DA_KY_SO',
            ':to_status' => 'HOAN_THANH',
            ':action' => 'HOAN_THANH',
            ':comment' => 'Đã thu phí, in biên lai điện tử QR và trả kết quả cho công dân',
            ':created_at' => $compDate
        ]);
    }

    // B. CÁC HỒ SƠ ĐANG XỬ LÝ & ĐẶC THÙ (CHO HÔM NAY VÀ GẦN ĐÂY)
    $activeApps = [
        // 1. CHO_TIEP_NHAN: Hồ sơ trực tuyến mới nộp sáng nay
        [
            'id' => 'a0000002-0001-0000-0000-000000000001',
            'code' => "000.00.00.H49-{$todayYmd}-0001",
            'proc' => 1, // Khai sinh
            'cit' => $citizenPool[1], // Nguyễn Văn An
            'status' => 'CHO_TIEP_NHAN',
            'channel' => 'TRUC_TUYEN',
            'sub' => "$todayStr 08:15:00",
            'app' => date('Y-m-d 16:30:00', strtotime('+2 days')),
            'comp' => null,
            'handler' => $uCvTuan,
            'receiver' => $uMotCuaLan,
            'pay' => 'MIEN_PHI',
            'fee' => 0,
            'notes' => 'Công dân nộp trực tuyến qua Cổng Dịch vụ công Quốc gia, đính kèm Giấy chứng sinh'
        ],
        [
            'id' => 'a0000002-0001-0000-0000-000000000002',
            'code' => "000.00.00.H49-{$todayYmd}-0002",
            'proc' => 2, // Bản sao trích lục
            'cit' => $citizenPool[14], // Lương Thế Vinh
            'status' => 'CHO_TIEP_NHAN',
            'channel' => 'TRUC_TUYEN',
            'sub' => "$todayStr 09:10:00",
            'app' => date('Y-m-d 16:30:00', strtotime('+1 day')),
            'comp' => null,
            'handler' => $uCvPhong,
            'receiver' => $uMotCuaQuang,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 8000,
            'notes' => 'Yêu cầu 2 bản sao trích lục khai sinh'
        ],
        [
            'id' => 'a0000002-0001-0000-0000-000000000003',
            'code' => "000.00.00.H49-{$todayYmd}-0003",
            'proc' => 4, // Chứng thực chữ ký
            'cit' => $citizenPool[15], // Chu Thị Thanh Mai
            'status' => 'CHO_TIEP_NHAN',
            'channel' => 'TRUC_TIEP',
            'sub' => "$todayStr 10:05:00",
            'app' => date('Y-m-d 16:30:00', strtotime('+1 day')),
            'comp' => null,
            'handler' => $uCvTuan,
            'receiver' => $uMotCuaLan,
            'pay' => 'CHUA_THANH_TOAN',
            'fee' => 10000,
            'notes' => 'Chứng thực chữ ký trên giấy ủy quyền giải quyết bảo hiểm xã hội'
        ],
        // 2. DANG_XU_LY: Các hồ sơ đang thẩm định chuyên môn
        [
            'id' => 'a0000002-0002-0000-0000-000000000001',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-1 day')) . '-0011',
            'proc' => 5, // Đăng ký kết hôn
            'cit' => $citizenPool[2], // Trần Thị Bích
            'status' => 'DANG_XU_LY',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 09:30:00', strtotime('-1 day')),
            'app' => date('Y-m-d 16:30:00', strtotime('+2 days')),
            'comp' => null,
            'handler' => $uCvTuan,
            'receiver' => $uMotCuaLan,
            'pay' => 'MIEN_PHI',
            'fee' => 0,
            'notes' => 'Hai bên nam nữ đã có mặt ký tên vào Sổ đăng ký kết hôn, đang hoàn thiện trích lục'
        ],
        [
            'id' => 'a0000002-0002-0000-0000-000000000002',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-2 days')) . '-0012',
            'proc' => 6, // Đất đai biến động
            'cit' => $citizenPool[16], // Nghiêm Đình Khang
            'status' => 'DANG_XU_LY',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 14:00:00', strtotime('-2 days')),
            'app' => date('Y-m-d 16:30:00', strtotime('+4 days')),
            'comp' => null,
            'handler' => $uCvDung,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 50000,
            'notes' => 'Chuyên viên địa chính đang đối chiếu hồ sơ địa chính và sổ mục kê đất TDP 4'
        ],
        [
            'id' => 'a0000002-0002-0000-0000-000000000003',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-3 days')) . '-0013',
            'proc' => 11, // Cấp phép xây dựng
            'cit' => $citizenPool[4], // Hoàng Minh Đức
            'status' => 'DANG_XU_LY',
            'channel' => 'TRUC_TUYEN',
            'sub' => date('Y-m-d 10:15:00', strtotime('-3 days')),
            'app' => date('Y-m-d 16:30:00', strtotime('+3 days')),
            'comp' => null,
            'handler' => $uCvNam,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 100000,
            'notes' => 'Đã kiểm tra thực địa chỉ giới xây dựng và quy hoạch mật độ xây dựng'
        ],
        [
            'id' => 'a0000002-0002-0000-0000-000000000004',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-2 days')) . '-0014',
            'proc' => 14, // Trợ cấp bảo trợ xã hội
            'cit' => $citizenPool[8], // Bùi Thị Liễu
            'status' => 'DANG_XU_LY',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 08:45:00', strtotime('-2 days')),
            'app' => date('Y-m-d 16:30:00', strtotime('+3 days')),
            'comp' => null,
            'handler' => $uCvHuong,
            'receiver' => $uMotCuaLan,
            'pay' => 'MIEN_PHI',
            'fee' => 0,
            'notes' => 'Hồ sơ người cao tuổi trên 80 tuổi không có lương hưu'
        ],
        // Cảnh báo SLA vàng (<24h)
        [
            'id' => 'a0000002-0002-0000-0000-000000000005',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-1 day')) . '-0015',
            'proc' => 7, // Tình trạng hôn nhân
            'cit' => $citizenPool[17], // Mai Thu Thảo
            'status' => 'DANG_XU_LY',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 08:30:00', strtotime('-1 day')),
            'app' => date('Y-m-d H:i:s', strtotime('+8 hours')), // < 24h (Vàng cảnh báo)
            'comp' => null,
            'handler' => $uCvTuan,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 15000,
            'notes' => 'Xác nhận tình trạng độc thân để làm thủ tục mua nhà ở'
        ],
        [
            'id' => 'a0000002-0002-0000-0000-000000000006',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-2 days')) . '-0016',
            'proc' => 12, // Đào đường thi công
            'cit' => $citizenPool[19], // Bạch Quốc Toản
            'status' => 'DANG_XU_LY',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 13:30:00', strtotime('-2 days')),
            'app' => date('Y-m-d H:i:s', strtotime('+18 hours')), // < 24h (Vàng cảnh báo)
            'comp' => null,
            'handler' => $uCvNam,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 20000,
            'notes' => 'Thi công đấu nối ống cấp nước sạch sinh hoạt tại đường Nguyễn Thái Học'
        ],
        // Cảnh báo SLA đỏ (Quá hạn 1 ngày có kiểm soát)
        [
            'id' => 'a0000002-0002-0000-0000-000000000007',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-10 days')) . '-0099',
            'proc' => 6, // Đăng ký đất đai
            'cit' => $citizenPool[0], // Lê Văn Cường
            'status' => 'DANG_XU_LY',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 08:30:00', strtotime('-10 days')),
            'app' => date('Y-m-d H:i:s', strtotime('-24 hours')), // Đã quá hạn 1 ngày!
            'comp' => null,
            'handler' => $uCvDung,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 50000,
            'notes' => 'Hồ sơ đang tạm dừng để xác minh ranh giới thửa đất do hộ liền kề chưa thống nhất ký giáp ranh'
        ],
        // 3. CHO_KY_DUYET: Chuyên viên đã trình ký, chờ Lãnh đạo ký số
        [
            'id' => 'a0000002-0003-0000-0000-000000000001',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-1 day')) . '-0021',
            'proc' => 3, // Chứng thực sao y
            'cit' => $citizenPool[3], // Phạm Quỳnh Dung
            'status' => 'CHO_KY_DUYET',
            'channel' => 'TRUC_TUYEN',
            'sub' => date('Y-m-d 11:00:00', strtotime('-1 day')),
            'app' => date('Y-m-d 16:30:00', strtotime('+1 day')),
            'comp' => null,
            'handler' => $uCvTuan,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 10000,
            'notes' => 'Đã đối chiếu bản gốc điện tử, trình Lãnh đạo ký số phê duyệt'
        ],
        [
            'id' => 'a0000002-0003-0000-0000-000000000002',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-2 days')) . '-0022',
            'proc' => 11, // Cấp phép xây dựng
            'cit' => $citizenPool[6], // Đỗ Thị Hạnh
            'status' => 'CHO_KY_DUYET',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 09:00:00', strtotime('-2 days')),
            'app' => date('Y-m-d 16:30:00', strtotime('+1 day')),
            'comp' => null,
            'handler' => $uCvNam,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 100000,
            'notes' => 'Đã kiểm tra bản vẽ thiết kế phù hợp cốt san nền, trình Chủ tịch duyệt ký số'
        ],
        [
            'id' => 'a0000002-0003-0000-0000-000000000003',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-2 days')) . '-0023',
            'proc' => 15, // Người có công
            'cit' => $citizenPool[13], // Tạ Văn Sơn
            'status' => 'CHO_KY_DUYET',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 14:30:00', strtotime('-2 days')),
            'app' => date('Y-m-d 16:30:00', strtotime('+2 days')),
            'comp' => null,
            'handler' => $uCvHuong,
            'receiver' => $uMotCuaLan,
            'pay' => 'MIEN_PHI',
            'fee' => 0,
            'notes' => 'Trình ký xác nhận hồ sơ thương binh hạng 2/4 đề nghị hưởng phụ cấp trang thiết bị chỉnh hình'
        ],
        // 4. DA_KY_SO: Lãnh đạo đã duyệt và ký số điện tử
        [
            'id' => 'a0000002-0004-0000-0000-000000000001',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-1 day')) . '-0031',
            'proc' => 2, // Trích lục khai sinh
            'cit' => $citizenPool[7], // Nguyễn Tiến Khôi
            'status' => 'DA_KY_SO',
            'channel' => 'TRUC_TUYEN',
            'sub' => date('Y-m-d 10:00:00', strtotime('-1 day')),
            'app' => date('Y-m-d 16:30:00', strtotime('+1 day')),
            'comp' => null,
            'handler' => $uCvTuan,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 8000,
            'notes' => 'Phó Chủ tịch Phạm Đức Hải đã ký số, dấu đỏ Cơ yếu đã đóng, chuyển Một cửa sẵn sàng trả'
        ],
        [
            'id' => 'a0000002-0004-0000-0000-000000000002',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-2 days')) . '-0032',
            'proc' => 4, // Chứng thực ủy quyền
            'cit' => $citizenPool[18], // Trần Hữu Phước
            'status' => 'DA_KY_SO',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 15:00:00', strtotime('-2 days')),
            'app' => date('Y-m-d 16:30:00', strtotime('+1 day')),
            'comp' => null,
            'handler' => $uCvTuan,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 10000,
            'notes' => 'Đã ký số phê duyệt chứng thực hợp đồng ủy quyền nhận học bổng'
        ],
        // 5. TRA_LAI: Yêu cầu bổ sung hồ sơ
        [
            'id' => 'a0000002-0005-0000-0000-000000000001',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-2 days')) . '-0041',
            'proc' => 6, // Đăng ký đất đai
            'cit' => $citizenPool[12], // Lý Quốc Phòng
            'status' => 'TRA_LAI',
            'channel' => 'TRUC_TIEP',
            'sub' => date('Y-m-d 09:30:00', strtotime('-2 days')),
            'app' => date('Y-m-d 16:30:00', strtotime('+3 days')),
            'comp' => null,
            'handler' => $uCvDung,
            'receiver' => $uMotCuaLan,
            'pay' => 'DA_THANH_TOAN',
            'fee' => 50000,
            'notes' => 'Yêu cầu công dân nộp bổ sung bản sao chứng thực CCCD của bên tặng cho quyền sử dụng đất',
            'rejection' => 'Hồ sơ thiếu bản sao CCCD có công chứng của bên chuyển quyền'
        ],
        // 6. TU_CHOI: Từ chối giải quyết (Kèm văn bản nêu rõ lý do theo Nghị định 61/2018)
        [
            'id' => 'a0000002-0006-0000-0000-000000000001',
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-3 days')) . '-0051',
            'proc' => 1, // Khai sinh
            'cit' => $citizenPool[11], // Dương Thúy Oanh
            'status' => 'TU_CHOI',
            'channel' => 'TRUC_TUYEN',
            'sub' => date('Y-m-d 10:00:00', strtotime('-3 days')),
            'app' => date('Y-m-d 16:30:00', strtotime('-1 day')),
            'comp' => date('Y-m-d 14:00:00', strtotime('-1 day')),
            'handler' => $uCvTuan,
            'receiver' => $uMotCuaLan,
            'pay' => 'MIEN_PHI',
            'fee' => 0,
            'notes' => 'Từ chối giải quyết hồ sơ do trùng lặp thông tin công dân',
            'rejection' => 'Qua tra cứu trên Cơ sở dữ liệu Quốc gia về Dân cư, trẻ đã được đăng ký khai sinh tại Phường Nam Cường ngày 15/10/2026. Đề nghị công dân liên hệ Phường Nam Cường để xin cấp bản sao trích lục.'
        ]
    ];

    foreach ($activeApps as $app) {
        $receipt = ($app['pay'] === 'DA_THANH_TOAN') ? 'BL-YB-' . date('ymd') . '-' . rand(2000, 9999) : null;
        $paidAt = $receipt ? $app['sub'] : null;

        $insertApp->execute([
            ':id' => $app['id'],
            ':code' => $app['code'],
            ':proc' => $app['proc'],
            ':name' => $app['cit']['name'],
            ':cccd' => $app['cit']['cccd'],
            ':phone' => $app['cit']['phone'],
            ':address' => $app['cit']['addr'],
            ':account_id' => $app['cit']['acc'],
            ':status' => $app['status'],
            ':channel' => $app['channel'],
            ':sub_date' => $app['sub'],
            ':app_date' => $app['app'],
            ':comp_date' => $app['comp'],
            ':handler' => $app['handler'],
            ':receiver' => $app['receiver'],
            ':pay_status' => $app['pay'],
            ':pay_method' => ($receipt ? 'CHUYEN_KHOAN_QR' : null),
            ':receipt' => $receipt,
            ':paid_at' => $paidAt,
            ':score' => null,
            ':comment' => null,
            ':sat_date' => null,
            ':notes' => $app['notes'] ?? '',
            ':rejection' => $app['rejection'] ?? null
        ]);

        // Ghi workflow theo từng trạng thái
        $insertWf->execute([
            ':app_id' => $app['id'],
            ':from_user' => null,
            ':to_user' => $app['receiver'],
            ':from_status' => 'CHO_TIEP_NHAN',
            ':to_status' => 'CHO_TIEP_NHAN',
            ':action' => 'TIEP_NHAN',
            ':comment' => 'Tiếp nhận hồ sơ qua kênh ' . ($app['channel'] === 'TRUC_TUYEN' ? 'Cổng Dịch vụ công trực tuyến' : 'Trực tiếp tại quầy'),
            ':created_at' => $app['sub']
        ]);

        if (in_array($app['status'], ['DANG_XU_LY', 'CHO_KY_DUYET', 'DA_KY_SO', 'TRA_LAI', 'TU_CHOI'])) {
            $insertWf->execute([
                ':app_id' => $app['id'],
                ':from_user' => $app['receiver'],
                ':to_user' => $app['handler'],
                ':from_status' => 'CHO_TIEP_NHAN',
                ':to_status' => 'DANG_XU_LY',
                ':action' => 'PHAN_CONG',
                ':comment' => 'Chuyển chuyên viên phụ trách chuyên môn giải quyết',
                ':created_at' => date('Y-m-d H:i:s', strtotime("{$app['sub']} + 1 hour"))
            ]);
        }

        if (in_array($app['status'], ['CHO_KY_DUYET', 'DA_KY_SO'])) {
            $insertWf->execute([
                ':app_id' => $app['id'],
                ':from_user' => $app['handler'],
                ':to_user' => $uLdHai,
                ':from_status' => 'DANG_XU_LY',
                ':to_status' => 'CHO_KY_DUYET',
                ':action' => 'TRINH_KY',
                ':comment' => 'Chuyên viên hoàn thiện hồ sơ và gửi tờ trình ký số',
                ':created_at' => date('Y-m-d H:i:s', strtotime("{$app['sub']} + 5 hours"))
            ]);
        }

        if ($app['status'] === 'DA_KY_SO') {
            $insertWf->execute([
                ':app_id' => $app['id'],
                ':from_user' => $uLdHai,
                ':to_user' => $app['receiver'],
                ':from_status' => 'CHO_KY_DUYET',
                ':to_status' => 'DA_KY_SO',
                ':action' => 'KY_SO',
                ':comment' => 'Lãnh đạo UBND Phường ký số chứng thư số ban hành kết quả',
                ':created_at' => date('Y-m-d H:i:s', strtotime("{$app['sub']} + 8 hours"))
            ]);
        }
    }

    // -------------------------------------------------------------
    // 8. NẠP 22 PHẢN ÁNH HIỆN TRƯỜNG (GIS MAP) PHỦ ĐẦY 8 TỔ DÂN PHỐ
    // -------------------------------------------------------------
    $insertCpl = $db->prepare('
        INSERT INTO complaints (
            id, complaint_code, citizen_name, citizen_phone, citizen_cccd, citizen_account_id,
            category, title, description, location, latitude, longitude,
            status, priority, assigned_to, response, responded_at, photo_paths, resolved_photo_paths,
            created_at, updated_at
        ) VALUES (
            :id, :code, :name, :phone, :cccd, :acc_id,
            :cat, :title, :desc, :loc, :lat, :lng,
            :status, :priority, :assigned, :resp, :resp_at, :photos, :rphotos,
            :created, :updated
        )
    ');

    $complaintData = [
        // --- CHƯA GIẢI QUYẾT: MỚI GỬI (MOI) ---
        [
            'code' => 'PAKN-261112-001',
            'cat' => 'RAC_THAI',
            'name' => 'Hoàng Minh Đức',
            'phone' => '0933221100',
            'cccd' => '038095001234',
            'acc' => 'ca000005-0000-0000-0000-000000000000',
            'title' => 'Rác thải tồn đọng ngã tư Đinh Tiên Hoàng - Hoàng Hoa Thám',
            'desc' => 'Bãi rác tự phát bốc mùi hôi thối vào sáng sớm tại góc vỉa hè ngã tư, gây cản trở người đi bộ và mất mỹ quan đô thị trung tâm.',
            'loc' => 'Ngã tư Đinh Tiên Hoàng - Hoàng Hoa Thám, TDP 1',
            'lat' => 21.717500,
            'lng' => 104.896000,
            'status' => 'MOI',
            'priority' => 'CAO',
            'assigned' => null,
            'resp' => null,
            'resp_at' => null,
            'photos' => json_encode(['/uploads/complaints/rac_nga_tu_1.jpg', '/uploads/complaints/rac_nga_tu_2.jpg']),
            'rphotos' => null,
            'created' => "$todayStr 07:30:00"
        ],
        [
            'code' => 'PAKN-261112-002',
            'cat' => 'DIEN_NUOC',
            'name' => 'Đinh Xuân Mai',
            'phone' => '0915333222',
            'cccd' => '015085009988',
            'acc' => 'ca000010-0000-0000-0000-000000000000',
            'title' => 'Cột điện chiếu sáng ngõ 15 Yên Ninh bị nghiêng sau bão',
            'desc' => 'Cột bê tông chiếu sáng đầu ngõ bị rạn nứt chân và nghiêng khoảng 20 độ về phía lòng ngõ, có nguy cơ đổ đè vào dây điện và nhà dân khi có gió mạnh.',
            'loc' => 'Đầu ngõ 15 đường Yên Ninh, TDP 5',
            'lat' => 21.714800,
            'lng' => 104.893500,
            'status' => 'MOI',
            'priority' => 'KHAN_CAP',
            'assigned' => null,
            'resp' => null,
            'resp_at' => null,
            'photos' => json_encode(['/uploads/complaints/cot_dien_nghieng.jpg']),
            'rphotos' => null,
            'created' => "$todayStr 08:45:00"
        ],
        [
            'code' => 'PAKN-261112-003',
            'cat' => 'MOI_TRUONG',
            'name' => 'Đoàn Thị Yến',
            'phone' => '0917667788',
            'cccd' => '015187002233',
            'acc' => 'ca000021-0000-0000-0000-000000000000',
            'title' => 'Xe chở đất cát công trình làm rơi vãi bùn đất ra đường Nam Cường',
            'desc' => 'Đoàn xe tải chở đất từ công trình san lấp không che bạt kín, làm rơi vãi lượng lớn đất cát trên đoạn đường 200m gây trơn trượt nguy hiểm cho người đi xe máy.',
            'loc' => 'Đoạn trước số nhà 19 đường Nam Cường, TDP 6',
            'lat' => 21.719500,
            'lng' => 104.894200,
            'status' => 'MOI',
            'priority' => 'CAO',
            'assigned' => null,
            'resp' => null,
            'resp_at' => null,
            'photos' => json_encode(['/uploads/complaints/xe_tai_dat_cat.jpg']),
            'rphotos' => null,
            'created' => "$todayStr 09:20:00"
        ],
        [
            'code' => 'PAKN-261111-001',
            'cat' => 'LAN_CHIEM',
            'name' => 'Phạm Quỳnh Dung',
            'phone' => '0944332211',
            'cccd' => '015198005566',
            'acc' => 'ca000004-0000-0000-0000-000000000000',
            'title' => 'Căng phông bạt, biển quảng cáo choán hết vỉa hè người đi bộ phố Minh Tân',
            'desc' => 'Quán cà phê số 33 căng ô bạt cố định và dựng 3 biển quảng cáo đứng chắn toàn bộ lối đi của người đi bộ.',
            'loc' => 'Số 33 phố Minh Tân, TDP 3',
            'lat' => 21.716000,
            'lng' => 104.897500,
            'status' => 'MOI',
            'priority' => 'TRUNG_BINH',
            'assigned' => null,
            'resp' => null,
            'resp_at' => null,
            'photos' => json_encode(['/uploads/complaints/bien_quang_cao_lan_chiem.jpg']),
            'rphotos' => null,
            'created' => date('Y-m-d 15:30:00', strtotime('-1 day'))
        ],
        [
            'code' => 'PAKN-261111-002',
            'cat' => 'DIEN_NUOC',
            'name' => 'Lương Thế Vinh',
            'phone' => '0982112233',
            'cccd' => '015094001122',
            'acc' => 'ca000016-0000-0000-0000-000000000000',
            'title' => 'Vỡ đường ống nước sạch gây ngập ngõ 8 phố Hồng Hà',
            'desc' => 'Đoạn ống nước sạch ngầm bị bục vỡ từ đêm qua, nước sạch tràn lênh láng ngập đoạn ngõ 8 sâu 10cm làm ảnh hưởng việc đi lại của các hộ dân.',
            'loc' => 'Ngõ 8 phố Hồng Hà, TDP 2',
            'lat' => 21.718800,
            'lng' => 104.899800,
            'status' => 'MOI',
            'priority' => 'CAO',
            'assigned' => null,
            'resp' => null,
            'resp_at' => null,
            'photos' => json_encode(['/uploads/complaints/ong_nuoc_vo.jpg']),
            'rphotos' => null,
            'created' => date('Y-m-d 16:45:00', strtotime('-1 day'))
        ],
        [
            'code' => 'PAKN-261110-001',
            'cat' => 'AN_NINH',
            'name' => 'Trần Hữu Phước',
            'phone' => '0988778899',
            'cccd' => '015201004455',
            'acc' => 'ca000022-0000-0000-0000-000000000000',
            'title' => 'Quán karaoke hoạt động quá 24h đêm gây mất an ninh trật tự khu dân cư',
            'desc' => 'Quán hát số 26 phố Hào Gia thường xuyên mở nhạc công suất lớn và để khách hò hét ngoài cửa quán tới 1-2h sáng, ảnh hưởng giấc ngủ người già và trẻ nhỏ.',
            'loc' => 'Số 26 ngõ 4 phố Hào Gia, TDP 7',
            'lat' => 21.721000,
            'lng' => 104.902000,
            'status' => 'MOI',
            'priority' => 'CAO',
            'assigned' => null,
            'resp' => null,
            'resp_at' => null,
            'photos' => null,
            'rphotos' => null,
            'created' => date('Y-m-d 23:45:00', strtotime('-2 days'))
        ],

        // --- CHƯA GIẢI QUYẾT: ĐANG XỬ LÝ (DANG_XU_LY) ---
        [
            'code' => 'PAKN-261006-002',
            'cat' => 'LAN_CHIEM',
            'name' => 'Lê Thị Thu',
            'phone' => '0972888777',
            'cccd' => '015193006655',
            'acc' => null,
            'title' => 'Quán ăn lấn chiếm toàn bộ vỉa hè người đi bộ tại đường Nguyễn Thái Học',
            'desc' => 'Quán cơm số 76 kê bàn ghế tràn lan ra vỉa hè, xe máy để kín lối đi của học sinh trường tiểu học gần đó.',
            'loc' => 'Số 76 đường Nguyễn Thái Học, TDP 4',
            'lat' => 21.718200,
            'lng' => 104.899200,
            'status' => 'DANG_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => null,
            'resp_at' => null,
            'photos' => json_encode(['/uploads/complaints/quan_an_lan_chiem.jpg']),
            'rphotos' => null,
            'created' => date('Y-m-d 08:30:00', strtotime('-3 days'))
        ],
        [
            'code' => 'PAKN-261007-004',
            'cat' => 'AN_NINH',
            'name' => 'Nguyễn Thị Hoa',
            'phone' => '0984555666',
            'cccd' => '015180004433',
            'acc' => null,
            'title' => 'Nhóm thanh niên tụ tập đua xe, nẹt pô đêm khuya quanh hồ Hào Gia',
            'desc' => 'Đêm nào từ 23h đến 1h sáng cũng có nhóm thanh niên tụ tập rú ga, nẹt pô gây mất ngủ cho nhân dân quanh khu vực hồ Hào Gia.',
            'loc' => 'Khu vực đường quanh hồ Hào Gia, TDP 7',
            'lat' => 21.720100,
            'lng' => 104.901500,
            'status' => 'DANG_XU_LY',
            'priority' => 'CAO',
            'assigned' => $uCvDung,
            'resp' => null,
            'resp_at' => null,
            'photos' => null,
            'rphotos' => null,
            'created' => date('Y-m-d 22:30:00', strtotime('-3 days'))
        ],
        [
            'code' => 'PAKN-261109-001',
            'cat' => 'GIAO_THONG',
            'name' => 'Nguyễn Văn An',
            'phone' => '0988776655',
            'cccd' => '015092008899',
            'acc' => 'ca000002-0000-0000-0000-000000000000',
            'title' => 'Hố ga mất nắp nguy hiểm tại ngã 3 Điện Biên - Hoàng Hoa Thám',
            'desc' => 'Nắp cống thoát nước ngã ba bị vỡ gãy hoàn toàn tạo thành hố sâu 1.2m, người dân đã cắm tạm cành cây để báo hiệu nguy hiểm.',
            'loc' => 'Ngã ba đường Điện Biên - Hoàng Hoa Thám, TDP 1',
            'lat' => 21.715500,
            'lng' => 104.895000,
            'status' => 'DANG_XU_LY',
            'priority' => 'KHAN_CAP',
            'assigned' => $uCvNam,
            'resp' => null,
            'resp_at' => null,
            'photos' => json_encode(['/uploads/complaints/ho_ga_mat_nap.jpg']),
            'rphotos' => null,
            'created' => date('Y-m-d 10:15:00', strtotime('-3 days'))
        ],
        [
            'code' => 'PAKN-261108-001',
            'cat' => 'MOI_TRUONG',
            'name' => 'Bùi Thị Liễu',
            'phone' => '0903444333',
            'cccd' => '015160001100',
            'acc' => 'ca000009-0000-0000-0000-000000000000',
            'title' => 'Cơ sở mộc xả bụi sơn PU trực tiếp ra khu dân cư Yên Ninh',
            'desc' => 'Xưởng mộc mỹ nghệ gia công đồ gỗ hoạt động xịt sơn bóng PU ngoài trời không có buồng lọc mùi, mùi hóa chất nồng nặc cả ngày.',
            'loc' => 'Số 112 đường Yên Ninh, TDP 5',
            'lat' => 21.714200,
            'lng' => 104.892000,
            'status' => 'DANG_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => null,
            'resp_at' => null,
            'photos' => json_encode(['/uploads/complaints/bui_son_go.jpg']),
            'rphotos' => null,
            'created' => date('Y-m-d 14:00:00', strtotime('-4 days'))
        ],

        // --- ĐÃ GIẢI QUYẾT: HOÀN TẤT (DA_XU_LY & DONG) ---
        [
            'code' => 'PAKN-261005-001',
            'cat' => 'RAC_THAI',
            'name' => 'Trần Văn Mạnh',
            'phone' => '0981999888',
            'cccd' => '015090009988',
            'acc' => null,
            'title' => 'Tập kết rác thải tự phát gây ô nhiễm môi trường',
            'desc' => 'Bãi đất trống đầu ngõ 12 đường Hồng Hà thường xuyên bị một số hộ dân đổ rác thải sinh hoạt bừa bãi, bốc mùi hôi thối vào giờ cao điểm.',
            'loc' => 'Đầu ngõ 12, phố Hồng Hà, TDP 2',
            'lat' => 21.716800,
            'lng' => 104.896500,
            'status' => 'DA_XU_LY',
            'priority' => 'CAO',
            'assigned' => $uCvDung,
            'resp' => 'Đội Quản lý trật tự đô thị phường đã phối hợp cùng Công ty Môi trường đô thị dọn dẹp sạch sẽ toàn bộ 4 tấn rác thải, đồng thời cắm biển cấm đổ rác và lắp camera giám sát 24/7.',
            'resp_at' => date('Y-m-d 10:00:00', strtotime('-5 days')),
            'photos' => json_encode(['/uploads/complaints/rac_ngan_ngap.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/rac_da_don_sach.jpg']),
            'created' => date('Y-m-d 08:00:00', strtotime('-7 days'))
        ],
        [
            'code' => 'PAKN-261007-005',
            'cat' => 'GIAO_THONG',
            'name' => 'Vũ Văn Hào',
            'phone' => '0973666555',
            'cccd' => '015072003322',
            'acc' => null,
            'title' => 'Nắp hố ga bị sụt lún nguy hiểm trước cổng trường mầm non',
            'desc' => 'Nắp cống thoát nước bị sụt sâu khoảng 15cm so với mặt đường, nhiều phụ huynh đưa đón con nhỏ đi xe máy bị quẹt gầm suýt ngã.',
            'loc' => 'Trước cổng trường Mầm non Đồng Tâm, TDP 1',
            'lat' => 21.715300,
            'lng' => 104.894800,
            'status' => 'DA_XU_LY',
            'priority' => 'KHAN_CAP',
            'assigned' => $uCvDung,
            'resp' => 'UBND Phường đã chỉ đạo đơn vị thi công hạ tầng đô thị thay thế bằng nắp đan gang chịu lực 40 tấn và thảm bê tông nhựa phẳng mặt đường, bảo đảm an toàn tuyệt đối cho các cháu học sinh.',
            'resp_at' => date('Y-m-d 11:30:00', strtotime('-5 days')),
            'photos' => json_encode(['/uploads/complaints/ho_ga_sut_lun.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/ho_ga_da_sua.jpg']),
            'created' => date('Y-m-d 09:30:00', strtotime('-6 days'))
        ],
        [
            'code' => 'PAKN-261105-001',
            'cat' => 'GIAO_THONG',
            'name' => 'Lý Quốc Phòng',
            'phone' => '0964000999',
            'cccd' => '015080006655',
            'acc' => 'ca000013-0000-0000-0000-000000000000',
            'title' => 'Cành cây phượng lớn gãy chắn ngang đường Nguyễn Phúc sau mưa bão',
            'desc' => 'Cành phượng vĩ đường kính 25cm bị tét gãy chắn ngang lối đi ngõ 65 Nguyễn Phúc, dây cáp viễn thông bị kéo võng xuống thấp.',
            'loc' => 'Số 65 đường Nguyễn Phúc, TDP 8',
            'lat' => 21.713500,
            'lng' => 104.897000,
            'status' => 'DA_XU_LY',
            'priority' => 'CAO',
            'assigned' => $uCvDung,
            'resp' => 'Đội Quản lý cây xanh đô thị và lực lượng Dân quân phường đã cắt tỉa, dọn cành cây gãy giải tỏa lòng đường thông thoáng trong vòng 2 giờ kể từ khi tiếp nhận tin báo.',
            'resp_at' => date('Y-m-d 11:00:00', strtotime('-6 days')),
            'photos' => json_encode(['/uploads/complaints/canh_cay_gay.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/duong_da_thong_thoang.jpg']),
            'created' => date('Y-m-d 07:30:00', strtotime('-7 days'))
        ],
        [
            'code' => 'PAKN-261104-001',
            'cat' => 'DIEN_NUOC',
            'name' => 'Hoàng Văn Thắng',
            'phone' => '0963777666',
            'cccd' => '015085005544',
            'acc' => null,
            'title' => 'Hệ thống đèn chiếu sáng công cộng ngõ 5 phố Yên Ninh bị hỏng',
            'desc' => '3 bóng đèn cao áp chiếu sáng đầu ngõ bị mất điện nhiều đêm liên tiếp gây nguy cơ mất an toàn giao thông và an ninh trật tự ban đêm.',
            'loc' => 'Ngõ 5 đường Yên Ninh, TDP 5',
            'lat' => 21.714500,
            'lng' => 104.893100,
            'status' => 'DA_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => 'Công ty Điện lực Yên Bái và Bộ phận Địa chính đô thị phường đã thay thế toàn bộ 3 bóng đèn cao áp bị cháy bằng bóng LED 150W tiết kiệm điện, hệ thống chiếu sáng ngõ đã hoạt động bình thường trở lại.',
            'resp_at' => date('Y-m-d 16:00:00', strtotime('-7 days')),
            'photos' => json_encode(['/uploads/complaints/den_duong_hong.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/den_duong_da_sang.jpg']),
            'created' => date('Y-m-d 20:00:00', strtotime('-9 days'))
        ],
        [
            'code' => 'PAKN-261102-001',
            'cat' => 'RAC_THAI',
            'name' => 'Phan Văn Nam',
            'phone' => '0987222111',
            'cccd' => '015093008877',
            'acc' => 'ca000011-0000-0000-0000-000000000000',
            'title' => 'Đổ trộm cát đá, phế thải xây dựng ra đất trống Nam Cường',
            'desc' => 'Khoảng 3 xe ben đổ trộm cát sỏi và bê tông vỡ ven bờ mương đường Nam Cường làm hẹp dòng chảy thoát nước.',
            'loc' => 'Khu đất trống giáp mương đường Nam Cường, TDP 6',
            'lat' => 21.719200,
            'lng' => 104.895200,
            'status' => 'DA_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => 'Tổ trật tự đô thị đã trích xuất camera an ninh, lập biên bản xử phạt chủ phương tiện 3.500.000đ và buộc xúc dọn toàn bộ đất thải hoàn trả mặt bằng trong ngày.',
            'resp_at' => date('Y-m-d 15:30:00', strtotime('-9 days')),
            'photos' => json_encode(['/uploads/complaints/phe_thai_nam_cuong.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/mat_bang_da_don.jpg']),
            'created' => date('Y-m-d 08:30:00', strtotime('-11 days'))
        ],
        [
            'code' => 'PAKN-261101-001',
            'cat' => 'MOI_TRUONG',
            'name' => 'Mai Thu Thảo',
            'phone' => '0945445566',
            'cccd' => '015196007788',
            'acc' => 'ca000019-0000-0000-0000-000000000000',
            'title' => 'Hộ kinh doanh rửa xe xả nước thải trực tiếp ra rãnh thoát nước ngõ 3 Minh Tân',
            'desc' => 'Tiệm rửa xe bọt tuyết xả nước bẩn chứa xà phòng và dầu mỡ thẳng ra ngõ, lâu ngày đóng rêu xanh trơn trượt.',
            'loc' => 'Số 15 ngõ 3 phố Minh Tân, TDP 3',
            'lat' => 21.716200,
            'lng' => 104.897000,
            'status' => 'DA_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => 'UBND Phường đã kiểm tra thực tế, yêu cầu cơ sở xây dựng hố ga lắng cát 3 ngăn và đấu nối nước thải vào đường ống chính, ký cam kết không để nước tràn ra mặt ngõ.',
            'resp_at' => date('Y-m-d 14:00:00', strtotime('-10 days')),
            'photos' => json_encode(['/uploads/complaints/rua_xe_tran_ngo.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/ho_ga_lang_loc.jpg']),
            'created' => date('Y-m-d 10:00:00', strtotime('-12 days'))
        ],
        [
            'code' => 'PAKN-261028-001',
            'cat' => 'LAN_CHIEM',
            'name' => 'Vũ Đình Giang',
            'phone' => '0912888999',
            'cccd' => '015075004433',
            'acc' => 'ca000006-0000-0000-0000-000000000000',
            'title' => 'Chợ cóc tự phát họp lấn chiếm lòng đường ngã tư Hoàng Hoa Thám',
            'desc' => 'Từ 5h30 đến 7h30 sáng hàng ngày có khoảng 15 gánh hàng rau, thịt tụ tập bày bán tràn xuống lòng đường gây ách tắc giao thông vào giờ đi làm.',
            'loc' => 'Khu vực ngã tư đường Hoàng Hoa Thám, TDP 1',
            'lat' => 21.717800,
            'lng' => 104.896200,
            'status' => 'DA_XU_LY',
            'priority' => 'CAO',
            'assigned' => $uCvDung,
            'resp' => 'Công an phường phối hợp cùng Ban Quản lý trật tự đô thị tổ chức chốt chặn vào khung giờ cao điểm buổi sáng, giải tỏa dứt điểm các điểm bán rong tự phát và hướng dẫn tiểu thương vào trong chợ Đồng Tâm kinh doanh đúng nơi quy định.',
            'resp_at' => date('Y-m-d 08:30:00', strtotime('-14 days')),
            'photos' => json_encode(['/uploads/complaints/cho_coc_sang.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/nga_tu_thong_thoang.jpg']),
            'created' => date('Y-m-d 06:15:00', strtotime('-16 days'))
        ],
        [
            'code' => 'PAKN-261025-001',
            'cat' => 'MOI_TRUONG',
            'name' => 'Triệu Thị Nga',
            'phone' => '0979889900',
            'cccd' => '015165006677',
            'acc' => 'ca000023-0000-0000-0000-000000000000',
            'title' => 'Mương thoát nước chung bị bồi lắng tắc nghẽn bốc mùi hôi thối',
            'desc' => 'Đoạn mương hở dài 100m phía sau dãy nhà đường Nguyễn Phúc nhiều năm không nạo vét, bùn rác ứ đọng làm muỗi sinh sôi nhiều.',
            'loc' => 'Phía sau số 92 đường Nguyễn Phúc, TDP 8',
            'lat' => 21.713800,
            'lng' => 104.897200,
            'status' => 'DA_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => 'UBND Phường đã bố trí kinh phí sự nghiệp môi trường thuê máy hút bùn và công nhân nạo vét sạch sẽ 120m mương thoát nước, rắc vôi bột khử khuẩn khu dân cư.',
            'resp_at' => date('Y-m-d 16:30:00', strtotime('-17 days')),
            'photos' => json_encode(['/uploads/complaints/muong_nuoc_tac.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/muong_nuoc_sach.jpg']),
            'created' => date('Y-m-d 08:00:00', strtotime('-20 days'))
        ],
        [
            'code' => 'PAKN-261022-001',
            'cat' => 'GIAO_THONG',
            'name' => 'Bạch Quốc Toản',
            'phone' => '0961990011',
            'cccd' => '015089008899',
            'acc' => 'ca000024-0000-0000-0000-000000000000',
            'title' => 'Tấm đan hố cáp ngầm viễn thông bị cập kênh gây tiếng ồn lớn khi xe chạy qua',
            'desc' => 'Tấm đan bằng thép trước số 45 Nguyễn Thái Học bị cong vênh, mỗi khi có ô tô chèn qua tạo tiếng kêu va đập rất to cả ngày lẫn đêm.',
            'loc' => 'Trước số 45 đường Nguyễn Thái Học, TDP 4',
            'lat' => 21.718000,
            'lng' => 104.898800,
            'status' => 'DA_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvNam,
            'resp' => 'Đã gửi công văn yêu cầu Viễn thông VNPT Yên Bái cử kỹ thuật xuống gia cố hàn chốt chống rung và chèn đệm cao su chịu lực, triệt tiêu hoàn toàn tiếng ồn.',
            'resp_at' => date('Y-m-d 14:00:00', strtotime('-20 days')),
            'photos' => json_encode(['/uploads/complaints/nap_cap_ve_nh.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/nap_cap_da_han.jpg']),
            'created' => date('Y-m-d 09:30:00', strtotime('-22 days'))
        ],
        [
            'code' => 'PAKN-261020-001',
            'cat' => 'RAC_THAI',
            'name' => 'Nguyễn Văn An',
            'phone' => '0988776655',
            'cccd' => '015092008899',
            'acc' => 'ca000002-0000-0000-0000-000000000000',
            'title' => 'Xe chở rác rò rỉ nước thải bốc mùi phố Đinh Tiên Hoàng',
            'desc' => 'Xe cuốn ép rác chạy buổi chiều bị hở roăng đáy thùng làm nước rỉ rác chảy thành vệt dài trên mặt đường.',
            'loc' => 'Đoạn đường Đinh Tiên Hoàng, TDP 1',
            'lat' => 21.717000,
            'lng' => 104.895500,
            'status' => 'DA_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => 'UBND Phường đã làm việc với Công ty Môi trường đô thị chấn chỉnh quy trình vận hành xe ép rác, thay thế gioăng cao su thùng chứa và cử xe bồn rửa sạch mặt đường ngay trong tối.',
            'resp_at' => date('Y-m-d 17:30:00', strtotime('-22 days')),
            'photos' => json_encode(['/uploads/complaints/nuoc_ri_rac.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/duong_da_rua_sach.jpg']),
            'created' => date('Y-m-d 15:00:00', strtotime('-24 days'))
        ],
        [
            'code' => 'PAKN-261018-001',
            'cat' => 'LAN_CHIEM',
            'name' => 'Lưu Phương Linh',
            'phone' => '0943001122',
            'cccd' => '015195000011',
            'acc' => 'ca000025-0000-0000-0000-000000000000',
            'title' => 'Bán hàng rong trước cổng trường THCS Yên Thịnh giờ tan học',
            'desc' => 'Nhiều xe đẩy bán đồ ăn vặt, trà sữa không rõ nguồn gốc tụ tập trước cổng trường học gây mất an toàn vệ sinh thực phẩm và ùn tắc giao thông giờ tan tầm.',
            'loc' => 'Cổng trường THCS Yên Thịnh, phố Minh Tân, TDP 3',
            'lat' => 21.716500,
            'lng' => 104.898000,
            'status' => 'DA_XU_LY',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => 'Đội Trật tự đô thị đã phối hợp cùng Công an phường cắm chốt phân luồng giao thông tại cổng trường từ 16h30 đến 17h30 hàng ngày, yêu cầu các xe đẩy hàng rong cam kết di dời.',
            'resp_at' => date('Y-m-d 17:45:00', strtotime('-24 days')),
            'photos' => json_encode(['/uploads/complaints/hang_rong_cong_truong.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/cong_truong_an_toan.jpg']),
            'created' => date('Y-m-d 16:30:00', strtotime('-26 days'))
        ],
        [
            'code' => 'PAKN-261015-001',
            'cat' => 'DIEN_NUOC',
            'name' => 'Tạ Văn Sơn',
            'phone' => '0931888777',
            'cccd' => '015070004433',
            'acc' => 'ca000015-0000-0000-0000-000000000000',
            'title' => 'Hỏng vòi nước tưới công viên hồ Hào Gia gây lãng phí nước',
            'desc' => 'Vòi nước công cộng của công viên bị gãy tay van, nước phun trào liên tục ra đường đi bộ ven hồ.',
            'loc' => 'Công viên ven hồ Hào Gia, TDP 7',
            'lat' => 21.720500,
            'lng' => 104.901000,
            'status' => 'DONG',
            'priority' => 'TRUNG_BINH',
            'assigned' => $uCvDung,
            'resp' => 'Tổ kỹ thuật đô thị phường đã khóa van tổng và thay cụm vòi nước mới kèm khóa bảo vệ, hoàn tất sửa chữa và công dân đã nghiệm thu đánh giá hài lòng.',
            'resp_at' => date('Y-m-d 11:00:00', strtotime('-27 days')),
            'photos' => json_encode(['/uploads/complaints/voi_nuoc_gay.jpg']),
            'rphotos' => json_encode(['/uploads/complaints/voi_nuoc_moi.jpg']),
            'created' => date('Y-m-d 08:30:00', strtotime('-28 days'))
        ]
    ];

    $cplIdx = 1;
    foreach ($complaintData as $cpl) {
        $cplId = sprintf('p0000001-%04d-0000-0000-%012d', $cplIdx, $cplIdx);
        $insertCpl->execute([
            ':id' => $cplId,
            ':code' => $cpl['code'],
            ':name' => $cpl['name'],
            ':phone' => $cpl['phone'],
            ':cccd' => $cpl['cccd'],
            ':acc_id' => $cpl['acc'],
            ':cat' => $cpl['cat'],
            ':title' => $cpl['title'],
            ':desc' => $cpl['desc'],
            ':loc' => $cpl['loc'],
            ':lat' => $cpl['lat'],
            ':lng' => $cpl['lng'],
            ':status' => $cpl['status'],
            ':priority' => $cpl['priority'],
            ':assigned' => $cpl['assigned'],
            ':resp' => $cpl['resp'],
            ':resp_at' => $cpl['resp_at'],
            ':photos' => $cpl['photos'],
            ':rphotos' => $cpl['rphotos'],
            ':created' => $cpl['created'],
            ':updated' => $cpl['resp_at'] ?? $cpl['created']
        ]);
        $cplIdx++;
    }

    // -------------------------------------------------------------
    // 9. NẠP 16 VÉ THỨ TỰ BỐC SỐ HÀNG ĐỢI HÔM NAY (QUEUE TICKETS)
    // -------------------------------------------------------------
    $queueSeed = [
        // Sáng sớm đã phục vụ xong (DA_PHUC_VU)
        ['ticket_number' => 'A001', 'counter_type' => 'HO_TICH', 'service_name' => 'Đăng ký Khai sinh thường trú', 'citizen_name' => 'Nguyễn Văn An', 'citizen_phone' => '0988776655', 'counter_no' => 1, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 07:45:00", 'called_at' => "$todayStr 08:00:00", 'completed_at' => "$todayStr 08:20:00"],
        ['ticket_number' => 'B001', 'counter_type' => 'CHUNG_THUC', 'service_name' => 'Chứng thực bản sao từ bản chính', 'citizen_name' => 'Trần Thị Bích', 'citizen_phone' => '0977665544', 'counter_no' => 2, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 08:05:00", 'called_at' => "$todayStr 08:15:00", 'completed_at' => "$todayStr 08:30:00"],
        ['ticket_number' => 'C001', 'counter_type' => 'DIA_CHINH', 'service_name' => 'Đăng ký biến động đất đai', 'citizen_name' => 'Lê Văn Cường', 'citizen_phone' => '0966554433', 'counter_no' => 3, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 08:15:00", 'called_at' => "$todayStr 08:30:00", 'completed_at' => "$todayStr 08:55:00"],
        ['ticket_number' => 'D001', 'counter_type' => 'LAO_DONG_TBXH', 'service_name' => 'Chính sách Người có công & BTXH', 'citizen_name' => 'Vũ Đình Giang', 'citizen_phone' => '0912888999', 'counter_no' => 4, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 08:20:00", 'called_at' => "$todayStr 08:40:00", 'completed_at' => "$todayStr 09:05:00"],
        ['ticket_number' => 'A002', 'counter_type' => 'HO_TICH', 'service_name' => 'Cấp bản sao trích lục hộ tịch', 'citizen_name' => 'Phạm Quỳnh Dung', 'citizen_phone' => '0944332211', 'counter_no' => 1, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 08:40:00", 'called_at' => "$todayStr 08:50:00", 'completed_at' => "$todayStr 09:10:00"],
        ['ticket_number' => 'B002', 'counter_type' => 'CHUNG_THUC', 'service_name' => 'Chứng thực chữ ký văn bản', 'citizen_name' => 'Đỗ Thị Hạnh', 'citizen_phone' => '0983777666', 'counter_no' => 2, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 08:55:00", 'called_at' => "$todayStr 09:10:00", 'completed_at' => "$todayStr 09:25:00"],
        ['ticket_number' => 'C002', 'counter_type' => 'DIA_CHINH', 'service_name' => 'Cấp phép xây dựng nhà ở riêng lẻ', 'citizen_name' => 'Nguyễn Tiến Khôi', 'citizen_phone' => '0976555444', 'counter_no' => 3, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 09:15:00", 'called_at' => "$todayStr 09:30:00", 'completed_at' => "$todayStr 10:00:00"],
        ['ticket_number' => 'D002', 'counter_type' => 'LAO_DONG_TBXH', 'service_name' => 'Trợ cấp xã hội hàng tháng', 'citizen_name' => 'Bùi Thị Liễu', 'citizen_phone' => '0903444333', 'counter_no' => 4, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 09:25:00", 'called_at' => "$todayStr 09:40:00", 'completed_at' => "$todayStr 10:15:00"],

        // Đang gọi tại 4 quầy (DANG_GOI)
        ['ticket_number' => 'A003', 'counter_type' => 'HO_TICH', 'service_name' => 'Đăng ký Khai sinh / Kết hôn', 'citizen_name' => 'Lương Thế Vinh', 'citizen_phone' => '0982112233', 'counter_no' => 1, 'status' => 'DANG_GOI', 'created_at' => "$todayStr 10:10:00", 'called_at' => "$todayStr 10:30:00", 'completed_at' => null],
        ['ticket_number' => 'B003', 'counter_type' => 'CHUNG_THUC', 'service_name' => 'Chứng thực bản sao từ bản chính', 'citizen_name' => 'Chu Thị Thanh Mai', 'citizen_phone' => '0974223344', 'counter_no' => 2, 'status' => 'DANG_GOI', 'created_at' => "$todayStr 10:15:00", 'called_at' => "$todayStr 10:35:00", 'completed_at' => null],
        ['ticket_number' => 'C003', 'counter_type' => 'DIA_CHINH', 'service_name' => 'Đăng ký biến động quyền sử dụng đất', 'citizen_name' => 'Hoàng Minh Đức', 'citizen_phone' => '0933221100', 'counter_no' => 3, 'status' => 'DANG_GOI', 'created_at' => "$todayStr 10:20:00", 'called_at' => "$todayStr 10:40:00", 'completed_at' => null],
        ['ticket_number' => 'D003', 'counter_type' => 'LAO_DONG_TBXH', 'service_name' => 'Xác nhận gia đình chính sách người có công', 'citizen_name' => 'Tạ Văn Sơn', 'citizen_phone' => '0931888777', 'counter_no' => 4, 'status' => 'DANG_GOI', 'created_at' => "$todayStr 10:25:00", 'called_at' => "$todayStr 10:45:00", 'completed_at' => null],

        // Đang chờ trong sảnh (CHO)
        ['ticket_number' => 'A004', 'counter_type' => 'HO_TICH', 'service_name' => 'Xác nhận tình trạng hôn nhân', 'citizen_name' => 'Mai Thu Thảo', 'citizen_phone' => '0945445566', 'counter_no' => 1, 'status' => 'CHO', 'created_at' => "$todayStr 10:40:00", 'called_at' => null, 'completed_at' => null],
        ['ticket_number' => 'B004', 'counter_type' => 'CHUNG_THUC', 'service_name' => 'Chứng thực chữ ký ủy quyền', 'citizen_name' => 'Nghiêm Đình Khang', 'citizen_phone' => '0963334455', 'counter_no' => 2, 'status' => 'CHO', 'created_at' => "$todayStr 10:45:00", 'called_at' => null, 'completed_at' => null],
        ['ticket_number' => 'C004', 'counter_type' => 'DIA_CHINH', 'service_name' => 'Cấp phép thi công đào đường vỉa hè', 'citizen_name' => 'Bạch Quốc Toản', 'citizen_phone' => '0961990011', 'counter_no' => 3, 'status' => 'CHO', 'created_at' => "$todayStr 10:50:00", 'called_at' => null, 'completed_at' => null],
        ['ticket_number' => 'D004', 'counter_type' => 'LAO_DONG_TBXH', 'service_name' => 'Trợ cấp đối tượng bảo trợ xã hội', 'citizen_name' => 'Triệu Thị Nga', 'citizen_phone' => '0979889900', 'counter_no' => 4, 'status' => 'CHO', 'created_at' => "$todayStr 10:55:00", 'called_at' => null, 'completed_at' => null],
    ];

    $insertQueue = $db->prepare('
        INSERT INTO queue_tickets (ticket_number, counter_type, service_name, citizen_name, citizen_phone, counter_no, status, created_at, called_at, completed_at)
        VALUES (:tnum, :ctype, :sname, :cname, :cphone, :cno, :status, :created, :called, :completed)
    ');
    foreach ($queueSeed as $q) {
        $insertQueue->execute([
            ':tnum' => $q['ticket_number'],
            ':ctype' => $q['counter_type'],
            ':sname' => $q['service_name'],
            ':cname' => $q['citizen_name'],
            ':cphone' => $q['citizen_phone'],
            ':cno' => $q['counter_no'],
            ':status' => $q['status'],
            ':created' => $q['created_at'],
            ':called' => $q['called_at'],
            ':completed' => $q['completed_at']
        ]);
    }

    $db->exec('SET FOREIGN_KEY_CHECKS = 1');

    // Thống kê kết quả sau khi nạp
    $userCount = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $citizenCount = (int)$db->query("SELECT COUNT(*) FROM citizens")->fetchColumn();
    $accountCount = (int)$db->query("SELECT COUNT(*) FROM citizen_accounts")->fetchColumn();
    $appCount = (int)$db->query("SELECT COUNT(*) FROM applications")->fetchColumn();
    $completedCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status IN ('HOAN_THANH', 'DA_KY_SO')")->fetchColumn();
    $pendingCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status NOT IN ('HOAN_THANH', 'DA_KY_SO', 'TU_CHOI')")->fetchColumn();
    $overdueCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status NOT IN ('HOAN_THANH', 'TU_CHOI') AND NOW() > appointment_date")->fetchColumn();
    $warningCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status NOT IN ('HOAN_THANH', 'TU_CHOI') AND appointment_date >= NOW() AND TIMESTAMPDIFF(HOUR, NOW(), appointment_date) <= 24")->fetchColumn();
    $complaintCount = (int)$db->query("SELECT COUNT(*) FROM complaints")->fetchColumn();
    $resolvedComplaintCount = (int)$db->query("SELECT COUNT(*) FROM complaints WHERE status IN ('DA_XU_LY', 'DONG')")->fetchColumn();
    $pendingComplaintCount = (int)$db->query("SELECT COUNT(*) FROM complaints WHERE status IN ('MOI', 'DANG_XU_LY')")->fetchColumn();
    $queueCount = (int)$db->query("SELECT COUNT(*) FROM queue_tickets")->fetchColumn();

    return [
        'success' => true,
        'current_date' => date('Y-m-d H:i:s'),
        'users_count' => $userCount,
        'citizens_count' => $citizenCount,
        'citizen_accounts_count' => $accountCount,
        'total_applications' => $appCount,
        'completed_applications' => $completedCount,
        'pending_applications' => $pendingCount,
        'overdue_count' => $overdueCount,
        'warning_count' => $warningCount,
        'total_complaints' => $complaintCount,
        'resolved_complaints' => $resolvedComplaintCount,
        'pending_complaints' => $pendingComplaintCount,
        'queue_tickets' => $queueCount,
        'message' => 'Nạp mới và chuẩn hóa dữ liệu demo chân thực thành công!'
    ];
}

// Nếu gọi trực tiếp từ CLI
if (php_sapi_name() === 'cli') {
    try {
        echo "=== BẮT ĐẦU NẠP DỮ LIỆU DEMO QUY MÔ LỚN ===\n";
        $res = refresh_demo_data();
        echo sprintf("Thời gian hệ thống: %s\n", $res['current_date']);
        echo sprintf("Tài khoản cán bộ: %d | Công dân: %d | Tài khoản công dân: %d\n", $res['users_count'], $res['citizens_count'], $res['citizen_accounts_count']);
        echo sprintf("Tổng hồ sơ: %d (Đã giải quyết: %d | Đang xử lý: %d | Sắp đến hạn <24h: %d | Quá hạn: %d)\n", $res['total_applications'], $res['completed_applications'], $res['pending_applications'], $res['warning_count'], $res['overdue_count']);
        echo sprintf("Tổng phản ánh: %d (Đã xử lý: %d | Chưa xử lý: %d)\n", $res['total_complaints'], $res['resolved_complaints'], $res['pending_complaints']);
        echo sprintf("Vé bốc số hôm nay: %d\n", $res['queue_tickets']);
        echo "=== HOÀN TẤT THÀNH CÔNG ===\n";
    } catch (Throwable $e) {
        echo "LỖI: " . $e->getMessage() . "\n" . $e->getTraceAsString();
        exit(1);
    }
}
