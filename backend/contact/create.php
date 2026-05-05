<?php
/**
 * Travel Pro — Create Contact Message
 * Method: POST
 * Body  : JSON { name,email,phone,subject,message,date(optional) }
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

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body.']);
    exit;
}

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$subject = trim($data['subject'] ?? '');
$message = trim($data['message'] ?? '');
$date = trim($data['date'] ?? '');

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Name, email, subject and message are required.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

$preferredDate = null;
if ($date !== '') {
    // Expect yyyy-mm-dd from <input type="date">
    $preferredDate = preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) ? $date : null;
}

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDB();
    $stmt = $pdo->prepare(
        'INSERT INTO `contact_messages` (`name`,`email`,`phone`,`subject`,`message`,`preferred_date`)
         VALUES (?,?,?,?,?,?)'
    );
    $stmt->execute([
        $name,
        $email,
        $phone !== '' ? $phone : null,
        $subject,
        $message,
        $preferredDate,
    ]);
    echo json_encode(['success' => true, 'message' => 'Message received.']);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] contact/create failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to send message.']);
}

