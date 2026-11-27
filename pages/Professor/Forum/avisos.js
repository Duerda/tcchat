import { addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, where, doc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../../backend/firebase/config.js";
import { fillHeader, logout, navigate, requireProfessor } from "../../../backend/firebase/professor.js";
import { chooseProfileRoom, profileRooms } from "../../../backend/firebase/rooms.js";

window.Voltar = logout;
window.Avaliacoes = () => navigate("../Avaliacoes/ava.html");
window.Grupos = () => navigate("../Grupos/grp.html");
window.Forum = () => navigate("Avisos.html");
window.Biblioteca = () => navigate("../Biblioteca/Bib.html");
window.Configuracoes = () => navigate("../Configuracoes/Config.html");
window.VisaoGeral = () => navigate("../Index.html");

const createButton = document.getElementById("novo-aviso");
const noticesPanel = document.getElementById("avisos-panel");
const doubtsPanel = document.getElementById("duvidas-panel");
const noticesTab = document.getElementById("Entrar");
const doubtsTab = document.getElementById("Cadastrar");
let user;
let profile;
let stopDoubts;
let stopNotices;

function setForumView(view) {
  const showDoubts = view === "duvidas";
  if (noticesPanel) noticesPanel.hidden = showDoubts;
  if (doubtsPanel) doubtsPanel.hidden = !showDoubts;
  noticesTab?.classList.toggle("ativa", !showDoubts);
  doubtsTab?.classList.toggle("ativa", showDoubts);
  noticesTab?.setAttribute("aria-selected", String(!showDoubts));
  doubtsTab?.setAttribute("aria-selected", String(showDoubts));
}

window.Avisos = () => setForumView("avisos");
window.Cadastrar = () => setForumView("duvidas");

function watchDoubts() {
  const rooms = profileRooms(profile);
  const list = document.getElementById("lista-duvidas-professor");
  const status = document.getElementById("duvidas-status");
  if (!list) return;
  if (!rooms.length) {
    if (status) status.textContent = "Nenhuma turma está associada ao seu perfil.";
    return;
  }
  const doubtsQuery = query(collection(db, "duvidas"), where("codigoSala", rooms.length === 1 ? "==" : "in", rooms.length === 1 ? rooms[0] : rooms));
  stopDoubts = onSnapshot(doubtsQuery, (snapshot) => {
    list.replaceChildren();
    const questions = [...snapshot.docs].sort((a, b) => (b.data().data?.toMillis?.() || 0) - (a.data().data?.toMillis?.() || 0));
    if (!questions.length) {
      if (status) status.textContent = "Ainda não há dúvidas nesta turma.";
      return;
    }
    if (status) status.textContent = "As dúvidas da sua turma aparecem aqui.";
    questions.forEach((item) => {
      const doubt = item.data();
      const card = document.createElement("article");
      card.className = "card-aviso card-duvida tc-list-card";
      const title = document.createElement("h3");
      title.textContent = doubt.titulo || doubt.pergunta || "Dúvida";
      const author = document.createElement("small");
      author.className = "duvida-autor";
      author.textContent = `Por ${doubt.autor || doubt.alunoNome || "Aluno"}`;
      const body = document.createElement("p");
      body.className = "duvida-conteudo";
      body.textContent = doubt.conteudo || doubt.pergunta || "";
      card.append(title, author, body);
      if (doubt.resposta) {
        const previous = document.createElement("p");
        previous.className = "duvida-resposta-anterior";
        previous.textContent = `Resposta de ${doubt.respondidoPor || "Professor"}: ${doubt.resposta}`;
        card.appendChild(previous);
      }
      const answer = document.createElement("textarea");
      answer.className = "duvida-resposta-input";
      answer.rows = 3;
      answer.maxLength = 2000;
      answer.placeholder = "Escreva a resposta que ficará visível para o aluno";
      answer.value = doubt.resposta || "";
      const send = document.createElement("button");
      send.className = "duvida-resposta-botao";
      send.type = "button";
      send.textContent = doubt.resposta ? "Atualizar resposta" : "Responder";
      send.addEventListener("click", async () => {
        const response = answer.value.trim();
        if (!response) return alert("Escreva uma resposta antes de enviar.");
        send.disabled = true;
        try {
          await updateDoc(doc(db, "duvidas", item.id), { resposta: response, respondidoPor: profile.nome || "Professor", respondidoPorUid: user.uid, status: "respondido", respondidoEm: serverTimestamp() });
        } catch (error) {
          console.error("Não foi possível responder à dúvida:", error);
          alert("Não foi possível salvar a resposta.");
        } finally { send.disabled = false; }
      });
      card.append(answer, send);
      list.appendChild(card);
    });
  }, (error) => {
    console.error("Não foi possível carregar dúvidas:", error);
    list.replaceChildren();
    if (status) status.textContent = "Não foi possível carregar dúvidas da turma.";
  });
}

function renderNotice(item) {
  const notice = item.data();
  const card = document.createElement("article");
  card.className = "card-aviso tc-list-card";
  const title = document.createElement("h3");
  title.textContent = notice.titulo || "Aviso";
  const body = document.createElement("p");
  body.textContent = notice.conteudo || "";
  const meta = document.createElement("small");
  meta.className = "card-aviso-meta";
  const date = notice.data?.toDate ? notice.data.toDate().toLocaleDateString("pt-BR") : "Agora";
  meta.textContent = `Postado por: ${notice.autor || "Professor"} · ${date}`;
  card.append(title, body, meta);
  return card;
}

function watchNotices() {
  const rooms = profileRooms(profile);
  const noticesQuery = query(collection(db, "avisos"), where("codigoSala", rooms.length === 1 ? "==" : "in", rooms.length === 1 ? rooms[0] : rooms));
  stopNotices = onSnapshot(noticesQuery, (snapshot) => {
    const list = document.getElementById("lista-avisos");
    const emptyMessage = document.getElementById("avisos-vazio");
    list?.replaceChildren();
    const notices = [...snapshot.docs].sort((a, b) => (b.data().data?.toMillis?.() || 0) - (a.data().data?.toMillis?.() || 0));
    if (emptyMessage) emptyMessage.hidden = notices.length > 0;
    notices.forEach((item) => list?.appendChild(renderNotice(item)));
  }, (error) => {
    console.error("Erro ao carregar avisos:", error);
    const list = document.getElementById("lista-avisos");
    const emptyMessage = document.getElementById("avisos-vazio");
    list?.replaceChildren();
    if (emptyMessage) {
      emptyMessage.hidden = false;
      emptyMessage.textContent = "Não foi possível carregar os avisos desta turma.";
    }
  });
}

createButton?.addEventListener("click", async () => {
  const title = prompt("Título do aviso:")?.trim();
  const text = prompt("Conteúdo do aviso:")?.trim();
  const codigoSala = chooseProfileRoom(profile || {});
  if (!title || !text || !codigoSala) return;
  try {
    await addDoc(collection(db, "avisos"), { titulo: title, conteudo: text, autor: profile.nome || "", autorUid: user.uid, tipoAutor: profile.tipo, codigoSala, data: serverTimestamp() });
    alert("Aviso publicado no Firestore.");
  } catch (error) {
    console.error(error);
    alert("Não foi possível publicar o aviso.");
  }
});

requireProfessor((authenticatedUser, currentProfile) => {
  user = authenticatedUser;
  profile = currentProfile;
  fillHeader(profile);
  watchNotices();
  watchDoubts();
});

window.addEventListener("pagehide", () => {
  stopDoubts?.();
  stopNotices?.();
}, { once: true });
