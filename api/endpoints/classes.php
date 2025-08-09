<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCORSHeaders();

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];

try {
    $database = new Database();
    $db = $database->connect();

    switch ($method) {
        case 'GET':
            handleGetClasses($db, $user);
            break;
        case 'POST':
            handleCreateClass($db, $user);
            break;
        case 'PUT':
            handleUpdateClass($db, $user);
            break;
        case 'DELETE':
            handleDeleteClass($db, $user);
            break;
        default:
            sendError('Método não permitido', 405);
    }
} catch (Exception $e) {
    sendError('Erro interno: ' . $e->getMessage(), 500);
}

function handleGetClasses($db, $user) {
    // Admin e secretário podem ver todas as classes
    // Instrutor pode ver todas as classes
    // Estudante pode ver apenas sua classe
    
    if (in_array($user['role'], ['admin', 'secretary', 'instructor'])) {
        $query = "SELECT c.*, p.name as teacher_name 
                  FROM classes c 
                  LEFT JOIN profiles p ON c.teacher_id = p.id 
                  ORDER BY c.name, c.grade";
        $stmt = $db->prepare($query);
    } else {
        // Estudante - apenas sua classe
        $query = "SELECT c.*, p.name as teacher_name 
                  FROM classes c 
                  LEFT JOIN profiles p ON c.teacher_id = p.id 
                  WHERE c.id = (SELECT class_id FROM profiles WHERE id = :user_id)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user['user_id']);
    }
    
    $stmt->execute();
    $classes = $stmt->fetchAll();
    
    sendResponse($classes);
}

function handleCreateClass($db, $user) {
    // Apenas admin e secretário podem criar classes
    if (!in_array($user['role'], ['admin', 'secretary'])) {
        sendError('Acesso negado', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['name']) || !isset($input['grade'])) {
        sendError('Nome e série são obrigatórios');
    }
    
    $query = "INSERT INTO classes (name, grade, teacher_id, student_count, year) 
              VALUES (:name, :grade, :teacher_id, :student_count, :year)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':name', $input['name']);
    $stmt->bindParam(':grade', $input['grade']);
    $stmt->bindParam(':teacher_id', $input['teacher_id'] ?? null);
    $stmt->bindParam(':student_count', $input['student_count'] ?? 0);
    $stmt->bindParam(':year', $input['year'] ?? date('Y'));
    
    if ($stmt->execute()) {
        $classId = $db->lastInsertId();
        sendResponse(['success' => true, 'id' => $classId, 'message' => 'Classe criada com sucesso'], 201);
    } else {
        sendError('Erro ao criar classe');
    }
}

function handleUpdateClass($db, $user) {
    // Apenas admin e secretário podem atualizar classes
    if (!in_array($user['role'], ['admin', 'secretary'])) {
        sendError('Acesso negado', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        sendError('ID da classe é obrigatório');
    }
    
    $fields = [];
    $params = [];
    
    if (isset($input['name'])) {
        $fields[] = 'name = :name';
        $params[':name'] = $input['name'];
    }
    if (isset($input['grade'])) {
        $fields[] = 'grade = :grade';
        $params[':grade'] = $input['grade'];
    }
    if (isset($input['teacher_id'])) {
        $fields[] = 'teacher_id = :teacher_id';
        $params[':teacher_id'] = $input['teacher_id'];
    }
    if (isset($input['student_count'])) {
        $fields[] = 'student_count = :student_count';
        $params[':student_count'] = $input['student_count'];
    }
    
    if (empty($fields)) {
        sendError('Nenhum campo para atualizar');
    }
    
    $query = "UPDATE classes SET " . implode(', ', $fields) . " WHERE id = :id";
    $params[':id'] = $input['id'];
    
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        sendResponse(['success' => true, 'message' => 'Classe atualizada com sucesso']);
    } else {
        sendError('Erro ao atualizar classe');
    }
}

function handleDeleteClass($db, $user) {
    // Apenas admin pode deletar classes
    if ($user['role'] !== 'admin') {
        sendError('Acesso negado', 403);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        sendError('ID da classe é obrigatório');
    }
    
    $query = "DELETE FROM classes WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $input['id']);
    
    if ($stmt->execute()) {
        sendResponse(['success' => true, 'message' => 'Classe excluída com sucesso']);
    } else {
        sendError('Erro ao excluir classe');
    }
}
?>