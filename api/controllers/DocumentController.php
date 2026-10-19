<?php

class DocumentController {
    public function upload(Request $request, array $params): void {
        $currentUser = Auth::requireAuth($request);
        $appId = $params['id'] ?? '';

        if (empty($_FILES['file'])) {
            Response::error('Không tìm thấy tệp đính kèm để tải lên', 400);
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Lỗi khi tải tệp lên hệ thống: ' . $file['error'], 400);
        }

        $config = require dirname(__DIR__) . '/config/app.php';
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, $config['allowed_extensions'], true)) {
            Response::error('Định dạng tệp không được phép. Cho phép: ' . implode(', ', $config['allowed_extensions']), 400);
        }

        if ($file['size'] > $config['max_file_size']) {
            Response::error('Dung lượng tệp vượt quá giới hạn cho phép (Tối đa 10MB)', 400);
        }

        $uploadDir = $config['upload_dir'] . DIRECTORY_SEPARATOR . 'documents';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $safeFileName = sprintf('%s_%s.%s', $appId, bin2hex(random_bytes(8)), $ext);
        $destPath = $uploadDir . DIRECTORY_SEPARATOR . $safeFileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Không thể lưu tệp vào hệ thống lưu trữ', 500);
        }

        $docType = $request->get('doc_type', 'HO_SO_GOC');
        $docName = $request->get('document_name', $file['name']);
        $relativeUrl = '/uploads/documents/' . $safeFileName;

        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO application_documents (
                application_id, document_name, file_path, file_size, 
                mime_type, doc_type, uploaded_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $appId, $docName, $relativeUrl, $file['size'],
            $file['type'] ?: 'application/octet-stream', $docType, $currentUser['id']
        ]);

        $idStmt = $db->prepare('SELECT id FROM application_documents WHERE file_path = ?');
        $idStmt->execute([$relativeUrl]);
        $newId = $idStmt->fetchColumn();

        AuditLogger::log('UPLOAD_DOCUMENT', 'DOCUMENT', $newId, null, [
            'app_id' => $appId,
            'file_name' => $docName,
            'size' => $file['size']
        ], $currentUser, $request);

        Response::json([
            'id' => $newId,
            'document_name' => $docName,
            'file_path' => $relativeUrl
        ], 201, 'Tải tài liệu đính kèm lên thành công');
    }

    /**
     * Tải tệp công khai (Công dân nộp hồ sơ trực tuyến hoặc đính kèm ảnh phản ánh)
     */
    public function uploadPublic(Request $request): void {
        if (empty($_FILES['file'])) {
            Response::error('Không tìm thấy tệp để tải lên', 400);
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Lỗi khi tải tệp lên hệ thống: ' . $file['error'], 400);
        }

        $config = require dirname(__DIR__) . '/config/app.php';
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, $config['allowed_extensions'], true)) {
            Response::error('Định dạng tệp không được phép. Cho phép: ' . implode(', ', $config['allowed_extensions']), 400);
        }

        if ($file['size'] > $config['max_file_size']) {
            Response::error('Dung lượng tệp vượt quá giới hạn (Tối đa 10MB)', 400);
        }

        $targetFolder = $request->get('folder', 'documents');
        if (!in_array($targetFolder, ['documents', 'complaints'])) {
            $targetFolder = 'documents';
        }

        $uploadDir = $config['upload_dir'] . DIRECTORY_SEPARATOR . $targetFolder;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $safeFileName = sprintf('public_%s_%s.%s', date('Ymd_His'), bin2hex(random_bytes(6)), $ext);
        $destPath = $uploadDir . DIRECTORY_SEPARATOR . $safeFileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Không thể lưu tệp vào hệ thống', 500);
        }

        $relativeUrl = '/uploads/' . $targetFolder . '/' . $safeFileName;

        Response::json([
            'document_name' => $file['name'],
            'file_name' => $safeFileName,
            'file_path' => $relativeUrl,
            'file_size' => $file['size'],
            'mime_type' => $file['type'] ?: 'application/octet-stream'
        ], 201, 'Tải tệp thành công');
    }
}
