import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../../backend/firebase/config.js";
import { supabase, SUPABASE_STORAGE_BUCKET } from "../../../backend/supabase/supabase.js";
import { fillHeader, logout, navigate, requireProfessor } from "../../../backend/firebase/professor.js";
import { chooseProfileRoom, profileRooms } from "../../../backend/firebase/rooms.js";

window.Voltar = logout;
window.Avaliacoes = () => navigate("../Avaliacoes/ava.html");
window.VisaoGeral = () => navigate("../Index.html");
window.Grupos = () => navigate("../Grupos/grp.html");
window.Forum = () => navigate("../Forum/Avisos.html");
window.Configuracoes = () => navigate("../Configuracoes/Config.html");

const linksArea = document.getElementById("links");
const filesArea = document.getElementById("arquivos");
const fileInput = document.getElementById("arquivo-modelo-input");
const statusElement = document.getElementById("status-biblioteca-professor");
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const FILE_TYPES = new Map([
  ["pdf", "application/pdf"],
  ["doc", "application/msword"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["odt", "application/vnd.oasis.opendocument.text"],
  ["zip", "application/zip"],
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
]);
let user;
let profile;

function setStatus(message) {
  if (statusElement) statusElement.textContent = message;
}

async function addResource(type) {
  const name = prompt("Nome do recurso:")?.trim();
  const url = prompt("URL do site:")?.trim();
  const codigoSala = chooseProfileRoom(profile || {});
  if (!name || !url || !codigoSala) return;
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Use uma URL iniciada por http:// ou https://.");
    await addDoc(collection(db, "biblioteca"), { nome: name, url: parsedUrl.href, tipo: type, icone: "", enviadoPor: user.uid, autorNome: profile.nome || "", codigoSala, criadoEm: serverTimestamp() });
    setStatus("Link adicionado à biblioteca.");
  } catch (error) {
    console.error(error);
    alert(error.message || "Não foi possível salvar o link.");
  }
}

document.getElementById("Link")?.addEventListener("click", () => addResource("link"));
document.getElementById("ArquivoModelo")?.addEventListener("click", () => fileInput?.click());

fileInput?.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file || !user || !profile) return;
  const room = chooseProfileRoom(profile);
  if (!room) { fileInput.value = ""; return; }
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const contentType = FILE_TYPES.get(extension);
  if (!contentType) { alert("Formato não permitido. Use PDF, DOC, DOCX, ODT, ZIP, PNG ou JPG."); fileInput.value = ""; return; }
  if (file.size > MAX_FILE_SIZE) { alert("O arquivo ultrapassa o limite de 25 MB."); fileInput.value = ""; return; }

  const safeName = file.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "arquivo";
  const path = `${user.uid}/biblioteca/${room}/${crypto.randomUUID()}-${safeName}`;
  const button = document.getElementById("ArquivoModelo");
  if (button) { button.disabled = true; button.textContent = "Enviando arquivo…"; }
  setStatus("Enviando arquivo para a biblioteca…");
  try {
    const { error: uploadError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET)
      .upload(path, file, { contentType, upsert: false });
    if (uploadError) throw uploadError;
    try {
      await addDoc(collection(db, "biblioteca"), {
        nome: file.name, arquivoNome: file.name, arquivoPath: path, contentType,
        tipo: "arquivo", enviadoPor: user.uid, autorNome: profile.nome || "", codigoSala: room,
        criadoEm: serverTimestamp(),
      });
    } catch (error) {
      const { error: cleanupError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([path]);
      if (cleanupError) console.error("Não foi possível remover o upload incompleto:", cleanupError);
      throw error;
    }
    setStatus("Arquivo adicionado à biblioteca.");
  } catch (error) {
    console.error("Não foi possível enviar o arquivo:", error);
    setStatus(error.message || "Não foi possível enviar o arquivo. Confira o Supabase Storage.");
  } finally {
    fileInput.value = "";
    if (button) { button.disabled = false; button.textContent = "+ Arquivo/Modelo"; }
  }
});

async function renderResource(item, id) {
  const card = document.createElement("div");
  card.className = item.tipo === "link" ? "card-link" : "card-arquivo";
  const anchor = document.createElement("a");
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = item.arquivoPath ? `Preparando arquivo: ${item.arquivoNome || item.nome || "arquivo"}` : item.nome || "Recurso";
  anchor.className = item.tipo === "link" ? "nome-link" : "nome-arquivo";
  if (item.arquivoPath) {
    const { data, error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).createSignedUrl(item.arquivoPath, 60 * 60);
    if (error) throw error;
    anchor.href = data.signedUrl;
    anchor.textContent = item.arquivoNome || item.nome || "Abrir arquivo";
  } else {
    anchor.href = item.url || "#";
  }
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "excluir";
  remove.textContent = "Excluir";
  remove.addEventListener("click", async () => {
    if (!confirm("Excluir este recurso?")) return;
    try {
      if (item.arquivoPath) {
        const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([item.arquivoPath]);
        if (error) throw error;
      }
      await deleteDoc(doc(db, "biblioteca", id));
    } catch (error) { console.error(error); alert("Não foi possível excluir o recurso."); }
  });
  card.append(anchor, remove);
  return card;
}

function watchResources() {
  const rooms = profileRooms(profile);
  const resourcesQuery = query(collection(db, "biblioteca"), where("codigoSala", rooms.length === 1 ? "==" : "in", rooms.length === 1 ? rooms[0] : rooms));
  onSnapshot(resourcesQuery, (snapshot) => {
    if (linksArea) linksArea.innerHTML = "";
    if (filesArea) filesArea.innerHTML = "";
    snapshot.forEach((item) => {
      const target = item.data().tipo === "link" ? linksArea : filesArea;
      if (item.data().url || item.data().arquivoPath) {
        renderResource(item.data(), item.id).then((resource) => target?.appendChild(resource)).catch((error) => {
          console.error("Não foi possível abrir o recurso:", error);
        });
      }
    });
  }, (error) => console.error("Erro ao carregar biblioteca:", error));
}

requireProfessor((authenticatedUser, currentProfile) => {
  user = authenticatedUser;
  profile = currentProfile;
  fillHeader(profile);
  watchResources();
});
