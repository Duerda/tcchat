import { getIdToken, onAuthStateChanged, reload, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { auth, db } from "./config.js";
import { appUrl, navigate } from "../navigation.js";

export const LOGIN_PATH = appUrl("pages/auth/Login/Log-aluno.html");
export const PROFESSOR_TYPES = new Set(["professor", "coordenador"]);

export { appUrl, navigate };

export function redirectLogin() {
  window.location.href = LOGIN_PATH;
}

export function logout() {
  return signOut(auth).finally(redirectLogin);
}

export async function getProfile(uid) {
  const snapshot = await getDoc(doc(db, "usuarios", uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

function applyProfileAppearance(profile) {
  const settings = profile.configuracoes || {};
  if (typeof settings.tipoFonte === "string" && settings.tipoFonte.trim()) {
    const savedFont = settings.tipoFonte.trim();
    const fontFamily = savedFont.includes(",") || /['\"]/.test(savedFont)
      ? savedFont
      : `${JSON.stringify(savedFont)}, sans-serif`;
    const style = document.getElementById("dynamic-font-style") || document.createElement("style");
    style.id = "dynamic-font-style";
    style.textContent = `* { font-family: ${fontFamily} !important; }`;
    if (!style.isConnected) document.head.appendChild(style);
  }

  const size = [14, 16, 18].includes(Number(settings.tamanhoFonte)) ? Number(settings.tamanhoFonte) : 16;
  const scale = size / 16;
  const resizeTree = (root) => {
    const elements = root.nodeType === Node.ELEMENT_NODE
      ? [root, ...root.querySelectorAll("*")]
      : [...(root.querySelectorAll?.("*") || [])];
    elements.forEach((element) => {
    if (["SCRIPT", "STYLE", "SVG", "PATH"].includes(element.tagName)) return;
    if (!element.dataset.originalFontSize) {
      element.dataset.originalFontSize = getComputedStyle(element).fontSize;
    }
    const originalSize = Number.parseFloat(element.dataset.originalFontSize);
    if (originalSize > 0) element.style.fontSize = `${originalSize * scale}px`;
    });
  };
  resizeTree(document.body);
  window.__tcchatTextScaleObserver?.disconnect();
  window.__tcchatTextScaleObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(resizeTree));
  });
  window.__tcchatTextScaleObserver.observe(document.body, { childList: true, subtree: true });
}

export function watchProfile(uid, callback) {
  return onSnapshot(doc(db, "usuarios", uid), (snapshot) => {
    if (snapshot.exists()) callback({ id: snapshot.id, ...snapshot.data() });
  });
}

function showRoleValidationError(step, error) {
  const detail = error?.code || error?.message || "nenhuma sessão ativa encontrada";
  const banner = document.createElement("div");
  banner.setAttribute("role", "alert");
  banner.style.cssText = "position:fixed;z-index:99999;top:12px;left:12px;right:12px;padding:14px 18px;background:#3b1118;color:#fff;border:1px solid #ef4444;border-radius:8px;font:14px/1.5 system-ui,sans-serif;box-shadow:0 8px 24px #0008";
  const message = document.createElement("span");
  message.textContent = `Falha ao validar o acesso (${step}): ${detail}. `;
  const login = document.createElement("a");
  login.href = LOGIN_PATH;
  login.textContent = "Voltar ao login";
  login.style.cssText = "color:#fff;text-decoration:underline;margin-left:6px";
  banner.append(message, login);
  document.body.prepend(banner);
}

export function requireRole(allowedTypes, callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      return redirectLogin();
    }
    let validationStep = "renovar a sessão de acesso";
    try {
      // Atualiza o estado do usuário para reconhecer uma confirmação de e-mail
      // feita depois da sessão anterior. O Firestore também valida o token.
      await reload(user);
      if (!user.emailVerified) {
        await signOut(auth);
        alert("Confirme seu e-mail antes de acessar o TCCHAT. Entre novamente para receber outro link de verificação.");
        return redirectLogin();
      }
      await getIdToken(user);
      validationStep = "carregar o perfil no Firestore";
      const profile = await getProfile(user.uid);
      const accessRevoked = profile?.acessoAtivo === false || profile?.acessoAtivo === "false";
      if (!profile || !allowedTypes.has(profile.tipo) || accessRevoked) {
        await signOut(auth);
        alert("Acesso negado: seu perfil não tem permissão para esta área ou está inativo.");
        return redirectLogin();
      }
      validationStep = "aplicar as preferências do perfil";
      applyProfileAppearance(profile);
      validationStep = "iniciar a página";
      await callback(user, profile);
    } catch (error) {
      console.error("Não foi possível carregar o perfil:", error);
      showRoleValidationError(validationStep, error);
    }
  });
}

export function requireProfessor(callback) {
  return requireRole(PROFESSOR_TYPES, callback);
}

export function requireCoordinator(callback) {
  return requireRole(new Set(["coordenador"]), callback);
}

export function requireStudent(callback) {
  return requireRole(new Set(["aluno"]), callback);
}

export function fillHeader(profile) {
  const initials = document.querySelector("#foto span");
  const name = document.querySelector("#NomeUC h4");
  const course = document.querySelector("#NomeUC h5");
  if (initials) initials.textContent = profile.iniciais || getInitials(profile.nome);
  if (name) name.textContent = profile.nome || "";
  if (course) course.textContent = profile.curso || profile.codigoSala || "Professor";
}

export function getInitials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export async function updateProfile(uid, values) {
  await updateDoc(doc(db, "usuarios", uid), values);
}

export { auth, db, doc, getDoc, onSnapshot, updateDoc };
