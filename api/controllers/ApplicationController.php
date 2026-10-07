<?php

class ApplicationController {
    /**
     * Danh sách hồ sơ (Lọc, Tìm kiếm, Phân trang)
     */
    public function index(Request $request): void {
        $currentUser = Auth::requireAuth($request);
        $db = Database::getConnection();

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(100, (int)$request->getQuery('pageSize', 10)));
        $offset = ($page - 1) * $pageSize;

        $status = $request->getQuery('status');
        $field = $request->getQuery('field_type');
        $search = trim($request->getQuery('search', ''));
        $myQueue = $request->getQuery('my_queue'); // Chỉ lấy hồ sơ được phân công cho mình
        $paymentStatus = $request->getQuery('payment_status');
        $slaFilter = $request->getQuery('sla_filter'); // 'WARNING', 'OVERDUE', 'NORMAL'

        $where = ['1=1'];
        $params = [];

        if (!empty($status)) {
            $where[] = 'a.status = ?';
            $params[] = $status;
        }

        if (!empty($paymentStatus)) {
            $where[] = 'a.payment_status = ?';
            $params[] = $paymentStatus;
        }

        if ($slaFilter === 'OVERDUE') {
            $where[] = "a.status NOT IN ('HOAN_THANH', 'TU_CHOI') AND NOW() > a.appointment_date";
        } elseif ($slaFilter === 'WARNING') {
            $where[] = "a.status NOT IN ('HOAN_THANH', 'TU_CHOI') AND a.appointment_date >= NOW() AND TIMESTAMPDIFF(HOUR, NOW(), a.appointment_date) <= 24";
        } elseif ($slaFilter === 'NORMAL') {
            $where[] = "a.status NOT IN ('HOAN_THANH', 'TU_CHOI') AND TIMESTAMPDIFF(HOUR, NOW(), a.appointment_date) > 24";
        }

        if (!empty($field)) {
            $where[] = 'p.field_type = ?';
            $params[] = $field;
        }

        if (!empty($search)) {
            $where[] = '(a.dossier_code LIKE ? OR a.citizen_name LIKE ? OR a.citizen_id_number LIKE ? OR a.citizen_phone LIKE ?)';
            $searchPattern = "%$search%";
            $params[] = $searchPattern;
            $params[] = $searchPattern;
            $params[] = $searchPattern;
            $params[] = $searchPattern;
        }

        // Lọc danh sách công việc của chuyên viên hiện tại
        if ($myQueue === '1' || $currentUser['role'] === 'CHUYEN_VIEN') {
            if ($currentUser['role'] === 'CHUYEN_VIEN') {
                $where[] = '(a.current_handler_id = ? OR a.current_handler_id IS NULL)';
                $params[] = $currentUser['id'];
            }
        } elseif ($currentUser['role'] === 'LANH_DAO' && $status === 'CHO_KY_DUYET') {
            $where[] = "a.status = 'CHO_KY_DUYET'";
        }

        $whereSql = implode(' AND ', $where);

        // Đếm tổng số
        $countStmt = $db->prepare("
            SELECT COUNT(*) 
            FROM applications a 
            JOIN administrative_procedures p ON a.procedure_id = p.id 
            WHERE $whereSql
        ");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Lấy dữ liệu phân trang
        $sql = "
            SELECT 
                a.*, 
                p.proc_name, 
                p.proc_code, 
                p.field_type, 
                p.processing_days, 
                p.fee_amount,
                h.full_name as handler_name,
                r.full_name as receiver_name
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            LEFT JOIN users h ON a.current_handler_id = h.id
            LEFT JOIN users r ON a.received_by_id = r.id
            WHERE $whereSql
            ORDER BY a.submit_date DESC
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

        // Tính toán trạng thái hạn xử lý SLA (Đèn giao thông) và che mờ CCCD
        $now = time();
        $items = array_map(function ($item) use ($now) {
            $appTime = strtotime($item['appointment_date']);
            if (in_array($item['status'], ['HOAN_THANH', 'TU_CHOI'])) {
                $item['sla_status'] = 'COMPLETED';
                $item['sla_remaining_hours'] = 0;
            } elseif ($now > $appTime) {
                $item['sla_status'] = 'OVERDUE';
                $item['sla_remaining_hours'] = round(($now - $appTime) / 3600, 1) * -1;
            } elseif ($appTime - $now <= 86400) {
                $item['sla_status'] = 'WARNING';
                $item['sla_remaining_hours'] = round(($appTime - $now) / 3600, 1);
            } else {
                $item['sla_status'] = 'NORMAL';
                $item['sla_remaining_hours'] = round(($appTime - $now) / 3600, 1);
            }
            return DataMasking::maskCitizenRecord($item, false);
        }, $items);

        Response::paginated($items, $total, $page, $pageSize, 'Lấy danh sách hồ sơ thành công');
    }

    /**
     * Chi tiết 1 hồ sơ
     */
    public function show(Request $request, array $params): void {
        $currentUser = Auth::requireAuth($request);
        $id = $params['id'] ?? '';
        $unmask = $request->getQuery('unmask') === '1';

        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT 
                a.*, 
                p.proc_name, 
                p.proc_code, 
                p.field_type, 
                p.processing_days, 
                p.fee_amount,
                p.required_documents,
                h.full_name as handler_name,
                h.phone_number as handler_phone,
                r.full_name as receiver_name
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            LEFT JOIN users h ON a.current_handler_id = h.id
            LEFT JOIN users r ON a.received_by_id = r.id
            WHERE a.id = ?
        ');
        $stmt->execute([$id]);
        $app = $stmt->fetch();

        if (!$app) {
            Response::error('Hồ sơ không tồn tại trên hệ thống', 404);
        }

        // Lấy lịch sử workflow
        $wfStmt = $db->prepare('
            SELECT w.*, f.full_name as from_user_name, t.full_name as to_user_name
            FROM application_workflow w
            LEFT JOIN users f ON w.from_user_id = f.id
            LEFT JOIN users t ON w.to_user_id = t.id
            WHERE w.application_id = ?
            ORDER BY w.created_at ASC
        ');
        $wfStmt->execute([$id]);
        $workflow = $wfStmt->fetchAll();

        // Lấy tài liệu đính kèm
        $docStmt = $db->prepare('
            SELECT d.*, u.full_name as uploader_name
            FROM application_documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
            WHERE d.application_id = ?
            ORDER BY d.uploaded_at ASC
        ');
        $docStmt->execute([$id]);
        $documents = $docStmt->fetchAll();

        // Kiểm tra quyền xem đầy đủ thông tin cá nhân
        $canUnmask = in_array($currentUser['role'], ['ADMIN', 'LANH_DAO', 'MOT_CUA']) || ($app['current_handler_id'] === $currentUser['id']);
        if ($unmask && $canUnmask) {
            AuditLogger::log('VIEW_UNMASKED_CITIZEN_DATA', 'APPLICATION', $id, null, ['citizen_id' => $app['citizen_id_number']], $currentUser, $request);
        } else {
            $app = DataMasking::maskCitizenRecord($app, false);
        }

        $now = time();
        $appTime = strtotime($app['appointment_date']);
        if (in_array($app['status'], ['HOAN_THANH', 'TU_CHOI'])) {
            $app['sla_status'] = 'COMPLETED';
            $app['sla_remaining_hours'] = 0;
        } elseif ($now > $appTime) {
            $app['sla_status'] = 'OVERDUE';
            $app['sla_remaining_hours'] = round(($now - $appTime) / 3600, 1) * -1;
        } elseif ($appTime - $now <= 86400) {
            $app['sla_status'] = 'WARNING';
            $app['sla_remaining_hours'] = round(($appTime - $now) / 3600, 1);
        } else {
            $app['sla_status'] = 'NORMAL';
            $app['sla_remaining_hours'] = round(($appTime - $now) / 3600, 1);
        }

        $app['workflow'] = $workflow;
        $app['documents'] = $documents;

        Response::json($app, 200, 'Lấy chi tiết hồ sơ thành công');
    }

    /**
     * Tiếp nhận hồ sơ mới
     */
    public function create(Request $request): void {
        $currentUser = Auth::requireAuth($request);
        $body = $request->getBody();

        $procedureId = (int)($body['procedure_id'] ?? 0);
        $citizenName = trim($body['citizen_name'] ?? '');
        $citizenIdNumber = trim($body['citizen_id_number'] ?? '');
        $citizenPhone = trim($body['citizen_phone'] ?? '');
        $citizenAddress = trim($body['citizen_address'] ?? '');
        $submitChannel = $body['submit_channel'] ?? 'TRUC_TIEP';
        $notes = trim($body['notes'] ?? '');
        $payload = !empty($body['dossier_payload']) ? json_encode($body['dossier_payload'], JSON_UNESCAPED_UNICODE) : null;

        if (empty($procedureId) || empty($citizenName) || empty($citizenIdNumber)) {
            Response::error('Vui lòng cung cấp đầy đủ thông tin: Thủ tục, Họ tên công dân, Số CCCD', 400);
        }

        $db = Database::getConnection();

        // Lấy số ngày xử lý của thủ tục để tính ngày hẹn trả kết quả
        $pStmt = $db->prepare('SELECT * FROM administrative_procedures WHERE id = ? AND is_active = 1');
        $pStmt->execute([$procedureId]);
        $proc = $pStmt->fetch();
        if (!$proc) {
            Response::error('Thủ tục hành chính không hợp lệ hoặc đã dừng tiếp nhận', 400);
        }

        $processingDays = (int)$proc['processing_days'];
        // Tính ngày hẹn trả kết quả (bỏ qua cuối tuần cơ bản)
        $appointmentDate = date('Y-m-d 16:30:00', strtotime("+$processingDays weekdays"));
        $dossierCode = DossierCodeGenerator::generateDossierCode();
        $feeAmount = (float)($proc['fee_amount'] ?? 0);
        $paymentStatus = ($feeAmount <= 0) ? 'MIEN_PHI' : 'CHUA_THANH_TOAN';

        $db->beginTransaction();
        try {
            $insert = $db->prepare('
                INSERT INTO applications (
                    dossier_code, procedure_id, citizen_name, citizen_id_number, 
                    citizen_phone, citizen_address, status, submit_channel, 
                    appointment_date, received_by_id, dossier_payload, notes,
                    payment_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $insert->execute([
                $dossierCode, $procedureId, $citizenName, $citizenIdNumber,
                $citizenPhone, $citizenAddress, 'CHO_TIEP_NHAN', $submitChannel,
                $appointmentDate, $currentUser['id'], $payload, $notes,
                $paymentStatus
            ]);

            // Lấy ID vừa tạo
            $idStmt = $db->prepare('SELECT id FROM applications WHERE dossier_code = ?');
            $idStmt->execute([$dossierCode]);
            $newId = $idStmt->fetchColumn();

            // Ghi lịch sử workflow
            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, ?, NULL, ?, ?, ?, ?)
            ');
            $wf->execute([
                $newId, $currentUser['id'], 'CHO_TIEP_NHAN', 'CHO_TIEP_NHAN', 'TIEP_NHAN',
                sprintf('Tiếp nhận hồ sơ qua kênh %s bởi cán bộ %s', $submitChannel === 'TRUC_TUYEN' ? 'Trực tuyến' : 'Trực tiếp tại Một cửa', $currentUser['full_name'])
            ]);

            // Tạo thông báo tự động (SMS Mock)
            if (!empty($citizenPhone)) {
                $notify = $db->prepare('
                    INSERT INTO notifications (recipient_phone, recipient_name, channel, subject, message, related_type, related_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ');
                $notify->execute([
                    $citizenPhone,
                    $citizenName,
                    'SMS',
                    'Tiếp nhận hồ sơ DVC',
                    sprintf('UBND Phường Yên Bái thông báo: Hồ sơ [%s] của Quý khách đã được tiếp nhận. Hẹn trả kết quả: %s.', $dossierCode, date('d/m/Y', strtotime($appointmentDate))),
                    'APPLICATION',
                    $newId
                ]);
            }

            AuditLogger::log('CREATE_APPLICATION', 'APPLICATION', $newId, null, [
                'dossier_code' => $dossierCode,
                'proc_name' => $proc['proc_name'],
                'citizen_name' => $citizenName
            ], $currentUser, $request);

            $db->commit();

            Response::json([
                'id' => $newId,
                'dossier_code' => $dossierCode,
                'appointment_date' => $appointmentDate
            ], 201, 'Tiếp nhận hồ sơ thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi khi tiếp nhận hồ sơ: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Phân công cán bộ thụ lý hồ sơ
     */
    public function assign(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'MOT_CUA', 'LANH_DAO']);
        $id = $params['id'] ?? '';
        $handlerId = trim($request->get('handler_id', ''));
        $comment = trim($request->get('comment', 'Phân công chuyên viên xử lý hồ sơ'));

        if (empty($handlerId)) {
            Response::error('Vui lòng chọn cán bộ thụ lý', 400);
        }

        $db = Database::getConnection();
        $app = $db->prepare('SELECT * FROM applications WHERE id = ?');
        $app->execute([$id]);
        $current = $app->fetch();
        if (!$current) {
            Response::error('Hồ sơ không tồn tại', 404);
        }

        $userStmt = $db->prepare('SELECT * FROM users WHERE id = ?');
        $userStmt->execute([$handlerId]);
        $handler = $userStmt->fetch();
        if (!$handler) {
            Response::error('Cán bộ được chọn không tồn tại', 400);
        }

        $db->beginTransaction();
        try {
            $update = $db->prepare('UPDATE applications SET current_handler_id = ?, status = ? WHERE id = ?');
            $update->execute([$handlerId, 'DANG_XU_LY', $id]);

            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $wf->execute([$id, $currentUser['id'], $handlerId, $current['status'], 'DANG_XU_LY', 'PHAN_CONG', $comment]);

            AuditLogger::log('ASSIGN_APPLICATION', 'APPLICATION', $id, ['handler_id' => $current['current_handler_id']], ['handler_id' => $handlerId], $currentUser, $request);

            $db->commit();
            Response::json(null, 200, 'Phân công cán bộ xử lý thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi phân công: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Chuyên viên thẩm định & ghi nhận kết quả xử lý
     */
    public function process(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'CHUYEN_VIEN']);
        $id = $params['id'] ?? '';
        $notes = trim($request->get('notes', ''));
        $comment = trim($request->get('comment', 'Cập nhật tiến độ thẩm định hồ sơ'));

        $db = Database::getConnection();
        $update = $db->prepare('UPDATE applications SET notes = ?, status = ? WHERE id = ?');
        $update->execute([$notes, 'DANG_XU_LY', $id]);

        $wf = $db->prepare('
            INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $wf->execute([$id, $currentUser['id'], $currentUser['id'], 'DANG_XU_LY', 'DANG_XU_LY', 'THAM_DINH', $comment]);

        AuditLogger::log('PROCESS_APPLICATION', 'APPLICATION', $id, null, ['notes' => $notes], $currentUser, $request);
        Response::json(null, 200, 'Cập nhật tiến độ thẩm định thành công');
    }

    /**
     * Trình ký Lãnh đạo phê duyệt
     */
    public function submitApproval(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'CHUYEN_VIEN']);
        $id = $params['id'] ?? '';
        $approverId = trim($request->get('approver_id', ''));
        $comment = trim($request->get('comment', 'Đã thẩm định hoàn tất, kính trình Lãnh đạo phê duyệt'));

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $update = $db->prepare('UPDATE applications SET status = ? WHERE id = ?');
            $update->execute(['CHO_KY_DUYET', $id]);

            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ');
            $wf->execute([$id, $currentUser['id'], $approverId ?: null, 'DANG_XU_LY', 'CHO_KY_DUYET', 'TRINH_KY', $comment]);

            AuditLogger::log('SUBMIT_APPROVAL', 'APPLICATION', $id, null, ['status' => 'CHO_KY_DUYET'], $currentUser, $request);

            $db->commit();
            Response::json(null, 200, 'Trình ký Lãnh đạo phê duyệt thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi trình ký: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Lãnh đạo Phê duyệt & Ký số (Mock Token / SIM PKI)
     */
    public function approve(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'LANH_DAO']);
        $id = $params['id'] ?? '';
        $comment = trim($request->get('comment', 'Đồng ý phê duyệt và ký số hồ sơ'));
        $pinCode = trim($request->get('pin_code', ''));

        // Giả lập kiểm tra mã PIN Token Ban Cơ yếu / SIM PKI
        $certSerial = $currentUser['certificate_serial'] ?: 'VGCA-TOKEN-DEFAULT-2026';
        $signatureMetadata = [
            'signer_name' => $currentUser['full_name'],
            'signer_role' => 'Lãnh đạo UBND Phường Yên Bái',
            'certificate_serial' => $certSerial,
            'timestamp' => date('Y-m-d H:i:s'),
            'algorithm' => 'SHA256withRSA',
            'status' => 'VALID_SIGNATURE'
        ];

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $update = $db->prepare('UPDATE applications SET status = ? WHERE id = ?');
            $update->execute(['DA_KY_SO', $id]);

            // Thêm tài liệu kết quả đã ký số vào bảng application_documents
            $doc = $db->prepare('
                INSERT INTO application_documents (
                    application_id, document_name, file_path, mime_type, 
                    doc_type, is_signed, signature_data, uploaded_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $doc->execute([
                $id,
                'Bản kết quả giải quyết TTHC (Đã ký số điện tử).pdf',
                '/uploads/signatures/' . $id . '_signed.pdf',
                'application/pdf',
                'KET_QUA',
                1,
                json_encode($signatureMetadata, JSON_UNESCAPED_UNICODE),
                $currentUser['id']
            ]);

            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, ?, NULL, ?, ?, ?, ?)
            ');
            $wf->execute([$id, $currentUser['id'], 'CHO_KY_DUYET', 'DA_KY_SO', 'KY_SO', $comment]);

            AuditLogger::log('APPROVE_SIGN', 'APPLICATION', $id, null, ['signature' => $signatureMetadata], $currentUser, $request);

            $db->commit();
            Response::json(['signature' => $signatureMetadata], 200, 'Phê duyệt và ký số điện tử thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi phê duyệt ký số: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Hoàn thành hồ sơ & Trả kết quả (Bộ phận Một cửa / Văn thư)
     */
    public function complete(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'MOT_CUA', 'VAN_THU']);
        $id = $params['id'] ?? '';
        $comment = trim($request->get('comment', 'Đã thu lệ phí và trả kết quả cho công dân'));

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $update = $db->prepare('UPDATE applications SET status = ?, completed_date = NOW() WHERE id = ?');
            $update->execute(['HOAN_THANH', $id]);

            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, ?, NULL, ?, ?, ?, ?)
            ');
            $wf->execute([$id, $currentUser['id'], 'DA_KY_SO', 'HOAN_THANH', 'HOAN_THANH', $comment]);

            // Gửi thông báo hoàn thành
            $appStmt = $db->prepare('SELECT * FROM applications WHERE id = ?');
            $appStmt->execute([$id]);
            $app = $appStmt->fetch();

            if (!empty($app['citizen_phone'])) {
                $notify = $db->prepare('
                    INSERT INTO notifications (recipient_phone, recipient_name, channel, subject, message, related_type, related_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ');
                $notify->execute([
                    $app['citizen_phone'],
                    $app['citizen_name'],
                    'SMS',
                    'Trả kết quả TTHC',
                    sprintf('UBND Phường Yên Bái thông báo: Hồ sơ [%s] đã hoàn thành. Quý khách vui lòng đến Bộ phận Một cửa nhận kết quả hoặc tải bản điện tử.', $app['dossier_code']),
                    'APPLICATION',
                    $id
                ]);
            }

            AuditLogger::log('COMPLETE_APPLICATION', 'APPLICATION', $id, null, ['status' => 'HOAN_THANH'], $currentUser, $request);

            $db->commit();
            Response::json(null, 200, 'Hoàn thành hồ sơ và trả kết quả thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi hoàn thành hồ sơ: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Trả lại hồ sơ / Yêu cầu bổ sung
     */
    public function reject(Request $request, array $params): void {
        $currentUser = Auth::requireAuth($request);
        $id = $params['id'] ?? '';
        $reason = trim($request->get('reason', ''));

        if (empty($reason)) {
            Response::error('Vui lòng nêu rõ lý do trả lại hoặc từ chối hồ sơ', 400);
        }

        $db = Database::getConnection();
        $db->beginTransaction();
        try {
            $update = $db->prepare('UPDATE applications SET status = ?, rejection_reason = ? WHERE id = ?');
            $update->execute(['TRA_LAI', $reason, $id]);

            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, ?, NULL, ?, ?, ?, ?)
            ');
            $wf->execute([$id, $currentUser['id'], 'DANG_XU_LY', 'TRA_LAI', 'TRA_LAI', 'Trả lại hồ sơ: ' . $reason]);

            AuditLogger::log('REJECT_APPLICATION', 'APPLICATION', $id, null, ['reason' => $reason], $currentUser, $request);

            $db->commit();
            Response::json(null, 200, 'Trả lại hồ sơ thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi trả lại hồ sơ: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Xác nhận thu phí/lệ phí TTHC (Tiền mặt hoặc Chuyển khoản VietQR)
     */
    public function confirmPayment(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'MOT_CUA', 'LANH_DAO', 'VAN_THU']);
        $id = $params['id'] ?? '';
        $paymentMethod = $request->get('payment_method', 'TIEN_MAT');
        $receiptNumber = trim($request->get('receipt_number', ''));

        if (!in_array($paymentMethod, ['TIEN_MAT', 'CHUYEN_KHOAN_QR'])) {
            $paymentMethod = 'TIEN_MAT';
        }

        if (empty($receiptNumber)) {
            $receiptNumber = sprintf('BL-YB-%s-%04d', date('ymd'), rand(100, 9999));
        }

        $db = Database::getConnection();
        $appStmt = $db->prepare('SELECT a.*, p.fee_amount FROM applications a JOIN administrative_procedures p ON a.procedure_id = p.id WHERE a.id = ?');
        $appStmt->execute([$id]);
        $app = $appStmt->fetch();

        if (!$app) {
            Response::error('Hồ sơ không tồn tại', 404);
        }

        $db->beginTransaction();
        try {
            $update = $db->prepare('
                UPDATE applications 
                SET payment_status = "DA_THANH_TOAN", payment_method = ?, receipt_number = ?, paid_at = NOW() 
                WHERE id = ?
            ');
            $update->execute([$paymentMethod, $receiptNumber, $id]);

            $methodName = $paymentMethod === 'CHUYEN_KHOAN_QR' ? 'Chuyển khoản VietQR (MB Bank 0869162534)' : 'Tiền mặt tại Bộ phận Một cửa';
            $feeFormatted = number_format((float)$app['fee_amount'], 0, ',', '.') . ' VNĐ';

            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, ?, NULL, ?, ?, ?, ?)
            ');
            $wf->execute([
                $id, $currentUser['id'], $app['status'], $app['status'], 'THU_PHI',
                sprintf('Xác nhận thu lệ phí %s (%s). Số biên lai điện tử: %s', $feeFormatted, $methodName, $receiptNumber)
            ]);

            AuditLogger::log('CONFIRM_PAYMENT', 'APPLICATION', $id, null, [
                'payment_method' => $paymentMethod,
                'receipt_number' => $receiptNumber,
                'amount' => $app['fee_amount']
            ], $currentUser, $request);

            $db->commit();
            Response::json([
                'payment_status' => 'DA_THANH_TOAN',
                'payment_method' => $paymentMethod,
                'receipt_number' => $receiptNumber,
                'paid_at' => date('Y-m-d H:i:s')
            ], 200, 'Xác nhận thu lệ phí thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi khi ghi nhận thu phí: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Gửi đánh giá mức độ hài lòng của công dân (CSAT - Public API)
     */
    public function submitFeedback(Request $request, array $params): void {
        $id = $params['id'] ?? '';
        $score = max(1, min(5, (int)$request->get('satisfaction_score', 5)));
        $comment = trim($request->get('satisfaction_comment', ''));

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, dossier_code, status, satisfaction_score FROM applications WHERE id = ?');
        $stmt->execute([$id]);
        $app = $stmt->fetch();

        if (!$app) {
            Response::error('Hồ sơ không tồn tại', 404);
        }

        if ($app['status'] !== 'HOAN_THANH') {
            Response::error('Chỉ được đánh giá sau khi hồ sơ đã có kết quả hoàn thành', 400);
        }

        $db->beginTransaction();
        try {
            $update = $db->prepare('
                UPDATE applications 
                SET satisfaction_score = ?, satisfaction_comment = ?, satisfaction_date = NOW() 
                WHERE id = ?
            ');
            $update->execute([$score, $comment, $id]);

            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, NULL, NULL, ?, ?, ?, ?)
            ');
            $wf->execute([
                $id, 'HOAN_THANH', 'HOAN_THANH', 'DANH_GIA',
                sprintf('Công dân gửi đánh giá mức độ hài lòng: %d/5 sao. Ý kiến: "%s"', $score, $comment ?: 'Rất hài lòng với dịch vụ')
            ]);

            $db->commit();
            Response::json(null, 200, 'Cảm ơn Quý công dân đã gửi đánh giá chất lượng phục vụ!');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi ghi nhận đánh giá: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Tra cứu tiến độ hồ sơ cho người dân (Public API - Không cần token)
     */
    public function track(Request $request): void {
        $code = trim($request->getQuery('code', ''));
        if (empty($code)) {
            Response::error('Vui lòng nhập Mã hồ sơ hoặc Số CCCD để tra cứu', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT 
                a.id, a.dossier_code, a.citizen_name, a.status, a.submit_date, 
                a.appointment_date, a.completed_date, a.rejection_reason,
                a.payment_status, a.payment_method, a.receipt_number, a.paid_at,
                a.satisfaction_score, a.satisfaction_comment, a.satisfaction_date,
                p.proc_name, p.field_type, p.fee_amount
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            WHERE a.dossier_code = ? OR a.citizen_id_number = ?
            ORDER BY a.submit_date DESC
        ');
        $stmt->execute([$code, $code]);
        $apps = $stmt->fetchAll();

        if (empty($apps)) {
            Response::error('Không tìm thấy thông tin hồ sơ phù hợp trên hệ thống', 404);
        }

        $now = time();
        // Lấy timeline quy trình cho hồ sơ
        foreach ($apps as &$app) {
            $appTime = strtotime($app['appointment_date']);
            if (in_array($app['status'], ['HOAN_THANH', 'TU_CHOI'])) {
                $app['sla_status'] = 'COMPLETED';
            } elseif ($now > $appTime) {
                $app['sla_status'] = 'OVERDUE';
            } elseif ($appTime - $now <= 86400) {
                $app['sla_status'] = 'WARNING';
            } else {
                $app['sla_status'] = 'NORMAL';
            }

            $wfStmt = $db->prepare('
                SELECT action, from_status, to_status, comment, created_at
                FROM application_workflow
                WHERE application_id = ?
                ORDER BY created_at ASC
            ');
            $wfStmt->execute([$app['id']]);
            $app['workflow'] = $wfStmt->fetchAll();
        }

        Response::json($apps, 200, 'Tra cứu tiến độ hồ sơ thành công');
    }
}
