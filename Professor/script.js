// Função de Logout Real
window.Voltar = () => {
    // Tenta usar o auth se estiver disponível, senão apenas redireciona
    try {
        localStorage.clear();
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    } catch (e) {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
};

window.VisaoGeral = () => window.location.href = "/Professor/Index.html";
window.Configuracoes = () => alert("Configurações de acessibilidade em breve!");
function Avaliacoes(){
    window.location.href = "/Professor/Avaliacoes/ava.html";
}
function Biblioteca(){
    window.location.href = "/Professor/Biblioteca/Bib.html";
}
function Grupos(){
    window.location.href = "/Professor/Grupos/grp.html";
}
function Forum(){
    window.location.href = "/Professor/Forum/Avisos.html";
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