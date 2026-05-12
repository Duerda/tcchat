

const SUPABASE_URL = "https://ktnlazcmojcrzxspggyf.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_NT8jHzUdqXM8lgL2Pfn2UQ_1W0IzCWH"; 


window.Entrar = function (){
    window.location.href = "/Aluno/Turma.html";
}

window.Professor = function (){
    window.location.href = "Log-Prof.html";
}

window.Cadastrar = function (){
    window.location.href = "/Inicial-tela/Cadastro/Cad.html";
}

async function Formulario (event){
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
            document.querySelector("#Email input").style.border = "none";
        }
        if (senha === "") {
            document.querySelector("#Senha input").style.border = "1px solid red";
        } else {
            document.querySelector("#Senha input").style.border = "none";
        }
        return;
    }

    if (senha.length < 8) {
        alert("A senha deve conter no mínimo 8 caracteres.");
        document.querySelector("#Senha input").style.border = "1px solid red"; 
        return;
    } else {
        document.querySelector("#Senha input").style.border = "none";
    }

    if (email.includes("@aluno.cps.sp.gov.br")) {
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
            nomeUsuario = prefixo;
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
        window.location.href = "/Aluno/Turma.html";

    } else {
        alert("Email inválido. Use um email @aluno.cps.sp.gov.br");
        return;
    }
}
