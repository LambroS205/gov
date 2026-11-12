<?php
require_once dirname(__DIR__) . '/api/core/Database.php';
$db = Database::getConnection();

$stmt = $db->query("
    SELECT dossier_code, status, submit_date, appointment_date, 
           TIMESTAMPDIFF(HOUR, NOW(), appointment_date) as hours_left,
           (appointment_date < NOW()) as is_overdue
    FROM applications 
    WHERE status NOT IN ('HOAN_THANH', 'TU_CHOI')
    ORDER BY appointment_date ASC
");
$rows = $stmt->fetchAll();
foreach ($rows as $r) {
    echo sprintf("%-28s | %-12s | App: %s | Hours left: %3d | Overdue: %d\n",
        $r['dossier_code'], $r['status'], $r['appointment_date'], $r['hours_left'], $r['is_overdue']
    );
}

