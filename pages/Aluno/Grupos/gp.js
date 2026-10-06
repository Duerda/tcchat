import { auth, db, app } from "../../../backend/firebase/config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

const storage = getStorage(app);
let perfil;
let grupo;
let unsubscribe;
const $ = (id) => document.getElementById(id);

window.chat = () => location.href = "gp.chat.html";
window.orientador = () => location.href = "gp-cha-ori.html";
window.atividade = () => location.href = "gp.ativ.html";
window.biblioteca = () => location.href = "gp.link.html";
window.Painel = () => location.href = "../Turma/index.html";
window.Forum = () => location.href = "../Forum/Fo.html";
window.Inspiracoes = () => location.href = "../Inspiracoes/Inspiracoes.html";
window.Configuracoes = () => location.href = "../Configuracoes/Config.html";
window.Voltar = async () => { await signOut(auth); location.href = "../../auth/Login/Log-aluno.html"; };

onAuthStateChanged(auth, async (user) => {
  if (!user) { location.href = "../../auth/Login/Log-aluno.html"; return; }
  const userSnap = await getDoc(doc(db, "usuarios", user.uid));
  if (!userSnap.exists() || userSnap.data().tipo !== "aluno") { location.href = "../../auth/Login/Log-aluno.html"; return; }
  perfil = { uid: user.uid, ...userSnap.data() };
  document.querySelector("#foto span").textContent = perfil.iniciais || "";
  document.querySelector("#NomeUC h4").textContent = perfil.nome || "";
  document.querySelector("#NomeUC h5").textContent = perfil.curso || "";
  const snap = await getDocs(query(collection(db, "grupos"), where("membros", "array-contains", user.uid)));
  grupo = snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
  if (!grupo) { location.href = "../Turma/index.html"; return; }
  const subtitulo = document.querySelector("#conteudo-superior p");
  if (subtitulo) subtitulo.textContent = grupo?.nome || "Você ainda não pertence a um grupo";
  iniciarPagina();
});

function iniciarPagina() {
  const chatScreen = $("chat");
  if (chatScreen) montarChat(chatScreen, location.pathname.includes("gp-cha-ori"));
  if ($("att2")) montarEntrega();
  if ($("arquivos")) montarBiblioteca();
}

function montarChat(container, orientador) {
  const heading = container.querySelector("h1");
  if (heading) heading.textContent = orientador ? "Chat com Orientador" : `Chat do Grupo${grupo ? ` — ${grupo.nome}` : ""}`;
  container.querySelectorAll("#c1").forEach((item) => item.remove());
  const lista = document.createElement("div"); lista.id = "lista-mensagens"; lista.setAttribute("aria-live", "polite");
  const input = $("chat-text");
  const form = document.createElement("form"); form.className = "chat-form";
  input.parentNode.insertBefore(lista, input); input.placeholder = "Digite sua mensagem..."; input.required = true;
  const enviar = document.createElement("button"); enviar.type = "submit"; enviar.textContent = "Enviar";
  form.append(input, enviar); input.remove(); container.append(form);
  if (!grupo) { form.hidden = true; lista.textContent = "Crie um grupo no Painel para usar o chat."; return; }
  const chatTipo = orientador ? "orientador" : "grupo";
  const q = query(collection(db, "mensagens"), where("grupoId", "==", grupo.id), where("chatTipo", "==", chatTipo));
  unsubscribe?.();
  unsubscribe = onSnapshot(q, (snap) => {
    lista.replaceChildren();
    const mensagens = snap.docs.map((d) => d.data()).sort((a, b) => (a.data?.toMillis?.() || 0) - (b.data?.toMillis?.() || 0));
    mensagens.forEach((msg) => {
      const linha = document.createElement("p"); linha.className = "mensagem-chat";
      const autor = document.createElement("strong"); autor.textContent = `${msg.autor || "Usuário"}: `;
      linha.append(autor, document.createTextNode(msg.texto || "")); lista.append(linha);
    });
    lista.scrollTop = lista.scrollHeight;
  }, (error) => { console.error(error); lista.textContent = "Falha ao carregar mensagens."; });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const texto = input.value.trim(); if (!texto) return;
    enviar.disabled = true;
    try { await addDoc(collection(db, "mensagens"), { grupoId: grupo.id, chatTipo, texto, autor: perfil.nome, autorUid: perfil.uid, data: serverTimestamp() }); input.value = ""; }
    catch (error) { console.error(error); alert("Não foi possível enviar a mensagem."); }
    finally { enviar.disabled = false; }
  });
}

function montarEntrega() {
  const card = $("att2");
  const title = card.querySelector("h1");
  const activityTitle = title?.textContent.trim() || "Entrega do Pré-Projeto";
  const id = activityTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const form = document.createElement("form"); form.className = "entrega-form";
  form.innerHTML = '<label>Arquivo (PDF, DOCX ou outro documento)<input type="file" id="arquivo-entrega"></label><label>Observação<textarea id="texto-entrega" rows="3" placeholder="Inclua uma observação, se necessário"></textarea></label><button type="submit">Enviar atividade</button><p id="status-entrega" role="status"></p>';
  card.append(form);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!grupo) { alert("Você precisa estar em um grupo para enviar a atividade."); return; }
    const arquivo = $("arquivo-entrega").files[0]; const observacao = $("texto-entrega").value.trim();
    if (!arquivo && !observacao) { alert("Selecione um arquivo ou escreva uma observação."); return; }
    const botao = form.querySelector("button"); botao.disabled = true;
    try {
      let arquivoUrl = "";
      if (arquivo) { const caminho = `entregas/${grupo.id}/${perfil.uid}/${Date.now()}-${arquivo.name}`; const enviado = await uploadBytes(ref(storage, caminho), arquivo); arquivoUrl = await getDownloadURL(enviado.ref); }
      await addDoc(collection(db, "entregas"), { grupoId: grupo.id, atividadeId: id, atividade: activityTitle, alunoUid: perfil.uid, alunoNome: perfil.nome, observacao, arquivoNome: arquivo?.name || "", arquivoUrl, dataEnvio: serverTimestamp() });
      $("status-entrega").textContent = "Atividade enviada com sucesso."; form.reset();
    } catch (error) { console.error(error); $("status-entrega").textContent = "Não foi possível enviar. Verifique as permissões do Firebase e tente novamente."; }
    finally { botao.disabled = false; }
  });
}

function montarBiblioteca() {
  const arquivoArea = $("arquivos");
  const form = document.createElement("form"); form.className = "link-form";
  form.innerHTML = '<h2>Adicionar link do projeto</h2><label>Título<input id="titulo-link" required maxlength="100"></label><label>URL<input id="url-link" type="url" placeholder="https://..." required></label><button type="submit">Salvar link</button><p id="status-link" role="status"></p>';
  arquivoArea.parentNode.insertBefore(form, arquivoArea);
  const list = document.createElement("div"); list.id = "lista-links"; arquivoArea.parentNode.insertBefore(list, arquivoArea);
  const render = (snap) => {
    list.replaceChildren();
    snap.docs.map((d) => d.data()).forEach((item) => {
      const card = document.createElement("article"); const a = document.createElement("a");
      a.href = item.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = item.titulo;
      const p = document.createElement("p"); p.textContent = item.url; card.append(a, p); list.append(card);
    });
  };
  if (!grupo) { list.textContent = "Crie ou entre em um grupo para adicionar links."; form.hidden = true; return; }
  unsubscribe?.();
  unsubscribe = onSnapshot(query(collection(db, "linksBiblioteca"), where("grupoId", "==", grupo.id)), render, (error) => { console.error(error); $("status-link").textContent = "Falha ao carregar os links."; });
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); const titulo = $("titulo-link").value.trim(); const url = $("url-link").value.trim();
    try { await addDoc(collection(db, "linksBiblioteca"), { grupoId: grupo.id, titulo, url, autorUid: perfil.uid, autor: perfil.nome, data: serverTimestamp() }); form.reset(); $("status-link").textContent = "Link salvo na Biblioteca."; }
    catch (error) { console.error(error); $("status-link").textContent = "Não foi possível salvar o link."; }
  });
}
