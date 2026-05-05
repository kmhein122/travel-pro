<?php
require_once __DIR__ . '/../_inc/admin_guard.php';
require_once __DIR__ . '/../../config/db.php';

try {
    $pdo = getDB();
    $stmt = $pdo->query(
        'SELECT r.`id`, r.`rating`, r.`text`, r.`admin_reply`, r.`created_at`, r.`replied_at`,
                u.`id` AS `user_id`, u.`name` AS `user_name`, u.`email` AS `user_email`,
                p.`id` AS `package_id`, p.`title` AS `package_title`
         FROM `reviews` r
         JOIN `users` u ON u.`id` = r.`user_id`
         LEFT JOIN `travel_packages` p ON p.`id` = r.`package_id`
         ORDER BY r.`created_at` DESC, r.`id` DESC'
    );
    echo json_encode(['success' => true, 'reviews' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/reviews/list failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load reviews.']);
}

