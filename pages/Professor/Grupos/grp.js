import { collection, deleteDoc, doc, getDoc, onSnapshot, query, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "/backend/firebase/config.js";
import { fillHeader, logout, navigate, requireProfessor } from "/backend/firebase/professor.js";

window.Voltar = logout;
window.VisaoGeral = () => navigate("/pages/Professor/Index.html");
window.Biblioteca = () => navigate("/pages/Professor/Biblioteca/Bib.html");
window.Avaliacoes = () => navigate("/pages/Professor/Avaliacoes/ava.html");
window.Grupos = () => navigate("grp.html");
window.Forum = () => navigate("/pages/Professor/Forum/Avisos.html");
window.Configuracoes = () => navigate("/pages/Professor/Configuracoes/Config.html");

let currentProfile;
const list = document.getElementById("listaGrupos");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function renderGroup(groupDoc) {
  const group = groupDoc.data();
  const card = document.createElement("article");
  card.className = "GT";
  card.dataset.id = groupDoc.id;
  card.innerHTML = `<div class="sub-title-gp"><div style="display:flex;gap:220px"><h3>${escapeHtml(group.codigoSala || "")}</h3><h1>Grupo</h1></div><h2>${escapeHtml(group.nome || "Sem nome")}</h2><p>${escapeHtml(group.descricao || "")}</p><div class="GT-int"><hr class="linha-decorativa"><div style="display:flex"><div class="BL"></div><p>${Array.isArray(group.membros) ? group.membros.length : 0} membro(s)</p></div></div><button class="btnEditar" data-id="${groupDoc.id}">Editar</button><button class="btnExcluir" data-id="${groupDoc.id}">Excluir</button></div>`;
  return card;
}

function listenGroups(profile) {
  if (!list) return;
  if (!profile.codigoSala) {
    list.innerHTML = "<p>Seu perfil não possui uma sala vinculada.</p>";
    return;
  }
  const groupsQuery = query(collection(db, "grupos"), where("codigoSala", "==", profile.codigoSala));
  onSnapshot(groupsQuery, (snapshot) => {
    list.innerHTML = "";
    if (snapshot.empty) {
      list.innerHTML = "<p>Nenhum grupo encontrado para sua sala.</p>";
      return;
    }
    snapshot.forEach((groupDoc) => list.appendChild(renderGroup(groupDoc)));
  }, (error) => {
    console.error("Erro ao carregar grupos:", error);
    list.innerHTML = "<p>Não foi possível carregar os grupos.</p>";
  });
}

async function editGroup(id) {
  const ref = doc(db, "grupos", id);
  const groupSnapshot = await getDoc(ref);
  if (!groupSnapshot.exists()) return alert("Grupo não encontrado.");
  const group = groupSnapshot.data();
  const name = prompt("Nome do grupo:", group.nome || "");
  if (name === null) return;
  const description = prompt("Descrição do grupo:", group.descricao || "");
  if (description === null) return;
  try {
    await updateDoc(ref, { nome: name.trim() || group.nome || "Sem nome", descricao: description.trim() });
    alert("Grupo atualizado com sucesso.");
  } catch (error) {
    console.error(error);
    alert("Não foi possível atualizar o grupo.");
  }
}

async function deleteGroup(id) {
  if (!confirm("Tem certeza que deseja excluir este grupo?")) return;
  try {
    await deleteDoc(doc(db, "grupos", id));
    alert("Grupo excluído com sucesso.");
  } catch (error) {
    console.error(error);
    alert("Não foi possível excluir o grupo.");
  }
}

list?.addEventListener("click", (event) => {
  const editButton = event.target.closest(".btnEditar");
  const deleteButton = event.target.closest(".btnExcluir");
  const card = event.target.closest(".GT");
  if (editButton) return editGroup(editButton.dataset.id);
  if (deleteButton) return deleteGroup(deleteButton.dataset.id);
  if (card) navigate(`grupo-detalhes.html?id=${encodeURIComponent(card.dataset.id)}`);
});

requireProfessor((user, profile) => {
  currentProfile = profile;
  fillHeader(profile);
  listenGroups(profile);
});
