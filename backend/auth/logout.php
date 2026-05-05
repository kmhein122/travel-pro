<?php
/**
 * Travel Pro — Logout Endpoint
 * ---------------------------------
 * Method : POST  (GET also accepted for convenience)
 * Returns: JSON { "success": true }
 *
 * Destroys the PHP session so the server no longer remembers
 * the currently logged-in user.
 */

// ── Headers ──────────────────────────────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Destroy the session ───────────────────────────────────────────────────────
session_start();

// 1. Clear all session variables
$_SESSION = [];

// 2. Delete the session cookie from the browser
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params['path'],
        $params['domain'],
        $params['secure'],
        $params['httponly']
    );
}

// 3. Destroy the session on the server
session_destroy();

// ── Response ──────────────────────────────────────────────────────────────────
echo json_encode(['success' => true, 'message' => 'Logged out successfully.']);
