<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = JWTHandler::validateToken();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido']);
    exit;
}

$database = new Database();
$db = $database->getConnection();

switch ($method) {
    case 'GET':
        handleGet($db, $user);
        break;
    case 'POST':
        handlePost($db, $user);
        break;
    case 'PUT':
        handlePut($db, $user);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
}

function handleGet($db, $user) {
    if ($user->role === 'admin' || $user->role === 'secretary') {
        $query = "SELECT * FROM declarations ORDER BY requested_at DESC";
        $stmt = $db->prepare($query);
    } else if ($user->role === 'student') {
        $query = "SELECT * FROM declarations WHERE student_id = :user_id ORDER BY requested_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user->id);
    } else {
        // Instrutores veem declarações médicas de suas matérias
        $query = "SELECT d.* FROM declarations d WHERE d.type = 'medical_certificate' ORDER BY d.requested_at DESC";
        $stmt = $db->prepare($query);
    }
    
    $stmt->execute();
    echo json_encode($stmt->fetchAll());
}

function handlePost($db, $user) {
    if ($user->role !== 'student') {
        http_response_code(403);
        echo json_encode(['error' => 'Apenas estudantes podem solicitar declarações']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = uniqid();
    
    $query = "INSERT INTO declarations (id, student_id, title, type, purpose, description, subject_id, urgency) VALUES (:id, :student_id, :title, :type, :purpose, :description, :subject_id, :urgency)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':student_id', $user->id);
    $stmt->bindParam(':title', $data['title']);
    $stmt->bindParam(':type', $data['type']);
    $stmt->bindParam(':purpose', $data['purpose']);
    $stmt->bindParam(':description', $data['description']);
    $stmt->bindParam(':subject_id', $data['subject_id']);
    $stmt->bindParam(':urgency', $data['urgency'] ?? 'normal');
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $id, 'message' => 'Declaração solicitada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao solicitar declaração']);
    }
}

function handlePut($db, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    if ($user->role === 'admin' || $user->role === 'secretary') {
        // Admin/secretário pode atualizar qualquer coisa
        $fields = [];
        $params = [':id' => $id];
        
        foreach (['status', 'processed_by', 'processed_at', 'delivery_date', 'observations', 'file_path'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                if ($field === 'processed_at' && $data[$field] === true) {
                    $params[":$field"] = date('Y-m-d H:i:s');
                } else if ($field === 'processed_by' && empty($data[$field])) {
                    $params[":$field"] = $user->id;
                } else {
                    $params[":$field"] = $data[$field];
                }
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo para atualizar']);
            return;
        }
        
        $query = "UPDATE declarations SET " . implode(', ', $fields) . " WHERE id = :id";
    } else if ($user->role === 'student') {
        // Estudante só pode atualizar suas próprias declarações pendentes
        $checkQuery = "SELECT status FROM declarations WHERE id = :id AND student_id = :user_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->bindParam(':user_id', $user->id);
        $checkStmt->execute();
        $decl = $checkStmt->fetch();
        
        if (!$decl || $decl['status'] !== 'pending') {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
        
        $fields = [];
        $params = [':id' => $id];
        
        foreach (['title', 'purpose', 'description', 'subject_id', 'urgency'] as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum campo para atualizar']);
            return;
        }
        
        $query = "UPDATE declarations SET " . implode(', ', $fields) . " WHERE id = :id AND student_id = :user_id";
        $params[':user_id'] = $user->id;
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['message' => 'Declaração atualizada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar declaração']);
    }
}
?>