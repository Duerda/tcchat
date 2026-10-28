import { addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, where, doc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../../backend/firebase/config.js";
import { fillHeader, logout, navigate, requireProfessor } from "../../../backend/firebase/professor.js";

window.Voltar = logout;
window.Avaliacoes = () => navigate("../Avaliacoes/ava.html");
window.Grupos = () => navigate("../Grupos/grp.html");
window.Forum = () => navigate("Avisos.html");
window.Biblioteca = () => navigate("../Biblioteca/Bib.html");
window.Configuracoes = () => navigate("../Configuracoes/Config.html");
window.VisaoGeral = () => navigate("../Index.html");

const content = document.getElementById("conteudo");
const createButton = document.getElementById("novo-aviso");
let user;
let profile;
let stopDoubts;

window.Cadastrar = async () => {
  if (!content || !profile?.codigoSala) return;
  content.querySelectorAll(".lista-duvidas-professor").forEach((node) => node.remove());
  const list = document.createElement("section");
  list.className = "lista-duvidas-professor";
  list.innerHTML = "<h2>Dúvidas dos alunos</h2><p>As dúvidas pendentes da sua turma aparecem aqui.</p>";
  content.appendChild(list);
  stopDoubts?.();
  const doubtsQuery = query(collection(db, "duvidas"), where("codigoSala", "==", profile.codigoSala));
  stopDoubts = onSnapshot(doubtsQuery, (snapshot) => {
    list.querySelectorAll(".card-duvida").forEach((card) => card.remove());
    const questions = [...snapshot.docs].sort((a, b) => (b.data().data?.toMillis?.() || 0) - (a.data().data?.toMillis?.() || 0));
    if (!questions.length) {
      list.querySelector("p").textContent = "Ainda não há dúvidas nesta turma.";
      return;
    }
    questions.forEach((item) => {
      const doubt = item.data();
      const card = document.createElement("article");
      card.className = "card-aviso card-duvida";
      const title = document.createElement("h3");
      title.textContent = doubt.titulo || doubt.pergunta || "Dúvida";
      const author = document.createElement("small");
      author.textContent = `Por ${doubt.autor || doubt.alunoNome || "Aluno"}`;
      const body = document.createElement("p");
      body.textContent = doubt.conteudo || doubt.pergunta || "";
      card.append(title, author, body);
      if (doubt.resposta) {
        const previous = document.createElement("p");
        previous.textContent = `Resposta de ${doubt.respondidoPor || "Professor"}: ${doubt.resposta}`;
        card.appendChild(previous);
      }
      const answer = document.createElement("textarea");
      answer.rows = 3;
      answer.maxLength = 2000;
      answer.placeholder = "Escreva a resposta que ficará visível para o aluno";
      answer.value = doubt.resposta || "";
      const send = document.createElement("button");
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
    list.querySelector("p").textContent = "Não foi possível carregar dúvidas da turma.";
  });
};

function renderNotice(item) {
  const notice = item.data();
  const card = document.createElement("article");
  card.className = "card-aviso";
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
  const noticesQuery = query(collection(db, "avisos"), where("codigoSala", "==", profile.codigoSala));
  onSnapshot(noticesQuery, (snapshot) => {
    const list = document.getElementById("lista-avisos");
    const emptyMessage = document.getElementById("avisos-vazio");
    list?.replaceChildren();
    const notices = [...snapshot.docs].sort((a, b) => (b.data().data?.toMillis?.() || 0) - (a.data().data?.toMillis?.() || 0));
    if (emptyMessage) emptyMessage.hidden = notices.length > 0;
    notices.forEach((item) => list?.appendChild(renderNotice(item)));
  }, (error) => console.error("Erro ao carregar avisos:", error));
}

createButton?.addEventListener("click", async () => {
  const title = prompt("Título do aviso:")?.trim();
  const text = prompt("Conteúdo do aviso:")?.trim();
  if (!title || !text || !profile?.codigoSala) return;
  try {
    await addDoc(collection(db, "avisos"), { titulo: title, conteudo: text, autor: profile.nome || "", autorUid: user.uid, tipoAutor: profile.tipo, codigoSala: profile.codigoSala, data: serverTimestamp() });
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
});
