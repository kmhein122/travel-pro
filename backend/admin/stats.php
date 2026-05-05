<?php
require_once __DIR__ . '/_inc/admin_guard.php';
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDB();

    $hasDisabled = false;
    try {
        $chk = $pdo->query("SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'is_disabled' LIMIT 1");
        $hasDisabled = (bool) $chk->fetchColumn();
    } catch (Throwable $_) {
        $hasDisabled = false;
    }

    $out = [
        'users_total' => (int) $pdo->query('SELECT COUNT(*) FROM `users`')->fetchColumn(),
        'users_disabled' => $hasDisabled ? (int) $pdo->query('SELECT COUNT(*) FROM `users` WHERE `is_disabled` = 1')->fetchColumn() : 0,
        'packages_total' => (int) $pdo->query('SELECT COUNT(*) FROM `travel_packages`')->fetchColumn(),
        'packages_active' => (int) $pdo->query('SELECT COUNT(*) FROM `travel_packages` WHERE `is_active` = 1')->fetchColumn(),
        'reviews_total' => (int) $pdo->query('SELECT COUNT(*) FROM `reviews`')->fetchColumn(),
        'reviews_unreplied' => (int) $pdo->query('SELECT COUNT(*) FROM `reviews` WHERE `admin_reply` IS NULL OR `admin_reply` = \'\'')->fetchColumn(),
        'messages_total' => (int) $pdo->query('SELECT COUNT(*) FROM `contact_messages`')->fetchColumn(),
        'messages_new' => (int) $pdo->query('SELECT COUNT(*) FROM `contact_messages` WHERE `status` = \'new\'')->fetchColumn(),
    ];

    echo json_encode(['success' => true, 'stats' => $out]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/stats failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load stats. If this is a fresh DB, run Admin Setup or import database/travel_pro.sql.']);
}

