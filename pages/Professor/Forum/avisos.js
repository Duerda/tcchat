import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../../../backend/firebase/config.js";

window.Voltar = () =>
    auth.signOut().then(() => {
        window.location.href = "../../auth/Login/Log-aluno.html";
    });
window.Avaliacoes = () => {
    window.location.href = "../Avaliacoes/ava.html";
};
window.Grupos = () => {
    window.location.href = "../Grupos/grp.html";
};
window.Forum = () => {
    window.location.href = "Avisos.html";
};
window.Biblioteca = () => {
    window.location.href = "../Biblioteca/Bib.html";
};
window.Configuracoes = () => {
    window.location.href = "../Configuracoes/Config.html";
};
window.VisaoGeral = () => {
    window.location.href = "../Index.html";
};
window.Cadastrar = () => {
    alert("A aba de dúvidas dos alunos ainda não está ligada ao banco. Os avisos desta sala já funcionam abaixo.");
};

let usuarioAtual = null;
let codigoSalaAtual = null;
let pararEscutaAvisos = null;

function textoSeguro(valor) {
    const el = document.createElement("span");
    el.textContent = valor == null ? "" : String(valor);
    return el.innerHTML;
}

function dataDoAviso(aviso) {
    if (aviso.data && typeof aviso.data.toDate === "function") {
        return aviso.data.toDate();
    }
    return null;
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../../auth/Login/Log-aluno.html";
        return;
    }

    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    const dados = userDoc.exists() ? userDoc.data() : null;
    const tipo = dados ? dados.tipo : null;

    if (tipo !== "professor" && tipo !== "coordenador") {
        alert("Acesso negado: esta área é exclusiva para professores e coordenadores.");
        window.location.href = "../../auth/Login/Log-aluno.html";
        return;
    }

    usuarioAtual = user;
    codigoSalaAtual = dados.codigoSala || "geral";
    localStorage.setItem("codigoSala", codigoSalaAtual);

    const foto = document.querySelector("#foto span");
    const nome = document.querySelector("#NomeUC h4");
    const curso = document.querySelector("#NomeUC h5");
    if (foto) foto.textContent = dados.iniciais || "";
    if (nome) nome.textContent = dados.nome || "";
    if (curso) curso.textContent = dados.curso || "Professor";

    escutarAvisos(codigoSalaAtual);
});

const btnNovoAviso = document.getElementById("novo-aviso");
if (btnNovoAviso) {
    btnNovoAviso.addEventListener("click", publicarAviso);
}

async function publicarAviso() {
    if (!usuarioAtual) {
        alert("Aguarde o login terminar e tente de novo.");
        return;
    }

    const titulo = prompt("Título do aviso:");
    if (titulo == null) return;
    const texto = prompt("Conteúdo do aviso:");
    if (texto == null) return;

    const tituloLimpo = titulo.trim();
    const textoLimpo = texto.trim();
    if (!tituloLimpo || !textoLimpo) {
        alert("Preencha título e conteúdo.");
        return;
    }

    const nomeAutor =
        document.querySelector("#NomeUC h4")?.textContent?.trim() || "Professor";
    const sala = codigoSalaAtual || localStorage.getItem("codigoSala") || "geral";

    try {
        await addDoc(collection(db, "avisos"), {
            titulo: tituloLimpo,
            conteudo: textoLimpo,
            autor: nomeAutor,
            autorUid: usuarioAtual.uid,
            tipoAutor: "professor",
            data: serverTimestamp(),
            codigoSala: sala
        });
        alert("Aviso publicado para a sala " + sala + ".");
    } catch (error) {
        console.error("Erro ao publicar:", error);
        alert("Não foi possível publicar o aviso. Confira as regras do Firestore no console do Firebase.");
    }
}

function escutarAvisos(codigoSala) {
    const lista = document.getElementById("lista-avisos");
    const vazio = document.getElementById("avisos-vazio");
    if (!lista) return;

    if (pararEscutaAvisos) {
        pararEscutaAvisos();
        pararEscutaAvisos = null;
    }

    const q = query(
        collection(db, "avisos"),
        where("codigoSala", "==", codigoSala)
    );

    pararEscutaAvisos = onSnapshot(
        q,
        (snapshot) => {
            const avisos = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data()
            }));

            avisos.sort((a, b) => {
                const da = dataDoAviso(a);
                const dbData = dataDoAviso(b);
                if (!da && !dbData) return 0;
                if (!da) return 1;
                if (!dbData) return -1;
                return dbData - da;
            });

            lista.innerHTML = "";
            if (vazio) {
                vazio.style.display = avisos.length ? "none" : "block";
            }

            avisos.forEach((aviso) => {
                const data = dataDoAviso(aviso);
                const dataTexto = data
                    ? data.toLocaleString("pt-BR")
                    : "Agora";
                const card = document.createElement("div");
                card.className = "card-aviso";
                card.innerHTML = `
                    <h3>${textoSeguro(aviso.titulo)}</h3>
                    <p>${textoSeguro(aviso.conteudo)}</p>
                    <div class="card-aviso-meta">
                        <small>Postado por: ${textoSeguro(aviso.autor)}</small>
                        <small>${textoSeguro(dataTexto)}</small>
                    </div>
                `;
                lista.appendChild(card);
            });
        },
        (error) => {
            console.error("Erro ao escutar avisos:", error);
            if (vazio) {
                vazio.style.display = "block";
                vazio.textContent =
                    "Não foi possível carregar os avisos. Verifique as regras do Firestore.";
            }
        }
    );
}
