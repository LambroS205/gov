<?php

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $config = require dirname(__DIR__) . '/config/database.php';
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $config['host'],
                $config['port'],
                $config['dbname'],
                $config['charset']
            );
            self::$instance = new PDO($dsn, $config['username'], $config['password'], $config['options']);
            self::$instance->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
        }
        return self::$instance;
    }
}
