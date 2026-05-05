<?php
require_once __DIR__ . '/../_inc/admin_guard.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit;
}

try {
    $pdo = getDB();

    $map = [
        'Bangkok Night Market Tour' => 'bangkok_night_market.png',
        'Chiang Mai Temple Trail' => 'chiang_mai_temple.png',
        'Phuket Island Hopping' => 'phuket_island.png',
        'Krabi Rock Climbing' => 'krabi_rock_climbing.png',
        'Pai Mountain Retreat' => 'pai_mountain.png',
        'Bangkok Street Food Crawl' => 'bangkok_street_food.png',
        'Thai Cooking Class Secrets' => 'thai_cooking_class.png',
        'Sukhothai Heritage Walk' => 'sukhothai_heritage.png',
    ];

    $stmt = $pdo->prepare('UPDATE `travel_packages` SET `image` = ? WHERE `title` = ?');
    $updated = 0;
    foreach ($map as $title => $image) {
        $stmt->execute([$image, $title]);
        $updated += $stmt->rowCount();
    }

    echo json_encode(['success' => true, 'updated' => $updated, 'message' => 'Demo images assigned.']);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/packages/assign_demo_images failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to assign demo images.']);
}

