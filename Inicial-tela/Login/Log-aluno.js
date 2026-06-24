import { auth, db } from "../../firebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
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
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (email === "" || senha === "") {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            localStorage.setItem("iniciaisUsuario", userData.iniciais);
            localStorage.setItem("tipoUsuario", userData.tipo);
            
            alert("Login realizado com sucesso!");

            if (userData.tipo === "professor") {
                window.location.href = "/Professor/Index.html";
            } else {
                window.location.href = "/Aluno/Turma.html";
            }
        } else {
            alert("Dados do usuário não encontrados.");
        }

    } catch (error) {
        alert("Erro ao entrar: Verifique suas credenciais.");
    }
}
