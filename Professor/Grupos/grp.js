import { auth, db } from "../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Funções de Navegação
window.Voltar = () =>
  auth
    .signOut()
    .then(() => (window.location.href = "/Inicial-tela/Login/Log-aluno.html"));
window.VisaoGeral = () => (window.location.href = "/Professor/Index.html");
window.Biblioteca = () =>
  (window.location.href = "/Professor/Biblioteca/Bib.html");
window.Avaliacoes = () =>
  (window.location.href = "/Professor/Avaliacoes/ava.html");
window.Grupos = () => (window.location.href = "/Professor/Grupos/grp.html");
window.Forum = () => (window.location.href = "/Professor/Forum/Avisos.html");
window.Configuracoes = () => alert("Configurações de acessibilidade em breve!");

let usuarioAtual = null;
let dadosUsuario = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    usuarioAtual = user;

    const usuarioDoc = await getDoc(doc(db, "usuarios", user.uid));

    if (usuarioDoc.exists()) {
      dadosUsuario = usuarioDoc.data();

      console.log("Dados do usuário:", dadosUsuario);

      if (
        dadosUsuario.tipo === "coordenador" ||
        dadosUsuario.tipo === "professor"
      ) {
        btnCriarGrupo.style.display = "block";
      } else {
        btnCriarGrupo.style.display = "none";
      }
    }
  } else {
    console.log("Nenhum usuário logado");
  }
});

async function criarGrupo() {
  const nome = document.getElementById("nomeGrupo").value.trim();
  const descricao = document.getElementById("descricaoGrupo").value.trim();
  const codigoSala = document.getElementById("codigoSala").value.trim();

  if (!nome || !descricao || !codigoSala) {
    alert("Preencha todos os campos");
    return;
  }

  try {
    await addDoc(collection(db, "grupos"), {
      nome: nome,
      descricao: descricao,
      codigoSala: codigoSala,
      criadorUid: usuarioAtual.uid,
      criadoEm: serverTimestamp(),
    });
  } catch (erro) {
    console.error(erro);
    alert("Erro ao criar grupo");
  }
}

const btnCriarGrupo = document.getElementById("btnCriarGrupo");
const btnSalvarGrupo = document.getElementById("salvarGrupo");
const btnCancelarGrupo = document.getElementById("cancelarGrupo");

const formularioGrupo = document.getElementById("formGrupo");

btnCriarGrupo.addEventListener("click", () => {
  formularioGrupo.style.display = "block";
});

btnCancelarGrupo.addEventListener("click", () => {
  formularioGrupo.style.display = "none";
});

btnSalvarGrupo.addEventListener("click", criarGrupo);

document.addEventListener("DOMContentLoaded", function () {
  const spanIniciais = document.getElementById("foto").querySelector("span"); // Seleciona o span dentro de #foto
  const iniciaisSalvas = localStorage.getItem("iniciaisUsuario");
  spanIniciais.textContent = iniciaisSalvas || ""; // Define o texto ou vazio
});
document.addEventListener("DOMContentLoaded", function () {
  const spanIniciais = document.getElementById("NomeUC").querySelector("h4"); // Seleciona o span dentro de #foto
  const nomeUsuario = localStorage.getItem("nomeUsuario");
  spanIniciais.textContent = nomeUsuario || ""; // Define o texto ou vazio
});
