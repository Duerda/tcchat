window.Painel = function () {
    window.location.href = "/Aluno/Turma.html";
};
window.MeuGrupo = function () {
    window.location.href = "/Aluno/Grupos/gp.chat.html";
};
window.Inspiracoes = function () {
    window.location.href = "/Aluno/Inspiracoes/Inspiracoes.html";
};
window.Configuracoes = function () {
    window.location.href = "/Aluno/Configuracoes/Config.html";
};
window.Voltar = function () {
    window.location.href = "/Inicial-tela/Login/Log-aluno.html";
}

function abrirBloco(id) {
    var bloco = document.getElementById(id);
    
    if (bloco.style.display === 'none' || bloco.style.display === '') {
        bloco.style.display = 'block';
    } else {
        bloco.style.display = 'none';
    }
}

function fecharBloco(id) {
    var bloco = document.getElementById(id);
    bloco.style.display = 'none';
}

function enviarDuvida(event) {
    event.preventDefault();
    
    var duvida = document.getElementById('duvida').value.trim();
    
    if (duvida === '') {
        alert('Por favor, digite sua dúvida antes de enviar!');
        return;
    }
    
    alert('Dúvida enviada com sucesso!\n\n"' + duvida + '"');
    
    document.getElementById('duvida').value = '';
    fecharBloco('bloco-nova-duvida');
}

document.addEventListener('click', function(event) {
    var bloco = document.getElementById('bloco-nova-duvida');
    var botao = document.getElementById('btn-duvida');
    
    if (bloco.style.display === 'block' && 
        !bloco.contains(event.target) && 
        event.target !== botao) {
        bloco.style.display = 'none';
    }
});
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