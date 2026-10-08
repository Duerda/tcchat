import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "/backend/firebase/config.js";
import { fillHeader, logout, navigate, requireProfessor } from "/backend/firebase/professor.js";

window.Voltar = logout;
window.Avaliacoes = () => navigate("Avaliacoes/ava.html");
window.Biblioteca = () => navigate("Biblioteca/Bib.html");
window.Grupos = () => navigate("Grupos/grp.html");
window.Forum = () => navigate("Forum/Avisos.html");
window.Configuracoes = () => navigate("Configuracoes/Config.html");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

requireProfessor((user, profile) => {
  fillHeader(profile);
  const codigoSala = profile.codigoSala;
  const container = document.querySelector(".Grupos");
  const counter = document.getElementById("gruposOrientados");
  if (!container || !codigoSala) return;

  const groupsQuery = query(collection(db, "grupos"), where("codigoSala", "==", codigoSala));
  onSnapshot(groupsQuery, (snapshot) => {
    if (counter) counter.textContent = String(snapshot.size);
    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML = "<p>Nenhum grupo cadastrado nesta sala.</p>";
      return;
    }
    snapshot.forEach((groupDoc) => {
      const group = groupDoc.data();
      const card = document.createElement("article");
      card.className = "GT";
      card.innerHTML = `<div class="sub-title-gp"><div style="display:flex;gap:220px"><h3>${escapeHtml(group.codigoSala || codigoSala)}</h3><h1>Grupo</h1></div><h2>${escapeHtml(group.nome || "Sem nome")}</h2><p>${escapeHtml(group.descricao || "")}</p><div class="GT-int"><hr class="linha-decorativa"><div style="display:flex"><div class="BL"></div><p>${Array.isArray(group.membros) ? group.membros.length : 0} membro(s)</p></div></div></div>`;
      card.addEventListener("click", () => navigate(`Grupos/grupo-detalhes.html?id=${encodeURIComponent(groupDoc.id)}`));
      container.appendChild(card);
    });
  }, (error) => {
    console.error("Erro ao carregar grupos:", error);
    container.innerHTML = "<p>Não foi possível carregar os grupos.</p>";
  });
});
