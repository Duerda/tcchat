import { auth, db } from "../../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let perfilRef = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "../../auth/Login/Log-aluno.html";
    return;
  }
  perfilRef = doc(db, "usuarios", user.uid);
  const snap = await getDoc(perfilRef);
  if (!snap.exists() || snap.data().tipo !== "aluno") {
    location.href = "../../auth/Login/Log-aluno.html";
    return;
  }
  const dados = snap.data();
  const foto = document.querySelector("#foto span");
  const nome = document.querySelector("#NomeUC h4");
  const curso = document.querySelector("#NomeUC h5");
  if (foto) foto.textContent = dados.iniciais || "";
  if (nome) nome.textContent = dados.nome || "";
  if (curso) curso.textContent = dados.curso || "";

  escutarAvisos(dados.codigoSala || "geral");
  });

window.abrirBloco = (id) => {
  const bloco = document.getElementById(id);
  bloco.style.display = bloco.style.display === "block" ? "none" : "block";
};
window.enviarFormulario = async (event) => {
  event.preventDefault();
  if (!perfilRef) return;
  const titulo = document.getElementById("titulo-duvida").value.trim();
  const conteudo = document.getElementById("duvida").value.trim();
  if (!titulo || !conteudo) {
    alert("Preencha o tema e a dúvida.");
    return;
  }
  try {
    await addDoc(collection(db, "duvidas"), {
      titulo,
      conteudo,
      autor: perfilRef.nome,
      autorUid: perfilRef.uid,
      codigoSala: perfilRef.codigoSala || "geral",
      data: serverTimestamp(),
    });
    event.target.reset();
    document.getElementById("bloco-nova-duvida").style.display = "none";
  } catch (error) {
    console.error(error);
    alert("Não foi possível publicar a dúvida. Tente novamente.");
  }
};

function carregarDuvidas(codigoSala) {
  const quadro = document.getElementById("quadro");
  onSnapshot(
    query(collection(db, "duvidas"), where("codigoSala", "==", codigoSala)),
    (snap) => {
      quadro.replaceChildren();
      const itens = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      itens.sort(
        (a, b) => (b.data?.toMillis?.() || 0) - (a.data?.toMillis?.() || 0),
      );
      for (const item of itens) {
        const card = document.createElement("article");
        const titulo = document.createElement("h2");
        titulo.textContent = item.titulo || "Dúvida";
        const autor = document.createElement("h3");
        autor.textContent = `${item.autor || "Aluno"}:`;
        const texto = document.createElement("p");
        texto.textContent = item.conteudo || "";
        card.append(titulo, autor, texto);
        quadro.append(card);
      }
    },
    (error) => {
      console.error(error);
      quadro.textContent = "Não foi possível carregar as dúvidas.";
    },
  );
}
