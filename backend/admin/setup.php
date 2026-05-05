<?php
/**
 * Travel Pro — Admin DB Setup / Upgrade
 * Creates missing tables and adds missing columns.
 * Admin-only.
 */

require_once __DIR__ . '/_inc/admin_guard.php';
require_once __DIR__ . '/../config/db.php';

function tableExists(PDO $pdo, string $table): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = ?'
    );
    $stmt->execute([$table]);
    return (int) $stmt->fetchColumn() > 0;
}

function columnExists(PDO $pdo, string $table, string $col): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?'
    );
    $stmt->execute([$table, $col]);
    return (int) $stmt->fetchColumn() > 0;
}

try {
    $pdo = getDB();

    // Users: add is_disabled if missing
    if (tableExists($pdo, 'users') && !columnExists($pdo, 'users', 'is_disabled')) {
        $pdo->exec('ALTER TABLE `users` ADD COLUMN `is_disabled` TINYINT(1) NOT NULL DEFAULT 0');
    }

    // travel_packages
    if (!tableExists($pdo, 'travel_packages')) {
        $pdo->exec(
            'CREATE TABLE `travel_packages` (
              `id` INT NOT NULL AUTO_INCREMENT,
              `title` VARCHAR(160) NOT NULL,
              `location` VARCHAR(160) NOT NULL,
              `category` VARCHAR(50) NOT NULL,
              `badge` VARCHAR(50) DEFAULT NULL,
              `price` INT NOT NULL,
              `rating` DECIMAL(2,1) NOT NULL DEFAULT 0.0,
              `review_count` INT NOT NULL DEFAULT 0,
              `image` VARCHAR(255) DEFAULT NULL,
              `description` TEXT DEFAULT NULL,
              `is_active` TINYINT(1) NOT NULL DEFAULT 1,
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_category` (`category`),
              KEY `idx_active` (`is_active`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    // reviews
    if (!tableExists($pdo, 'reviews')) {
        $pdo->exec(
            'CREATE TABLE `reviews` (
              `id` INT NOT NULL AUTO_INCREMENT,
              `user_id` INT NOT NULL,
              `package_id` INT NULL,
              `rating` TINYINT NOT NULL,
              `text` TEXT NOT NULL,
              `admin_reply` TEXT NULL,
              `replied_at` TIMESTAMP NULL DEFAULT NULL,
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_user` (`user_id`),
              KEY `idx_package` (`package_id`),
              CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
              CONSTRAINT `fk_reviews_package` FOREIGN KEY (`package_id`) REFERENCES `travel_packages` (`id`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    // contact_messages
    if (!tableExists($pdo, 'contact_messages')) {
        $pdo->exec(
            'CREATE TABLE `contact_messages` (
              `id` INT NOT NULL AUTO_INCREMENT,
              `name` VARCHAR(120) NOT NULL,
              `email` VARCHAR(150) NOT NULL,
              `phone` VARCHAR(50) DEFAULT NULL,
              `subject` VARCHAR(180) NOT NULL,
              `message` TEXT NOT NULL,
              `preferred_date` DATE NULL,
              `status` ENUM(\'new\',\'read\',\'archived\') NOT NULL DEFAULT \'new\',
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_status` (`status`),
              KEY `idx_created` (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    // saved_places
    if (!tableExists($pdo, 'saved_places')) {
        $pdo->exec(
            'CREATE TABLE `saved_places` (
              `id` INT NOT NULL AUTO_INCREMENT,
              `user_id` INT NOT NULL,
              `package_id` INT NOT NULL,
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              UNIQUE KEY `uq_user_package` (`user_id`,`package_id`),
              KEY `idx_user` (`user_id`),
              KEY `idx_package` (`package_id`),
              CONSTRAINT `fk_saved_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
              CONSTRAINT `fk_saved_package` FOREIGN KEY (`package_id`) REFERENCES `travel_packages` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    // bookings
    if (!tableExists($pdo, 'bookings')) {
        $pdo->exec(
            'CREATE TABLE `bookings` (
              `id` INT NOT NULL AUTO_INCREMENT,
              `user_id` INT NOT NULL,
              `package_id` INT NOT NULL,
              `status` ENUM(\'Confirmed\',\'Cancelled\') NOT NULL DEFAULT \'Confirmed\',
              `booked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_user` (`user_id`),
              KEY `idx_package` (`package_id`),
              KEY `idx_status` (`status`),
              CONSTRAINT `fk_booking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
              CONSTRAINT `fk_booking_package` FOREIGN KEY (`package_id`) REFERENCES `travel_packages` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    // itineraries + itinerary_items
    if (!tableExists($pdo, 'itineraries')) {
        $pdo->exec(
            'CREATE TABLE `itineraries` (
              `id` INT NOT NULL AUTO_INCREMENT,
              `user_id` INT NOT NULL,
              `destination` VARCHAR(160) NOT NULL,
              `days` INT NOT NULL,
              `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              PRIMARY KEY (`id`),
              KEY `idx_user` (`user_id`),
              CONSTRAINT `fk_itin_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    if (!tableExists($pdo, 'itinerary_items')) {
        $pdo->exec(
            'CREATE TABLE `itinerary_items` (
              `id` INT NOT NULL AUTO_INCREMENT,
              `itinerary_id` INT NOT NULL,
              `day` INT NOT NULL,
              `time` VARCHAR(20) NOT NULL,
              `title` VARCHAR(180) NOT NULL,
              `description` TEXT DEFAULT NULL,
              `sort_order` INT NOT NULL DEFAULT 0,
              PRIMARY KEY (`id`),
              KEY `idx_itin` (`itinerary_id`),
              CONSTRAINT `fk_itin_items_itin` FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
    }

    echo json_encode(['success' => true, 'message' => 'Database setup completed.']);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('[Travel Pro] admin/setup failed: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database setup failed. Import database/travel_pro.sql or run setup again.']);
}

