import { navigate } from "../../backend/navigation.js";
import { logout, requireStudent } from "../../backend/firebase/professor.js";
import { aplicarAparenciaAluno } from "./aparencia.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../backend/firebase/config.js";

let resolverAluno;
window.alunoReady = new Promise((resolve) => { resolverAluno = resolve; });

window.Painel = () => navigate("/pages/Aluno/Turma/index.html");
window.Forum = () => navigate("/pages/Aluno/Forum/Fo.html");
window.Avisos = () => navigate("/pages/Aluno/Forum/av.html");
window.Atividades = () => navigate("/pages/Aluno/Grupos/gp.ativ.html");
window.Biblioteca = () => navigate("/pages/Aluno/Grupos/gp.link.html");
window.Inspiracoes = () => navigate("/pages/Aluno/Inspiracoes/Inspiracoes.html");
window.Configuracoes = () => navigate("/pages/Aluno/Configuracoes/Config.html");
window.Voltar = logout;
window.MeuGrupo = async () => {
  const sessao = await window.alunoReady;
  if (!sessao) return;
  try {
    const grupos = await getDocs(query(collection(db, "grupos"), where("membros", "array-contains", sessao.user.uid)));
    if (grupos.empty) {
      alert("Seu grupo ainda não foi criado ou você ainda não foi associado a ele.");
      return;
    }
    navigate("/pages/Aluno/Grupos/gp.chat.html");
  } catch (error) {
    console.error("Erro ao verificar o grupo do aluno:", error);
    alert("Não foi possível verificar seu grupo. Tente novamente.");
  }
};

requireStudent(async (user, profile) => {
  try {
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
      aplicarAparenciaAluno(profile.configuracoes);
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
