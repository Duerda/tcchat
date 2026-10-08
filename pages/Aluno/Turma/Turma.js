import { auth, db } from "../../../backend/firebase/config.js";
import { collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let stopGroups = null;
let stopAssignments = [];
let groups = [];
let studentUid = null;
const statusInfo = (status = "no-prazo") => ({
  atraso: ["Atrasado", "status-atraso"],
  atencao: ["Atenção", "status-atencao"],
  "no-prazo": ["No prazo", "status-prazo"],
}[status] || [status, "status-prazo"]);

function appendText(parent, tag, value, className = "") {
  const element = document.createElement(tag);
  element.textContent = value || "";
  if (className) element.className = className;
  parent.appendChild(element);
  return element;
}

function renderGroups() {
  const container = document.getElementById("GT");
  if (!container) return;
  container.replaceChildren();
  const counts = { total: groups.length, prazo: 0, atencao: 0, atraso: 0 };
  groups.forEach((group, index) => {
    const [label, className] = statusInfo(group.status);
    if (group.status === "atraso") counts.atraso++;
    else if (group.status === "atencao") counts.atencao++;
    else counts.prazo++;
    const card = document.createElement("article");
    card.className = "grupo-card-aluno";
    card.id = "Grupos-Turma";
    appendText(card, "h2", `Grupo ${index + 1} · ${group.nome || group.nomeProjeto || "Sem nome"}`);
    appendText(card, "h3", group.tema || group.proposta || "Tema não informado");
    appendText(card, "p", group.descricao || "Proposta não informada.");
    appendText(card, "p", `Integrantes: ${(group.integrantes || group.nomesMembros || []).join(", ") || "Não informados"}`);
    appendText(card, "p", `Orientador: ${group.orientador || "A definir"}`);
    appendText(card, "strong", label, className);
    container.appendChild(card);
  });
  if (!groups.length) appendText(container, "p", "Nenhum grupo foi associado à sua turma ainda.");
  document.getElementById("stat-total").textContent = counts.total;
  document.getElementById("stat-prazo").textContent = counts.prazo;
  document.getElementById("stat-atencao").textContent = counts.atencao;
  document.getElementById("stat-atraso").textContent = counts.atraso;
  renderAssignments();
  updateArrows();
}

function renderAssignments() {
  stopAssignments.forEach((stop) => stop());
  stopAssignments = [];
  const list = document.getElementById("lista-atividades");
  if (!list) return;
  list.replaceChildren();
  let assignmentsByGroup = new Map();
  let completedByGroup = new Map();
  const renderList = () => {
    list.replaceChildren();
    const assignments = [...assignmentsByGroup.values()].flat();
    if (!assignments.length) {
      appendText(list, "p", "Nenhuma atividade foi publicada para seus grupos ainda.");
      return;
    }
    assignments.forEach(({ task, taskId, group }) => {
      const card = document.createElement("article");
      card.className = "atividade-painel";
      appendText(card, "h3", task.titulo || "Atividade do grupo");
      appendText(card, "p", `${group.nome || "Grupo"} · ${task.descricao || "Sem descrição"}`);
      const due = task.dataLimite?.toDate?.() || (task.dataLimite ? new Date(task.dataLimite) : null);
      const isOverdue = due ? due.getTime() < Date.now() : task.status === "atraso";
      const submitted = completedByGroup.get(group.id)?.has(taskId);
      const deadline = due ? `Prazo: ${due.toLocaleDateString("pt-BR")}` : "Prazo não informado";
      appendText(card, "p", `${deadline}${submitted ? " · Entregue" : isOverdue ? " · Atrasada" : " · Pendente"}`);
      list.appendChild(card);
    });
  };
  const assignmentGroups = groups.filter((group) => (group.membros || []).includes(studentUid));
  if (!assignmentGroups.length) {
    appendText(list, "p", "As atividades aparecerão aqui quando seus grupos forem associados.");
    updateProgress();
    return;
  }
  assignmentGroups.forEach((group) => {
    const stop = onSnapshot(collection(db, "grupos", group.id, "entregas"), (snapshot) => {
      assignmentsByGroup.set(group.id, snapshot.docs.map((taskDoc) => ({ taskId: taskDoc.id, task: taskDoc.data(), group })).filter(({ task }) => task.tipo !== "envio"));
      renderList();
      updateProgress();
    }, (error) => {
      console.error("Não foi possível carregar atividades:", error);
    });
    stopAssignments.push(stop);
    const stopSubmissions = onSnapshot(collection(db, "grupos", group.id, "submissoes"), (snapshot) => {
      completedByGroup.set(group.id, new Set(snapshot.docs.map((item) => item.data()).filter((item) => item.alunoUid === studentUid).map((item) => item.atividadeId).filter(Boolean)));
      renderList();
      updateProgress();
    }, (error) => console.error("Não foi possível carregar o progresso das entregas:", error));
    stopAssignments.push(stopSubmissions);
  });

  function updateProgress() {
    const all = [...assignmentsByGroup.values()].flat();
    const completed = all.filter(({ taskId, group }) => completedByGroup.get(group.id)?.has(taskId)).length;
    const percent = all.length ? Math.round(completed / all.length * 100) : 0;
    const progressLabel = document.querySelector("#Prog-int h2");
    const progressBar = document.getElementById("barra-progresso2");
    if (progressLabel) progressLabel.textContent = `${percent}%`;
    if (progressBar) progressBar.style.width = `${percent}%`;
  }
}

function updateArrows() {
  const container = document.getElementById("GT");
  const left = document.getElementById("seta-esq");
  const right = document.getElementById("seta-dir");
  if (!container || !left || !right) return;
  const max = container.scrollWidth - container.clientWidth;
  left.disabled = container.scrollLeft <= 2;
  right.disabled = container.scrollLeft >= max - 2;
}

window.scrollGrupos = (direction) => {
  const container = document.getElementById("GT");
  const card = container?.querySelector(".grupo-card-aluno");
  if (container && card) container.scrollBy({ left: (card.offsetWidth + 20) * direction, behavior: "smooth" });
};

window.alunoReady?.then((session) => {
  if (!session) return;
  studentUid = session.user.uid;
  const room = session.profile.codigoSala;
  if (!room) {
    document.getElementById("GT").textContent = "Seu perfil ainda não está associado a uma turma.";
    return;
  }
  stopGroups?.();
  stopGroups = onSnapshot(
    query(collection(db, "grupos"), where("codigoSala", "==", room)),
    (snapshot) => {
      groups = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderGroups();
    },
    (error) => {
      console.error("Não foi possível carregar os grupos:", error);
      document.getElementById("GT").textContent = "Não foi possível carregar os grupos.";
    },
  );
});

document.getElementById("GT")?.addEventListener("scroll", updateArrows);
window.addEventListener("resize", updateArrows);
