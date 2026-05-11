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

const botaoSalvar = document.getElementById("salvar-avaliacao");
const botaoVoltar = document.getElementById("voltar-avaliacao");

const card = document.getElementById("card-avaliacao");
const arquivo = document.getElementById("arquivo-avaliacao");

const nota = document.getElementById("nota");
const feedback = document.getElementById("feedback");

botaoSalvar.addEventListener("click", salvarAvaliacao);

function salvarAvaliacao() {

    let confirmar = confirm("Deseja salvar a avaliação?");

    if (!confirmar) {
        return;
    }

    // Verifica se os campos foram preenchidos
    if (nota.value === "" || feedback.value === "") {
        alert("Preencha a nota e o feedback.");
        return;
    }

    // Esconde o arquivo
    arquivo.classList.add("oculto");

    // Escurece o card
    card.classList.add("card-enviado");

    // Bloqueia edição
    nota.disabled = true;
    feedback.disabled = true;

    // Esconde botão salvar
    botaoSalvar.style.display = "none";

    // Mostra botão voltar
    botaoVoltar.style.display = "inline-block";

    // Salva localmente
    localStorage.setItem("notaSalva", nota.value);
    localStorage.setItem("feedbackSalvo", feedback.value);
}

botaoVoltar.addEventListener("click", voltarAvaliacao);

function voltarAvaliacao() {

    let confirmar = confirm("Deseja voltar a avaliação?");

    if (!confirmar) {
        return;
    }

    // Mostra arquivo novamente
    arquivo.classList.remove("oculto");

    // Remove escurecimento
    card.classList.remove("card-enviado");

    // Libera edição
    nota.disabled = false;
    feedback.disabled = false;

    // Mostra salvar
    botaoSalvar.style.display = "inline-block";

    // Esconde voltar
    botaoVoltar.style.display = "none";
}