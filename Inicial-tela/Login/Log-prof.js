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

        console.error(error);
        alert(error.message);

    }

}

document.addEventListener('DOMContentLoaded', () => {

    const form = document.querySelector('form');

    if(form){
        form.addEventListener('submit', Formulario);
    }

});

/*function Formulario (event){
    //Impede que seja enviado por padrão do formulario, ou seja, impede que a página seja recarregada
    event.preventDefault();
    //Obtém os valores do email e senha dos campos de entrada
    const email = document.querySelector("#Email input").value;
    const senha = document.querySelector("#Senha input").value;

    //Validação do email e senha, aqui é onde você pode adicionar a lógica para verificar as credenciais do usuário

    
    if (email === "" || senha === "") {
        alert("Por favor, preencha todos os campos.");
        if (email === "") {
            document.querySelector("#Email input").style.border = "1px solid red";
        } else {
            document.querySelector("#Email input").style.border = "none"; // Restaura a cor original se o campo for preenchido
        }
        if (senha === "") {
            document.querySelector("#Senha input").style.border = "1px solid red";
        } else {
            document.querySelector("#Senha input").style.border = "none";
        }
        return false; // Impede o envio do formulário
    }
     if (senha.length < 8) {
        alert("A senha deve conter no mínimo 8 caracteres.");
        document.querySelector("#Senha input").style.border = "1px solid red"; 
        return false;
    }
    else {
        document.querySelector("#Senha input").style.border = "none"; // Restaura a cor original se a senha for válida
    }
    if (email.includes("@professor.cps.sp.gov.br")) {
        // Extrai o prefixo (antes do @)
        const prefixo = email.split("@")[0];
        const partes = prefixo.split(".");

        // Verifica se tem exatamente duas partes (Nome.Sobrenome)
        let iniciais = "";

        if (partes.length === 2) {
            iniciais = partes[0].charAt(0).toUpperCase() + partes[1].charAt(0).toUpperCase();
        }
        
        // Pega o nome do usuário (antes do primeiro ponto)
        let nomeUsuario = "";
        if (prefixo.includes(".")) {
            nomeUsuario = prefixo.split(".")[0];
        } else {
            nomeUsuario = prefixo; // Se não tem ponto, pega o prefixo todo
        }
        
        // Salva no localStorage
        localStorage.setItem("iniciaisUsuario", iniciais);
        localStorage.setItem("nomeUsuario", nomeUsuario);
        
        alert("Bem-vindo!");
        window.location.href = "/Professor/Index.html";

    } else {
        alert("Email inválido. Use um email @professor.cps.sp.gov.br");
        return;
    }
} */
