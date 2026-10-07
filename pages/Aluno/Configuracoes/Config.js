<<<<<<< HEAD
import { auth, db } from "../../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let perfilRef = null;
let preferencias = {
  tema: "dark-mode",
  tamanhoFonte: 16,
  tipoFonte: "'DM Sans', sans-serif",
};
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
window.Voltar = async () => {
  await auth.signOut();
  location.href = "../../auth/Login/Log-aluno.html";
};
=======
window.Painel = function () {
    window.location.href = "pages/Aluno/Turma/index.html";
};
window.MeuGrupo = function () {
    window.location.href = "pages/Aluno/Grupos/gp.chat.html";
};
window.Forum = function () {
    window.location.href = "pages/Aluno/Forum/av.html";
};
window.Inspiracoes = function () {
    window.location.href = "pages/Aluno/Inspiracoes/Inspiracoes.html";
};
window.Voltar = function () {
    window.location.href = "pages/Auth/Login/Log-aluno.html";
}


function setFonte(nome, el) {
    document.body.style.fontFamily = "'" + nome + "'," + nome + ",sans-serif";
    document.querySelectorAll('.fonte-op').forEach(o => o.classList.remove('ativa'));
    el.classList.add('ativa');
}

function aplicarFonteCustom() {
    const v = document.getElementById('inp-fonte-custom').value.trim();
    if (!v) return;
    document.body.style.fontFamily = "'" + v + "'," + v + ",sans-serif";
    document.querySelectorAll('.fonte-op').forEach(o => o.classList.remove('ativa'));
    const prev = document.getElementById('fonte-preview');
    prev.style.display = 'block';
    prev.style.fontFamily = "'" + v + "'," + v + ",sans-serif";
    prev.textContent = 'O rato roeu a roupa do rei de Roma. 0123456789.';
}

function setTamanho(tam, el) {
    document.body.style.fontSize = tam + 'px';
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('ativo'));
    el.classList.add('ativo');
}

function salvarPerfil() {
    const nome = document.getElementById('inp-nome').value.trim();
    if (!nome) { alert('Preencha o nome.'); return; }
    localStorage.setItem('nomeUsuario', nome);
    const iniciais = nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    localStorage.setItem('iniciaisUsuario', iniciais);
    alert('Perfil salvo!');
}

document.addEventListener('DOMContentLoaded', function () {
    // Foto / iniciais
    document.getElementById('foto').querySelector('span').textContent =
        localStorage.getItem('iniciaisUsuario') || '';

    // Nome
    const nomeEl = document.getElementById('NomeUC').querySelector('h4');
    nomeEl.textContent = localStorage.getItem('nomeUsuario') || '';

    // Preenche campo de nome no perfil
    const nomeGuardado = localStorage.getItem('nomeUsuario') || '';
    document.getElementById('inp-nome').value = nomeGuardado;

    // Curso
    const cursos = {
        'TMA': 'Tecnico em Meio Ambiente',
        'DS':  'Desenvolvimento de Sistemas',
        'ADM': 'Administracao',
        'SRC': 'Secretariado',
        'TDS': 'Tecnico de Design de Interiores'
    };
    const codigoCurso = localStorage.getItem('codigoCurso') || '';
    document.getElementById('NomeUC').querySelector('h5').textContent =
        cursos[codigoCurso] || '';
    document.getElementById('inp-curso').value =
        cursos[codigoCurso] || codigoCurso;
});
>>>>>>> main
