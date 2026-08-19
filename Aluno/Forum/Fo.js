function Painel(){
    window.location.href = "/Aluno/Turma/index.html";
}
function MeuGrupo(){
    window.location.href = "/Aluno/Grupos/gp.html";
}
function Inspiracoes(){
    window.location.href = "";
}

function enviarFormulario(event) {
    event.preventDefault(); // Impede o recarregamento da página
    
    // Pega o texto da dúvida
    var duvida = document.getElementById('duvida').value.trim();
    
    // Valida se a dúvida não está vazia
    if (duvida === '') {
        alert('⚠️ Por favor, digite sua dúvida antes de enviar!');
        return;
    }
    
    // Simula o envio (aqui você pode substituir por um fetch para o backend)
    alert('✅ Dúvida enviada com sucesso!\n\n"' + duvida + '"');
    
    // Limpa o campo e fecha o bloco
    document.getElementById('duvida').value = '';
    fecharBloco('bloco-nova-duvida');
}

function abrirBloco(id) {
    var bloco = document.getElementById(id);
    
    // Se o bloco estiver escondido (display: none), mostra
    if (bloco.style.display === 'none' || bloco.style.display === '') {
        bloco.style.display = 'block';
    } else {
        // Se estiver visível, esconde
        bloco.style.display = 'none';
    }
}