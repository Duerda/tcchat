function Voltar()       { window.location.href = "/Inicial-tela/Cadastro/Cad.html"; }
function Turmas()       { window.location.href = "/Aluno/Turma.html"; }
function Grupo()        { window.location.href = "/Aluno/Grupo.html"; }
function Forum()        { window.location.href = "/Aluno/Forum.html"; }
function Inspiracoes()  { window.location.href = "/Aluno/Inspi.html"; }
function Configuracoes(){ window.location.href = "/Aluno/Config.html"; }

const INSPI = [
    { id:1, titulo:'SmartCampus', sub:'Reserva de salas acadêmicas', ano:'2024.2', tipo:'web', label:' Web', cor:'#3b82f6', ideia:'Sem sala para reunião toda semana. Em 2h tinham o MVP desenhado.', detalhes:'React + Node.js + PostgreSQL. QR Code para check-in. Adotado pelo campus.', team:['Felipe Cruz','Mariana Lopes'], curso:'DS · 2024.2', mark:true, markText:'Adotado pelo campus ' },
    { id:2, titulo:'AgroSense', sub:'Monitoramento de umidade para estufas', ano:'2024.1', tipo:'embarcados', label:' Embarcados', cor:'#34d399', ideia:'O pai de um integrante perdia plantações inteiras. A dor real da família virou o TCC.', detalhes:'Arduino + DHT22. Dashboard Python. Alertas WhatsApp. Custo: R$187.', team:['Bruno Carvalho','Letícia Maia'], curso:'ES · 2024.1', mark:true, markText:'Menção honrosa ' },
    { id:6, titulo:'NeuroAcessível', sub:'Interface adaptativa para TEA', ano:'2023.1', tipo:'software', label:' Software', cor:'#ec4899', ideia:'Integrante tem irmão com TEA. Dois meses em escola especial antes de escrever código.', detalhes:'Electron + eye-tracking via webcam. Prêmio regional de acessibilidade.', team:['Renata Oliveira','Marcos Paulo'], curso:'DS · 2023.1', mark:true, markText:'Prêmio acessibilidade ' },
];

const avColors = ['#3b82f6','#34d399','#f87171','#a78bfa','#fbbf24','#06b6d4'];
let filtroAtivo = 'todos';
let buscaAtiva  = '';

function renderInspi() {
    const grid = document.getElementById('inspi-grid');
    let data = INSPI;
    if (filtroAtivo !== 'todos') data = data.filter(d => d.tipo === filtroAtivo);
    if (buscaAtiva.trim()) {
        const q = buscaAtiva.toLowerCase();
        data = data.filter(d =>
            d.titulo.toLowerCase().includes(q) ||
            d.sub.toLowerCase().includes(q) ||
            d.ideia.toLowerCase().includes(q)
        );
    }
    if (!data.length) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:32px; color:#3d4d61; font-size:13px;">Nenhum TCC encontrado.</div>';
        return;
    }
    grid.innerHTML = data.map(d => `
        <div class="inspi-card" id="ins-${d.id}" onclick="toggleInspi(${d.id})">
            <div class="inspi-banner" style="background:linear-gradient(90deg,${d.cor},${d.cor}88);"></div>
            <div class="inspi-body">
                <div class="inspi-topo">
                    <span class="inspi-ano" style="background:${d.cor}22; color:${d.cor}; border:1px solid ${d.cor}44;">${d.ano}</span>
                    <span class="inspi-tipo">${d.label}</span>
                </div>
                <div class="inspi-titulo">${d.titulo}</div>
                <div class="inspi-sub">${d.sub}</div>
                <div class="inspi-ideia">
                    <div class="inspi-ideia-lbl" style="color:${d.cor};"> Como surgiu a ideia</div>
                    <div class="inspi-ideia-txt">${d.ideia}</div>
                </div>
                <div class="inspi-team">
                    
                    <div style="margin-left:8px; flex:1;">
                        <div class="inspi-nomes">${d.team.join(' · ')}</div>
                        <div class="inspi-curso">${d.curso}</div>
                    </div>
                    ${d.mark ? `<div class="inspi-mark">${d.markText}</div>` : ''}
                </div>
            </div>
            <div class="inspi-expand">
                <div class="inspi-expand-box">
                    <div class="inspi-expand-lbl"> Detalhes técnicos</div>
                    ${d.detalhes}
                </div>
            </div>
        </div>`).join('');
}

function toggleInspi(id) {
    document.getElementById('ins-' + id).classList.toggle('expandido');
}

function setFiltro(tipo, el) {
    filtroAtivo = tipo;
    document.querySelectorAll('.filtro').forEach(f => f.classList.remove('ativo'));
    el.classList.add('ativo');
    renderInspi();
}

function filtrarInspi() {
    buscaAtiva = document.getElementById('busca-inp').value;
    renderInspi();
}

document.addEventListener('DOMContentLoaded', function () {
    renderInspi();
    document.getElementById("foto").querySelector("span").textContent =
        localStorage.getItem("iniciaisUsuario") || "";
    document.getElementById("NomeUC").querySelector("h4").textContent =
        localStorage.getItem("nomeUsuario") || "";
    const cursos = {
        "TMA": "Técnico em Meio Ambiente", "DS": "Desenvolvimento de Sistemas",
        "ADM": "Administração", "SRC": "Secretariado", "TDS": "Técnico de Design de Interiores"
    };
    document.getElementById("NomeUC").querySelector("h5").textContent =
        cursos[localStorage.getItem("codigoCurso")] || "";
});