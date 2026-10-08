import { db } from "../../../backend/firebase/config.js";
import {
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let perfilRef = null;
let preferencias = {
  tema: "dark-mode",
  tamanhoFonte: 16,
  tipoFonte: "'DM Sans', sans-serif",
};
window.alunoReady?.then((session) => {
  if (!session) return;
  perfilRef = doc(db, "usuarios", session.user.uid);
  const dados = session.profile;
  const foto = document.querySelector("#foto span");
  const nome = document.querySelector("#NomeUC h4");
  const curso = document.querySelector("#NomeUC h5");
  if (foto) foto.textContent = dados.iniciais || "";
  if (nome) nome.textContent = dados.nome || "";
  if (curso) curso.textContent = dados.curso || "";

});

function aplicarPreferencias() {
  document.body.classList.remove("dark-mode", "light-mode");
  document.body.classList.add(preferencias.tema);
  document.documentElement.style.fontSize = `${preferencias.tamanhoFonte}px`;
  document.body.style.fontFamily = preferencias.tipoFonte;
}
window.setFonte = (nome, el) => {
  preferencias.tipoFonte = `'${nome}', ${nome}, sans-serif`;
  aplicarPreferencias();
  document
    .querySelectorAll(".fonte-op")
    .forEach((o) => o.classList.remove("ativa"));
  el?.classList.add("ativa");
};
window.aplicarFonteCustom = () => {
  const nome = document.getElementById("inp-fonte-custom").value.trim();
  if (!nome) return;
  preferencias.tipoFonte = `'${nome}', ${nome}, sans-serif`;
  aplicarPreferencias();
  const preview = document.getElementById("fonte-preview");
  preview.style.display = "block";
  preview.style.fontFamily = preferencias.tipoFonte;
  preview.textContent = "O rato roeu a roupa do rei de Roma. 0123456789.";
};
window.setTamanho = (tamanho, el) => {
  preferencias.tamanhoFonte = Number(tamanho);
  aplicarPreferencias();
  document
    .querySelectorAll(".size-btn")
    .forEach((b) => b.classList.remove("ativo"));
  el?.classList.add("ativo");
};
window.salvarPerfil = async () => {
  const nome = document.getElementById("inp-nome").value.trim();
  if (!nome) {
    alert("Preencha o nome.");
    return;
  }
  try {
    const iniciais = nome
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    await updateDoc(perfilRef, { nome, iniciais, configuracoes: preferencias });
    document.querySelector("#NomeUC h4").textContent = nome;
    document.querySelector("#foto span").textContent = iniciais;
    alert("Perfil e preferências salvos.");
  } catch (error) {
    console.error(error);
    alert("Não foi possível salvar as alterações.");
  }
};
window.Painel = () => (location.href = "../Turma/index.html");
window.Forum = () => (location.href = "../Forum/Fo.html");
window.Inspiracoes = () => (location.href = "../Inspiracoes/Inspiracoes.html");
window.Configuracoes = () => (location.href = "Config.html");
