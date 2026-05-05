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
$isActive = isset($data['is_active']) ? (int) ((bool) $data['is_active']) : null;

if ($id <= 0 || $isActive === null) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Package id and is_active are required.']);
    exit;
}

try {
    $pdo = getDB();
    $stmt = $pdo->prepare('UPDATE `travel_packages` SET `is_active`=? WHERE `id`=?');
    $stmt->execute([$isActive, $id]);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/packages/set_active failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to update package status.']);
}

