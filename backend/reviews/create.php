<?php
/**
 * Travel Pro — Create Review
 * Method: POST
 * Body  : JSON { "rating": 1..5, "text": "...", "package_id": optional }
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit;
}

session_start();
if (empty($_SESSION['travel_pro_user']['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Login required.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body.']);
    exit;
}

$rating = (int) ($data['rating'] ?? 0);
$text = trim($data['text'] ?? '');
$packageId = isset($data['package_id']) ? (int) $data['package_id'] : null;

if ($rating < 1 || $rating > 5 || $text === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Rating (1-5) and text are required.']);
    exit;
}

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDB();
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('INSERT INTO `reviews` (`user_id`,`package_id`,`rating`,`text`) VALUES (?,?,?,?)');
    $stmt->execute([(int) $_SESSION['travel_pro_user']['id'], $packageId ?: null, $rating, $text]);
    $reviewId = (int) $pdo->lastInsertId();

    if ($packageId) {
        // Recompute rating + count for the package
        $agg = $pdo->prepare('SELECT COUNT(*) AS c, AVG(`rating`) AS a FROM `reviews` WHERE `package_id` = ?');
        $agg->execute([$packageId]);
        $row = $agg->fetch();

        $upd = $pdo->prepare('UPDATE `travel_packages` SET `review_count`=?, `rating`=? WHERE `id`=?');
        $upd->execute([(int) ($row['c'] ?? 0), (float) ($row['a'] ?? 0), $packageId]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'id' => $reviewId]);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    error_log('[Travel Pro] reviews/create failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to submit review.']);
}

