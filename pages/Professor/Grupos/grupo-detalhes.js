import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import { auth, db } from "/backend/firebase/config.js";




const params = new URLSearchParams(window.location.search);
const grupoId = params.get("id");

let grupoAtual = null;
let usuarioAtual = null;



window.Voltar = () => {
    window.location.href = "grp.html";
};

window.VisaoGeral = () => {
    window.location.href = "/pages/Professor/Index.html";
};

window.Grupos = () => {
    window.location.href = "/pages/Professor/Grupos/grp.html";
};

window.Avaliacoes = () => {
    window.location.href = "/pages/Professor/Avaliacoes/ava.html";
};

window.Biblioteca = () => {
    window.location.href = "/pages/Professor/Biblioteca/Bib.html";
};

window.Forum = () => {
    window.location.href = "/pages/Professor/Forum/Avisos.html";
};

window.Configuracoes = () => {
    window.location.href = "/pages/Professor/Configuracoes/Config.html";
};


onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href =
            "/pages/auth/Login/Log-aluno.html";

        return;
    }

    usuarioAtual = user;

    try {

        const userDoc = await getDoc(
            doc(db, "usuarios", user.uid)
        );

        const tipo = userDoc.exists()
            ? userDoc.data().tipo
            : null;

        if (
            tipo !== "professor" &&
            tipo !== "coordenador"
        ) {

            alert(
                "Acesso negado: Esta área é exclusiva para professores e coordenadores."
            );

            window.location.href =
                "/pages/auth/Login/Log-aluno.html";

            return;
        }

        carregarPerfil(user.uid);

        carregarGrupo();

    } catch (erro) {

        console.error(
            "Erro ao verificar usuário:",
            erro
        );

    }

});


function carregarPerfil(uid) {

    const q = query(
        collection(db, "usuarios"),
        where("uid", "==", uid)
    );

    onSnapshot(q, (snapshot) => {

        if (snapshot.empty) {
            return;
        }

        const data =
            snapshot.docs[0].data();

        const foto =
            document.querySelector("#foto span");

        const nome =
            document.querySelector("#NomeUC h4");

        const curso =
            document.querySelector("#NomeUC h5");


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
                "Professor/Coordenador";
        }

    });

}


async function carregarGrupo() {

    const painel =
        document.getElementById("painelGrupo");

    if (!grupoId) {

        painel.innerHTML = `
            <div class="anotacao-card">
                Grupo não informado.
            </div>
        `;

        return;
    }

    try {

        const grupoRef =
            doc(db, "grupos", grupoId);

        const snap =
            await getDoc(grupoRef);

        if (!snap.exists()) {

            painel.innerHTML = `
                <div class="anotacao-card">
                    Grupo não encontrado.
                </div>
            `;

            return;
        }

        grupoAtual =
            snap.data();


        const nomeGrupo =
            document.getElementById(
                "nomeGrupo"
            );

        if (nomeGrupo) {

            nomeGrupo.textContent =
                grupoAtual.nome || "Grupo";

        }


        const infoGrupo =
            document.getElementById(
                "infoGrupo"
            );

        if (infoGrupo) {

            infoGrupo.textContent =
                `Grupo de ${
                    grupoAtual.minMembros || 3
                } - ${
                    grupoAtual.maxMembros || 5
                } integrantes`;

        }


        renderAba("chat");

    } catch (erro) {

        console.error(
            "Erro ao carregar grupo:",
            erro
        );

    }

}



document.addEventListener(
    "DOMContentLoaded",
    () => {

        const abas =
            document.querySelectorAll(".aba");

        abas.forEach((botao) => {

            botao.addEventListener(
                "click",
                () => {

                    abas.forEach((b) => {
                        b.classList.remove("ativa");
                    });

                    botao.classList.add("ativa");

                    const aba =
                        botao.dataset.aba;

                    renderAba(aba);

                }
            );

        });

    }
);



function renderAba(aba) {

    const painel =
        document.getElementById(
            "painelGrupo"
        );

    const nome =
        grupoAtual?.nome || "Grupo";


    if (aba === "chat") {

        painel.innerHTML = `

            <div class="painel-titulo">

                <h2>
                    Chat — ${escapeHtml(nome)}
                </h2>

                <p>
                    Você está respondendo como professor
                </p>

            </div>


            <div
                id="chatMensagens"
                class="chat-area"
            >
            </div>


            <div class="chat-form">

                <textarea
                    id="mensagemChat"
                    placeholder="Digite uma mensagem..."
                ></textarea>

                <button
                    id="btnEnviarMensagem"
                >
                    Enviar
                </button>

            </div>

        `;


        iniciarChat();

        return;
    }



    if (aba === "arquivo") {

        painel.innerHTML = `

            <div class="arquivo-vazio">

                <h2>Arquivos do grupo</h2>

                <p>
                    Nenhum arquivo disponível.
                </p>

            </div>

        `;

        return;
    }




    if (aba === "historico") {

        painel.innerHTML = `

            <div class="historico-vazio">

                <h2>
                    Histórico de entregas
                </h2>

                <p>
                    Nenhuma entrega registrada.
                </p>

            </div>

        `;

        return;
    }


    if (aba === "anotacoes") {

        painel.innerHTML = `

            <p class="anotacoes-info">

                Anotações visíveis apenas para
                os professores e o coordenador
                do curso.

            </p>


            <div
                id="listaAnotacoes"
                class="lista-anotacoes"
            >
            </div>


            <div class="form-anotacao">

                <h2>
                    Salvar anotação
                </h2>


                <textarea
                    id="textoAnotacao"
                    placeholder="Digite uma anotação sobre o grupo..."
                ></textarea>


                <button
                    id="btnSalvarAnotacao"
                >
                    Salvar anotação
                </button>

            </div>

        `;


        carregarAnotacoes();

        configurarSalvarAnotacao();

        return;
    }

}


function iniciarChat() {

    const mensagensDiv =
        document.getElementById(
            "chatMensagens"
        );

    const campo =
        document.getElementById(
            "mensagemChat"
        );

    const botao =
        document.getElementById(
            "btnEnviarMensagem"
        );


    if (!mensagensDiv) {
        return;
    }


    const mensagensRef =
        collection(
            db,
            "grupos",
            grupoId,
            "mensagens"
        );


    const q =
        query(
            mensagensRef,
            orderBy(
                "criadoEm",
                "asc"
            )
        );


    onSnapshot(
        q,
        (snapshot) => {

            mensagensDiv.innerHTML = "";


            snapshot.forEach(
                (mensagemDoc) => {

                    const mensagem =
                        mensagemDoc.data();


                    const div =
                        document.createElement(
                            "div"
                        );


                    const ehProfessor =
                        mensagem.uid ===
                        usuarioAtual?.uid;


                    div.className =
                        ehProfessor
                            ? "mensagem professor"
                            : "mensagem aluno";


                    div.textContent =
                        mensagem.texto || "";


                    mensagensDiv.appendChild(
                        div
                    );

                }
            );


            mensagensDiv.scrollTop =
                mensagensDiv.scrollHeight;

        }
    );


    botao.addEventListener(
        "click",
        async () => {

            const texto =
                campo.value.trim();


            if (!texto) {

                alert(
                    "Digite uma mensagem antes de enviar."
                );

                return;
            }


            try {

                await addDoc(
                    mensagensRef,
                    {

                        texto: texto,

                        uid:
                            usuarioAtual.uid,

                        autor:
                            "professor",

                        criadoEm:
                            serverTimestamp()

                    }
                );


                campo.value = "";

                campo.focus();


            } catch (erro) {

                console.error(
                    "Erro ao enviar mensagem:",
                    erro
                );


                alert(
                    "Não foi possível enviar a mensagem."
                );

            }

        }
    );

}



function configurarSalvarAnotacao() {

    const textarea =
        document.getElementById(
            "textoAnotacao"
        );

    const botao =
        document.getElementById(
            "btnSalvarAnotacao"
        );


    if (!textarea || !botao) {
        return;
    }


    botao.addEventListener(
        "click",
        async () => {

            const texto =
                textarea.value.trim();


            if (!texto) {

                alert(
                    "Digite uma anotação antes de salvar."
                );

                return;
            }


            try {

                const anotacoesRef =
                    collection(
                        db,
                        "grupos",
                        grupoId,
                        "anotacoes"
                    );


                await addDoc(
                    anotacoesRef,
                    {

                        texto: texto,

                        uid:
                            usuarioAtual.uid,

                        autor:
                            "professor",

                        criadoEm:
                            serverTimestamp()

                    }
                );


                // Limpa o textarea

                textarea.value = "";

                textarea.focus();


                alert(
                    "Anotação salva com sucesso!"
                );


            } catch (erro) {

                console.error(
                    "Erro ao salvar anotação:",
                    erro
                );


                alert(
                    "Não foi possível salvar a anotação."
                );

            }

        }
    );

}


function carregarAnotacoes() {

    const lista =
        document.getElementById(
            "listaAnotacoes"
        );


    if (!lista) {
        return;
    }


    const anotacoesRef =
        collection(
            db,
            "grupos",
            grupoId,
            "anotacoes"
        );


    const q =
        query(
            anotacoesRef,
            orderBy(
                "criadoEm",
                "desc"
            )
        );


    onSnapshot(
        q,
        (snapshot) => {

            lista.innerHTML = "";


            snapshot.forEach(
                (anotacaoDoc) => {

                    const anotacao =
                        anotacaoDoc.data();


                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "anotacao-card";


                    const texto =
                        document.createElement(
                            "p"
                        );


                    texto.textContent =
                        anotacao.texto || "";


                    div.appendChild(
                        texto
                    );


                    lista.appendChild(
                        div
                    );

                }
            );

        }
    );

}



function escapeHtml(valor) {

    return String(valor).replace(
        /[&<>'"]/g,
        (char) => ({

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"

        })[char]
    );

}