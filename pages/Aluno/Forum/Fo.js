import { auth, db } from "../../../backend/firebase/config.js";
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let aluno;
let pararDeOuvir;
window.abrirBloco = (id) => {
  const bloco = document.getElementById(id);
  if (bloco) bloco.style.display = bloco.style.display === "block" ? "none" : "block";
};
window.enviarFormulario = async (event) => {
  event.preventDefault();
  if (!aluno || !auth.currentUser) return alert("Sua sessão não está pronta. Atualize a página.");
  const titulo = document.getElementById("titulo-duvida").value.trim();
  const conteudo = document.getElementById("duvida").value.trim();
  if (!titulo || !conteudo) return alert("Preencha o tema e a dúvida.");
  const botao = event.submitter;
  if (botao) botao.disabled = true;
  try {
    await addDoc(collection(db, "duvidas"), {
      titulo, conteudo, autor: aluno.nome || auth.currentUser.email,
      autorUid: auth.currentUser.uid, codigoSala: aluno.codigoSala || "geral",
      data: serverTimestamp(),
    });
    event.target.reset();
    document.getElementById("bloco-nova-duvida").style.display = "none";
  } catch (error) {
    console.error("Erro ao publicar dúvida:", error);
    alert("Não foi possível publicar a dúvida. Tente novamente.");
  } finally {
    if (botao) botao.disabled = false;
  }
};

function escutarDuvidas(codigoSala) {
  const quadro = document.getElementById("quadro");
  if (!quadro) return;
  pararDeOuvir?.();
  pararDeOuvir = onSnapshot(query(collection(db, "duvidas"), where("codigoSala", "==", codigoSala)), (snapshot) => {
    quadro.replaceChildren();
    if (snapshot.empty) {
      const vazio = document.createElement("p");
      vazio.textContent = "Ainda não há dúvidas publicadas nesta turma.";
      quadro.append(vazio);
      return;
    }
    const duvidas = snapshot.docs.map((item) => item.data()).sort((a, b) => (b.data?.toMillis?.() || 0) - (a.data?.toMillis?.() || 0));
    duvidas.forEach((item) => {
      const card = document.createElement("article");
      const titulo = document.createElement("h2");
      titulo.textContent = item.titulo || "Dúvida";
      const autor = document.createElement("h3");
      autor.textContent = `${item.autor || "Aluno"}:`;
      const conteudo = document.createElement("p");
      conteudo.textContent = item.conteudo || "";
      card.append(titulo, autor, conteudo);
      quadro.append(card);
    });
  }, (error) => {
    console.error("Erro ao carregar dúvidas:", error);
    quadro.textContent = "Não foi possível carregar as dúvidas.";
  });
}

window.alunoReady?.then((session) => {
  if (!session) return;
  aluno = session.profile;
  escutarDuvidas(aluno.codigoSala || "geral");
});
