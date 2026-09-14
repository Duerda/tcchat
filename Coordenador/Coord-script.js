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

// ===== NAVEGAÇÃO =====
window.Voltar       = () => auth.signOut().then(() => window.location.href = "/Inicial-tela/Login/Log-aluno.html");
window.Painel       = () => window.location.href = "/Coordenador/Coord-Index.html";
window.Usuarios     = () => window.location.href = "/Coordenador/Coord-Usuarios.html";
window.Cursos       = () => window.location.href = "/Coordenador/Coord-Cursos.html";
window.GruposCoord  = () => window.location.href = "/Coordenador/Coord-Grupos.html";
window.Avaliacoes   = () => window.location.href = "/Coordenador/Coord-Avaliacoes.html";
window.Cronograma   = () => window.location.href = "/Coordenador/Coord-Cronograma.html";
window.Biblioteca   = () => window.location.href = "/Coordenador/Coord-Biblioteca.html";
window.Forum        = () => window.location.href = "/Coordenador/Coord-Forum.html";
window.Relatorios   = () => window.location.href = "/Coordenador/Coord-Relatorios.html";
window.Configuracoes= () => window.location.href = "/Coordenador/Coord-Config.html";

// ===== AUTH =====
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verificação de tipo temporariamente desabilitada
        carregarPerfil(user.uid);
    } else {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
});

// ===== PERFIL =====
function carregarPerfil(uid) {
    const q = query(collection(db, "usuarios"), where("uid", "==", uid));
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            document.querySelector("#foto span").textContent  = data.iniciais || "";
            document.querySelector("#NomeUC h4").textContent  = data.nome    || "";
            document.querySelector("#NomeUC h5").textContent  = data.curso   || "Coordenador";
        }
    });
}
// ===== ABAS =====
function mudarAba(id) {
    document.querySelectorAll('.conteudo-aba').forEach(a => a.style.display = 'none');
    document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
    document.getElementById('tab-' + id).style.display = 'block';
    document.getElementById('aba-' + id).classList.add('ativa');
}

// ===== USUÁRIOS =====
function gerarCodigo(tipo) {
    const curso  = prompt('Curso (DS ou TMA):');
    if (!curso) return;
    const letra  = prompt('Turma (A, B...):') || 'A';
    const ano    = new Date().getFullYear();
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

// ===== GRUPOS =====
function sortearGrupos() {
    alert('Sorteio automático executado! Os alunos foram distribuídos nos grupos.');
}

function criarGrupo() {
    const nome = prompt('Nome do grupo:');
    if (!nome) return;
    const desc = prompt('Descrição do projeto:') || 'Sem descrição';
    const grid = document.getElementById('listaGruposCoord');
    if (!grid) return;
    const div = document.createElement('div');
    div.className = 'GT';
    div.innerHTML = `
        <div class="sub-title-gp">
            <div style="display:flex; justify-content:space-between; padding: 0 20px;">
                <h3>Novo · 0/5</h3>
                <h1 style="margin:0; font-size:13px;">No Prazo</h1>
            </div>
            <h2>${nome}</h2>
            <p>${desc}</p>
            <div class="GT-int">
                <hr class="linha-decorativa">
                <p style="padding:12px; color:#3d4d61; font-style:italic;">Sem membros ainda</p>
            </div>
            <div id="Tcc-conteudo-inferior">
                <div id="progresso">No Prazo</div>
                <div id="Orientador">Sem orientador</div>
            </div>
            <div style="display:flex; gap:7px; padding: 0 20px 15px;">
                <button class="btn-tabela" onclick="adicionarMembro(this)">+ Membro</button>
                <button class="btn-tabela" onclick="definirOrientador(this)">Orientador</button>
                <button class="btn-tabela vermelho" onclick="excluirGrupo(this)">Excluir</button>
            </div>
        </div>`;
    grid.appendChild(div);
}

function adicionarMembro(btn) {
    const nome = prompt('Nome do aluno:');
    if (!nome) return;
    const gtInt = btn.closest('.sub-title-gp').querySelector('.GT-int');
    const semMembros = gtInt.querySelector('p[style*="italic"]');
    if (semMembros) semMembros.remove();
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.innerHTML = `<div class="BL" style="background:#3d4d61;"></div><p style="color:#7a8699;">${nome}</p>`;
    gtInt.appendChild(div);
}

function definirOrientador(btn) {
    const nome = prompt('Nome do professor orientador:');
    if (!nome) return;
    const orientador = btn.closest('#Tcc-conteudo-inferior')
        ? btn.closest('#Tcc-conteudo-inferior').querySelector('#Orientador')
        : btn.closest('.sub-title-gp').querySelector('#Orientador');
    if (orientador) orientador.textContent = nome;
}

function excluirGrupo(btn) {
    if (confirm('Excluir este grupo?')) btn.closest('.GT').remove();
}

function configurarLimites() {
    const max = prompt('Máximo de alunos por grupo (atual: 5):');
    if (max) alert(`Limite atualizado para ${max} alunos por grupo.`);
}

// ===== FÓRUM =====
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
                <h3 style="margin: 0 0 5px; color:#e4e9f4;">${titulo.replace(/</g,'&lt;')}</h3>
                <span style="color:#3d4d61; font-size:12px;">Você · agora</span>
            </div>
            <button class="btn-tabela vermelho" onclick="this.closest('.Cards').remove()">Remover</button>
        </div>
        <p style="color:#7a8699; margin:8px 0 0;">${texto.replace(/</g,'&lt;')}</p>`;
    lista.prepend(div);
}

function responderDuvida(inputId, btn) {
    const txt = document.getElementById(inputId).value.trim();
    if (!txt) return;
    const duvida = btn.closest('.Duvidas');
    const resp = document.createElement('div');
    resp.style.cssText = 'margin-top:10px; padding:10px 13px; background:rgba(167,139,250,.07); border-left:3px solid #a78bfa; border-radius:7px;';
    resp.innerHTML = `<div style="font-size:10px; font-weight:700; color:#a78bfa; margin-bottom:5px; text-transform:uppercase;">Coordenador respondeu</div>
        <div style="font-size:13px; color:#7a8699;">${txt.replace(/</g,'&lt;')}</div>`;
    duvida.appendChild(resp);
    btn.parentElement.remove();
}
