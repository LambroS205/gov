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
        $stmt = $db->prepare('SELECT COUNT(*) FROM applications WHERE dossier_code LIKE ?');
        $stmt->execute([$prefix . '-%']);
        $seq = (int)$stmt->fetchColumn() + 1;
        return sprintf('%s-%04d', $prefix, $seq);
    }

    /**
     * Sinh mã phản ánh kiến nghị
     * Định dạng: PAKN-YYMMDD-XXX
     */
    public static function generateComplaintCode(): string {
        $prefix = 'PAKN-' . date('ymd');
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT COUNT(*) FROM complaints WHERE complaint_code LIKE ?');
        $stmt->execute([$prefix . '-%']);
        $seq = (int)$stmt->fetchColumn() + 1;
        return sprintf('%s-%03d', $prefix, $seq);
    }
}
