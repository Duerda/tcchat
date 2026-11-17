#!/usr/bin/env node

// Preenche `membros` em avaliações legadas usando os integrantes atuais do
// grupo referenciado. A execução é somente leitura até passar --apply.
const admin = require("firebase-admin");

const applyChanges = process.argv.includes("--apply");
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

if (!projectId) {
  console.error("Defina FIREBASE_PROJECT_ID (ou GCLOUD_PROJECT) para identificar o projeto.");
  process.exit(1);
}

if (applyChanges && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Para gravar, configure GOOGLE_APPLICATION_CREDENTIALS com uma chave de serviço protegida.");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});

const db = admin.firestore();

async function migrate() {
  const evaluations = await db.collection("avaliacoes").get();
  const groupCache = new Map();
  const updates = [];
  let alreadyMigrated = 0;
  let skipped = 0;

  for (const evaluationDoc of evaluations.docs) {
    const evaluation = evaluationDoc.data();
    if (Array.isArray(evaluation.membros)) {
      alreadyMigrated++;
      continue;
    }
    if (typeof evaluation.grupoId !== "string" || !evaluation.grupoId) {
      console.warn(`IGNORADA avaliacoes/${evaluationDoc.id}: grupoId ausente ou inválido.`);
      skipped++;
      continue;
    }

    if (!groupCache.has(evaluation.grupoId)) {
      const groupDoc = await db.collection("grupos").doc(evaluation.grupoId).get();
      groupCache.set(evaluation.grupoId, groupDoc.exists ? groupDoc.data() : null);
    }
    const group = groupCache.get(evaluation.grupoId);
    if (!group || !Array.isArray(group.membros) || group.membros.length === 0) {
      console.warn(`IGNORADA avaliacoes/${evaluationDoc.id}: grupo ausente ou sem integrantes atuais.`);
      skipped++;
      continue;
    }

    const members = [...new Set(group.membros.filter((uid) => typeof uid === "string" && uid))];
    if (members.length === 0) {
      console.warn(`IGNORADA avaliacoes/${evaluationDoc.id}: grupo não possui UIDs válidos.`);
      skipped++;
      continue;
    }
    updates.push({ ref: evaluationDoc.ref, members, id: evaluationDoc.id });
  }

  console.log(`Projeto: ${projectId}`);
  console.log(`Avaliações encontradas: ${evaluations.size}`);
  console.log(`Já migradas: ${alreadyMigrated}`);
  console.log(`Elegíveis para preencher membros: ${updates.length}`);
  console.log(`Ignoradas para revisão manual: ${skipped}`);

  if (!applyChanges) {
    console.log("Modo simulação: nenhum documento foi alterado. Revise os casos e rode novamente com --apply para gravar.");
    updates.forEach(({ id, members }) => console.log(`PREVISTA avaliacoes/${id}: ${members.length} integrante(s).`));
    return;
  }

  for (let start = 0; start < updates.length; start += 400) {
    const batch = db.batch();
    updates.slice(start, start + 400).forEach(({ ref, members }) => batch.update(ref, { membros: members }));
    await batch.commit();
  }
  console.log(`Migração concluída: ${updates.length} documento(s) atualizado(s).`);
}

migrate()
  .catch((error) => {
    console.error("Falha na migração:", error);
    process.exitCode = 1;
  })
  .finally(() => admin.app().delete());
