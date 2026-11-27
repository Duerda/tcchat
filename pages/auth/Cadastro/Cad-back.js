import { auth, db } 
from "../../../backend/firebase/config.js";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { arrayUnion, doc, getDoc, increment, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { parseClassCode } from "../../../backend/auth/validation.js";

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

    let usedAccessCodeRef = null;
    let accessCodeId = null;
    let classInfo = null;
    let classRooms = [];
    let attemptedRecovery = false;
    let profileWriteFailed = false;
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
            classRooms = [...new Set(roomsFromInvite.filter(Boolean))];
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
            classInfo = parsedRooms[0];
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

        if (accessCodeId) {
            userData.codigoAcessoId = accessCodeId;
            userData.codigoAcessoIds = [accessCodeId];
        }

        if (tipo === "aluno") {
            userData.codigoSala = codigoSala;
            userData.codigoSalas = [codigoSala];
            userData.curso = nomeCursoCompleto;
            userData.ano = ano + "º Ano";
        } else if (tipo === "professor") {
            userData.codigoSala = codigoSala;
            userData.codigoSalas = classRooms;
            userData.curso = classRooms.map((room) => parseClassCode(room).courseName).join(", ");
        } else {
            userData.escopo = "global";
            userData.curso = "Coordenação global";
        }

        try {
            const batch = writeBatch(db);
            batch.set(doc(db, "usuarios", user.uid), userData);
            if (usedAccessCodeRef) batch.update(usedAccessCodeRef, {
                usos: increment(1),
                usadosPor: arrayUnion(user.uid),
                ultimoUso: serverTimestamp()
            });
            await batch.commit();
        } catch (profileError) {
            profileWriteFailed = true;
            await signOut(auth);
            throw profileError;
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
            const detail = error.code === "permission-denied"
                ? "O Firestore recusou o cadastro. Verifique se o convite está ativo e se as regras publicadas permitem esse cadastro."
                : `Código do erro: ${error.code || "desconhecido"}.`;
            alert(`A conta de autenticação foi criada, mas o perfil não foi salvo. ${detail}`);
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
