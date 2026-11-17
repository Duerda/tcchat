import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  query,
} from "firebase/firestore";

const projectId = "demo-tcchat";
const inviteId = "A".repeat(36);
const rules = fs.readFileSync(path.resolve("firestore.rules"), "utf8");
let testEnv;

function signedIn(uid, email, emailVerified = true) {
  return testEnv.authenticatedContext(uid, {
    email,
    email_verified: emailVerified,
  }).firestore();
}

function profile(uid, email, type, room, invite = inviteId) {
  return {
    uid,
    email,
    nome: uid,
    tipo: type,
    iniciais: "TC",
    dataCadastro: "2026-11-17T12:00:00.000Z",
    codigoAcessoId: invite,
    codigoSala: room,
    curso: "Desenvolvimento de Sistemas",
    ...(type === "aluno" ? { ano: "1º Ano" } : {}),
  };
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  });
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "usuarios/student-1"), profile("student-1", "ana.silva@aluno.cps.sp.gov.br", "aluno", "DS-1"));
    await setDoc(doc(db, "usuarios/student-2"), profile("student-2", "bia.souza@aluno.cps.sp.gov.br", "aluno", "DS-1"));
    await setDoc(doc(db, "usuarios/teacher-1"), profile("teacher-1", "prof.um@professor.cps.sp.gov.br", "professor", "DS-1"));
    await setDoc(doc(db, "usuarios/coordinator-1"), {
      uid: "coordinator-1", email: "coord.um@cps.sp.gov.br", nome: "Coordenação",
      tipo: "coordenador", iniciais: "CO", escopo: "global",
      curso: "Coordenação global", acessoAtivo: true,
    });
    await setDoc(doc(db, "usuarios/unverified-1"), profile("unverified-1", "nao.verificado@aluno.cps.sp.gov.br", "aluno", "DS-1"));
    await setDoc(doc(db, "usuarios/inactive-1"), {
      ...profile("inactive-1", "inativo.aluno@aluno.cps.sp.gov.br", "aluno", "DS-1"),
      acessoAtivo: false,
    });

    await setDoc(doc(db, `codigosAcesso/${inviteId}`), {
      codigo: inviteId, codigoSala: "DS-1", tipo: "aluno", revogado: false,
      expiraEm: null, usos: 0, usadosPor: [], criadoPor: "coordinator-1",
    });
    await setDoc(doc(db, `codigosAcesso/${"B".repeat(36)}`), {
      codigo: "B".repeat(36), codigoSala: "DS-1", tipo: "aluno", revogado: true,
      expiraEm: null, usos: 0, usadosPor: [], criadoPor: "coordinator-1",
    });
    await setDoc(doc(db, `codigosAcesso/${"C".repeat(36)}`), {
      codigo: "C".repeat(36), codigoSala: "DS-1", tipo: "aluno", revogado: false,
      expiraEm: Timestamp.fromDate(new Date(Date.now() - 60_000)),
      usos: 0, usadosPor: [], criadoPor: "coordinator-1",
    });

    await setDoc(doc(db, "grupos/group-1"), {
      codigoSala: "DS-1", membros: ["student-1"], criadoPor: "coordinator-1",
    });
    await setDoc(doc(db, "grupos/group-2"), {
      codigoSala: "DS-1", membros: ["student-2"], criadoPor: "coordinator-1",
    });
    await setDoc(doc(db, "grupos/group-other-room"), {
      codigoSala: "ADM-2", membros: ["student-1"], criadoPor: "coordinator-1",
    });
    await setDoc(doc(db, "avaliacoes/evaluation-1"), {
      grupoId: "group-1", membros: ["student-1"], codigoSala: "DS-1",
      professorUid: "teacher-1", nota: 9, feedback: "Muito bom.",
    });
    await setDoc(doc(db, "avaliacoes/evaluation-2"), {
      grupoId: "group-2", membros: ["student-2"], codigoSala: "DS-1",
      professorUid: "teacher-1", nota: 4, feedback: "Precisa revisar.",
    });
  });
});

after(async () => {
  await testEnv?.cleanup();
});

test("convida sem login apenas pelo identificador aleatório exato", async () => {
  const anonymous = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(anonymous, `codigosAcesso/${inviteId}`)));
  await assertFails(getDoc(doc(anonymous, `codigosAcesso/${"B".repeat(36)}`)));
  await assertFails(getDoc(doc(anonymous, `codigosAcesso/${"C".repeat(36)}`)));
  await assertFails(getDocs(collection(anonymous, "codigosAcesso")));
});

test("cria perfil próprio apenas com convite compatível", async () => {
  const db = signedIn("new-student", "nova.aluna@aluno.cps.sp.gov.br");
  await assertSucceeds(setDoc(doc(db, "usuarios/new-student"), profile("new-student", "nova.aluna@aluno.cps.sp.gov.br", "aluno", "DS-1")));

  const mismatched = signedIn("wrong-type", "novo.aluno@aluno.cps.sp.gov.br");
  await assertFails(setDoc(doc(mismatched, "usuarios/wrong-type"), profile("wrong-type", "novo.aluno@aluno.cps.sp.gov.br", "professor", "DS-1")));
  await assertFails(setDoc(doc(db, "usuarios/another-user"), profile("another-user", "outra.aluna@aluno.cps.sp.gov.br", "aluno", "DS-1")));
});

test("perfil com e-mail ainda não confirmado não lê dados da turma", async () => {
  const db = signedIn("unverified-1", "nao.verificado@aluno.cps.sp.gov.br", false);
  await assertSucceeds(getDoc(doc(db, "usuarios/unverified-1")));
  await assertFails(getDoc(doc(db, "grupos/group-1")));
  await assertFails(getDoc(doc(db, "avaliacoes/evaluation-1")));
});

test("acessoAtivo false bloqueia perfil mesmo com e-mail confirmado", async () => {
  const db = signedIn("inactive-1", "inativo.aluno@aluno.cps.sp.gov.br");
  await assertFails(getDoc(doc(db, "grupos/group-1")));
});

test("consultas de grupos por turma funcionam e não cruzam turmas", async () => {
  const db = signedIn("student-1", "ana.silva@aluno.cps.sp.gov.br");
  const ownGroups = query(collection(db, "grupos"),
    where("codigoSala", "==", "DS-1"),
    where("membros", "array-contains", "student-1"));
  const snapshot = await assertSucceeds(getDocs(ownGroups));
  assert.deepEqual(snapshot.docs.map((item) => item.id), ["group-1"]);
  await assertFails(getDoc(doc(db, "grupos/group-other-room")));
});

test("aluno consulta avaliações do grupo, mas não de outros grupos", async () => {
  const db = signedIn("student-1", "ana.silva@aluno.cps.sp.gov.br");
  await assertSucceeds(getDoc(doc(db, "avaliacoes/evaluation-1")));
  await assertFails(getDoc(doc(db, "avaliacoes/evaluation-2")));
  const ownEvaluations = query(collection(db, "avaliacoes"),
    where("codigoSala", "==", "DS-1"),
    where("grupoId", "==", "group-1"),
    where("membros", "array-contains", "student-1"));
  const snapshot = await assertSucceeds(getDocs(ownEvaluations));
  assert.deepEqual(snapshot.docs.map((item) => item.id), ["evaluation-1"]);
});

test("professor publica avaliação somente com a lista real de integrantes", async () => {
  const db = signedIn("teacher-1", "prof.um@professor.cps.sp.gov.br");
  const validEvaluation = {
    grupoId: "group-1", membros: ["student-1"], grupoNome: "Grupo 1",
    professorUid: "teacher-1", professorNome: "Professor", nota: 8,
    feedback: "Bom trabalho.", codigoSala: "DS-1",
  };
  await assertSucceeds(setDoc(doc(db, "avaliacoes/new-evaluation"), validEvaluation));
  await assertFails(setDoc(doc(db, "avaliacoes/forged-evaluation"), {
    ...validEvaluation, membros: ["student-2"],
  }));
});

test("usuário não altera o próprio papel nem lista usuários", async () => {
  const db = signedIn("student-1", "ana.silva@aluno.cps.sp.gov.br");
  await assertFails(updateDoc(doc(db, "usuarios/student-1"), { tipo: "coordenador" }));
  await assertFails(getDocs(collection(db, "usuarios")));
  const coordinator = signedIn("coordinator-1", "coord.um@cps.sp.gov.br");
  await assertSucceeds(getDocs(collection(coordinator, "usuarios")));
});
