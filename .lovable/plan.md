# Plano: impedir exclusões por um usuário específico

## Proteção no banco de dados
- Criar uma regra central que impeça `jwsfilho@gmail.com` de excluir registros das tabelas do sistema.
- Aplicar a proteção independentemente do perfil administrativo e manter todas as demais permissões atuais.
- Retornar uma mensagem clara informando que esse usuário não possui permissão para excluir dados.

## Exclusão de usuários
- Bloquear o mesmo usuário nas funções administrativas que excluem uma conta individualmente ou em lote.
- Validar a identidade pelo login autenticado, sem confiar em informações enviadas pela tela.

## Interface e validação
- Impedir que ações de exclusão sejam oferecidas quando esse usuário estiver conectado, sem usar isso como única proteção.
- Testar a regra no banco e as funções de exclusão, confirmar que o usuário bloqueado é recusado e que outro administrador mantém as permissões existentes.
- Confirmar que o sistema continua compilando sem erros.

## Observação técnica
- A proteção principal ficará no banco para cobrir exclusões diretas feitas pelas telas.
- As funções administrativas que operam com privilégios elevados terão uma verificação própria do e-mail autenticado.
