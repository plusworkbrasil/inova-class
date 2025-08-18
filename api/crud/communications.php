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
    case 'DELETE':
        handleDelete($db, $user);
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
}

function handleGet($db, $user) {
    if ($user->role === 'admin' || $user->role === 'secretary') {
        // Admin/secretário vê todas
        $query = "SELECT * FROM communications ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
    } else {
        // Outros veem apenas publicadas direcionadas ao seu papel
        $query = "SELECT * FROM communications WHERE is_published = 1 AND published_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW()) AND JSON_CONTAINS(target_audience, ?) ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(1, json_encode($user->role));
    }
    
    $stmt->execute();
    echo json_encode($stmt->fetchAll());
}

function handlePost($db, $user) {
    if ($user->role !== 'admin' && $user->role !== 'secretary' && $user->role !== 'instructor') {
        http_response_code(403);
        echo json_encode(['error' => 'Acesso negado']);
        return;
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $id = uniqid();
    $publishedAt = $data['is_published'] ? date('Y-m-d H:i:s') : null;
    
    $query = "INSERT INTO communications (id, title, content, priority, target_audience, type, is_published, published_at, expires_at, author_id) VALUES (:id, :title, :content, :priority, :target_audience, :type, :is_published, :published_at, :expires_at, :author_id)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    $stmt->bindParam(':title', $data['title']);
    $stmt->bindParam(':content', $data['content']);
    $stmt->bindParam(':priority', $data['priority'] ?? 'normal');
    $stmt->bindParam(':target_audience', json_encode($data['target_audience']));
    $stmt->bindParam(':type', $data['type'] ?? 'announcement');
    $stmt->bindParam(':is_published', $data['is_published'] ?? 0);
    $stmt->bindParam(':published_at', $publishedAt);
    $stmt->bindParam(':expires_at', $data['expires_at']);
    $stmt->bindParam(':author_id', $user->id);
    
    if ($stmt->execute()) {
        echo json_encode(['id' => $id, 'message' => 'Comunicação criada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao criar comunicação']);
    }
}

function handlePut($db, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    // Verificar se é autor ou admin/secretário
    if ($user->role !== 'admin' && $user->role !== 'secretary') {
        $checkQuery = "SELECT author_id FROM communications WHERE id = :id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        $comm = $checkStmt->fetch();
        
        if (!$comm || $comm['author_id'] !== $user->id) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
    }
    
    $fields = [];
    $params = [':id' => $id];
    
    foreach (['title', 'content', 'priority', 'expires_at', 'is_published'] as $field) {
        if (isset($data[$field])) {
            if ($field === 'target_audience') {
                $fields[] = "$field = :$field";
                $params[":$field"] = json_encode($data[$field]);
            } else {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
    }
    
    // Se publicando, definir data
    if (isset($data['is_published']) && $data['is_published']) {
        $fields[] = "published_at = :published_at";
        $params[":published_at"] = date('Y-m-d H:i:s');
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nenhum campo para atualizar']);
        return;
    }
    
    $query = "UPDATE communications SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        echo json_encode(['message' => 'Comunicação atualizada com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao atualizar comunicação']);
    }
}

function handleDelete($db, $user) {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    // Verificar se é autor ou admin/secretário
    if ($user->role !== 'admin' && $user->role !== 'secretary') {
        $checkQuery = "SELECT author_id FROM communications WHERE id = :id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        $comm = $checkStmt->fetch();
        
        if (!$comm || $comm['author_id'] !== $user->id) {
            http_response_code(403);
            echo json_encode(['error' => 'Acesso negado']);
            return;
        }
    }
    
    $query = "DELETE FROM communications WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);
    
    if ($stmt->execute()) {
        echo json_encode(['message' => 'Comunicação excluída com sucesso']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao excluir comunicação']);
    }
}
?>