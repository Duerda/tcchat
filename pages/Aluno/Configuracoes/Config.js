import { db } from "../../../backend/firebase/config.js";
import { aplicarAparenciaAluno } from "../aparencia.js";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let perfilRef = null;
let usuarioAutenticado = null;
// Os valores padrão servem apenas como alternativa para perfis antigos que ainda
// não têm preferências salvas. As configurações existentes são mescladas ao carregar
// os dados, para que salvar o nome não apague as escolhas do aluno.
let preferencias = {
  tema: "dark-mode",
  tamanhoFonte: 16,
  tipoFonte: "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",
};

window.alunoReady?.then((session) => {
  if (!session) return;
  perfilRef = doc(db, "usuarios", session.user.uid);
  usuarioAutenticado = session.user;
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
      : "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif",
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
  const normalizarFonte = (value) => String(value || "").replace(/[\"']/g, "").replace(/\s+/g, "").toLowerCase();
  document.querySelectorAll(".fonte-op").forEach((option) => {
    option.classList.toggle("ativa", normalizarFonte(option.dataset.fonte) === normalizarFonte(preferencias.tipoFonte));
  });
}

window.setTema = (tema) => {
  if (!["dark-mode", "light-mode"].includes(tema)) return;
  preferencias.tema = tema;
  aplicarPreferencias();
};

window.setFonte = (familia, el) => {
  preferencias.tipoFonte = String(familia || "").trim();
  aplicarPreferencias();
  document.querySelectorAll(".fonte-op").forEach((option) => option.classList.remove("ativa"));
  el?.classList.add("ativa");
  document.getElementById("fonte-preview").style.display = "none";
};

window.aplicarFonteCustom = () => {
  const nome = document.getElementById("inp-fonte-custom").value.trim();
  if (!nome) return;
  preferencias.tipoFonte = `${JSON.stringify(nome)}, sans-serif`;
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

window.alterarSenha = async () => {
  const atual = document.getElementById("senha-atual").value;
  const nova = document.getElementById("senha-nova").value;
  const confirmacao = document.getElementById("senha-confirmacao").value;
  if (!usuarioAutenticado?.email) return alert("Sua sessão não está pronta. Atualize a página.");
  if (!atual || !nova || nova.length < 8 || nova !== confirmacao) {
    return alert("Informe a senha atual e uma nova senha de pelo menos 8 caracteres, repetida corretamente.");
  }
  try {
    const credential = EmailAuthProvider.credential(usuarioAutenticado.email, atual);
    await reauthenticateWithCredential(usuarioAutenticado, credential);
    await updatePassword(usuarioAutenticado, nova);
    document.getElementById("senha-atual").value = "";
    document.getElementById("senha-nova").value = "";
    document.getElementById("senha-confirmacao").value = "";
    alert("Senha alterada com sucesso.");
  } catch (error) {
    console.error("Não foi possível alterar a senha do aluno:", error);
    alert(error.code === "auth/invalid-credential" || error.code === "auth/wrong-password"
      ? "A senha atual está incorreta."
      : "Não foi possível alterar a senha. Confira os dados e tente novamente.");
  }
};

window.Painel = () => (location.href = "../Turma/index.html");
window.Forum = () => (location.href = "../Forum/Fo.html");
window.Inspiracoes = () => (location.href = "../Inspiracoes/Inspiracoes.html");
window.Configuracoes = () => (location.href = "Config.html");
