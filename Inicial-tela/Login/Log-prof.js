function Entrar(){
    window.location.href = "../../Professor/index.html";
}
function Aluno(){
    window.location.href = "index.html";
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
            document.querySelector("#Senha input").style.borderColor = "none";
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

     if (email.includes("@Professor.cps.sp.gov.br")) {
        // Extrai o prefixo (antes do @)
        const prefixo = email.split("@")[0];
        const partes = prefixo.split(".");

        // Verifica se tem exatamente duas partes (Nome.Sobrenome)
        let iniciais = "";
        if (partes.length === 2) {
            iniciais = partes[0].charAt(0).toUpperCase() + partes[1].charAt(0).toUpperCase();
        }
    localStorage.setItem("iniciaisUsuario", iniciais); // Salvo imediatamente
    window.location.href = "../../Professor/Index.html"; // Redireciona depois
    } else {
        alert("Email ou senha incorretos. Por favor, tente novamente.");
    }
}