import { auth, db } from "../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


window.Voltar        = () => auth.signOut().then(() => window.location.href = "../../auth/Login/Log-aluno.html");
window.Painel        = () => window.location.href = "./Coord-Index.html";
window.Usuarios      = () => window.location.href = "./Coord-Usuarios.html";
window.Cursos        = () => window.location.href = "/Coordenador/Coord-Cursos.html";
window.GruposCoord   = () => window.location.href = "Coord-Grupos.html";
window.Biblioteca    = () => window.location.href = "/Coordenador/Coord-Biblioteca.html";
window.Forum         = () => window.location.href = "Coord-Forum.html";
window.Configuracoes = () => window.location.href = "/Coordenador/Coord-Config.html";


onAuthStateChanged(auth, async (user) => {
  if (user) {
    carregarPerfil(user.uid);
  } else {
    window.location.href = "../auth/Login/Log-aluno.html";
  }
});


function carregarPerfil(uid) {
  const q = query(collection(db, "usuarios"), where("uid", "==", uid));
  onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      document.querySelector("#foto span").textContent = data.iniciais || "";
      document.querySelector("#NomeUC h4").textContent = data.nome || "";
      document.querySelector("#NomeUC h5").textContent = data.curso || "Coordenador";
    }
  });
}


function mudarAba(id) {
  document.querySelectorAll('.conteudo-aba').forEach(a => a.style.display = 'none');
  document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
  document.getElementById('tab-' + id).style.display = 'block';
  document.getElementById('aba-' + id).classList.add('ativa');
}

function gerarCodigo(tipo) {
  const curso = prompt('Curso (DS ou TMA):');
  if (!curso) return;
  const letra = prompt('Turma (A, B...):') || 'A';
  const ano = new Date().getFullYear();
  const codigo = tipo === 'professor'
    ? `PROF-${curso.toUpperCase()}-${ano}`
    : `${curso.toUpperCase()}-${ano}-${letra}`;

  const tbody = document.getElementById('lista-codigos');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><span class="Chip">${codigo}</span></td>
    <td>${tipo === 'professor' ? 'Professor' : 'Aluno'}</td>
    <td><span class="Badge ${curso.toLowerCase()}">${curso.toUpperCase()}</span></td>
    <td>0</td>
    <td>Permanente</td>
    <td><button class="btn-tabela vermelho" onclick="revogarCodigo(this)">Revogar</button></td>`;
  tbody.appendChild(tr);
  alert(`Código ${codigo} gerado!`);
}

function revogarCodigo(btn) {
  if (confirm('Revogar este código?')) btn.closest('tr').remove();
}

function resetarSenha(nome) {
  alert(`Senha de ${nome} resetada! Um e-mail será enviado.`);
}

function desativarUsuario(btn) {
  if (confirm('Desativar este usuário?')) {
    const td = btn.closest('tr').querySelectorAll('td')[3];
    if (td) { td.innerHTML = '<span class="amarelo-badge">Inativo</span>'; }
    btn.remove();
  }
}


function novoAviso() {
  const titulo = prompt('Título do aviso:');
  if (!titulo) return;
  const texto = prompt('Conteúdo:');
  if (!texto) return;
  const lista = document.getElementById('lista-avisos');
  const div = document.createElement('div');
  div.className = 'Cards';
  div.innerHTML = `
    <div id="top-card">
      <div>
        <h3 style="margin: 0 0 5px; color:#e4e9f4;">${titulo.replace(/</g, '&lt;')}</h3>
        <span style="color:#3d4d61; font-size:12px;">Você · agora</span>
      </div>
      <button class="btn-tabela vermelho" onclick="this.closest('.Cards').remove()">Remover</button>
    </div>
    <p style="color:#7a8699; margin:8px 0 0;">${texto.replace(/</g, '&lt;')}</p>`;
  lista.prepend(div);
}

function responderDuvida(inputId, btn) {
  const txt = document.getElementById(inputId).value.trim();
  if (!txt) return;
  const duvida = btn.closest('.Duvidas');
  const resp = document.createElement('div');
  resp.style.cssText = 'margin-top:10px; padding:10px 13px; background:rgba(167,139,250,.07); border-left:3px solid #a78bfa; border-radius:7px;';
  resp.innerHTML = `<div style="font-size:10px; font-weight:700; color:#a78bfa; margin-bottom:5px; text-transform:uppercase;">Coordenador respondeu</div>
    <div style="font-size:13px; color:#7a8699;">${txt.replace(/</g, '&lt;')}</div>`;
  duvida.appendChild(resp);
  btn.parentElement.remove();
}

const CHAVE_STORAGE = "grupos_turma_2026.1";

function obterGrupos() {
  const dados = localStorage.getItem(CHAVE_STORAGE);
  return dados ? JSON.parse(dados) : [];
}

function salvarGrupos(grupos) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(grupos));
}

/* ---------- INFO DE STATUS ---------- */
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


window.abrirModalCriarGrupo = function () {
  document.getElementById("modal-criar-grupo").style.display = "flex";
};

window.fecharModalCriarGrupo = function () {
  document.getElementById("modal-criar-grupo").style.display = "none";
};


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


window.mudarStatus = function (id, novoStatus) {
  const grupos = obterGrupos();
  const grupo = grupos.find((g) => g.id === id);
  if (!grupo) return;

  grupo.status = novoStatus;
  salvarGrupos(grupos);

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
        ${g.integrantes.map((nome, i) => `
          <div id="bloco-interior">
            <div id="bolinha" ${i === 0 ? 'style="background-color:#ec3c3c;"' : ""}></div>
            <h1>${nome}</h1>
          </div>
        `).join("")}
        <div id="linhav"></div>
        <div id="bloco-inferior">
          <select class="select-status ${info.classe}" onchange="mudarStatus(${g.id}, this.value)">
            <option value="no-prazo" ${g.status === "no-prazo" ? "selected" : ""}>No prazo</option>
            <option value="atencao" ${g.status === "atencao" ? "selected" : ""}>Atenção</option>
            <option value="atraso"  ${g.status === "atraso"  ? "selected" : ""}>Atrasado</option>
          </select>
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

document.addEventListener("DOMContentLoaded", function () {
  carregarGrupos();

  const gt = document.getElementById("GT");
  if (gt) {
    gt.addEventListener("scroll", atualizarSetas);
    window.addEventListener("resize", atualizarSetas);
  }
});