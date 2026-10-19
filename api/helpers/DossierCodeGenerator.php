<?php

class DossierCodeGenerator {
    /**
     * Sinh mã hồ sơ chuẩn dịch vụ công quốc gia
     * Định dạng: 000.00.00.H49-YYMMDD-XXXX
     * H49 là mã đơn vị hành chính phường Yên Bái
     */
    public static function generateDossierCode(): string {
        $prefix = '000.00.00.H49-' . date('ymd');
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT dossier_code FROM applications WHERE dossier_code LIKE ? ORDER BY id DESC');
        $stmt->execute([$prefix . '-%']);
        $codes = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $maxSeq = 0;
        foreach ($codes as $c) {
            $parts = explode('-', $c);
            $last = end($parts);
            if (is_numeric($last)) {
                $maxSeq = max($maxSeq, (int)$last);
            }
        }
        $seq = $maxSeq + 1;
        return sprintf('%s-%04d', $prefix, $seq);
    }

    /**
     * Sinh mã phản ánh kiến nghị
     * Định dạng: PAKN-YYMMDD-XXX
     */
    public static function generateComplaintCode(): string {
        $prefix = 'PAKN-' . date('ymd');
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT complaint_code FROM complaints WHERE complaint_code LIKE ? ORDER BY id DESC');
        $stmt->execute([$prefix . '-%']);
        $codes = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $maxSeq = 0;
        foreach ($codes as $c) {
            $parts = explode('-', $c);
            $last = end($parts);
            if (is_numeric($last)) {
                $maxSeq = max($maxSeq, (int)$last);
            }
        }
        $seq = $maxSeq + 1;
        return sprintf('%s-%03d', $prefix, $seq);
    }
}
