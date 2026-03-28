function Entrar(){
    window.location.href = "../../Aluno/Turma.html";
}
function Professor(){
    window.location.href = "Log-Prof.html";
}
function Cadastrar(){
    window.location.href = "../Cadastro/Cad.html";
}

function Formulario (event){
    //Impede que seja enviado por padrão do formulario, ou seja, impede que a página seja recarregada
    event.preventDefault();
    //Obtém os valores do email e senha dos campos de entrada
    const email = document.querySelector("#Email input").value;
    const senha = document.querySelector("#Senha input").value;

    //Validação do email e senha, aqui é onde você pode adicionar a lógica para verificar as credenciais do usuário

    if (email === "" || senha === "") {
        alert("Por favor, preencha todos os campos.");
        if (email === "") {
            document.querySelector("#Email input").style.borderColor = "1px solid red";
        } else {
            document.querySelector("#Email input").style.borderColor = "none"; // Restaura a cor original se o campo for preenchido
        }
        if (senha === "") {
            document.querySelector("#Senha input").style.borderColor = "1px solid red";
        } else {
            document.querySelector("#Senha input").style.borderColor = "none"; // Restaura a cor original se o campo for preenchido
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

    if (email.includes("@Etec.sp.gov.br") || email === "Aluno.106@Etec.sp.gov.br") {   //Aqui é para validar onde vai dependendo do email que você colocou
        window.location.href = "../../Aluno/Turma.html";
    } else if (email.includes("@Etec.sp.gov.br") || email === "Professor.106@Etec.sp.gov.br") {
        window.location.href = "../../Professor/Index.html";
    } else {
        alert("Email ou senha incorretos. Por favor, tente novamente.");
    } 
    return true; // Permite o envio do formulário
}