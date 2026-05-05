<?php
/**
 * Travel Pro — Database Connection
 * ----------------------------------
 * Edit the constants below to match your local MySQL setup.
 * For XAMPP the defaults are usually:
 *   DB_HOST = 'localhost'
 *   DB_USER = 'root'
 *   DB_PASS = ''          (empty password)
 *   DB_NAME = 'travel_pro'
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // ← change if your MySQL user is different
define('DB_PASS', '');           // ← change if you have a MySQL password
define('DB_NAME', 'travel_pro');
define('DB_PORT', 3307);         // ← change if your MySQL port is different
define('DB_CHARSET', 'utf8mb4');

/**
 * Returns a shared PDO connection (singleton-style).
 *
 * @return PDO
 * @throws RuntimeException on connection failure
 */
function getDB(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: DB_HOST;
    $name = getenv('DB_NAME') ?: DB_NAME;
    $user = getenv('DB_USER') ?: DB_USER;
    $pass = getenv('DB_PASS');
    if ($pass === false) {
        $pass = DB_PASS;
    }
    $port = getenv('DB_PORT') ?: DB_PORT;
    $charset = getenv('DB_CHARSET') ?: DB_CHARSET;

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        $debug = (bool) (getenv('APP_DEBUG') ?: ini_get('display_errors'));
        error_log('[Travel Pro] DB connection failed: ' . $e->getMessage());
        // Never expose raw DB errors to the browser in production
        http_response_code(500);
        header('Content-Type: application/json');
        $payload = [
            'success' => false,
            'message' => 'Database connection failed. Check backend/config/db.php.'
        ];
        if ($debug) {
            $payload['error'] = $e->getMessage();
            $payload['dsn'] = $dsn;
        }
        echo json_encode($payload);
        exit;
    }

    return $pdo;
}
