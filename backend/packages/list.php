<?php
/**
 * Travel Pro — Public Packages List
 * Method: GET
 * Returns: JSON { success: true, packages: [...] }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use GET.']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDB();
    $stmt = $pdo->query(
        'SELECT `id`,`title`,`location`,`category`,`badge`,`price`,`rating`,`review_count`,`image`
         FROM `travel_packages`
         WHERE `is_active` = 1
         ORDER BY `updated_at` DESC, `id` DESC'
    );

    $packages = [];
    foreach ($stmt->fetchAll() as $row) {
        $packages[] = [
            'id' => (int) $row['id'],
            'title' => $row['title'],
            'location' => $row['location'],
            'price' => (int) $row['price'],
            'rating' => (float) $row['rating'],
            'reviews' => (int) $row['review_count'],
            'category' => $row['category'],
            'badge' => $row['badge'] ?? '',
            'img' => $row['image'] ?? '',
        ];
    }

    echo json_encode(['success' => true, 'packages' => $packages]);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] packages/list failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to load packages.']);
}

