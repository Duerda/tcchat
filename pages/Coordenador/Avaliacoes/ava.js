import { addDoc, collection, onSnapshot, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../../backend/firebase/config.js";
import { fillHeader, logout, navigate, requireCoordinator } from "../../../backend/firebase/professor.js";
import { validateEvaluation } from "../../../backend/auth/validation.js";

window.Voltar = logout;
window.VisaoGeral = () => navigate("../Coord-Index.html");
window.Grupos = () => navigate("../Coord-Grupos.html");
window.Avaliacoes = () => navigate("ava.html");
window.Biblioteca = () => navigate("../Biblioteca/Bib.html");
window.Forum = () => navigate("../Coord-Forum.html");
window.Configuracoes = () => navigate("../Configuracoes/Config.html");
window.Cadastrar = () => document.getElementById("historico-avaliacoes")?.scrollIntoView({ behavior: "smooth" });

const groupSelect = document.getElementById("grupo-avaliacao");
const saveButton = document.getElementById("salvar-avaliacao");
const clearButton = document.getElementById("voltar-avaliacao");
const noteInput = document.getElementById("nota");
const feedbackInput = document.getElementById("feedback");
const groupHeading = document.querySelector("#card-avaliacao #top-card h3");
const groupSummary = document.querySelector("#arquivo-avaliacao p");
const history = document.getElementById("historico-avaliacoes");

let groupsById = new Map();

function renderHistory(snapshot) {
  if (!history) return;
  history.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = "Avaliações registradas";
  history.appendChild(title);
  if (snapshot.empty) {
    const empty = document.createElement("p");
    empty.textContent = "Ainda não há avaliações registradas por esta coordenação.";
    history.appendChild(empty);
    return;
  }
  snapshot.docs
    .sort((a, b) => (b.data().data?.toMillis?.() || 0) - (a.data().data?.toMillis?.() || 0))
    .forEach((item) => {
      const data = item.data();
      const row = document.createElement("article");
      row.className = "avaliacao-historico";
      row.textContent = `${data.codigoSala || "Turma não informada"} · ${data.grupoNome || "Grupo"}: ${data.nota}/10 — ${data.feedback || "Sem feedback"}`;
      history.appendChild(row);
    });
}

function updateSelectedGroup() {
  const group = groupsById.get(groupSelect?.value);
  if (groupHeading) groupHeading.textContent = group ? `Avaliação · ${group.nome || "Grupo"}` : "Selecione um grupo";
  if (groupSummary) {
    if (!group) {
      groupSummary.textContent = "Selecione um grupo de qualquer turma para registrar a avaliação.";
      return;
    }
    const members = Array.isArray(group.integrantes) ? group.integrantes : group.nomesMembros;
    groupSummary.textContent = `${Array.isArray(members) ? members.join(", ") : "Integrantes não informados"} · ${group.tema || group.proposta || "Tema não informado"}`;
  }
}

function watchGroups() {
  if (!groupSelect) return;
  const groupsQuery = query(collection(db, "grupos"));
  onSnapshot(groupsQuery, (snapshot) => {
    groupsById = new Map(snapshot.docs.map((item) => [item.id, item.data()]));
    groupSelect.replaceChildren(new Option("Selecione o grupo", ""));
    snapshot.docs.forEach((item) => {
      const option = new Option(`${item.data().codigoSala || "Turma sem código"} · ${item.data().nome || `Grupo ${item.id}`}`, item.id);
      groupSelect.appendChild(option);
    });
    updateSelectedGroup();
  }, (error) => {
    console.error("Não foi possível carregar os grupos:", error);
    groupSelect.replaceChildren(new Option("Erro ao carregar grupos", ""));
  });
}

requireCoordinator((user, profile) => {
  fillHeader(profile);
  watchGroups();
  const historyQuery = query(collection(db, "avaliacoes"));
  onSnapshot(historyQuery, renderHistory, (error) => {
    console.error("Não foi possível carregar o histórico de avaliações:", error);
    if (history) history.textContent = "Não foi possível carregar o histórico.";
  });

  groupSelect?.addEventListener("change", updateSelectedGroup);
  saveButton?.addEventListener("click", async () => {
    const groupId = groupSelect?.value;
    const group = groupsById.get(groupId);
    const grade = Number(noteInput?.value);
    const feedback = feedbackInput?.value.trim();
    const invalidField = validateEvaluation({
      groupId,
      group,
      roomCode: group?.codigoSala,
      grade: noteInput?.value,
      feedback,
    });
    if (invalidField === "group") {
      alert("Selecione um grupo válido.");
      return;
    }
    if (invalidField) {
      alert("Informe uma nota entre 0 e 10 e escreva o feedback.");
      return;
    }
    try {
      saveButton.disabled = true;
      await addDoc(collection(db, "avaliacoes"), {
        grupoId,
        grupoNome: group.nome || "Grupo",
        coordenadorUid: user.uid,
        coordenadorNome: profile.nome || "",
        tipoAvaliador: "coordenador",
        codigoSala: group.codigoSala,
        nota: grade,
        feedback,
        data: serverTimestamp(),
      });
      noteInput.value = "";
      feedbackInput.value = "";
      alert("Avaliação salva para o grupo selecionado.");
    } catch (error) {
      console.error("Não foi possível salvar a avaliação:", error);
      alert("Não foi possível salvar a avaliação.");
    } finally {
      saveButton.disabled = false;
    }
  });
  clearButton?.addEventListener("click", () => {
    if (groupSelect) groupSelect.value = "";
    if (noteInput) noteInput.value = "";
    if (feedbackInput) feedbackInput.value = "";
    updateSelectedGroup();
  });
});
