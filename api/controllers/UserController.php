<?php

class UserController {
    public function index(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $role = $request->getQuery('role');
        $deptId = $request->getQuery('department_id');

        $where = ['1=1'];
        $params = [];

        if (!empty($role)) {
            $where[] = 'u.role = ?';
            $params[] = $role;
        }
        if (!empty($deptId)) {
            $where[] = 'u.department_id = ?';
            $params[] = $deptId;
        }

        $sql = '
            SELECT u.id, u.username, u.full_name, u.email, u.phone_number, u.department_id, 
                   u.role, u.certificate_serial, u.is_active, u.last_login_at, u.created_at,
                   d.dept_name, d.dept_code
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY u.role, u.full_name
        ';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        Response::json($users, 200, 'Lấy danh sách cán bộ thành công');
    }

    public function show(Request $request, array $params): void {
        Auth::requireAuth($request);
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT u.id, u.username, u.full_name, u.email, u.phone_number, u.department_id, 
                   u.role, u.certificate_serial, u.is_active, u.last_login_at, u.created_at,
                   d.dept_name, d.dept_code
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ?
        ');
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) {
            Response::error('Cán bộ không tồn tại', 404);
        }

        Response::json($user, 200, 'Lấy chi tiết cán bộ thành công');
    }

    public function create(Request $request): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN']);
        $body = $request->getBody();

        $username = trim($body['username'] ?? '');
        $fullName = trim($body['full_name'] ?? '');
        $role = $body['role'] ?? 'CHUYEN_VIEN';
        $password = !empty($body['password']) ? $body['password'] : 'Admin@123';

        if (empty($username) || empty($fullName)) {
            Response::error('Tên đăng nhập và Họ tên cán bộ là bắt buộc', 400);
        }

        $db = Database::getConnection();
        $check = $db->prepare('SELECT COUNT(*) FROM users WHERE username = ?');
        $check->execute([$username]);
        if ((int)$check->fetchColumn() > 0) {
            Response::error('Tên đăng nhập đã tồn tại', 400);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare('
            INSERT INTO users (username, password_hash, full_name, email, phone_number, department_id, role, certificate_serial)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $username,
            $hash,
            $fullName,
            $body['email'] ?? null,
            $body['phone_number'] ?? null,
            $body['department_id'] ?? null,
            $role,
            $body['certificate_serial'] ?? null
        ]);

        $idStmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $idStmt->execute([$username]);
        $newId = $idStmt->fetchColumn();

        AuditLogger::log('CREATE_USER', 'USER', $newId, null, ['username' => $username, 'role' => $role], $currentUser, $request);

        Response::json(['id' => $newId], 201, 'Tạo mới tài khoản cán bộ thành công');
    }

    public function update(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN']);
        $id = $params['id'] ?? '';
        $body = $request->getBody();

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) {
            Response::error('Cán bộ không tồn tại', 404);
        }

        $update = $db->prepare('
            UPDATE users SET
                full_name = ?, email = ?, phone_number = ?, department_id = ?, 
                role = ?, certificate_serial = ?, is_active = ?
            WHERE id = ?
        ');
        $update->execute([
            $body['full_name'] ?? $old['full_name'],
            $body['email'] ?? $old['email'],
            $body['phone_number'] ?? $old['phone_number'],
            $body['department_id'] ?? $old['department_id'],
            $body['role'] ?? $old['role'],
            $body['certificate_serial'] ?? $old['certificate_serial'],
            isset($body['is_active']) ? (int)$body['is_active'] : $old['is_active'],
            $id
        ]);

        AuditLogger::log('UPDATE_USER', 'USER', $id, $old, $body, $currentUser, $request);

        Response::json(null, 200, 'Cập nhật thông tin cán bộ thành công');
    }

    public function resetPassword(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN']);
        $id = $params['id'] ?? '';
        $newPass = $request->get('password', 'Admin@123');

        $hash = password_hash($newPass, PASSWORD_BCRYPT);
        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE users SET password_hash = ?, failed_login_count = 0, locked_until = NULL WHERE id = ?');
        $stmt->execute([$hash, $id]);

        AuditLogger::log('RESET_USER_PASSWORD', 'USER', $id, null, ['status' => 'SUCCESS'], $currentUser, $request);

        Response::json(null, 200, 'Đặt lại mật khẩu mặc định thành công (Admin@123)');
    }
}
