

const Navegacao = {
    Painel: function() {
        window.location.href = "../Turma/index.html";
    },
    MeuGrupo: function() {
        window.location.href = "../Grupos/gp.html";
    },
    Forum: function() {
        window.location.href = "../Forum/av.html";
    },
    Inspiracoes: function() {
        window.location.href = "../Inspiracoes/Inspiracoes.html";
    },
    Configuracoes: function() {
        window.location.href = "../Configuracoes/Config.html";
    },
    Voltar: function() {
        window.history.back();
    }
};

// Aluno/navegacao.js
window.MeuGrupo = function () {
    window.location.href = "../Grupos/gp.html";   // relativo à pasta Aluno
};

function Painel() { Navegacao.Painel(); }
function MeuGrupo() { Navegacao.MeuGrupo(); }
function Forum() { Navegacao.Forum(); }
function Inspiracoes() { Navegacao.Inspiracoes(); }
function Configuracoes() { Navegacao.Configuracoes(); }
function Voltar() { Navegacao.Voltar(); }