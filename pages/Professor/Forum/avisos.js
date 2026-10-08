import { addDoc, collection, onSnapshot, query, serverTimestamp, updateDoc, where, doc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "/backend/firebase/config.js";
import { fillHeader, logout, navigate, requireProfessor } from "/backend/firebase/professor.js";

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

window.Cadastrar = async () => {
  if (!content || !profile?.codigoSala) return;
  const doubtsQuery = query(collection(db, "duvidas"), where("codigoSala", "==", profile.codigoSala));
  onSnapshot(doubtsQuery, (snapshot) => {
    content.querySelectorAll(".card-duvida").forEach((card) => card.remove());
    snapshot.forEach((item) => {
      const doubt = item.data();
      if (doubt.status === "respondido") return;
      const card = document.createElement("article");
      card.className = "card-aviso card-duvida";
      const answer = prompt(`Dúvida de ${doubt.alunoNome || "aluno"}:\n${doubt.pergunta || ""}\n\nDigite a resposta ou cancele:`);
      card.textContent = `${doubt.alunoNome || "Aluno"}: ${doubt.pergunta || "Dúvida pendente"}`;
      content.appendChild(card);
      if (answer?.trim()) updateDoc(doc(db, "duvidas", item.id), { resposta: answer.trim(), respondidoPor: profile.nome || "", status: "respondido", respondidoPorUid: user.uid });
    });
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
  const date = notice.data?.toDate ? notice.data.toDate().toLocaleDateString("pt-BR") : "Agora";
  meta.textContent = `Postado por: ${notice.autor || "Professor"} · ${date}`;
  card.append(title, body, meta);
  return card;
}

function watchNotices() {
  const noticesQuery = query(collection(db, "avisos"), where("codigoSala", "==", profile.codigoSala));
  onSnapshot(noticesQuery, (snapshot) => {
    content?.querySelectorAll(".card-aviso").forEach((card) => card.remove());
    const notices = [...snapshot.docs].sort((a, b) => (b.data().data?.toMillis?.() || 0) - (a.data().data?.toMillis?.() || 0));
    notices.forEach((item) => content?.appendChild(renderNotice(item)));
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
