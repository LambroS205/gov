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

        // Xử lý biên lai điện tử nếu đã thu phí
        if ($app['payment_status'] === 'DA_THANH_TOAN' && !empty($app['receipt_number'])) {
            $receiptDir = dirname(dirname(__DIR__)) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'receipts';
            if (!is_dir($receiptDir)) {
                mkdir($receiptDir, 0777, true);
            }
            $receiptFile = $receiptDir . DIRECTORY_SEPARATOR . $app['receipt_number'] . '.html';
            if (!file_exists($receiptFile)) {
                $rHtml = self::generateReceiptHtml($app, $app['receipt_number'], $app['payment_method'] === 'CHUYEN_KHOAN_QR' ? 'Chuyển khoản VietQR' : 'Tiền mặt', $app['receiver_name'] ?? 'Bộ phận Một cửa', $app['paid_at'] ?? date('Y-m-d H:i:s'));
                file_put_contents($receiptFile, $rHtml);
            }
            $app['receipt_url'] = '/uploads/receipts/' . $app['receipt_number'] . '.html';
        }

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
     * Nộp hồ sơ DVC trực tuyến (Công dân nộp công khai - Không cần tài khoản cán bộ)
     */
    public function createPublic(Request $request): void {
        $body = $request->getBody();

        $procedureId = (int)($body['procedure_id'] ?? 0);
        $citizenName = trim($body['citizen_name'] ?? '');
        $citizenIdNumber = trim($body['citizen_id_number'] ?? '');
        $citizenPhone = trim($body['citizen_phone'] ?? '');
        $citizenAddress = trim($body['citizen_address'] ?? '');
        $notes = trim($body['notes'] ?? '');
        $payload = !empty($body['dossier_payload']) ? json_encode($body['dossier_payload'], JSON_UNESCAPED_UNICODE) : null;
        $attachedFiles = $body['documents'] ?? [];

        if (empty($procedureId) || empty($citizenName) || empty($citizenIdNumber) || empty($citizenPhone)) {
            Response::error('Vui lòng cung cấp đầy đủ: Thủ tục, Họ và tên, Số CCCD và Số điện thoại', 400);
        }

        $db = Database::getConnection();

        $pStmt = $db->prepare('SELECT * FROM administrative_procedures WHERE id = ? AND is_active = 1');
        $pStmt->execute([$procedureId]);
        $proc = $pStmt->fetch();
        if (!$proc) {
            Response::error('Thủ tục hành chính không hợp lệ hoặc đã tạm dừng tiếp nhận', 400);
        }

        $processingDays = (int)$proc['processing_days'];
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
            ');
            $insert->execute([
                $dossierCode, $procedureId, $citizenName, $citizenIdNumber,
                $citizenPhone, $citizenAddress, 'CHO_TIEP_NHAN', 'TRUC_TUYEN',
                $appointmentDate, $payload, $notes, $paymentStatus
            ]);

            $idStmt = $db->prepare('SELECT id FROM applications WHERE dossier_code = ?');
            $idStmt->execute([$dossierCode]);
            $newId = $idStmt->fetchColumn();

            // Lưu các tài liệu đính kèm trực tuyến
            if (is_array($attachedFiles) && !empty($attachedFiles)) {
                $docStmt = $db->prepare('
                    INSERT INTO application_documents (
                        application_id, document_name, file_path, file_size, mime_type, doc_type, uploaded_by
                    ) VALUES (?, ?, ?, ?, ?, ?, NULL)
                ');
                foreach ($attachedFiles as $file) {
                    $docName = $file['document_name'] ?? 'Tài liệu nộp trực tuyến';
                    $filePath = $file['file_path'] ?? '';
                    $fileSize = (int)($file['file_size'] ?? 0);
                    $mimeType = $file['mime_type'] ?? 'application/octet-stream';
                    if (!empty($filePath)) {
                        $docStmt->execute([$newId, $docName, $filePath, $fileSize, $mimeType, 'HO_SO_GOC']);
                    }
                }
            }

            // Ghi lịch sử workflow
            $wf = $db->prepare('
                INSERT INTO application_workflow (application_id, from_user_id, to_user_id, from_status, to_status, action, comment)
                VALUES (?, NULL, NULL, ?, ?, ?, ?)
            ');
            $wf->execute([
                $newId, 'CHO_TIEP_NHAN', 'CHO_TIEP_NHAN', 'NOP_TRUC_TUYEN',
                'Công dân nộp hồ sơ trực tuyến qua Cổng Dịch vụ công điện tử'
            ]);

            // Gửi tin nhắn SMS/Zalo tự động
            if (!empty($citizenPhone)) {
                $notify = $db->prepare('
                    INSERT INTO notifications (recipient_phone, recipient_name, channel, subject, message, related_type, related_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ');
                $notify->execute([
                    $citizenPhone,
                    $citizenName,
                    'SMS',
                    'Đăng ký DVC trực tuyến',
                    sprintf('UBND Phường Yên Bái thông báo: Đã nhận hồ sơ [%s] - %s. Hẹn trả: %s.', $dossierCode, $proc['proc_name'], date('d/m/Y', strtotime($appointmentDate))),
                    'APPLICATION',
                    $newId
                ]);
            }

            AuditLogger::log('CREATE_PUBLIC_APPLICATION', 'APPLICATION', $newId, null, [
                'dossier_code' => $dossierCode,
                'proc_name' => $proc['proc_name'],
                'citizen_name' => $citizenName
            ]);

            $db->commit();

            Response::json([
                'id' => $newId,
                'dossier_code' => $dossierCode,
                'proc_name' => $proc['proc_name'],
                'fee_amount' => $feeAmount,
                'appointment_date' => $appointmentDate
            ], 201, 'Nộp hồ sơ trực tuyến thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi khi nộp hồ sơ trực tuyến: ' . $e->getMessage(), 500);
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
        // Lấy thông tin chi tiết hồ sơ và thủ tục để sinh văn bản ký số
        $appStmt = $db->prepare('
            SELECT a.*, p.proc_name, p.proc_code, p.field_type
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            WHERE a.id = ?
        ');
        $appStmt->execute([$id]);
        $app = $appStmt->fetch();

        if (!$app) {
            Response::error('Hồ sơ không tồn tại', 404);
        }

        $db->beginTransaction();
        try {
            $update = $db->prepare('UPDATE applications SET status = ? WHERE id = ?');
            $update->execute(['DA_KY_SO', $id]);

            // Sinh tệp văn bản kết quả ký số điện tử thực tế
            $uploadDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'signatures';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileName = $id . '_signed.html';
            $filePath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;
            $relativeUrl = '/uploads/signatures/' . $fileName;
            file_put_contents($filePath, $this->generateSignedCertificateHtml($app, $signatureMetadata));

            // Thêm tài liệu kết quả đã ký số vào bảng application_documents
            $doc = $db->prepare('
                INSERT INTO application_documents (
                    application_id, document_name, file_path, mime_type, 
                    doc_type, is_signed, signature_data, uploaded_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $doc->execute([
                $id,
                'Bản kết quả giải quyết TTHC (Đã ký số điện tử).html',
                $relativeUrl,
                'text/html',
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
            Response::json(['signature' => $signatureMetadata, 'file_path' => $relativeUrl], 200, 'Phê duyệt và ký số điện tử thành công');
        } catch (Throwable $e) {
            $db->rollBack();
            Response::error('Lỗi phê duyệt ký số: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Sinh văn bản kết quả giải quyết TTHC điện tử có chữ ký số
     */
    private function generateSignedCertificateHtml(array $app, array $sig): string {
        $citizenName = htmlspecialchars($app['citizen_name']);
        $cccd = htmlspecialchars($app['citizen_id_number']);
        $phone = htmlspecialchars($app['citizen_phone'] ?? '---');
        $address = htmlspecialchars($app['citizen_address'] ?? 'Phường Yên Bái, Tỉnh Yên Bái');
        $procName = htmlspecialchars($app['proc_name']);
        $dossierCode = htmlspecialchars($app['dossier_code']);
        $signerName = htmlspecialchars($sig['signer_name']);
        $signerRole = htmlspecialchars($sig['signer_role']);
        $certSerial = htmlspecialchars($sig['certificate_serial']);
        $sigTime = htmlspecialchars($sig['timestamp']);
        $currentDate = date('d/m/Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>KẾT QUẢ GIẢI QUYẾT TTHC - {$dossierCode}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      margin: 0;
      padding: 30px 20px;
      background: #f1f5f9;
      color: #0f172a;
    }
    .sheet {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px 56px;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
      border: 1px solid #cbd5e1;
      position: relative;
    }
    .header-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
      line-height: 1.4;
    }
    .header-left {
      text-align: center;
      width: 45%;
      font-size: 13pt;
    }
    .header-left strong {
      display: block;
      color: #7f1d1d;
    }
    .header-right {
      text-align: center;
      width: 52%;
      font-size: 13pt;
    }
    .header-right strong {
      display: block;
      letter-spacing: 0.5px;
    }
    .national-motto {
      font-weight: bold;
      border-bottom: 1.5px solid #0f172a;
      display: inline-block;
      padding-bottom: 2px;
      margin-top: 2px;
    }
    .doc-title {
      text-align: center;
      margin: 32px 0 6px 0;
      font-size: 17pt;
      font-weight: bold;
      color: #b91c1c;
      text-transform: uppercase;
    }
    .doc-sub {
      text-align: center;
      font-size: 12pt;
      font-style: italic;
      color: #475569;
      margin-bottom: 28px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0 32px 0;
      font-size: 13pt;
    }
    .info-table td {
      padding: 9px 12px;
      border-bottom: 1px dashed #e2e8f0;
      vertical-align: top;
    }
    .info-table td.lbl {
      font-weight: bold;
      width: 32%;
      color: #334155;
    }
    .decision-text {
      font-size: 13pt;
      line-height: 1.6;
      margin: 16px 0 28px 0;
      text-align: justify;
      background: #fafafa;
      padding: 16px;
      border-left: 4px solid #b91c1c;
      border-radius: 0 6px 6px 0;
    }
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
    }
    .qr-box {
      border: 1px dashed #94a3b8;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
      text-align: center;
      font-size: 10pt;
      color: #64748b;
      width: 180px;
    }
    .sig-seal {
      width: 330px;
      border: 2px solid #16a34a;
      border-radius: 8px;
      background: #f0fdf4;
      padding: 14px 18px;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
    }
    .sig-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #15803d;
      font-weight: bold;
      font-size: 13pt;
      border-bottom: 1px solid #bbf7d0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .sig-row {
      font-size: 10.5pt;
      color: #166534;
      line-height: 1.45;
    }
    .print-actions {
      text-align: center;
      margin-bottom: 20px;
    }
    .print-btn {
      background: #b91c1c;
      color: #ffffff;
      border: none;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(185,28,28,0.3);
    }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { box-shadow: none; border: none; padding: 0; }
      .print-actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="print-btn" onclick="window.print()">🖨️ In văn bản kết quả / Lưu thành PDF</button>
  </div>
  <div class="sheet">
    <div class="header-grid">
      <div class="header-left">
        <strong>ỦY BAN NHÂN DÂN<br>PHƯỜNG YÊN BÁI</strong>
        <div style="font-size: 11pt; color: #64748b; margin-top: 4px;">Số: {$dossierCode}/KQTTHC</div>
      </div>
      <div class="header-right">
        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
        <div class="national-motto">Độc lập - Tự do - Hạnh phúc</div>
        <div style="font-size: 11pt; font-style: italic; margin-top: 6px;">Yên Bái, ngày {$currentDate}</div>
      </div>
    </div>

    <div class="doc-title">BẢN KẾT QUẢ GIẢI QUYẾT THỦ TỤC HÀNH CHÍNH</div>
    <div class="doc-sub">(Văn bản điện tử ký số hợp lệ theo Nghị định 30/2020/NĐ-CP và Quyết định 766/QĐ-TTg)</div>

    <div class="decision-text">
      Căn cứ quy định của pháp luật hiện hành và kết quả thẩm định của Bộ phận chuyên môn UBND Phường Yên Bái đối với hồ sơ thủ tục hành chính mã số <strong>{$dossierCode}</strong>;
      <br>
      Ủy ban Nhân dân Phường Yên Bái trân trọng thông báo kết quả giải quyết như sau:
    </div>

    <table class="info-table">
      <tr>
        <td class="lbl">Tên thủ tục hành chính:</td>
        <td><strong style="color: #7f1d1d;">{$procName}</strong></td>
      </tr>
      <tr>
        <td class="lbl">Họ và tên người yêu cầu:</td>
        <td><strong>{$citizenName}</strong></td>
      </tr>
      <tr>
        <td class="lbl">Số Căn cước công dân:</td>
        <td>{$cccd}</td>
      </tr>
      <tr>
        <td class="lbl">Số điện thoại liên hệ:</td>
        <td>{$phone}</td>
      </tr>
      <tr>
        <td class="lbl">Địa chỉ thường trú:</td>
        <td>{$address}</td>
      </tr>
      <tr>
        <td class="lbl">Mã hồ sơ hệ thống:</td>
        <td><code>{$dossierCode}</code></td>
      </tr>
      <tr>
        <td class="lbl">Tình trạng thẩm định:</td>
        <td><strong style="color: #15803d;">ĐỦ ĐIỀU KIỆN - ĐÃ PHÊ DUYỆT HOÀN TẤT</strong></td>
      </tr>
    </table>

    <div class="footer-section">
      <div class="qr-box">
        <div style="font-weight: bold; margin-bottom: 4px; color: #334155;">TRA CỨU XÁC THỰC</div>
        <div>Mã hồ sơ: <strong>{$dossierCode}</strong></div>
        <div style="font-size: 9pt; margin-top: 4px;">Cổng Dịch vụ công điện tử UBND Phường Yên Bái</div>
      </div>

      <div class="sig-seal">
        <div class="sig-badge">
          <span>✓</span>
          <span>ĐÃ KÝ SỐ ĐIỆN TỬ</span>
        </div>
        <div class="sig-row"><strong>Người ký:</strong> {$signerName}</div>
        <div class="sig-row"><strong>Chức vụ:</strong> {$signerRole}</div>
        <div class="sig-row"><strong>Cơ quan:</strong> UBND Phường Yên Bái</div>
        <div class="sig-row"><strong>Thời gian:</strong> {$sigTime}</div>
        <div class="sig-row"><strong>Chứng thư số:</strong> <code>{$certSerial}</code></div>
        <div class="sig-row"><strong>Thuật toán:</strong> SHA256withRSA (Ban Cơ yếu CP)</div>
      </div>
    </div>
  </div>
</body>
</html>
HTML;
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

            // Tự động sinh file Biên lai điện tử định dạng HTML
            $receiptDir = dirname(dirname(__DIR__)) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'receipts';
            if (!is_dir($receiptDir)) {
                mkdir($receiptDir, 0777, true);
            }
            $paidAt = date('Y-m-d H:i:s');
            $receiptHtml = self::generateReceiptHtml($app, $receiptNumber, $methodName, $currentUser['full_name'], $paidAt);
            file_put_contents($receiptDir . DIRECTORY_SEPARATOR . $receiptNumber . '.html', $receiptHtml);
            $receiptUrl = '/uploads/receipts/' . $receiptNumber . '.html';

            $db->commit();
            Response::json([
                'payment_status' => 'DA_THANH_TOAN',
                'payment_method' => $paymentMethod,
                'receipt_number' => $receiptNumber,
                'receipt_url' => $receiptUrl,
                'paid_at' => $paidAt
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

            // Lấy danh sách tài liệu kết quả/đính kèm công khai cho người dân
            $docStmt = $db->prepare('
                SELECT id, document_name, file_path, doc_type, is_signed, uploaded_at
                FROM application_documents
                WHERE application_id = ?
                ORDER BY uploaded_at ASC
            ');
            $docStmt->execute([$app['id']]);
            $app['documents'] = $docStmt->fetchAll();

            // Nếu hồ sơ đã thanh toán và có số biên lai, trả về receipt_url
            if ($app['payment_status'] === 'DA_THANH_TOAN' && !empty($app['receipt_number'])) {
                $receiptDir = dirname(dirname(__DIR__)) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'receipts';
                if (!is_dir($receiptDir)) {
                    mkdir($receiptDir, 0777, true);
                }
                $receiptFile = $receiptDir . DIRECTORY_SEPARATOR . $app['receipt_number'] . '.html';
                if (!file_exists($receiptFile)) {
                    $rHtml = self::generateReceiptHtml($app, $app['receipt_number'], $app['payment_method'] === 'CHUYEN_KHOAN_QR' ? 'Chuyển khoản VietQR' : 'Tiền mặt', 'Bộ phận Một cửa', $app['paid_at'] ?? date('Y-m-d H:i:s'));
                    file_put_contents($receiptFile, $rHtml);
                }
                $app['receipt_url'] = '/uploads/receipts/' . $app['receipt_number'] . '.html';
            }
        }

        Response::json($apps, 200, 'Tra cứu tiến độ hồ sơ thành công');
    }

    /**
     * Tạo mẫu Biên lai điện tử HTML chuẩn Bộ Tài chính & UBND Phường Yên Bái
     */
    private static function generateReceiptHtml(array $app, string $receiptNumber, string $paymentMethod, string $collectorName, string $paidAt): string {
        $citizenName = htmlspecialchars($app['citizen_name'] ?? 'Công dân');
        $citizenId = htmlspecialchars($app['citizen_id_number'] ?? 'Chưa cập nhật');
        $citizenPhone = htmlspecialchars($app['citizen_phone'] ?? 'Chưa cập nhật');
        $citizenAddress = htmlspecialchars($app['citizen_address'] ?? 'Thành phố Yên Bái, Tỉnh Yên Bái');
        $procName = htmlspecialchars($app['proc_name'] ?? 'Thủ tục hành chính cấp Phường');
        $dossierCode = htmlspecialchars($app['dossier_code'] ?? 'MC-2026-0000');
        $fee = (float)($app['fee_amount'] ?? 0);
        $feeFormatted = number_format($fee, 0, ',', '.') . ' VNĐ';

        // Đọc số tiền thành chữ
        $amountInWords = self::formatMoneyToWords($fee);
        $paidTime = date('d/m/Y H:i:s', strtotime($paidAt));
        $dateParts = explode('/', date('d/m/Y', strtotime($paidAt)));
        $day = $dateParts[0] ?? date('d');
        $month = $dateParts[1] ?? date('m');
        $year = $dateParts[2] ?? date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Biên lai điện tử {$receiptNumber} - UBND Phường Yên Bái</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      background: #f1f5f9;
      color: #0f172a;
      padding: 24px;
      line-height: 1.4;
    }
    .print-actions {
      text-align: center;
      margin-bottom: 20px;
    }
    .btn-print {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
    }
    .receipt-box {
      max-width: 820px;
      margin: 0 auto;
      background: #fff;
      border: 2px solid #b91c1c;
      padding: 28px 36px;
      position: relative;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
    }
    .receipt-box::before {
      content: '';
      position: absolute;
      top: 4px; left: 4px; right: 4px; bottom: 4px;
      border: 1px dashed #ef4444;
      pointer-events: none;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-left {
      width: 50%;
      text-align: center;
      vertical-align: top;
      font-size: 11pt;
    }
    .header-right {
      width: 50%;
      text-align: center;
      vertical-align: top;
      font-size: 11pt;
    }
    .national-title {
      font-weight: bold;
      font-size: 11.5pt;
    }
    .national-sub {
      font-weight: bold;
      border-bottom: 1px solid #000;
      display: inline-block;
      padding-bottom: 2px;
      margin-bottom: 6px;
    }
    .receipt-title {
      text-align: center;
      margin: 16px 0 6px 0;
      color: #b91c1c;
      font-size: 18pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .receipt-sub {
      text-align: center;
      font-style: italic;
      font-size: 10.5pt;
      color: #475569;
      margin-bottom: 16px;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 10.5pt;
      padding: 0 4px;
    }
    .info-list {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11pt;
    }
    .info-list td {
      padding: 5px 4px;
      vertical-align: top;
    }
    .info-label {
      width: 220px;
      color: #334155;
    }
    .fee-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 11pt;
    }
    .fee-table th, .fee-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    .fee-table th {
      background: #f8fafc;
      text-align: center;
      font-weight: bold;
    }
    .total-row td {
      font-weight: bold;
      background: #fffbeb;
      border-top: 2px solid #b91c1c;
    }
    .signature-grid {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 24px;
      padding: 0 10px;
    }
    .payer-sign {
      width: 45%;
      text-align: center;
      font-size: 11pt;
    }
    .collector-sign {
      width: 45%;
      text-align: center;
      font-size: 11pt;
      position: relative;
    }
    .stamp-box {
      margin-top: 10px;
      display: inline-block;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 10px 16px;
      background: #fef2f2;
      color: #991b1b;
      box-shadow: 0 3px 10px rgba(220, 38, 38, 0.15);
      text-align: left;
      font-size: 9.5pt;
      line-height: 1.4;
    }
    .stamp-title {
      font-weight: bold;
      font-size: 11pt;
      color: #dc2626;
      border-bottom: 1px dashed #fca5a5;
      padding-bottom: 4px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .qr-badge {
      font-family: monospace;
      font-size: 9pt;
      background: #f1f5f9;
      padding: 4px 8px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 6px;
      color: #0f172a;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .print-actions { display: none; }
      .receipt-box { border: 2px solid #000; box-shadow: none; margin: 0; max-width: 100%; }
      .receipt-box::before { border-color: #000; }
    }
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="btn-print" onclick="window.print()">🖨️ In Biên lai điện tử / Lưu thành file PDF</button>
  </div>

  <div class="receipt-box">
    <table class="header-table">
      <tr>
        <td class="header-left">
          <strong>ỦY BAN NHÂN DÂN PHƯỜNG ĐỒNG TÂM</strong><br>
          <span style="font-size: 10pt; color: #475569;">BỘ PHẬN TIẾP NHẬN & TRẢ KẾT QUẢ MỘT CỬA</span><br>
          <span style="font-size: 9.5pt;">Mã số thuế: <strong>5200189922</strong></span>
        </td>
        <td class="header-right">
          <div class="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div class="national-sub">Độc lập - Tự do - Hạnh phúc</div><br>
          <span style="font-style: italic; font-size: 10pt;">Yên Bái, ngày {$day} tháng {$month} năm {$year}</span>
        </td>
      </tr>
    </table>

    <div class="receipt-title">BIÊN LAI THU TIỀN PHÍ, LỆ PHÍ</div>
    <div class="receipt-sub">(Bản thể hiện của biên lai điện tử theo Thông tư 78/2021/TT-BTC)</div>

    <div class="meta-grid">
      <div>Mẫu số: <strong>01BLP0/001</strong> | Ký hiệu: <strong>YB/26E</strong></div>
      <div>Số biên lai: <strong style="color: #b91c1c; font-size: 12pt;">{$receiptNumber}</strong></div>
    </div>

    <table class="info-list">
      <tr>
        <td class="info-label">Họ tên người nộp tiền:</td>
        <td><strong>{$citizenName}</strong></td>
      </tr>
      <tr>
        <td class="info-label">Số CCCD / Mã định danh:</td>
        <td><strong>{$citizenId}</strong></td>
      </tr>
      <tr>
        <td class="info-label">Số điện thoại liên hệ:</td>
        <td>{$citizenPhone}</td>
      </tr>
      <tr>
        <td class="info-label">Địa chỉ người nộp:</td>
        <td>{$citizenAddress}</td>
      </tr>
      <tr>
        <td class="info-label">Hình thức thanh toán:</td>
        <td><strong style="color: #0369a1;">{$paymentMethod}</strong></td>
      </tr>
    </table>

    <table class="fee-table">
      <thead>
        <tr>
          <th style="width: 45px;">STT</th>
          <th>Tên loại phí, lệ phí thực hiện</th>
          <th style="width: 80px; text-align: center;">ĐVT</th>
          <th style="width: 70px; text-align: center;">Số lượng</th>
          <th style="width: 140px; text-align: right;">Đơn giá</th>
          <th style="width: 140px; text-align: right;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td>
            <strong>{$procName}</strong><br>
            <span style="font-size: 9.5pt; color: #64748b;">Mã hồ sơ tiếp nhận: <code>{$dossierCode}</code></span>
          </td>
          <td style="text-align: center;">Hồ sơ</td>
          <td style="text-align: center;">01</td>
          <td style="text-align: right;">{$feeFormatted}</td>
          <td style="text-align: right; font-weight: bold; color: #b91c1c;">{$feeFormatted}</td>
        </tr>
        <tr class="total-row">
          <td colspan="5" style="text-align: right;">TỔNG CỘNG TIỀN THU:</td>
          <td style="text-align: right; color: #b91c1c; font-size: 12pt;">{$feeFormatted}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin: 10px 0; font-size: 11pt;">
      Số tiền viết bằng chữ: <strong style="font-style: italic; color: #1e3a8a;">{$amountInWords}</strong>
    </div>

    <div class="signature-grid">
      <div class="payer-sign">
        <strong>NGƯỜI NỘP TIỀN</strong><br>
        <span style="font-size: 9.5pt; font-style: italic; color: #64748b;">(Ký và ghi rõ họ tên)</span>
        <div style="height: 60px;"></div>
        <div>{$citizenName}</div>
      </div>

      <div class="collector-sign">
        <strong>NGƯỜI THU TIỀN</strong><br>
        <span style="font-size: 9.5pt; font-style: italic; color: #64748b;">(Chữ ký số điện tử của cơ quan thu)</span>
        
        <div class="stamp-box">
          <div class="stamp-title">
            <span>✓</span> ĐÃ THU TIỀN ĐIỆN TỬ
          </div>
          <div><strong>Cơ quan:</strong> UBND Phường Đồng Tâm</div>
          <div><strong>Cán bộ thu:</strong> {$collectorName}</div>
          <div><strong>Thời gian thu:</strong> {$paidTime}</div>
          <div><strong>Mã tra cứu BL:</strong> <code>{$receiptNumber}</code></div>
          <div class="qr-badge">TRA CỨU: https://dvc.yenbai.gov.vn/bienlai/{$receiptNumber}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
HTML;
    }

    /**
     * Helper đổi số tiền thành chữ Tiếng Việt
     */
    private static function formatMoneyToWords(float $amount): string {
        if ($amount <= 0) return 'Không đồng';
        if ($amount == 15000) return 'Mười lăm nghìn đồng chẵn';
        if ($amount == 20000) return 'Hai mươi nghìn đồng chẵn';
        if ($amount == 30000) return 'Ba mươi nghìn đồng chẵn';
        if ($amount == 50000) return 'Năm mươi nghìn đồng chẵn';
        if ($amount == 100000) return 'Một trăm nghìn đồng chẵn';
        if ($amount == 150000) return 'Một trăm năm mươi nghìn đồng chẵn';
        if ($amount == 200000) return 'Hai trăm nghìn đồng chẵn';
        
        return number_format($amount, 0, ',', '.') . ' đồng chẵn';
    }
}
