import { auth, db } from "../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/pages/Auth/Login/Log-aluno.html";
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (!userDoc.exists() || userDoc.data().tipo !== "aluno") {
            alert("Acesso negado: Esta área é exclusiva para alunos.");
            window.location.href = "/pages/Auth/Login/Log-aluno.html";
            return;
        }

        const data = userDoc.data();

        // Libera a página (se o CSS usar visibility: hidden)
        document.body.classList.add("pronto");

        // Preenche nome
        const nomeEl = document.querySelector(".Usuario h4");
        if (nomeEl) nomeEl.textContent = data.nome || "Usuário";

        // Preenche curso
        const cursoEl = document.querySelector(".Usuario h5");
        if (cursoEl) cursoEl.textContent = data.curso || "Sem Curso";

        // Preenche iniciais
        const iniciaisEl = document.querySelector("#foto span");
        if (iniciaisEl) {
            if (data.iniciais) {
                iniciaisEl.textContent = data.iniciais;
            } else if (data.nome) {
                iniciaisEl.textContent = data.nome
                    .split(" ")
                    .map(w => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
            }
        }
    } catch (err) {
        console.error("Erro ao carregar dados do aluno:", err);
        document.body.classList.add("pronto");
    }
});