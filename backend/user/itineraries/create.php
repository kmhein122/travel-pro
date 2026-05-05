<?php
require_once __DIR__ . '/../_inc/user_guard.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body.']);
    exit;
}

$destination = trim($data['destination'] ?? '');
$days = (int) ($data['days'] ?? 0);
$items = $data['items'] ?? null;

if ($destination === '' || $days <= 0 || !is_array($items)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'destination, days, and items[] are required.']);
    exit;
}

try {
    $pdo = getDB();
    $uid = (int) $_SESSION['travel_pro_user']['id'];

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO `itineraries` (`user_id`,`destination`,`days`) VALUES (?,?,?)');
    $stmt->execute([$uid, $destination, $days]);
    $itinId = (int) $pdo->lastInsertId();

    $itemStmt = $pdo->prepare(
        'INSERT INTO `itinerary_items` (`itinerary_id`,`day`,`time`,`title`,`description`,`sort_order`)
         VALUES (?,?,?,?,?,?)'
    );
    $i = 0;
    foreach ($items as $item) {
        $day = (int) ($item['day'] ?? 1);
        $time = trim((string) ($item['time'] ?? '12:00 PM'));
        $title = trim((string) ($item['title'] ?? 'Activity'));
        $desc = trim((string) ($item['desc'] ?? ($item['description'] ?? '')));
        if ($day <= 0) $day = 1;
        if ($time === '') $time = '12:00 PM';
        if ($title === '') $title = 'Activity';
        $itemStmt->execute([$itinId, $day, $time, $title, $desc !== '' ? $desc : null, $i]);
        $i++;
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'id' => $itinId]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log('[Travel Pro] user/itineraries/create failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to save itinerary.']);
}

