<?php

class Request {
    private array $body = [];
    private array $query = [];
    private array $headers = [];
    private string $method;
    private string $uri;

    public function __construct() {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $this->uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $this->query = $_GET;
        $this->headers = getallheaders() ?: [];

        $contentType = $this->getHeader('Content-Type') ?? ($_SERVER['CONTENT_TYPE'] ?? '');
        $raw = file_get_contents('php://input');
        $json = !empty($raw) ? json_decode($raw, true) : null;
        if (is_array($json)) {
            $this->body = $json;
        } else {
            $this->body = $_POST;
        }
    }

    public function getMethod(): string {
        return strtoupper($this->method);
    }

    public function getUri(): string {
        return $this->uri;
    }

    public function all(): array {
        return array_merge($this->query, $this->body);
    }

    public function get(string $key, $default = null) {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }

    public function getQuery(string $key, $default = null) {
        return $this->query[$key] ?? $default;
    }

    public function getBody(): array {
        return $this->body;
    }

    public function getHeader(string $name): ?string {
        foreach ($this->headers as $key => $value) {
            if (strcasecmp($key, $name) === 0) {
                return $value;
            }
        }
        return null;
    }

    public function getBearerToken(): ?string {
        $auth = $this->getHeader('Authorization') ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
        if ($auth && preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
            return trim($matches[1]);
        }
        if (!empty($this->query['token'])) {
            return trim($this->query['token']);
        }
        return null;
    }

    public function getClientIp(): string {
        return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }

    public function getUserAgent(): string {
        return $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    }
}
