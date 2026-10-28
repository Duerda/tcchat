import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../../backend/firebase/config.js";

const areaLinks = document.getElementById("links");
const areaArquivos = document.getElementById("arquivos");

let usuarioAtual = null;

// A biblioteca do coordenador é compartilhada com todos os alunos do curso.
function chaveBiblioteca() {
    const curso = localStorage.getItem("codigoCurso");
    return curso ? `curso-${curso}` : "geral";
}

function escapar(texto = "") {
    return String(texto).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
}

// Controle de acesso: somente coordenadores
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../auth/Login/Log-aluno.html";
        return;
    }
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    const tipo = userDoc.exists() ? userDoc.data().tipo : null;

    if (tipo === "coordenador") {
        usuarioAtual = user;
        escutarBiblioteca();
    } else {
        alert("Acesso negado: Esta área é exclusiva para coordenadores.");
        window.location.href = "../../auth/Login/Log-aluno.html";
    }
});

// Adicionar link
document.getElementById("Link").addEventListener("click", async () => {
    const nome = prompt("Digite o nome do link:");
    const imagem = prompt("Cole a URL da imagem do ícone:");
    const endereco = prompt("Digite o link do site:");

    if (nome && imagem && endereco) {
        try {
            await addDoc(collection(db, "biblioteca"), {
                nome,
                url: endereco,
                icone: imagem,
                tipo: "link",
                enviadoPor: usuarioAtual.uid,
                codigoSala: chaveBiblioteca()
            });
        } catch (error) {
            console.error(error);
            alert("Não foi possível adicionar o link.");
        }
    }
});

// Adicionar arquivo/modelo
document.getElementById("ArquivoModelo").addEventListener("click", async () => {
    const nome = prompt("Digite o nome do arquivo:");
    const url = prompt("Cole a URL do arquivo (Ex: Google Drive/OneDrive):");

    if (nome && url) {
        try {
            await addDoc(collection(db, "biblioteca"), {
                nome,
                url,
                tipo: "arquivo",
                enviadoPor: usuarioAtual.uid,
                codigoSala: chaveBiblioteca()
            });
        } catch (error) {
            console.error(error);
            alert("Não foi possível adicionar o arquivo.");
        }
    }
});

// Lista em tempo real
function escutarBiblioteca() {
    const q = query(collection(db, "biblioteca"), where("codigoSala", "==", chaveBiblioteca()));

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
                    <div class="icone-box"><img src="${escapar(item.icone)}" width="24"></div>
                    <a href="${escapar(item.url)}" target="_blank" class="nome-link">${escapar(item.nome)}</a>
                    <p class="excluir" data-id="${id}">X</p>
                `;
                areaLinks.appendChild(card);
            } else {
                card.className = "card-arquivo";
                card.innerHTML = `
                    <a href="${escapar(item.url)}" target="_blank" class="nome-arquivo">${escapar(item.nome)}</a>
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