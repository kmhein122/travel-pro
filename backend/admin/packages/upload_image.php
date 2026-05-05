<?php
require_once __DIR__ . '/../_inc/admin_guard.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit;
}

if (empty($_FILES['image'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'No file uploaded (field name: image).']);
    exit;
}

$file = $_FILES['image'];
if (!empty($file['error'])) {
    http_response_code(400);
    $code = (int) $file['error'];
    $map = [
        UPLOAD_ERR_INI_SIZE => 'File too large (php.ini upload_max_filesize).',
        UPLOAD_ERR_FORM_SIZE => 'File too large (form limit).',
        UPLOAD_ERR_PARTIAL => 'Upload incomplete. Please try again.',
        UPLOAD_ERR_NO_FILE => 'No file uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder (upload_tmp_dir).',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by a PHP extension.',
    ];
    echo json_encode(['success' => false, 'message' => $map[$code] ?? 'Upload failed.']);
    exit;
}

$original = (string) ($file['name'] ?? 'image');
$ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
if (!in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif'], true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Only png/jpg/jpeg/webp/gif allowed.']);
    exit;
}

$root = realpath(__DIR__ . '/../../../images');
if (!$root) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Images folder not found.']);
    exit;
}

$uploads = $root . DIRECTORY_SEPARATOR . 'uploads';
@mkdir($uploads, 0777, true);

$base = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($original, PATHINFO_FILENAME));
$base = trim($base, '_');
if ($base === '') $base = 'package_image';

$targetName = $base . '_' . date('Ymd_His') . '.' . $ext;
$targetPath = $uploads . DIRECTORY_SEPARATOR . $targetName;

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file (move_uploaded_file failed). Check folder permissions for images/uploads/.']);
    exit;
}

echo json_encode([
    'success' => true,
    // relative to /images/ so frontend can use images/<path>
    'path' => 'uploads/' . $targetName,
]);

