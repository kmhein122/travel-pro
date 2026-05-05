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
if ($id <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'User id is required.']);
    exit;
}

try {
    $pdo = getDB();
    $stmt = $pdo->prepare('DELETE FROM `users` WHERE `id`=?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/users/delete failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to delete user.']);
}

