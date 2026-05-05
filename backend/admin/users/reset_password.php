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
$newPassword = (string) ($data['new_password'] ?? '');

if ($id <= 0 || $newPassword === '' || strlen($newPassword) < 6) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'User id and a new password (min 6 chars) are required.']);
    exit;
}

try {
    $pdo = getDB();
    $hash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    $stmt = $pdo->prepare('UPDATE `users` SET `password_hash`=? WHERE `id`=?');
    $stmt->execute([$hash, $id]);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/users/reset_password failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to reset password.']);
}

