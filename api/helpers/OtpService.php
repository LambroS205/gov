<?php

class OtpService {
    /**
     * Tạo và phát hành mã OTP
     */
    public static function issue(string $phone, string $purpose): array {
        $db = Database::getConnection();

        // 1. Kiểm tra tần suất yêu cầu (Rate limiting: 60s)
        $checkStmt = $db->prepare('
            SELECT created_at 
            FROM citizen_otps 
            WHERE phone_number = ? AND purpose = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
            ORDER BY id DESC LIMIT 1
        ');
        $checkStmt->execute([$phone, $purpose]);
        $recent = $checkStmt->fetch();

        if ($recent) {
            $diff = 60 - (time() - strtotime($recent['created_at']));
            $wait = max(1, $diff);
            return [
                'success' => false,
                'message' => sprintf('Bạn đang thao tác quá nhanh. Vui lòng chờ %d giây trước khi yêu cầu mã OTP mới.', $wait),
                'wait_seconds' => $wait
            ];
        }

        // 2. Tạo mã OTP 6 chữ số
        $code = (string)random_int(100000, 999999);
        $codeHash = password_hash($code, PASSWORD_BCRYPT);
        $expiresAt = date('Y-m-d H:i:s', time() + 300); // 5 phút

        $insertStmt = $db->prepare('
            INSERT INTO citizen_otps (phone_number, purpose, code_hash, attempts, expires_at)
            VALUES (?, ?, ?, 0, ?)
        ');
        $insertStmt->execute([$phone, $purpose, $codeHash, $expiresAt]);

        // 3. Ghi vào nhật ký thông báo SMS
        $purposeText = ($purpose === 'RESET_PASSWORD') ? 'đặt lại mật khẩu tài khoản' : 'xác thực số điện thoại';
        $smsMessage = sprintf('UBND Phuong Yen Bai: Ma xac thuc OTP de %s cua Quy khach la: %s. Ma co hieu luc trong 5 phut. Khong chia se ma nay cho bat ky ai.', $purposeText, $code);

        $notifyStmt = $db->prepare('
            INSERT INTO notifications (recipient_phone, recipient_name, channel, subject, message, is_sent)
            VALUES (?, ?, ?, ?, ?, 1)
        ');
        $notifyStmt->execute([$phone, 'Công dân', 'SMS', 'Mã xác thực OTP Dịch vụ công', $smsMessage]);

        $config = require dirname(__DIR__) . '/config/app.php';
        $isDemo = !empty($config['demo_mode']);

        return [
            'success' => true,
            'message' => 'Mã xác thực OTP đã được gửi đến số điện thoại của Quý công dân.',
            'expires_in' => 300,
            'demo_code' => $isDemo ? $code : null
        ];
    }

    /**
     * Xác thực mã OTP
     */
    public static function verify(string $phone, string $purpose, string $code): array {
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT id, code_hash, attempts, expires_at, consumed_at
            FROM citizen_otps
            WHERE phone_number = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > NOW()
            ORDER BY id DESC LIMIT 1
        ');
        $stmt->execute([$phone, $purpose]);
        $otp = $stmt->fetch();

        if (!$otp) {
            return [
                'valid' => false,
                'message' => 'Mã OTP không hợp lệ hoặc đã hết thời gian hiệu lực (5 phút). Vui lòng yêu cầu mã mới.'
            ];
        }

        if ((int)$otp['attempts'] >= 5) {
            $consumeStmt = $db->prepare('UPDATE citizen_otps SET consumed_at = NOW() WHERE id = ?');
            $consumeStmt->execute([$otp['id']]);
            return [
                'valid' => false,
                'message' => 'Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.'
            ];
        }

        if (!password_verify($code, $otp['code_hash'])) {
            $newAttempts = (int)$otp['attempts'] + 1;
            $consumeSql = ($newAttempts >= 5) ? ', consumed_at = NOW()' : '';
            $updateStmt = $db->prepare("UPDATE citizen_otps SET attempts = ?$consumeSql WHERE id = ?");
            $updateStmt->execute([$newAttempts, $otp['id']]);

            $remain = 5 - $newAttempts;
            return [
                'valid' => false,
                'message' => sprintf('Mã OTP không chính xác (Còn %d lần thử).', max(0, $remain))
            ];
        }

        // Đánh dấu mã đã sử dụng thành công
        $consumeStmt = $db->prepare('UPDATE citizen_otps SET consumed_at = NOW() WHERE id = ?');
        $consumeStmt->execute([$otp['id']]);

        return [
            'valid' => true,
            'message' => 'Xác thực mã OTP thành công.'
        ];
    }
}
