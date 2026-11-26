import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../../../backend/firebase/config.js";

// --- FUNÇÕES DE NAVEGAÇÃO ---
window.Voltar = () => auth.signOut().then(() => window.location.href = "/pages/Auth/Login/Log-aluno.html");
window.Painel = () => (location.href = "../Turma/index.html");
window.Forum = () => (location.href = "../Forum/Fo.html");
window.Inspiracoes = () => (location.href = "../Inspiracoes/Inspiracoes.html");
window.Configuracoes = () => (location.href = "Config.html");
// Se tiver mais navegações no Aluno, adicione aqui.

let user;
let profile;
const DEFAULT_FONT = "'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif";
let settings = { tipoFonte: DEFAULT_FONT, tamanhoFonte: 16 };

function fontFamily(value) {
  const saved = String(value || DEFAULT_FONT).trim();
  return saved.includes(",") || /['\"]/.test(saved) ? saved : `${JSON.stringify(saved)}, sans-serif`;
}

// A MÁGICA ESTÁ AQUI: Aplica a fonte e o tamanho na raiz (html)
function applySettings() {
  settings.tipoFonte = fontFamily(settings.tipoFonte);
  
  const fontStyle = document.getElementById("dynamic-font-style") || document.createElement("style");
  fontStyle.id = "dynamic-font-style";
  fontStyle.textContent = `* { font-family: ${settings.tipoFonte || DEFAULT_FONT} !important; }`;
  if (!fontStyle.isConnected) document.head.appendChild(fontStyle);
  
  // Usa o documentElement para o tamanho funcionar de forma global
  document.documentElement.style.fontSize = `${Number(settings.tamanhoFonte) || 16}px`;
  
  // Salva também no localStorage para as outras páginas lerem na hora
  localStorage.setItem("fontePreferida", settings.tipoFonte || DEFAULT_FONT);
  localStorage.setItem("tamanhoPreferido", String(Number(settings.tamanhoFonte) || 16));
  
  // Atualiza os botões de fonte na tela
  document.querySelectorAll(".fonte-op").forEach((option) => {
    option.classList.toggle("ativa", normalizeFont(option.dataset.fonte) === normalizeFont(settings.tipoFonte));
  });
  
  // Atualiza os botões de tamanho na tela
  document.querySelectorAll(".size-btn").forEach((button) => {
    button.classList.toggle("ativo", Number(button.getAttribute("onclick")?.match(/\d+/)?.[0]) === Number(settings.tamanhoFonte));
  });
}

function normalizeFont(value = "") {
  return String(value).replace(/[\"']/g, "").replace(/\s+/g, "").toLowerCase();
}

// --- FUNÇÕES CHAMADAS NO HTML ---
window.setFonte = (family, element) => {
  settings.tipoFonte = fontFamily(family);
  applySettings();
  document.querySelectorAll(".fonte-op").forEach((option) => option.classList.remove("ativa"));
  element?.classList.add("ativa");
};

window.aplicarFonteCustom = () => {
  const value = document.getElementById("inp-fonte-custom")?.value.trim();
  if (value) window.setFonte(`${JSON.stringify(value)}, sans-serif`);
};

window.setTamanho = (size, element) => {
  settings.tamanhoFonte = Number(size);
  applySettings();
  document.querySelectorAll(".size-btn").forEach((button) => button.classList.remove("ativo"));
  element?.classList.add("ativo");
};

window.salvarPerfil = async () => {
  const name = document.getElementById("inp-nome")?.value.trim();
  if (!name || !user) return alert("Preencha o nome.");
  try {
    const iniciais = name.split(/\s+/).map((parte) => parte[0]).join("").slice(0, 2).toUpperCase();
    // Salva no Firebase as configurações junto com o nome
    await updateDoc(doc(db, "usuarios", user.uid), { nome: name, iniciais: iniciais, configuracoes: settings });
    alert("Perfil e preferências salvos.");
  } catch (error) {
    console.error(error);
    alert("Não foi possível salvar o perfil.");
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
    alert("Senha alterada com sucesso.");
    ["senha-atual", "senha-nova", "senha-confirmacao"].forEach((id) => { 
        const input = document.getElementById(id); 
        if (input) input.value = ""; 
    });
  } catch (error) {
    console.error(error);
    alert(error.code === "auth/invalid-credential" ? "A senha atual está incorreta." : "Não foi possível alterar a senha.");
  }
};

// --- INICIALIZAÇÃO DO ALUNO ---
window.alunoReady?.then((session) => {
  if (!session) return;
  user = session.user;
  profile = session.profile;
  
  const foto = document.querySelector("#foto span");
  const nome = document.querySelector("#NomeUC h4");
  const curso = document.querySelector("#NomeUC h5");

  if (foto) foto.textContent = profile.iniciais || "";
  if (nome) nome.textContent = profile.nome || "";
  if (curso) curso.textContent = profile.curso || "";

  const nameInput = document.getElementById("inp-nome");
  const emailInput = document.getElementById("inp-email");
  const courseInput = document.getElementById("inp-curso");
  
  if (nameInput) nameInput.value = profile.nome || "";
  if (emailInput) emailInput.value = session.user.email || "";
  if (courseInput) courseInput.value = profile.curso || "";

  // Pega as configurações salvas no Firebase
  settings = { tipoFonte: DEFAULT_FONT, tamanhoFonte: 16, ...(profile.configuracoes || {}) };
  applySettings();

  // Fica ouvindo mudanças (se o aluno mudar pelo Firebase, atualiza na hora)
  onSnapshot(doc(db, "usuarios", user.uid), (snapshot) => { 
    if (snapshot.exists()) { 
      profile = { ...profile, ...snapshot.data() }; 
      settings = { ...(profile.configuracoes || {}) }; 
      
      if (nome) nome.textContent = profile.nome || "";
      if (foto) foto.textContent = profile.iniciais || "";
      
      applySettings(); 
    } 
  });
});
