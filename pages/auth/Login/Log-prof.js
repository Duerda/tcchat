import { auth, db } from "../../../backend/firebase/config.js";
import { appUrl, navigate } from "../../../backend/navigation.js";
import { getIdToken, reload, sendEmailVerification, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc, serverTimestamp, updateDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Página para onde o coordenador será enviado
const PAGINA_COORDENADOR = appUrl("pages/Coordenador/Coord-Index.html");

// Página normal do professor
const PAGINA_PROFESSOR = appUrl("pages/Professor/Index.html");


window.Aluno = function () {
    window.location.href = "Log-aluno.html";
};


window.Cadastrar = function () {
    navigate("/pages/auth/Cadastro/Cad.html");
};


// Login
async function Formulario(event) {

    event.preventDefault();

    const emailInput = document.getElementById("E-mail");
    const senhaInput = document.getElementById("Senhas");
    const perfilSelecionado = document.querySelector(".perfil-opcao.selecionado");

    const email = emailInput.value.trim().toLowerCase();
    const senha = senhaInput.value;

    // A seleção só define a área esperada. A autorização real é feita pelo
    // perfil existente em usuarios/{uid}, após autenticar no Firebase.
    const tipoEsperado = perfilSelecionado?.dataset.perfil;


    // Verifica e-mail e senha
    if (!email || !senha) {

        alert("Preencha o e-mail e a senha.");

        return;
    }

    if (!tipoEsperado) {
        alert("Selecione Professor ou Coordenador.");
        return;
    }

    try {

        // Faz login no Firebase
        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                senha
            );


        const user = userCredential.user;

        await reload(user);
        if (!user.emailVerified) {
            try {
                await sendEmailVerification(user);
            } catch (verificationError) {
                console.error("Falha ao enviar verificação de e-mail:", verificationError);
                await signOut(auth);
                alert("O e-mail ainda não está confirmado e não foi possível enviar outro link. Confira a caixa de spam e tente novamente mais tarde. " + (verificationError.code || ""));
                return;
            } finally {
                if (auth.currentUser) await signOut(auth);
            }
            alert(`Seu e-mail ainda não foi confirmado. Enviamos um novo link para ${email}; confira também a caixa de spam e tente entrar novamente após confirmar.`);
            return;
        }
        await getIdToken(user, true);

        const usuarioRef = doc(db, "usuarios", user.uid);

        const usuarioDoc = await getDoc(usuarioRef);


        if (usuarioDoc.exists()) {
            const perfil = usuarioDoc.data();
            if (perfil.acessoAtivo === false) {
                await signOut(auth);
                alert("O acesso desta conta foi revogado. Procure a coordenação.");
                return;
            }
            if (perfil.tipo !== "professor" && perfil.tipo !== "coordenador") {
                await signOut(auth);
                alert("Esta conta não possui um perfil de professor ou coordenador.");
                return;
            }
            if (perfil.tipo !== tipoEsperado) {
                await signOut(auth);
                alert(perfil.tipo === "coordenador"
                    ? "Esta conta é de coordenador. Selecione Coordenador para entrar."
                    : "Esta conta é de professor. Selecione Professor para entrar.");
                return;
            }
            await updateDoc(usuarioRef, { ultimoAcesso: serverTimestamp() });
        } else {
            await signOut(auth);
            alert("Esta conta não possui um perfil cadastrado.");
            return;
        }


        console.log(
            "Dados do usuário:",
            usuarioDoc.data()
        );


        // ==========================================
        // COORDENADOR
        // ==========================================

        if (tipoEsperado === "coordenador") {

            alert(
                "Login de coordenador realizado com sucesso!"
            );

            window.location.href =
                PAGINA_COORDENADOR;

            return;
        }


        // ==========================================
        // PROFESSOR
        // ==========================================

        window.location.href = PAGINA_PROFESSOR;


    } catch (error) {

        console.error(
            "Erro de Login:",
            error
        );


        if (
            error.code === "auth/user-not-found" ||
            error.code === "auth/wrong-password" ||
            error.code === "auth/invalid-credential"
        ) {

            alert(
                "E-mail ou senha incorretos."
            );

        } else {

            alert(
                "Erro ao entrar: " +
                error.message
            );
        }
    }
}


// Quando a página carregar
document.addEventListener(
    "DOMContentLoaded",
    () => {

        const form =
            document.getElementById("loginForm");

        const perfilBotoes = document.querySelectorAll(".perfil-opcao");
        const emailInput = document.getElementById("E-mail");

        // Formulário de login
        if (form) {

            form.addEventListener(
                "submit",
                Formulario
            );
        }


        perfilBotoes.forEach((botao) => {
            botao.addEventListener("click", () => {
                perfilBotoes.forEach((opcao) => {
                    const selecionado = opcao === botao;
                    opcao.classList.toggle("selecionado", selecionado);
                    opcao.setAttribute("aria-pressed", String(selecionado));
                });
                if (emailInput) {
                    emailInput.placeholder = botao.dataset.perfil === "coordenador"
                        ? "coordenador@exemplo.com"
                        : "seu@email.com";
                }
            });
        });
    }
)
