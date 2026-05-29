

window.Entraralpr = function () {
    window.location.href = "/Professor/index.html";
}

window.Logar = function () {
    window.location.href = "/Inicial-tela/Login/Log-aluno.html";
}

document.getElementById("formCadastro").addEventListener("submit", Formulario);

async function Formulario(event) {
    event.preventDefault();

    // Capturando os valores usando seus IDs originais
    const nome = document.getElementById("Nome-da-pessoa").value;
    const email = document.getElementById("Email").value;
    const senha = document.getElementById("Senha").value;
    const repitaSenha = document.getElementById("RepitaSenha").value;
    const codigo = document.getElementById("Codigo-da-pessoa").value;

    // --- VALIDAÇÕES ORIGINAIS ---
    if (!nome || !email || !senha || !repitaSenha || !codigo) {
        alert("Preencha todos os campos!");
        return;
    }

    if (senha !== repitaSenha) {
        alert("As senhas não coincidem!");
        document.getElementById("Senha").style.border = "1px solid red";
        document.getElementById("RepitaSenha").style.border = "1px solid red";
        document.getElementById("RepitaSenha").focus();
        return;
    }

    if (senha.length < 8) {
        alert("Senha mínima de 8 caracteres!");
        document.getElementById("Senha").style.border = "1px solid red";
        document.getElementById("Senha").focus();
        return;
    }

    // --- DEFINIR TIPO (Sua lógica institucional) ---
    let tipo = "";
    if (email.includes("@aluno.cps.sp.gov.br")) {
        tipo = "aluno";
    } else if (email.includes("@professor.cps.sp.gov.br")) {
        tipo = "professor";
    } else {
        alert("Use um email institucional válido!");
        return;
    }

    // --- LÓGICA DE INICIAIS ---
    const prefixo = email.split("@")[0];
    const partes = prefixo.split(".");
    let iniciais = "";
    if (partes.length >= 2) {
        iniciais = partes[0][0].toUpperCase() + partes[1][0].toUpperCase();
    } else {
        iniciais = nome.substring(0, 2).toUpperCase(); // Fallback caso o email não tenha ponto
    }

}
