import { auth, db } from "../firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { doc, getDoc, onSnapshot, collection, query, where, limit } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Monitorar o estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        carregarDadosUsuario(user.uid);
    } else {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    }
});

async function carregarDadosUsuario(uid) {
    const userDocRef = doc(db, "usuarios", uid);
    
    onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            atualizarInterface(userData);
            carregarGruposDaSala(userData.codigoSala, userData.uid);
        }
    });
}

function atualizarInterface(data) {
    const nomeElement = document.querySelector(".Usuario h4");
    const cursoElement = document.querySelector(".Usuario h5");
    const fotoElement = document.querySelector("#foto span");
    const tituloTurma = document.querySelector(".T1 h3 span");

    if (nomeElement) nomeElement.textContent = data.nome || "Usuário";
    if (cursoElement) cursoElement.textContent = data.curso || "Sem Curso";
    if (fotoElement) fotoElement.textContent = data.iniciais || "??";
    if (tituloTurma && data.codigoSala) tituloTurma.textContent = data.codigoSala;
}

async function carregarGruposDaSala(codigoSala, userUid) {
    const gruposContainer = document.querySelector(".Grupos");
    if (!gruposContainer) return;

    // Limpar grupos estáticos do HTML
    gruposContainer.innerHTML = "";

    // Buscar até 6 grupos que pertencem a esta sala
    const q = query(
        collection(db, "grupos"), 
        where("codigoSala", "==", codigoSala),
        limit(6)
    );

    onSnapshot(q, (querySnapshot) => {
        gruposContainer.innerHTML = ""; // Limpa para atualizar em tempo real

        if (querySnapshot.empty) {
            gruposContainer.innerHTML = "<p style='color: white;'>Nenhum grupo cadastrado nesta sala ainda.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const grupo = doc.data();
            const eMeuGrupo = grupo.membros && grupo.membros.includes(userUid);
            
            const grupoHTML = `
                <div class="GT">
                    <div class="sub-title-gp">
                        <div style="display: flex; gap: 20px; align-items: center;">
                            <h3>Grupo ${grupo.numero || ""}</h3> 
                            ${eMeuGrupo ? '<h1 style="font-size: small; background: #34d399; padding: 2px 8px; border-radius: 4px; color: white;">Meu Grupo</h1>' : ''}
                        </div>
                        <h2>${grupo.nomeProjeto || "Sem Título"}</h2>
                        <p>${grupo.descricao || "Sem descrição"}</p>
                        
                        <div class="GT-int">
                            <hr class="linha-decorativa">
                            ${(grupo.nomesMembros || []).map(membro => `
                                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                                    <div class="BL" style="background-color: #3D4D61;"></div>
                                    <p>${membro}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            gruposContainer.innerHTML += grupoHTML;
        });
    });
}

window.Voltar = () => {
    auth.signOut().then(() => {
        window.location.href = "/Inicial-tela/Login/Log-aluno.html";
    });
};
