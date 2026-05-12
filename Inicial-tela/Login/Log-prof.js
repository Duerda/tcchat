


const SUPABASE_URL = "https://ktnlazcmojcrzxspggyf.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_NT8jHzUdqXM8lgL2Pfn2UQ_1W0IzCWH"; 



window.Entrar = function(){
    window.location.href = "/Professor/Index.html";
}
window.Aluno = function(){
    window.location.href = "Log-aluno.html";
}
window.Cadastrar = function (){
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
        //Login com Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: senha,
        });

        if (error) {
            alert("Erro: " + error.message);
            return;
        }

        alert("Bem-vindo!");
        window.location.href = "/Professor/Index.html";

    } else {
        alert("Email inválido. Use um email @professor.cps.sp.gov.br");
        return;
    }
}