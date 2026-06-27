import { auth, db } from "../../backend/firebaseConfig.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Lista oficial de cursos e seus códigos
const cursosValidos = {
    "DS": "Desenvolvimento de Sistemas",
    "DI": "Design de Interiores",
    "HOSP": "Hospedagem",
    "IPI": "Informática para Internet - MTEC",
    "MA": "Meio Ambiente",
    "SEC": "Secretariado",
    "ADM": "Administração",
    "INF": "Informática - MTEC"
};

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
    const codigoDigitado = document.getElementById("Codigo-da-pessoa").value.trim().toUpperCase();

    // 1. Validação de campos vazios
    if (!nome || !email || !senha || !repitaSenha || !codigoDigitado) {
        alert("Preencha todos os campos!");
        return;
    }

    // 2. Validação do Código (Ex: DS-1, ADM-3)
    const partesCodigo = codigoDigitado.split("-");
    const sigla = partesCodigo[0];
    const ano = partesCodigo[1];

    if (!cursosValidos[sigla] || !["1", "2", "3"].includes(ano)) {
        alert("Código de sala inválido! Use o formato SIGLA-ANO (Ex: DS-1, ADM-3).\n\nSiglas válidas: DS, DI, HOSP, IPI, MA, SEC, ADM, INF");
        document.getElementById("Codigo-da-pessoa").style.border = "1px solid red";
        return;
    }

    const nomeCursoCompleto = cursosValidos[sigla];

    // 3. Validação de senha
    if (senha !== repitaSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    if (senha.length < 8) {
        alert("A senha deve ter no mínimo 8 caracteres!");
        return;
    }

    // 4. Definir tipo de usuário
    let tipo = "";
    if (email.endsWith("@aluno.cps.sp.gov.br")) {
        tipo = "aluno";
    } else if (email.endsWith("@professor.cps.sp.gov.br")) {
        tipo = "professor";
    } else if (email.endsWith("@cps.sp.gov.br")) {
        tipo = "coordenador";
    } else {
        alert("Use um e-mail institucional válido (@aluno.cps.sp.gov.br, @professor.cps.sp.gov.br ou @cps.sp.gov.br)");
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

        // 5. Salvar no Firestore com os dados do curso validados
        const userData = {
            uid: user.uid,
            nome: nome,
            email: email,
            tipo: tipo,
            iniciais: iniciais,
            dataCadastro: new Date().toISOString()
        };

        // O código da sala é importante para todos os usuários (vincula o professor/coordenador à sua turma)
        userData.codigoSala = codigoDigitado;
        
        if (tipo === "aluno") {
            userData.curso = nomeCursoCompleto;
            userData.ano = ano + "º Ano";
        } else {
            // Para professores e coordenadores, buscamos o curso pela sigla do código
            userData.curso = nomeCursoCompleto;
        }

        await setDoc(doc(db, "usuarios", user.uid), userData);

        alert(`Cadastro realizado com sucesso como ${tipo}!`);

        if (tipo === "coordenador") {
            window.location.href = "/Professor/Index.html"; // Redireciona para Professor se Coordenador não existir
        } else if (tipo === "professor") {
            window.location.href = "/Professor/Index.html";
        } else {
            window.location.href = "/Aluno/Turma.html";
        }

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao cadastrar: " + error.message);
    }
}
