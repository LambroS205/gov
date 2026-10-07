<?php

class Response {
    public static function json($data, int $status = 200, string $message = 'Thành công'): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => $status >= 200 && $status < 300,
            'status' => $status,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(string $message, int $status = 400, $errors = null): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'status' => $status,
            'message' => $message,
            'errors' => $errors,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function paginated(array $items, int $total, int $page, int $pageSize, string $message = 'Thành công'): void {
        self::json([
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize,
                'totalPages' => (int)ceil($total / max(1, $pageSize))
            ]
        ], 200, $message);
    }
}
