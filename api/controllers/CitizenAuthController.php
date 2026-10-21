<?php

class CitizenAuthController {
    /**
     * Đăng ký tài khoản công dân mới
     */
    public function register(Request $request): void {
        $body = $request->getBody();

        $fullName = trim($body['full_name'] ?? '');
        $cccd = trim($body['cccd_number'] ?? '');
        $phone = trim($body['phone_number'] ?? '');
        $password = (string)($body['password'] ?? '');
        $email = trim($body['email'] ?? '');
        $dob = !empty($body['date_of_birth']) ? $body['date_of_birth'] : null;
        $gender = in_array($body['gender'] ?? '', ['NAM', 'NU', 'KHAC']) ? $body['gender'] : 'NAM';
        $address = trim($body['address'] ?? '');

        // 1. Kiểm tra đầu vào bắt buộc
        if (empty($fullName) || empty($cccd) || empty($phone) || empty($password)) {
            Response::error('Vui lòng cung cấp đầy đủ: Họ và tên, Số CCCD, Số điện thoại và Mật khẩu', 400);
        }

        if (!CitizenValidator::isValidCccd($cccd)) {
            Response::error('Số CCCD không hợp lệ. Số CCCD phải gồm đúng 12 chữ số theo quy chuẩn quốc gia', 400);
        }

        if (!CitizenValidator::isValidPhone($phone)) {
            Response::error('Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số bắt đầu bằng số 0', 400);
        }

        if (!CitizenValidator::isValidPassword($password)) {
            Response::error('Mật khẩu chưa đủ an toàn. Mật khẩu phải có tối thiểu 8 ký tự, bao gồm cả chữ và số', 400);
        }

        $db = Database::getConnection();

        // 2. Kiểm tra xem CCCD hoặc SĐT đã đăng ký tài khoản chưa
        $checkStmt = $db->prepare('SELECT id, cccd_number, phone_number FROM citizen_accounts WHERE cccd_number = ? OR phone_number = ?');
        $checkStmt->execute([$cccd, $phone]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            if ($existing['cccd_number'] === $cccd) {
                Response::error('Số CCCD này đã được đăng ký tài khoản trên hệ thống. Quý công dân vui lòng Đăng nhập hoặc sử dụng chức năng Quên mật khẩu', 409);
            }
            if ($existing['phone_number'] === $phone) {
                Response::error('Số điện thoại này đã được sử dụng bởi một tài khoản khác. Vui lòng kiểm tra lại', 409);
            }
        }

        // 3. Quy tắc đối chiếu phòng ngừa mạo danh (Cross-validation):
        // Nếu số CCCD này đã có trong CSDL dân cư hoặc lịch sử nộp hồ sơ, SĐT đăng ký phải khớp
        $citizenCheck = $db->prepare('SELECT id, full_name, phone_number, permanent_address FROM citizens WHERE cccd_number = ?');
        $citizenCheck->execute([$cccd]);
        $citizenRecord = $citizenCheck->fetch();

        $linkedCitizenId = null;
        if ($citizenRecord) {
            $linkedCitizenId = $citizenRecord['id'];
            if (!empty($citizenRecord['phone_number']) && $citizenRecord['phone_number'] !== $phone) {
                Response::error(sprintf(
                    'Số CCCD này đã tồn tại trong cơ sở dữ liệu dân cư nhưng số điện thoại đăng ký không khớp với số đã lưu (%s). Để bảo đảm quyền riêng tư, vui lòng liên hệ Bộ phận Một cửa UBND Phường để xác minh.',
                    CitizenValidator::maskPhone($citizenRecord['phone_number'])
                ), 409);
            }
            if (empty($address) && !empty($citizenRecord['permanent_address'])) {
                $address = $citizenRecord['permanent_address'];
            }
        } else {
            // Kiểm tra trong lịch sử hồ sơ applications
            $appCheck = $db->prepare('SELECT DISTINCT citizen_phone FROM applications WHERE citizen_id_number = ? AND citizen_phone IS NOT NULL AND citizen_phone != ""');
            $appCheck->execute([$cccd]);
            $existingPhones = $appCheck->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($existingPhones) && !in_array($phone, $existingPhones, true)) {
                $maskedList = array_map([CitizenValidator::class, 'maskPhone'], $existingPhones);
                Response::error(sprintf(
                    'Số CCCD này đã từng nộp hồ sơ với số điện thoại khác (%s). Để tránh mạo danh, vui lòng sử dụng đúng số điện thoại đã từng đăng ký hoặc đến Bộ phận Một cửa xác thực.',
                    implode(', ', $maskedList)
                ), 409);
            }
        }

        // 4. Tạo tài khoản mới
        $newId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $db->beginTransaction();
        try {
            $insert = $db->prepare('
                INSERT INTO citizen_accounts (
                    id, cccd_number, phone_number, password_hash, full_name, email,
                    date_of_birth, gender, address, citizen_id, phone_verified_at, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1)
            ');
            $insert->execute([
                $newId, $cccd, $phone, $passwordHash, $fullName,
                !empty($email) ? $email : null,
                $dob, $gender, !empty($address) ? $address : null,
                $linkedCitizenId
            ]);

            // 5. Tự động liên kết các hồ sơ và phản ánh cũ có cùng số CCCD
            $linkApps = $db->prepare('
                UPDATE applications 
                SET citizen_account_id = ? 
                WHERE citizen_id_number = ? AND (citizen_account_id IS NULL OR citizen_account_id = "")
            ');
            $linkApps->execute([$newId, $cccd]);

            $linkComplaints = $db->prepare('
                UPDATE complaints 
                SET citizen_account_id = ? 
                WHERE citizen_cccd = ? AND (citizen_account_id IS NULL OR citizen_account_id = "")
            ');
            $linkComplaints->execute([$newId, $cccd]);

            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi khi khởi tạo tài khoản công dân: ' . $e->getMessage(), 500);
        }

        // Lấy thông tin tài khoản hoàn chỉnh để trả về
        $account = [
            'id' => $newId,
            'cccd_number' => $cccd,
            'phone_number' => $phone,
            'full_name' => $fullName,
            'email' => $email,
            'address' => $address,
            'phone_verified_at' => null,
            'is_active' => 1
        ];

        $token = CitizenAuth::createToken($account);
        AuditLogger::log('REGISTER_CITIZEN_ACCOUNT', 'CITIZEN_ACCOUNT', $newId, null, [
            'cccd' => CitizenValidator::maskCccd($cccd),
            'phone' => CitizenValidator::maskPhone($phone),
            'full_name' => $fullName
        ], null, $request);

        Response::json([
            'token' => $token,
            'citizen' => $account
        ], 201, 'Đăng ký tài khoản công dân thành công! Tài khoản đã được kích hoạt.');
    }

    /**
     * Đăng nhập tài khoản công dân (bằng CCCD hoặc SĐT)
     */
    public function login(Request $request): void {
        $identifier = trim($request->get('identifier', ''));
        $password = (string)$request->get('password', '');

        if (empty($identifier) || empty($password)) {
            Response::error('Vui lòng nhập Số CCCD hoặc Số điện thoại cùng Mật khẩu', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT ca.*, c.household_number, c.residence_type
            FROM citizen_accounts ca
            LEFT JOIN citizens c ON ca.citizen_id = c.id
            WHERE ca.cccd_number = ? OR ca.phone_number = ?
        ');
        $stmt->execute([$identifier, $identifier]);
        $account = $stmt->fetch();

        if (!$account) {
            Response::error('Số CCCD / Số điện thoại hoặc mật khẩu không chính xác', 401);
        }

        if (!$account['is_active']) {
            Response::error('Tài khoản công dân đã bị tạm khóa. Vui lòng liên hệ Bộ phận Một cửa UBND Phường Yên Bái để được mở khóa.', 403);
        }

        // Kiểm tra khóa tạm thời do nhập sai quá 5 lần
        if (!empty($account['locked_until']) && strtotime($account['locked_until']) > time()) {
            $remainMinutes = ceil((strtotime($account['locked_until']) - time()) / 60);
            Response::error(sprintf('Tài khoản bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau %d phút', $remainMinutes), 403);
        }

        if (!password_verify($password, $account['password_hash'])) {
            $failedCount = (int)$account['failed_login_count'] + 1;
            $lockedUntil = null;
            if ($failedCount >= 5) {
                $lockedUntil = date('Y-m-d H:i:s', time() + 15 * 60); // Khóa 15 phút
            }
            $update = $db->prepare('UPDATE citizen_accounts SET failed_login_count = ?, locked_until = ? WHERE id = ?');
            $update->execute([$failedCount, $lockedUntil, $account['id']]);

            AuditLogger::log('CITIZEN_LOGIN_FAILED', 'CITIZEN_ACCOUNT', $account['id'], null, [
                'reason' => 'Sai mật khẩu',
                'attempt' => $failedCount
            ], null, $request);

            if ($failedCount >= 5) {
                Response::error('Quý công dân đã nhập sai mật khẩu 5 lần liên tiếp. Tài khoản bị tạm khóa 15 phút để bảo vệ an toàn.', 403);
            }
            Response::error(sprintf('Mật khẩu không chính xác (Còn %d lần thử).', 5 - $failedCount), 401);
        }

        // Đăng nhập thành công: reset số lần sai và ghi nhận thời gian
        $update = $db->prepare('UPDATE citizen_accounts SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?');
        $update->execute([$account['id']]);

        $token = CitizenAuth::createToken($account);
        unset($account['password_hash']);

        AuditLogger::log('CITIZEN_LOGIN_SUCCESS', 'CITIZEN_ACCOUNT', $account['id'], null, [
            'cccd' => CitizenValidator::maskCccd($account['cccd_number']),
            'full_name' => $account['full_name']
        ], null, $request);

        Response::json([
            'token' => $token,
            'citizen' => $account
        ], 200, 'Đăng nhập Cổng Dịch vụ công thành công! Chào mừng ' . $account['full_name']);
    }

    /**
     * Lấy thông tin cá nhân của công dân đang đăng nhập
     */
    public function me(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        Response::json($citizen, 200, 'Lấy thông tin tài khoản công dân thành công');
    }

    /**
     * Đăng xuất
     */
    public function logout(Request $request): void {
        $citizen = CitizenAuth::requireCitizen($request);
        AuditLogger::log('CITIZEN_LOGOUT', 'CITIZEN_ACCOUNT', $citizen['id'], null, null, null, $request);
        Response::json(null, 200, 'Đăng xuất thành công');
    }

    /**
     * Yêu cầu mã OTP khôi phục mật khẩu
     */
    public function forgotPassword(Request $request): void {
        $identifier = trim($request->get('identifier', ''));
        if (empty($identifier)) {
            Response::error('Vui lòng nhập Số CCCD hoặc Số điện thoại đã đăng ký', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, phone_number, full_name FROM citizen_accounts WHERE cccd_number = ? OR phone_number = ?');
        $stmt->execute([$identifier, $identifier]);
        $account = $stmt->fetch();

        if (!$account) {
            // Thông báo chung an toàn để không lộ danh tính tài khoản
            Response::json([
                'phone_masked' => null,
                'sent' => false
            ], 200, 'Nếu thông tin trùng khớp với tài khoản trong hệ thống, mã xác thực OTP sẽ được gửi đến số điện thoại đăng ký.');
            return;
        }

        $res = OtpService::issue($account['phone_number'], 'RESET_PASSWORD');
        if (!$res['success']) {
            Response::error($res['message'], 429);
        }

        Response::json([
            'phone_masked' => CitizenValidator::maskPhone($account['phone_number']),
            'phone_number' => $account['phone_number'],
            'sent' => true,
            'demo_code' => $res['demo_code'] ?? null
        ], 200, $res['message']);
    }

    /**
     * Đặt lại mật khẩu bằng mã OTP
     */
    public function resetPassword(Request $request): void {
        $phone = trim($request->get('phone_number', ''));
        $otp = trim($request->get('otp_code', ''));
        $newPassword = (string)$request->get('new_password', '');

        if (empty($phone) || empty($otp) || empty($newPassword)) {
            Response::error('Vui lòng cung cấp đầy đủ: Số điện thoại, Mã OTP và Mật khẩu mới', 400);
        }

        if (!CitizenValidator::isValidPassword($newPassword)) {
            Response::error('Mật khẩu mới phải có tối thiểu 8 ký tự, bao gồm cả chữ và số', 400);
        }

        $verify = OtpService::verify($phone, 'RESET_PASSWORD', $otp);
        if (!$verify['valid']) {
            Response::error($verify['message'], 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, full_name, cccd_number FROM citizen_accounts WHERE phone_number = ?');
        $stmt->execute([$phone]);
        $account = $stmt->fetch();

        if (!$account) {
            Response::error('Không tìm thấy tài khoản tương ứng với số điện thoại này', 404);
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
        $update = $db->prepare('
            UPDATE citizen_accounts 
            SET password_hash = ?, phone_verified_at = NOW(), failed_login_count = 0, locked_until = NULL 
            WHERE id = ?
        ');
        $update->execute([$newHash, $account['id']]);

        AuditLogger::log('CITIZEN_RESET_PASSWORD_SUCCESS', 'CITIZEN_ACCOUNT', $account['id'], null, [
            'cccd' => CitizenValidator::maskCccd($account['cccd_number'])
        ], null, $request);

        Response::json(null, 200, 'Đặt lại mật khẩu thành công! Quý công dân có thể đăng nhập ngay bằng mật khẩu mới.');
    }
}
