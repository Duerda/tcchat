console.log("Arquivo JS carregou com sucesso!"); // TESTE

function Entraralpr() {
    window.location.href = "/Professor/index.html";
}
function Logar() {
    window.location.href = "/index.html";
}
function traduzirCurso(codigo) {
    const cursos = {
        "TMA": "Técnico em Meio Ambiente",
        "DS": "Desenvolvimento de Sistemas",
        "ADM": "Administração",
        "SRC": "Secretariado",
        "TDS": "Técnico de Design de Interiores"
    };
    return cursos[codigo.toUpperCase()] || codigo;
}

async function Formulario(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const campos = document.querySelectorAll("input[required]");
    let camposVazios = false;

    campos.forEach((campo) => {
        if (campo.value === "") {
            camposVazios = true;
            campo.style.border = "1px solid red";
        } else {
            campo.style.border = "none";
        }
    });

    if (camposVazios) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return false;
    }

    const nome = document.getElementById("Nome-da-pessoa").value;
    const email = document.getElementById("Email").value;
    const senha = document.getElementById("Senha").value;
    const repitaSenha = document.getElementById("RepitaSenha").value;
    const codigoCurso = document.getElementById("Codigo-da-pessoa").value;

    if (senha !== repitaSenha) {
        alert("As senhas não coincidem. Por favor, tente novamente.");
        const campoRepetir = document.getElementById("RepitaSenha");
        campoRepetir.style.border = "1px solid red";
        campoRepetir.focus();
        return false;
    }

    // Preparar dados para enviar para a API
    const dados = {
        nome: nome,
        email: email,
        senha: senha,
        codigo: codigoCurso
    };

    try {
        // Enviar dados para a Vercel Serverless Function
        const response = await fetch('/api/cadastro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            const resultado = await response.json();
            console.log("Sucesso:", resultado);

            // Lógica de iniciais e redirecionamento
            const prefixo = email.split("@")[0];
            const partes = prefixo.split(".");
            let iniciais = "";
            if (partes.length >= 2) {
                iniciais = partes[0].charAt(0).toUpperCase() + partes[1].charAt(0).toUpperCase();
            } else {
                iniciais = nome.charAt(0).toUpperCase() + (partes[0].charAt(1) || "").toUpperCase();
            }

            localStorage.setItem("iniciaisUsuario", iniciais);
            localStorage.setItem("usuarioLogado", JSON.stringify(resultado.user));

            if (email.includes("@Professor.cps.sp.gov.br")) {
                window.location.href = "/Professor/Index.html";
            } else if (email.includes("@Aluno.cps.sp.gov.br")) {
                window.location.href = "/Aluno/Turma.html";
            } else {
                alert("Cadastro realizado! Use um e-mail institucional para acessar as áreas restritas.");
            }
        } else {
            const erro = await response.json();
            alert("Erro no cadastro: " + (erro.error || "Tente novamente mais tarde."));
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro ao conectar com o servidor. Verifique sua conexão.");
    }
}
