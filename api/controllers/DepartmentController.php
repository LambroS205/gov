<?php

class DepartmentController {
    public function index(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $departments = $db->query('
            SELECT d.*, COUNT(u.id) as total_officers
            FROM departments d
            LEFT JOIN users u ON d.id = u.department_id AND u.is_active = 1
            GROUP BY d.id
            ORDER BY d.id ASC
        ')->fetchAll();

        Response::json($departments, 200, 'Lấy danh sách phòng ban thành công');
    }

    public function show(Request $request, array $params): void {
        Auth::requireAuth($request);
        $id = (int)($params['id'] ?? 0);
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM departments WHERE id = ?');
        $stmt->execute([$id]);
        $dept = $stmt->fetch();

        if (!$dept) {
            Response::error('Phòng ban không tồn tại', 404);
        }

        $users = $db->prepare('SELECT id, username, full_name, role, phone_number, email FROM users WHERE department_id = ? AND is_active = 1');
        $users->execute([$id]);
        $dept['officers'] = $users->fetchAll();

        Response::json($dept, 200, 'Lấy chi tiết phòng ban thành công');
    }
}
