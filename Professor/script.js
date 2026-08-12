<<<<<<< HEAD
function Voltar(){
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
}
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
function Configuracoes(){
    window.location.href = "/Professor/Configuracoes/Config.html";
}
=======
import { auth, db } from "../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const tipo = userDoc.exists() ? userDoc.data().tipo : null;
        if (tipo === "professor" || tipo === "coordenador") {
            usuarioAtual = user;
            carregarDadosPerfil(user.uid);
            escutarAvisos();
        } else {
            alert("Acesso negado: Esta área é exclusiva para professores e coordenadores.");
            window.location.href = "/Inicial-tela/Login/Log-aluno.html";
        }
    } else {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
});

// Funções de Navegação
window.Voltar = () =>
  auth
    .signOut()
    .then(() => (window.location.href = "/Inicial-tela/Login/Log-aluno.html"));
window.VisaoGeral = () => (window.location.href = "/Professor/Index.html");
window.Biblioteca = () =>
  (window.location.href = "/Professor/Biblioteca/Bib.html");
window.Avaliacoes = () =>
  (window.location.href = "/Professor/Avaliacoes/ava.html");
window.Grupos = () => (window.location.href = "/Professor/Grupos/grp.html");
window.Forum = () => (window.location.href = "/Professor/Forum/Avisos.html");
window.Configuracoes = () => alert("Configurações de acessibilidade em breve!");
>>>>>>> 53c1cc30d481d00e4c8562af0810f6de7883d1c6

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

