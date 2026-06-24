import { auth, db } from "../../firebaseConfig.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

window.Professor = function () {
    window.location.href = "/Inicial-tela/Login/Log-Prof.html";
};

window.Cadastrar = function () {
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', Formulario);
    }
});

async function Formulario(event) {
    event.preventDefault();

    const emailInput = document.querySelector("#Email input");
    const senhaInput = document.querySelector("#Senha input");
    
    if (!emailInput || !senhaInput) {
        console.error("Campos de entrada não encontrados!");
        return;
    }

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (email === "" || senha === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        // 1. Tentar autenticar no Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // 2. VERIFICAÇÃO CRUCIAL: Checar se o usuário existe no Banco de Dados (Firestore)
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Salvar dados básicos para uso rápido (opcional, já que usamos Firestore)
            localStorage.setItem("iniciaisUsuario", userData.iniciais);
            localStorage.setItem("tipoUsuario", userData.tipo);
            localStorage.setItem("codigoSala", userData.codigoSala);
            
            alert("Login realizado com sucesso!");

            // Redirecionamento baseado no tipo
            if (userData.tipo === "professor") {
                window.location.href = "/Professor/Index.html";
            } else {
                window.location.href = "/Aluno/Turma.html";
            }
        } else {
            // SE NÃO EXISTE NO BANCO, DESLOGA E NEGA O ACESSO
            await signOut(auth);
            alert("ERRO: Esta conta não possui um perfil registrado no sistema. Entre em contato com o administrador.");
        }

    } catch (error) {
        console.error("Erro de login:", error.code);
        if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
            alert("E-mail ou senha incorretos.");
        } else {
            alert("Erro ao entrar: " + error.message);
        }
    }
}
