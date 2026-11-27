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
        mensagem.className = "tc-list-empty";
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
        card.className = "quadro-aviso tc-list-card";
        const cabecalho = document.createElement("div");
        cabecalho.id = "q1";
        const autor = document.createElement("h1");
        autor.textContent = aviso.autor || "Professor";
        cabecalho.appendChild(autor);
        if (aviso.fixado === true) {
          const fixado = document.createElement("p");
          fixado.textContent = "Fixado";
          cabecalho.appendChild(fixado);
        }

        const tipoAutor = document.createElement("h2");
        tipoAutor.textContent = aviso.tipoAutor || "Coordenador";
        const data = document.createElement("h3");
        data.textContent = formatarData(aviso.data);
        const titulo = document.createElement("h4");
        titulo.textContent = aviso.titulo || "Aviso";
        const conteudo = document.createElement("h5");
        conteudo.textContent = aviso.conteudo || "";
        const divisor = document.createElement("div");
        divisor.id = "linhav";
        card.append(cabecalho, tipoAutor, data, titulo, conteudo, divisor);
        if (aviso.urgencia) {
          const urgencia = document.createElement("h6");
          urgencia.textContent = aviso.urgencia;
          card.appendChild(urgencia);
        }
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
