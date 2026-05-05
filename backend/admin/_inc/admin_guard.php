<?php
/**
 * Travel Pro — Admin Guard
 * Ensures the current request is authenticated as an admin.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

if (empty($_SESSION['travel_pro_admin'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Admin login required.']);
    exit;
}

