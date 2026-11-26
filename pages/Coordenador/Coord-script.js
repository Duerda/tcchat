import { auth, db } from "../../backend/firebase/config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query,
  serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { appUrl, requireCoordinator } from "../../backend/firebase/professor.js";
import { deleteGroupData } from "../../backend/firebase/delete-group.js";

const LOGIN = appUrl("pages/auth/Login/Log-aluno.html");
const COURSE_NAMES = {
  DS: "Desenvolvimento de Sistemas", DI: "Design de Interiores", HOSP: "Hospedagem",
  IPI: "Informática para Internet - MTEC", MA: "Meio Ambiente", SEC: "Secretariado",
  ADM: "Administração", INF: "Informática - MTEC",
};
const GROUP_MIN_MEMBERS = 3;
const GROUP_MAX_MEMBERS = 5;
const MAX_GROUPS_PER_ROOM = 8;
let user;
let profile;
let stopDoubts;
let stopNotices;
let stopGroups;
let stopUsers;
let stopRoomSources = [];
let groupToDelete;
let creationRoomCode = "";
let creationStudents = [];
let creationAdvisors = [];
let selectedCreationStudentIds = new Set();
let userRecords = { alunos: [], professores: [] };

window.Voltar = async () => { await signOut(auth); window.location.href = LOGIN; };
window.Painel = () => (window.location.href = "Coord-Index.html");
window.Usuarios = () => (window.location.href = "Coord-Usuarios.html");
window.GruposCoord = () => (window.location.href = "Coord-Grupos.html");
window.Biblioteca = () => (window.location.href = "Coord-Biblioteca.html");
window.Forum = () => (window.location.href = "Coord-Forum.html");
window.Configuracoes = () => (window.location.href = "Config.html");
window.Cursos = () => (window.location.href = "Coord-Index.html");

function pageName() { return window.location.pathname.split("/").pop(); }
function safe(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}
function reportError(message, error) {
  console.error(message, error);
  alert(message);
}

// A Biblioteca valida o acesso em seu próprio módulo. Evita duas validações
// concorrentes da sessão ao abrir essa página.
if (pageName() !== "Coord-Biblioteca.html") {
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
}

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
  return query(collection(db, collectionName));
}

function queryForRoom(collectionName, roomCode) {
  return query(collection(db, collectionName), where("codigoSala", "==", roomCode));
}

function requestRoomCode() {
  const roomCode = prompt("Código da turma no formato SIGLA-ANO (ex.: DS-1):", "DS-1")?.trim().toUpperCase();
  if (!roomCode) return null;
  if (!/^(DS|DI|HOSP|IPI|MA|SEC|ADM|INF)-[123]$/.test(roomCode)) {
    alert("Use um código de turma válido, como DS-1.");
    return null;
  }
  return roomCode;
}

function requestTeacherRooms() {
  const raw = prompt("Turmas do professor, separadas por vírgula (ex.: DS-1, ADM-2):", "DS-1")?.trim();
  if (!raw) return null;
  const rooms = [...new Set(raw.split(/[\s,;]+/).map((room) => room.toUpperCase()).filter(Boolean))];
  if (!rooms.length || rooms.length > 8 || rooms.some((room) => !/^(DS|DI|HOSP|IPI|MA|SEC|ADM|INF)-[123]$/.test(room))) {
    alert("Informe de 1 a 8 códigos de turma válidos, separados por vírgula.");
    return null;
  }
  return rooms;
}

function loadDashboard() {
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
      overview.textContent = `Todas as turmas · ${groups.length} grupos · ${users.filter((item) => item.tipo === "aluno").length} alunos`;
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
    empty.textContent = "Nenhum grupo sinalizado como atenção ou atraso.";
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
  const filters = document.getElementById("filtros-usuarios");
  const courseFilter = document.getElementById("filtro-curso");
  const seriesFilter = document.getElementById("filtro-serie");
  const profileFilter = document.getElementById("filtro-perfil");
  const clearFilters = document.getElementById("limpar-filtros-usuarios");
  const filterSummary = document.getElementById("resumo-filtros-usuarios");
  const codeFilters = document.getElementById("filtros-codigos");
  const codeCourseFilter = document.getElementById("filtro-codigo-curso");
  const codeSeriesFilter = document.getElementById("filtro-codigo-serie");
  const codeProfileFilter = document.getElementById("filtro-codigo-perfil");
  const clearCodeFilters = document.getElementById("limpar-filtros-codigos");
  const codeFilterSummary = document.getElementById("resumo-filtros-codigos");
  let accessCodes = [];
  if (codeRows) codeRows.replaceChildren();
  if (studentRows) studentRows.replaceChildren();
  if (teacherRows) teacherRows.replaceChildren();

  const getRooms = (data) => [...new Set([...(data.codigoSalas || []), data.codigoSala].filter(Boolean))];
  const getCourses = (data) => {
    const roomCourses = getRooms(data).map((room) => COURSE_NAMES[room.split("-")[0]] || room.split("-")[0]);
    return [...new Set((roomCourses.length ? roomCourses : [data.curso || "Não informado"]).filter(Boolean))];
  };
  const getSeries = (data) => [...new Set(getRooms(data).map((room) => room.split("-")[1]).filter((series) => /^[123]$/.test(series)))];
  const updateFilterOptions = () => {
    const selectedCourse = courseFilter?.value || "";
    const selectedSeries = seriesFilter?.value || "";
    const selectedProfile = profileFilter?.value || "";
    const people = [...userRecords.alunos, ...userRecords.professores].map((item) => item.data());
    const courses = [...new Set(people.flatMap(getCourses))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const series = [...new Set(people.flatMap(getSeries))].sort((a, b) => Number(a) - Number(b));
    if (courseFilter) {
      courseFilter.replaceChildren(new Option("Todos os cursos", ""));
      courses.forEach((course) => courseFilter.add(new Option(course, course)));
      courseFilter.value = courses.includes(selectedCourse) ? selectedCourse : "";
    }
    if (seriesFilter) {
      seriesFilter.replaceChildren(new Option("Todas as séries", ""));
      series.forEach((item) => seriesFilter.add(new Option(`${item}ª série`, item)));
      seriesFilter.value = series.includes(selectedSeries) ? selectedSeries : "";
    }
    if (profileFilter) profileFilter.value = ["", "aluno", "professor"].includes(selectedProfile) ? selectedProfile : "";
  };
  const renderFilteredUsers = () => {
    const selectedCourse = courseFilter?.value || "";
    const selectedSeries = seriesFilter?.value || "";
    const selectedProfile = profileFilter?.value || "";
    const filter = (record) => {
      const data = record.data();
      return (!selectedCourse || getCourses(data).includes(selectedCourse))
        && (!selectedSeries || getSeries(data).includes(selectedSeries))
        && (!selectedProfile || data.tipo === selectedProfile);
    };
    const students = userRecords.alunos.filter(filter);
    const teachers = userRecords.professores.filter(filter);
    renderUserRows(studentRows, students, "aluno");
    renderUserRows(teacherRows, teachers, "professor");
    if (filterSummary) {
      const total = students.length + teachers.length;
      filterSummary.textContent = `${total} usuário${total === 1 ? "" : "s"} encontrado${total === 1 ? "" : "s"}`;
    }
  };
  const onFilterChange = () => renderFilteredUsers();
  courseFilter?.addEventListener("change", onFilterChange);
  seriesFilter?.addEventListener("change", onFilterChange);
  profileFilter?.addEventListener("change", onFilterChange);
  clearFilters?.addEventListener("click", () => {
    if (courseFilter) courseFilter.value = "";
    if (seriesFilter) seriesFilter.value = "";
    if (profileFilter) profileFilter.value = "";
    renderFilteredUsers();
  });
  document.querySelectorAll("#EnCad .aba").forEach((button) => button.addEventListener("click", () => {
    if (filters) filters.hidden = button.id === "aba-codigos";
    if (codeFilters) codeFilters.hidden = button.id !== "aba-codigos";
  }));
  if (filters) filters.hidden = true;
  if (codeFilters) codeFilters.hidden = false;

  const updateCodeFilterOptions = () => {
    const selectedCourse = codeCourseFilter?.value || "";
    const selectedSeries = codeSeriesFilter?.value || "";
    const selectedProfile = codeProfileFilter?.value || "";
    const courses = [...new Set(accessCodes.flatMap(({ data }) => getCourses(data)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    const series = [...new Set(accessCodes.flatMap(({ data }) => getSeries(data)))].sort((a, b) => Number(a) - Number(b));
    if (codeCourseFilter) {
      codeCourseFilter.replaceChildren(new Option("Todos os cursos", ""));
      courses.forEach((course) => codeCourseFilter.add(new Option(course, course)));
      codeCourseFilter.value = courses.includes(selectedCourse) ? selectedCourse : "";
    }
    if (codeSeriesFilter) {
      codeSeriesFilter.replaceChildren(new Option("Todas as séries", ""));
      series.forEach((item) => codeSeriesFilter.add(new Option(`${item}ª série`, item)));
      codeSeriesFilter.value = series.includes(selectedSeries) ? selectedSeries : "";
    }
    if (codeProfileFilter) codeProfileFilter.value = ["", "aluno", "professor"].includes(selectedProfile) ? selectedProfile : "";
  };
  const renderCodeRows = () => {
    if (!codeRows) return;
    const selectedCourse = codeCourseFilter?.value || "";
    const selectedSeries = codeSeriesFilter?.value || "";
    const selectedProfile = codeProfileFilter?.value || "";
    const filteredCodes = accessCodes.filter(({ data }) => (!selectedCourse || getCourses(data).includes(selectedCourse))
      && (!selectedSeries || getSeries(data).includes(selectedSeries))
      && (!selectedProfile || data.tipo === selectedProfile));
    codeRows.replaceChildren();
    if (!filteredCodes.length) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="6">${accessCodes.length ? "Nenhum código corresponde aos filtros." : "Nenhum código de acesso encontrado."}</td>`;
      codeRows.appendChild(row);
    }
    filteredCodes.forEach(({ id, data: code }) => {
      const row = document.createElement("tr");
      const expiry = code.expiraEm?.toDate?.();
      const dateText = expiry ? expiry.toLocaleDateString("pt-BR") : "Sem limite";
      const rooms = code.codigoSalas || [code.codigoSala || code.curso || "Turma não informada"];
      const usage = `${Number(code.usos || 0)}${code.limiteUsos ? `/${code.limiteUsos}` : ""}`;
      row.innerHTML = `<td><span class="Chip">${safe(code.codigo || id)}</span></td><td>${safe(code.tipo)}</td><td>${safe(rooms.join(", "))}</td><td>${safe(usage)}</td><td>${safe(dateText)}${code.revogado ? " · Revogado" : ""}</td><td><button class="btn-tabela vermelho" data-revogar="${id}" ${code.revogado ? "disabled" : ""}>Revogar</button></td>`;
      row.querySelector("[data-revogar]")?.addEventListener("click", () => revokeCode(id));
      codeRows.appendChild(row);
    });
    if (codeFilterSummary) {
      codeFilterSummary.textContent = `${filteredCodes.length} código${filteredCodes.length === 1 ? "" : "s"} encontrado${filteredCodes.length === 1 ? "" : "s"}`;
    }
  };
  const onCodeFilterChange = () => renderCodeRows();
  codeCourseFilter?.addEventListener("change", onCodeFilterChange);
  codeSeriesFilter?.addEventListener("change", onCodeFilterChange);
  codeProfileFilter?.addEventListener("change", onCodeFilterChange);
  clearCodeFilters?.addEventListener("click", () => {
    if (codeCourseFilter) codeCourseFilter.value = "";
    if (codeSeriesFilter) codeSeriesFilter.value = "";
    if (codeProfileFilter) codeProfileFilter.value = "";
    renderCodeRows();
  });

  // Os códigos gerados ficam no Firestore junto com o tipo de conta permitido e
  // uma validade opcional. Assim, é possível contabilizar os cadastros feitos com
  // cada código e revogá-lo posteriormente.
  stopUsers = onSnapshot(classQuery("usuarios"), (snapshot) => {
    userRecords = {
      alunos: snapshot.docs.filter((item) => item.data().tipo === "aluno"),
      professores: snapshot.docs.filter((item) => item.data().tipo === "professor"),
    };
    updateFilterOptions();
    renderFilteredUsers();
  });
  onSnapshot(collection(db, "codigosAcesso"), (snapshot) => {
    accessCodes = snapshot.docs.map((item) => ({ id: item.id, data: item.data() }));
    updateCodeFilterOptions();
    renderCodeRows();
  });
}

function renderUserRows(tbody, records, role) {
  if (!tbody) return;
  tbody.replaceChildren();
  if (!records.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="5">Nenhum usuário encontrado.</td>';
    tbody.appendChild(row);
    return;
  }
  records.forEach((record) => {
    const data = record.data();
    const row = document.createElement("tr");
    const status = data.usuarioRemovido
      ? "Removido do sistema"
      : data.acessoAtivo === false
        ? "Acesso revogado"
        : data.ultimoAcesso?.toDate?.().toLocaleString("pt-BR") || "Ainda não entrou";
    const actions = data.usuarioRemovido
      ? `<button class="btn-tabela" data-restore="${record.id}">Restaurar</button>`
      : `<button class="btn-tabela" data-edit="${record.id}">Editar</button>${role === "professor" ? `<button class="btn-tabela" data-rooms="${record.id}">Turmas</button>` : ""}<button class="btn-tabela vermelho" data-remove="${record.id}">Excluir</button>`;
    const courseLabel = role === "professor" ? (data.codigoSalas || [data.codigoSala]).filter(Boolean).join(", ") : data.curso || "";
    row.innerHTML = `<td>${safe(data.nome || data.email || "Usuário")}</td><td>${safe(courseLabel)}</td><td>${safe(data.grupoNome || "—")}</td><td>${safe(status)}</td><td>${actions}</td>`;
    row.querySelector("[data-edit]")?.addEventListener("click", () => editUser(record.id, data));
    row.querySelector("[data-remove]")?.addEventListener("click", () => removeUser(record.id, data));
    row.querySelector("[data-restore]")?.addEventListener("click", () => restoreUser(record.id));
    row.querySelector("[data-rooms]")?.addEventListener("click", () => assignUserRooms(record.id, data));
    tbody.appendChild(row);
  });
}

async function assignUserRooms(id, currentData) {
  const existing = (currentData.codigoSalas || [currentData.codigoSala]).filter(Boolean).join(", ");
  const raw = prompt("Turmas do professor, separadas por vírgula (ex.: DS-1, ADM-2):", existing);
  if (raw === null) return;
  const rooms = [...new Set(raw.split(/[\s,;]+/).map((room) => room.trim().toUpperCase()).filter(Boolean))];
  if (!rooms.length || rooms.length > 8 || rooms.some((room) => !/^(DS|DI|HOSP|IPI|MA|SEC|ADM|INF)-[123]$/.test(room))) {
    return alert("Informe de 1 a 8 códigos de turma válidos, como DS-1, separados por vírgula.");
  }
  try {
    await updateDoc(doc(db, "usuarios", id), {
      codigoSala: rooms[0],
      codigoSalas: rooms,
      curso: [...new Set(rooms.map((room) => COURSE_NAMES[room.split("-")[0]]))].join(", "),
    });
  } catch (error) { reportError("Não foi possível atualizar as turmas do professor.", error); }
}

async function editUser(id, currentData) {
  const name = prompt("Nome do usuário:", currentData.nome || "")?.trim();
  if (!name) return;
  try {
    const userRef = doc(db, "usuarios", id);
    const batch = writeBatch(db);
    const initials = name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
    batch.update(userRef, { nome: name, iniciais: initials });
    if (currentData.grupoId) {
      const groupRef = doc(db, "grupos", currentData.grupoId);
      const groupSnapshot = await getDoc(groupRef);
      if (groupSnapshot.exists()) {
        const group = groupSnapshot.data();
        const oldName = currentData.nome || currentData.email || "";
        const replaceName = (names = []) => names.map((item) => item === oldName ? name : item);
        batch.update(groupRef, {
          integrantes: replaceName(group.integrantes || []),
          nomesMembros: replaceName(group.nomesMembros || group.integrantes || []),
        });
      }
    }
    await batch.commit();
  } catch (error) { reportError("Não foi possível editar o usuário.", error); }
}

async function removeUser(id, currentData) {
  const name = currentData.nome || currentData.email || "este usuário";
  if (!confirm(`Excluir ${name} do sistema? O acesso será desativado e o cadastro poderá ser restaurado depois.`)) return;
  try {
    const updates = {
      usuarioRemovido: true,
      acessoAtivo: false,
      removidoEm: serverTimestamp(),
      removidoPor: user.uid,
      grupoId: null,
      grupoNome: null,
    };
    const batch = writeBatch(db);
    batch.update(doc(db, "usuarios", id), updates);
    if (currentData.grupoId) {
      const groupRef = doc(db, "grupos", currentData.grupoId);
      const groupSnapshot = await getDoc(groupRef);
      if (groupSnapshot.exists()) {
        const group = groupSnapshot.data();
        const memberIds = (group.membros || []).filter((memberId) => memberId !== id);
        const oldName = currentData.nome || currentData.email || "";
        const memberNames = (group.integrantes || group.nomesMembros || []).filter((memberName) => memberName !== oldName);
        batch.update(groupRef, { membros: memberIds, integrantes: memberNames, nomesMembros: memberNames });
      }
    }
    await batch.commit();
  } catch (error) { reportError("Não foi possível excluir o usuário.", error); }
}

async function restoreUser(id) {
  if (!confirm("Restaurar este usuário e reativar o acesso?")) return;
  try {
    await updateDoc(doc(db, "usuarios", id), {
      usuarioRemovido: false,
      acessoAtivo: true,
      removidoEm: null,
      removidoPor: null,
    });
  } catch (error) { reportError("Não foi possível restaurar o usuário.", error); }
}

window.gerarCodigo = async (tipo) => {
  const rooms = tipo === "professor" ? requestTeacherRooms() : [requestRoomCode()].filter(Boolean);
  if (!rooms?.length) return;
  const sala = rooms[0];
  const expiry = prompt("Validade opcional (DD-MM-AAAA). Deixe vazio para não expirar:")?.trim();
  if (expiry && !/^\d{2}-\d{2}-\d{4}$/.test(expiry)) return alert("Informe a data no formato DD-MM-AAAA.");
  const [day, month, year] = expiry ? expiry.split("-").map(Number) : [];
  const expiryDate = expiry ? new Date(year, month - 1, day, 23, 59, 59) : null;
  if (expiryDate && (expiryDate.getFullYear() !== year || expiryDate.getMonth() !== month - 1 || expiryDate.getDate() !== day)) return alert("Informe uma data válida no formato DD-MM-AAAA.");
  if (expiryDate && (Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() < Date.now())) return alert("A validade deve ser uma data futura válida.");
  try {
    // O código de convite é aleatório e independente do código identificador da turma.
    const randomBytes = new Uint8Array(18);
    crypto.getRandomValues(randomBytes);
    const inviteCode = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
    await setDoc(doc(db, "codigosAcesso", inviteCode), {
      codigo: inviteCode,
      codigoSala: sala,
      ...(tipo === "professor" ? { codigoSalas: rooms, limiteUsos: 1 } : {}),
      curso: [...new Set(rooms.map((room) => COURSE_NAMES[room.split("-")[0]]))].join(", "),
      tipo,
      criadoPor: user.uid,
      criadoEm: serverTimestamp(),
      expiraEm: expiryDate,
      usos: 0,
      usadosPor: [],
      revogado: false,
    });
    prompt(`Convite criado para ${tipo} · turmas ${rooms.join(", ")}${tipo === "professor" ? " · uso único" : ""}. Copie e envie somente às pessoas autorizadas:`, inviteCode);
  } catch (error) { reportError("Não foi possível criar o código de acesso.", error); }
};

async function revokeCode(id) {
  if (!confirm("Revogar este código? Novos cadastros não poderão utilizá-lo.")) return;
  try { await updateDoc(doc(db, "codigosAcesso", id), { revogado: true, revogadoEm: serverTimestamp() }); }
  catch (error) { reportError("Não foi possível revogar o código.", error); }
}

function loadGroups() {
  if (document.getElementById("abas-turmas") && document.getElementById("painel-turmas")) {
    loadGroupsByRoom();
    return;
  }

  const container = document.getElementById("listaGruposCoord") || document.getElementById("GT");
  if (!container) return;
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
      const card = createGroupCard(item.id, group);
      container.appendChild(card);
    });
  }, (error) => reportError("Não foi possível carregar grupos da turma.", error));
}

function createGroupCard(id, group) {
  const card = document.createElement("article");
  card.className = "GT";
  card.dataset.id = id;
  card.innerHTML = `<h2>${safe(group.nome || "Grupo sem nome")}</h2><h3>${safe(group.tema || group.proposta || "Tema não informado")}</h3><p>${safe(group.codigoSala || "Turma não informada")}</p><p>${safe(group.descricao || "")}</p><p>Integrantes: ${safe((group.integrantes || group.nomesMembros || []).join(", ") || "Ainda não associados")}</p><p>Orientador: ${safe(group.orientador || "A definir")}</p><label>Status <select class="select-status"><option value="no-prazo">No prazo</option><option value="atencao">Atenção</option><option value="atraso">Atrasado</option></select></label><div><button class="btn-tabela" data-rename>Editar nome</button><button class="btn-tabela" data-add-member>+ Membro</button><button class="btn-tabela" data-advisor>Orientador</button><button class="btn-tabela vermelho" data-delete>Excluir</button></div>`;
  const statusSelect = card.querySelector("select");
  statusSelect.value = group.status || "no-prazo";
  statusSelect.addEventListener("change", () => updateDoc(doc(db, "grupos", id), { status: statusSelect.value }));
  card.querySelector("[data-rename]").addEventListener("click", () => renameGroup(id, group.nome));
  card.querySelector("[data-add-member]").addEventListener("click", () => addGroupMember(id));
  card.querySelector("[data-advisor]").addEventListener("click", () => assignAdvisor(id));
  card.querySelector("[data-delete]").addEventListener("click", () => window.excluirGrupo(id, group.nome));
  return card;
}

async function renameGroup(groupId, currentName = "") {
  const name = prompt("Novo nome do grupo:", currentName)?.trim();
  if (!name || name === currentName) return;
  try {
    const groupRef = doc(db, "grupos", groupId);
    const group = await getDoc(groupRef);
    if (!group.exists()) return alert("Grupo não encontrado.");
    const batch = writeBatch(db);
    batch.update(groupRef, { nome: name });
    for (const memberId of group.data().membros || []) {
      batch.update(doc(db, "usuarios", memberId), { grupoNome: name });
    }
    await batch.commit();
  } catch (error) { reportError("Não foi possível alterar o nome do grupo.", error); }
}

function loadGroupsByRoom() {
  const tabs = document.getElementById("abas-turmas");
  const panels = document.getElementById("painel-turmas");
  const sources = { users: [], groups: [], accessCodes: [] };
  let activeRoom = "";

  const render = () => {
    const roomCodes = new Set();
    const addRoom = (value) => {
      const code = String(value || "").trim().toUpperCase();
      if (/^(DS|DI|HOSP|IPI|MA|SEC|ADM|INF)-[123]$/.test(code)) roomCodes.add(code);
    };
    sources.users.forEach((item) => {
      if (["aluno", "professor"].includes(item.tipo)) {
        addRoom(item.codigoSala);
        (item.codigoSalas || []).forEach(addRoom);
      }
    });
    sources.groups.forEach((item) => addRoom(item.data.codigoSala));
    sources.accessCodes.forEach((item) => addRoom(item.codigoSala || item.codigo));

    const rooms = [...roomCodes].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
    if (!rooms.includes(activeRoom)) activeRoom = rooms[0] || "";
    tabs.replaceChildren();
    panels.replaceChildren();

    if (!rooms.length) {
      panels.textContent = "Nenhuma turma cadastrada. Gere um código de acesso ou cadastre usuários para uma turma.";
      return;
    }

    rooms.forEach((room) => {
      const key = `turma-${room.replace(/[^A-Z0-9_-]/g, "-")}`;
      const groupRecords = sources.groups.filter((item) => item.data.codigoSala === room);
      const courseCode = room.split("-")[0];
      const courseName = COURSE_NAMES[courseCode] || courseCode;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `aba${room === activeRoom ? " ativa" : ""}`;
      button.id = `aba-${key}`;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(room === activeRoom));
      button.textContent = `${room} · ${courseName} · ${groupRecords.length} grupo(s)`;
      button.addEventListener("click", () => {
        activeRoom = room;
        window.mudarAba(key);
        tabs.querySelectorAll("[role='tab']").forEach((tab) => tab.setAttribute("aria-selected", String(tab === button)));
      });
      tabs.appendChild(button);

      const panel = document.createElement("section");
      panel.className = "conteudo-aba";
      panel.id = `tab-${key}`;
      panel.setAttribute("role", "tabpanel");
      panel.style.display = room === activeRoom ? "block" : "none";
      const groupList = document.createElement("div");
      groupList.className = "listaGruposCoord";

      if (!groupRecords.length) {
        groupList.textContent = "Ainda não há grupos nesta turma.";
      } else {
        groupRecords.forEach(({ id, data: group }) => {
          const card = createGroupCard(id, group);
          groupList.appendChild(card);
        });
      }

      panel.appendChild(groupList);
      panels.appendChild(panel);
    });
  };

  stopRoomSources.forEach((stop) => stop());
  stopRoomSources = [
    onSnapshot(collection(db, "usuarios"), (snapshot) => {
      sources.users = snapshot.docs.map((item) => item.data());
      render();
    }, (error) => {
      console.error("Não foi possível carregar as turmas dos usuários:", error);
      panels.textContent = "Não foi possível carregar as turmas.";
    }),
    onSnapshot(collection(db, "grupos"), (snapshot) => {
      sources.groups = snapshot.docs.map((item) => ({ id: item.id, data: item.data() }));
      render();
    }, (error) => {
      console.error("Não foi possível carregar grupos:", error);
      panels.textContent = "Não foi possível carregar os grupos.";
    }),
    onSnapshot(collection(db, "codigosAcesso"), (snapshot) => {
      sources.accessCodes = snapshot.docs.map((item) => item.data());
      render();
    }, (error) => {
      console.error("Não foi possível carregar os códigos de acesso:", error);
    }),
  ];
  window.addEventListener("pagehide", () => stopRoomSources.forEach((stop) => stop()), { once: true });
}

window.abrirModalCriarGrupo = async () => {
  const roomCode = requestRoomCode();
  if (!roomCode) return;
  const modal = document.getElementById("modal-criar-grupo");
  const list = document.getElementById("lista-selecao-alunos");
  const roomLabel = document.getElementById("turma-selecao-alunos");
  creationRoomCode = roomCode;
  creationStudents = [];
  creationAdvisors = [];
  selectedCreationStudentIds = new Set();
  list?.replaceChildren();
  const searchInput = document.getElementById("busca-alunos");
  if (searchInput) searchInput.value = "";
  const advisorSearch = document.getElementById("busca-orientadores");
  if (advisorSearch) advisorSearch.value = "";
  const advisorSelect = document.getElementById("inp-orientador");
  if (advisorSelect) advisorSelect.value = "";
  if (roomLabel) roomLabel.textContent = `Alunos da turma ${roomCode}`;
  updateSelectedStudents();
  if (modal) modal.style.display = "flex";
  if (list) {
    const loading = document.createElement("p");
    loading.textContent = "Carregando alunos…";
    list.appendChild(loading);
  }
  try {
    const [people, groups] = await Promise.all([
      getDocs(classQuery("usuarios")), getDocs(queryForRoom("grupos", roomCode)),
    ]);
    const assignedIds = new Set(groups.docs.flatMap((group) => group.data().membros || []));
    creationStudents = people.docs
      .filter((item) => item.data().tipo === "aluno" && item.data().codigoSala === roomCode)
      .map((item) => ({ id: item.id, name: item.data().nome || item.data().email || "Aluno", assigned: Boolean(item.data().grupoId) || assignedIds.has(item.id) }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    renderStudentChoices();
    creationAdvisors = people.docs.filter((item) => item.data().tipo === "professor"
      && (item.data().codigoSala === roomCode || item.data().codigoSalas?.includes(roomCode)))
      .map((item) => ({ id: item.id, name: item.data().nome || item.data().email || "Orientador", email: item.data().email || "" }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    renderAdvisorChoices();
  } catch (error) {
    reportError("Não foi possível carregar os alunos desta turma.", error);
    if (list) list.textContent = "Falha ao carregar alunos.";
  }
};
window.fecharModalCriarGrupo = () => { const modal = document.getElementById("modal-criar-grupo"); if (modal) modal.style.display = "none"; };

function updateSelectedStudents() {
  const selectedCount = selectedCreationStudentIds.size;
  const counter = document.getElementById("contador-alunos-selecionados");
  if (counter) counter.textContent = `${selectedCount} de ${GROUP_MAX_MEMBERS} alunos selecionados`;
}

function renderAdvisorChoices() {
  const select = document.getElementById("inp-orientador");
  if (!select) return;
  const search = document.getElementById("busca-orientadores")?.value.trim().toLocaleLowerCase("pt-BR") || "";
  const selected = select.value;
  select.replaceChildren(new Option("A definir", ""));
  const matches = creationAdvisors.filter((advisor) => `${advisor.name} ${advisor.email}`.toLocaleLowerCase("pt-BR").includes(search));
  matches.forEach((advisor) => select.add(new Option(`${advisor.name}${advisor.email ? ` · ${advisor.email}` : ""}`, advisor.id)));
  if (creationAdvisors.length && !matches.length) select.add(new Option("Nenhum orientador corresponde à busca", "", true, true));
  if (matches.some((advisor) => advisor.id === selected)) select.value = selected;
}

function renderStudentChoices() {
  const list = document.getElementById("lista-selecao-alunos");
  if (!list) return;
  const search = document.getElementById("busca-alunos")?.value.trim().toLocaleLowerCase("pt-BR") || "";
  list.replaceChildren();
  const matches = creationStudents.filter((student) => student.name.toLocaleLowerCase("pt-BR").includes(search));
  if (!matches.length) {
    list.textContent = creationStudents.length ? "Nenhum aluno corresponde à busca." : "Não há alunos cadastrados nesta turma.";
    return;
  }
  matches.forEach((student) => {
    const label = document.createElement("label");
    label.className = "opcao-aluno";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = student.id;
    checkbox.disabled = student.assigned;
    checkbox.checked = selectedCreationStudentIds.has(student.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) selectedCreationStudentIds.add(student.id);
      else selectedCreationStudentIds.delete(student.id);
      if (selectedCreationStudentIds.size > GROUP_MAX_MEMBERS) {
        selectedCreationStudentIds.delete(student.id);
        checkbox.checked = false;
      }
      updateSelectedStudents();
    });
    const name = document.createElement("span");
    name.textContent = student.name;
    label.append(checkbox, name);
    if (student.assigned) {
      const status = document.createElement("small");
      status.textContent = "Já associado";
      label.appendChild(status);
    }
    list.appendChild(label);
  });
  updateSelectedStudents();
}

document.getElementById("busca-alunos")?.addEventListener("input", renderStudentChoices);
document.getElementById("busca-orientadores")?.addEventListener("input", renderAdvisorChoices);
window.criarGrupo = async (event) => {
  event?.preventDefault();
  const name = document.getElementById("inp-nome-grupo")?.value.trim();
  const description = document.getElementById("inp-descricao")?.value.trim();
  const theme = document.getElementById("inp-tema")?.value.trim();
  const memberIds = [...selectedCreationStudentIds];
  const advisorId = document.getElementById("inp-orientador")?.value || "";
  if (!name || !description || !theme) return alert("Preencha nome, tema e descrição.");
  if (memberIds.length < GROUP_MIN_MEMBERS || memberIds.length > GROUP_MAX_MEMBERS) return alert(`Selecione de ${GROUP_MIN_MEMBERS} a ${GROUP_MAX_MEMBERS} alunos.`);
  const roomCode = creationRoomCode;
  if (!roomCode) return;
  try {
    // Revalida turma, grupo e vínculos no envio para evitar associar um aluno
    // que tenha sido colocado em outro grupo enquanto o modal estava aberto.
    const existingGroups = await getDocs(queryForRoom("grupos", roomCode));
    if (existingGroups.size >= MAX_GROUPS_PER_ROOM) {
      return alert(`Esta turma já atingiu o limite de ${MAX_GROUPS_PER_ROOM} grupos.`);
    }
    const people = await getDocs(classQuery("usuarios"));
    const currentMembers = memberIds.map((id) => people.docs.find((item) => item.id === id));
    if (currentMembers.some((member) => !member || member.data().tipo !== "aluno" || member.data().codigoSala !== roomCode)) return alert("Atualize a lista e selecione alunos válidos desta turma.");
    const alreadyAssigned = currentMembers.filter((member) => member.data().grupoId);
    if (alreadyAssigned.length) return alert(`Estes alunos já estão em um grupo: ${alreadyAssigned.map((member) => member.data().nome).join(", ")}. Atualize a lista antes de continuar.`);
    const selectedMembers = currentMembers;
    const selectedMemberNames = currentMembers.map((member) => member.data().nome || member.data().email || "Aluno");
    const matchedAdvisor = advisorId ? people.docs.find((item) => item.id === advisorId && item.data().tipo === "professor"
      && (item.data().codigoSala === roomCode || item.data().codigoSalas?.includes(roomCode))) : null;
    if (advisorId && !matchedAdvisor) return alert("Atualize a lista e escolha um orientador válido desta turma.");
    const groupRef = doc(collection(db, "grupos"));
    const batch = writeBatch(db);
    batch.set(groupRef, {
      codigoSala: roomCode,
      nome, descricao, tema,
      proposta: theme,
      membros: selectedMembers.map((item) => item.id),
      integrantes: selectedMemberNames,
      nomesMembros: selectedMemberNames,
      orientador: matchedAdvisor?.data().nome || "A definir",
      orientadorUid: matchedAdvisor?.id || "",
      status: "no-prazo",
      criadoPor: user.uid,
      criadoEm: serverTimestamp(),
    });
    // Salva o vínculo de cada aluno com o grupo no mesmo lote que cria o grupo.
    // Assim, a barra lateral, o chat, as atividades e a lista de usuários passam
    // a mostrar a mesma composição de grupo.
    selectedMembers.forEach((member) => batch.update(doc(db, "usuarios", member.id), { grupoId: groupRef.id, grupoNome: name }));
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
    const deleted = await deleteGroupData(groupToDelete);
    if (!deleted) {
      alert("Grupo não encontrado.");
      return;
    }
    window.fecharModalExclusao();
  }
  catch (error) { reportError("Não foi possível excluir o grupo.", error); }
};
window.mudarStatus = async (id, status) => {
  try { await updateDoc(doc(db, "grupos", id), { status }); }
  catch (error) { reportError("Não foi possível atualizar o status.", error); }
};
window.scrollGrupos = (direction) => document.getElementById("GT")?.scrollBy({ left: direction * 360, behavior: "smooth" });
window.configurarLimites = () => alert(`Limites atuais: de ${GROUP_MIN_MEMBERS} a ${GROUP_MAX_MEMBERS} alunos por grupo e até ${MAX_GROUPS_PER_ROOM} grupos por turma.`);

async function addGroupMember(groupId) {
  const email = prompt("Informe o e-mail cadastrado do aluno:")?.trim().toLowerCase();
  if (!email) return;
  try {
    const groupSnapshot = await getDoc(doc(db, "grupos", groupId));
    if (!groupSnapshot.exists()) return alert("Grupo não encontrado.");
    const group = groupSnapshot.data();
    if ((group.membros || []).length >= GROUP_MAX_MEMBERS) return alert(`Cada grupo pode ter no máximo ${GROUP_MAX_MEMBERS} alunos.`);
    const people = await getDocs(queryForRoom("usuarios", group.codigoSala));
    const member = people.docs.find((item) => item.data().tipo === "aluno" && item.data().email?.toLowerCase() === email);
    if (!member) return alert("Aluno não encontrado na turma deste grupo.");
    if ((group.membros || []).includes(member.id)) return alert("Este aluno já está neste grupo.");
    if (member.data().grupoId && member.data().grupoId !== groupId) return alert("Este aluno já está associado a outro grupo.");
    const groupName = group.nome || "Grupo";
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
    const groupSnapshot = await getDoc(doc(db, "grupos", groupId));
    if (!groupSnapshot.exists()) return alert("Grupo não encontrado.");
    const people = await getDocs(classQuery("usuarios"));
    const teacher = people.docs.find((item) => item.data().tipo === "professor"
      && (item.data().codigoSala === groupSnapshot.data().codigoSala || item.data().codigoSalas?.includes(groupSnapshot.data().codigoSala))
      && item.data().email?.toLowerCase() === email);
    if (!teacher) return alert("Professor não encontrado na turma deste grupo.");
    await updateDoc(doc(db, "grupos", groupId), { orientador: teacher.data().nome || email, orientadorUid: teacher.id });
  } catch (error) { reportError("Não foi possível definir o orientador.", error); }
}

function loadForum() {
  const notices = document.getElementById("lista-avisos");
  const createButton = document.getElementById("novo-aviso");
  if (notices) {
    stopNotices?.();
    stopNotices = onSnapshot(classQuery("avisos"), (snapshot) => {
      notices.replaceChildren();
      if (snapshot.empty) { notices.textContent = "Nenhum aviso publicado para esta turma."; return; }
      snapshot.forEach((item) => {
        const notice = item.data();
        const card = document.createElement("article");
        card.className = "Cards";
        card.innerHTML = `<div id="top-card"><div><h3>${safe(notice.titulo || "Aviso")}</h3><small>${safe(notice.codigoSala || "Turma não informada")} · ${safe(notice.autor || "Coordenador")} · ${safe(notice.data?.toDate?.().toLocaleDateString("pt-BR") || "Agora")}</small></div><button class="btn-tabela vermelho">Excluir</button></div><p>${safe(notice.conteudo || "")}</p>`;
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
  const roomCode = requestRoomCode();
  if (!roomCode) return;
  const title = prompt("Título do aviso:")?.trim();
  const content = prompt("Conteúdo do aviso:")?.trim();
  if (!title || !content) return;
  try {
    await addDoc(collection(db, "avisos"), { titulo: title, conteudo: content, autor: profile.nome || "Coordenador", autorUid: user.uid, tipoAutor: "Coordenador", codigoSala: roomCode, data: serverTimestamp() });
  } catch (error) { reportError("Não foi possível publicar o aviso.", error); }
};

function loadDoubts() {
  const panel = document.getElementById("tab-duvidas");
  if (!panel) return;
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
      heading.textContent = `${doubt.codigoSala || "Turma não informada"} · ${doubt.autor || "Aluno"} — ${doubt.titulo || "Dúvida"}`;
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
