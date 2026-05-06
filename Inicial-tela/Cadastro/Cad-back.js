
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://ktnlazcmojcrzxspggyf.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_NT8jHzUdqXM8lgL2Pfn2UQ_1W0IzCWH"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY );

window.Entraralpr = function () {
    window.location.href = "/Professor/index.html";
}
window.Logar = function () {
    window.location.href = "/Inicial-tela/Login/Log-aluno.html";
}
document.getElementById("formCadastro").addEventListener("submit", Formulario);
async function Formulario(event) {
    event.preventDefault();

    const nome = document.getElementById("Nome-da-pessoa").value;
    const email = document.getElementById("Email").value;
    const senha = document.getElementById("Senha").value;
    const repitaSenha = document.getElementById("RepitaSenha").value;
    const codigo = document.getElementById("Codigo-da-pessoa").value;

    // VALIDAÇÕES
    if (!nome || !email || !senha || !repitaSenha || !codigo) {
        alert("Preencha todos os campos!");
        return;
    }

    if (senha !== repitaSenha) {
        alert("As senhas não coincidem!");
        return;
    }

    if (senha.length < 8) {
        alert("Senha mínima de 8 caracteres!");
        return;
    }

    // DEFINIR TIPO
    let tipo = "";

    if (email.includes("@aluno.cps.sp.gov.br")) {
        tipo = "aluno";
    } else if (email.includes("@professor.cps.sp.gov.br")) {
        tipo = "professor";
    } else {
        alert("Use um email institucional válido!");
        return;
    }

    // INICIAIS
    const prefixo = email.split("@")[0];
    const partes = prefixo.split(".");
    let iniciais = "";

    if (partes.length === 2) {
        iniciais = partes[0][0].toUpperCase() + partes[1][0].toUpperCase();
    }

    // CADASTRAR NO SUPABASE
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: senha,
        options: {
            data: {
                nome: nome,
                tipo: tipo,
                codigo: codigo
            }
        }
    });

    if (error) {
        alert("Erro: " + error.message);
        return;
    }

    // LOCAL STORAGE
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
