import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "/backend/firebase/config.js";
import { fillHeader, logout, navigate, requireProfessor } from "/backend/firebase/professor.js";

window.Voltar = logout;
window.Avaliacoes = () => navigate("../Avaliacoes/ava.html");
window.VisaoGeral = () => navigate("../Index.html");
window.Grupos = () => navigate("../Grupos/grp.html");
window.Forum = () => navigate("../Forum/Avisos.html");
window.Configuracoes = () => navigate("../Configuracoes/Config.html");

const linksArea = document.getElementById("links");
const filesArea = document.getElementById("arquivos");
let user;
let profile;

async function addResource(type) {
  const name = prompt("Nome do recurso:")?.trim();
  const url = prompt(type === "link" ? "URL do site:" : "URL do arquivo:")?.trim();
  if (!name || !url || !profile?.codigoSala) return;
  try {
    await addDoc(collection(db, "biblioteca"), { nome: name, url, tipo: type, icone: type === "link" ? "" : "", enviadoPor: user.uid, autorNome: profile.nome || "", codigoSala: profile.codigoSala, criadoEm: serverTimestamp() });
  } catch (error) {
    console.error(error);
    alert("Não foi possível salvar o recurso.");
  }
}

document.getElementById("Link")?.addEventListener("click", () => addResource("link"));
document.getElementById("ArquivoModelo")?.addEventListener("click", () => addResource("arquivo"));

function renderResource(item, id) {
  const card = document.createElement("div");
  card.className = item.tipo === "link" ? "card-link" : "card-arquivo";
  const anchor = document.createElement("a");
  anchor.href = item.url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = item.nome || "Recurso";
  anchor.className = item.tipo === "link" ? "nome-link" : "nome-arquivo";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "excluir";
  remove.textContent = "Excluir";
  remove.addEventListener("click", async () => {
    if (!confirm("Excluir este recurso?")) return;
    try { await deleteDoc(doc(db, "biblioteca", id)); } catch (error) { console.error(error); alert("Não foi possível excluir o recurso."); }
  });
  card.append(anchor, remove);
  return card;
}

function watchResources() {
  const resourcesQuery = query(collection(db, "biblioteca"), where("codigoSala", "==", profile.codigoSala));
  onSnapshot(resourcesQuery, (snapshot) => {
    if (linksArea) linksArea.innerHTML = "";
    if (filesArea) filesArea.innerHTML = "";
    snapshot.forEach((item) => {
      const resource = renderResource(item.data(), item.id);
      (item.data().tipo === "link" ? linksArea : filesArea)?.appendChild(resource);
    });
  }, (error) => console.error("Erro ao carregar biblioteca:", error));
}

requireProfessor((authenticatedUser, currentProfile) => {
  user = authenticatedUser;
  profile = currentProfile;
  fillHeader(profile);
  watchResources();
});
