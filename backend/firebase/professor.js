import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "/backend/firebase/config.js";

export const LOGIN_PATH = "/pages/auth/Login/Log-aluno.html";
export const PROFESSOR_TYPES = new Set(["professor", "coordenador"]);

export function redirectLogin() {
  window.location.href = LOGIN_PATH;
}

export function logout() {
  return signOut(auth).finally(redirectLogin);
}

export function navigate(path) {
  window.location.href = path;
}

export async function getProfile(uid) {
  const snapshot = await getDoc(doc(db, "usuarios", uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export function watchProfile(uid, callback) {
  return onSnapshot(doc(db, "usuarios", uid), (snapshot) => {
    if (snapshot.exists()) callback({ id: snapshot.id, ...snapshot.data() });
  });
}

export function requireProfessor(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return redirectLogin();
    try {
      const profile = await getProfile(user.uid);
      if (!profile || !PROFESSOR_TYPES.has(profile.tipo)) {
        alert("Acesso negado: esta área é exclusiva para professores e coordenadores.");
        return redirectLogin();
      }
      callback(user, profile);
    } catch (error) {
      console.error("Não foi possível carregar o perfil:", error);
      alert("Não foi possível validar seu acesso. Tente novamente.");
      redirectLogin();
    }
  });
}

export function fillHeader(profile) {
  const initials = document.querySelector("#foto span");
  const name = document.querySelector("#NomeUC h4");
  const course = document.querySelector("#NomeUC h5");
  if (initials) initials.textContent = profile.iniciais || getInitials(profile.nome);
  if (name) name.textContent = profile.nome || "";
  if (course) course.textContent = profile.curso || profile.codigoSala || "Professor";
}

export function getInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export async function updateProfile(uid, values) {
  await updateDoc(doc(db, "usuarios", uid), values);
}

export { auth, db, doc, getDoc, onSnapshot, updateDoc };
