
function abrirBloco(id) {
    var bloco = document.getElementById(id);
    
    if (bloco.style.display === 'none' || bloco.style.display === '') {
        bloco.style.display = 'block';
    } else {
        bloco.style.display = 'none';
    }
}

function fecharBloco(id) {
    var bloco = document.getElementById(id);
    bloco.style.display = 'none';
}

function enviarDuvida(event) {
    event.preventDefault();
    
    var duvida = document.getElementById('duvida').value.trim();
    
    if (duvida === '') {
        alert('Por favor, digite sua dúvida antes de enviar!');
        return;
    }
    
    alert('Dúvida enviada com sucesso!\n\n"' + duvida + '"');
    
    document.getElementById('duvida').value = '';
    fecharBloco('bloco-nova-duvida');
}

document.addEventListener('click', function(event) {
    var bloco = document.getElementById('bloco-nova-duvida');
    var botao = document.getElementById('btn-duvida');
    
    if (bloco.style.display === 'block' && 
        !bloco.contains(event.target) && 
        event.target !== botao) {
        bloco.style.display = 'none';
    }
});