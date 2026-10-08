import { auth, db } from "../../../backend/firebase/config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */
window.Painel = function () {
  window.location.href = "/pages/Aluno/Turma/index.html";
};
window.MeuGrupo = function () {
  window.location.href = "/pages/Aluno/Grupos/gp.chat.html";
};
window.Forum = function () {
  window.location.href = "/pages/Aluno/Forum/Fo.html";
};
window.Inspiracoes = function () {
  window.location.href = "/pages/Aluno/Inspiracoes/Inspiracoes.html";
};
window.Configuracoes = function () {
  window.location.href = "/pages/Aluno/Configuracoes/Config.html";
};
window.Voltar = function () {
  signOut(auth)
    .then(() => {
      window.location.href = "/pages/Auth/Login/Log-aluno.html";
    })
    .catch((err) => {
      console.error("Erro ao sair:", err);
      window.location.href = "/pages/Auth/Login/Log-aluno.html";
    });
};

/* =========================================================
   ESTADO DO ALUNO
   ========================================================= */
let dadosAluno = null;

/* =========================================================
   AUTENTICAÇÃO E SESSÃO (Firebase)
   ========================================================= */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", user.uid));
      if (userDoc.exists() && userDoc.data().tipo === "aluno") {
        dadosAluno = userDoc.data();
        document.body.classList.add("pronto");   // <-- libera a página
        console.log("Aluno autenticado:", user.uid);
        carregarEstadoSistema(user.uid);
      } else {
        alert("Acesso negado: Esta área é exclusiva para alunos.");
        window.location.href = "/pages/Auth/Login/Log-aluno.html";
      }
    } catch (err) {
      console.error("Erro ao carregar dados do aluno:", err);
      document.body.classList.add("pronto");   // libera mesmo em erro
    }
  } else {
    window.location.href = "/pages/Auth/Login/Log-aluno.html";
  }
});

async function carregarEstadoSistema(uid) {
  const userDocRef = doc(db, "usuarios", uid);

  onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data();
      aplicarAcessibilidade(userData);
      atualizarInterfacePerfil(userData);
    }
  });
}

/* =========================================================
   ACESSIBILIDADE
   ========================================================= */
function aplicarAcessibilidade(data) {
  if (data.configuracoes) {
    const { tema, tamanhoFonte, tipoFonte } = data.configuracoes;
    if (tema) document.body.className = tema;
    if (tamanhoFonte) document.documentElement.style.fontSize = tamanhoFonte + "px";
    if (tipoFonte) document.body.style.fontFamily = tipoFonte;
  }
}

/* =========================================================
   INTERFACE DE PERFIL
   ========================================================= */
function atualizarInterfacePerfil(data) {
  const nomeEl = document.querySelector(".Usuario h4");
  const cursoEl = document.querySelector(".Usuario h5");
  const iniciaisEl = document.querySelector("#foto span");
  const tituloTurmaEl = document.querySelector(".T1 h3 span");

  if (nomeEl) nomeEl.textContent = data.nome || "Usuário";
  if (cursoEl) cursoEl.textContent = data.curso || "Sem Curso";
  if (iniciaisEl) iniciaisEl.textContent = data.iniciais || "??";
  if (tituloTurmaEl && data.codigoSala) tituloTurmaEl.textContent = data.codigoSala;
}

/* =========================================================
   GRUPOS - FUNCAO DE STATUS
   ========================================================= */

function infoStatus(status) {
    switch (status) {
        case "atencao":
            return { label: "Atenção", classe: "status-atencao" };
        case "atraso":
            return { label: "Atrasado", classe: "status-atraso" };
        default:
            return { label: "No prazo", classe: "status-prazo" };
    }
}

/* =========================================================
   GRUPOS - LOCALSTORAGE
   ========================================================= */
const CHAVE_STORAGE = "grupos_turma_2026.1";

window.abrirModalCriarGrupo = function () {
  document.getElementById("modal-criar-grupo").style.display = "flex";
};

window.fecharModalCriarGrupo = function () {
  document.getElementById("modal-criar-grupo").style.display = "none";
};

function obterGrupos() {
  const dados = localStorage.getItem(CHAVE_STORAGE);
  return dados ? JSON.parse(dados) : [];
}

function salvarGrupos(grupos) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(grupos));
}

/* ---------- CRIAR GRUPO ---------- */
window.criarGrupo = function (event) {
  event.preventDefault();

  const nome = document.getElementById("inp-nome-grupo").value.trim();
  const descricao = document.getElementById("inp-descricao").value.trim();
  const tema = document.getElementById("inp-tema").value.trim();
  const integrantesTexto = document.getElementById("inp-integrantes").value.trim();
  const orientador = document.getElementById("inp-orientador").value.trim();

  if (!nome || !descricao || !tema || !integrantesTexto) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const integrantes = integrantesTexto
    .split(",")
    .map((i) => i.trim())
    .filter((i) => i !== "");

  if (integrantes.length < 5) {
    alert("O grupo precisa ter no mínimo 5 integrantes.");
    return;
  }

  const novoGrupo = {
    id: Date.now(),
    nome,
    descricao,
    tema,
    integrantes,
    orientador: orientador || "A definir",
    status: "no-prazo",
    criadoEm: new Date().toISOString(),
  };

  const grupos = obterGrupos();
  grupos.push(novoGrupo);
  salvarGrupos(grupos);

  alert("Grupo criado com sucesso!");
  fecharModalCriarGrupo();
  document.getElementById("form-criar-grupo").reset();
  carregarGrupos();
};

/* ---------- CARREGAR/RENDERIZAR GRUPOS ---------- */
function carregarGrupos() {
  const container = document.getElementById("GT");
  if (!container) return;

  const grupos = obterGrupos();

  atualizarEstatisticas(grupos);

  if (grupos.length === 0) {
    container.innerHTML =
      '<p style="color:#7a8699; margin-left:8px;">Nenhum grupo cadastrado ainda.</p>';
    atualizarSetas();
    return;
  }

  container.innerHTML = "";
  let index = 1;

  grupos.forEach((g) => {
    const info = infoStatus(g.status);
    const card = document.createElement("div");
    card.id = "Grupos-Turma";
    card.innerHTML = `
      <div id="titulo">
        <h1>Grupo ${index}</h1>
        <h2>${g.tema}</h2>
      </div>
      <h3>${g.nome}</h3>
      <p>${g.descricao}</p>
      <div id="interior-gt">
        ${g.integrantes
          .map(
            (nome, i) => `
            <div id="bloco-interior">
              <div id="bolinha" ${i === 0 ? 'style="background-color:#ec3c3c;"' : ""}></div>
              <h1>${nome}</h1>
            </div>
          `
          )
          .join("")}
        <div id="linhav"></div>
        <div id="bloco-inferior">
          <h1 class="${info.classe}">${info.label}</h1>
          <h2>${g.orientador}</h2>
    `;
    container.appendChild(card);
    index++;
  });

  setTimeout(atualizarSetas, 50);
}

/* ---------- ESTATÍSTICAS ---------- */
function atualizarEstatisticas(grupos) {
  const total = grupos.length;
  const noPrazo = grupos.filter((g) => g.status === "no-prazo").length;
  const atencao = grupos.filter((g) => g.status === "atencao").length;
  const atraso = grupos.filter((g) => g.status === "atraso").length;

  const elTotal = document.getElementById("stat-total");
  const elPrazo = document.getElementById("stat-prazo");
  const elAtencao = document.getElementById("stat-atencao");
  const elAtraso = document.getElementById("stat-atraso");

  if (elTotal) elTotal.textContent = total;
  if (elPrazo) elPrazo.textContent = noPrazo;
  if (elAtencao) elAtencao.textContent = atencao;
  if (elAtraso) elAtraso.textContent = atraso;
}

/* ---------- SETAS ---------- */
window.scrollGrupos = function (direcao) {
  const gt = document.getElementById("GT");
  if (!gt) return;

  const card = gt.querySelector("#Grupos-Turma");
  if (!card) return;

  const gap = 20;
  const passo = card.offsetWidth + gap;

  gt.scrollBy({
    left: passo * direcao,
    behavior: "smooth",
  });
};

function atualizarSetas() {
  const gt = document.getElementById("GT");
  const setaEsq = document.getElementById("seta-esq");
  const setaDir = document.getElementById("seta-dir");
  if (!gt || !setaEsq || !setaDir) return;

  const maxScroll = gt.scrollWidth - gt.clientWidth;
  setaEsq.disabled = gt.scrollLeft <= 2;
  setaDir.disabled = gt.scrollLeft >= maxScroll - 2;
}

/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */
document.addEventListener("DOMContentLoaded", function () {
  carregarGrupos();

  const gt = document.getElementById("GT");
  if (gt) {
    gt.addEventListener("scroll", atualizarSetas);
    window.addEventListener("resize", atualizarSetas);
  }
});
