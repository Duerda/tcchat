import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
    collection,
    getDocs,
    query,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../../backend/firebase/config.js";

const inpNome = document.getElementById("inp-nome");
const inpEmail = document.getElementById("inp-email");
const inpCurso = document.getElementById("inp-curso");

let refUsuario = null;

// Preenche o formulário com os dados do coordenador logado
onAuthStateChanged(auth, async (user) => {
    if (!user) return; // o redirecionamento é feito pelo Coord-script.js

    const snap = await getDocs(query(collection(db, "usuarios"), where("uid", "==", user.uid)));
    if (snap.empty) return;

    const documento = snap.docs[0];
    const data = documento.data();
    refUsuario = documento.ref;

    inpNome.value = data.nome || "";
    inpEmail.value = user.email || data.email || "";
    inpCurso.value = data.curso || "Coordenador";
});

// Troca de fonte
window.setFonte = function (nome, el) {
    document.body.style.fontFamily = `'${nome}', ${nome}, sans-serif`;
    document.querySelectorAll(".fonte-op").forEach((o) => o.classList.remove("ativa"));
    el.classList.add("ativa");
};

window.aplicarFonteCustom = function () {
    const v = document.getElementById("inp-fonte-custom").value.trim();
    if (!v) return;

    const familia = `'${v}', ${v}, sans-serif`;
    document.body.style.fontFamily = familia;
    document.querySelectorAll(".fonte-op").forEach((o) => o.classList.remove("ativa"));

    const prev = document.getElementById("fonte-preview");
    prev.style.display = "block";
    prev.style.fontFamily = familia;
    prev.textContent = "O rato roeu a roupa do rei de Roma. 0123456789.";
};

// Tamanho do texto
window.setTamanho = function (tam, el) {
    document.body.style.fontSize = tam + "px";
    document.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("ativo"));
    el.classList.add("ativo");
};

// Salva o nome no Firestore, para que a sidebar (Coord-script.js) também seja atualizada
window.salvarPerfil = async function () {
    const nome = inpNome.value.trim();
    if (!nome) {
        alert("Preencha o nome.");
        return;
    }

    const iniciais = nome
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    try {
        if (refUsuario) await updateDoc(refUsuario, { nome, iniciais });
        alert("Perfil salvo!");
    } catch (error) {
        console.error(error);
        alert("Não foi possível salvar o perfil.");
    }
};