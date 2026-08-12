import { auth, db } from "../../backend/firebase/config.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

window.Aluno = function () {
    window.location.href = "/Inicial-tela/Login/Log-aluno.html";
};
window.Cadastrar = function () {
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
}

function toggleCoor() {
    const box = document.getElementById("Coor-box");
    const seta = document.getElementById("seta");

    box.classList.toggle("ativo");

    seta.style.transform = box.classList.contains("ativo")
        ? "rotate(180deg)"
        : "rotate(0deg)";
}

async function Formulario(event) {

    event.preventDefault();

    const emailInput = document.getElementById("E-mail");
    const senhaInput = document.getElementById("Senhas");

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    try {

        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );


        const user = userCredential.user;

        console.log("Usuário autenticado:");
        console.log(user);


        const usuarioRef = doc(db, "usuarios", user.uid);

        const usuarioDoc = await getDoc(usuarioRef);


        console.log("Documento existe?");
        console.log(usuarioDoc.exists());


        if(usuarioDoc.exists()){

            console.log(usuarioDoc.data());

            window.location.href="/Professor/Index.html";

        }


    } catch(error){
        console.error("Erro de Login:", error);
        if (
            error.code === "auth/user-not-found" ||
             error.code === "auth/wrong-password" ||
              error.code === "auth/invalid-credential") {
            alert("E-mail ou senha incorretos.");
        } else {
            alert("Erro ao entrar: " + error.message);
        }
    }

}

document.addEventListener('DOMContentLoaded', () => {

    const form = document.querySelector('form');

    if(form){
        form.addEventListener('submit', Formulario);
    }

});
