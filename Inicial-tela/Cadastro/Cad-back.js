window.Entraralpr = function () {
    window.location.href = "/Professor/index.html";
};

window.Logar = function () {
    window.location.href = "/Inicial-tela/Login/Log-aluno.html";
};

document.getElementById("formCadastro").addEventListener("submit", Formulario);

function Formulario(event) {
    event.preventDefault();

    const nome = document.getElementById("Nome-da-pessoa").value.trim();
    const email = document.getElementById("Email").value.trim();
    const senha = document.getElementById("Senha").value;
    const repitaSenha = document.getElementById("RepitaSenha").value;
    const codigo = document.getElementById("Codigo-da-pessoa").value.trim();

    // Remove bordas vermelhas anteriores
    document.getElementById("Senha").style.border = "";
    document.getElementById("RepitaSenha").style.border = "";
    document.getElementById("Codigo-da-pessoa").style.border = "";

    // VALIDAÇÃO DOS CAMPOS
    if (!nome || !email || !senha || !repitaSenha || !codigo) {
        alert("Preencha todos os campos!");
        return;
    }

    // VALIDAÇÃO DE SENHA
    if (senha !== repitaSenha) {
        alert("As senhas não coincidem!");

        document.getElementById("Senha").style.border = "1px solid red";
        document.getElementById("RepitaSenha").style.border = "1px solid red";
        document.getElementById("RepitaSenha").focus();

        return;
    }

    if (senha.length < 8) {
        alert("A senha deve ter no mínimo 8 caracteres!");

        document.getElementById("Senha").style.border = "1px solid red";
        document.getElementById("Senha").focus();

        return;
    }

    // DEFINIR TIPO DE USUÁRIO
    let tipo = "";

    if (email.endsWith("@aluno.cps.sp.gov.br")) {
        tipo = "aluno";
    } else if (email.endsWith("@professor.cps.sp.gov.br")) {
        tipo = "professor";
    } else {
        alert("Use um e-mail institucional válido!");
        return;
    }

    // GERAR INICIAIS
    const prefixo = email.split("@")[0];
    const partes = prefixo.split(".");
    let iniciais = "";

    if (partes.length >= 2) {
        iniciais =
            partes[0].charAt(0).toUpperCase() +
            partes[1].charAt(0).toUpperCase();
    } else {
        iniciais = prefixo.substring(0, 2).toUpperCase();
    }

    // SALVAR NO LOCAL STORAGE
    localStorage.setItem("iniciaisUsuario", iniciais);
    localStorage.setItem("tipoUsuario", tipo);
    localStorage.setItem("codigoCurso", codigo);

    alert("Cadastro realizado com sucesso!");

    // REDIRECIONAMENTO
    if (tipo === "professor") {
        window.location.href = "../../Professor/index.html";
    } else {
        window.location.href = "../../Aluno/Turma.html";
    }
}
