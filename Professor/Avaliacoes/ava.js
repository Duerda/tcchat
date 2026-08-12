
document.addEventListener('DOMContentLoaded', function() {
    let nomeCurso = document.getElementById("NomeUC").querySelector("h5");

// Funções de Navegação
window.Voltar = () => auth.signOut().then(() => window.location.href = "/Inicial-tela/Login/Log-aluno.html");

window.VisaoGeral = function (){ 
    window.location.href = "/Professor/Index.html";
};
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

let usuarioAtual = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        const tipo = userDoc.exists() ? userDoc.data().tipo : null;
        if (tipo === "professor" || tipo === "coordenador") {
            usuarioAtual = user;
            carregarDadosPerfil(user.uid);
            escutarAvisos();
        } else {
            alert("Acesso negado: Esta área é exclusiva para professores e coordenadores.");
            window.location.href = "/Inicial-tela/Login/Log-aluno.html";
        }
    } else {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
});

function carregarDadosPerfil(uid) {
    const q = query(collection(db, "usuarios"), where("uid", "==", uid));
    onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            document.querySelector("#foto span").textContent = data.iniciais || "";
            document.querySelector("#NomeUC h4").textContent = data.nome || "";
            document.querySelector("#NomeUC h5").textContent = data.curso || "Coordenador/Professor";
        }
    });
}

const botaoSalvar = document.getElementById("salvar-avaliacao");
const botaoVoltar = document.getElementById("voltar-avaliacao");
const card = document.getElementById("card-avaliacao");
const arquivo = document.getElementById("arquivo-avaliacao");
const nota = document.getElementById("nota");
const feedback = document.getElementById("feedback");

botaoSalvar.addEventListener("click", async () => {
    if (nota.value === "" || feedback.value === "") {
        alert("Preencha a nota e o feedback.");
        return;
    }

    if (!confirm("Deseja salvar a avaliação?")) return;

    try {
        await addDoc(collection(db, "avaliacoes"), {
            grupoId: "exemplo-grupo-1", // Em um cenário real, isso viria da seleção do grupo
            professorUid: usuarioAtual.uid,
            nota: parseFloat(nota.value),
            feedback: feedback.value,
            data: serverTimestamp()
        });

        alert("Avaliação salva com sucesso!");
        
        // Efeito visual (mantendo comportamento original)
        arquivo.style.display = "none";
        card.style.opacity = "0.7";
        nota.disabled = true;
        feedback.disabled = true;
        botaoSalvar.style.display = "none";
        botaoVoltar.style.display = "inline-block";
    } catch (error) {
        console.error("Erro ao salvar:", error);
    }
});

botaoVoltar.addEventListener("click", () => {
    if (!confirm("Deseja voltar a avaliação?")) return;
    arquivo.style.display = "flex";
    card.style.opacity = "1";
    nota.disabled = false;
    feedback.disabled = false;
    botaoSalvar.style.display = "inline-block";
    botaoVoltar.style.display = "none";
});
});
