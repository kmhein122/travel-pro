-- ============================================================
--  Travel Pro — Database Schema
--  Run this once in phpMyAdmin or the MySQL CLI to set up
--  the database and all required tables (users, packages, reviews, contact).
-- ============================================================

-- 1. Create (or reuse) the database
CREATE DATABASE IF NOT EXISTS `travel_pro`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `travel_pro`;

-- ============================================================
--  2. Users table
--  Stores registered user accounts.
--  Passwords are stored as bcrypt hashes (never plain-text).
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100) NOT NULL,
  `email`         VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `is_disabled`   TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- If your `users` table already exists, you can run this instead:
-- ALTER TABLE `users` ADD COLUMN `is_disabled` TINYINT(1) NOT NULL DEFAULT 0;

-- ============================================================
--  3. Travel packages table
-- ============================================================
CREATE TABLE IF NOT EXISTS `travel_packages` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(160)  NOT NULL,
  `location`    VARCHAR(160)  NOT NULL,
  `category`    VARCHAR(50)   NOT NULL,
  `badge`       VARCHAR(50)   DEFAULT NULL,
  `price`       INT           NOT NULL,
  `rating`      DECIMAL(2,1)  NOT NULL DEFAULT 0.0,
  `review_count`INT           NOT NULL DEFAULT 0,
  `image`       VARCHAR(255)  DEFAULT NULL,
  `description` TEXT          DEFAULT NULL,
  `is_active`   TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  4. Reviews table (travelers) + admin reply
-- ============================================================
CREATE TABLE IF NOT EXISTS `reviews` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `user_id`      INT          NOT NULL,
  `package_id`   INT          NULL,
  `rating`       TINYINT      NOT NULL,
  `text`         TEXT         NOT NULL,
  `admin_reply`  TEXT         NULL,
  `replied_at`   TIMESTAMP    NULL DEFAULT NULL,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_package` (`package_id`),
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_package` FOREIGN KEY (`package_id`) REFERENCES `travel_packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  5. Contact messages table
-- ============================================================
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(120) NOT NULL,
  `email`       VARCHAR(150) NOT NULL,
  `phone`       VARCHAR(50)  DEFAULT NULL,
  `subject`     VARCHAR(180) NOT NULL,
  `message`     TEXT         NOT NULL,
  `preferred_date` DATE      NULL,
  `status`      ENUM('new','read','archived') NOT NULL DEFAULT 'new',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  6. Saved places (wishlist)
-- ============================================================
CREATE TABLE IF NOT EXISTS `saved_places` (
  `id`         INT         NOT NULL AUTO_INCREMENT,
  `user_id`    INT         NOT NULL,
  `package_id` INT         NOT NULL,
  `created_at` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_package` (`user_id`, `package_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_package` (`package_id`),
  CONSTRAINT `fk_saved_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_saved_package` FOREIGN KEY (`package_id`) REFERENCES `travel_packages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  7. Bookings (simple booking history)
-- ============================================================
CREATE TABLE IF NOT EXISTS `bookings` (
  `id`          INT         NOT NULL AUTO_INCREMENT,
  `user_id`     INT         NOT NULL,
  `package_id`  INT         NOT NULL,
  `status`      ENUM('Confirmed','Cancelled') NOT NULL DEFAULT 'Confirmed',
  `booked_at`   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_package` (`package_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_booking_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_booking_package` FOREIGN KEY (`package_id`) REFERENCES `travel_packages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  8. Itineraries (header + items)
-- ============================================================
CREATE TABLE IF NOT EXISTS `itineraries` (
  `id`          INT         NOT NULL AUTO_INCREMENT,
  `user_id`     INT         NOT NULL,
  `destination` VARCHAR(160) NOT NULL,
  `days`        INT         NOT NULL,
  `created_at`  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_itin_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `itinerary_items` (
  `id`           INT         NOT NULL AUTO_INCREMENT,
  `itinerary_id` INT         NOT NULL,
  `day`          INT         NOT NULL,
  `time`         VARCHAR(20) NOT NULL,
  `title`        VARCHAR(180) NOT NULL,
  `description`  TEXT        DEFAULT NULL,
  `sort_order`   INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_itin` (`itinerary_id`),
  CONSTRAINT `fk_itin_items_itin` FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  Optional: quick sanity check — list the table structure
-- ============================================================
-- DESCRIBE `users`;
