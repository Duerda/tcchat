import { db } from "../firebase/config.js";
import { arrayUnion, doc, getDoc, increment, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { parseClassCode } from "./validation.js";

const pendingKey = (uid) => `tcchatCadastroPendente:${uid}`;

export function savePendingRegistration({ uid, email, nome, tipo, codigoAcessoId }) {
  localStorage.setItem(pendingKey(uid), JSON.stringify({ uid, email, nome, tipo, codigoAcessoId }));
}

export async function completePendingRegistration(user) {
  const key = pendingKey(user.uid);
  const raw = localStorage.getItem(key);
  if (!raw) return false;

  let pending;
  try {
    pending = JSON.parse(raw);
  } catch {
    localStorage.removeItem(key);
    return false;
  }
  if (pending.uid !== user.uid || pending.email !== user.email || !["aluno", "professor"].includes(pending.tipo)) return false;

  const existingProfile = await getDoc(doc(db, "usuarios", user.uid));
  if (existingProfile.exists()) {
    localStorage.removeItem(key);
    return true;
  }

  const inviteRef = doc(db, "codigosAcesso", pending.codigoAcessoId);
  const inviteSnapshot = await getDoc(inviteRef);
  const code = inviteSnapshot.exists() ? inviteSnapshot.data() : null;
  const expiry = code?.expiraEm?.toDate?.()?.getTime?.() || (code?.expiraEm ? new Date(code.expiraEm).getTime() : null);
  const rooms = [...new Set((pending.tipo === "professor" && Array.isArray(code?.codigoSalas)
    ? code.codigoSalas
    : [code?.codigoSala]).filter(Boolean))];
  const parsedRooms = rooms.map(parseClassCode);
  const valid = code && code.codigo === inviteSnapshot.id && !code.revogado && (!expiry || expiry >= Date.now())
    && (code.tipo === pending.tipo || code.tipo === "ambos") && rooms.length > 0 && rooms.length <= 8
    && parsedRooms.every(Boolean)
    && (pending.tipo !== "aluno" || rooms.length === 1)
    && (pending.tipo !== "professor" || !code.codigoSalas || code.codigoSala === rooms[0])
    && (!code.limiteUsos || Number(code.usos || 0) < Number(code.limiteUsos));
  if (!valid) throw new Error("O convite expirou, foi revogado ou já foi utilizado antes da confirmação do e-mail. Peça um novo código à coordenação.");

  const classInfo = parsedRooms[0];
  const prefix = user.email.split("@")[0];
  const parts = prefix.split(".");
  const initials = parts.length >= 2
    ? parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase()
    : prefix.substring(0, 2).toUpperCase();
  const userData = {
    uid: user.uid,
    nome: pending.nome,
    email: user.email,
    tipo: pending.tipo,
    iniciais: initials,
    dataCadastro: new Date().toISOString(),
    codigoAcessoId: inviteSnapshot.id,
    codigoAcessoIds: [inviteSnapshot.id],
    codigoSala: classInfo.code,
    codigoSalas: pending.tipo === "professor" ? rooms : [classInfo.code],
    curso: pending.tipo === "professor" ? rooms.map((room) => parseClassCode(room).courseName).join(", ") : classInfo.courseName,
  };
  if (pending.tipo === "aluno") userData.ano = `${classInfo.year}º Ano`;

  const batch = writeBatch(db);
  batch.set(doc(db, "usuarios", user.uid), userData);
  batch.update(inviteRef, {
    usos: increment(1),
    usadosPor: arrayUnion(user.uid),
    ultimoUso: serverTimestamp(),
  });
  await batch.commit();
  localStorage.removeItem(key);
  return true;
}
