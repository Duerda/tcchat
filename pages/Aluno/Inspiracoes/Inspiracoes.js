import { auth, db } from "../../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
// Inspiracoes.js

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
});

// Função de navegação para as páginas específicas
function irPara(tipo) {
    if (tipo === 'todos') {
        window.location.href = "/pages/Aluno/Inspiracoes/Inspiracoes.html";
    } else {
        const nomeArquivo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        window.location.href = "/pages/Aluno/Inspiracoes/Inspiracoes-" + nomeArquivo + ".html";
    }
}

let filtroAtual = 'todos';

function setFiltro(tipo, btn) {
    filtroAtual = tipo;
    document.querySelectorAll('.filtro').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    aplicarFiltros();
}

function filtrarInspi() {
    aplicarFiltros();
}

function aplicarFiltros() {
    const busca = document.getElementById('busca-inp').value.toLowerCase().trim();
    const containers = document.querySelectorAll('#TCCs');
    containers.forEach(container => {
        const cards = container.children;
        for (let card of cards) {
            const temaEl = card.querySelector('#tema');
            const tema = temaEl ? temaEl.textContent.trim().toLowerCase() : '';
            const textoCard = card.textContent.toLowerCase();
            let temaOK = (filtroAtual === 'todos' || tema === filtroAtual);
            let buscaOK = (busca === '' || textoCard.includes(busca));
            card.style.display = (temaOK && buscaOK) ? '' : 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const btnTodos = document.querySelector('.filtro.ativo') || document.querySelector('.filtro');
    if (btnTodos) setFiltro('todos', btnTodos);
});