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

$packageId = (int) ($data['package_id'] ?? 0);
if ($packageId <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'package_id is required.']);
    exit;
}

try {
    $pdo = getDB();
    $uid = (int) $_SESSION['travel_pro_user']['id'];
    $stmt = $pdo->prepare('INSERT INTO `bookings` (`user_id`,`package_id`) VALUES (?,?)');
    $stmt->execute([$uid, $packageId]);
    echo json_encode(['success' => true, 'id' => (int) $pdo->lastInsertId()]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] user/bookings/create failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to create booking.']);
}

