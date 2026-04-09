console.log("Arquivo JS carregou com sucesso!"); // TESTE

function Entraralpr(){   
    window.location.href = "../../Professor/index.html";
}
function Logar(){
    window.location.href = "../Login/index.html";
}
function Formulario (event){
    // Pega as informações dos inputs que tem required (todos)
    const campos = document.querySelectorAll("input[required]");
    let camposVazios = false;
    // Vai verificar se tem algum campo vazio
    campos.forEach((campo) => {
        if(campo.value === ""){
            camposVazios = true;
            campo.style.border = "1px solid red"; //Vai destacar em vermelho campo que está vazio
        }
        else{
            campo.style.border = "none"; // É para caso ele não esteja não vai colocar nada
        }
    });
     if (camposVazios) {
        alert("Por favor, preencha todos os campos obrigatórios!");
        event.preventDefault(); // impede o envio do formulário
        return false;
    }
    if (senha !== repitaSenha) {
        alert("As senhas não coincidem. Por favor, tente novamente.");
        document.querySelector("#Repita-senha input").style.border = "1px solid red";
        event.preventDefault(); // impede o envio do formulário
        return false;
    }
}
    