<?php
require_once __DIR__ . '/../_inc/admin_guard.php';

$root = realpath(__DIR__ . '/../../../images');
$uploads = $root ? ($root . DIRECTORY_SEPARATOR . 'uploads') : null;

if (!$root) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Images folder not found.']);
    exit;
}

@mkdir($uploads, 0777, true);

function listImages(string $dir, string $prefix = ''): array
{
    $out = [];
    if (!is_dir($dir)) {
        return $out;
    }
    $files = scandir($dir);
    if (!$files) {
        return $out;
    }
    foreach ($files as $f) {
        if ($f === '.' || $f === '..') continue;
        $path = $dir . DIRECTORY_SEPARATOR . $f;
        if (!is_file($path)) continue;
        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (!in_array($ext, ['png', 'jpg', 'jpeg', 'webp', 'gif'], true)) continue;
        $out[] = $prefix . $f;
    }
    sort($out);
    return $out;
}

$list = array_values(array_unique(array_merge(
    listImages($root, ''),
    listImages($uploads, 'uploads/')
)));

header('Content-Type: application/json');
echo json_encode(['success' => true, 'images' => $list]);

