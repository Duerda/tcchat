import { auth, db } from "../../firebaseConfig.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

window.Entraralpr = function () {
    window.location.href = "/Professor/index.html";
};

window.Logar = function () {
    window.location.href = "/Inicial-tela/Login/Log-aluno.html";
};

document.getElementById("formCadastro").addEventListener("submit", Formulario);

async function Formulario(event) {
    event.preventDefault();

    const nome = document.getElementById("Nome-da-pessoa").value.trim();
    const email = document.getElementById("Email").value.trim();
    const senha = document.getElementById("Senha").value;
    const repitaSenha = document.getElementById("RepitaSenha").value;
    const codigo = document.getElementById("Codigo-da-pessoa").value.trim();

    if (!nome || !email || !senha || !repitaSenha || !codigo) {
        alert("Preencha todos os campos!");
        return;
    }

    if (senha !== repitaSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    if (senha.length < 8) {
        alert("A senha deve ter no mínimo 8 caracteres!");
        return;
    }

    let tipo = "";
    if (email.endsWith("@aluno.cps.sp.gov.br")) {
        tipo = "aluno";
    } else if (email.endsWith("@professor.cps.sp.gov.br")) {
        tipo = "professor";
    } else {
        alert("Use um e-mail institucional válido!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        const prefixo = email.split("@")[0];
        const partes = prefixo.split(".");
        let iniciais = partes.length >= 2 
            ? partes[0].charAt(0).toUpperCase() + partes[1].charAt(0).toUpperCase()
            : prefixo.substring(0, 2).toUpperCase();

        await setDoc(doc(db, "usuarios", user.uid), {
            uid: user.uid,
            nome: nome,
            email: email,
            tipo: tipo,
            codigoCurso: codigo,
            iniciais: iniciais,
            dataCadastro: new Date().toISOString()
        });

        alert("Cadastro realizado com sucesso!");

        if (tipo === "professor") {
            window.location.href = "/Professor/Index.html";
        } else {
            window.location.href = "/Aluno/Turma.html";
        }

    } catch (error) {
        alert("Erro ao cadastrar: " + error.message);
    }
}
