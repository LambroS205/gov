<?php

class ComplaintController {
    public function index(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(100, (int)$request->getQuery('pageSize', 10)));
        $offset = ($page - 1) * $pageSize;

        $status = $request->getQuery('status');
        $category = $request->getQuery('category');
        $search = trim($request->getQuery('search', ''));

        $where = ['1=1'];
        $params = [];

        if (!empty($status)) {
            $where[] = 'c.status = ?';
            $params[] = $status;
        }

        if (!empty($category)) {
            $where[] = 'c.category = ?';
            $params[] = $category;
        }

        if (!empty($search)) {
            $where[] = '(c.complaint_code LIKE ? OR c.title LIKE ? OR c.citizen_name LIKE ? OR c.location LIKE ?)';
            $p = "%$search%";
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM complaints c WHERE $whereSql");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT c.*, u.full_name as assigned_name, u.phone_number as assigned_phone
            FROM complaints c
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE $whereSql
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $db->prepare($sql);
        $i = 1;
        foreach ($params as $param) {
            $stmt->bindValue($i++, $param);
        }
        $stmt->bindValue($i++, $pageSize, PDO::PARAM_INT);
        $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        foreach ($items as &$item) {
            $item['photo_paths'] = json_decode($item['photo_paths'] ?? '[]', true) ?: [];
        }

        Response::paginated($items, $total, $page, $pageSize, 'Lấy danh sách phản ánh thành công');
    }

    public function show(Request $request, array $params): void {
        Auth::requireAuth($request);
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT c.*, u.full_name as assigned_name, u.phone_number as assigned_phone
            FROM complaints c
            LEFT JOIN users u ON c.assigned_to = u.id
            WHERE c.id = ?
        ');
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::error('Phản ánh không tồn tại', 404);
        }

        $item['photo_paths'] = json_decode($item['photo_paths'] ?? '[]', true) ?: [];
        Response::json($item, 200, 'Lấy chi tiết phản ánh thành công');
    }

    public function create(Request $request): void {
        $body = $request->getBody();

        $citizenName = trim($body['citizen_name'] ?? '');
        $title = trim($body['title'] ?? '');
        $description = trim($body['description'] ?? '');
        $category = $body['category'] ?? 'RAC_THAI';
        $location = trim($body['location'] ?? '');
        $phone = trim($body['citizen_phone'] ?? '');

        if (empty($citizenName) || empty($title) || empty($description)) {
            Response::error('Họ tên, tiêu đề và nội dung phản ánh không được để trống', 400);
        }

        $code = DossierCodeGenerator::generateComplaintCode();
        $db = Database::getConnection();

        $stmt = $db->prepare('
            INSERT INTO complaints (
                complaint_code, citizen_name, citizen_phone, citizen_cccd, category, 
                title, description, location, photo_paths, priority, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $photos = !empty($body['photo_paths']) ? json_encode($body['photo_paths'], JSON_UNESCAPED_UNICODE) : null;
        $priority = $body['priority'] ?? 'TRUNG_BINH';

        $stmt->execute([
            $code, $citizenName, $phone, $body['citizen_cccd'] ?? null,
            $category, $title, $description, $location, $photos, $priority, 'MOI'
        ]);

        $idStmt = $db->prepare('SELECT id FROM complaints WHERE complaint_code = ?');
        $idStmt->execute([$code]);
        $newId = $idStmt->fetchColumn();

        AuditLogger::log('CREATE_COMPLAINT', 'COMPLAINT', $newId, null, ['code' => $code, 'title' => $title]);

        Response::json(['id' => $newId, 'complaint_code' => $code], 201, 'Gửi phản ánh - kiến nghị thành công');
    }

    public function assign(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'LANH_DAO', 'MOT_CUA']);
        $id = $params['id'] ?? '';
        $assignedTo = trim($request->get('assigned_to', ''));

        if (empty($assignedTo)) {
            Response::error('Vui lòng chọn cán bộ phụ trách xử lý', 400);
        }

        $db = Database::getConnection();
        $update = $db->prepare('UPDATE complaints SET assigned_to = ?, status = ? WHERE id = ?');
        $update->execute([$assignedTo, 'DANG_XU_LY', $id]);

        AuditLogger::log('ASSIGN_COMPLAINT', 'COMPLAINT', $id, null, ['assigned_to' => $assignedTo], $currentUser, $request);

        Response::json(null, 200, 'Điều phối cán bộ xử lý thành công');
    }

    public function respond(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'CHUYEN_VIEN', 'LANH_DAO']);
        $id = $params['id'] ?? '';
        $response = trim($request->get('response', ''));
        $resolvedPhotos = $request->get('resolved_photo_paths');
        $resolvedPhotosJson = !empty($resolvedPhotos) ? json_encode($resolvedPhotos, JSON_UNESCAPED_UNICODE) : null;

        if (empty($response)) {
            Response::error('Vui lòng nhập nội dung kết quả xử lý phản ánh', 400);
        }

        $db = Database::getConnection();
        $update = $db->prepare('UPDATE complaints SET response = ?, resolved_photo_paths = COALESCE(?, resolved_photo_paths), responded_at = NOW(), status = ? WHERE id = ?');
        $update->execute([$response, $resolvedPhotosJson, 'DA_XU_LY', $id]);

        AuditLogger::log('RESPOND_COMPLAINT', 'COMPLAINT', $id, null, ['response' => $response], $currentUser, $request);

        Response::json(null, 200, 'Phản hồi kết quả xử lý phản ánh thành công');
    }
}
