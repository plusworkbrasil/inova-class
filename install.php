<?php
// Instalador Automático - Sistema de Gestão Escolar
// Execute este arquivo acessando: http://localhost/escola-app/install.php

$step = $_GET['step'] ?? 1;
$error = '';
$success = '';

// Função para verificar se XAMPP está rodando
function checkXAMPP() {
    $apache = @file_get_contents('http://localhost/dashboard/');
    $mysql = @mysqli_connect('localhost', 'root', '');
    
    return [
        'apache' => $apache !== false,
        'mysql' => $mysql !== false
    ];
}

// Função para verificar dependências PHP
function checkPHPRequirements() {
    return [
        'php_version' => version_compare(PHP_VERSION, '7.4.0', '>='),
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'json' => extension_loaded('json'),
        'openssl' => extension_loaded('openssl')
    ];
}

// Função para criar banco de dados
function createDatabase() {
    try {
        $conn = new PDO("mysql:host=localhost", "root", "");
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Criar banco
        $conn->exec("CREATE DATABASE IF NOT EXISTS escola_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        return true;
    } catch(PDOException $e) {
        return "Erro ao criar banco: " . $e->getMessage();
    }
}

// Função para importar schema
function importSchema() {
    try {
        $conn = new PDO("mysql:host=localhost;dbname=escola_db", "root", "");
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $schema = file_get_contents(__DIR__ . '/schema.sql');
        if (!$schema) {
            return "Arquivo schema.sql não encontrado";
        }
        
        // Executar SQL
        $conn->exec($schema);
        
        return true;
    } catch(PDOException $e) {
        return "Erro ao importar schema: " . $e->getMessage();
    }
}

// Função para verificar se JWT está instalado
function checkJWT() {
    return file_exists(__DIR__ . '/api/vendor/firebase/php-jwt/src/JWT.php');
}

// Função para gerar chave JWT segura
function generateJWTKey() {
    return bin2hex(random_bytes(32));
}

// Função para configurar JWT
function configureJWT($newKey) {
    $jwtFile = __DIR__ . '/api/utils/jwt.php';
    $content = file_get_contents($jwtFile);
    
    $content = str_replace(
        'private static $secret_key = "sua_chave_secreta_super_forte_aqui";',
        'private static $secret_key = "' . $newKey . '";',
        $content
    );
    
    return file_put_contents($jwtFile, $content);
}

// Processar formulários
if ($_POST) {
    switch ($_POST['action']) {
        case 'create_db':
            $result = createDatabase();
            if ($result === true) {
                $success = "Banco de dados criado com sucesso!";
                $step = 3;
            } else {
                $error = $result;
            }
            break;
            
        case 'import_schema':
            $result = importSchema();
            if ($result === true) {
                $success = "Schema importado com sucesso!";
                $step = 4;
            } else {
                $error = $result;
            }
            break;
            
        case 'configure_jwt':
            $newKey = generateJWTKey();
            if (configureJWT($newKey)) {
                $success = "Chave JWT configurada com sucesso!";
                $step = 5;
            } else {
                $error = "Erro ao configurar JWT";
            }
            break;
    }
}

?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalador - Sistema de Gestão Escolar</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .step { 
            background: #007cba; 
            color: white; 
            padding: 10px 20px; 
            border-radius: 5px; 
            margin-bottom: 20px; 
        }
        .success { 
            background: #4CAF50; 
            color: white; 
            padding: 10px; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
        .error { 
            background: #f44336; 
            color: white; 
            padding: 10px; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
        .warning { 
            background: #ff9800; 
            color: white; 
            padding: 10px; 
            border-radius: 5px; 
            margin: 10px 0; 
        }
        .check { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #eee; 
        }
        .status { 
            font-weight: bold; 
        }
        .ok { color: #4CAF50; }
        .fail { color: #f44336; }
        button { 
            background: #007cba; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            font-size: 16px; 
            margin: 10px 5px 10px 0; 
        }
        button:hover { background: #005a87; }
        .disabled { background: #ccc; cursor: not-allowed; }
        .code { 
            background: #f4f4f4; 
            padding: 15px; 
            border-radius: 5px; 
            font-family: monospace; 
            margin: 10px 0; 
            border-left: 4px solid #007cba; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Instalador - Sistema de Gestão Escolar</h1>
        
        <div class="step">Passo <?= $step ?> de 5</div>
        
        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success"><?= htmlspecialchars($success) ?></div>
        <?php endif; ?>
        
        <?php if ($step == 1): ?>
            <h2>1. Verificação do Ambiente</h2>
            
            <?php 
            $xampp = checkXAMPP();
            $php = checkPHPRequirements();
            $allOk = true;
            ?>
            
            <h3>XAMPP Services</h3>
            <div class="check">
                <span>Apache Server</span>
                <span class="status <?= $xampp['apache'] ? 'ok' : 'fail' ?>"><?= $xampp['apache'] ? '✓ Rodando' : '✗ Parado' ?></span>
            </div>
            <div class="check">
                <span>MySQL Server</span>
                <span class="status <?= $xampp['mysql'] ? 'ok' : 'fail' ?>"><?= $xampp['mysql'] ? '✓ Rodando' : '✗ Parado' ?></span>
            </div>
            
            <h3>PHP Requirements</h3>
            <div class="check">
                <span>PHP Version (>= 7.4)</span>
                <span class="status <?= $php['php_version'] ? 'ok' : 'fail' ?>"><?= $php['php_version'] ? '✓ ' . PHP_VERSION : '✗ ' . PHP_VERSION ?></span>
            </div>
            <div class="check">
                <span>PDO Extension</span>
                <span class="status <?= $php['pdo'] ? 'ok' : 'fail' ?>"><?= $php['pdo'] ? '✓ Instalado' : '✗ Não instalado' ?></span>
            </div>
            <div class="check">
                <span>PDO MySQL Extension</span>
                <span class="status <?= $php['pdo_mysql'] ? 'ok' : 'fail' ?>"><?= $php['pdo_mysql'] ? '✓ Instalado' : '✗ Não instalado' ?></span>
            </div>
            <div class="check">
                <span>JSON Extension</span>
                <span class="status <?= $php['json'] ? 'ok' : 'fail' ?>"><?= $php['json'] ? '✓ Instalado' : '✗ Não instalado' ?></span>
            </div>
            <div class="check">
                <span>OpenSSL Extension</span>
                <span class="status <?= $php['openssl'] ? 'ok' : 'fail' ?>"><?= $php['openssl'] ? '✓ Instalado' : '✗ Não instalado' ?></span>
            </div>
            
            <?php 
            $allOk = $xampp['apache'] && $xampp['mysql'] && $php['php_version'] && $php['pdo'] && $php['pdo_mysql'];
            
            if (!$allOk): ?>
                <div class="error">
                    <strong>⚠️ Problemas encontrados!</strong><br>
                    - Verifique se Apache e MySQL estão rodando no XAMPP<br>
                    - Certifique-se de que todas as extensões PHP estão instaladas
                </div>
            <?php else: ?>
                <div class="success">✓ Todos os requisitos foram atendidos!</div>
                <a href="?step=2"><button>Próximo: Verificar JWT</button></a>
            <?php endif; ?>
            
        <?php elseif ($step == 2): ?>
            <h2>2. Verificação JWT</h2>
            
            <?php $hasJWT = checkJWT(); ?>
            
            <div class="check">
                <span>Firebase JWT Library</span>
                <span class="status <?= $hasJWT ? 'ok' : 'fail' ?>"><?= $hasJWT ? '✓ Instalado' : '✗ Não encontrado' ?></span>
            </div>
            
            <?php if (!$hasJWT): ?>
                <div class="warning">
                    <strong>🔧 JWT não encontrado!</strong><br>
                    Execute um dos comandos abaixo para instalar:
                </div>
                
                <h3>Opção 1: Com Composer</h3>
                <div class="code">
cd <?= __DIR__ ?>/api<br>
composer require firebase/php-jwt
                </div>
                
                <h3>Opção 2: Download Manual</h3>
                <div class="code">
1. Baixe: https://github.com/firebase/php-jwt/archive/refs/heads/main.zip<br>
2. Extraia para: <?= __DIR__ ?>/api/vendor/firebase/php-jwt/<br>
3. Certifique-se que JWT.php está em: api/vendor/firebase/php-jwt/src/
                </div>
                
                <button onclick="location.reload()">🔄 Verificar Novamente</button>
            <?php else: ?>
                <div class="success">✓ JWT encontrado e pronto para uso!</div>
                <a href="?step=3"><button>Próximo: Criar Banco</button></a>
            <?php endif; ?>
            
        <?php elseif ($step == 3): ?>
            <h2>3. Criação do Banco de Dados</h2>
            
            <p>Este passo criará o banco de dados <strong>escola_db</strong> no MySQL.</p>
            
            <form method="POST">
                <input type="hidden" name="action" value="create_db">
                <button type="submit">🗄️ Criar Banco escola_db</button>
            </form>
            
        <?php elseif ($step == 4): ?>
            <h2>4. Importar Schema</h2>
            
            <p>Agora vamos importar as tabelas e dados iniciais do sistema.</p>
            
            <form method="POST">
                <input type="hidden" name="action" value="import_schema">
                <button type="submit">📋 Importar Tabelas</button>
            </form>
            
        <?php elseif ($step == 5): ?>
            <h2>5. Configurar Segurança</h2>
            
            <p>Vamos gerar uma chave JWT segura para o sistema.</p>
            
            <form method="POST">
                <input type="hidden" name="action" value="configure_jwt">
                <button type="submit">🔐 Gerar Chave JWT</button>
            </form>
            
        <?php else: ?>
            <h2>🎉 Instalação Concluída!</h2>
            
            <div class="success">
                <strong>Sistema instalado com sucesso!</strong><br>
                Todas as configurações foram aplicadas.
            </div>
            
            <h3>📋 Próximos Passos:</h3>
            <ol>
                <li><strong>Instalar dependências do Frontend:</strong>
                    <div class="code">cd <?= __DIR__ ?><br>npm install</div>
                </li>
                <li><strong>Iniciar o servidor de desenvolvimento:</strong>
                    <div class="code">npm run dev</div>
                </li>
                <li><strong>Acessar o sistema:</strong>
                    <div class="code">Frontend: http://localhost:5173<br>API: http://localhost/escola-app/api</div>
                </li>
            </ol>
            
            <h3>🔐 Credenciais Padrão:</h3>
            <div class="code">
Email: admin@escola.com<br>
Senha: admin123
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Altere a senha do administrador após o primeiro login!
            </div>
            
            <h3>🔧 Links Úteis:</h3>
            <p>
                <a href="http://localhost:5173" target="_blank"><button>🚀 Abrir Sistema</button></a>
                <a href="http://localhost/phpmyadmin" target="_blank"><button>🗄️ phpMyAdmin</button></a>
                <button onclick="if(confirm('Tem certeza? O instalador será removido.')) location.href='?delete_installer=1'">🗑️ Remover Instalador</button>
            </p>
        <?php endif; ?>
        
        <hr style="margin: 30px 0;">
        <small style="color: #666;">
            📁 Localização: <?= __DIR__ ?><br>
            🌐 URL: <?= $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'] ?><br>
            ⏰ <?= date('d/m/Y H:i:s') ?>
        </small>
    </div>
</body>
</html>

<?php
// Remover instalador após conclusão
if (isset($_GET['delete_installer'])) {
    unlink(__FILE__);
    echo "<script>alert('Instalador removido!'); window.close();</script>";
}
?>