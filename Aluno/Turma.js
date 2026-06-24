import { auth, db } from "../firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc, onSnapshot, collection, query, where, limit } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// 1. MONITORAMENTO DE SESSÃO E ACESSIBILIDADE
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Usuário autenticado:", user.uid);
        carregarEstadoSistema(user.uid);
    } else {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
});

async function carregarEstadoSistema(uid) {
    const userDocRef = doc(db, "usuarios", uid);
    
    // Escutar mudanças no perfil (incluindo acessibilidade e cargo)
    onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            aplicarAcessibilidade(userData);
            atualizarInterfacePerfil(userData);
            carregarGruposDinamicamente(userData.codigoSala, userData.uid);
        }
    });
}

// 2. ACESSIBILIDADE (Conforme documento do TCC)
function aplicarAcessibilidade(data) {
    // Aplicar tema, fonte e tamanho de letra salvos no Firebase
    if (data.configuracoes) {
        const { tema, tamanhoFonte, tipoFonte } = data.configuracoes;
        if (tema) document.body.className = tema; // 'dark-mode' ou 'light-mode'
        if (tamanhoFonte) document.documentElement.style.fontSize = tamanhoFonte + 'px';
        if (tipoFonte) document.body.style.fontFamily = tipoFonte;
    }
}

// 3. INTERFACE DE PERFIL
function atualizarInterfacePerfil(data) {
    const nomeEl = document.querySelector(".Usuario h4");
    const cursoEl = document.querySelector(".Usuario h5");
    const iniciaisEl = document.querySelector("#foto span");
    const fotoContainer = document.querySelector("#foto");
    const tituloTurmaEl = document.querySelector(".T1 h3 span");

    // Remover skeleton ao receber dados
    [nomeEl, cursoEl, iniciaisEl, fotoContainer].forEach(el => {
        if (el) el.classList.remove("skeleton");
    });

    if (nomeEl) nomeEl.textContent = data.nome || "Usuário";
    if (cursoEl) cursoEl.textContent = data.curso || "Sem Curso";
    if (iniciaisEl) iniciaisEl.textContent = data.iniciais || "??";
    if (tituloTurmaEl && data.codigoSala) tituloTurmaEl.textContent = data.codigoSala;
}

// Aplicar skeleton inicialmente
document.addEventListener("DOMContentLoaded", () => {
    const nomeEl = document.querySelector(".Usuario h4");
    const cursoEl = document.querySelector(".Usuario h5");
    const iniciaisEl = document.querySelector("#foto span");
    const fotoContainer = document.querySelector("#foto");

    [nomeEl, cursoEl, iniciaisEl, fotoContainer].forEach(el => {
        if (el) el.classList.add("skeleton");
    });
});

// 4. GESTÃO DE GRUPOS EM TEMPO REAL
async function carregarGruposDinamicamente(codigoSala, userUid) {
    const gruposContainer = document.querySelector(".Grupos");
    if (!gruposContainer) return;

    // Query otimizada: Busca grupos da sala específica
    const q = query(
        collection(db, "grupos"), 
        where("codigoSala", "==", codigoSala),
        limit(6)
    );

    // OUVINTE EM TEMPO REAL: Se o líder mudar algo, todos veem na hora
    onSnapshot(q, (snapshot) => {
        gruposContainer.innerHTML = ""; 

        if (snapshot.empty) {
            gruposContainer.innerHTML = "<p style='color: white; padding: 20px;'>Aguardando a criação dos grupos pelo coordenador...</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const grupo = doc.data();
            const eMembro = grupo.membros && grupo.membros.includes(userUid);
            const eLider = grupo.liderUid === userUid;
            
            const grupoCard = `
                <div class="GT" style="border: ${eMembro ? '2px solid #34d399' : 'none'}">
                    <div class="sub-title-gp">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3>Grupo ${grupo.numero}</h3>
                            ${eLider ? '<span style="background: #fbbf24; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">LÍDER</span>' : ''}
                        </div>
                        <h2>${grupo.nomeProjeto || "Projeto em Definição"}</h2>
                        <p>${grupo.descricao || "Sem descrição disponível."}</p>
                        
                        <div class="GT-int">
                            <hr class="linha-decorativa">
                            <div class="lista-membros">
                                ${(grupo.nomesMembros || []).map(nome => `
                                    <div style="display: flex; align-items: center; margin-bottom: 4px;">
                                        <div class="BL" style="background-color: ${eMembro ? '#34d399' : '#3D4D61'};"></div>
                                        <p style="font-size: 13px;">${nome}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            gruposContainer.innerHTML += grupoCard;
        });
    });
}

// 5. NAVEGAÇÃO E LOGOUT
window.Voltar = () => {
    auth.signOut().then(() => {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    });
};
