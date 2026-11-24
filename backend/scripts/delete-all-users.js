#!/usr/bin/env node

// Remove todos os documentos de usuarios e todas as contas do Firebase Auth.
// A execução é somente leitura até receber --apply e --confirm-project=<ID>.
const admin = require("firebase-admin");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const confirmedProject = args.find((arg) => arg.startsWith("--confirm-project="))?.split("=")[1];
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

if (!projectId) {
  console.error("Defina FIREBASE_PROJECT_ID (ou GCLOUD_PROJECT) para identificar o projeto.");
  process.exit(1);
}

if (apply && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Para excluir, configure GOOGLE_APPLICATION_CREDENTIALS com credenciais administrativas protegidas.");
  process.exit(1);
}

if (apply && confirmedProject !== projectId) {
  console.error(`Confirmação inválida. Para excluir no projeto ${projectId}, passe --confirm-project=${projectId}.`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});

const db = admin.firestore();
const auth = admin.auth();

async function listAuthUsers() {
  const users = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return users;
}

async function countProfiles() {
  const snapshot = await db.collection("usuarios").count().get();
  return snapshot.data().count;
}

async function deleteProfiles() {
  let deleted = 0;
  while (true) {
    const page = await db.collection("usuarios").orderBy(admin.firestore.FieldPath.documentId()).limit(400).get();
    if (page.empty) break;
    const batch = db.batch();
    page.docs.forEach((document) => batch.delete(document.ref));
    await batch.commit();
    deleted += page.size;
    console.log(`Firestore: ${deleted} documento(s) removido(s) de usuarios.`);
  }
  return deleted;
}

async function deleteAuthUsers(users) {
  let deleted = 0;
  let failed = 0;
  for (let start = 0; start < users.length; start += 1000) {
    const batch = users.slice(start, start + 1000);
    const result = await auth.deleteUsers(batch.map((user) => user.uid));
    deleted += result.successCount;
    failed += result.failureCount;
    result.errors.forEach(({ index, error }) => {
      console.error(`Auth: falha ao remover UID ${batch[index]?.uid}: ${error.message}`);
    });
    console.log(`Authentication: ${deleted}/${users.length} conta(s) removida(s).`);
  }
  return { deleted, failed };
}

async function main() {
  const [profileCount, users] = await Promise.all([countProfiles(), listAuthUsers()]);
  console.log(`Projeto Firebase: ${projectId}`);
  console.log(`Documentos em usuarios: ${profileCount}`);
  console.log(`Contas no Firebase Authentication: ${users.length}`);

  if (!apply) {
    console.log("Simulação: nada foi apagado. Revise o projeto e execute com --apply --confirm-project=<ID> para excluir.");
    return;
  }

  const authResult = await deleteAuthUsers(users);
  const deletedProfiles = await deleteProfiles();
  console.log(`Concluído. Firestore: ${deletedProfiles} documento(s); Authentication: ${authResult.deleted} conta(s).`);
  if (authResult.failed) {
    throw new Error(`${authResult.failed} conta(s) do Authentication não foram removidas.`);
  }
}

main()
  .catch((error) => {
    console.error("Falha na limpeza:", error);
    process.exitCode = 1;
  })
  .finally(() => admin.app().delete());
