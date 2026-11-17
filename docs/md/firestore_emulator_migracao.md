# Validar regras e preparar a migração de avaliações

## Testar as regras localmente

O arquivo `firebase.json` aponta o Emulator para `firestore.rules`. Os testes usam o projeto fictício `demo-tcchat`, sem credenciais e sem conexão com o Firestore real.

1. Instale as dependências do repositório com `npm install`.
2. Execute `npm run test:rules` para validar somente as regras ou `npm run test:all` para rodar as verificações estática e de regras.
3. O comando de regras inicia o Firestore Emulator, executa os casos e encerra o Emulator. `npm test` permanece como verificação estática rápida para o desenvolvimento comum.

Os casos cobrem convites ativos, revogados e vencidos; criação de perfil; confirmação de e-mail; isolamento por turma; leitura de avaliações do próprio grupo; gravação de avaliação por professor; e proteção contra autoelevação de papel. O Firebase CLI baixa o binário do Emulator na primeira execução.

## Migrar avaliações antigas

As novas regras esperam que cada documento em `avaliacoes` tenha `membros`, uma lista de UIDs autorizados a ver aquela avaliação. Avaliações antigas não têm esse campo.

O script `backend/scripts/migrate-evaluation-members.js` identifica os documentos sem `membros` e usa a lista atual de `membros` do grupo indicado por `grupoId`. Documentos sem grupo ou sem UIDs de integrantes válidos são ignorados e precisam de revisão manual.

**Atenção:** o modo padrão é somente simulação de escrita, mas lê os documentos do projeto indicado. Use primeiro um backup e confirme que o grupo ainda tem os integrantes corretos; se a composição histórica mudou, a lista atual pode não representar quem deveria ter visto a avaliação original.

Para preparar credenciais usando uma chave de serviço protegida fora do repositório:

```bash
export FIREBASE_PROJECT_ID="id-do-projeto-firebase"
export GOOGLE_APPLICATION_CREDENTIALS="/caminho/seguro/conta-de-servico.json"
npm run migrate:evaluation-members
```

Revise a contagem e cada linha `PREVISTA`. Somente depois de validar o projeto, o backup e as listas de integrantes, execute explicitamente:

```bash
npm run migrate:evaluation-members -- --apply
```

O modo `--apply` atualiza apenas o campo `membros` ausente e grava em lotes. Não execute contra o banco de produção sem aprovação e revisão dos resultados da simulação.
