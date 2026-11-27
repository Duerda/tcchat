import { auth, db } 
from "../../../backend/firebase/config.js";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { parseClassCode } from "../../../backend/auth/validation.js";
import { savePendingRegistration } from "../../../backend/auth/pending-registration.js";

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
    const tipo = document.getElementById("TipoConta").value;
    const inviteCode = codigoDigitado;

    // 1. Validação de campos vazios
    if (!nome || !email || !senha || !repitaSenha || !codigoDigitado) {
        alert("Preencha todos os campos!");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert("Informe um e-mail válido.");
    if (!["aluno", "professor"].includes(tipo)) return alert("Escolha Aluno ou Professor.");
    if (!inviteCode || /[\s,;]/.test(inviteCode)) return alert("Informe um único código de convite fornecido pela coordenação.");

    // 2. Validação de senha
    if (senha !== repitaSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    if (senha.length < 8) {
        alert("A senha deve ter no mínimo 8 caracteres!");
        return;
    }

    let accessCodeId = null;
    let attemptedRecovery = false;
    try {
        // Os cadastros de alunos e professores exigem um código ativo emitido
        // pela coordenação. Contas de coordenador são criadas pela administração.
        if (tipo === "aluno" || tipo === "professor") {
            const validCode = await getDoc(doc(db, "codigosAcesso", inviteCode));
            const now = Date.now();
            const code = validCode.exists() ? validCode.data() : null;
            const expiry = code?.expiraEm?.toDate?.()?.getTime?.() || (code?.expiraEm ? new Date(code.expiraEm).getTime() : null);
            const roomsFromInvite = tipo === "professor" && Array.isArray(code?.codigoSalas)
                ? code.codigoSalas
                : [code?.codigoSala];
            const classRooms = [...new Set(roomsFromInvite.filter(Boolean))];
            const parsedRooms = classRooms.map(parseClassCode);
            if (!code || code.codigo !== validCode.id || code.revogado || (expiry && expiry < now)
                || (code.tipo !== tipo && code.tipo !== "ambos") || !classRooms.length
                || classRooms.length > 8 || parsedRooms.some((room) => !room)
                || (tipo === "aluno" && classRooms.length !== 1)
                || (tipo === "professor" && code.codigoSalas && code.codigoSala !== classRooms[0])
                || (code.limiteUsos && Number(code.usos || 0) >= Number(code.limiteUsos))) {
                alert("Convite inválido, expirado, já utilizado ou incompatível com o tipo de conta.");
                return;
            }
            accessCodeId = validCode.id;
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
        // Guardamos o convite localmente. O uso só é contabilizado depois que
        // o usuário confirma o e-mail e conclui o primeiro login.
        savePendingRegistration({ uid: user.uid, email, nome, tipo, codigoAcessoId: accessCodeId });
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
        if (error.code === "auth/invalid-email") {
            alert("O formato do e-mail é inválido.");
            document.getElementById("Email").focus();
            return;
        }
        alert("Não foi possível cadastrar: " + (error.message || "erro inesperado."));
    }
}
