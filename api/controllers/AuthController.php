<?php

class AuthController {
    public function login(Request $request): void {
        $username = trim($request->get('username', ''));
        $password = (string)$request->get('password', '');

        if (empty($username) || empty($password)) {
            Response::error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT u.*, d.dept_name, d.dept_code 
            FROM users u 
            LEFT JOIN departments d ON u.department_id = d.id 
            WHERE u.username = ?
        ');
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Tên đăng nhập hoặc mật khẩu không chính xác', 401);
        }

        if (!$user['is_active']) {
            Response::error('Tài khoản đã bị tạm khóa. Vui lòng liên hệ Quản trị viên', 403);
        }

        // Kiểm tra khóa tạm thời do sai mật khẩu quá 5 lần (Nghị định 85/2016)
        if (!empty($user['locked_until']) && strtotime($user['locked_until']) > time()) {
            $remainMinutes = ceil((strtotime($user['locked_until']) - time()) / 60);
            Response::error(sprintf('Tài khoản bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau %d phút', $remainMinutes), 403);
        }

        if (!password_verify($password, $user['password_hash'])) {
            $failedCount = (int)$user['failed_login_count'] + 1;
            $lockedUntil = null;
            if ($failedCount >= 5) {
                $lockedUntil = date('Y-m-d H:i:s', time() + 15 * 60); // Khóa 15 phút
            }
            $update = $db->prepare('UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?');
            $update->execute([$failedCount, $lockedUntil, $user['id']]);

            AuditLogger::log('LOGIN_FAILED', 'USER', $user['id'], null, ['reason' => 'Sai mật khẩu', 'attempt' => $failedCount], null, $request);

            if ($failedCount >= 5) {
                Response::error('Bạn đã nhập sai mật khẩu 5 lần liên tiếp. Tài khoản bị tạm khóa 15 phút để bảo mật', 403);
            }
            Response::error(sprintf('Tên đăng nhập hoặc mật khẩu không chính xác (Còn %d lần thử)', 5 - $failedCount), 401);
        }

        // Reset số lần đăng nhập sai và cập nhật lần đăng nhập cuối
        $update = $db->prepare('UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?');
        $update->execute([$user['id']]);

        // Tạo JWT Token
        $tokenPayload = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'full_name' => $user['full_name'],
            'department_id' => $user['department_id']
        ];
        $token = Auth::createToken($tokenPayload, 86400 * 7); // 7 ngày

        AuditLogger::log('LOGIN_SUCCESS', 'USER', $user['id'], null, ['username' => $username, 'role' => $user['role']], $user, $request);

        unset($user['password_hash'], $user['totp_secret']);

        Response::json([
            'token' => $token,
            'user' => $user
        ], 200, 'Đăng nhập thành công');
    }

    public function me(Request $request): void {
        $user = Auth::requireAuth($request);
        Response::json($user, 200, 'Lấy thông tin cán bộ thành công');
    }

    public function changePassword(Request $request): void {
        $user = Auth::requireAuth($request);
        $oldPass = (string)$request->get('old_password', '');
        $newPass = (string)$request->get('new_password', '');

        if (strlen($newPass) < 8) {
            Response::error('Mật khẩu mới phải có tối thiểu 8 ký tự', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
        $stmt->execute([$user['id']]);
        $hash = $stmt->fetchColumn();

        if (!password_verify($oldPass, $hash)) {
            Response::error('Mật khẩu hiện tại không chính xác', 400);
        }

        $newHash = password_hash($newPass, PASSWORD_BCRYPT);
        $update = $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $update->execute([$newHash, $user['id']]);

        AuditLogger::log('CHANGE_PASSWORD', 'USER', $user['id'], null, ['status' => 'SUCCESS'], $user, $request);

        Response::json(null, 200, 'Đổi mật khẩu thành công');
    }

    public function logout(Request $request): void {
        $user = Auth::requireAuth($request);
        AuditLogger::log('LOGOUT', 'USER', $user['id'], null, null, $user, $request);
        Response::json(null, 200, 'Đăng xuất thành công');
    }
}
