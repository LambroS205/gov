<?php

class CitizenAuth {
    private static ?array $currentCitizen = null;

    /**
     * Tạo JWT token cho công dân
     */
    public static function createToken(array $account, ?int $ttlSeconds = null): string {
        $config = require dirname(__DIR__) . '/config/app.php';
        $ttl = $ttlSeconds ?? ($config['citizen_jwt_ttl'] ?? 86400 * 7);

        $payload = [
            'typ' => 'citizen',
            'user_id' => $account['id'],
            'cccd_number' => $account['cccd_number'],
            'phone_number' => $account['phone_number'],
            'full_name' => $account['full_name'],
            'email' => $account['email'] ?? null
        ];

        return Auth::createToken($payload, $ttl);
    }

    /**
     * Bắt buộc phải đăng nhập tài khoản công dân
     */
    public static function requireCitizen(Request $request): array {
        $token = $request->getBearerToken();
        if (!$token) {
            Response::error('Yêu cầu đăng nhập tài khoản công dân để truy cập chức năng này', 401);
        }

        $payload = Auth::verifyToken($token);
        if (!$payload || !isset($payload['user_id']) || ($payload['typ'] ?? '') !== 'citizen') {
            Response::error('Phiên làm việc công dân không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại', 401);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT ca.*, c.household_number, c.residence_type, c.permanent_address as official_address
            FROM citizen_accounts ca
            LEFT JOIN citizens c ON ca.citizen_id = c.id
            WHERE ca.id = ?
        ');
        $stmt->execute([$payload['user_id']]);
        $account = $stmt->fetch();

        if (!$account) {
            Response::error('Tài khoản công dân không tồn tại trên hệ thống', 401);
        }

        if (!$account['is_active']) {
            Response::error('Tài khoản công dân đã bị tạm khóa. Vui lòng liên hệ Bộ phận Một cửa UBND Phường để được hỗ trợ', 403);
        }

        if (!empty($account['locked_until']) && strtotime($account['locked_until']) > time()) {
            $remainMinutes = ceil((strtotime($account['locked_until']) - time()) / 60);
            Response::error(sprintf('Tài khoản bị tạm khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau %d phút', $remainMinutes), 403);
        }

        unset($account['password_hash']);
        self::$currentCitizen = $account;
        return $account;
    }

    /**
     * Tùy chọn lấy thông tin công dân nếu có gửi token hợp lệ (dành cho API công khai)
     */
    public static function optionalCitizen(Request $request): ?array {
        $token = $request->getBearerToken();
        if (!$token) {
            return null;
        }

        $payload = Auth::verifyToken($token);
        if (!$payload || !isset($payload['user_id']) || ($payload['typ'] ?? '') !== 'citizen') {
            return null;
        }

        try {
            $db = Database::getConnection();
            $stmt = $db->prepare('SELECT * FROM citizen_accounts WHERE id = ? AND is_active = 1');
            $stmt->execute([$payload['user_id']]);
            $account = $stmt->fetch();

            if ($account) {
                unset($account['password_hash']);
                self::$currentCitizen = $account;
                return $account;
            }
        } catch (Throwable $e) {
            return null;
        }

        return null;
    }

    public static function user(): ?array {
        return self::$currentCitizen;
    }
}
