import { auth, db } from "../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";


let usuarioAtual = null

onAuthStateChanged(auth, (user)=>{

    if(user){
        usuarioAtual = user
    } else {
        console.log("Nenhum usuário logado")
    } 
});

async function criarGrupo(){
    
    const nome = document.getElementById("nomeGrupo").value.trim();
    const descricao = document.getElementById("descricaoGrupo").value.trim();
    
    if (!nome || !descricao) {
        alert("Preencha todos os campos");
        return;
    }
    
    try{
        
        await addDoc(collection(db, "grupos"),{
            nome: nome,
            descricao: descricao,
            codigoSala: localStorage.getItem("codigoSala"),
            criadorUid: usuarioAtual.uid,
            criadoEm: serverTimestamp()
        });
    } catch (erro) {
        console.error(erro);
        alert("Erro ao criar grupo")
    }
}

const btnCriarGrupo = document.getElementById("btnCriarGrupo");
const btnSalvarGrupo = document.getElementById("salvarGrupo");
const btnCancelarGrupo = document.getElementById("cancelarGrupo");

const formularioGrupo = document.getElementById("formGrupo");

btnCriarGrupo.addEventListener("click", () => {
    formularioGrupo.style.display = "block"
})

btnCancelarGrupo.addEventListener("click", () => {

    formularioGrupo.style.display = "none";

});

if (dados.tipo === "aluno" || "coordenador") {
    btnCriarGrupo.style.display = "block"; 
} else {
    btnCriarGrupo.style.display = "none"
}

btnSalvarGrupo.addEventListener("click", criarGrupo);

function Voltar(){
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
}
function Avaliacoes(){
    window.location.href = "/Professor/Avaliacoes/ava.html";
}
function Biblioteca(){
    window.location.href = "/Professor/Biblioteca/Bib.html";
}
function VisaoGeral(){
    window.location.href = "/Professor/Index.html";
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
