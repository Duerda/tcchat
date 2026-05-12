function Voltar(){
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
}
function VisaoGeral(){
    window.location.href = "/Professor/Index.html";
}
function Avaliacoes(){  
    window.location.href = "/Professor/Avaliacoes/ava.html";
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

const botaoLink = document.getElementById("Link");
const areaLinks = document.getElementById("links");

botaoLink.addEventListener("click", criarNovoLink);

function criarNovoLink(){

    // Perguntas
    let nome = prompt("Digite o nome do link:");

    if(!nome || nome.trim() === ""){
        alert("Nome inválido.");
        return;
    }

    let imagem = prompt("Cole a URL da imagem do ícone:");

    if(!imagem || imagem.trim() === ""){
        alert("Imagem inválida.");
        return;
    }

    let endereco = prompt("Digite o link do site:");

    if(!endereco || endereco.trim() === ""){
        alert("Link inválido.");
        return;
    }

    // Cria a div principal do card
    const novoLink = document.createElement("div");
    novoLink.classList.add("card-link");

    novoLink.innerHTML = `
        <div class="icone-box">
            <img src="${imagem}" width="24">
        </div>

        <a href="${endereco}" target="_blank" class="nome-link">
            ${nome}
        </a>

        <p class="excluir">X</p>
    `;

    // Botão de excluir
    const botaoExcluir = novoLink.querySelector(".excluir");

    botaoExcluir.addEventListener("click", function(){

        let confirmar = confirm(
            "Tem certeza que deseja excluir esse link?"
        );

        if(confirmar){
            novoLink.remove();
        }

    });

    // Adiciona embaixo dos outros
    areaLinks.appendChild(novoLink);

}