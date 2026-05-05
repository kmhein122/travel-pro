<?php
/**
 * Travel Pro — Public Reviews List
 * Method: GET
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use GET.']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDB();
    $stmt = $pdo->query(
        'SELECT r.`id`, r.`rating`, r.`text`, r.`admin_reply`, r.`created_at`,
                u.`name` AS `user_name`
         FROM `reviews` r
         JOIN `users` u ON u.`id` = r.`user_id`
         ORDER BY r.`created_at` DESC, r.`id` DESC
         LIMIT 50'
    );
    echo json_encode(['success' => true, 'reviews' => $stmt->fetchAll()]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] reviews/list failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load reviews.']);
}

