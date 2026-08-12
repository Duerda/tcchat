function Voltar()       { window.location.href = "/Inicial-tela/Cadastro/Cad.html"; }
function Turmas()       { window.location.href = "/Aluno/Turma.html"; }
function Grupo()        { window.location.href = "/Aluno/Grupo.html"; }
function Forum()        { window.location.href = "/Aluno/Forum.html"; }
function Inspiracoes()  { window.location.href = "/Aluno/Inspi.html"; }
function Configuracoes(){ window.location.href = "/Aluno/Config.html"; }

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