import { auth, db } from "../../../backend/firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  where,
  addDoc,
  serverTimestamp,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

let dadosAluno = null

// 1. MONITORAMENTO DE SESSÃO E ACESSIBILIDADE
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (userDoc.exists() && userDoc.data().tipo === "aluno") {
      const dadosAluno = userDoc.data(); // Guarda os dados do aluno
      console.log("Aluno autenticado:", user.uid);
      carregarEstadoSistema(user.uid);
    } else {
      alert("Acesso negado: Esta área é exclusiva para alunos.");
      window.location.href = "../auth/Login/Log-aluno.html";
    }
  } else {
    window.location.href = "../auth/Login/Log-aluno.html";
  }
  
  const foto = document.querySelector("#foto span");
  const nome = document.querySelector("#NomeUC h4");
  const curso = document.querySelector("#NomeUC h5");
  if (foto) foto.textContent = dados.iniciais || "";
  if (nome) nome.textContent = dados.nome || "";
  if (curso) curso.textContent = dados.curso || "";

  escutarAvisos(dados.codigoSala || "geral");
});

async function carregarEstadoSistema(uid) {
  const userDocRef = doc(db, "usuarios", uid);

  // Escutar mudanças no perfil (incluindo acessibilidade e cargo)
  onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data();
      aplicarAcessibilidade(userData);
      atualizarInterfacePerfil(userData);
      carregarGruposDinamicamente(userData.codigoSala, userData.uid);
    }
  });
}

// 2. ACESSIBILIDADE (Conforme documento do TCC)
function aplicarAcessibilidade(data) {
  // Aplicar tema, fonte e tamanho de letra salvos no Firebase
  if (data.configuracoes) {
    const { tema, tamanhoFonte, tipoFonte } = data.configuracoes;
    if (tema) document.body.className = tema; // 'dark-mode' ou 'light-mode'
    if (tamanhoFonte)
      document.documentElement.style.fontSize = tamanhoFonte + "px";
    if (tipoFonte) document.body.style.fontFamily = tipoFonte;
  }
}

// 3. INTERFACE DE PERFIL
function atualizarInterfacePerfil(data) {
  const nomeEl = document.querySelector(".Usuario h4");
  const cursoEl = document.querySelector(".Usuario h5");
  const iniciaisEl = document.querySelector("#foto span");
  const fotoContainer = document.querySelector("#foto");
  const tituloTurmaEl = document.querySelector(".T1 h3 span");

  if (nomeEl) nomeEl.textContent = data.nome || "Usuário";
  if (cursoEl) cursoEl.textContent = data.curso || "Sem Curso";
  if (iniciaisEl) iniciaisEl.textContent = data.iniciais || "??";
  if (tituloTurmaEl && data.codigoSala)
    tituloTurmaEl.textContent = data.codigoSala;
}

window.criarGrupo = async function (event) {
  event?.preventDefault();
  const nome = document.getElementById("inp-nome-grupo").value.trim();
  const tema = document.getElementById("inp-tema").value.trim();
  const descricao = document.getElementById("inp-descricao").value.trim();
  const integrantes = document.getElementById("inp-integrantes").value
    .split(",").map((item) => item.trim()).filter(Boolean);
  const orientador = document.getElementById("inp-orientador").value.trim();

  const user = auth.currentUser;
  
  if (!user || !dadosAluno) { //problema 
    alert("Usuário não autenticado. Faça login novamente.");
    return;
  }

  if (!nome || !tema || !descricao || !integrantes.length) {
    alert("Preencha todos os campos");
    return;
  }

  const membro = query(
    collection(db, "grupos"),
    where("membros", "array-contains", user.uid)
  );
  
  const snapshotMembro = await getDocs(membro);

  if (!snapshotMembro.empty) {
    alert("Você já pertence a um grupo! Não é possível criar outro.");
    return;
  }

  const codigoSalaAluno = dadosAluno.codigoSala;

  if (!codigoSalaAluno) {
  alert("Sem código de sala vinculado ao perfil!");
  console.error("Perfil do aluno sem codigoSala vinculado.");
  await auth.signOut();
  window.location.href = "../../auth/Login/Log-aluno.html";
  return;
}

  try {
    await addDoc(collection(db, "grupos"), {
      nome,
      tema,
      descricao: descricao,
      integrantesInformados: integrantes,
      orientador,
      codigoSala: codigoSalaAluno,
      criadorUid: user.uid,
      membros: [user.uid],
      criadoEm: serverTimestamp(),
    });

    document.getElementById("form-criar-grupo").reset();
    fecharModalCriarGrupo();

    alert("Grupo criado com sucesso!");
  } catch (erro) {
    console.error(erro);
    alert("Erro ao criar grupo");
  }
};

window.abrirModalCriarGrupo = () => document.getElementById("modal-criar-grupo").style.display = "flex";
window.fecharModalCriarGrupo = () => document.getElementById("modal-criar-grupo").style.display = "none";

// 4. GESTÃO DE GRUPOS EM TEMPO REAL
async function carregarGruposDinamicamente(codigoSala, userUid) {
  const gruposContainer = document.querySelector(".Grupos");
  const contadorGruposEl = document.getElementById("totalGrupos");
  if (!gruposContainer) return;

  // Query otimizada: Busca grupos da sala específica
  const q = query(
    collection(db, "grupos"),
    where("codigoSala", "==", codigoSala),
  );

  // OUVINTE EM TEMPO REAL: Se o líder mudar algo, todos veem na hora
  onSnapshot(q, (snapshot) => {
    gruposContainer.innerHTML = "";

    if (contadorGruposEl) {
      contadorGruposEl.textContent = snapshot.size; // Mostra a contagem total
    }

    if (snapshot.empty) {
      gruposContainer.innerHTML =
        "<p style='color: white; padding: 20px;'>Nenhum grupo criado</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const grupo = doc.data();
      const eMembro = grupo.membros && grupo.membros.includes(userUid);
      const eLider = grupo.liderUid === userUid;

      const grupoCard = `
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
                        <p>${grupo.membros ? grupo.membros.length : 0} membro(s)</p>
                    </div>
                </div>
            </div>
        </div>
        `;
      gruposContainer.innerHTML += grupoCard;
    });
  });
}
