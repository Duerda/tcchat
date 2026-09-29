// Inspiracoes.js

// Função de navegação para as páginas específicas
function irPara(tipo) {
    if (tipo === 'todos') {
        window.location.href = "Inspiracoes.html";
    } else {
        // Converte a primeira letra para maiúscula para combinar com os nomes dos arquivos
        const nomeArquivo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        window.location.href = "Inspiracoes-" + nomeArquivo + ".html";
    }
}

// ------------------------------------------------------------
// As funções abaixo são para a página principal (Inspiracoes.html)
// que ainda usa filtros via JavaScript. Se você não for mais usar
// filtros na página principal, pode removê-las ou mantê-las comentadas.

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

// Inicializa a página com todos os cards visíveis
document.addEventListener('DOMContentLoaded', function() {
    // Se houver um botão 'Todos' ativo, use-o; senão, usa o primeiro
    const btnTodos = document.querySelector('.filtro.ativo') || document.querySelector('.filtro');
    if (btnTodos) setFiltro('todos', btnTodos);
});