import { auth, db } from "../../backend/firebase/config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const LOGIN = "/pages/auth/Login/Log-aluno.html";
let resolverAluno;
window.alunoReady = new Promise((resolve) => { resolverAluno = resolve; });

window.Painel = () => (location.href = "/pages/Aluno/Turma/index.html");
window.Forum = () => (location.href = "/pages/Aluno/Forum/Fo.html");
window.Avisos = () => (location.href = "/pages/Aluno/Forum/av.html");
window.Atividades = () => (location.href = "/pages/Aluno/Grupos/gp.ativ.html");
window.Biblioteca = () => (location.href = "/pages/Aluno/Grupos/gp.link.html");
window.Inspiracoes = () => (location.href = "/pages/Aluno/Inspiracoes/Inspiracoes.html");
window.Configuracoes = () => (location.href = "/pages/Aluno/Configuracoes/Config.html");
window.Voltar = async () => {
  try { await signOut(auth); }
  finally { location.href = LOGIN; }
};
window.MeuGrupo = async () => {
  const sessao = await window.alunoReady;
  if (!sessao) return;
  try {
    const grupos = await getDocs(query(collection(db, "grupos"), where("membros", "array-contains", sessao.user.uid)));
    if (grupos.empty) {
      alert("Seu grupo ainda não foi criado ou você ainda não foi associado a ele.");
      return;
    }
    location.href = "/pages/Aluno/Grupos/gp.chat.html";
  } catch (error) {
    console.error("Erro ao verificar o grupo do aluno:", error);
    alert("Não foi possível verificar seu grupo. Tente novamente.");
  }
};

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    resolverAluno(null);
    location.href = LOGIN;
    return;
  }
  try {
    const users = await getDocs(query(collection(db, "usuarios"), where("uid", "==", user.uid)));
    const profile = users.docs[0]?.data();
    if (!profile || profile.tipo !== "aluno") {
      resolverAluno(null);
      alert("Acesso permitido somente para contas de aluno.");
      location.href = LOGIN;
      return;
    }
    const session = { user, profile };
    window.perfilAluno = profile;
    [
      [".Usuario h4", profile.nome || "Usuário"],
      [".Usuario h5", profile.curso || profile.codigoSala || "Sem curso"],
      ["#foto span", profile.iniciais || ""],
    ].forEach(([selector, value]) => {
      const element = document.querySelector(selector);
      if (element) element.textContent = value;
    });
    if (profile.configuracoes) {
      const { tema, tamanhoFonte, tipoFonte } = profile.configuracoes;
      if (tema) {
        document.body.classList.remove("dark-mode", "light-mode");
        document.body.classList.add(tema);
      }
      if (tamanhoFonte) document.documentElement.style.fontSize = `${tamanhoFonte}px`;
      if (tipoFonte) document.body.style.fontFamily = tipoFonte;
    }
    document.body.classList.add("pronto");
    resolverAluno(session);
    const myGroupButtons = [...document.querySelectorAll("button")].filter((button) => button.textContent.trim().toLowerCase() === "meu grupo");
    const groups = await getDocs(query(collection(db, "grupos"), where("membros", "array-contains", user.uid)));
    myGroupButtons.forEach((button) => {
      button.disabled = groups.empty;
      button.title = groups.empty ? "Aguarde a associação do coordenador ao seu grupo." : "Acesse o chat e os recursos do grupo.";
    });
  } catch (error) {
    console.error("Erro ao carregar a sessão do aluno:", error);
    resolverAluno(null);
    document.body.classList.add("pronto");
  }
});
