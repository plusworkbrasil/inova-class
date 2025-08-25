<?php
/**
 * Instalador Automático para cPanel
 * Sistema Escolar - Configuração para Hospedagem Compartilhada
 */

// Verificar se já foi executado
if (file_exists(__DIR__ . '/api/config/env.php') && defined('JWT_SECRET') && !empty(JWT_SECRET)) {
    echo "⚠️ O sistema já parece estar instalado. Delete este arquivo se quiser reinstalar.";
    exit;
}

// Processar formulário
$step = $_GET['step'] ?? 'start';
$errors = [];
$success = [];

if ($_POST) {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'test_db':
                $result = testDatabaseConnection($_POST);
                if ($result['success']) {
                    $success[] = $result['message'];
                    $step = 'create_db';
                } else {
                    $errors[] = $result['message'];
                }
                break;
                
            case 'create_db':
                $result = createDatabase($_POST);
                if ($result['success']) {
                    $success[] = $result['message'];
                    $step = 'import_schema';
                } else {
                    $errors[] = $result['message'];
                }
                break;
                
            case 'import_schema':
                $result = importSchema($_POST);
                if ($result['success']) {
                    $success[] = $result['message'];
                    $step = 'configure_env';
                } else {
                    $errors[] = $result['message'];
                }
                break;
                
            case 'configure_env':
                $result = configureEnvironment($_POST);
                if ($result['success']) {
                    $success[] = $result['message'];
                    $step = 'complete';
                } else {
                    $errors[] = $result['message'];
                }
                break;
        }
    }
}

function testDatabaseConnection($data) {
    try {
        $host = $data['db_host'] ?? 'localhost';
        $name = $data['db_name'] ?? '';
        $user = $data['db_user'] ?? '';
        $pass = $data['db_pass'] ?? '';
        
        if (empty($name) || empty($user)) {
            return ['success' => false, 'message' => 'Dados do banco obrigatórios não preenchidos'];
        }
        
        $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        return ['success' => true, 'message' => 'Conexão com banco de dados estabelecida com sucesso!'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Erro de conexão: ' . $e->getMessage()];
    }
}

function createDatabase($data) {
    // Para cPanel, o banco já deve existir, apenas validamos
    return testDatabaseConnection($data);
}

function importSchema($data) {
    try {
        $host = $data['db_host'];
        $name = $data['db_name'];
        $user = $data['db_user'];
        $pass = $data['db_pass'];
        
        $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        // Ler e executar schema.sql
        $schema = file_get_contents(__DIR__ . '/schema.sql');
        if (!$schema) {
            return ['success' => false, 'message' => 'Arquivo schema.sql não encontrado'];
        }
        
        // Executar comandos SQL
        $pdo->exec($schema);
        
        return ['success' => true, 'message' => 'Schema importado com sucesso!'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Erro ao importar schema: ' . $e->getMessage()];
    }
}

function configureEnvironment($data) {
    try {
        // Gerar chave JWT segura
        $jwtSecret = bin2hex(random_bytes(32));
        
        // Preparar domínios permitidos
        $domain = $data['domain'] ?? $_SERVER['HTTP_HOST'] ?? '';
        $allowedOrigins = [
            "https://$domain",
            "https://www.$domain"
        ];
        
        // Configurar env.php
        $envContent = "<?php\n";
        $envContent .= "// Configurações de ambiente para produção cPanel\n\n";
        $envContent .= "// Configurações do banco de dados\n";
        $envContent .= "define('DB_HOST', '" . addslashes($data['db_host']) . "');\n";
        $envContent .= "define('DB_NAME', '" . addslashes($data['db_name']) . "');\n";
        $envContent .= "define('DB_USER', '" . addslashes($data['db_user']) . "');\n";
        $envContent .= "define('DB_PASS', '" . addslashes($data['db_pass']) . "');\n\n";
        $envContent .= "// Chave JWT\n";
        $envContent .= "define('JWT_SECRET', '$jwtSecret');\n\n";
        $envContent .= "// Configurações gerais\n";
        $envContent .= "define('ENVIRONMENT', 'production');\n";
        $envContent .= "define('DEBUG_MODE', false);\n\n";
        $envContent .= "// URLs permitidas para CORS\n";
        $envContent .= "define('ALLOWED_ORIGINS', " . var_export($allowedOrigins, true) . ");\n\n";
        $envContent .= "// Configurações de segurança\n";
        $envContent .= "define('MAX_LOGIN_ATTEMPTS', 5);\n";
        $envContent .= "define('LOGIN_LOCKOUT_TIME', 900);\n";
        $envContent .= "define('JWT_EXPIRATION', 3600);\n\n";
        $envContent .= "?>";
        
        // Criar diretório se não existir
        if (!is_dir(__DIR__ . '/api/config')) {
            mkdir(__DIR__ . '/api/config', 0755, true);
        }
        
        file_put_contents(__DIR__ . '/api/config/env.php', $envContent);
        
        // Copiar arquivos de produção
        if (file_exists(__DIR__ . '/api/config/database_cpanel.php')) {
            copy(__DIR__ . '/api/config/database_cpanel.php', __DIR__ . '/api/config/database.php');
        }
        
        if (file_exists(__DIR__ . '/api/config/cors_cpanel.php')) {
            copy(__DIR__ . '/api/config/cors_cpanel.php', __DIR__ . '/api/config/cors.php');
        }
        
        if (file_exists(__DIR__ . '/api/utils/jwt_cpanel.php')) {
            copy(__DIR__ . '/api/utils/jwt_cpanel.php', __DIR__ . '/api/utils/jwt.php');
        }
        
        return ['success' => true, 'message' => 'Configuração concluída com sucesso!'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Erro na configuração: ' . $e->getMessage()];
    }
}

function checkComposer() {
    return file_exists(__DIR__ . '/api/vendor/firebase/php-jwt/src/JWT.php');
}

?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalador cPanel - Sistema Escolar</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .step { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .step.active { border-left: 4px solid #007bff; background: #e3f2fd; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .form-group { margin: 15px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input, .form-group select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        .btn:hover { background: #0056b3; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        .code { background: #f1f1f1; padding: 10px; border-radius: 4px; font-family: monospace; margin: 10px 0; }
        .requirements { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 4px; }
        .req-item { margin: 8px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
        .req-ok { color: green; }
        .req-error { color: red; }
    </style>
</head>
<body>

<div class="header">
    <h1>🏫 Sistema Escolar</h1>
    <h2>Instalador Automático para cPanel</h2>
    <p>Configure automaticamente o sistema para funcionar em hospedagem compartilhada</p>
</div>

<?php if ($errors): ?>
    <?php foreach ($errors as $error): ?>
        <div class="error">❌ <?= htmlspecialchars($error) ?></div>
    <?php endforeach; ?>
<?php endif; ?>

<?php if ($success): ?>
    <?php foreach ($success as $msg): ?>
        <div class="success">✅ <?= htmlspecialchars($msg) ?></div>
    <?php endforeach; ?>
<?php endif; ?>

<?php if ($step === 'start'): ?>
<div class="step active">
    <h3>📋 Verificações Iniciais</h3>
    <div class="requirements">
        <div class="req-item">
            <strong>PHP Version:</strong> 
            <span class="<?= version_compare(PHP_VERSION, '7.4.0', '>=') ? 'req-ok' : 'req-error' ?>">
                PHP <?= PHP_VERSION ?> <?= version_compare(PHP_VERSION, '7.4.0', '>=') ? '✓' : '✗ (Mínimo 7.4)' ?>
            </span>
        </div>
        <div class="req-item">
            <strong>PDO MySQL:</strong> 
            <span class="<?= extension_loaded('pdo_mysql') ? 'req-ok' : 'req-error' ?>">
                <?= extension_loaded('pdo_mysql') ? '✓ Disponível' : '✗ Não disponível' ?>
            </span>
        </div>
        <div class="req-item">
            <strong>JSON Support:</strong> 
            <span class="<?= extension_loaded('json') ? 'req-ok' : 'req-error' ?>">
                <?= extension_loaded('json') ? '✓ Disponível' : '✗ Não disponível' ?>
            </span>
        </div>
        <div class="req-item">
            <strong>Biblioteca JWT:</strong> 
            <span class="<?= checkComposer() ? 'req-ok' : 'req-error' ?>">
                <?= checkComposer() ? '✓ Instalada' : '✗ Não encontrada' ?>
            </span>
        </div>
    </div>
    
    <?php if (!checkComposer()): ?>
        <div class="warning">
            <h4>⚠️ Biblioteca JWT Necessária</h4>
            <p>Execute um dos comandos abaixo no cPanel File Manager ou via SSH:</p>
            <div class="code">
                # Via Composer (se disponível)<br>
                cd public_html<br>
                composer require firebase/php-jwt
            </div>
            <p><strong>OU</strong> faça download manual:</p>
            <div class="code">
                # Download manual da biblioteca JWT<br>
                # Extraia em: public_html/api/vendor/firebase/php-jwt/
            </div>
        </div>
    <?php else: ?>
        <form method="post">
            <input type="hidden" name="action" value="test_db">
            <h4>🔧 Configuração do Banco de Dados</h4>
            <div class="form-group">
                <label>Host do Banco:</label>
                <input type="text" name="db_host" value="localhost" required>
            </div>
            <div class="form-group">
                <label>Nome do Banco:</label>
                <input type="text" name="db_name" placeholder="cpanel_user_escola" required>
                <small>Formato comum no cPanel: cpanel_usuario_nomedobanco</small>
            </div>
            <div class="form-group">
                <label>Usuário do Banco:</label>
                <input type="text" name="db_user" placeholder="cpanel_user" required>
            </div>
            <div class="form-group">
                <label>Senha do Banco:</label>
                <input type="password" name="db_pass" required>
            </div>
            <button type="submit" class="btn">Testar Conexão</button>
        </form>
    <?php endif; ?>
</div>

<?php elseif ($step === 'create_db'): ?>
<div class="step active">
    <h3>🗄️ Configuração do Banco</h3>
    <p>Conexão estabelecida! Agora vamos configurar o banco de dados.</p>
    <form method="post">
        <input type="hidden" name="action" value="import_schema">
        <input type="hidden" name="db_host" value="<?= htmlspecialchars($_POST['db_host']) ?>">
        <input type="hidden" name="db_name" value="<?= htmlspecialchars($_POST['db_name']) ?>">
        <input type="hidden" name="db_user" value="<?= htmlspecialchars($_POST['db_user']) ?>">
        <input type="hidden" name="db_pass" value="<?= htmlspecialchars($_POST['db_pass']) ?>">
        <button type="submit" class="btn">Importar Schema</button>
    </form>
</div>

<?php elseif ($step === 'import_schema'): ?>
<div class="step active">
    <h3>⚙️ Configuração Final</h3>
    <p>Schema importado! Configure os detalhes finais:</p>
    <form method="post">
        <input type="hidden" name="action" value="configure_env">
        <input type="hidden" name="db_host" value="<?= htmlspecialchars($_POST['db_host']) ?>">
        <input type="hidden" name="db_name" value="<?= htmlspecialchars($_POST['db_name']) ?>">
        <input type="hidden" name="db_user" value="<?= htmlspecialchars($_POST['db_user']) ?>">
        <input type="hidden" name="db_pass" value="<?= htmlspecialchars($_POST['db_pass']) ?>">
        <div class="form-group">
            <label>Domínio da Aplicação:</label>
            <input type="text" name="domain" value="<?= $_SERVER['HTTP_HOST'] ?>" required>
            <small>Ex: meusite.com.br (sem http/https)</small>
        </div>
        <button type="submit" class="btn">Finalizar Instalação</button>
    </form>
</div>

<?php elseif ($step === 'complete'): ?>
<div class="step active">
    <h3>🎉 Instalação Concluída!</h3>
    <div class="success">
        <h4>✅ Sistema instalado com sucesso!</h4>
        <p><strong>Próximos passos:</strong></p>
        <ol>
            <li>Delete este arquivo de instalação (<code>install_cpanel.php</code>)</li>
            <li>Configure o frontend para apontar para sua API</li>
            <li>Faça o build e upload do frontend</li>
            <li>Acesse o sistema com as credenciais padrão</li>
        </ol>
    </div>
    
    <div class="warning">
        <h4>🔐 Credenciais Padrão</h4>
        <div class="code">
            Email: admin@escola.com<br>
            Senha: admin123
        </div>
        <p><strong>⚠️ ALTERE ESTAS CREDENCIAIS IMEDIATAMENTE APÓS O PRIMEIRO LOGIN!</strong></p>
    </div>
    
    <div class="code">
        <h4>📝 Configuração do Frontend:</h4>
        Edite <strong>src/lib/api.ts</strong>:<br><br>
        const API_BASE_URL = 'https://<?= $_SERVER['HTTP_HOST'] ?>/api';
    </div>
    
    <form method="post" action="<?= $_SERVER['PHP_SELF'] ?>?action=delete_installer">
        <button type="submit" class="btn btn-danger" onclick="return confirm('Tem certeza que deseja deletar o instalador?')">
            🗑️ Deletar Instalador
        </button>
    </form>
</div>
<?php endif; ?>

<?php if (isset($_GET['action']) && $_GET['action'] === 'delete_installer'): ?>
    <?php if (unlink(__FILE__)): ?>
        <div class="success">✅ Instalador removido com sucesso!</div>
    <?php else: ?>
        <div class="error">❌ Erro ao remover instalador. Delete manualmente: <?= basename(__FILE__) ?></div>
    <?php endif; ?>
<?php endif; ?>

</body>
</html>