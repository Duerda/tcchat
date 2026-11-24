import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "../../../backend/firebase/config.js";
import { fillHeader, getInitials, logout, navigate, requireProfessor } from "../../../backend/firebase/professor.js";

window.Voltar = logout;
window.Avaliacoes = () => navigate("../Avaliacoes/ava.html");
window.Biblioteca = () => navigate("../Biblioteca/Bib.html");
window.VisaoGeral = () => navigate("../Index.html");
window.Forum = () => navigate("../Forum/Avisos.html");
window.Grupos = () => navigate("../Grupos/grp.html");
window.Configuracoes = () => navigate("Config.html");

let user;
let profile;
let settings = {};

function applySettings() {
  if (settings.tipoFonte) document.body.style.fontFamily = `'${settings.tipoFonte}', sans-serif`;
  if (settings.tamanhoFonte) document.body.style.fontSize = `${settings.tamanhoFonte}px`;
}

window.setFonte = (name, element) => {
  settings.tipoFonte = name;
  document.body.style.fontFamily = `'${name}', sans-serif`;
  document.querySelectorAll(".fonte-op").forEach((option) => option.classList.remove("ativa"));
  element?.classList.add("ativa");
};
window.aplicarFonteCustom = () => {
  const value = document.getElementById("inp-fonte-custom")?.value.trim();
  if (value) window.setFonte(value);
};
window.setTamanho = (size, element) => {
  settings.tamanhoFonte = size;
  document.body.style.fontSize = `${size}px`;
  document.querySelectorAll(".size-btn").forEach((button) => button.classList.remove("ativo"));
  element?.classList.add("ativo");
};

window.salvarPerfil = async () => {
  const name = document.getElementById("inp-nome")?.value.trim();
  if (!name || !user) return alert("Preencha o nome.");
  try {
    await updateDoc(doc(db, "usuarios", user.uid), { nome: name, iniciais: getInitials(name), configuracoes: settings });
    alert("Perfil e preferências salvos no Firestore.");
  } catch (error) {
    console.error(error);
    alert("Não foi possível salvar o perfil.");
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
    alert("Senha alterada com sucesso.");
    ["senha-atual", "senha-nova", "senha-confirmacao"].forEach((id) => { const input = document.getElementById(id); if (input) input.value = ""; });
  } catch (error) {
    console.error(error);
    alert(error.code === "auth/invalid-credential" ? "A senha atual está incorreta." : "Não foi possível alterar a senha.");
  }
};

requireProfessor((authenticatedUser, currentProfile) => {
  user = authenticatedUser;
  profile = currentProfile;
  fillHeader(profile);
  settings = { ...(profile.configuracoes || {}) };
  const name = document.getElementById("inp-nome");
  const email = document.getElementById("inp-email");
  const course = document.getElementById("inp-curso");
  if (name) name.value = profile.nome || "";
  if (email) email.value = profile.email || user.email || "";
  if (course) course.value = profile.curso || "";
  applySettings();
  onSnapshot(doc(db, "usuarios", user.uid), (snapshot) => { if (snapshot.exists()) { profile = { ...profile, ...snapshot.data() }; settings = { ...(profile.configuracoes || {}) }; fillHeader(profile); applySettings(); } });
});

function aplicarFonteGlobal(fonte) {
    let styleTag = document.getElementById('dynamic-font-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-font-style';
        document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `* { font-family: ${fonte} !important; }`;
}

window.setFonte = function(fontFamily, elemento) {
    localStorage.setItem('fontePreferida', fontFamily);
    aplicarFonteGlobal(fontFamily);

    document.querySelectorAll('.fonte-op').forEach(op => op.classList.remove('ativa'));
    if (elemento) elemento.classList.add('ativa');
    
    document.getElementById('fonte-preview').style.display = 'none';
};

window.aplicarFonteCustom = function() {
    const input = document.getElementById('inp-fonte-custom');
    const fonte = input.value.trim();
    
    if (!fonte) {
        alert("Por favor, digite o nome de uma fonte.");
        return;
    }

    localStorage.setItem('fontePreferida', fonte);
    aplicarFonteGlobal(fonte);

    const preview = document.getElementById('fonte-preview');
    preview.style.display = 'block';
    preview.style.fontFamily = fonte;
    preview.innerHTML = `Exemplo de texto usando a fonte: <strong>${fonte}</strong>`;

    document.querySelectorAll('.fonte-op').forEach(op => op.classList.remove('ativa'));
};

// NOVA FUNÇÃO DE TAMANHO (SEM DAR ZOOM NA TELA TODA)
function aplicarTamanhoGlobal(tamanho) {
    let fator = tamanho / 16; // 16 é o tamanho normal

    document.querySelectorAll('*').forEach(el => {
        if (['SCRIPT', 'STYLE', 'SVG', 'PATH'].includes(el.tagName)) return;

        // Salva o tamanho original antes de mudar
        if (!el.dataset.originalFontSize) {
            el.dataset.originalFontSize = window.getComputedStyle(el).fontSize;
        }
        
        let tamanhoOriginal = parseFloat(el.dataset.originalFontSize);
        if (tamanhoOriginal > 0) {
            el.style.fontSize = (tamanhoOriginal * fator) + 'px';
        }
    });
}

window.setTamanho = function(tamanho, elemento) {
    aplicarTamanhoGlobal(tamanho);
    localStorage.setItem('tamanhoPreferido', tamanho);

    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('ativo'));
    if (elemento) elemento.classList.add('ativo');
};

document.addEventListener('DOMContentLoaded', () => {
    const fonteSalva = localStorage.getItem('fontePreferida');
    if (fonteSalva) aplicarFonteGlobal(fonteSalva);

    const tamanhoSalvo = localStorage.getItem('tamanhoPreferido');
    if (tamanhoSalvo) {
        aplicarTamanhoGlobal(tamanhoSalvo);
        // Marca o botão correto como ativo ao carregar
        const botoes = document.querySelectorAll('.size-btn');
        botoes.forEach(btn => {
            if (btn.getAttribute('onclick').includes(tamanhoSalvo)) {
                btn.classList.add('ativo');
            } else {
                btn.classList.remove('ativo');
            }
        });
    }
});