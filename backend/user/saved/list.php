<?php
require_once __DIR__ . '/../_inc/user_guard.php';
require_once __DIR__ . '/../../config/db.php';

try {
    $pdo = getDB();
    $uid = (int) $_SESSION['travel_pro_user']['id'];
    $stmt = $pdo->prepare(
        'SELECT sp.`id`, sp.`package_id`, sp.`created_at`,
                p.`title`, p.`location`, p.`image`
         FROM `saved_places` sp
         JOIN `travel_packages` p ON p.`id` = sp.`package_id`
         WHERE sp.`user_id` = ?
         ORDER BY sp.`created_at` DESC, sp.`id` DESC'
    );
    $stmt->execute([$uid]);
    $rows = $stmt->fetchAll();
    $out = array_map(static fn ($r) => [
        'id' => (int) $r['id'],
        'packageId' => (int) $r['package_id'],
        'title' => $r['title'],
        'location' => $r['location'],
        'img' => $r['image'] ?? '',
        'date' => $r['created_at'],
    ], $rows);
    echo json_encode(['success' => true, 'savedPlaces' => $out]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] user/saved/list failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load saved places.']);
}

