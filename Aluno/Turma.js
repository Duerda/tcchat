window.Painel = function () {
  window.location.href = "/Aluno/Turma/index.html";
};
window.MeuGrupo = function () {
  window.location.href = "/Aluno/Grupos/gp.chat.html";
};
window.Forum = function () {
  window.location.href = "/Aluno/Forum/Fo.html";
};
window.Inspiracoes = function () {
  window.location.href = "/Aluno/Inspiracoes/Inspiracoes.html";
};
window.Configuracoes = function () {
  window.location.href = "/Aluno/Configuracoes/Config.html";
};
window.Voltar = function () {
  window.location.href = "/Inicial-tela/Login/Log-aluno.html";
};

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

window.criarGrupo = function (event) {
  event.preventDefault();

  const nome = document.getElementById("inp-nome-grupo").value.trim();
  const descricao = document.getElementById("inp-descricao").value.trim();
  const tema = document.getElementById("inp-tema").value.trim();
  const integrantesTexto = document
    .getElementById("inp-integrantes")
    .value.trim();
  const orientador = document.getElementById("inp-orientador").value.trim();

  if (!nome || !descricao || !tema || !integrantesTexto) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const integrantes = integrantesTexto
    .split(",")
    .map((i) => i.trim())
    .filter((i) => i !== "");

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

let grupoParaExcluir = null;

window.excluirGrupo = function (id) {
  const grupos = obterGrupos();
  const grupo = grupos.find((g) => g.id === id);
  if (!grupo) return;

  grupoParaExcluir = id;

  const nomeEl = document.getElementById("nome-grupo-excluir");
  if (nomeEl) nomeEl.textContent = `"${grupo.nome}"`;

  document.getElementById("modal-confirmar-exclusao").style.display = "flex";
};

window.fecharModalExclusao = function () {
  document.getElementById("modal-confirmar-exclusao").style.display = "none";
  grupoParaExcluir = null;
};

window.confirmarExclusao = function () {
  if (grupoParaExcluir === null) return;

  const grupos = obterGrupos().filter((g) => g.id !== grupoParaExcluir);
  salvarGrupos(grupos);
  fecharModalExclusao();
  carregarGrupos();
};

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
                `,
                  )
                  .join("")}
                <div id="linha"></div>
                <div id="bloco-inferior">
                    <h1>No prazo</h1>
                    <h2>${g.orientador}</h2>
                </div>
                <button class="btn-excluir" onclick="excluirGrupo(${g.id})">Excluir</button>
            </div>
        `;
    container.appendChild(card);
    index++;
  });

  setTimeout(atualizarSetas, 50);
}

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

document.addEventListener("DOMContentLoaded", function () {
  carregarGrupos();

  const gt = document.getElementById("GT");
  if (gt) {
    gt.addEventListener("scroll", atualizarSetas);
    window.addEventListener("resize", atualizarSetas);
  }
});