<?php

class ApplicationPresenter {
    /**
     * Bổ sung thông tin chi tiết (tiến độ SLA, workflow, tài liệu, biên lai) cho một hồ sơ
     */
    public static function enrich(PDO $db, array $app): array {
        $now = time();
        $appTime = strtotime($app['appointment_date'] ?? 'now');

        if (in_array($app['status'], ['HOAN_THANH', 'TU_CHOI'])) {
            $app['sla_status'] = 'COMPLETED';
        } elseif ($now > $appTime) {
            $app['sla_status'] = 'OVERDUE';
        } elseif ($appTime - $now <= 86400) {
            $app['sla_status'] = 'WARNING';
        } else {
            $app['sla_status'] = 'NORMAL';
        }

        // Lấy lịch sử workflow
        $wfStmt = $db->prepare('
            SELECT action, from_status, to_status, comment, created_at
            FROM application_workflow
            WHERE application_id = ?
            ORDER BY created_at ASC
        ');
        $wfStmt->execute([$app['id']]);
        $app['workflow'] = $wfStmt->fetchAll();

        // Lấy danh sách tài liệu
        $docStmt = $db->prepare('
            SELECT id, document_name, file_path, doc_type, is_signed, uploaded_at
            FROM application_documents
            WHERE application_id = ?
            ORDER BY uploaded_at ASC
        ');
        $docStmt->execute([$app['id']]);
        $app['documents'] = $docStmt->fetchAll();

        // Xử lý biên lai điện tử nếu đã thanh toán
        if (($app['payment_status'] ?? '') === 'DA_THANH_TOAN' && !empty($app['receipt_number'])) {
            $receiptDir = dirname(dirname(__DIR__)) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'receipts';
            if (!is_dir($receiptDir)) {
                mkdir($receiptDir, 0777, true);
            }
            $receiptFile = $receiptDir . DIRECTORY_SEPARATOR . $app['receipt_number'] . '.html';
            if (!file_exists($receiptFile)) {
                $rHtml = ApplicationController::generateReceiptHtml(
                    $app,
                    $app['receipt_number'],
                    ($app['payment_method'] ?? '') === 'CHUYEN_KHOAN_QR' ? 'Chuyển khoản VietQR' : 'Tiền mặt',
                    'Bộ phận Một cửa',
                    $app['paid_at'] ?? date('Y-m-d H:i:s')
                );
                file_put_contents($receiptFile, $rHtml);
            }
            $app['receipt_url'] = '/uploads/receipts/' . $app['receipt_number'] . '.html';
        }

        // Parse payload nếu có
        if (!empty($app['dossier_payload']) && is_string($app['dossier_payload'])) {
            $decoded = json_decode($app['dossier_payload'], true);
            $app['dossier_payload_parsed'] = is_array($decoded) ? $decoded : null;
        }

        return $app;
    }

    /**
     * Bổ sung thông tin cho danh sách hồ sơ
     */
    public static function enrichList(PDO $db, array $apps): array {
        foreach ($apps as &$app) {
            $app = self::enrich($db, $app);
        }
        return $apps;
    }
}
