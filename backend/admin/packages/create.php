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

$title = trim($data['title'] ?? '');
$location = trim($data['location'] ?? '');
$category = trim($data['category'] ?? '');
$badge = trim($data['badge'] ?? '');
$price = (int) ($data['price'] ?? 0);
$image = trim($data['image'] ?? '');
$description = trim($data['description'] ?? '');
$isActive = isset($data['is_active']) ? (int) ((bool) $data['is_active']) : 1;

if ($title === '' || $location === '' || $category === '' || $price <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Title, location, category, and price are required.']);
    exit;
}

try {
    $pdo = getDB();
    $stmt = $pdo->prepare(
        'INSERT INTO `travel_packages`
        (`title`,`location`,`category`,`badge`,`price`,`image`,`description`,`is_active`)
        VALUES (?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        $title,
        $location,
        $category,
        $badge !== '' ? $badge : null,
        $price,
        $image !== '' ? $image : null,
        $description !== '' ? $description : null,
        $isActive,
    ]);

    echo json_encode(['success' => true, 'id' => (int) $pdo->lastInsertId()]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/packages/create failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to create package.']);
}

