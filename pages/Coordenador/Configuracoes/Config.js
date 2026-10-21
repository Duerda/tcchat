import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../../../backend/firebase/config.js";
import { fillHeader, getInitials, logout, requireProfessor } from "../../../backend/firebase/professor.js";

let user;
let profile;
let settings = { tipoFonte: "DM Sans", tamanhoFonte: 16 };

window.Voltar = logout;
window.Painel = () => (window.location.href = "../Coord-Index.html");
window.Usuarios = () => (window.location.href = "../Coord-Usuarios.html");
window.GruposCoord = () => (window.location.href = "../Coord-Grupos.html");
window.Biblioteca = () => (window.location.href = "../Biblioteca/Bib.html");
window.Forum = () => (window.location.href = "../Coord-Forum.html");
window.Configuracoes = () => (window.location.href = "Config.html");

function applySettings() {
  document.body.style.fontFamily = `'${settings.tipoFonte || "DM Sans"}', sans-serif`;
  document.documentElement.style.fontSize = `${Number(settings.tamanhoFonte) || 16}px`;
  document.querySelectorAll(".fonte-op").forEach((option) => {
    option.classList.toggle("ativa", option.textContent.toLowerCase().includes(String(settings.tipoFonte).toLowerCase()));
  });
  document.querySelectorAll(".size-btn").forEach((button) => {
    const value = Number(button.getAttribute("onclick")?.match(/\d+/)?.[0]);
    button.classList.toggle("ativo", value === Number(settings.tamanhoFonte));
  });
}

window.setFonte = (name, element) => {
  settings.tipoFonte = name;
  applySettings();
  if (element) element.classList.add("ativa");
};
window.aplicarFonteCustom = () => {
  const value = document.getElementById("inp-fonte-custom")?.value.trim();
  if (!value) return;
  settings.tipoFonte = value;
  applySettings();
  const preview = document.getElementById("fonte-preview");
  if (preview) {
    preview.style.display = "block";
    preview.style.fontFamily = `'${value}', sans-serif`;
    preview.textContent = "O rato roeu a roupa do rei de Roma. 0123456789.";
  }
};
window.setTamanho = (size, element) => {
  settings.tamanhoFonte = Number(size);
  applySettings();
  element?.classList.add("ativo");
};

window.salvarPerfil = async () => {
  const name = document.getElementById("inp-nome")?.value.trim();
  if (!name || !user) return alert("Preencha o nome.");
  try {
    await updateDoc(doc(db, "usuarios", user.uid), { nome: name, iniciais: getInitials(name), configuracoes: settings });
    profile = { ...profile, nome: name, iniciais: getInitials(name), configuracoes: settings };
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
  if (!current || !next || next !== confirmation || next.length < 8) return alert("Informe a senha atual e uma nova senha de pelo menos 8 caracteres, repetida corretamente.");
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

requireProfessor((authenticatedUser, currentProfile) => {
  user = authenticatedUser;
  profile = currentProfile;
  settings = { tipoFonte: "DM Sans", tamanhoFonte: 16, ...(profile.configuracoes || {}) };
  fillHeader(profile);
  document.getElementById("inp-nome").value = profile.nome || "";
  document.getElementById("inp-email").value = profile.email || user.email || "";
  document.getElementById("inp-curso").value = profile.curso || "";
  applySettings();
});
