# Scripts do backend — TCChat

Esta pasta reúne scripts de exemplo e utilitários administrativos. Nem todos alteram o Firestore: confira a descrição antes de executar.

## Scripts disponíveis

| Arquivo | Comando/uso | Efeito |
| --- | --- | --- |
| `seed_database.js` | `node backend/scripts/seed_database.js` | Demonstra dados de exemplo no console. A inicialização do Admin SDK e a conexão ao Firestore estão comentadas; não grava dados. |
| `clear_database.js` | `node backend/scripts/clear_database.js` | Simula no console a limpeza de coleções. A exclusão real está comentada; não apaga dados. |
| `migrate-evaluation-members.js` | `npm run migrate:evaluation-members` | Lê `avaliacoes` e os grupos correspondentes e mostra quais avaliações antigas receberiam o campo `membros`. Por padrão não grava. |
| `assign-supabase-role.js` | `npm run demo:supabase-role -- email@exemplo.com` | Localiza uma conta Firebase e simula a claim `role: "authenticated"`. Por padrão não altera a conta. |

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

Os scripts `seed_database.js` e `clear_database.js` são demonstrações incompletas, não ferramentas para popular ou limpar um ambiente real. Não há neste repositório um arquivo `tcchat_database_full.sql` nem `tcchat_schema_postgresql.sql`.
