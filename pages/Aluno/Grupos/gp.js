function chat() {
    window.location.href = "/pages/Aluno/Grupos/gp.chat.html";
}
function orientador() {
    window.location.href = "/pages/Aluno/Grupos/gp-cha-ori.html";
}
function atividade() {
    window.location.href = "/pages/Aluno/Grupos/gp.ativ.html";
}
function biblioteca() {
    window.location.href = "/pages/Aluno/Grupos/gp.link.html";
}

import { auth, db } from "../../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (!userDoc.exists()) return;
    const data = userDoc.data();

    const nomeEl = document.querySelector(".Usuario h4");
    const cursoEl = document.querySelector(".Usuario h5");
    const iniciaisEl = document.querySelector("#foto span");

    if (nomeEl) nomeEl.textContent = data.nome || "Usuário";
    if (cursoEl) cursoEl.textContent = data.curso || "Sem Curso";
    if (iniciaisEl && data.iniciais) iniciaisEl.textContent = data.iniciais;
});
