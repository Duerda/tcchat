import { auth, db } 
from "../../../backend/firebase/config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { collection, doc, getDoc, getDocs, increment, query, serverTimestamp, setDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAccountType, parseClassCode } from "../../../backend/auth/validation.js";

//Navegação
window.Entraralpr = function () {
    window.location.href = "../../Professor/Index.html";
};

window.Logar = function () {
    window.location.href = "../Login/Log-aluno.html";
};

document.getElementById("formCadastro").addEventListener("submit", Formulario);

async function Formulario(event) {
    event.preventDefault();

    const nome = document.getElementById("Nome-da-pessoa").value.trim();
    const email = document.getElementById("Email").value.trim().toLowerCase();
    const senha = document.getElementById("Senha").value;
    const repitaSenha = document.getElementById("RepitaSenha").value;
    const codigoDigitado = document.getElementById("Codigo-da-pessoa").value.trim().toUpperCase();

    // 1. Validação de campos vazios
    if (!nome || !email || !senha || !repitaSenha || !codigoDigitado) {
        alert("Preencha todos os campos!");
        return;
    }

    // 2. Validação do Código (Ex: DS-1, ADM-3)
    const classInfo = parseClassCode(codigoDigitado);
    if (!classInfo) {
        alert("Código de sala inválido! Use o formato SIGLA-ANO (Ex: DS-1, ADM-3).\n\nSiglas válidas: DS, DI, HOSP, IPI, MA, SEC, ADM, INF");
        document.getElementById("Codigo-da-pessoa").style.border = "1px solid red";
        return;
    }

    const { code: codigoSala, courseName: nomeCursoCompleto, year: ano } = classInfo;

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
    const tipo = getAccountType(email);
    if (!tipo) {
        alert("Digite um e-mail válido com domínio institucional autorizado.");
        document.getElementById("Email").focus();
        return;
    }

    let usedAccessCodeRef = null;
    let attemptedRecovery = false;
    let profileWriteFailed = false;
    try {
        // Os cadastros de alunos e professores exigem um código ativo emitido
        // pelo coordenador. Isso vincula a inscrição ao gerenciamento de códigos
        // da turma e permite controlar validade e revogação. Contas de coordenador
        // usam a verificação separada pelo código C00RD e não passam por esta etapa.
        if (tipo === "aluno" || tipo === "professor") {
            const accessCodes = await getDocs(query(
                collection(db, "codigosAcesso"),
                where("codigo", "==", codigoDigitado)
            ));
            const now = Date.now();
            const validCode = accessCodes.docs.find((item) => {
                const code = item.data();
                const expiry = code.expiraEm?.toDate?.()?.getTime?.() || (code.expiraEm ? new Date(code.expiraEm).getTime() : null);
                return !code.revogado && (!expiry || expiry >= now) && (code.tipo === tipo || code.tipo === "ambos");
            });
            if (!validCode) {
                alert(accessCodes.empty
                    ? "Ainda não há um código de acesso para esta turma. Solicite um código ao coordenador."
                    : "Este código está expirado, revogado ou não foi criado para o tipo de conta selecionado.");
                return;
            }
            usedAccessCodeRef = validCode.ref;
        }
        
        let userCredential;
        try {
            userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        } catch (error) {
            if (error.code !== "auth/email-already-in-use") throw error;
            attemptedRecovery = true;

            // Se a autenticação foi criada numa tentativa anterior, mas a gravação
            // do perfil falhou, permite concluir o cadastro com o mesmo e-mail e senha.
            userCredential = await signInWithEmailAndPassword(auth, email, senha);
            let existingProfile;
            try {
                existingProfile = await getDoc(doc(db, "usuarios", userCredential.user.uid));
            } catch (profileReadError) {
                await signOut(auth);
                throw profileReadError;
            }
            if (existingProfile.exists()) {
                await signOut(auth);
                alert("Este e-mail já possui um perfil. Entre pela tela de login.");
                return;
            }
        }
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
        userData.codigoSala = codigoSala;
        
        if (tipo === "aluno") {
            userData.curso = nomeCursoCompleto;
            userData.ano = ano + "º Ano";
        } else {
            // Para professores e coordenadores, buscamos o curso pela sigla do código
            userData.curso = nomeCursoCompleto;
        }

        try {
            await setDoc(doc(db, "usuarios", user.uid), userData);
        } catch (profileError) {
            profileWriteFailed = true;
            await signOut(auth);
            throw profileError;
        }
        if (usedAccessCodeRef) {
            await updateDoc(usedAccessCodeRef, { usos: increment(1), ultimoUso: serverTimestamp() });
        }

        alert(`Cadastro realizado com sucesso como ${tipo}!`);

        if (tipo === "coordenador") {
            window.location.href = "../../Coordenador/Coord-Index.html";
        } else if (tipo === "professor") {
            window.location.href = "../../Professor/Index.html";
        } else {
            window.location.href = "../../Aluno/Turma/index.html";
        }

    } catch (error) {
        console.error("Erro:", error);
        if (error.code === "auth/email-already-in-use") {
            alert("Este e-mail já possui uma conta. Confirme a senha ou entre pela tela de login.");
            return;
        }
        if (attemptedRecovery && error.code === "auth/invalid-credential") {
            alert("Este e-mail já possui uma conta. A senha informada não confere; use a tela de login ou recupere a senha.");
            return;
        }
        if (profileWriteFailed) {
            alert("A conta de autenticação foi criada, mas o perfil não foi salvo. Tente novamente com o mesmo e-mail e senha para concluir o cadastro.");
            return;
        }
        if (error.code === "auth/invalid-email") {
            alert("O formato do e-mail é inválido.");
            document.getElementById("Email").focus();
            return;
        }
        alert("Não foi possível cadastrar: " + (error.message || "erro inesperado."));
    }
}
