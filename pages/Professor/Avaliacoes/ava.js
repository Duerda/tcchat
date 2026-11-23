import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../../backend/firebase/config.js";
import { supabase, SUPABASE_STORAGE_BUCKET } from "../../../backend/supabase/supabase.js";
import { fillHeader, logout, navigate, requireProfessor } from "../../../backend/firebase/professor.js";

window.Voltar = logout;
window.VisaoGeral = () => navigate("../Index.html");
window.Avaliacoes = () => navigate("ava.html");
window.Biblioteca = () => navigate("../Biblioteca/Bib.html");
window.Grupos = () => navigate("../Grupos/grp.html");
window.Forum = () => navigate("../Forum/Avisos.html");
window.Configuracoes = () => navigate("../Configuracoes/Config.html");

const form = document.getElementById("form-avaliacao");
const note = document.getElementById("nota");
const feedback = document.getElementById("feedback");
const queue = document.getElementById("fila-avaliacoes");
const selectedLabel = document.getElementById("entrega-selecionada");
const history = document.getElementById("historico-avaliacoes");
let currentUser;
let groups = [];
let evaluations = [];
let selectedSubmission = null;
let submissionListeners = [];
const submissionsByGroup = new Map();

window.Cadastrar = () => history?.scrollIntoView({ behavior: "smooth" });
window.Pendentes = () => queue?.scrollIntoView({ behavior: "smooth" });

function node(tag, value, className = "") {
  const element = document.createElement(tag);
  element.textContent = value || "";
  if (className) element.className = className;
  return element;
}

function formatDate(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null);
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString("pt-BR") : "Data não informada";
}

function evaluatedIds() {
  return new Set(evaluations.map((item) => item.submissionId).filter(Boolean));
}

function renderHistory() {
  if (!history) return;
  history.replaceChildren();
  const authored = evaluations
    .filter((item) => item.professorUid === currentUser?.uid)
    .sort((a, b) => (b.data?.toMillis?.() || 0) - (a.data?.toMillis?.() || 0));
  if (!authored.length) {
    history.appendChild(node("p", "Você ainda não registrou avaliações."));
    return;
  }
  authored.forEach((item) => {
    const row = document.createElement("article");
    row.className = "avaliacao-historico";
    row.append(node("h3", `${item.grupoNome || "Grupo"} · ${item.nota}/10`));
    row.append(node("p", item.feedback || "Sem feedback registrado."));
    row.append(node("small", formatDate(item.data)));
    history.appendChild(row);
  });
}

function selectSubmission(submission) {
  selectedSubmission = submission;
  selectedLabel.textContent = `${submission.group.nome || "Grupo"} · ${submission.data.atividade || "Atividade"} · ${submission.data.alunoNome || "Aluno"}`;
  form?.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function openSubmissionFile(submission, button) {
  const { arquivoPath, arquivoUrl, arquivoNome } = submission.data;
  if (!arquivoPath && !arquivoUrl) return;
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Preparando arquivo...";
  try {
    if (arquivoUrl) {
      window.open(arquivoUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const { data, error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).createSignedUrl(arquivoPath, 60 * 60);
    if (error) throw error;
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("Não foi possível abrir o arquivo da entrega:", error);
    alert(`Não foi possível abrir ${arquivoNome || "o arquivo"}. Confira a configuração do Supabase Storage.`);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function renderQueue() {
  if (!queue) return;
  queue.replaceChildren();
  const completed = evaluatedIds();
  if (selectedSubmission && completed.has(selectedSubmission.id)) {
    selectedSubmission = null;
    if (selectedLabel) selectedLabel.textContent = "Selecione uma entrega acima.";
  }
  const pending = [...submissionsByGroup.entries()].flatMap(([groupId, records]) => {
    const group = groups.find((item) => item.id === groupId);
    return group ? records.filter((item) => !completed.has(item.id)).map((item) => ({ id: item.id, group, data: item.data })) : [];
  }).sort((a, b) => (b.data.enviadoEm?.toMillis?.() || 0) - (a.data.enviadoEm?.toMillis?.() || 0));

  if (!pending.length) {
    queue.appendChild(node("p", "Não há entregas aguardando avaliação."));
    if (selectedSubmission) {
      selectedSubmission = null;
      if (selectedLabel) selectedLabel.textContent = "Selecione uma entrega acima.";
    }
    return;
  }

  pending.forEach((submission) => {
    const card = document.createElement("article");
    card.className = "avaliacao-pendente";
    card.append(node("h3", `${submission.data.atividade || "Atividade"} · ${submission.group.nome || "Grupo"}`));
    card.append(node("p", `Enviado por ${submission.data.alunoNome || "Aluno"}${submission.data.enviadoAtrasado ? " · após o prazo" : ""}`));
    if (submission.data.observacao) card.append(node("p", submission.data.observacao));
    card.append(node("small", formatDate(submission.data.enviadoEm)));

    const actions = document.createElement("div");
    actions.className = "avaliacao-pendente-acoes";
    if (submission.data.arquivoPath || submission.data.arquivoUrl) {
      const fileButton = document.createElement("button");
      fileButton.type = "button";
      fileButton.className = "btn-tabela";
      fileButton.textContent = `Abrir ${submission.data.arquivoNome || "arquivo"}`;
      fileButton.addEventListener("click", () => openSubmissionFile(submission, fileButton));
      actions.appendChild(fileButton);
    }
    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "btn-tabela";
    selectButton.textContent = selectedSubmission?.id === submission.id ? "Selecionada" : "Avaliar entrega";
    selectButton.addEventListener("click", () => selectSubmission(submission));
    actions.appendChild(selectButton);
    card.appendChild(actions);
    queue.appendChild(card);
  });
}

function watchSubmissions() {
  submissionListeners.forEach((stop) => stop());
  submissionListeners = [];
  submissionsByGroup.clear();
  groups.forEach((group) => {
    const ref = collection(db, "grupos", group.id, "submissoes");
    submissionListeners.push(onSnapshot(ref, (snapshot) => {
      submissionsByGroup.set(group.id, snapshot.docs.map((item) => ({ id: item.id, data: item.data() })));
      renderQueue();
    }, (error) => console.error(`Não foi possível carregar entregas do grupo ${group.nome || group.id}:`, error)));
  });
  renderQueue();
}

requireProfessor((user, profile) => {
  currentUser = user;
  fillHeader(profile);
  if (!profile.codigoSala) {
    if (queue) queue.textContent = "Seu perfil não possui uma turma vinculada.";
    return;
  }

  onSnapshot(query(collection(db, "grupos"), where("codigoSala", "==", profile.codigoSala)), (snapshot) => {
    groups = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    watchSubmissions();
  }, (error) => {
    console.error("Não foi possível carregar grupos para as avaliações:", error);
    if (queue) queue.textContent = "Não foi possível carregar as entregas.";
  });

  onSnapshot(query(collection(db, "avaliacoes"), where("codigoSala", "==", profile.codigoSala)), (snapshot) => {
    evaluations = snapshot.docs.map((item) => item.data());
    renderQueue();
    renderHistory();
  }, (error) => {
    console.error("Não foi possível carregar avaliações:", error);
    if (history) history.textContent = "Não foi possível carregar o histórico.";
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedSubmission) return alert("Selecione uma entrega na fila antes de registrar a avaliação.");
    const gradeText = note?.value.trim();
    const grade = Number(gradeText);
    const comment = feedback?.value.trim();
    if (!gradeText || !Number.isFinite(grade) || grade < 0 || grade > 10 || !comment) {
      return alert("Informe uma nota entre 0 e 10 e escreva um feedback.");
    }
    const submission = selectedSubmission;
    try {
      await addDoc(collection(db, "avaliacoes"), {
        grupoId: submission.group.id,
        grupoNome: submission.group.nome || "Grupo",
        submissionId: submission.id,
        atividadeId: submission.data.atividadeId,
        membros: submission.group.membros || [],
        professorUid: user.uid,
        professorNome: profile.nome || "",
        nota: grade,
        feedback: comment,
        codigoSala: profile.codigoSala,
        data: serverTimestamp(),
      });
      form.reset();
      selectedSubmission = null;
      if (selectedLabel) selectedLabel.textContent = "Selecione uma entrega acima.";
      alert("Avaliação salva e vinculada à entrega.");
    } catch (error) {
      console.error("Não foi possível salvar a avaliação:", error);
      alert("Não foi possível salvar. Confira as regras do Firestore e tente novamente.");
    }
  });
});

window.addEventListener("pagehide", () => submissionListeners.forEach((stop) => stop()), { once: true });
