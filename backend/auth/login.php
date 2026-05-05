<?php
/**
 * Travel Pro — Login Endpoint
 * ---------------------------------
 * Method : POST
 * Body   : JSON { "email": "...", "password": "..." }
 * Returns: JSON { "success": true/false, "user": {...} | "message": "..." }
 */

// ── CORS & headers ──────────────────────────────────────────────────────────
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

// ── Session ──────────────────────────────────────────────────────────────────
session_start();

// ── Dependencies ─────────────────────────────────────────────────────────────
require_once __DIR__ . '/../config/db.php';

// ── Read & decode JSON body ───────────────────────────────────────────────────
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON body.']);
    exit;
}

// ── Input extraction ──────────────────────────────────────────────────────────
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

// ── Validation ────────────────────────────────────────────────────────────────
if ($email === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

// ── Database lookup ───────────────────────────────────────────────────────────
$pdo = getDB();

// Retrieve user record by email
// SQL: SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1
try {
    $stmt = $pdo->prepare(
        'SELECT `id`, `name`, `email`, `password_hash`, `is_disabled` FROM `users` WHERE `email` = ? LIMIT 1'
    );
    $stmt->execute([$email]);
    $row = $stmt->fetch();
} catch (PDOException $e) {
    // Backward compatibility if the DB wasn't upgraded yet (no is_disabled column)
    if (str_contains($e->getMessage(), 'Unknown column') && str_contains($e->getMessage(), 'is_disabled')) {
        $stmt = $pdo->prepare(
            'SELECT `id`, `name`, `email`, `password_hash` FROM `users` WHERE `email` = ? LIMIT 1'
        );
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        if ($row) {
            $row['is_disabled'] = 0;
        }
    } else {
        throw $e;
    }
}

// ── Credential verification ───────────────────────────────────────────────────
// Use a deliberately generic error message to avoid leaking whether the email exists.
if (!$row || !password_verify($password, $row['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Wrong email or password.']);
    exit;
}

if (!empty($row['is_disabled'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'This account is disabled. Please contact support.']);
    exit;
}

// ── Rehash if needed (PHP's automatic bcrypt upgrade) ─────────────────────────
if (password_needs_rehash($row['password_hash'], PASSWORD_BCRYPT, ['cost' => 12])) {
    $newHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    // SQL: UPDATE users SET password_hash = ? WHERE id = ?
    $rehashStmt = $pdo->prepare('UPDATE `users` SET `password_hash` = ? WHERE `id` = ?');
    $rehashStmt->execute([$newHash, $row['id']]);
}

// Build the public user object (never expose the hash)
$user = [
    'id' => (int) $row['id'],
    'name' => $row['name'],
    'email' => $row['email'],
];

// Persist in PHP session
$_SESSION['travel_pro_user'] = $user;

// ── Success response ──────────────────────────────────────────────────────────
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Logged in successfully!',
    'user' => $user,
]);
