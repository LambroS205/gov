<?php

class CitizenPortalController {
    /**
     * Bảng tổng quan cá nhân của công dân
     */
    public function summary(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $db = Database::getConnection();

        $accountId = $citizen['id'];
        $cccd = $citizen['cccd_number'];
        $phone = $citizen['phone_number'];
        $isPhoneVerified = !empty($citizen['phone_verified_at']);

        // 1. Thống kê hồ sơ
        $appStatsStmt = $db->prepare('
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = "CHO_TIEP_NHAN" THEN 1 ELSE 0 END) as cho_tiep_nhan,
                SUM(CASE WHEN status = "DANG_XU_LY" THEN 1 ELSE 0 END) as dang_xu_ly,
                SUM(CASE WHEN status = "CHO_KY_DUYET" THEN 1 ELSE 0 END) as cho_ky_duyet,
                SUM(CASE WHEN status = "DA_KY_SO" THEN 1 ELSE 0 END) as da_ky_so,
                SUM(CASE WHEN status = "HOAN_THANH" THEN 1 ELSE 0 END) as hoan_thanh,
                SUM(CASE WHEN status = "TRA_LAI" THEN 1 ELSE 0 END) as tra_lai,
                SUM(CASE WHEN status = "TU_CHOI" THEN 1 ELSE 0 END) as tu_choi,
                SUM(CASE WHEN payment_status = "CHUA_THANH_TOAN" THEN 1 ELSE 0 END) as chua_thanh_toan
            FROM applications
            WHERE citizen_account_id = ? OR citizen_id_number = ?
        ');
        $appStatsStmt->execute([$accountId, $cccd]);
        $appStats = $appStatsStmt->fetch() ?: [];

        // 2. Thống kê phản ánh
        $cplWhere = '(citizen_account_id = ? OR citizen_cccd = ?)';
        $cplParams = [$accountId, $cccd];
        if ($isPhoneVerified && !empty($phone)) {
            $cplWhere .= ' OR citizen_phone = ?';
            $cplParams[] = $phone;
        }

        $cplStatsStmt = $db->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'MOI' THEN 1 ELSE 0 END) as moi,
                SUM(CASE WHEN status = 'DANG_XU_LY' THEN 1 ELSE 0 END) as dang_xu_ly,
                SUM(CASE WHEN status = 'DA_XU_LY' THEN 1 ELSE 0 END) as da_xu_ly,
                SUM(CASE WHEN status = 'DONG' THEN 1 ELSE 0 END) as dong
            FROM complaints
            WHERE $cplWhere
        ");
        $cplStatsStmt->execute($cplParams);
        $cplStats = $cplStatsStmt->fetch() ?: [];

        // 3. 5 hồ sơ gần nhất
        $recentStmt = $db->prepare('
            SELECT 
                a.id, a.dossier_code, a.status, a.submit_date, a.appointment_date, 
                a.completed_date, a.payment_status, a.payment_method, a.receipt_number,
                p.proc_name, p.field_type, p.fee_amount
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            WHERE a.citizen_account_id = ? OR a.citizen_id_number = ?
            ORDER BY a.submit_date DESC
            LIMIT 5
        ');
        $recentStmt->execute([$accountId, $cccd]);
        $recentApps = ApplicationPresenter::enrichList($db, $recentStmt->fetchAll());

        // 4. Số thông báo chưa đọc / gần đây
        $notifStmt = $db->prepare('
            SELECT COUNT(*) 
            FROM notifications n
            WHERE recipient_phone = ? 
               OR (related_type = "APPLICATION" AND related_id IN (SELECT id FROM applications WHERE citizen_account_id = ? OR citizen_id_number = ?))
               OR (related_type = "COMPLAINT" AND related_id IN (SELECT id FROM complaints WHERE ' . $cplWhere . '))
        ');
        $notifParams = array_merge([$phone, $accountId, $cccd], $cplParams);
        $notifStmt->execute($notifParams);
        $notifCount = (int)$notifStmt->fetchColumn();

        Response::json([
            'citizen' => $citizen,
            'application_stats' => $appStats,
            'complaint_stats' => $cplStats,
            'recent_applications' => $recentApps,
            'notification_count' => $notifCount,
            'phone_verified' => $isPhoneVerified
        ], 200, 'Lấy thông tin tổng quan thành công');
    }

    /**
     * Danh sách hồ sơ Một cửa của công dân
     */
    public function applications(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $db = Database::getConnection();

        $accountId = $citizen['id'];
        $cccd = $citizen['cccd_number'];

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(50, (int)$request->getQuery('pageSize', 10)));
        $offset = ($page - 1) * $pageSize;

        $status = $request->getQuery('status');
        $search = trim($request->getQuery('search', ''));

        $where = ['(a.citizen_account_id = ? OR a.citizen_id_number = ?)'];
        $params = [$accountId, $cccd];

        if (!empty($status)) {
            $where[] = 'a.status = ?';
            $params[] = $status;
        }

        if (!empty($search)) {
            $where[] = '(a.dossier_code LIKE ? OR p.proc_name LIKE ?)';
            $p = "%$search%";
            $params[] = $p;
            $params[] = $p;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $db->prepare("
            SELECT COUNT(*) 
            FROM applications a 
            JOIN administrative_procedures p ON a.procedure_id = p.id 
            WHERE $whereSql
        ");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT 
                a.id, a.dossier_code, a.citizen_name, a.citizen_id_number, a.citizen_phone,
                a.status, a.submit_channel, a.submit_date, a.appointment_date, a.completed_date,
                a.payment_status, a.payment_method, a.receipt_number, a.paid_at,
                a.satisfaction_score, a.satisfaction_comment, a.satisfaction_date,
                a.rejection_reason, a.notes,
                p.proc_name, p.field_type, p.fee_amount
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            WHERE $whereSql
            ORDER BY a.submit_date DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $db->prepare($sql);
        $i = 1;
        foreach ($params as $param) {
            $stmt->bindValue($i++, $param);
        }
        $stmt->bindValue($i++, $pageSize, PDO::PARAM_INT);
        $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        $items = ApplicationPresenter::enrichList($db, $items);
        Response::paginated($items, $total, $page, $pageSize, 'Lấy danh sách hồ sơ thành công');
    }

    /**
     * Chi tiết một hồ sơ của công dân
     */
    public function applicationDetail(Request $request, array $params): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $accountId = $citizen['id'];
        $cccd = $citizen['cccd_number'];

        $stmt = $db->prepare('
            SELECT 
                a.*,
                p.proc_name, p.proc_code, p.field_type, p.fee_amount, p.processing_days
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            WHERE a.id = ? AND (a.citizen_account_id = ? OR a.citizen_id_number = ?)
        ');
        $stmt->execute([$id, $accountId, $cccd]);
        $app = $stmt->fetch();

        if (!$app) {
            Response::error('Hồ sơ không tồn tại hoặc không thuộc quyền sở hữu của Quý công dân', 404);
        }

        $app = ApplicationPresenter::enrich($db, $app);
        Response::json($app, 200, 'Lấy chi tiết hồ sơ thành công');
    }

    /**
     * Danh sách phản ánh - kiến nghị của công dân
     */
    public function complaints(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $db = Database::getConnection();

        $accountId = $citizen['id'];
        $cccd = $citizen['cccd_number'];
        $phone = $citizen['phone_number'];
        $isPhoneVerified = !empty($citizen['phone_verified_at']);

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(50, (int)$request->getQuery('pageSize', 10)));
        $offset = ($page - 1) * $pageSize;

        $status = $request->getQuery('status');
        $category = $request->getQuery('category');
        $search = trim($request->getQuery('search', ''));

        $where = ['(c.citizen_account_id = ? OR c.citizen_cccd = ?' . ($isPhoneVerified ? ' OR c.citizen_phone = ?' : '') . ')'];
        $params = [$accountId, $cccd];
        if ($isPhoneVerified) {
            $params[] = $phone;
        }

        if (!empty($status)) {
            $where[] = 'c.status = ?';
            $params[] = $status;
        }

        if (!empty($category)) {
            $where[] = 'c.category = ?';
            $params[] = $category;
        }

        if (!empty($search)) {
            $where[] = '(c.complaint_code LIKE ? OR c.title LIKE ? OR c.location LIKE ?)';
            $p = "%$search%";
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM complaints c WHERE $whereSql");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT 
                c.*, 
                u.full_name as assigned_name, u.phone_number as assigned_phone
            FROM complaints c
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE $whereSql
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $db->prepare($sql);
        $i = 1;
        foreach ($params as $param) {
            $stmt->bindValue($i++, $param);
        }
        $stmt->bindValue($i++, $pageSize, PDO::PARAM_INT);
        $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['photo_paths'] = json_decode($item['photo_paths'] ?? '[]', true) ?: [];
            $item['resolved_photo_paths'] = json_decode($item['resolved_photo_paths'] ?? '[]', true) ?: [];
        }

        Response::paginated($items, $total, $page, $pageSize, 'Lấy danh sách phản ánh thành công');
    }

    /**
     * Chi tiết một phản ánh của công dân
     */
    public function complaintDetail(Request $request, array $params): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $accountId = $citizen['id'];
        $cccd = $citizen['cccd_number'];
        $phone = $citizen['phone_number'];
        $isPhoneVerified = !empty($citizen['phone_verified_at']);

        $stmt = $db->prepare('
            SELECT c.*, u.full_name as assigned_name, u.phone_number as assigned_phone
            FROM complaints c
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE c.id = ? AND (c.citizen_account_id = ? OR c.citizen_cccd = ?' . ($isPhoneVerified ? ' OR c.citizen_phone = ?' : '') . ')
        ');
        $paramsList = [$id, $accountId, $cccd];
        if ($isPhoneVerified) {
            $paramsList[] = $phone;
        }
        $stmt->execute($paramsList);
        $item = $stmt->fetch();

        if (!$item) {
            Response::error('Phản ánh không tồn tại hoặc không thuộc quyền sở hữu của Quý công dân', 404);
        }

        $item['photo_paths'] = json_decode($item['photo_paths'] ?? '[]', true) ?: [];
        $item['resolved_photo_paths'] = json_decode($item['resolved_photo_paths'] ?? '[]', true) ?: [];

        Response::json($item, 200, 'Lấy chi tiết phản ánh thành công');
    }

    /**
     * Hộp thư thông báo của công dân
     */
    public function notifications(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $db = Database::getConnection();

        $accountId = $citizen['id'];
        $cccd = $citizen['cccd_number'];
        $phone = $citizen['phone_number'];
        $isPhoneVerified = !empty($citizen['phone_verified_at']);

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(50, (int)$request->getQuery('pageSize', 15)));
        $offset = ($page - 1) * $pageSize;

        $cplWhere = '(citizen_account_id = ? OR citizen_cccd = ?' . ($isPhoneVerified ? ' OR citizen_phone = ?' : '') . ')';
        $cplParams = [$accountId, $cccd];
        if ($isPhoneVerified) {
            $cplParams[] = $phone;
        }

        $whereClause = '
            (n.recipient_phone = ? 
             OR (n.related_type = "APPLICATION" AND n.related_id IN (SELECT id FROM applications WHERE citizen_account_id = ? OR citizen_id_number = ?))
             OR (n.related_type = "COMPLAINT" AND n.related_id IN (SELECT id FROM complaints WHERE ' . $cplWhere . ')))
        ';
        $params = array_merge([$phone, $accountId, $cccd], $cplParams);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM notifications n WHERE $whereClause");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT n.* 
            FROM notifications n 
            WHERE $whereClause
            ORDER BY n.created_at DESC 
            LIMIT ? OFFSET ?
        ";
        $stmt = $db->prepare($sql);
        $i = 1;
        foreach ($params as $param) {
            $stmt->bindValue($i++, $param);
        }
        $stmt->bindValue($i++, $pageSize, PDO::PARAM_INT);
        $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        Response::paginated($items, $total, $page, $pageSize, 'Lấy danh sách thông báo thành công');
    }

    /**
     * Cập nhật thông tin cá nhân (Họ tên, email, ngày sinh, giới tính, địa chỉ, SĐT)
     */
    public function updateProfile(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $db = Database::getConnection();
        $body = $request->getBody();

        $fullName = trim($body['full_name'] ?? $citizen['full_name']);
        $email = trim($body['email'] ?? ($citizen['email'] ?? ''));
        $dob = !empty($body['date_of_birth']) ? $body['date_of_birth'] : ($citizen['date_of_birth'] ?? null);
        $gender = in_array($body['gender'] ?? '', ['NAM', 'NU', 'KHAC']) ? $body['gender'] : ($citizen['gender'] ?? 'NAM');
        $address = trim($body['address'] ?? ($citizen['address'] ?? ''));
        $newPhone = trim($body['phone_number'] ?? $citizen['phone_number']);

        if (empty($fullName)) {
            Response::error('Họ và tên không được để trống', 400);
        }

        $phoneChanged = false;
        if (!empty($newPhone) && $newPhone !== $citizen['phone_number']) {
            if (!CitizenValidator::isValidPhone($newPhone)) {
                Response::error('Số điện thoại mới không hợp lệ. Phải gồm 10 chữ số bắt đầu bằng số 0', 400);
            }
            // Kiểm tra trùng SĐT với tài khoản khác
            $checkPhone = $db->prepare('SELECT id FROM citizen_accounts WHERE phone_number = ? AND id != ?');
            $checkPhone->execute([$newPhone, $citizen['id']]);
            if ($checkPhone->fetch()) {
                Response::error('Số điện thoại này đã được sử dụng bởi một tài khoản khác', 409);
            }
            $phoneChanged = true;
        }

        $phoneVerifiedVal = $phoneChanged ? null : $citizen['phone_verified_at'];

        $stmt = $db->prepare('
            UPDATE citizen_accounts 
            SET full_name = ?, email = ?, date_of_birth = ?, gender = ?, address = ?, 
                phone_number = ?, phone_verified_at = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $fullName,
            !empty($email) ? $email : null,
            $dob,
            $gender,
            !empty($address) ? $address : null,
            $newPhone,
            $phoneVerifiedVal,
            $citizen['id']
        ]);

        AuditLogger::log('CITIZEN_UPDATE_PROFILE', 'CITIZEN_ACCOUNT', $citizen['id'], [
            'full_name' => $citizen['full_name'],
            'phone' => $citizen['phone_number']
        ], [
            'full_name' => $fullName,
            'phone' => $newPhone
        ], null, $request);

        // Lấy lại thông tin mới
        $freshStmt = $db->prepare('SELECT * FROM citizen_accounts WHERE id = ?');
        $freshStmt->execute([$citizen['id']]);
        $fresh = $freshStmt->fetch();
        unset($fresh['password_hash']);

        $msg = 'Cập nhật thông tin cá nhân thành công.';
        if ($phoneChanged) {
            $msg .= ' Do Quý công dân đã đổi số điện thoại mới, vui lòng thực hiện xác minh lại số điện thoại.';
        }

        Response::json($fresh, 200, $msg);
    }

    /**
     * Đổi mật khẩu tài khoản công dân
     */
    public function changePassword(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $oldPass = (string)$request->get('old_password', '');
        $newPass = (string)$request->get('new_password', '');

        if (empty($oldPass) || empty($newPass)) {
            Response::error('Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới', 400);
        }

        if (!CitizenValidator::isValidPassword($newPass)) {
            Response::error('Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ và số', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT password_hash FROM citizen_accounts WHERE id = ?');
        $stmt->execute([$citizen['id']]);
        $hash = $stmt->fetchColumn();

        if (!password_verify($oldPass, $hash)) {
            Response::error('Mật khẩu hiện tại không chính xác', 400);
        }

        $newHash = password_hash($newPass, PASSWORD_BCRYPT);
        $update = $db->prepare('UPDATE citizen_accounts SET password_hash = ? WHERE id = ?');
        $update->execute([$newHash, $citizen['id']]);

        AuditLogger::log('CITIZEN_CHANGE_PASSWORD', 'CITIZEN_ACCOUNT', $citizen['id'], null, null, null, $request);

        Response::json(null, 200, 'Đổi mật khẩu tài khoản thành công!');
    }

    /**
     * Gửi mã OTP xác minh số điện thoại
     */
    public function sendPhoneOtp(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $res = OtpService::issue($citizen['phone_number'], 'VERIFY_PHONE');

        if (!$res['success']) {
            Response::error($res['message'], 429);
        }

        Response::json([
            'phone_masked' => CitizenValidator::maskPhone($citizen['phone_number']),
            'expires_in' => $res['expires_in'],
            'demo_code' => $res['demo_code'] ?? null
        ], 200, $res['message']);
    }

    /**
     * Xác thực mã OTP và kích hoạt phone_verified_at
     */
    public function verifyPhone(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        $otp = trim($request->get('otp_code', ''));

        if (empty($otp)) {
            Response::error('Vui lòng nhập mã OTP', 400);
        }

        $verify = OtpService::verify($citizen['phone_number'], 'VERIFY_PHONE', $otp);
        if (!$verify['valid']) {
            Response::error($verify['message'], 400);
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            // Cập nhật trạng thái xác thực
            $update = $db->prepare('UPDATE citizen_accounts SET phone_verified_at = NOW() WHERE id = ?');
            $update->execute([$citizen['id']]);

            // Liên kết các phản ánh có cùng SĐT
            $linkComplaints = $db->prepare('
                UPDATE complaints 
                SET citizen_account_id = ? 
                WHERE citizen_phone = ? AND (citizen_account_id IS NULL OR citizen_account_id = "")
            ');
            $linkComplaints->execute([$citizen['id'], $citizen['phone_number']]);

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi cập nhật trạng thái xác minh: ' . $e->getMessage(), 500);
        }

        AuditLogger::log('CITIZEN_VERIFY_PHONE_SUCCESS', 'CITIZEN_ACCOUNT', $citizen['id'], null, [
            'phone' => CitizenValidator::maskPhone($citizen['phone_number'])
        ], null, $request);

        Response::json(null, 200, 'Xác minh số điện thoại thành công! Các phản ánh trước đây gửi bằng số điện thoại này đã được liên kết vào tài khoản.');
    }
}
