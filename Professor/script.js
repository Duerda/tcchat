window.Voltar = function(){
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
};
window.Avaliacoes = function(){
    window.location.href = "/Professor/Avaliacoes/ava.html";
};
window.Biblioteca = function(){
    window.location.href = "/Professor/Biblioteca/Bib.html";
};
window.Grupos = function(){
    window.location.href = "/Professor/Grupos/grp.html";
};
window.Forum = function(){
    window.location.href = "/Professor/Forum/Avisos.html";
};
window.Configuracoes = function(){
    window.location.href = "/Professor/Configuracoes/Config.html";
}

document.addEventListener('DOMContentLoaded', function() {
    const spanIniciais = document.getElementById("foto").querySelector("span"); // Seleciona o span dentro de #foto
    const iniciaisSalvas = localStorage.getItem("iniciaisUsuario");
    spanIniciais.textContent = iniciaisSalvas || ""; // Define o texto ou vazio
});
document.addEventListener('DOMContentLoaded', function() {
    const spanIniciais = document.getElementById("NomeUC").querySelector("h4"); // Seleciona o span dentro de #foto
    const nomeUsuario = localStorage.getItem("nomeUsuario");
    spanIniciais.textContent = nomeUsuario || ""; // Define o texto ou vazio
});


document.addEventListener('DOMCon tentLoaded', function() {
    let nomeCurso = document.getElementById("NomeUC").querySelector("h5");

    let codigoSalvo = localStorage.getItem("codigoCurso");

    let cursos = {
        "TMA": "Técnico em Meio Ambiente",
        "DS": "Desenvolvimento de Sistemas",
        "ADM": "Administração",
        "SRC": "Secretariado",
        "TDS": "Técnico de Design de Interiores"
    };
    nomeCurso.textContent = cursos[codigoSalvo] || "";
});

