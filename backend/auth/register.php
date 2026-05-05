<?php
/**
 * Travel Pro — Register Endpoint
 * ---------------------------------
 * Method : POST
 * Body   : JSON { "name": "...", "email": "...", "password": "..." }
 * Returns: JSON { "success": true/false, "user": {...} | "message": "..." }
 */

// ── CORS & headers ──────────────────────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle pre-flight requests from browsers
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only allow POST
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
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

// ── Validation ────────────────────────────────────────────────────────────────
$errors = [];

if ($name === '') {
    $errors[] = 'Name is required.';
} elseif (strlen($name) < 2) {
    $errors[] = 'Name must be at least 2 characters.';
}

if ($email === '') {
    $errors[] = 'Email is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address.';
}

if ($password === '') {
    $errors[] = 'Password is required.';
} elseif (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ── Database operations ───────────────────────────────────────────────────────
$pdo = getDB();

// Check if email already exists
// SQL: SELECT id FROM users WHERE email = ? LIMIT 1
$stmt = $pdo->prepare('SELECT `id` FROM `users` WHERE `email` = ? LIMIT 1');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'Email already registered. Please log in.']);
    exit;
}

// Hash the password with bcrypt (cost factor 12)
$passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Insert new user
// SQL: INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)
$insert = $pdo->prepare(
    'INSERT INTO `users` (`name`, `email`, `password_hash`) VALUES (?, ?, ?)'
);
$insert->execute([$name, $email, $passwordHash]);

$newUserId = (int) $pdo->lastInsertId();

// Build the public user object (never expose the hash)
$user = [
    'id' => $newUserId,
    'name' => $name,
    'email' => $email,
];

// Persist in PHP session so subsequent pages can restore state
$_SESSION['travel_pro_user'] = $user;

// ── Success response ──────────────────────────────────────────────────────────
http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Account created successfully!',
    'user' => $user,
]);
