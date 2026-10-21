<?php

class CitizenValidator {
    /**
     * Kiểm tra tính hợp lệ của số CCCD (12 chữ số)
     */
    public static function isValidCccd(string $cccd): bool {
        return (bool)preg_match('/^\d{12}$/', trim($cccd));
    }

    /**
     * Kiểm tra tính hợp lệ của số điện thoại Việt Nam (10 chữ số bắt đầu bằng 0)
     */
    public static function isValidPhone(string $phone): bool {
        return (bool)preg_match('/^0\d{9}$/', trim($phone));
    }

    /**
     * Kiểm tra độ mạnh mật khẩu (tối thiểu 8 ký tự, có cả chữ và số)
     */
    public static function isValidPassword(string $password): bool {
        if (strlen($password) < 8) {
            return false;
        }
        $hasLetter = preg_match('/[a-zA-Z]/', $password);
        $hasNumber = preg_match('/[0-9]/', $password);
        return $hasLetter && $hasNumber;
    }

    /**
     * Che mờ CCCD để bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP
     */
    public static function maskCccd(?string $cccd): string {
        if (!$cccd) return '';
        $len = strlen($cccd);
        if ($len <= 6) return $cccd;
        return substr($cccd, 0, 4) . '****' . substr($cccd, -4);
    }

    /**
     * Che mờ SĐT để bảo vệ dữ liệu cá nhân
     */
    public static function maskPhone(?string $phone): string {
        if (!$phone) return '';
        $len = strlen($phone);
        if ($len <= 5) return $phone;
        return substr($phone, 0, 3) . '****' . substr($phone, -3);
    }
}
