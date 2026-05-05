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

$id = (int) ($data['id'] ?? 0);
if ($id <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'id is required.']);
    exit;
}

try {
    $pdo = getDB();
    $uid = (int) $_SESSION['travel_pro_user']['id'];
    $stmt = $pdo->prepare('UPDATE `bookings` SET `status` = \'Cancelled\' WHERE `id` = ? AND `user_id` = ?');
    $stmt->execute([$id, $uid]);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] user/bookings/cancel failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to cancel booking.']);
}

