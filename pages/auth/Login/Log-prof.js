import { auth, db } from "/backend/firebase/config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Código utilizado pelos coordenadores
const CODIGO_COORDENADOR = "C00RD";

// Página para onde o coordenador será enviado
const PAGINA_COORDENADOR = "/pages/Coordenador/Coord-Index.html";

// Página normal do professor
const PAGINA_PROFESSOR = "/pages/Professor/Index.html";


window.Aluno = function () {
    window.location.href = "Log-aluno.html";
};


window.Cadastrar = function () {
    window.location.href = "/pages/auth/Cadastro/Cad.html";
};


// Abre/fecha a área do coordenador
function toggleCoor() {

    const box = document.getElementById("Coor-box");
    const seta = document.getElementById("seta");

    if (!box || !seta) return;

    box.classList.toggle("ativo");

    if (box.classList.contains("ativo")) {

        // Gira a seta 180 graus
        seta.style.transform = "rotate(180deg)";

    } else {

        // Volta a seta para a posição original
        seta.style.transform = "rotate(0deg)";
    }
}


// Login
async function Formulario(event) {

    event.preventDefault();

    const emailInput = document.getElementById("E-mail");
    const senhaInput = document.getElementById("Senhas");
    const codigoInput = document.getElementById("Codigo-coordenador");

    const box = document.getElementById("Coor-box");

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    const codigo = codigoInput
        ? codigoInput.value.trim().toUpperCase()
        : "";

    // Verifica se o usuário abriu a área de coordenador
    const entrouComoCoordenador =
        box && box.classList.contains("ativo");


    // Verifica e-mail e senha
    if (!email || !senha) {

        alert("Preencha o e-mail e a senha.");

        return;
    }


    // Se estiver entrando como coordenador
    if (entrouComoCoordenador) {

        // Código vazio
        if (!codigo) {

            alert("Digite o código do coordenador.");

            codigoInput.focus();

            return;
        }


        // Código incorreto
        if (codigo !== CODIGO_COORDENADOR) {

            alert("Código de coordenador inválido.");

            codigoInput.focus();

            return;
        }
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

        const usuarioRef = doc(db, "usuarios", user.uid);

        const usuarioDoc = await getDoc(usuarioRef);


        if (usuarioDoc.exists()) {
            const perfil = usuarioDoc.data();
            if (perfil.tipo && perfil.tipo !== "professor" && perfil.tipo !== "coordenador") {
                await signOut(auth);
                alert("Esta conta não possui perfil de professor.");
                return;
            }
            window.location.href = "../../Professor/Index.html";
        } else {
            await signOut(auth);
            alert("Esta conta não possui um perfil cadastrado.");
        }


        console.log(
            "Dados do usuário:",
            usuarioDoc.data()
        );


        // ==========================================
        // COORDENADOR
        // ==========================================

        if (entrouComoCoordenador) {

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

        window.location.href =
            PAGINA_PROFESSOR;


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

        const coorHead =
            document.getElementById("Coor-head");

        const codigoInput =
            document.getElementById(
                "Codigo-coordenador"
            );


        // Formulário de login
        if (form) {

            form.addEventListener(
                "submit",
                Formulario
            );
        }


        // Botão "Coordenador"
        if (coorHead) {

            coorHead.addEventListener(
                "click",
                () => {

                    toggleCoor();


                    // Coloca o cursor no código
                    // quando a área abrir
                    const box =
                        document.getElementById(
                            "Coor-box"
                        );


                    if (
                        box.classList.contains("ativo")
                    ) {

                        setTimeout(
                            () => {

                                if (codigoInput) {
                                    codigoInput.focus();
                                }

                            },
                            300
                        );
                    }
                }
            );
        }
    }
)
