<?php

class Router {
    private array $routes = [];

    public function add(string $method, string $pattern, $handler): void {
        $this->routes[] = [
            'method' => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler
        ];
    }

    public function get(string $pattern, $handler): void {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, $handler): void {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, $handler): void {
        $this->add('PUT', $pattern, $handler);
    }

    public function delete(string $pattern, $handler): void {
        $this->add('DELETE', $pattern, $handler);
    }

    public function dispatch(Request $request): void {
        $method = $request->getMethod();
        $rawUri = $request->getUri();

        // Chuẩn hóa URI linh hoạt cho môi trường XAMPP
        // Hỗ trợ cả /gov/api/v1/..., /gov/api/api/v1/..., /api/v1/...
        $uri = preg_replace('#^/gov/api/?#', '/', $rawUri);
        $uri = str_replace('/index.php', '', $uri);
        if (!str_starts_with($uri, '/api/')) {
            $uri = '/api' . (str_starts_with($uri, '/') ? $uri : '/' . $uri);
        }
        $uri = rtrim($uri, '/');
        if ($uri === '/api' || $uri === '') {
            $uri = '/api/v1';
        }

        // Xử lý pre-flight request CORS
        if ($method === 'OPTIONS') {
            http_response_code(204);
            header("Access-Control-Allow-Origin: *");
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
            header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
            exit;
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            // Chuyển /api/v1/applications/{id} thành regex #^/api/v1/applications/([^/]+)$#
            $regex = preg_replace('#\{([a-zA-Z0-9_]+)\}#', '(?P<$1>[^/]+)', $route['pattern']);
            $regex = '#^' . $regex . '$#';

            if (preg_match($regex, $uri, $matches)) {
                $params = [];
                foreach ($matches as $key => $val) {
                    if (is_string($key)) {
                        $params[$key] = $val;
                    }
                }

                $handler = $route['handler'];
                if (is_callable($handler)) {
                    call_user_func($handler, $request, $params);
                    return;
                }

                if (is_array($handler) && count($handler) === 2) {
                    $controllerName = $handler[0];
                    $methodName = $handler[1];
                    $controller = new $controllerName();
                    $controller->$methodName($request, $params);
                    return;
                }
            }
        }

        Response::error(sprintf('Đường dẫn không tồn tại: [%s] %s', $method, $uri), 404);
    }
}
