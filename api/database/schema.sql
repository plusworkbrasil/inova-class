-- Criação do banco de dados para o sistema escolar
-- Execute este script no seu MySQL/MariaDB

CREATE DATABASE IF NOT EXISTS escola_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE escola_db;

-- Tabela de usuários (substitui auth.users do Supabase)
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL
);

-- Enum para roles (usando ENUM do MySQL)
-- CREATE TYPE app_role AS ENUM ('admin', 'secretary', 'instructor', 'student');

-- Tabela de perfis (substitui public.profiles do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('admin', 'secretary', 'instructor', 'student') DEFAULT 'student',
    student_id VARCHAR(50) NULL,
    instructor_subjects JSON NULL,
    phone VARCHAR(20) NULL,
    cep VARCHAR(10) NULL,
    street VARCHAR(255) NULL,
    number VARCHAR(20) NULL,
    complement VARCHAR(255) NULL,
    neighborhood VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(50) NULL,
    avatar TEXT NULL,
    cpf VARCHAR(14) NULL,
    full_name VARCHAR(255) NULL,
    photo TEXT NULL,
    parent_name VARCHAR(255) NULL,
    escolaridade VARCHAR(100) NULL,
    guardian_name VARCHAR(255) NULL,
    guardian_phone VARCHAR(20) NULL,
    teacher_id VARCHAR(50) NULL,
    class_id CHAR(36) NULL,
    enrollment_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de classes
CREATE TABLE IF NOT EXISTS classes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    teacher_id CHAR(36) NULL,
    student_count INT DEFAULT 0,
    year INT DEFAULT YEAR(NOW()),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de matérias
CREATE TABLE IF NOT EXISTS subjects (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    class_id CHAR(36) NULL,
    teacher_id CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de notas
CREATE TABLE IF NOT EXISTS grades (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id CHAR(36) NOT NULL,
    subject_id CHAR(36) NOT NULL,
    teacher_id CHAR(36) NOT NULL,
    value DECIMAL(4,2) NOT NULL,
    max_value DECIMAL(4,2) DEFAULT 10.00,
    type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de frequência
CREATE TABLE IF NOT EXISTS attendance (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id CHAR(36) NOT NULL,
    class_id CHAR(36) NOT NULL,
    subject_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    is_present BOOLEAN NOT NULL,
    justification TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Tabela de comunicações/avisos
CREATE TABLE IF NOT EXISTS communications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id CHAR(36) NOT NULL,
    target_audience JSON NOT NULL, -- Array de roles
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    type VARCHAR(50) NOT NULL,
    attachments JSON NULL,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de declarações
CREATE TABLE IF NOT EXISTS declarations (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id CHAR(36) NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    purpose TEXT NULL,
    description TEXT NULL,
    subject_id VARCHAR(100) NULL,
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    urgency ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    processed_by CHAR(36) NULL,
    processed_at TIMESTAMP NULL,
    file_path TEXT NULL,
    delivery_date DATE NULL,
    observations TEXT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela de evasões
CREATE TABLE IF NOT EXISTS evasions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    student_id CHAR(36) NOT NULL,
    date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('active', 'resolved', 'cancelled') DEFAULT 'active',
    reported_by CHAR(36) NOT NULL,
    observations TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_class_id ON profiles(class_id);
CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_subjects_class_id ON subjects(class_id);
CREATE INDEX idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_subject_id ON grades(subject_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_communications_published ON communications(is_published, published_at);
CREATE INDEX idx_declarations_student_id ON declarations(student_id);
CREATE INDEX idx_declarations_status ON declarations(status);
CREATE INDEX idx_evasions_student_id ON evasions(student_id);

-- Usuário admin padrão (senha: admin123)
-- Senha hash gerada com password_hash('admin123', PASSWORD_DEFAULT)
INSERT INTO users (id, email, password_hash, email_verified) VALUES 
('admin-user-id-1234', 'admin@escola.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);

INSERT INTO profiles (id, name, email, role) VALUES 
('admin-user-id-1234', 'Administrador', 'admin@escola.com', 'admin');