<?php
/**
 * Travel Pro — Admin Logout Endpoint
 * Method: POST (GET accepted)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();
unset($_SESSION['travel_pro_admin']);

echo json_encode(['success' => true, 'message' => 'Admin logged out successfully.']);

