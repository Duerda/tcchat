import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../backend/firebase/config.js";
import { fillHeader, getInitials, logout, navigate, requireCoordinator } from "../../backend/firebase/professor.js";

let user;
let profile;
const DEFAULT_FONT = "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif";
let settings = { tipoFonte: DEFAULT_FONT, tamanhoFonte: 16 };

window.Voltar = logout;
window.Painel = () => navigate("Coord-Index.html");
window.Usuarios = () => navigate("Coord-Usuarios.html");
window.GruposCoord = () => navigate("Coord-Grupos.html");
window.Biblioteca = () => navigate("Coord-Biblioteca.html");
window.Forum = () => navigate("Coord-Forum.html");
window.Configuracoes = () => navigate("Config.html");

function fontFamily(value) {
  const saved = String(value || DEFAULT_FONT).trim();
  return saved.includes(",") || /['\"]/.test(saved) ? saved : `${JSON.stringify(saved)}, sans-serif`;
}

function applySettings() {
  settings.tipoFonte = fontFamily(settings.tipoFonte);
  const fontStyle = document.getElementById("dynamic-font-style") || document.createElement("style");
  fontStyle.id = "dynamic-font-style";
  fontStyle.textContent = `* { font-family: ${settings.tipoFonte || DEFAULT_FONT} !important; }`;
  if (!fontStyle.isConnected) document.head.appendChild(fontStyle);
  document.documentElement.style.fontSize = `${Number(settings.tamanhoFonte) || 16}px`;
  localStorage.setItem("fontePreferida", settings.tipoFonte || DEFAULT_FONT);
  localStorage.setItem("tamanhoPreferido", String(Number(settings.tamanhoFonte) || 16));
  document.querySelectorAll(".fonte-op").forEach((option) => {
    option.classList.toggle("ativa", normalizeFont(option.dataset.fonte) === normalizeFont(settings.tipoFonte));
  });
  document.querySelectorAll(".size-btn").forEach((button) => {
    const value = Number(button.getAttribute("onclick")?.match(/\d+/)?.[0]);
    button.classList.toggle("ativo", value === Number(settings.tamanhoFonte));
  });
}

function normalizeFont(value = "") {
  return String(value).replace(/[\"']/g, "").replace(/\s+/g, "").toLowerCase();
}

// Troca de fonte
window.setFonte = function (familia, el) {
    settings.tipoFonte = fontFamily(familia);
    applySettings();
    document.querySelectorAll(".fonte-op").forEach((option) => option.classList.remove("ativa"));
    el?.classList.add("ativa");
};

window.aplicarFonteCustom = function () {
    const v = document.getElementById("inp-fonte-custom").value.trim();
    if (!v) return;

    settings.tipoFonte = `${JSON.stringify(v)}, sans-serif`;
    applySettings();
    const preview = document.getElementById("fonte-preview");
    preview.style.display = "block";
    preview.style.fontFamily = settings.tipoFonte;
    preview.textContent = "O rato roeu a roupa do rei de Roma. 0123456789.";
};

// Tamanho do texto
window.setTamanho = function (tam, el) {
    settings.tamanhoFonte = Number(tam);
    applySettings();
    el?.classList.add("ativo");
};

// Salva o nome no Firestore, para que a sidebar (Coord-script.js) também seja atualizada
window.salvarPerfil = async function () {
  const name = document.getElementById("inp-nome")?.value.trim();
  if (!name || !user) return alert("Preencha o nome.");
  try {
    const initials = getInitials(name);
    await updateDoc(doc(db, "usuarios", user.uid), { nome: name, iniciais: initials, configuracoes: settings });
    profile = { ...profile, nome: name, iniciais: initials, configuracoes: settings };
    fillHeader(profile);
    alert("Perfil e preferências salvos.");
  } catch (error) {
    console.error("Não foi possível salvar as configurações:", error);
    alert("Não foi possível salvar as alterações.");
  }
};

window.alterarSenha = async () => {
  const current = document.getElementById("senha-atual")?.value;
  const next = document.getElementById("senha-nova")?.value;
  const confirmation = document.getElementById("senha-confirmacao")?.value;
  if (!current || !next || next !== confirmation || next.length < 8) {
    return alert("Informe a senha atual e uma nova senha de pelo menos 8 caracteres, repetida corretamente.");
  }
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
    await updatePassword(user, next);
    ["senha-atual", "senha-nova", "senha-confirmacao"].forEach((id) => { document.getElementById(id).value = ""; });
    alert("Senha alterada com sucesso.");
  } catch (error) {
    console.error("Não foi possível alterar a senha:", error);
    alert(error.code === "auth/invalid-credential" ? "A senha atual está incorreta." : "Não foi possível alterar a senha.");
  }
};

requireCoordinator((authenticatedUser, currentProfile) => {
  user = authenticatedUser;
  profile = currentProfile;
  settings = { tipoFonte: DEFAULT_FONT, tamanhoFonte: 16, ...(profile.configuracoes || {}) };
  fillHeader(profile);
  document.getElementById("inp-nome").value = profile.nome || "";
  document.getElementById("inp-email").value = profile.email || user.email || "";
  document.getElementById("inp-curso").value = profile.curso || "";
  applySettings();
});
