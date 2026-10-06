import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../../../backend/firebase/config.js";

let perfilRef = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "../../auth/Login/Log-aluno.html";
    return;
  }
  perfilRef = doc(db, "usuarios", user.uid);
  const snap = await getDoc(perfilRef);
  if (!snap.exists() || snap.data().tipo !== "aluno") {
    location.href = "../../auth/Login/Log-aluno.html";
    return;
  }
  const dados = snap.data();
  const foto = document.querySelector("#foto span");
  const nome = document.querySelector("#NomeUC h4");
  const curso = document.querySelector("#NomeUC h5");
  if (foto) foto.textContent = dados.iniciais || "";
  if (nome) nome.textContent = dados.nome || "";
  if (curso) curso.textContent = dados.curso || "";

  escutarAvisos(dados.codigoSala || "geral");
});

function textoSeguro(valor) {
    const el = document.createElement("span");
    el.textContent = valor == null ? "" : String(valor);
    return el.innerHTML;
}

function escutarAvisos(codigoSala) {
    const lista = document.getElementById("lista-avisos");
    const vazio = document.getElementById("avisos-vazio");
    if (!lista) return;

    const q = query(
        collection(db, "avisos"),
        where("codigoSala", "==", codigoSala)
    );

    onSnapshot(q, (snapshot) => {
        const avisos = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data()
        }));

        avisos.sort((a, b) => {
            const da = a.data && a.data.toDate ? a.data.toDate() : null;
            const dbData = b.data && b.data.toDate ? b.data.toDate() : null;
            if (!da && !dbData) return 0;
            if (!da) return 1;
            if (!dbData) return -1;
            return dbData - da;
        });

        lista.innerHTML = "";
        if (vazio) vazio.style.display = avisos.length ? "none" : "block";

        avisos.forEach((aviso) => {
            const data = aviso.data && aviso.data.toDate ? aviso.data.toDate() : null;
            const quadro = document.createElement("div");
            quadro.className = "quadro-aviso";
            quadro.innerHTML = `
                <div id="q1">
                    <h1>${textoSeguro(aviso.autor || "Professor")}</h1>
                </div>
                <h2>${textoSeguro(aviso.tipoAutor || "Aviso")}</h2>
                <h3>${textoSeguro(data ? data.toLocaleString("pt-BR") : "Agora")}</h3>
                <h4>${textoSeguro(aviso.titulo)}</h4>
                <h5>${textoSeguro(aviso.conteudo)}</h5>
            `;
            lista.appendChild(quadro);
        });
    });
}
