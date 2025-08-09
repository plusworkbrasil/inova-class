<?php
require_once '../config/database.php';
require_once '../utils/jwt.php';

setCORSHeaders();

try {
    $database = new Database();
    $db = $database->connect();

    // Verificar token JWT para algumas operações
    $headers = getallheaders();
    $token = null;
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    }

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Buscar comunicações
            $query = "SELECT c.*, p.name as author_name 
                      FROM communications c 
                      LEFT JOIN profiles p ON c.author_id = p.id 
                      ORDER BY c.created_at DESC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            $communications = $stmt->fetchAll();
            
            sendResponse($communications);
            break;
            
        case 'POST':
            // Verificar autenticação
            if (!$token || !validateJWT($token)) {
                sendError('Token inválido ou não fornecido', 401);
            }
            
            $payload = decodeJWT($token);
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['title']) || !isset($input['content'])) {
                sendError('Título e conteúdo são obrigatórios');
            }
            
            // Inserir comunicação
            $query = "INSERT INTO communications (
                        title, content, type, target_audience, priority, 
                        author_id, is_published, published_at, expires_at, created_at
                      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = $db->prepare($query);
            $success = $stmt->execute([
                $input['title'],
                $input['content'],
                $input['type'] ?? 'announcement',
                json_encode($input['target_audience'] ?? ['student']),
                $input['priority'] ?? 'normal',
                $payload['user_id'],
                $input['is_published'] ?? true,
                $input['published_at'] ?? date('Y-m-d H:i:s'),
                $input['expires_at'] ?? null
            ]);
            
            if ($success) {
                sendResponse([
                    'success' => true,
                    'id' => $db->lastInsertId(),
                    'message' => 'Comunicação criada com sucesso'
                ]);
            } else {
                sendError('Erro ao criar comunicação');
            }
            break;
            
        case 'PUT':
            // Verificar autenticação
            if (!$token || !validateJWT($token)) {
                sendError('Token inválido ou não fornecido', 401);
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                sendError('ID é obrigatório para atualização');
            }
            
            // Atualizar comunicação
            $query = "UPDATE communications SET 
                        title = ?, content = ?, type = ?, target_audience = ?, 
                        priority = ?, is_published = ?, expires_at = ?, updated_at = NOW()
                      WHERE id = ?";
            
            $stmt = $db->prepare($query);
            $success = $stmt->execute([
                $input['title'],
                $input['content'],
                $input['type'] ?? 'announcement',
                json_encode($input['target_audience'] ?? ['student']),
                $input['priority'] ?? 'normal',
                $input['is_published'] ?? true,
                $input['expires_at'] ?? null,
                $input['id']
            ]);
            
            if ($success) {
                sendResponse(['success' => true, 'message' => 'Comunicação atualizada']);
            } else {
                sendError('Erro ao atualizar comunicação');
            }
            break;
            
        case 'DELETE':
            // Verificar autenticação
            if (!$token || !validateJWT($token)) {
                sendError('Token inválido ou não fornecido', 401);
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                sendError('ID é obrigatório para exclusão');
            }
            
            // Excluir comunicação
            $query = "DELETE FROM communications WHERE id = ?";
            $stmt = $db->prepare($query);
            $success = $stmt->execute([$input['id']]);
            
            if ($success) {
                sendResponse(['success' => true, 'message' => 'Comunicação excluída']);
            } else {
                sendError('Erro ao excluir comunicação');
            }
            break;
            
        default:
            sendError('Método não permitido', 405);
    }
    
} catch (Exception $e) {
    sendError('Erro interno do servidor: ' . $e->getMessage(), 500);
}
?>