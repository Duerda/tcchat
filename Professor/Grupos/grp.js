import { auth, db } from "../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Funções de Navegação
window.Voltar = () =>
  auth
    .signOut()
    .then(() => (window.location.href = "/Inicial-tela/Login/Log-aluno.html"));
window.VisaoGeral = () => (window.location.href = "/Professor/Index.html");
window.Biblioteca = () =>
  (window.location.href = "/Professor/Biblioteca/Bib.html");
window.Avaliacoes = () =>
  (window.location.href = "/Professor/Avaliacoes/ava.html");
window.Grupos = () => (window.location.href = "/Professor/Grupos/grp.html");
window.Forum = () => (window.location.href = "/Professor/Forum/Avisos.html");
window.Configuracoes = () => alert("Configurações de acessibilidade em breve!");

let usuarioAtual = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    const tipo = userDoc.exists() ? userDoc.data().tipo : null;
    if (tipo === "professor" || tipo === "coordenador") {
      usuarioAtual = user;
    } else {
      alert(
        "Acesso negado: Esta área é exclusiva para professores e coordenadores.",
      );
      window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
  } else {
    window.location.href = "/Inicial-tela/Login/Log-aluno.html";
  }
});

function carregarGrupos() {
  const listaGrupos = document.getElementById("listaGrupos");

  const q = query(collection(db, "grupos"));

  onSnapshot(q, (snapshot) => {
    listaGrupos.innerHTML = "";
    snapshot.forEach((doc) => {
      const grupo = doc.data();
      const div = document.createElement("div");

      div.innerHTML = `
            <div class="GT">

                <div class="sub-title-gp">

                    <div style="display: flex; gap: 220px;">
                        <h3>${grupo.codigoSala}</h3>
                        <h1>Grupo</h1>
                    </div>

                    <h2>${grupo.nome}</h2>

                    <p>${grupo.descricao}</p>

                    <div class="GT-int">

                        <hr class="linha-decorativa">

                        <div style="display: flex;">
                            <div class="BL"></div>
                            <p>Grupo ainda sem membros</p>
                        </div>

                    </div>

                    <button class="btnEditar" data-id="${doc.id}">
                        Editar
                    </button>

                    <button class="btnExcluir" data-id="${doc.id}">
                        Excluir
                    </button>

                </div>

            </div>
      `;

      listaGrupos.appendChild(div);
    });
  });
}

carregarGrupos();

async function excluirGrupo(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este grupo?");

  if (!confirmar) {
    return;
  }

  try {
    await deleteDoc(doc(db, "grupos", id));

    alert("Grupo excluído com sucesso!");
  } catch (erro) {
    console.error("Erro ao excluir:", erro);
    alert("Erro ao excluir o grupo.");
  }
}


async function editarGrupo(id) {
  const grupoRef = doc(db, "grupos", id);
  
  try {
    const grupoDoc = await getDoc(grupoRef);
    
    if (!grupoDoc.exists()) {
      alert("Grupo não encontrado.");
      return;
    }
    
    const grupo = grupoDoc.data();
    
    const novoNome = prompt("Nome do grupo:", grupo.nome);
    
    if (novoNome === null) {
      return;
    }
    
    const novaDescricao = prompt("Descrição do grupo:", grupo.descricao);
    
    if (novaDescricao === null) {
      return;
    }
    
    await updateDoc(grupoRef, {
      nome: novoNome,
      descricao: novaDescricao,
    });
    
    alert("Grupo atualizado com sucesso!");
  } catch (erro) {
    console.error("Erro ao editar grupo:", erro);
    
    alert("Erro ao editar o grupo.");
  }
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("btnExcluir")) {
    const id = event.target.dataset.id;

    excluirGrupo(id);
  }

  if (event.target.classList.contains("btnEditar")) {

    const id = event.target.dataset.id;

    editarGrupo(id);
    }
});
document.addEventListener("DOMContentLoaded", function () {
  const spanIniciais = document.getElementById("foto").querySelector("span"); // Seleciona o span dentro de #foto
  const iniciaisSalvas = localStorage.getItem("iniciaisUsuario");
  spanIniciais.textContent = iniciaisSalvas || ""; // Define o texto ou vazio
});
document.addEventListener("DOMContentLoaded", function () {
  const spanIniciais = document.getElementById("NomeUC").querySelector("h4"); // Seleciona o span dentro de #foto
  const nomeUsuario = localStorage.getItem("nomeUsuario");
  spanIniciais.textContent = nomeUsuario || ""; // Define o texto ou vazio
});
