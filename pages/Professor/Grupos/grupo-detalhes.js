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

import { db } from "../../../backend/firebase/config.js";
import { fillHeader, navigate, requireProfessor } from "../../../backend/firebase/professor.js";




const params = new URLSearchParams(window.location.search);
const grupoId = params.get("id");

let grupoAtual = null;
let usuarioAtual = null;
let perfilAtual = null;
let tipoChatAtual = "grupo";
let pararChat = null;



window.Voltar = () => {
    navigate("grp.html");
};

window.VisaoGeral = () => {
    navigate("/pages/Professor/Index.html");
};

window.Grupos = () => {
    navigate("/pages/Professor/Grupos/grp.html");
};

window.Avaliacoes = () => {
    navigate("/pages/Professor/Avaliacoes/ava.html");
};

window.Biblioteca = () => {
    navigate("/pages/Professor/Biblioteca/Bib.html");
};

window.Forum = () => {
    navigate("/pages/Professor/Forum/Avisos.html");
};

window.Configuracoes = () => {
    navigate("/pages/Professor/Configuracoes/Config.html");
};


requireProfessor(async (user, profile) => {
    usuarioAtual = user;
    perfilAtual = profile;
    fillHeader(profile);
    await carregarGrupo();
});


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

        const groupData = snap.data();
        if (!perfilAtual?.codigoSala || groupData.codigoSala !== perfilAtual.codigoSala) {
            painel.textContent = "Acesso negado: este grupo não pertence à sua turma.";
            return;
        }
        grupoAtual = groupData;


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

    if (aba !== "chat" && aba !== "orientador") {
        pararChat?.();
        pararChat = null;
    }

    const nome =
        grupoAtual?.nome || "Grupo";


    if (aba === "chat") {
        tipoChatAtual = "grupo";

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

    if (aba === "orientador") {
        tipoChatAtual = "orientador";
        painel.innerHTML = `<div class="painel-titulo"><h2>Chat com Orientador — ${escapeHtml(nome)}</h2><p>Conversa do grupo com o professor orientador.</p></div><div id="chatMensagens" class="chat-area" aria-live="polite"></div><div class="chat-form"><textarea id="mensagemChat" placeholder="Digite uma mensagem..."></textarea><button id="btnEnviarMensagem">Enviar</button></div>`;
        iniciarChat();
        return;
    }



    if (aba === "arquivo") {
        painel.innerHTML = `<div class="arquivo-vazio"><h2>Arquivos do grupo</h2><div id="listaArquivos"></div><input id="nomeArquivo" placeholder="Nome do arquivo"><input id="urlArquivo" type="url" placeholder="URL do arquivo"><button id="btnSalvarArquivo">Adicionar arquivo</button></div>`;
        carregarArquivos();
        configurarSalvarArquivo();
        return;
    }




    if (aba === "historico") {
        painel.innerHTML = `<div class="historico-vazio"><h2>Atividades e entregas</h2><div id="listaEntregas"></div><label for="tituloEntrega">Título da atividade</label><input id="tituloEntrega" placeholder="Título da atividade"><label for="descricaoEntrega">Instruções</label><textarea id="descricaoEntrega" placeholder="Descreva o que o grupo deve entregar"></textarea><label for="prazoEntrega">Prazo</label><input id="prazoEntrega" type="date"><button id="btnSalvarEntrega">Publicar atividade</button></div>`;
        carregarEntregas();
        configurarSalvarEntrega();
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


    const q = query(mensagensRef, orderBy("criadoEm", "asc"));


    pararChat?.();
    pararChat = onSnapshot(
        q,
        (snapshot) => {

            mensagensDiv.innerHTML = "";


            snapshot.forEach((mensagemDoc) => {

                    const mensagem =
                        mensagemDoc.data();

                    // As telas de chat do aluno separam a conversa do grupo do
                    // canal com o orientador. O filtro usa o mesmo campo chatTipo
                    // para exibir aqui somente o canal correspondente.
                    if (mensagem.chatTipo && mensagem.chatTipo !== tipoChatAtual) return;
                    if (!mensagem.chatTipo && tipoChatAtual !== "grupo") return;


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

                        chatTipo: tipoChatAtual,

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



function carregarArquivos() {
    const lista = document.getElementById("listaArquivos");
    if (!lista) return;
    onSnapshot(collection(db, "grupos", grupoId, "arquivos"), (snapshot) => {
        lista.innerHTML = "";
        if (snapshot.empty) lista.textContent = "Nenhum arquivo cadastrado.";
        snapshot.forEach((arquivoDoc) => {
            const arquivo = arquivoDoc.data();
            const link = document.createElement("a");
            link.href = arquivo.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = arquivo.nome || arquivo.url;
            lista.appendChild(link);
            lista.appendChild(document.createElement("br"));
        });
    });
}

function configurarSalvarArquivo() {
    document.getElementById("btnSalvarArquivo")?.addEventListener("click", async () => {
        const nome = document.getElementById("nomeArquivo").value.trim();
        const url = document.getElementById("urlArquivo").value.trim();
        if (!nome || !url) return alert("Informe o nome e a URL do arquivo.");
        await addDoc(collection(db, "grupos", grupoId, "arquivos"), { nome, url, uid: usuarioAtual.uid, criadoEm: serverTimestamp() });
        document.getElementById("nomeArquivo").value = "";
        document.getElementById("urlArquivo").value = "";
    });
}

function carregarEntregas() {
    const lista = document.getElementById("listaEntregas");
    if (!lista) return;
    onSnapshot(collection(db, "grupos", grupoId, "entregas"), (snapshot) => {
        lista.innerHTML = "";
        if (snapshot.empty) lista.textContent = "Nenhuma entrega registrada.";
        snapshot.forEach((entregaDoc) => {
            const entrega = entregaDoc.data();
            const item = document.createElement("p");
            item.textContent = `${entrega.titulo || "Entrega"}: ${entrega.descricao || ""}`;
            lista.appendChild(item);
        });
    });
}

function configurarSalvarEntrega() {
    document.getElementById("btnSalvarEntrega")?.addEventListener("click", async () => {
        const titulo = document.getElementById("tituloEntrega").value.trim();
        const descricao = document.getElementById("descricaoEntrega").value.trim();
        const prazo = document.getElementById("prazoEntrega").value;
        if (!titulo) return alert("Informe o título da entrega.");
        // Cada atividade publicada é salva na coleção do grupo que também é lida
        // pela página de atividades do aluno. A data limite permite identificar
        // quando uma atividade está atrasada.
        await addDoc(collection(db, "grupos", grupoId, "entregas"), { titulo, descricao, dataLimite: prazo ? new Date(`${prazo}T23:59:59`) : null, uid: usuarioAtual.uid, tipo: "atividade", criadoEm: serverTimestamp() });
        document.getElementById("tituloEntrega").value = "";
        document.getElementById("descricaoEntrega").value = "";
        document.getElementById("prazoEntrega").value = "";
    });
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
