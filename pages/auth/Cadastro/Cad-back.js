import { auth, db } 
from "../../../backend/firebase/config.js";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { arrayUnion, doc, getDoc, increment, serverTimestamp, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getAccountType, hasTwoPartEmailName, parseClassCode } from "../../../backend/auth/validation.js";

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

    if (getAccountType(email) === "coordenador") {
        alert("Contas de coordenação são criadas pela administração do sistema. Solicite o provisionamento ao responsável pelo TCCHAT.");
        return;
    }

    // 1. Validação de campos vazios
    if (!nome || !email || !senha || !repitaSenha || !codigoDigitado) {
        alert("Preencha todos os campos!");
        return;
    }

    if (!hasTwoPartEmailName(email)) {
        alert("O e-mail deve ter exatamente duas partes antes do @, separadas por um ponto. Ex.: jose.silva@aluno.cps.sp.gov.br ou coord.1@cps.sp.gov.br.");
        document.getElementById("Email").focus();
        return;
    }

    // 2. Validação de senha
    if (senha !== repitaSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    if (senha.length < 8) {
        alert("A senha deve ter no mínimo 8 caracteres!");
        return;
    }

    // 3. Definir o perfil pelo domínio antes de validar o código específico.
    const tipo = getAccountType(email);
    if (!tipo) {
        alert("Digite um e-mail válido com domínio institucional autorizado.");
        document.getElementById("Email").focus();
        return;
    }

    let usedAccessCodeRef = null;
    let accessCodeId = null;
    let classInfo = null;
    let attemptedRecovery = false;
    let profileWriteFailed = false;
    try {
        // Os cadastros de alunos e professores exigem um código ativo emitido
        // pela coordenação. Contas de coordenador são criadas pela administração.
        if (tipo === "aluno" || tipo === "professor") {
            const validCode = await getDoc(doc(db, "codigosAcesso", codigoDigitado));
            const now = Date.now();
            const code = validCode.exists() ? validCode.data() : null;
            const expiry = code?.expiraEm?.toDate?.()?.getTime?.() || (code?.expiraEm ? new Date(code.expiraEm).getTime() : null);
            classInfo = parseClassCode(code?.codigoSala);
            if (!code || code.codigo !== codigoDigitado || code.revogado || (expiry && expiry < now)
                || (code.tipo !== tipo && code.tipo !== "ambos") || !classInfo) {
                alert("Convite inválido, expirado, revogado ou incompatível com o tipo de conta. Solicite um novo à coordenação.");
                return;
            }
            accessCodeId = validCode.id;
            usedAccessCodeRef = validCode.ref;
        }

        const { code: codigoSala, courseName: nomeCursoCompleto, year: ano } = classInfo;
        
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

        // 4. Salvar o perfil. Um coordenador tem escopo global e não recebe codigoSala.
        const userData = {
            uid: user.uid,
            nome: nome,
            email: email,
            tipo: tipo,
            iniciais: iniciais,
            dataCadastro: new Date().toISOString()
        };

        if (accessCodeId) userData.codigoAcessoId = accessCodeId;

        if (tipo === "aluno") {
            userData.codigoSala = codigoSala;
            userData.curso = nomeCursoCompleto;
            userData.ano = ano + "º Ano";
        } else if (tipo === "professor") {
            userData.codigoSala = codigoSala;
            userData.curso = nomeCursoCompleto;
        } else {
            userData.escopo = "global";
            userData.curso = "Coordenação global";
        }

        try {
            await setDoc(doc(db, "usuarios", user.uid), userData);
        } catch (profileError) {
            profileWriteFailed = true;
            await signOut(auth);
            throw profileError;
        }
        if (usedAccessCodeRef) {
            await updateDoc(usedAccessCodeRef, {
                usos: increment(1),
                usadosPor: arrayUnion(user.uid),
                ultimoUso: serverTimestamp()
            });
        }

        // O perfil é criado como pendente. As regras de acesso por papel exigem
        // email_verified; enviamos o link e encerramos a sessão até a confirmação.
        try {
            await sendEmailVerification(user);
        } finally {
            await signOut(auth);
        }
        alert(`Cadastro iniciado como ${tipo}. Enviamos um link de verificação para ${email}. Abra-o no seu e-mail e depois entre no TCCHAT.`);

        window.location.href = tipo === "professor"
            ? "../Login/Log-Prof.html"
            : "../Login/Log-aluno.html";

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
