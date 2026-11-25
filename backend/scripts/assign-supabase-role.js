#!/usr/bin/env node
const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const email = args.find((arg) => !arg.startsWith("--"));
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "tcchat-13e85";

  if (!email || !email.includes("@")) {
    console.error("Uso: npm run demo:supabase-role -- email@exemplo.com [--apply]");
    process.exitCode = 1;
    return;
  }

  if (apply && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error("Defina GOOGLE_APPLICATION_CREDENTIALS com a chave de uma conta de serviço autorizada.");
  }

  initializeApp({
    credential: applicationDefault(),
    projectId,
  });

  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  const claims = { ...user.customClaims, role: "authenticated" };
  console.log(`Projeto: ${projectId}`);
  console.log(`Conta: ${user.email} (UID ${user.uid})`);
  console.log(`Claim que será configurada: ${JSON.stringify(claims)}`);

  if (!apply) {
    console.log("Simulação: nenhuma alteração foi gravada. Adicione --apply para aplicar.");
    return;
  }

  await auth.setCustomUserClaims(user.uid, claims);
  console.log("Claim aplicada. A pessoa precisa sair e entrar novamente para receber um token atualizado.");
}

main().catch((error) => {
  console.error("Falha ao preparar a claim do Supabase:", error.message);
  process.exitCode = 1;
});
