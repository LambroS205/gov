<?php

class Auth {
    private static ?array $currentUser = null;

    /**
     * Tạo JWT token
     */
    public static function createToken(array $payload, int $ttlSeconds = 86400): string {
        $config = require dirname(__DIR__) . '/config/app.php';
        $secret = $config['jwt_secret'];

        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['iat'] = time();
        $payload['exp'] = time() + $ttlSeconds;
        $payloadJson = json_encode($payload);

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payloadJson);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Xác thực và giải mã JWT token
     */
    public static function verifyToken(string $token): ?array {
        $config = require dirname(__DIR__) . '/config/app.php';
        $secret = $config['jwt_secret'];

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Bắt buộc người dùng phải đăng nhập, nếu chưa thì trả về lỗi 401
     */
    public static function requireAuth(Request $request): array {
        $token = $request->getBearerToken();
        if (!$token) {
            Response::error('Yêu cầu đăng nhập để truy cập tài nguyên này (Thiếu Bearer Token)', 401);
        }

        $payload = self::verifyToken($token);
        if (!$payload || !isset($payload['user_id'])) {
            Response::error('Phiên làm việc không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại', 401);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT u.*, d.dept_name, d.dept_code FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ? AND u.is_active = 1');
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Tài khoản người dùng không tồn tại hoặc đã bị khóa', 401);
        }

        unset($user['password_hash'], $user['totp_secret']);
        self::$currentUser = $user;
        return $user;
    }

    /**
     * Bắt buộc người dùng phải có 1 trong các quyền chỉ định (RBAC)
     */
    public static function requireRoles(Request $request, array $roles): array {
        $user = self::requireAuth($request);
        if (!in_array($user['role'], $roles, true)) {
            Response::error(
                sprintf('Bạn không có quyền thực hiện chức năng này. Quyền yêu cầu: [%s], quyền hiện tại: [%s]', implode(', ', $roles), $user['role']),
                403
            );
        }
        return $user;
    }

    public static function user(): ?array {
        return self::$currentUser;
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
