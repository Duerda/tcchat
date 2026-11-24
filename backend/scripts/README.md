# Scripts do backend — TCChat

Esta pasta reúne scripts de exemplo e utilitários administrativos. Nem todos alteram o Firestore: confira a descrição antes de executar.

## Scripts disponíveis

| Arquivo | Comando/uso | Efeito |
| --- | --- | --- |
| `migrate-evaluation-members.js` | `npm run migrate:evaluation-members` | Lê `avaliacoes` e os grupos correspondentes e mostra quais avaliações antigas receberiam o campo `membros`. Por padrão não grava. |
| `assign-supabase-role.js` | `npm run demo:supabase-role -- email@exemplo.com` | Localiza uma conta Firebase e simula a claim `role: "authenticated"`. Por padrão não altera a conta. |
| `delete-all-users.js` | `npm run delete:all-users` | Conta perfis e contas Auth; somente apaga com `--apply` e confirmação do ID do projeto. |

## Utilitários administrativos

Os dois utilitários que acessam o Firebase Admin usam Application Default Credentials, configuradas com `GOOGLE_APPLICATION_CREDENTIALS`, e o projeto indicado em `FIREBASE_PROJECT_ID` (ou `GCLOUD_PROJECT`). A dependência `firebase-admin` já está declarada em `devDependencies`; instale as dependências do projeto com `npm install`.

Para simular a migração de avaliações:

```bash
export FIREBASE_PROJECT_ID="id-do-projeto-firebase"
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/seguro/conta-de-servico.json"
npm run migrate:evaluation-members
```

Depois de revisar a saída e confirmar que a composição atual dos grupos representa os integrantes que devem acessar cada avaliação, a gravação exige a opção explícita `--apply`:

```bash
npm run migrate:evaluation-members -- --apply
```

Para preparar a claim usada pelas políticas do Supabase Storage:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/seguro/conta-de-servico.json"
npm run demo:supabase-role -- aluno@exemplo.com
npm run demo:supabase-role -- aluno@exemplo.com --apply
```

O segundo comando altera as custom claims da conta. A pessoa precisa sair e entrar novamente para receber um token atualizado. Use somente uma conta de serviço autorizada e não armazene a chave no repositório.

Para remover todos os usuários de teste do Authentication e os documentos da coleção `usuarios`, primeiro confira o projeto e as quantidades em modo simulação:

```bash
export FIREBASE_PROJECT_ID="id-do-projeto-firebase"
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/seguro/conta-de-servico.json"
npm run delete:all-users
```

Depois de conferir a saída, a exclusão exige `--apply` e repetir exatamente o ID configurado. O script apaga somente as contas do Authentication e os documentos em `usuarios`; grupos, convites e outros dados do Firestore não são alterados.

```bash
npm run delete:all-users -- --apply --confirm-project="$FIREBASE_PROJECT_ID"
```

Essa operação é irreversível. Use credenciais administrativas apenas para o projeto de teste correto e faça uma cópia de segurança se houver qualquer dado que precise preservar.

Não há scripts de seed neste repositório. Também não há um arquivo `tcchat_database_full.sql` nem `tcchat_schema_postgresql.sql`.
