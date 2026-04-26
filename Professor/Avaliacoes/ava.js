function Voltar(){
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
}
function VisaoGeral(){
    window.location.href = "/Professor/Index.html";
}
function Biblioteca(){
    window.location.href = "/Professor/Biblioteca/Bib.html";
}

document.addEventListener('DOMContentLoaded', function() {
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

const botaoenviar= document.getElementById("Salvar Avaliação");

botaoenviar.addEventListener("click", enviarFormulario);

function enviarFormulario(){

    // Perguntas
    let salvar = confirm("Deseja salvar a avaliação?");

    if(!salvar){
        return true;
    }}