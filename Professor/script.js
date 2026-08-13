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
  where,
  addDoc,
  serverTimestamp,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

window.Voltar = function(){
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
};
window.Avaliacoes = function(){
    window.location.href = "/Professor/Avaliacoes/ava.html";
};
window.Biblioteca = function(){
    window.location.href = "/Professor/Biblioteca/Bib.html";
};
window.Grupos = function(){
    window.location.href = "/Professor/Grupos/grp.html";
};
window.Forum = function(){
    window.location.href = "/Professor/Forum/Avisos.html";
};
window.Configuracoes = function(){
    window.location.href = "/Professor/Configuracoes/Config.html";
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const codigoSala = localStorage.getItem("codigoCurso");
    carregarGruposDinamicamente(codigoSala, user.uid);
  }
});

async function carregarGruposDinamicamente(codigoSala, userUid) {
  const gruposContainer = document.querySelector(".Grupos");
  const contadorGruposEl = document.getElementById("gruposOrientados");
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
    "<p>0</p>";
  return;
}

    snapshot.forEach((doc) => {
        const numeroGrupo = index + 1;
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

document.addEventListener('DOMContentLoaded', function() {
    const spanIniciais = document.getElementById("foto").querySelector("span"); // Seleciona o span dentro de #foto
    const iniciaisSalvas = localStorage.getItem("iniciaisUsuario");
    spanIniciais.textContent = iniciaisSalvas || ""; // Define o texto ou vazio
});
document.addEventListener('DOMContentLoaded', function() {
    const spanIniciais = document.getElementById("NomeUC").querySelector("h4"); // Seleciona o span dentro de #foto
    const nomeUsuario = localStorage.getItem("nomeUsuario");
    spanIniciais.textContent = nomeUsuario || ""; // Define o texto ou vazio
});


document.addEventListener('DOMContentLoaded', function() {
    let nomeCurso = document.getElementById("NomeUC").querySelector("h5");

    let codigoSalvo = localStorage.getItem("codigoCurso");

    let cursos = {
        "TMA": "Técnico em Meio Ambiente",
        "DS": "Desenvolvimento de Sistemas",
        "ADM": "Administração",
        "SRC": "Secretariado",
        "TDS": "Técnico de Design de Interiores"
    };
    nomeCurso.textContent = cursos[codigoSalvo] || "";
});

