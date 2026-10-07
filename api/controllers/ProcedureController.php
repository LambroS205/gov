<?php

class ProcedureController {
    public function index(Request $request): void {
        $db = Database::getConnection();
        $fieldType = $request->getQuery('field_type');
        $activeOnly = $request->getQuery('active_only') !== '0';

        $where = ['1=1'];
        $params = [];

        if ($activeOnly) {
            $where[] = 'is_active = 1';
        }
        if (!empty($fieldType)) {
            $where[] = 'field_type = ?';
            $params[] = $fieldType;
        }

        $sql = 'SELECT * FROM administrative_procedures WHERE ' . implode(' AND ', $where) . ' ORDER BY field_type, proc_name';
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $procedures = $stmt->fetchAll();

        foreach ($procedures as &$proc) {
            $proc['required_documents'] = json_decode($proc['required_documents'] ?? '[]', true) ?: [];
        }

        Response::json($procedures, 200, 'Lấy danh mục thủ tục hành chính thành công');
    }

    public function show(Request $request, array $params): void {
        $id = (int)($params['id'] ?? 0);
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM administrative_procedures WHERE id = ?');
        $stmt->execute([$id]);
        $proc = $stmt->fetch();

        if (!$proc) {
            Response::error('Thủ tục hành chính không tồn tại', 404);
        }
        $proc['required_documents'] = json_decode($proc['required_documents'] ?? '[]', true) ?: [];

        Response::json($proc, 200, 'Lấy chi tiết TTHC thành công');
    }

    public function create(Request $request): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN']);
        $body = $request->getBody();

        $procCode = trim($body['proc_code'] ?? '');
        $procName = trim($body['proc_name'] ?? '');
        $fieldType = $body['field_type'] ?? 'HO_TICH';
        $processingDays = (int)($body['processing_days'] ?? 1);
        $feeAmount = (float)($body['fee_amount'] ?? 0);
        $reqDocs = json_encode($body['required_documents'] ?? [], JSON_UNESCAPED_UNICODE);

        if (empty($procCode) || empty($procName)) {
            Response::error('Mã và Tên thủ tục không được để trống', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO administrative_procedures (proc_code, proc_name, field_type, processing_days, fee_amount, required_documents)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$procCode, $procName, $fieldType, $processingDays, $feeAmount, $reqDocs]);
        $newId = (int)$db->lastInsertId();

        AuditLogger::log('CREATE_PROCEDURE', 'PROCEDURE', (string)$newId, null, ['proc_code' => $procCode, 'proc_name' => $procName], $currentUser, $request);

        Response::json(['id' => $newId], 201, 'Tạo mới thủ tục hành chính thành công');
    }

    public function update(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN']);
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM administrative_procedures WHERE id = ?');
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) {
            Response::error('Thủ tục hành chính không tồn tại', 404);
        }

        $procCode = trim($body['proc_code'] ?? $old['proc_code']);
        $procName = trim($body['proc_name'] ?? $old['proc_name']);
        $fieldType = $body['field_type'] ?? $old['field_type'];
        $processingDays = (int)($body['processing_days'] ?? $old['processing_days']);
        $feeAmount = (float)($body['fee_amount'] ?? $old['fee_amount']);
        $reqDocs = isset($body['required_documents']) ? json_encode($body['required_documents'], JSON_UNESCAPED_UNICODE) : $old['required_documents'];
        $isActive = isset($body['is_active']) ? (int)$body['is_active'] : $old['is_active'];

        $update = $db->prepare('
            UPDATE administrative_procedures 
            SET proc_code = ?, proc_name = ?, field_type = ?, processing_days = ?, fee_amount = ?, required_documents = ?, is_active = ?
            WHERE id = ?
        ');
        $update->execute([$procCode, $procName, $fieldType, $processingDays, $feeAmount, $reqDocs, $isActive, $id]);

        AuditLogger::log('UPDATE_PROCEDURE', 'PROCEDURE', (string)$id, $old, $body, $currentUser, $request);

        Response::json(null, 200, 'Cập nhật thủ tục hành chính thành công');
    }
}
