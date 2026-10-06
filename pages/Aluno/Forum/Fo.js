import { auth, db } from "../../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let perfil;
onAuthStateChanged(auth, async (user) => {
  if (!user) { location.href = "../../auth/Login/Log-aluno.html"; return; }
  const snap = await getDoc(doc(db, "usuarios", user.uid));
  if (!snap.exists() || snap.data().tipo !== "aluno") { location.href = "../../auth/Login/Log-aluno.html"; return; }
  perfil = { uid: user.uid, ...snap.data() };
  document.querySelector("#foto span").textContent = perfil.iniciais || "";
  document.querySelector("#NomeUC h4").textContent = perfil.nome || "";
  carregarDuvidas(perfil.codigoSala || "geral");
});

window.abrirBloco = (id) => { const bloco = document.getElementById(id); bloco.style.display = bloco.style.display === "block" ? "none" : "block"; };
window.enviarFormulario = async (event) => {
  event.preventDefault();
  if (!perfil) return;
  const titulo = document.getElementById("titulo-duvida").value.trim();
  const conteudo = document.getElementById("duvida").value.trim();
  if (!titulo || !conteudo) { alert("Preencha o tema e a dúvida."); return; }
  try {
    await addDoc(collection(db, "duvidas"), { titulo, conteudo, autor: perfil.nome, autorUid: perfil.uid, codigoSala: perfil.codigoSala || "geral", data: serverTimestamp() });
    event.target.reset();
    document.getElementById("bloco-nova-duvida").style.display = "none";
  } catch (error) { console.error(error); alert("Não foi possível publicar a dúvida. Tente novamente."); }
};

function carregarDuvidas(codigoSala) {
  const quadro = document.getElementById("quadro");
  onSnapshot(query(collection(db, "duvidas"), where("codigoSala", "==", codigoSala)), (snap) => {
    quadro.replaceChildren();
    const itens = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    itens.sort((a, b) => (b.data?.toMillis?.() || 0) - (a.data?.toMillis?.() || 0));
    for (const item of itens) {
      const card = document.createElement("article");
      const titulo = document.createElement("h2"); titulo.textContent = item.titulo || "Dúvida";
      const autor = document.createElement("h3"); autor.textContent = `${item.autor || "Aluno"}:`;
      const texto = document.createElement("p"); texto.textContent = item.conteudo || "";
      card.append(titulo, autor, texto); quadro.append(card);
    }
  }, (error) => { console.error(error); quadro.textContent = "Não foi possível carregar as dúvidas."; });
}
