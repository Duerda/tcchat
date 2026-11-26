import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../backend/firebase/config.js";
import { fillHeader, logout, navigate, requireProfessor } from "../../backend/firebase/professor.js";
import { profileRooms } from "../../backend/firebase/rooms.js";

window.Voltar = logout;
window.Avaliacoes = () => navigate("Avaliacoes/ava.html");
window.Biblioteca = () => navigate("Biblioteca/Bib.html");
window.Grupos = () => navigate("Grupos/grp.html");
window.Forum = () => navigate("Forum/Avisos.html");
window.Configuracoes = () => navigate("Configuracoes/Config.html");

let groupRecords = [];
let evaluations = [];
let doubts = [];
const activitiesByGroup = new Map();
const submissionsByGroup = new Map();
let stopGroupListener;
let stopEvaluationListener;
let stopDoubtListener;
let groupDataListeners = [];

function textNode(tag, value, className = "") {
  const element = document.createElement(tag);
  element.textContent = value || "";
  if (className) element.className = className;
  return element;
}

function renderGroupCards() {
  const container = document.getElementById("listaGrupos");
  if (!container) return;
  container.replaceChildren();
  if (!groupRecords.length) {
    container.appendChild(textNode("p", "Nenhum grupo cadastrado nesta turma."));
    return;
  }
  groupRecords.forEach(({ id, data: group }) => {
    const card = document.createElement("article");
    card.className = "GT";
    card.tabIndex = 0;
    card.setAttribute("role", "link");
    card.append(
      textNode("small", group.codigoSala || ""),
      textNode("h2", group.nome || "Grupo sem nome"),
      textNode("p", group.descricao || "Descrição não informada."),
      textNode("p", `${Array.isArray(group.membros) ? group.membros.length : 0} integrante(s)`),
    );
    const open = () => navigate(`Grupos/grupo-detalhes.html?id=${encodeURIComponent(id)}`);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
    });
    container.appendChild(card);
  });
}

function evaluatedSubmissionIds() {
  return new Set(evaluations.map((evaluation) => evaluation.submissionId).filter(Boolean));
}

function renderGroupSummaries() {
  const container = document.getElementById("gruposResumo");
  const pendingCount = document.getElementById("entregasPendentes");
  const lateCount = document.getElementById("gruposAtrasados");
  const groupCount = document.getElementById("gruposOrientados");
  if (groupCount) groupCount.textContent = String(groupRecords.length);
  if (lateCount) lateCount.textContent = String(groupRecords.filter(({ data }) => data.status === "atraso").length);
  if (!container) return;

  container.replaceChildren();
  if (!groupRecords.length) {
    container.appendChild(textNode("p", "Nenhum grupo foi associado à sua turma ainda."));
    if (pendingCount) pendingCount.textContent = "0";
    return;
  }

  const completedEvaluations = evaluatedSubmissionIds();
  let pendingSubmissions = 0;
  groupRecords.forEach(({ id, data: group }) => {
    const tasks = activitiesByGroup.get(id) || [];
    const submissions = submissionsByGroup.get(id) || [];
    const ungraded = submissions.filter((submission) => !completedEvaluations.has(submission.id));
    pendingSubmissions += ungraded.length;

    const card = document.createElement("article");
    card.className = "Cards resumo-grupo-professor";
    const header = document.createElement("div");
    header.className = "resumo-grupo-cabecalho";
    const identity = document.createElement("div");
    identity.append(textNode("h3", group.nome || "Grupo sem nome"), textNode("small", group.codigoSala || ""));
    const status = textNode("span", ({ atraso: "Atrasado", atencao: "Atenção", "no-prazo": "No prazo" })[group.status] || "Status não informado", "Estado");
    header.append(identity, status);
    card.append(header);
    card.appendChild(textNode("p", group.descricao || "Descrição não informada."));
    card.appendChild(textNode("p", `${tasks.length} atividade(s) · ${submissions.length} entrega(s) recebida(s) · ${ungraded.length} aguardando avaliação`));
    const open = document.createElement("button");
    open.type = "button";
    open.className = "btn-tabela";
    open.textContent = "Abrir grupo";
    open.addEventListener("click", () => navigate(`Grupos/grupo-detalhes.html?id=${encodeURIComponent(id)}`));
    card.appendChild(open);
    container.appendChild(card);
  });
  if (pendingCount) pendingCount.textContent = String(pendingSubmissions);
}

function renderDoubts() {
  const container = document.getElementById("bandejaDuvidas");
  const count = document.getElementById("duvidasPendentes");
  if (!container) return;
  const pending = doubts
    .filter((doubt) => !doubt.resposta)
    .sort((a, b) => (b.data?.toMillis?.() || 0) - (a.data?.toMillis?.() || 0));
  if (count) count.textContent = String(pending.length);
  container.replaceChildren();
  if (!pending.length) {
    container.appendChild(textNode("p", "Não há dúvidas aguardando resposta."));
    return;
  }
  pending.slice(0, 5).forEach((doubt) => {
    const card = document.createElement("article");
    card.className = "Duvidas";
    const marker = document.createElement("span");
    marker.className = "ponto-duvida";
    const content = document.createElement("div");
    content.append(
      textNode("h3", `${doubt.autor || "Aluno"} · ${doubt.titulo || "Dúvida"}`),
      textNode("p", doubt.conteudo || ""),
    );
    const open = document.createElement("button");
    open.type = "button";
    open.className = "btn-tabela";
    open.textContent = "Responder";
    open.addEventListener("click", () => window.Forum());
    card.append(marker, content, open);
    container.appendChild(card);
  });
}

function watchGroupData() {
  groupDataListeners.forEach((stop) => stop());
  groupDataListeners = [];
  activitiesByGroup.clear();
  submissionsByGroup.clear();
  groupRecords.forEach(({ id }) => {
    groupDataListeners.push(onSnapshot(collection(db, "grupos", id, "entregas"), (snapshot) => {
      activitiesByGroup.set(id, snapshot.docs.map((item) => item.data()).filter((task) => task.tipo !== "envio"));
      renderGroupSummaries();
    }, (error) => console.error("Não foi possível carregar as atividades do grupo:", error)));
    groupDataListeners.push(onSnapshot(collection(db, "grupos", id, "submissoes"), (snapshot) => {
      submissionsByGroup.set(id, snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      renderGroupSummaries();
    }, (error) => console.error("Não foi possível carregar as entregas do grupo:", error)));
  });
  renderGroupSummaries();
}

requireProfessor((user, profile) => {
  fillHeader(profile);
  const rooms = profileRooms(profile);
  if (!rooms.length) return;
  const roomConstraint = where("codigoSala", rooms.length === 1 ? "==" : "in", rooms.length === 1 ? rooms[0] : rooms);

  stopGroupListener = onSnapshot(query(collection(db, "grupos"), roomConstraint), (snapshot) => {
    groupRecords = snapshot.docs.map((item) => ({ id: item.id, data: item.data() }));
    renderGroupCards();
    watchGroupData();
  }, (error) => {
    console.error("Erro ao carregar grupos:", error);
    const list = document.getElementById("listaGrupos");
    if (list) list.textContent = "Não foi possível carregar os grupos.";
  });

  stopEvaluationListener = onSnapshot(query(collection(db, "avaliacoes"), roomConstraint), (snapshot) => {
    evaluations = snapshot.docs.map((item) => item.data());
    renderGroupSummaries();
  }, (error) => console.error("Não foi possível carregar o estado das avaliações:", error));

  stopDoubtListener = onSnapshot(query(collection(db, "duvidas"), roomConstraint), (snapshot) => {
    doubts = snapshot.docs.map((item) => item.data());
    renderDoubts();
  }, (error) => {
    console.error("Não foi possível carregar as dúvidas:", error);
    const inbox = document.getElementById("bandejaDuvidas");
    if (inbox) inbox.textContent = "Não foi possível carregar as dúvidas.";
  });
});

window.addEventListener("pagehide", () => {
  stopGroupListener?.();
  stopEvaluationListener?.();
  stopDoubtListener?.();
  groupDataListeners.forEach((stop) => stop());
}, { once: true });
