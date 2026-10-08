import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "/backend/firebase/config.js";
import { fillHeader, logout, navigate, requireProfessor } from "/backend/firebase/professor.js";

window.Voltar = logout;
window.VisaoGeral = () => navigate("../Index.html");
window.Avaliacoes = () => navigate("ava.html");
window.Biblioteca = () => navigate("../Biblioteca/Bib.html");
window.Grupos = () => navigate("../Grupos/grp.html");
window.Forum = () => navigate("../Forum/Avisos.html");
window.Configuracoes = () => navigate("../Configuracoes/Config.html");

const groupSelect = document.getElementById("grupo-avaliacao");
const form = document.getElementById("form-avaliacao");
const feedback = document.getElementById("feedback");
const note = document.getElementById("nota");
const history = document.getElementById("historico-avaliacoes");

window.Cadastrar = () => {
  history?.scrollIntoView({ behavior: "smooth" });
};

function renderHistory(snapshot) {
  if (!history) return;
  history.innerHTML = "";
  snapshot.forEach((item) => {
    const data = item.data();
    const row = document.createElement("div");
    row.className = "avaliacao-historico";
    row.textContent = `${data.grupoNome || data.grupoId || "Grupo"}: ${data.nota}/10 — ${data.feedback || "Sem feedback"}`;
    history.appendChild(row);
  });
}

requireProfessor((user, profile) => {
  fillHeader(profile);
  if (!profile.codigoSala) return;
  const groupsQuery = query(collection(db, "grupos"), where("codigoSala", "==", profile.codigoSala));
  onSnapshot(groupsQuery, (snapshot) => {
    if (groupSelect) {
      groupSelect.innerHTML = '<option value="">Selecione o grupo</option>';
      snapshot.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.data().nome || `Grupo ${item.id}`;
        groupSelect.appendChild(option);
      });
    }
  });

  const evaluationsQuery = query(collection(db, "avaliacoes"), where("professorUid", "==", user.uid));
  onSnapshot(evaluationsQuery, renderHistory);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const groupId = groupSelect?.value;
    const value = Number(note?.value);
    const text = feedback?.value.trim();
    if (!groupId || !Number.isFinite(value) || value < 0 || value > 10 || !text) {
      alert("Selecione um grupo, informe uma nota entre 0 e 10 e escreva o feedback.");
      return;
    }
    try {
      const selected = groupSelect.options[groupSelect.selectedIndex];
      await addDoc(collection(db, "avaliacoes"), {
        grupoId,
        grupoNome: selected.textContent,
        professorUid: user.uid,
        professorNome: profile.nome || "",
        nota: value,
        feedback: text,
        codigoSala: profile.codigoSala,
        data: serverTimestamp()
      });
      form.reset();
      alert("Avaliação salva no Firestore.");
    } catch (error) {
      console.error(error);
      alert("Não foi possível salvar a avaliação.");
    }
  });
});
