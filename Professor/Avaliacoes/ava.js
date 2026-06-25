import { auth, db } from "../../backend/firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { collection, addDoc, query, where, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Funções de Navegação
window.Voltar = () => auth.signOut().then(() => window.location.href = "/Inicial-tela/Login/Log-aluno.html");
window.VisaoGeral = () => window.location.href = "/Professor/Index.html";
window.Biblioteca = () => window.location.href = "/Professor/Biblioteca/Bib.html";
window.Avaliacoes = () => window.location.href = "/Professor/Avaliacoes/ava.html";
window.Grupos = () => window.location.href = "/Professor/Grupos/grp.html";
window.Forum = () => window.location.href = "/Professor/Forum/Avisos.html";

let usuarioAtual = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioAtual = user;
        carregarDadosPerfil(user.uid);
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

const botaoSalvar = document.getElementById("salvar-avaliacao");
const botaoVoltar = document.getElementById("voltar-avaliacao");
const card = document.getElementById("card-avaliacao");
const arquivo = document.getElementById("arquivo-avaliacao");
const nota = document.getElementById("nota");
const feedback = document.getElementById("feedback");

botaoSalvar.addEventListener("click", async () => {
    if (nota.value === "" || feedback.value === "") {
        alert("Preencha a nota e o feedback.");
        return;
    }

    if (!confirm("Deseja salvar a avaliação?")) return;

    try {
        await addDoc(collection(db, "avaliacoes"), {
            grupoId: "exemplo-grupo-1", // Em um cenário real, isso viria da seleção do grupo
            professorUid: usuarioAtual.uid,
            nota: parseFloat(nota.value),
            feedback: feedback.value,
            data: serverTimestamp()
        });

        alert("Avaliação salva com sucesso!");
        
        // Efeito visual (mantendo comportamento original)
        arquivo.style.display = "none";
        card.style.opacity = "0.7";
        nota.disabled = true;
        feedback.disabled = true;
        botaoSalvar.style.display = "none";
        botaoVoltar.style.display = "inline-block";
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
});

botaoVoltar.addEventListener("click", () => {
    if (!confirm("Deseja voltar a avaliação?")) return;
    arquivo.style.display = "flex";
    card.style.opacity = "1";
    nota.disabled = false;
    feedback.disabled = false;
    botaoSalvar.style.display = "inline-block";
    botaoVoltar.style.display = "none";
});
