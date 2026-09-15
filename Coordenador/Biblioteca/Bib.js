import { auth, db } from "../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

window.Voltar = function(){
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
};
window.Voltar = () => auth.signOut().then(() => window.location.href = "/Inicial-tela/Login/Log-aluno.html");
window.Avaliacoes = function(){
    window.location.href = "/Professor/Avaliacoes/ava.html";
};
window.VisaoGeral = function (){ 
    window.location.href = "/Professor/Index.html";
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

// Funções de Navegação
window.Voltar = () => auth.signOut().then(() => window.location.href = "/Inicial-tela/Login/Log-aluno.html");


let usuarioAtual = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const tipo = userDoc.exists() ? userDoc.data().tipo : null;
        if (tipo === "professor" || tipo === "coordenador") {
            usuarioAtual = user;
            carregarDadosPerfil(user.uid);
            escutarBiblioteca();
        } else {
            alert("Acesso negado: Esta área é exclusiva para professores e coordenadores.");
            window.location.href = "/Inicial-tela/Login/Log-aluno.html";
        }
    } else {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
});

function carregarDadosPerfil(uid) {
    const q = query(collection(db, "usuarios"), where("uid", "==", uid));
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            document.querySelector("#foto span").textContent = data.iniciais || "";
            document.querySelector("#NomeUC h4").textContent = data.nome || "";
            document.querySelector("#NomeUC h5").textContent = data.curso || "Coordenador/Professor";
        }
    });
}

const areaLinks = document.getElementById("links");
const areaArquivos = document.getElementById("arquivos");

// Função para salvar log de acessos em Cookies (simulado via localStorage para persistência de arquivos)
function salvarLogBiblioteca(acao, nomeItem) {
    let historico = JSON.parse(localStorage.getItem("historico_biblioteca") || "[]");
    historico.unshift({ acao, nomeItem, data: new Date().toLocaleString() });
    if (historico.length > 5) historico.pop(); // Mantém apenas os 5 últimos
    localStorage.setItem("historico_biblioteca", JSON.stringify(historico));
    console.log("Cookie de histórico atualizado:", historico);
}

document.getElementById("Link").addEventListener("click", async () => {
    let nome = prompt("Digite o nome do link:");
    let imagem = prompt("Cole a URL da imagem do ícone:");
    let endereco = prompt("Digite o link do site:");

    if (nome && imagem && endereco) {
        try {
            await addDoc(collection(db, "biblioteca"), {
                nome, url: endereco, icone: imagem, tipo: "link", enviadoPor: usuarioAtual.uid,
                codigoSala: localStorage.getItem("codigoSala") || "geral"
            });
            salvarLogBiblioteca("Adicionou Link", nome);
        } catch (error) { console.error(error); }
    }
});

document.getElementById("ArquivoModelo").addEventListener("click", async () => {
    let nome = prompt("Digite o nome do arquivo:");
    let url = prompt("Cole a URL do arquivo (Ex: Google Drive/OneDrive):");

    if (nome && url) {
        try {
            await addDoc(collection(db, "biblioteca"), {
                nome, url, tipo: "arquivo", enviadoPor: usuarioAtual.uid,
                codigoSala: localStorage.getItem("codigoSala") || "geral"
            });
            salvarLogBiblioteca("Adicionou Arquivo", nome);
        } catch (error) { console.error(error); }
    }
});

function escutarBiblioteca() {
    const codigoSala = localStorage.getItem("codigoSala") || "geral";
    const q = query(collection(db, "biblioteca"), where("codigoSala", "==", codigoSala));
    
    onSnapshot(q, (snapshot) => {
        areaLinks.innerHTML = "";
        areaArquivos.innerHTML = "";

        snapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const id = docSnap.id;
            const card = document.createElement("div");
            
            if (item.tipo === "link") {
                card.className = "card-link";
                card.innerHTML = `
                    <div class="icone-box"><img src="${item.icone}" width="24"></div>
                    <a href="${item.url}" target="_blank" class="nome-link">${item.nome}</a>
                    <p class="excluir" data-id="${id}">X</p>
                `;
                areaLinks.appendChild(card);
            } else {
                card.className = "card-arquivo";
                card.innerHTML = `
                    <a href="${item.url}" target="_blank" class="nome-arquivo">${item.nome}</a>
                    <p class="excluir" data-id="${id}">X</p>
                `;
                areaArquivos.appendChild(card);
            }

            card.querySelector(".excluir").onclick = async () => {
                if (confirm("Excluir este item?")) {
                    await deleteDoc(doc(db, "biblioteca", id));
                }
            };
        });
    });
}
