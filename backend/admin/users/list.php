<?php
require_once __DIR__ . '/../_inc/admin_guard.php';
require_once __DIR__ . '/../../config/db.php';

try {
    $pdo = getDB();
    $rows = $pdo->query(
        'SELECT `id`,`name`,`email`,`is_disabled`,`created_at`
         FROM `users`
         ORDER BY `created_at` DESC, `id` DESC'
    )->fetchAll();

    echo json_encode(['success' => true, 'users' => $rows]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/users/list failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load users.']);
}

