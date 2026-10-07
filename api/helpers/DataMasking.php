<?php

class DataMasking {
    /**
     * Che mờ số Căn cước công dân (CCCD) theo chuẩn Nghị định 13/2023/NĐ-CP
     * Ví dụ: 015092008899 -> 01509200****
     */
    public static function maskCccd(?string $cccd): string {
        if (!$cccd) return '';
        $len = strlen($cccd);
        if ($len <= 4) return '****';
        return substr($cccd, 0, $len - 4) . '****';
    }

    /**
     * Che mờ số điện thoại
     * Ví dụ: 0988776655 -> 098****655
     */
    public static function maskPhone(?string $phone): string {
        if (!$phone) return '';
        $len = strlen($phone);
        if ($len <= 6) return '09******';
        return substr($phone, 0, 3) . '****' . substr($phone, -3);
    }

    /**
     * Áp dụng che mờ dữ liệu cho mảng hồ sơ công dân
     */
    public static function maskCitizenRecord(array $row, bool $canViewFull = false): array {
        if (!$canViewFull) {
            if (isset($row['citizen_id_number'])) {
                $row['citizen_id_number_masked'] = self::maskCccd($row['citizen_id_number']);
                $row['citizen_id_number'] = $row['citizen_id_number_masked'];
            }
            if (isset($row['cccd_number'])) {
                $row['cccd_number_masked'] = self::maskCccd($row['cccd_number']);
                $row['cccd_number'] = $row['cccd_number_masked'];
            }
            if (isset($row['citizen_phone'])) {
                $row['citizen_phone_masked'] = self::maskPhone($row['citizen_phone']);
                $row['citizen_phone'] = $row['citizen_phone_masked'];
            }
            if (isset($row['phone_number'])) {
                $row['phone_number_masked'] = self::maskPhone($row['phone_number']);
                $row['phone_number'] = $row['phone_number_masked'];
            }
        }
        return $row;
    }
}
