import { auth, db } from "../../backend/firebase/config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

window.Painel = () => location.href = "../Turma/index.html";
let alunoTemGrupo = false;
const botoesMeuGrupo = [...document.querySelectorAll("#Grupo-btn, button")]
  .filter((botao) => botao.textContent.trim().toLowerCase() === "meu grupo");
const estiloBloqueado = document.createElement("style");
estiloBloqueado.textContent = '.VGABF button:disabled { opacity: .45; cursor: not-allowed; transform: none; }';
document.head.append(estiloBloqueado);
botoesMeuGrupo.forEach((botao) => {
  botao.disabled = true;
  botao.title = "Crie um grupo no Painel para liberar esta área.";
  botao.setAttribute("aria-disabled", "true");
});

window.MeuGrupo = () => {
  if (!alunoTemGrupo) {
    alert("Crie um grupo no Painel antes de acessar Meu Grupo.");
    return;
  }
  location.href = "../Grupos/gp.chat.html";
};

auth.onAuthStateChanged(async (user) => {
  if (!user) return;
  try {
    const grupos = await getDocs(query(collection(db, "grupos"), where("membros", "array-contains", user.uid)));
    alunoTemGrupo = !grupos.empty;
    botoesMeuGrupo.forEach((botao) => {
      botao.disabled = !alunoTemGrupo;
      botao.title = alunoTemGrupo ? "Acesse o chat e os recursos do seu grupo." : "Crie um grupo no Painel para liberar esta área.";
      botao.setAttribute("aria-disabled", String(!alunoTemGrupo));
    });
  } catch (error) {
    console.error("Não foi possível verificar se o aluno já tem grupo:", error);
  }
});
window.Forum = () => location.href = "../Forum/Fo.html";
window.Inspiracoes = () => location.href = "../Inspiracoes/Inspiracoes.html";
window.Configuracoes = () => location.href = "../Configuracoes/Config.html";
window.Voltar = async () => {
  try { await auth.signOut(); }
  finally { location.href = "../../auth/Login/Log-aluno.html"; }
};
