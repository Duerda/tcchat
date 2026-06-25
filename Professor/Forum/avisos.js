import { auth, db } from "../../backend/firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Funções de Navegação
window.Voltar = () => auth.signOut().then(() => window.location.href = "/Inicial-tela/Login/Log-aluno.html");
window.VisaoGeral = () => window.location.href = "/Professor/Index.html";
window.Biblioteca = () => window.location.href = "/Professor/Biblioteca/Bib.html";
window.Avaliacoes = () => window.location.href = "/Professor/Avaliacoes/ava.html";
window.Grupos = () => window.location.href = "/Professor/Grupos/grp.html";
window.Forum = () => window.location.href = "/Professor/Forum/Avisos.html";

let usuarioAtual = null;

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

function carregarDadosPerfil(uid) {
    const userDocRef = collection(db, "usuarios");
    const q = query(collection(db, "usuarios"), where("uid", "==", uid));
    
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            document.querySelector("#foto span").textContent = data.iniciais || "";
            document.querySelector("#NomeUC h4").textContent = data.nome || "";
            document.querySelector("#NomeUC h5").textContent = data.curso || "Coordenador/Professor";
            localStorage.setItem("codigoSala", data.codigoSala || "geral");
        }
    });
}

// Lógica de Avisos
const btnNovoAviso = document.getElementById("novo-aviso");
const conteudoPrincipal = document.getElementById("conteudo");

btnNovoAviso.addEventListener("click", async () => {
    const titulo = prompt("Título do aviso:");
    const texto = prompt("Conteúdo do aviso:");

    if (titulo && texto) {
        try {
            await addDoc(collection(db, "avisos"), {
                titulo: titulo,
                conteudo: texto,
                autor: document.querySelector("#NomeUC h4").textContent,
                autorUid: usuarioAtual.uid,
                data: serverTimestamp(),
                codigoSala: localStorage.getItem("codigoSala") || "geral"
            });
            alert("Aviso publicado!");
        } catch (error) {
            console.error("Erro ao publicar:", error);
        }
    }
});

function escutarAvisos() {
    const codigoSala = localStorage.getItem("codigoSala") || "geral";
    const q = query(
        collection(db, "avisos"), 
        where("codigoSala", "==", codigoSala),
        orderBy("data", "desc")
    );

    onSnapshot(q, (snapshot) => {
        // Remover avisos antigos (mantendo os botões superiores)
        const avisosExistentes = document.querySelectorAll(".card-aviso");
        avisosExistentes.forEach(a => a.remove());

        snapshot.forEach((doc) => {
            const aviso = doc.data();
            const card = document.createElement("div");
            card.className = "card-aviso";
            card.style.cssText = "background: #161d2a; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #ffffff12;";
            
            card.innerHTML = `
                <h3 style="color: #3c94ec; margin: 0;">${aviso.titulo}</h3>
                <p style="color: #e4e9f4; margin: 10px 0;">${aviso.conteudo}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <small style="color: #7a8699;">Postado por: ${aviso.autor}</small>
                    <small style="color: #7a8699;">${aviso.data ? new Date(aviso.data.toDate()).toLocaleDateString() : 'Agora'}</small>
                </div>
            `;
            conteudoPrincipal.appendChild(card);
        });
    });
}
