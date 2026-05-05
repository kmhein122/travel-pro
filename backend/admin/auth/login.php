<?php
/**
 * Travel Pro — Admin Login Endpoint
 * Method: POST
 * Body  : JSON { "email": "...", "password": "..." }
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

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body.']);
    exit;
}

$email = trim($data['email'] ?? '');
$password = (string) ($data['password'] ?? '');

if ($email === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

$admins = require __DIR__ . '/../../config/admins.php';

$match = null;
foreach ($admins as $admin) {
    if (strcasecmp($admin['email'], $email) === 0) {
        $match = $admin;
        break;
    }
}

// Generic error to avoid leaking which emails are valid.
if (!$match || !password_verify($password, $match['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Wrong email or password.']);
    exit;
}

session_start();
$adminPublic = [
    'email' => $match['email'],
    'name' => $match['name'] ?? 'Admin',
];
$_SESSION['travel_pro_admin'] = $adminPublic;

echo json_encode([
    'success' => true,
    'message' => 'Admin logged in successfully!',
    'admin' => $adminPublic,
]);

