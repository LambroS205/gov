<?php
// Test script for extended demo refresh logic
require_once dirname(__DIR__) . '/api/core/Database.php';

function run_test_refresh() {
    $db = Database::getConnection();
    $db->exec('SET NAMES utf8mb4');
    $db->exec('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Chạy seed gốc
    $seedFile = dirname(__DIR__) . '/database/seed_data.sql';
    $db->exec(file_get_contents($seedFile));

    // 2. Chạy migration 001
    $m1 = dirname(__DIR__) . '/database/migrations/001_citizen_accounts.sql';
    if (file_exists($m1)) $db->exec(file_get_contents($m1));

    // 3. Chạy migration 002
    $m2 = dirname(__DIR__) . '/database/migrations/002_queue_and_complaint_coords.sql';
    if (file_exists($m2)) $db->exec(file_get_contents($m2));

    // 4. Chạy migration 003
    $m3 = dirname(__DIR__) . '/database/migrations/003_extended_realistic_mock_data.sql';
    if (file_exists($m3)) $db->exec(file_get_contents($m3));

    echo "Base migrations executed successfully!\n";
    echo "Users count: " . $db->query("SELECT COUNT(*) FROM users")->fetchColumn() . "\n";
    echo "Citizens count: " . $db->query("SELECT COUNT(*) FROM citizens")->fetchColumn() . "\n";
    echo "Citizen accounts count: " . $db->query("SELECT COUNT(*) FROM citizen_accounts")->fetchColumn() . "\n";
}

run_test_refresh();

