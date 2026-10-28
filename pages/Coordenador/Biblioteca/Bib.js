import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../../backend/firebase/config.js";
import { fillHeader, logout, navigate, requireCoordinator } from "../../../backend/firebase/professor.js";

window.Voltar = logout;
window.Avaliacoes = () => navigate("../Avaliacoes/ava.html");
window.VisaoGeral = () => navigate("../Coord-Index.html");
window.Grupos = () => navigate("../Coord-Grupos.html");
window.Biblioteca = () => navigate("Bib.html");
window.Forum = () => navigate("../Coord-Forum.html");
window.Configuracoes = () => navigate("../Configuracoes/Config.html");

const linksArea = document.getElementById("links");
const filesArea = document.getElementById("arquivos");
let user;
let profile;

async function addResource(type) {
  const name = prompt("Nome do recurso:")?.trim();
  const rawUrl = prompt(type === "link" ? "URL do site:" : "URL do arquivo:")?.trim();
  if (!name || !rawUrl) return;
  const codigoSala = prompt("Código da turma no formato SIGLA-ANO (ex.: DS-1):", "DS-1")?.trim().toUpperCase();
  if (!codigoSala) return;
  if (!/^(DS|DI|HOSP|IPI|MA|SEC|ADM|INF)-[123]$/.test(codigoSala)) {
    alert("Use um código de turma válido, como DS-1.");
    return;
  }

  let url;
  try {
    url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Protocolo inválido");
  } catch {
    alert("Informe uma URL válida iniciada por http:// ou https://.");
    return;
  }

  try {
    await addDoc(collection(db, "biblioteca"), {
      nome: name,
      url: url.href,
      tipo: type,
      enviadoPor: user.uid,
      autorNome: profile.nome || "",
      codigoSala,
      criadoEm: serverTimestamp(),
    });
  } catch (error) {
    console.error("Não foi possível salvar o recurso:", error);
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
  card.appendChild(anchor);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "excluir";
  remove.textContent = "Excluir";
  remove.addEventListener("click", async () => {
    if (!confirm("Excluir este recurso?")) return;
    try {
      await deleteDoc(doc(db, "biblioteca", id));
    } catch (error) {
      console.error("Não foi possível excluir o recurso:", error);
      alert("Não foi possível excluir o recurso.");
    }
  });
  card.appendChild(remove);
  return card;
}

function watchResources() {
  const resourcesQuery = query(collection(db, "biblioteca"));
  onSnapshot(resourcesQuery, (snapshot) => {
    linksArea?.replaceChildren();
    filesArea?.replaceChildren();
    snapshot.forEach((item) => {
      const data = item.data();
      if (!["link", "arquivo"].includes(data.tipo) || !data.url) return;
      const resource = renderResource(data, item.id);
      const room = document.createElement("small");
      room.textContent = data.codigoSala || "Turma não informada";
      resource.appendChild(room);
      (data.tipo === "link" ? linksArea : filesArea)?.appendChild(resource);
    });
  }, (error) => {
    console.error("Erro ao carregar a biblioteca:", error);
    alert("Não foi possível carregar a biblioteca.");
  });
}

requireCoordinator((authenticatedUser, currentProfile) => {
  user = authenticatedUser;
  profile = currentProfile;
  fillHeader(profile);
  watchResources();
});
