import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../backend/firebase/config.js";
import { requireCoordinator } from "../../backend/firebase/professor.js";

const areaLinks = document.getElementById("links");
const areaArquivos = document.getElementById("arquivos");

let usuarioAtual = null;

// Usa o mesmo codigoSala consultado nas telas de aluno e professor.
function chaveBiblioteca() {
    const sala = document.getElementById("codigo-sala-biblioteca")?.value.trim().toUpperCase();
    if (!sala || !/^[A-Z]{2,6}-\d{1,2}$/.test(sala)) {
        alert("Informe um código de turma válido, como DS-3.");
        return null;
    }
    return sala;
}

function escapar(texto = "") {
    return String(texto).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
}

// Usa a mesma proteção das demais telas: perfil de coordenação ativo e e-mail confirmado.
requireCoordinator((user) => {
    usuarioAtual = user;
    escutarBiblioteca();
});

// Adicionar link
document.getElementById("Link")?.addEventListener("click", async () => {
    const codigoSala = chaveBiblioteca();
    if (!codigoSala || !usuarioAtual) return;
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
                codigoSala
            });
        } catch (error) {
            console.error(error);
            alert("Não foi possível adicionar o link.");
        }
    }
});

// Adicionar arquivo/modelo
document.getElementById("ArquivoModelo")?.addEventListener("click", async () => {
    const codigoSala = chaveBiblioteca();
    if (!codigoSala || !usuarioAtual) return;
    const nome = prompt("Digite o nome do arquivo:");
    const url = prompt("Cole a URL do arquivo (Ex: Google Drive/OneDrive):");

    if (nome && url) {
        try {
            await addDoc(collection(db, "biblioteca"), {
                nome,
                url,
                tipo: "arquivo",
                enviadoPor: usuarioAtual.uid,
                codigoSala
            });
        } catch (error) {
            console.error(error);
            alert("Não foi possível adicionar o arquivo.");
        }
    }
});

// Lista em tempo real
function escutarBiblioteca() {
    const salaInput = document.getElementById("codigo-sala-biblioteca");
    let pararDeOuvir = null;
    const carregarSala = () => {
        const codigoSala = chaveBiblioteca();
        if (!codigoSala) return;
        pararDeOuvir?.();
        const q = query(collection(db, "biblioteca"), where("codigoSala", "==", codigoSala));
        pararDeOuvir = onSnapshot(q, (snapshot) => {
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
        }, (error) => {
            console.error("Não foi possível carregar a biblioteca da turma:", error);
            alert("Não foi possível carregar os recursos desta turma.");
        });
    };
    if (areaLinks) areaLinks.textContent = "Informe um código de turma para listar os recursos.";
    if (areaArquivos) areaArquivos.textContent = "Informe um código de turma para listar os recursos.";
    salaInput?.addEventListener("change", carregarSala);
}
