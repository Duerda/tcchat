
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
