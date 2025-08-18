-- Schema MySQL para migração do Supabase
-- Execute este arquivo no phpMyAdmin do seu cPanel

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Criação das tabelas
CREATE TABLE `profiles` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'secretary', 'instructor', 'student') NOT NULL DEFAULT 'student',
  `phone` VARCHAR(20) DEFAULT NULL,
  `cep` VARCHAR(10) DEFAULT NULL,
  `street` VARCHAR(255) DEFAULT NULL,
  `number` VARCHAR(50) DEFAULT NULL,
  `complement` VARCHAR(255) DEFAULT NULL,
  `neighborhood` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `state` VARCHAR(50) DEFAULT NULL,
  `avatar` TEXT DEFAULT NULL,
  `student_id` VARCHAR(50) DEFAULT NULL,
  `class_id` VARCHAR(36) DEFAULT NULL,
  `enrollment_date` DATE DEFAULT NULL,
  `cpf` VARCHAR(14) DEFAULT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `photo` TEXT DEFAULT NULL,
  `parent_name` VARCHAR(255) DEFAULT NULL,
  `escolaridade` VARCHAR(255) DEFAULT NULL,
  `guardian_name` VARCHAR(255) DEFAULT NULL,
  `guardian_phone` VARCHAR(20) DEFAULT NULL,
  `teacher_id` VARCHAR(50) DEFAULT NULL,
  `instructor_subjects` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `classes` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `grade` VARCHAR(50) NOT NULL,
  `year` INT NOT NULL DEFAULT (YEAR(NOW())),
  `teacher_id` VARCHAR(36) DEFAULT NULL,
  `student_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `subjects` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `class_id` VARCHAR(36) DEFAULT NULL,
  `teacher_id` VARCHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `attendance` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `class_id` VARCHAR(36) NOT NULL,
  `subject_id` VARCHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `is_present` BOOLEAN NOT NULL,
  `justification` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `grades` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `subject_id` VARCHAR(36) NOT NULL,
  `value` DECIMAL(5,2) NOT NULL,
  `max_value` DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  `type` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `teacher_id` VARCHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `communications` (
  `id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  `target_audience` JSON NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `is_published` BOOLEAN DEFAULT FALSE,
  `published_at` TIMESTAMP NULL DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `author_id` VARCHAR(36) NOT NULL,
  `attachments` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `declarations` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `purpose` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `subject_id` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  `urgency` ENUM('normal', 'high', 'urgent') DEFAULT 'normal',
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `processed_at` TIMESTAMP NULL DEFAULT NULL,
  `processed_by` VARCHAR(36) DEFAULT NULL,
  `file_path` TEXT DEFAULT NULL,
  `delivery_date` DATE DEFAULT NULL,
  `observations` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `evasions` (
  `id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `reason` TEXT NOT NULL,
  `status` ENUM('active', 'resolved', 'pending') NOT NULL DEFAULT 'active',
  `reported_by` VARCHAR(36) NOT NULL,
  `observations` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Criar usuário admin padrão (senha: admin123)
INSERT INTO `profiles` (`id`, `name`, `email`, `password`, `role`) VALUES
(UUID(), 'Administrador', 'admin@escola.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

COMMIT;