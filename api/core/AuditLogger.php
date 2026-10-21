<?php

class AuditLogger {
    /**
     * Ghi nhật ký kiểm toán hệ thống bất biến (Audit Trail)
     */
    public static function log(
        string $action,
        string $resourceType,
        ?string $resourceId,
        $oldState = null,
        $newState = null,
        ?array $user = null,
        ?Request $request = null
    ): void {
        try {
            $db = Database::getConnection();
            $staffUser = $user ?? Auth::user();
            $citizenUser = CitizenAuth::user();

            $userId = $staffUser['id'] ?? null;
            $userName = $staffUser['full_name'] ?? ($citizenUser ? 'Công dân: ' . $citizenUser['full_name'] : 'Khách / Hệ thống');

            $ip = $request ? $request->getClientIp() : ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
            $ua = $request ? $request->getUserAgent() : ($_SERVER['HTTP_USER_AGENT'] ?? 'CLI');

            $oldStateJson = $oldState !== null ? json_encode($oldState, JSON_UNESCAPED_UNICODE) : null;
            $newStateJson = $newState !== null ? json_encode($newState, JSON_UNESCAPED_UNICODE) : null;

            $stmt = $db->prepare('
                INSERT INTO audit_logs (user_id, user_name, action, resource_type, resource_id, ip_address, user_agent, old_state, new_state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([$userId, $userName, $action, $resourceType, $resourceId, $ip, $ua, $oldStateJson, $newStateJson]);
        } catch (Throwable $e) {
            // Không làm gián đoạn luồng chính nhưng ghi log vào file error
            error_log('[AuditLogger Error] ' . $e->getMessage());
        }
    }
}
