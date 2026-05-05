<?php
require_once __DIR__ . '/../_inc/user_guard.php';
require_once __DIR__ . '/../../config/db.php';

try {
    $pdo = getDB();
    $uid = (int) $_SESSION['travel_pro_user']['id'];

    $stmt = $pdo->prepare(
        'SELECT `id`,`destination`,`days`,`created_at`
         FROM `itineraries`
         WHERE `user_id` = ?
         ORDER BY `created_at` DESC, `id` DESC'
    );
    $stmt->execute([$uid]);
    $itins = $stmt->fetchAll();

    $itemsStmt = $pdo->prepare(
        'SELECT `id`,`day`,`time`,`title`,`description`,`sort_order`
         FROM `itinerary_items`
         WHERE `itinerary_id` = ?
         ORDER BY `day` ASC, `sort_order` ASC, `id` ASC'
    );

    $out = [];
    foreach ($itins as $it) {
        $itemsStmt->execute([(int) $it['id']]);
        $items = $itemsStmt->fetchAll();
        $out[] = [
            'id' => (int) $it['id'],
            'destination' => $it['destination'],
            'days' => (int) $it['days'],
            'date' => $it['created_at'],
            'items' => array_map(static fn ($r) => [
                'id' => (int) $r['id'],
                'day' => (int) $r['day'],
                'time' => $r['time'],
                'title' => $r['title'],
                'desc' => $r['description'] ?? '',
                'sort_order' => (int) $r['sort_order'],
            ], $items),
        ];
    }

    echo json_encode(['success' => true, 'itineraries' => $out]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] user/itineraries/list failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load itineraries.']);
}

