import { db } from "../../../backend/firebase/config.js";
import { aplicarAparenciaAluno } from "../aparencia.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let perfilRef = null;
// Os valores padrão servem apenas como alternativa para perfis antigos que ainda
// não têm preferências salvas. As configurações existentes são mescladas ao carregar
// os dados, para que salvar o nome não apague as escolhas do aluno.
let preferencias = {
  tema: "dark-mode",
  tamanhoFonte: 16,
  tipoFonte: "'DM Sans', sans-serif",
};

const fontesPredefinidas = ["DM Sans", "Georgia", "monospace", "Trebuchet MS"];

window.alunoReady?.then((session) => {
  if (!session) return;
  perfilRef = doc(db, "usuarios", session.user.uid);
  const dados = session.profile;
  const foto = document.querySelector("#foto span");
  const nome = document.querySelector("#NomeUC h4");
  const curso = document.querySelector("#NomeUC h5");

  if (foto) foto.textContent = dados.iniciais || "";
  if (nome) nome.textContent = dados.nome || "";
  if (curso) curso.textContent = dados.curso || "";

  // Preenche os campos da conta com os dados do perfil autenticado. Assim, o aluno
  // pode conferir suas informações atuais, sem encontrar os campos vazios sempre
  // que abrir esta página.
  document.getElementById("inp-nome").value = dados.nome || "";
  document.getElementById("inp-email").value = session.user.email || "";
  document.getElementById("inp-curso").value = dados.curso || "";

  // Mantém todas as configurações salvas e valida os valores antes de aplicá-los.
  // Isso evita usar dados inválidos ou incompatíveis, que podem ter sido gravados
  // por versões anteriores do sistema.
  const salvas = dados.configuracoes || {};
  preferencias = {
    ...preferencias,
    ...salvas,
    tema: ["dark-mode", "light-mode"].includes(salvas.tema) ? salvas.tema : "dark-mode",
    tamanhoFonte: [14, 16, 18].includes(Number(salvas.tamanhoFonte)) ? Number(salvas.tamanhoFonte) : 16,
    tipoFonte: typeof salvas.tipoFonte === "string" && salvas.tipoFonte.trim()
      ? salvas.tipoFonte
      : "'DM Sans', sans-serif",
  };
  sincronizarControles();
  aplicarPreferencias();
});

function aplicarPreferencias() {
  aplicarAparenciaAluno(preferencias);
}

// Atualiza os controles visíveis com as preferências salvas assim que a página abre.
function sincronizarControles() {
  const tema = document.getElementById("select-tema");
  if (tema) tema.value = preferencias.tema;
  document.querySelectorAll(".size-btn").forEach((button) => {
    button.classList.toggle("ativo", Number(button.getAttribute("onclick")?.match(/\d+/)?.[0]) === preferencias.tamanhoFonte);
  });
  document.querySelectorAll(".fonte-op").forEach((option, index) => {
    option.classList.toggle("ativa", fontesPredefinidas[index] && preferencias.tipoFonte.toLowerCase().includes(fontesPredefinidas[index].toLowerCase()));
  });
}

window.setTema = (tema) => {
  if (!["dark-mode", "light-mode"].includes(tema)) return;
  preferencias.tema = tema;
  aplicarPreferencias();
};

window.setFonte = (nome, el) => {
  preferencias.tipoFonte = `'${nome}', ${nome}, sans-serif`;
  aplicarPreferencias();
  document.querySelectorAll(".fonte-op").forEach((option) => option.classList.remove("ativa"));
  el?.classList.add("ativa");
};

window.aplicarFonteCustom = () => {
  const nome = document.getElementById("inp-fonte-custom").value.trim();
  if (!nome) return;
  preferencias.tipoFonte = `'${nome}', ${nome}, sans-serif`;
  aplicarPreferencias();
  document.querySelectorAll(".fonte-op").forEach((option) => option.classList.remove("ativa"));
  const preview = document.getElementById("fonte-preview");
  preview.style.display = "block";
  preview.style.fontFamily = preferencias.tipoFonte;
  preview.textContent = "O rato roeu a roupa do rei de Roma. 0123456789.";
};

window.setTamanho = (tamanho, el) => {
  preferencias.tamanhoFonte = Number(tamanho);
  aplicarPreferencias();
  document.querySelectorAll(".size-btn").forEach((button) => button.classList.remove("ativo"));
  el?.classList.add("ativo");
};

window.salvarPerfil = async () => {
  if (!perfilRef) {
    alert("Aguarde o carregamento do seu perfil e tente novamente.");
    return;
  }
  const nome = document.getElementById("inp-nome").value.trim();
  if (!nome) {
    alert("Preencha o nome.");
    return;
  }
  try {
    const iniciais = nome.split(/\s+/).map((parte) => parte[0]).join("").slice(0, 2).toUpperCase();
    // Salva o perfil e todas as preferências de aparência juntos. O arquivo
    // navigation.js lê esse objeto nas outras páginas para manter as escolhas do
    // aluno consistentes durante a navegação.
    await updateDoc(perfilRef, { nome, iniciais, configuracoes: preferencias });
    document.querySelector("#NomeUC h4").textContent = nome;
    document.querySelector("#foto span").textContent = iniciais;
    alert("Perfil e preferências salvos.");
  } catch (error) {
    console.error("Não foi possível salvar o perfil do aluno:", error);
    alert("Não foi possível salvar as alterações.");
  }
};

window.Painel = () => (location.href = "../Turma/index.html");
window.Forum = () => (location.href = "../Forum/Fo.html");
window.Inspiracoes = () => (location.href = "../Inspiracoes/Inspiracoes.html");
window.Configuracoes = () => (location.href = "Config.html");
