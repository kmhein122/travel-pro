<?php
require_once __DIR__ . '/../_inc/user_guard.php';
require_once __DIR__ . '/../../config/db.php';

try {
    $pdo = getDB();
    $uid = (int) $_SESSION['travel_pro_user']['id'];
    $stmt = $pdo->prepare(
        'SELECT b.`id`, b.`package_id`, b.`status`, b.`booked_at`,
                p.`title`, p.`location`, p.`price`, p.`image`
         FROM `bookings` b
         JOIN `travel_packages` p ON p.`id` = b.`package_id`
         WHERE b.`user_id` = ?
         ORDER BY b.`booked_at` DESC, b.`id` DESC'
    );
    $stmt->execute([$uid]);
    $rows = $stmt->fetchAll();
    $out = array_map(static fn ($r) => [
        'id' => (int) $r['id'],
        'packageId' => (int) $r['package_id'],
        'title' => $r['title'],
        'location' => $r['location'],
        'price' => (int) $r['price'],
        'status' => $r['status'],
        'date' => $r['booked_at'],
        'img' => $r['image'] ?? '',
    ], $rows);
    echo json_encode(['success' => true, 'bookings' => $out]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] user/bookings/list failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load bookings.']);
}

