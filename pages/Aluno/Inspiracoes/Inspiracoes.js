import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../../backend/firebase/config.js";
import { requireStudent } from "../../../backend/firebase/professor.js";

const CATEGORY_LABELS = {
  todos: "Todos",
  web: "Web",
  embarcados: "Embarcados",
  software: "Software",
  mobile: "Mobile",
};
const CATEGORY_COLORS = {
  embarcados: "green",
  software: "rose",
  web: "amber",
  mobile: "blue",
};
let projects = [];

function normalizeCategory(value = "") {
  const normalized = String(value).trim().toLocaleLowerCase("pt-BR");
  if (normalized.includes("embarc")) return "embarcados";
  if (normalized.includes("software")) return "software";
  if (normalized.includes("mobile")) return "mobile";
  if (normalized.includes("web")) return "web";
  return normalized;
}

function selectedCategory() {
  const active = document.querySelector(".filtro.ativo");
  const label = active?.textContent.trim() || "Todos";
  return Object.keys(CATEGORY_LABELS).find((key) => CATEGORY_LABELS[key] === label) || "todos";
}

function updateStats() {
  const total = document.getElementById("inspi-total");
  const years = document.getElementById("inspi-years");
  const distinctYears = new Set(projects.map((project) => project.turmaSemestre || project.ano || project.semestre).filter(Boolean));
  if (total) total.textContent = String(projects.length);
  if (years) years.textContent = String(distinctYears.size);
}

function createCard(project) {
  const category = normalizeCategory(project.categoria || project.tema || project.tipo || "");
  const card = document.createElement("article");
  card.className = `TCCs-superior ${CATEGORY_COLORS[category] || "blue"}`;

  const meta = document.createElement("div");
  meta.className = "data-tema";
  const year = document.createElement("span");
  year.className = "data";
  year.textContent = String(project.turmaSemestre || project.ano || project.semestre || "Turma anterior");
  const categoryLabel = document.createElement("span");
  categoryLabel.className = "tema";
  categoryLabel.textContent = CATEGORY_LABELS[category] || project.categoria || project.tema || "Projeto";
  meta.append(year, categoryLabel);

  const title = document.createElement("h2");
  title.textContent = project.titulo || project.nomeProjeto || project.nome || "Projeto sem título";
  const description = document.createElement("p");
  description.textContent = project.descricao || project.resumo || "Descrição não informada.";
  card.append(meta, title, description);

  if (project.origemIdeia || project.inspiracao) {
    const context = document.createElement("div");
    context.className = "TCCs-int";
    const heading = document.createElement("h3");
    heading.textContent = "Como surgiu a ideia";
    const text = document.createElement("p");
    text.textContent = project.origemIdeia || project.inspiracao;
    context.append(heading, text);
    card.appendChild(context);
  }

  const members = Array.isArray(project.integrantes)
    ? project.integrantes.filter((name) => typeof name === "string" && name.trim())
    : Array.isArray(project.nomesMembros)
      ? project.nomesMembros.filter((name) => typeof name === "string" && name.trim())
      : [];
  if (members.length) {
    const memberLine = document.createElement("p");
    memberLine.className = "integrantes";
    memberLine.textContent = `Integrantes: ${members.join(" · ")}`;
    card.appendChild(memberLine);
  }

  const approval = project.statusAprovacao || project.status;
  if (approval) {
    const status = document.createElement("span");
    status.className = "TCCs-inferior";
    status.textContent = approval;
    card.appendChild(status);
  }
  return card;
}

function renderProjects() {
  const grid = document.getElementById("inspi-grid");
  if (!grid) return;
  const query = document.getElementById("busca-inp")?.value.trim().toLocaleLowerCase("pt-BR") || "";
  const category = selectedCategory();
  const visible = projects.filter((project) => {
    const projectCategory = normalizeCategory(project.categoria || project.tema || project.tipo || "");
    const matchesCategory = category === "todos" || projectCategory === category;
    const memberNames = Array.isArray(project.integrantes)
      ? project.integrantes
      : Array.isArray(project.nomesMembros)
        ? project.nomesMembros
        : typeof project.integrantes === "string"
          ? [project.integrantes]
          : [];
    const searchable = [project.titulo, project.nomeProjeto, project.nome, project.descricao, project.resumo, project.categoria, project.tema, ...memberNames]
      .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return matchesCategory && (!query || searchable.includes(query));
  });

  grid.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "inspi-empty";
    empty.textContent = projects.length
      ? "Nenhum projeto corresponde a esta busca ou categoria."
      : "Ainda não há projetos de inspiração cadastrados.";
    grid.appendChild(empty);
    return;
  }
  visible.forEach((project) => grid.appendChild(createCard(project)));
}

function goToCategory(category) {
  const normalized = normalizeCategory(category);
  const target = normalized === "todos" ? "Inspiracoes.html" : `Inspiracoes-${CATEGORY_LABELS[normalized]}.html`;
  window.location.href = target;
}

window.irPara = goToCategory;
window.filtrarInspi = renderProjects;

document.querySelectorAll(".filtro").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filtro").forEach((item) => item.classList.remove("ativo"));
    button.classList.add("ativo");
  });
});

requireStudent(() => {
  onSnapshot(collection(db, "inspiracoes"), (snapshot) => {
    projects = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    updateStats();
    renderProjects();
  }, (error) => {
    console.error("Não foi possível carregar projetos de inspiração:", error);
    const grid = document.getElementById("inspi-grid");
    if (grid) grid.textContent = "Não foi possível carregar os projetos de inspiração.";
  });
});
