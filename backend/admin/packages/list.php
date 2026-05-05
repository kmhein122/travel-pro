<?php
require_once __DIR__ . '/../_inc/admin_guard.php';
require_once __DIR__ . '/../../config/db.php';

try {
    $pdo = getDB();
    $rows = $pdo->query(
        'SELECT `id`,`title`,`location`,`category`,`badge`,`price`,`rating`,`review_count`,`image`,`description`,`is_active`,`created_at`,`updated_at`
         FROM `travel_packages`
         ORDER BY `updated_at` DESC, `id` DESC'
    )->fetchAll();

    echo json_encode(['success' => true, 'packages' => $rows]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/packages/list failed: ' . $e->getMessage());
    $msg = 'Failed to load packages.';
    if (str_contains($e->getMessage(), 'doesn\'t exist') || str_contains($e->getMessage(), 'Base table')) {
        $msg = 'Packages table is missing. Run Admin Setup or import database/travel_pro.sql.';
    }
    echo json_encode(['success' => false, 'message' => $msg]);
}

