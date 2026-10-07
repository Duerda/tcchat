import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import { auth, db } from "/backend/firebase/config.js";

window.Voltar = () => {

  auth
    .signOut()
    .then(() => {

      window.location.href =
        "/pages/auth/Login/Log-aluno.html";

    });

};


window.VisaoGeral = () => {

  window.location.href =
    "/pages/Professor/Index.html";

};


window.Biblioteca = () => {

  window.location.href =
    "/pages/Professor/Biblioteca/Bib.html";

};


window.Avaliacoes = () => {

  window.location.href =
    "/pages/Professor/Avaliacoes/ava.html";

};


window.Grupos = () => {

  window.location.href =
    "grp.html";

};


window.Forum = () => {

  window.location.href =
    "/pages/Professor/Forum/Avisos.html";

};


window.Configuracoes = () => {

  window.location.href =
    "/pages/Professor/Configuracoes/Config.html";

};


let usuarioAtual = null;

onAuthStateChanged(
  auth,
  async (user) => {

    if (user) {

      const userDoc =
        await getDoc(
          doc(db, "usuarios", user.uid)
        );


      const tipo =
        userDoc.exists()
          ? userDoc.data().tipo
          : null;


      if (
        tipo === "professor" ||
        tipo === "coordenador"
      ) {

        usuarioAtual = user;

      } else {

        alert(
          "Acesso negado: Esta área é exclusiva para professores e coordenadores."
        );


        window.location.href =
          "/pages/auth/Login/Log-aluno.html";

      }


    } else {

      window.location.href =
        "/pages/auth/Login/Log-aluno.html";

    }

  }
);


document.addEventListener(
  "DOMContentLoaded",
  () => {

    const listaGrupos =
      document.getElementById(
        "listaGrupos"
      );


    if (!listaGrupos) {
      return;
    }


    listaGrupos.addEventListener(
      "click",
      (e) => {

        // Procura se clicou no botão Editar

        const btnEditar =
          e.target.closest(
            ".btnEditar"
          );


        // Procura se clicou no botão Excluir

        const btnExcluir =
          e.target.closest(
            ".btnExcluir"
          );


        // Procura o card inteiro

        const grupoCard =
          e.target.closest(
            ".GT"
          );



        if (
          grupoCard &&
          !btnEditar &&
          !btnExcluir
        ) {

          const id =
            grupoCard.dataset.id;


          if (id) {

            window.location.href =
              `grupo-detalhes.html?id=${encodeURIComponent(id)}`;

          }


          return;

        }


        if (btnEditar) {

          const id =
            btnEditar.dataset.id;


          editarGrupo(id);

          return;

        }


        if (btnExcluir) {

          const id =
            btnExcluir.dataset.id;


          excluirGrupo(id);

          return;

        }

      }
    );

  }
);

function carregarGrupos() {

  const listaGrupos =
    document.getElementById(
      "listaGrupos"
    );


  if (!listaGrupos) {
    return;
  }


  const q =
    query(
      collection(db, "grupos")
    );


  onSnapshot(
    q,
    (snapshot) => {

      listaGrupos.innerHTML = "";


      snapshot.forEach(
        (grupoDoc) => {

          const grupo =
            grupoDoc.data();


          const div =
            document.createElement(
              "div"
            );


          div.innerHTML = `

            <div
              class="GT"
              data-id="${grupoDoc.id}"
            >

              <div class="sub-title-gp">


                <div
                  style="
                    display: flex;
                    gap: 220px;
                  "
                >

                  <h3>
                    ${grupo.codigoSala || ""}
                  </h3>


                  <h1>
                    Grupo
                  </h1>

                </div>


                <h2>
                  ${grupo.nome || "Sem nome"}
                </h2>


                <p>
                  ${grupo.descricao || ""}
                </p>


                <div class="GT-int">


                  <hr
                    class="linha-decorativa"
                  />


                  <div
                    style="
                      display: flex;
                    "
                  >

                    <div
                      class="BL"
                    ></div>


                    <p>
                      Grupo ainda sem membros
                    </p>

                  </div>


                </div>


                <button
                  class="btnEditar"
                  data-id="${grupoDoc.id}"
                >
                  Editar
                </button>


                <button
                  class="btnExcluir"
                  data-id="${grupoDoc.id}"
                >
                  Excluir
                </button>


              </div>

            </div>

          `;


          listaGrupos.appendChild(
            div
          );

        }
      );

    }
  );

}


carregarGrupos();



async function excluirGrupo(id) {

  const confirmar =
    confirm(
      "Tem certeza que deseja excluir este grupo?"
    );


  if (!confirmar) {
    return;
  }


  try {

    await deleteDoc(
      doc(db, "grupos", id)
    );


    alert(
      "Grupo excluído com sucesso!"
    );


  } catch (erro) {

    console.error(
      "Erro ao excluir:",
      erro
    );


    alert(
      "Erro ao excluir o grupo."
    );

  }

}



async function editarGrupo(id) {

  const grupoRef =
    doc(db, "grupos", id);


  try {

    const grupoDoc =
      await getDoc(
        grupoRef
      );


    if (!grupoDoc.exists()) {

      alert(
        "Grupo não encontrado."
      );

      return;

    }


    const grupo =
      grupoDoc.data();


    // Novo nome

    const novoNome =
      prompt(
        "Nome do grupo:",
        grupo.nome
      );


    if (novoNome === null) {
      return;
    }


    // Nova descrição

    const novaDescricao =
      prompt(
        "Descrição do grupo:",
        grupo.descricao
      );


    if (novaDescricao === null) {
      return;
    }


    await updateDoc(
      grupoRef,
      {

        nome: novoNome,

        descricao:
          novaDescricao

      }
    );


    alert(
      "Grupo atualizado com sucesso!"
    );


  } catch (erro) {

    console.error(
      "Erro ao editar grupo:",
      erro
    );


    alert(
      "Erro ao editar o grupo."
    );

  }

}


document.addEventListener(
  "DOMContentLoaded",
  () => {

    const foto =
      document.getElementById(
        "foto"
      );


    if (!foto) {
      return;
    }


    const spanIniciais =
      foto.querySelector(
        "span"
      );


    if (!spanIniciais) {
      return;
    }


    const iniciaisSalvas =
      localStorage.getItem(
        "iniciaisUsuario"
      );


    spanIniciais.textContent =
      iniciaisSalvas || "";

  }
);


function carregarDadosPerfil(uid) {

  const q =
    query(
      collection(db, "usuarios"),
      where(
        "uid",
        "==",
        uid
      )
    );


  onSnapshot(
    q,
    (snapshot) => {

      if (
        snapshot.empty
      ) {
        return;
      }


      const data =
        snapshot.docs[0].data();


      const foto =
        document.querySelector(
          "#foto span"
        );


      const nome =
        document.querySelector(
          "#NomeUC h4"
        );


      const curso =
        document.querySelector(
          "#NomeUC h5"
        );


      if (foto) {

        foto.textContent =
          data.iniciais || "";

      }


      if (nome) {

        nome.textContent =
          data.nome || "";

      }


      if (curso) {

        curso.textContent =
          data.curso ||
          "Coordenador/Professor";

      }

    }
  );

}