import { db } from "../../../backend/firebase/config.js";
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

function formatarData(valor) {
  const date = valor?.toDate?.() || (valor instanceof Date ? valor : valor ? new Date(valor) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("pt-BR") : "Agora";
}
function escutarAvisos(codigoSala) {
  const lista = document.getElementById("lista-avisos") || document.getElementById("quadro");
  const vazio = document.getElementById("avisos-vazio");
  if (!lista) return;
  onSnapshot(query(collection(db, "avisos"), where("codigoSala", "==", codigoSala)), (snapshot) => {
    lista.replaceChildren();
    if (vazio) vazio.hidden = !snapshot.empty;
    if (snapshot.empty) {
      const mensagem = document.createElement("p");
      mensagem.textContent = "Não há avisos para sua turma no momento.";
      lista.appendChild(mensagem);
      return;
    }
    const avisos = snapshot.docs.map((item) => item.data()).sort((a, b) => (b.data?.toMillis?.() || 0) - (a.data?.toMillis?.() || 0));
    avisos.forEach((aviso) => {
      const card = document.createElement("article");
      card.className = "quadro-aviso";
      const autor = document.createElement("h2");
      autor.textContent = `${aviso.tipoAutor || "Aviso"} · ${aviso.autor || "Professor"}`;
      const data = document.createElement("p");
      data.textContent = formatarData(aviso.data);
      const titulo = document.createElement("h3");
      titulo.textContent = aviso.titulo || "Aviso";
      const conteudo = document.createElement("p");
      conteudo.textContent = aviso.conteudo || "";
      card.append(autor, data, titulo, conteudo);
      lista.appendChild(card);
    });
  }, (error) => {
    console.error("Erro ao carregar avisos:", error);
    lista.textContent = "Não foi possível carregar os avisos.";
  });
}

window.alunoReady?.then((session) => {
  if (session) escutarAvisos(session.profile.codigoSala || "geral");
});
