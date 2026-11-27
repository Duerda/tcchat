import { auth, db } from "../../../backend/firebase/config.js";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let stopGroups = null;
let stopAssignments = [];
let stopEvaluationListeners = [];
let stopProjectStageListeners = [];
let groups = [];
let studentUid = null;
let evaluations = [];
const evaluationsByGroup = new Map();
const projectStagesByGroup = new Map();
const projectStagesLoadedByGroup = new Set();
const projectStages = [
  { id: "tema-problema", titulo: "Definir o tema, o problema e os objetivos do TCC" },
  { id: "planejamento", titulo: "Organizar cronograma e divisão de tarefas do grupo" },
  { id: "pesquisa", titulo: "Pesquisar fontes e reunir referências confiáveis" },
  { id: "introducao-referencial", titulo: "Escrever introdução, justificativa e referencial teórico" },
  { id: "metodologia", titulo: "Definir a metodologia e desenvolver o projeto" },
  { id: "resultados-conclusao", titulo: "Registrar resultados e elaborar a conclusão" },
  { id: "revisao-normas", titulo: "Revisar o texto e as referências conforme as normas da instituição" },
  { id: "apresentacao", titulo: "Preparar e revisar a apresentação/defesa" },
  { id: "entrega-final", titulo: "Conferir arquivos e entregar a versão final do TCC" },
];
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
  const roomLabel = document.getElementById("turma-codigo");
  if (roomLabel && window.alunoSession?.profile?.codigoSala) roomLabel.textContent = window.alunoSession.profile.codigoSala;
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
  watchProjectStages();
  renderEvaluations();
  updateArrows();
}

function renderEvaluations() {
  const list = document.getElementById("lista-avaliacoes-aluno");
  if (!list) return;
  list.replaceChildren();
  const ownGroupIds = new Set(groups.filter((group) => (group.membros || []).includes(studentUid)).map((group) => group.id));
  const visible = evaluations.filter((evaluation) => ownGroupIds.has(evaluation.grupoId));
  if (!visible.length) {
    appendText(list, "p", "Ainda não há avaliações para o seu grupo.");
    return;
  }
  visible.forEach((evaluation) => {
    const card = document.createElement("article");
    card.className = "atividade-painel avaliacao-aluno";
    appendText(card, "h2", `${evaluation.grupoNome || "Avaliação"} · Nota ${evaluation.nota}/10`);
    appendText(card, "p", evaluation.feedback || "Sem feedback registrado.");
    appendText(card, "small", `Professor(a): ${evaluation.professorNome || "Não informado"}`);
    list.appendChild(card);
  });
}

function watchEvaluationsForOwnGroups(room) {
  stopEvaluationListeners.forEach((stop) => stop());
  stopEvaluationListeners = [];
  evaluationsByGroup.clear();
  const ownGroups = groups.filter((group) => (group.membros || []).includes(studentUid));
  if (!ownGroups.length) {
    evaluations = [];
    renderEvaluations();
    return;
  }
  ownGroups.forEach((group) => {
    const evaluationQuery = query(collection(db, "avaliacoes"),
      where("codigoSala", "==", room),
      where("grupoId", "==", group.id),
      where("membros", "array-contains", studentUid));
    const stop = onSnapshot(evaluationQuery, (snapshot) => {
      evaluationsByGroup.set(group.id, snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      evaluations = [...evaluationsByGroup.values()].flat();
      renderEvaluations();
    }, (error) => {
      console.error("Não foi possível carregar as avaliações do grupo:", error);
      const list = document.getElementById("lista-avaliacoes-aluno");
      if (list) list.textContent = "Não foi possível carregar as avaliações.";
    });
    stopEvaluationListeners.push(stop);
  });
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
    return;
  }
  assignmentGroups.forEach((group) => {
    const stop = onSnapshot(collection(db, "grupos", group.id, "entregas"), (snapshot) => {
      assignmentsByGroup.set(group.id, snapshot.docs.map((taskDoc) => ({ taskId: taskDoc.id, task: taskDoc.data(), group })).filter(({ task }) => task.tipo !== "envio"));
      renderList();
    }, (error) => {
      console.error("Não foi possível carregar atividades:", error);
    });
    stopAssignments.push(stop);
    const stopSubmissions = onSnapshot(collection(db, "grupos", group.id, "submissoes"), (snapshot) => {
      completedByGroup.set(group.id, new Set(snapshot.docs.map((item) => item.data()).map((item) => item.atividadeId).filter(Boolean)));
      renderList();
    }, (error) => console.error("Não foi possível carregar o progresso das entregas:", error));
    stopAssignments.push(stopSubmissions);
  });
}

function watchProjectStages() {
  stopProjectStageListeners.forEach((stop) => stop());
  stopProjectStageListeners = [];
  projectStagesByGroup.clear();
  projectStagesLoadedByGroup.clear();
  const list = document.getElementById("lista-checklist-projeto");
  if (!list) return;
  const ownGroups = groups.filter((group) => (group.membros || []).includes(studentUid));
  if (!ownGroups.length) {
    renderProjectChecklist();
    return;
  }
  ownGroups.forEach((group) => {
    const stop = onSnapshot(collection(db, "grupos", group.id, "etapasProjeto"), (snapshot) => {
      projectStagesByGroup.set(group.id, new Map(snapshot.docs.map((item) => [item.id, item.data().concluida === true])));
      projectStagesLoadedByGroup.add(group.id);
      renderProjectChecklist();
    }, (error) => {
      console.error("Não foi possível carregar o checklist do grupo:", error);
      const status = document.getElementById("status-checklist-aluno");
      if (status) {
        status.textContent = "Não foi possível carregar o checklist. Confira a conexão e as regras do Firebase.";
        status.classList.add("erro");
      }
    });
    stopProjectStageListeners.push(stop);
  });
  renderProjectChecklist();
}

function renderProjectChecklist() {
  const list = document.getElementById("lista-checklist-projeto");
  const summary = document.getElementById("resumo-checklist-aluno");
  if (!list) return;
  list.replaceChildren();
  const ownGroups = groups.filter((group) => (group.membros || []).includes(studentUid));
  if (!ownGroups.length) {
    appendText(list, "p", "O checklist aparecerá aqui quando o coordenador associar você a um grupo.", "checklist-vazio");
    if (summary) summary.textContent = "Sem grupo associado";
    return;
  }

  let allCompleted = 0;
  const allPossible = ownGroups.length * projectStages.length;
  ownGroups.forEach((group) => {
    const state = projectStagesByGroup.get(group.id) || new Map();
    const isLoaded = projectStagesLoadedByGroup.has(group.id);
    const groupName = group.nome || group.nomeProjeto || "Grupo do TCC";
    const completed = projectStages.filter((stage) => state.get(stage.id)).length;
    allCompleted += completed;
    const percent = Math.round(completed / projectStages.length * 100);

    const card = document.createElement("article");
    card.className = "checklist-grupo";
    const heading = document.createElement("div");
    heading.className = "checklist-grupo-cabecalho";
    appendText(heading, "h3", groupName);
    appendText(heading, "p", isLoaded ? `${completed} de ${projectStages.length} etapas · ${percent}%` : "Carregando etapas…", "checklist-progresso-texto");
    card.appendChild(heading);

    const track = document.createElement("div");
    track.className = "checklist-trilha";
    track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", `Etapas concluídas por ${groupName}`);
    track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", "100");
    track.setAttribute("aria-valuenow", String(percent));
    const fill = document.createElement("div");
    fill.className = "checklist-preenchimento";
    fill.style.width = `${percent}%`;
    track.appendChild(fill);
    card.appendChild(track);

    const stagesList = document.createElement("ul");
    stagesList.className = "checklist-etapas";
    projectStages.forEach((stage) => {
      const row = document.createElement("li");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.get(stage.id) === true;
      checkbox.disabled = !isLoaded;
      checkbox.setAttribute("aria-label", `${stage.titulo} — ${groupName}`);
      const text = document.createElement("span");
      text.textContent = stage.titulo;
      label.append(checkbox, text);
      row.appendChild(label);
      stagesList.appendChild(row);

      checkbox.addEventListener("change", async () => {
        const isComplete = checkbox.checked;
        const status = document.getElementById("status-checklist-aluno");
        checkbox.disabled = true;
        if (status) { status.textContent = "Salvando avanço do grupo…"; status.classList.remove("erro"); }
        try {
          await setDoc(doc(db, "grupos", group.id, "etapasProjeto", stage.id), {
            concluida: isComplete,
            atualizadoPor: studentUid,
            atualizadoEm: serverTimestamp(),
          });
          if (status) status.textContent = "Avanço salvo para todo o grupo.";
        } catch (error) {
          console.error("Não foi possível salvar a etapa do projeto:", error);
          checkbox.checked = !isComplete;
          if (status) { status.textContent = "Não foi possível salvar. Confira as regras do Firebase e tente novamente."; status.classList.add("erro"); }
        } finally {
          checkbox.disabled = false;
        }
      });
    });
    card.appendChild(stagesList);
    list.appendChild(card);
  });
  if (summary) summary.textContent = `${allCompleted} de ${allPossible} etapas concluídas nos seus grupos`;
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
  window.alunoSession = session;
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
      watchEvaluationsForOwnGroups(room);
    },
    (error) => {
      console.error("Não foi possível carregar os grupos:", error);
      document.getElementById("GT").textContent = "Não foi possível carregar os grupos.";
    },
  );
});

document.getElementById("GT")?.addEventListener("scroll", updateArrows);
window.addEventListener("resize", updateArrows);
