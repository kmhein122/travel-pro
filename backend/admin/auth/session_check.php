<?php
/**
 * Travel Pro — Admin Session Check
 * Method: GET
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_start();

if (!empty($_SESSION['travel_pro_admin'])) {
    echo json_encode(['loggedIn' => true, 'admin' => $_SESSION['travel_pro_admin']]);
    exit;
}

echo json_encode(['loggedIn' => false, 'admin' => null]);

