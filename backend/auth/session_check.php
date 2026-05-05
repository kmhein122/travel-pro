<?php
/**
 * Travel Pro — Session Check Endpoint
 * ---------------------------------
 * Method : GET
 * Returns: JSON { "loggedIn": true/false, "user": {...} | null }
 *
 * Called on page load by the frontend to restore the logged-in
 * state from the PHP session (survives full page refreshes).
 */

// ── Headers ──────────────────────────────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Read session ──────────────────────────────────────────────────────────────
session_start();

if (!empty($_SESSION['travel_pro_user'])) {
    // User is logged in — return their public data
    echo json_encode([
        'loggedIn' => true,
        'user' => $_SESSION['travel_pro_user'],
    ]);
} else {
    // No active session
    echo json_encode([
        'loggedIn' => false,
        'user' => null,
    ]);
}
