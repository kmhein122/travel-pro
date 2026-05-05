<?php
require_once __DIR__ . '/../_inc/admin_guard.php';
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
$reply = trim($data['reply'] ?? '');

if ($id <= 0 || $reply === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Review id and reply are required.']);
    exit;
}

try {
    $pdo = getDB();
    $stmt = $pdo->prepare('UPDATE `reviews` SET `admin_reply` = ?, `replied_at` = NOW() WHERE `id` = ?');
    $stmt->execute([$reply, $id]);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/reviews/reply failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to reply to review.']);
}

