import { auth, db } from "../../backend/firebase/config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query,
  serverTimestamp, updateDoc, where, writeBatch,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { appUrl, requireCoordinator } from "../../backend/firebase/professor.js";

const LOGIN = appUrl("pages/auth/Login/Log-aluno.html");
const COURSE_NAMES = {
  DS: "Desenvolvimento de Sistemas", DI: "Design de Interiores", HOSP: "Hospedagem",
  IPI: "Informática para Internet - MTEC", MA: "Meio Ambiente", SEC: "Secretariado",
  ADM: "Administração", INF: "Informática - MTEC",
};
let user;
let profile;
let stopDoubts;
let stopNotices;
let stopGroups;
let stopUsers;
let groupToDelete;

window.Voltar = async () => { await signOut(auth); window.location.href = LOGIN; };
window.Painel = () => (window.location.href = "Coord-Index.html");
window.Usuarios = () => (window.location.href = "Coord-Usuarios.html");
window.GruposCoord = () => (window.location.href = "Coord-Grupos.html");
window.Biblioteca = () => (window.location.href = "Biblioteca/Bib.html");
window.Forum = () => (window.location.href = "Coord-Forum.html");
window.Configuracoes = () => (window.location.href = "Configuracoes/Config.html");
window.Cursos = () => (window.location.href = "Coord-Index.html");

function pageName() { return window.location.pathname.split("/").pop(); }
function safe(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}
function reportError(message, error) {
  console.error(message, error);
  alert(message);
}

requireCoordinator((authenticatedUser, currentProfile) => {
  user = authenticatedUser;
  profile = currentProfile;
  fillHeader();
  const currentPage = pageName();
  if (currentPage === "Coord-Index.html") loadDashboard();
  if (currentPage === "Coord-Usuarios.html") loadUsers();
  if (["Coord-Grupos.html", "Coord-Criacao.html"].includes(currentPage)) loadGroups();
  if (currentPage === "Coord-Forum.html") loadForum();
});

function fillHeader() {
  const initial = document.querySelector("#foto span");
  const name = document.querySelector("#NomeUC h4");
  const course = document.querySelector("#NomeUC h5");
  if (initial) initial.textContent = profile.iniciais || "";
  if (name) name.textContent = profile.nome || "";
  if (course) course.textContent = profile.curso || profile.codigoSala || "Coordenador";
}

window.mudarAba = (id) => {
  document.querySelectorAll(".conteudo-aba").forEach((panel) => { panel.style.display = "none"; });
  document.querySelectorAll(".aba").forEach((button) => button.classList.remove("ativa"));
  const panel = document.getElementById(`tab-${id}`);
  const button = document.getElementById(`aba-${id}`);
  if (panel) panel.style.display = "block";
  if (button) button.classList.add("ativa");
};

function classQuery(collectionName) {
  return query(collection(db, collectionName), where("codigoSala", "==", profile.codigoSala));
}

function loadDashboard() {
  if (!profile.codigoSala) return;
  const stats = [...document.querySelectorAll("#Informacoes .Stat h3")];
  // Os contadores em tempo real substituem os números de exemplo pela lista
  // verdadeira de alunos e grupos do coordenador. Os grupos também são usados
  // para identificar atividades atrasadas.
  const render = async () => {
    const [usersSnapshot, groupsSnapshot] = await Promise.all([
      getDocs(classQuery("usuarios")), getDocs(classQuery("grupos")),
    ]);
    const users = usersSnapshot.docs.map((item) => item.data());
    const groups = groupsSnapshot.docs.map((item) => item.data());
    if (stats[0]) stats[0].textContent = new Set(users.map((item) => item.curso).filter(Boolean)).size;
    if (stats[1]) stats[1].textContent = groups.length;
    if (stats[2]) stats[2].textContent = users.filter((item) => item.tipo === "aluno").length;
    if (stats[3]) stats[3].textContent = users.filter((item) => item.tipo === "professor").length;
    if (stats[4]) stats[4].textContent = groups.filter((item) => item.status === "atraso").length;
    let pending = 0;
    const groupActivity = [];
    for (const item of groupsSnapshot.docs) {
      const [tasks, submissions] = await Promise.all([
        getDocs(collection(db, "grupos", item.id, "entregas")),
        getDocs(collection(db, "grupos", item.id, "submissoes")),
      ]);
      const group = item.data();
      const memberIds = [...new Set(Array.isArray(group.membros) ? group.membros : [])];
      const submittedPairs = new Set(submissions.docs.map((submission) => {
        const data = submission.data();
        return JSON.stringify([data.alunoUid, data.atividadeId]);
      }));
      const assignments = tasks.docs.filter((task) => task.data().tipo !== "envio");
      assignments.forEach((task) => {
        pending += memberIds.filter((memberId) => !submittedPairs.has(JSON.stringify([memberId, task.id]))).length;
      });
      groupActivity.push({ data: group, taskCount: assignments.length, submissionCount: submissions.size });
    }
    if (stats[5]) stats[5].textContent = pending;
    const courses = document.getElementById("ListaCursos");
    if (courses) {
      courses.replaceChildren();
      const card = document.createElement("article");
      card.className = "Cards";
      const overview = document.createElement("p");
      overview.textContent = `${profile.curso || profile.codigoSala} · ${groups.length} grupos · ${users.filter((item) => item.tipo === "aluno").length} alunos`;
      card.appendChild(overview);
      groupActivity.forEach(({ data, taskCount, submissionCount }) => {
        const item = document.createElement("p");
        item.textContent = `${data.nome || "Grupo sem nome"} · ${data.status || "no-prazo"} · ${taskCount} atividade(s) publicada(s), ${submissionCount} envio(s)`;
        card.appendChild(item);
      });
      courses.appendChild(card);
    }
    renderAlerts(groups);
  };
  const stopClassUsers = onSnapshot(classQuery("usuarios"), render);
  const stopClassGroups = onSnapshot(classQuery("grupos"), render);
  window.addEventListener("pagehide", () => { stopClassUsers(); stopClassGroups(); }, { once: true });
}

function renderAlerts(groups) {
  const heading = [...document.querySelectorAll("#conteudo h1")].find((element) => element.textContent.trim() === "Alertas do Sistema");
  if (!heading) return;
  let sibling = heading.nextElementSibling;
  while (sibling?.classList.contains("Alerta")) {
    const next = sibling.nextElementSibling;
    sibling.remove();
    sibling = next;
  }
  const delayed = groups.filter((group) => group.status === "atraso" || group.status === "atencao");
  if (!delayed.length) {
    const empty = document.createElement("p");
    empty.className = "Alerta";
    empty.textContent = "Nenhum grupo sinalizado como atenção ou atraso nesta turma.";
    heading.after(empty);
    return;
  }
  delayed.forEach((group) => {
    const alertCard = document.createElement("article");
    alertCard.className = `Alerta ${group.status === "atraso" ? "vermelho" : "amarelo"}`;
    alertCard.textContent = `${group.nome || "Grupo sem nome"} · ${group.status === "atraso" ? "Atrasado" : "Atenção"}`;
    heading.after(alertCard);
  });
}

function loadUsers() {
  const codeRows = document.getElementById("lista-codigos");
  const studentRows = document.querySelector("#tab-alunos tbody");
  const teacherRows = document.querySelector("#tab-professores tbody");
  if (codeRows) codeRows.replaceChildren();
  if (studentRows) studentRows.replaceChildren();
  if (teacherRows) teacherRows.replaceChildren();
  if (!profile.codigoSala) return;

  // Os códigos gerados ficam no Firestore junto com o tipo de conta permitido e
  // uma validade opcional. Assim, é possível contabilizar os cadastros feitos com
  // cada código e revogá-lo posteriormente.
  stopUsers = onSnapshot(classQuery("usuarios"), (snapshot) => {
    const students = snapshot.docs.filter((item) => item.data().tipo === "aluno");
    const teachers = snapshot.docs.filter((item) => item.data().tipo === "professor");
    renderUserRows(studentRows, students, "aluno");
    renderUserRows(teacherRows, teachers, "professor");
  });
  onSnapshot(query(collection(db, "codigosAcesso"), where("criadoPor", "==", user.uid)), (snapshot) => {
    if (!codeRows) return;
    codeRows.replaceChildren();
    if (snapshot.empty) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="6">Nenhum código criado para esta turma.</td>';
      codeRows.appendChild(row);
      return;
    }
    snapshot.forEach((item) => {
      const code = item.data();
      const row = document.createElement("tr");
      const expiry = code.expiraEm?.toDate?.();
      const dateText = expiry ? expiry.toLocaleDateString("pt-BR") : "Sem limite";
      row.innerHTML = `<td><span class="Chip">${safe(code.codigo)}</span></td><td>${safe(code.tipo)}</td><td>${safe(code.curso || profile.curso || profile.codigoSala)}</td><td>${Number(code.usos || 0)}</td><td>${safe(dateText)}${code.revogado ? " · Revogado" : ""}</td><td><button class="btn-tabela vermelho" data-revogar="${item.id}" ${code.revogado ? "disabled" : ""}>Revogar</button></td>`;
      row.querySelector("[data-revogar]")?.addEventListener("click", () => revokeCode(item.id));
      codeRows.appendChild(row);
    });
  });
}

function renderUserRows(tbody, records, role) {
  if (!tbody) return;
  tbody.replaceChildren();
  if (!records.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="5">Nenhum usuário encontrado nesta turma.</td>';
    tbody.appendChild(row);
    return;
  }
  records.forEach((record) => {
    const data = record.data();
    const row = document.createElement("tr");
    const status = data.acessoAtivo === false ? "Acesso revogado" : data.ultimoAcesso?.toDate?.().toLocaleString("pt-BR") || "Ainda não entrou";
    row.innerHTML = `<td>${safe(data.nome || data.email || "Usuário")}</td><td>${safe(data.curso || profile.curso || "")}</td><td>${safe(data.grupoNome || "—")}</td><td>${safe(status)}</td><td><button class="btn-tabela vermelho" data-user="${record.id}">${data.acessoAtivo === false ? "Reativar" : "Revogar acesso"}</button></td>`;
    row.querySelector("[data-user]")?.addEventListener("click", () => toggleUserAccess(record.id, data.acessoAtivo !== false));
    tbody.appendChild(row);
  });
}

window.gerarCodigo = async (tipo) => {
  const sala = prompt("Código da turma no formato SIGLA-ANO (ex.: DS-1):", profile.codigoSala || "DS-1")?.trim().toUpperCase();
  if (!sala) return;
  if (!/^(DS|DI|HOSP|IPI|MA|SEC|ADM|INF)-[123]$/.test(sala)) return alert("Use um código de turma válido, como DS-1.");
  const expiry = prompt("Validade opcional (AAAA-MM-DD). Deixe vazio para não expirar:")?.trim();
  if (expiry && !/^\d{4}-\d{2}-\d{2}$/.test(expiry)) return alert("Informe a data no formato AAAA-MM-DD.");
  const expiryDate = expiry ? new Date(`${expiry}T23:59:59`) : null;
  if (expiryDate && (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() < Date.now())) return alert("A validade deve ser uma data futura válida.");
  try {
    await addDoc(collection(db, "codigosAcesso"), {
      codigo: sala,
      codigoSala: sala,
      curso: COURSE_NAMES[sala.split("-")[0]],
      tipo,
      criadoPor: user.uid,
      criadoEm: serverTimestamp(),
      expiraEm: expiryDate,
      usos: 0,
      revogado: false,
    });
    alert(`Código ${sala} criado para ${tipo}.`);
  } catch (error) { reportError("Não foi possível criar o código de acesso.", error); }
};

async function revokeCode(id) {
  if (!confirm("Revogar este código? Novos cadastros não poderão utilizá-lo.")) return;
  try { await updateDoc(doc(db, "codigosAcesso", id), { revogado: true, revogadoEm: serverTimestamp() }); }
  catch (error) { reportError("Não foi possível revogar o código.", error); }
}

async function toggleUserAccess(id, currentlyActive) {
  const action = currentlyActive ? "revogar o acesso" : "reativar o acesso";
  if (!confirm(`Confirma ${action} deste usuário?`)) return;
  try { await updateDoc(doc(db, "usuarios", id), { acessoAtivo: !currentlyActive, acessoAtualizadoEm: serverTimestamp() }); }
  catch (error) { reportError("Não foi possível atualizar o acesso do usuário.", error); }
}

function loadGroups() {
  const container = document.getElementById("listaGruposCoord") || document.getElementById("GT");
  if (!container || !profile.codigoSala) return;
  container.replaceChildren();
  stopGroups?.();
  stopGroups = onSnapshot(classQuery("grupos"), (snapshot) => {
    container.replaceChildren();
    if (snapshot.empty) {
      const empty = document.createElement("p");
      empty.textContent = "Nenhum grupo cadastrado para esta turma ainda.";
      container.appendChild(empty);
      return;
    }
    snapshot.forEach((item) => {
      const group = item.data();
      const card = document.createElement("article");
      card.className = "GT";
      card.dataset.id = item.id;
      card.innerHTML = `<h2>${safe(group.nome || "Grupo sem nome")}</h2><h3>${safe(group.tema || group.proposta || "Tema não informado")}</h3><p>${safe(group.descricao || "")}</p><p>Integrantes: ${safe((group.integrantes || group.nomesMembros || []).join(", ") || "Ainda não associados")}</p><p>Orientador: ${safe(group.orientador || "A definir")}</p><label>Status <select class="select-status"><option value="no-prazo">No prazo</option><option value="atencao">Atenção</option><option value="atraso">Atrasado</option></select></label><div><button class="btn-tabela" data-add-member>+ Membro</button><button class="btn-tabela" data-advisor>Orientador</button><button class="btn-tabela vermelho" data-delete>Excluir</button></div>`;
      const statusSelect = card.querySelector("select");
      statusSelect.value = group.status || "no-prazo";
      statusSelect.addEventListener("change", () => updateDoc(doc(db, "grupos", item.id), { status: statusSelect.value }));
      card.querySelector("[data-add-member]").addEventListener("click", () => addGroupMember(item.id));
      card.querySelector("[data-advisor]").addEventListener("click", () => assignAdvisor(item.id));
      card.querySelector("[data-delete]").addEventListener("click", () => window.excluirGrupo(item.id, group.nome));
      container.appendChild(card);
    });
  }, (error) => reportError("Não foi possível carregar grupos da turma.", error));
}

window.abrirModalCriarGrupo = () => { const modal = document.getElementById("modal-criar-grupo"); if (modal) modal.style.display = "flex"; };
window.fecharModalCriarGrupo = () => { const modal = document.getElementById("modal-criar-grupo"); if (modal) modal.style.display = "none"; };
window.criarGrupo = async (event) => {
  event?.preventDefault();
  const name = document.getElementById("inp-nome-grupo")?.value.trim();
  const description = document.getElementById("inp-descricao")?.value.trim();
  const theme = document.getElementById("inp-tema")?.value.trim();
  const memberNames = (document.getElementById("inp-integrantes")?.value || "").split(",").map((name) => name.trim()).filter(Boolean);
  const advisor = document.getElementById("inp-orientador")?.value.trim() || "";
  if (!name || !description || !theme || !memberNames.length) return alert("Preencha nome, tema, descrição e integrantes.");
  try {
    // Procura os nomes digitados nos perfis reais dos alunos. Dessa forma, o
    // grupo novo aparece nas consultas de participação de cada aluno, em vez de
    // existir somente como um cartão visual na tela do coordenador.
    const people = await getDocs(classQuery("usuarios"));
    const students = people.docs.filter((item) => item.data().tipo === "aluno");
    const members = memberNames.map((memberName) => students.find((item) => item.data().nome?.trim().toLowerCase() === memberName.toLowerCase()));
    const missing = memberNames.filter((_, index) => !members[index]);
    if (missing.length) return alert(`Não encontrei estes alunos nesta turma: ${missing.join(", ")}. Use os nomes cadastrados no sistema.`);
    const alreadyAssigned = members.filter((member) => member.data().grupoId);
    if (alreadyAssigned.length) return alert(`Estes alunos já estão em um grupo: ${alreadyAssigned.map((member) => member.data().nome).join(", ")}. Remova a associação atual antes de criar outro grupo.`);
    const matchedAdvisor = advisor ? people.docs.find((item) => item.data().tipo === "professor" && (item.data().nome?.toLowerCase() === advisor.toLowerCase() || item.data().email?.toLowerCase() === advisor.toLowerCase())) : null;
    if (advisor && !matchedAdvisor) return alert("Não encontrei esse professor cadastrado nesta turma. Informe o nome ou e-mail cadastrado.");
    const groupRef = doc(collection(db, "grupos"));
    const batch = writeBatch(db);
    batch.set(groupRef, {
      codigoSala: profile.codigoSala,
      nome, descricao, tema,
      proposta: theme,
      membros: members.map((item) => item.id),
      integrantes: memberNames,
      nomesMembros: memberNames,
      orientador: matchedAdvisor?.data().nome || "A definir",
      orientadorUid: matchedAdvisor?.id || "",
      status: "no-prazo",
      criadoPor: user.uid,
      criadoEm: serverTimestamp(),
    });
    // Salva o vínculo de cada aluno com o grupo no mesmo lote que cria o grupo.
    // Assim, a barra lateral, o chat, as atividades e a lista de usuários passam
    // a mostrar a mesma composição de grupo.
    members.forEach((member) => batch.update(doc(db, "usuarios", member.id), { grupoId: groupRef.id, grupoNome: name }));
    await batch.commit();
    document.getElementById("form-criar-grupo")?.reset();
    window.fecharModalCriarGrupo();
    alert("Grupo criado e integrantes associados.");
  } catch (error) { reportError("Não foi possível criar o grupo.", error); }
};

window.excluirGrupo = (id, name = "este grupo") => {
  groupToDelete = id;
  const modal = document.getElementById("modal-confirmar-exclusao");
  if (modal) {
    const label = document.getElementById("nome-grupo-excluir");
    if (label) label.textContent = `“${name}”`;
    modal.style.display = "flex";
  } else if (confirm(`Excluir ${name}?`)) window.confirmarExclusao();
};
window.fecharModalExclusao = () => { const modal = document.getElementById("modal-confirmar-exclusao"); if (modal) modal.style.display = "none"; groupToDelete = null; };
window.confirmarExclusao = async () => {
  if (!groupToDelete) return;
  try {
    const groupRef = doc(db, "grupos", groupToDelete);
    const groupSnapshot = await getDoc(groupRef);
    const batch = writeBatch(db);
    (groupSnapshot.data()?.membros || []).forEach((memberId) => batch.update(doc(db, "usuarios", memberId), { grupoId: "", grupoNome: "" }));
    batch.delete(groupRef);
    await batch.commit();
    window.fecharModalExclusao();
  }
  catch (error) { reportError("Não foi possível excluir o grupo.", error); }
};
window.mudarStatus = async (id, status) => {
  try { await updateDoc(doc(db, "grupos", id), { status }); }
  catch (error) { reportError("Não foi possível atualizar o status.", error); }
};
window.scrollGrupos = (direction) => document.getElementById("GT")?.scrollBy({ left: direction * 360, behavior: "smooth" });
window.sortearGrupos = async () => {
  if (!confirm("Sortear grupos automaticamente entre alunos ainda sem grupo?")) return;
  try {
    const [people, groups] = await Promise.all([getDocs(classQuery("usuarios")), getDocs(classQuery("grupos"))]);
    const assigned = new Set(groups.docs.flatMap((item) => item.data().membros || []));
    const students = people.docs.filter((item) => item.data().tipo === "aluno" && !assigned.has(item.id) && !item.data().grupoId).sort(() => Math.random() - 0.5);
    if (!students.length) return alert("Não há alunos sem grupo para sortear.");
    const size = Math.max(2, Math.min(5, Number(prompt("Quantidade de alunos por grupo (2 a 5):", "4")) || 4));
    const batch = writeBatch(db);
    let created = 0;
    for (let index = 0; index + 1 < students.length; index += size) {
      const members = students.slice(index, index + size);
      const ref = doc(collection(db, "grupos"));
      const names = members.map((item) => item.data().nome || item.data().email);
      const groupName = `Grupo sorteado ${created + 1}`;
      batch.set(ref, { codigoSala: profile.codigoSala, nome: groupName, descricao: "Grupo formado pelo sorteio do coordenador.", tema: "A definir", membros: members.map((item) => item.id), integrantes: names, nomesMembros: names, orientador: "A definir", status: "no-prazo", criadoPor: user.uid, criadoEm: serverTimestamp() });
      members.forEach((member) => batch.update(doc(db, "usuarios", member.id), { grupoId: ref.id, grupoNome: groupName }));
      created++;
    }
    await batch.commit();
    alert(`${created} grupo(s) criado(s). Alunos restantes abaixo do tamanho escolhido ficaram sem associação.`);
  } catch (error) { reportError("Não foi possível sortear os grupos.", error); }
};
window.configurarLimites = () => alert("A criação manual exige integrantes cadastrados na turma. O limite de integrantes pode ser ajustado diretamente na lista ao selecionar os alunos.");

async function addGroupMember(groupId) {
  const email = prompt("Informe o e-mail cadastrado do aluno:")?.trim().toLowerCase();
  if (!email) return;
  try {
    const people = await getDocs(classQuery("usuarios"));
    const member = people.docs.find((item) => item.data().tipo === "aluno" && item.data().email?.toLowerCase() === email);
    if (!member) return alert("Aluno não encontrado nesta turma.");
    const groupSnapshot = await getDoc(doc(db, "grupos", groupId));
    if (member.data().grupoId && member.data().grupoId !== groupId) return alert("Este aluno já está associado a outro grupo.");
    const groupName = groupSnapshot.data()?.nome || "Grupo";
    const batch = writeBatch(db);
    batch.update(doc(db, "grupos", groupId), { membros: arrayUnion(member.id), integrantes: arrayUnion(member.data().nome || email), nomesMembros: arrayUnion(member.data().nome || email) });
    batch.update(doc(db, "usuarios", member.id), { grupoId: groupId, grupoNome: groupName });
    await batch.commit();
  } catch (error) { reportError("Não foi possível adicionar o aluno.", error); }
}
async function assignAdvisor(groupId) {
  const email = prompt("Informe o e-mail cadastrado do professor orientador:")?.trim().toLowerCase();
  if (!email) return;
  try {
    const people = await getDocs(classQuery("usuarios"));
    const teacher = people.docs.find((item) => item.data().tipo === "professor" && item.data().email?.toLowerCase() === email);
    if (!teacher) return alert("Professor não encontrado nesta turma.");
    await updateDoc(doc(db, "grupos", groupId), { orientador: teacher.data().nome || email, orientadorUid: teacher.id });
  } catch (error) { reportError("Não foi possível definir o orientador.", error); }
}

function loadForum() {
  const notices = document.getElementById("lista-avisos");
  const createButton = document.getElementById("novo-aviso");
  if (notices && profile.codigoSala) {
    stopNotices?.();
    stopNotices = onSnapshot(classQuery("avisos"), (snapshot) => {
      notices.replaceChildren();
      if (snapshot.empty) { notices.textContent = "Nenhum aviso publicado para esta turma."; return; }
      snapshot.forEach((item) => {
        const notice = item.data();
        const card = document.createElement("article");
        card.className = "Cards";
        card.innerHTML = `<div id="top-card"><div><h3>${safe(notice.titulo || "Aviso")}</h3><small>${safe(notice.autor || "Coordenador")} · ${safe(notice.data?.toDate?.().toLocaleDateString("pt-BR") || "Agora")}</small></div><button class="btn-tabela vermelho">Excluir</button></div><p>${safe(notice.conteudo || "")}</p>`;
        card.querySelector("button").addEventListener("click", async () => {
          if (!confirm("Excluir este aviso?")) return;
          try { await deleteDoc(doc(db, "avisos", item.id)); }
          catch (error) { reportError("Não foi possível excluir o aviso.", error); }
        });
        notices.appendChild(card);
      });
    });
  }
  createButton?.addEventListener("click", window.novoAviso);
  const doubtTab = document.getElementById("aba-duvidas");
  doubtTab?.addEventListener("click", loadDoubts);
}

window.novoAviso = async () => {
  const title = prompt("Título do aviso:")?.trim();
  const content = prompt("Conteúdo do aviso:")?.trim();
  if (!title || !content || !profile.codigoSala) return;
  try {
    await addDoc(collection(db, "avisos"), { titulo: title, conteudo: content, autor: profile.nome || "Coordenador", autorUid: user.uid, tipoAutor: "Coordenador", codigoSala: profile.codigoSala, data: serverTimestamp() });
  } catch (error) { reportError("Não foi possível publicar o aviso.", error); }
};

function loadDoubts() {
  const panel = document.getElementById("tab-duvidas");
  if (!panel || !profile.codigoSala) return;
  panel.querySelectorAll(".duvidas-dinamicas").forEach((item) => item.remove());
  const list = document.createElement("div");
  list.className = "duvidas-dinamicas";
  panel.appendChild(list);
  stopDoubts?.();
  stopDoubts = onSnapshot(classQuery("duvidas"), (snapshot) => {
    list.replaceChildren();
    if (snapshot.empty) { list.textContent = "Ainda não há dúvidas nesta turma."; return; }
    snapshot.forEach((item) => {
      const doubt = item.data();
      const card = document.createElement("article");
      card.className = "Duvidas";
      const heading = document.createElement("h3");
      heading.textContent = `${doubt.autor || "Aluno"} — ${doubt.titulo || "Dúvida"}`;
      const body = document.createElement("p");
      body.textContent = doubt.conteudo || "";
      card.append(heading, body);
      const response = document.createElement("textarea");
      response.rows = 3;
      response.maxLength = 2000;
      response.placeholder = "Resposta visível ao aluno";
      response.value = doubt.resposta || "";
      const button = document.createElement("button");
      button.className = "btn-acao";
      button.textContent = doubt.resposta ? "Atualizar resposta" : "Responder";
      button.addEventListener("click", async () => {
        if (!response.value.trim()) return alert("Escreva uma resposta antes de enviar.");
        try { await updateDoc(doc(db, "duvidas", item.id), { resposta: response.value.trim(), respondidoPor: profile.nome || "Coordenador", respondidoPorUid: user.uid, status: "respondido", respondidoEm: serverTimestamp() }); }
        catch (error) { reportError("Não foi possível salvar a resposta.", error); }
      });
      card.append(response, button);
      list.appendChild(card);
    });
  });
}

window.responderDuvida = async (inputId, button) => {
  const text = document.getElementById(inputId)?.value.trim();
  if (!text) return alert("Escreva uma resposta.");
  const itemId = button?.dataset?.duvida;
  if (!itemId) return alert("Atualize a lista de dúvidas e tente novamente.");
  await updateDoc(doc(db, "duvidas", itemId), { resposta: text, respondidoPor: profile.nome || "Coordenador", respondidoPorUid: user.uid, status: "respondido", respondidoEm: serverTimestamp() });
};
