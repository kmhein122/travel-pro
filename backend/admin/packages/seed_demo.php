<?php
require_once __DIR__ . '/../_inc/admin_guard.php';
require_once __DIR__ . '/../../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed. Use POST.']);
    exit;
}

try {
    $pdo = getDB();

    $demo = [
        ['Bangkok Night Market Tour', 'Bangkok, Chatuchak', 'culinary', 'Popular', 2500, 'bangkok_night_market.png', 'Street-food crawl + local market secrets.'],
        ['Chiang Mai Temple Trail', 'Chiang Mai, Old City', 'culture', 'Top Rated', 3200, 'chiang_mai_temple.png', 'Iconic temples, hidden alleys, and monk chat session.'],
        ['Phuket Island Hopping', 'Phuket, Phi Phi', 'adventure', 'Trending', 4800, 'phuket_island.png', 'Speedboat, snorkeling, Maya Bay viewpoints.'],
        ['Krabi Rock Climbing', 'Krabi, Railay Beach', 'adventure', 'Adventure', 3500, 'krabi_rock_climbing.png', 'Beginner-friendly climbs with pro instructors.'],
        ['Pai Mountain Retreat', 'Pai, Mae Hong Son', 'relaxation', 'Hidden Gem', 2900, 'pai_mountain.png', 'Chill vibes, hot springs, and sunrise spots.'],
        ['Bangkok Street Food Crawl', 'Bangkok, Yaowarat', 'culinary', 'Must Try', 1500, 'bangkok_street_food.png', 'Michelin-bib eats and Chinatown dessert stops.'],
        ['Thai Cooking Class Secrets', 'Bangkok, Silom', 'local-secrets', 'Local', 2200, 'thai_cooking_class.png', 'Market tour + hands-on cooking with a local chef.'],
        ['Sukhothai Heritage Walk', 'Sukhothai', 'culture', 'Heritage', 2100, 'sukhothai_heritage.png', 'UNESCO ruins tour + sunset bike loop.'],
    ];

    $stmt = $pdo->prepare(
        'INSERT INTO `travel_packages` (`title`,`location`,`category`,`badge`,`price`,`image`,`description`,`is_active`)
         VALUES (?,?,?,?,?,?,?,1)'
    );

    $existing = array_flip(
        array_map(
            static fn ($t) => mb_strtolower((string) $t),
            $pdo->query('SELECT `title` FROM `travel_packages`')->fetchAll(PDO::FETCH_COLUMN)
        )
    );

    $inserted = 0;
    foreach ($demo as $p) {
        $key = mb_strtolower((string) $p[0]);
        if (isset($existing[$key])) {
            continue;
        }
        $stmt->execute([
            $p[0],
            $p[1],
            $p[2],
            $p[3],
            (int) $p[4],
            $p[5] !== '' ? $p[5] : null,
            $p[6] !== '' ? $p[6] : null,
        ]);
        $inserted++;
    }

    echo json_encode(['success' => true, 'inserted' => $inserted, 'message' => $inserted > 0 ? 'Demo packages inserted.' : 'All demo packages already exist.']);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/packages/seed_demo failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Failed to insert demo packages.']);
}

