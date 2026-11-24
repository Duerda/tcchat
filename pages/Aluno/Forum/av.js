import { db } from "../../../backend/firebase/config.js";
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

function formatarData(valor) {
  const date = valor?.toDate?.() || (valor instanceof Date ? valor : valor ? new Date(valor) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("pt-BR") : "Agora";
}

function escutarAvisos(codigoSala) {
  const lista = document.getElementById("quadro");
  
  if (!lista) {
      document.body.classList.add("pronto");
      return;
  }

  onSnapshot(
    query(collection(db, "avisos"), where("codigoSala", "==", codigoSala)), 
    (snapshot) => {
      lista.replaceChildren();
      
      if (snapshot.empty) {
        const mensagem = document.createElement("p");
        mensagem.textContent = "Não há avisos para sua turma no momento.";
        mensagem.style.color = "#a0aec0";
        mensagem.style.fontSize = "16px";
        lista.appendChild(mensagem);
        document.body.classList.add("pronto");
        return;
      }

      const avisos = snapshot.docs.map((item) => item.data()).sort((a, b) => (b.data?.toMillis?.() || 0) - (a.data?.toMillis?.() || 0));
      
      avisos.forEach((aviso) => {
        const card = document.createElement("div");
        card.className = "quadro-aviso";
        card.innerHTML = `
            <div id="q1">
                <h1>${aviso.autor || "Professor"}</h1>
                <p>${aviso.fixado ? "Fixado" : ""}</p>
            </div>
            <h2>${aviso.tipoAutor || "Coordenador"}</h2>
            <h3>${formatarData(aviso.data)}</h3>
            <h4>${aviso.titulo || "Aviso"}</h4>
            <h5>${aviso.conteudo || ""}</h5>
            <div id="linhav"></div>
            <h6>${aviso.urgencia || "Urgente"}</h6>
        `;
        lista.appendChild(card);
      });

      document.body.classList.add("pronto");
    }, 
    (error) => {
      console.error("Erro ao carregar avisos:", error);
      lista.textContent = "Não foi possível carregar os avisos.";
      document.body.classList.add("pronto");
    }
  );
}

window.alunoReady?.then((session) => {
  if (session) {
      escutarAvisos(session.profile.codigoSala || "geral");
  } else {
      document.body.classList.add("pronto");
  }
});

setTimeout(() => {
    document.body.classList.add("pronto");
}, 3000);