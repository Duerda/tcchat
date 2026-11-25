import { auth, db } from "../../backend/firebase/config.js"; // VERIFIQUE O CAMINHO AQUI
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "/pages/Auth/Login/Log-prof.html";
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.tipo === "professor" || data.tipo === "coordenador") {
                const nomeEl = document.querySelector(".Usuario h4");
                const cursoEl = document.querySelector(".Usuario h5");
                const iniciaisEl = document.querySelector("#foto span");

                if (nomeEl) nomeEl.textContent = data.nome || "Usuário";
                if (cursoEl) cursoEl.textContent = data.curso || "Sem Curso";
                
                if (iniciaisEl) {
                    iniciaisEl.textContent = data.iniciais || (data.nome || "").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                }
            }
        }
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
    }
});