// Forum/Fo.js

function abrirBloco(id) {
    var bloco = document.getElementById(id);
    if (bloco.style.display === 'none' || bloco.style.display === '') {
        bloco.style.display = 'block';
    } else {
        bloco.style.display = 'none';
    }
}

function enviarFormulario(event) {
    event.preventDefault();
    var duvida = document.getElementById('duvida').value.trim();
    if (duvida === '') {
        alert('⚠️ Por favor, digite sua dúvida antes de enviar!');
        return;
    }
    alert('✅ Dúvida enviada com sucesso!\n\n"' + duvida + '"');
    document.getElementById('duvida').value = '';
    fecharBloco('bloco-nova-duvida');
}

function fecharBloco(id) {
    document.getElementById(id).style.display = 'none';
}