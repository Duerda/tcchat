import { auth, db } from "../firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Monitorar o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário logado:", user.uid);
        carregarDadosUsuario(user.uid);
    } else {
        // Se não estiver logado, volta para o login
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
});

async function carregarDadosUsuario(uid) {
    // 1. Buscar dados do perfil do usuário no Firestore
    const userDocRef = doc(db, "usuarios", uid);
    
    // Usamos onSnapshot para que, se os dados mudarem no banco, a tela atualize na hora!
    onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            atualizarInterface(data);
        } else {
            console.error("Dados do usuário não encontrados!");
        }
    });
}

function atualizarInterface(data) {
    // Atualizar nome e curso na barra lateral
    const nomeElement = document.querySelector(".Usuario h4");
    const cursoElement = document.querySelector(".Usuario h5");
    const fotoElement = document.querySelector("#foto span");
    const tituloTurma = document.querySelector(".T1 h3 span");

    if (nomeElement) nomeElement.textContent = data.nome || "Usuário";
    if (cursoElement) cursoElement.textContent = data.codigoCurso || "Sem Curso";
    if (fotoElement) fotoElement.textContent = data.iniciais || "??";
    
    // Se o código da sala (ex: TMA-122) estiver no cadastro, atualizamos o título
    if (tituloTurma && data.codigoCurso) {
        tituloTurma.textContent = data.codigoCurso;
    }

    // Aplicar configurações de cores se existirem (conforme seu DER)
    if (data.corDestaque) {
        document.documentElement.style.setProperty('--cor-destaque', data.corDestaque);
        // Exemplo: mudar a cor dos títulos ou botões dinamicamente
        const spans = document.querySelectorAll("span");
        spans.forEach(s => s.style.color = data.corDestaque);
    }
}

// Funções de navegação (mantendo as que você já tinha, mas agora protegidas)
window.Voltar = () => {
    auth.signOut().then(() => {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    });
};

window.Configuracoes = () => {
    // Aqui você pode levar para uma página que salva as cores no Firestore
    alert("Indo para configurações da sala " + (localStorage.getItem("codigoCurso") || ""));
};
