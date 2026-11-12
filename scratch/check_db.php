<?php
require_once __DIR__ . '/../api/core/Database.php';
$db = Database::getConnection();
echo "Database: " . $db->query("SELECT DATABASE()")->fetchColumn() . "\n";
echo "Users: " . $db->query("SELECT COUNT(*) FROM users")->fetchColumn() . "\n";
echo "Citizens: " . $db->query("SELECT COUNT(*) FROM citizens")->fetchColumn() . "\n";
echo "Citizen Accounts: " . $db->query("SELECT COUNT(*) FROM citizen_accounts")->fetchColumn() . "\n";
echo "Applications: " . $db->query("SELECT COUNT(*) FROM applications")->fetchColumn() . "\n";
echo "Complaints: " . $db->query("SELECT COUNT(*) FROM complaints")->fetchColumn() . "\n";
echo "Queue: " . $db->query("SELECT COUNT(*) FROM queue_tickets")->fetchColumn() . "\n";

