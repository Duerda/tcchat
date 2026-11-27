# Envio de arquivos pelo Supabase Storage (demonstração)

Este guia configura o envio de arquivos das entregas de atividades. O navegador autentica a pessoa pelo Firebase, envia o arquivo ao bucket privado do Supabase e grava no Firestore somente o caminho do objeto e os metadados. O professor recebe um link assinado temporário para abrir o arquivo.

## O que já está implementado no projeto

- Upload pelo formulário do aluno para o bucket `tcchat-arquivos`.
- Upload de arquivos compartilhados pelo coordenador na Biblioteca, com o caminho do objeto e a turma salvos no Firestore.
- Tipos aceitos: PDF, DOC, DOCX, ODT, ZIP, PNG e JPG/JPEG; limite de 25 MB por arquivo.
- O caminho começa com o UID autenticado do Firebase e inclui grupo, atividade e nome aleatório.
- Registro da entrega no Firestore usando `arquivoPath`, sem URL pública permanente.
- A tela do professor solicita um link assinado com validade de uma hora. Entregas antigas com `arquivoUrl` do Firebase continuam abrindo.
- O SQL inicial está em [`../../../backend/supabase/setup_storage.sql`](../../../backend/supabase/setup_storage.sql).

## Configuração necessária nos painéis

### 1. Conectar Firebase Authentication ao Supabase

No painel Supabase, abra **Authentication > Sign In / Providers** (ou a área **Third-Party Auth**, conforme a versão do painel) e habilite **Firebase**. Informe o ID do projeto Firebase `tcchat-13e85` e siga as instruções do próprio painel para validar a integração. A integração precisa reconhecer tokens Firebase como tokens de terceiros.

O token também precisa ter a claim `role: "authenticated"`, que habilita a autorização usada pelas políticas do Storage. O script abaixo prepara essa claim para contas já existentes. Ele preserva outras custom claims.

### 2. Preparar uma conta de demonstração

Use uma conta de aluno ou professor já criada no Firebase Authentication. Configure Application Default Credentials com uma chave de conta de serviço autorizada a editar usuários do Authentication:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/seguro/service-account.json"
npm run demo:supabase-role -- aluno@exemplo.com
```

O comando acima só simula e não grava nenhuma alteração. Confira projeto, e-mail e UID exibidos. Para aplicar:

```bash
npm run demo:supabase-role -- aluno@exemplo.com --apply
```

Repita para cada conta da apresentação que precisa usar o Storage, incluindo a conta do professor. Depois, cada pessoa deve sair e entrar novamente no TCCHAT para o Firebase emitir um token com a nova claim. Não inclua a chave de serviço no repositório nem no site.

> A claim não é atribuída automaticamente para novos cadastros. Para a apresentação, prepare as contas antecipadamente. Automatizar isso para todos os cadastros exigiria um processo administrativo do lado do servidor.

### 3. Criar o bucket privado e as políticas

No Supabase, abra **SQL Editor**, cole o conteúdo de [`../../../backend/supabase/setup_storage.sql`](../../../backend/supabase/setup_storage.sql) e execute. O script cria/atualiza o bucket privado e configura as políticas mínimas para upload, leitura e remoção dos próprios arquivos na demonstração. Se já executou uma versão anterior, execute novamente para criar a política de remoção.

O upload é permitido somente quando a primeira pasta do objeto corresponde ao UID (`sub`) presente no token. A leitura está aberta a qualquer usuário autenticado do projeto para que a conta do professor consiga abrir entregas dos alunos. Esse é um atalho deliberado para a apresentação; antes de uso real com dados de alunos, limite a leitura por papel, grupo e atividade.

### 4. Verificar o fluxo

1. Abra o TCCHAT com uma conta de aluno ou coordenador que recebeu a claim e entrou novamente.
2. Entre em um grupo com uma atividade publicada e envie um arquivo pequeno de um dos tipos aceitos.
3. Confirme no Supabase **Storage > tcchat-arquivos** que o objeto foi criado e que o bucket continua privado.
4. Confirme no Firestore que a submissão contém `arquivoPath` e `arquivoNome`.
5. Entre com a conta de professor, abra as entregas do mesmo grupo e clique no link do arquivo.

Se o envio falhar, verifique primeiro se o Firebase está habilitado como provedor de terceiros no Supabase, se a conta recebeu a claim e fez novo login, e se o SQL foi executado no projeto Supabase correto.

## Limites conhecidos para a apresentação

- A política de leitura permite a qualquer usuário autenticado ler objetos do bucket; ela não verifica associação à turma.
- O fluxo foi implementado no código, mas a configuração do painel Supabase, as políticas e o envio real dependem de execução pelo responsável pelo projeto.
- Se o upload do objeto funcionar e a gravação subsequente do Firestore falhar, o objeto poderá ficar órfão no bucket. A remoção automática desses casos fica para uma etapa posterior.
- A confirmação de e-mail do Firebase é um fluxo separado; o endereço pode ser Outlook sem configurar login Microsoft. Teste o envio real e a abertura do link antes da apresentação.
