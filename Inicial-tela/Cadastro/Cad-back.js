
console.log("Arquivo JS carregou com sucesso!"); // TESTE

function Entraralpr() {
    window.location.href = "/Professor/index.html";
}
function Logar() {
    window.location.href = "/Inicial-tela/Login/Log-aluno.html";
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
function extrairInfoCodigo(codigoCompleto) {
    // Remove espaços extras e converte para maiúsculo
    codigoCompleto = codigoCompleto.trim().toUpperCase();
    
    // Divide o código pelo hífen
    const partes = codigoCompleto.split('-');
    
    if (partes.length === 3) {
        const curso = partes[0];      // Ex: "DS"
        const ano = partes[1];        // Ex: "2026"
        const estado = partes[2];     // Ex: "PR" ou "AL"
        
        return {
            curso: curso,
            ano: ano,
            estado: estado,
            completo: true
        };
    }
    
    return {
        completo: false,
        curso: codigoCompleto,
        estado: null
    };
}
function Formulario(event) {
    // Pega as informações dos inputs que tem required (todos)
    const campos = document.querySelectorAll("input[required]");
    let camposVazios = false;
    // Vai verificar se tem algum campo vazio
    campos.forEach((campo) => {
        event.preventDefault(); // Impede o envio do formulário para verificar os campos
        if (campo.value === "") {
            camposVazios = true;
            campo.style.border = "1px solid red"; //Vai destacar em vermelho campo que está vazio
        }
        else {
            campo.style.border = "none"; // É para caso ele não esteja não vai colocar nada
        }

    });
    const senha = document.getElementById("Senha").value;
    const repitaSenha = document.getElementById("RepitaSenha").value;
    if (senha !== repitaSenha) {
        alert("As senhas não coincidem. Por favor, tente novamente.");
        const campoRepetir = document.getElementById("RepitaSenha"); campoRepetir.style.border = "1px solid red";
        campoRepetir.focus(); // Coloca o cursor no campo errado
        event.preventDefault(); // Impede o envio do formulário
        return false;
    }  

    const email = document.querySelector("#Email input").value;
    const codigoCurso = document.getElementById("Codigo-da-pessoa").value;

    const nomeCursoTraduzido = traduzirCurso(codigoCurso);
    if (email.includes("@professor.cps.sp.gov.br")) {
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
    }
    else if (email.includes("@aluno.cps.sp.gov.br")) {
         // Extrai o prefixo (antes do @)
        const prefixo = email.split("@")[0];
        const partes = prefixo.split(".");

        // Verifica se tem exatamente duas partes (Nome.Sobrenome)
        let iniciais = "";
        if (partes.length === 2) {
            iniciais = partes[0].charAt(0).toUpperCase() + partes[1].charAt(0).toUpperCase();
        } 
    localStorage.setItem("iniciaisUsuario", iniciais); // Salvo imediatamente
    window.location.href = "../../Aluno/Turma.html"; // Redireciona depois
    }
}
