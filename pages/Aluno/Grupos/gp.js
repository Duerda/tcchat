import { auth, db, app } from "/backend/firebase/config.js";
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getDownloadURL, getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

const storage = getStorage(app);
let session;
let group;
let stopListener;
const $ = (id) => document.getElementById(id);
window.chat = () => (location.href = "gp.chat.html");
window.orientador = () => (location.href = "gp-cha-ori.html");
window.atividade = () => (location.href = "gp.ativ.html");
window.biblioteca = () => (location.href = "gp.link.html");

async function carregarGrupo() {
  if (!session) return;
  const snapshot = await getDocs(query(collection(db, "grupos"), where("membros", "array-contains", session.user.uid)));
  group = snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
  const subtitle = document.querySelector("#conteudo-superior p");
  if (!group) {
    if (subtitle) subtitle.textContent = "Você ainda não foi associado a um grupo pelo coordenador.";
    document.querySelectorAll("#chat, #att, #att2, #arquivos").forEach((el) => { el.hidden = true; });
    return;
  }
  if (subtitle) subtitle.textContent = group.nome || group.nomeProjeto || "Meu grupo";
  const chat = $("chat");
  if (chat) montarChat(chat, location.pathname.includes("gp-cha-ori"));
  if (document.querySelector("#att, #att2")) montarAtividades();
  if ($("arquivos")) montarBiblioteca();
}

function montarChat(container, orientador) {
  container.querySelectorAll("#c1, #lista-mensagens, .chat-form").forEach((el) => el.remove());
  const heading = container.querySelector("h1");
  if (heading) heading.textContent = orientador ? "Chat c/Orientador" : `Chat do Grupo · ${group.nome || group.nomeProjeto || "TCC"}`;
  const oldInput = $("chat-text");
  const list = document.createElement("div");
  list.id = "lista-mensagens";
  list.setAttribute("aria-live", "polite");
  const form = document.createElement("form");
  form.className = "chat-form";
  const input = oldInput || document.createElement("textarea");
  input.id = "chat-text";
  input.placeholder = "Digite sua mensagem...";
  input.required = true;
  input.remove();
  const send = document.createElement("button");
  send.type = "submit";
  send.textContent = "Enviar";
  form.append(input, send);
  container.append(list, form);
  stopListener?.();
  const messagesRef = collection(db, "grupos", group.id, "mensagens");
  stopListener = onSnapshot(query(messagesRef, where("chatTipo", "==", orientador ? "orientador" : "grupo")), (snapshot) => {
    list.replaceChildren();
    const messages = snapshot.docs.map((item) => item.data()).sort((a, b) => (a.criadoEm?.toMillis?.() || 0) - (b.criadoEm?.toMillis?.() || 0));
    messages.forEach((message) => {
      const line = document.createElement("p");
      const author = document.createElement("strong");
      author.textContent = `${message.nome || message.autor || "Integrante"}: `;
      line.append(author, document.createTextNode(message.texto || ""));
      list.appendChild(line);
    });
    list.scrollTop = list.scrollHeight;
  }, (error) => {
    console.error("Erro ao carregar chat:", error);
    list.textContent = "Não foi possível carregar as mensagens.";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const texto = input.value.trim();
    if (!texto) return;
    send.disabled = true;
    try {
      await addDoc(messagesRef, { texto, uid: session.user.uid, autorUid: session.user.uid, nome: session.profile.nome || "Aluno", autor: "aluno", chatTipo: orientador ? "orientador" : "grupo", criadoEm: serverTimestamp() });
      input.value = "";
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Não foi possível enviar a mensagem.");
    } finally { send.disabled = false; }
  });
}

function montarAtividades() {
  document.querySelectorAll("#att, #att2").forEach((item) => item.remove());
  let list = $("lista-atividades-grupo");
  if (!list) {
    list = document.createElement("section");
    list.id = "lista-atividades-grupo";
    document.getElementById("navbar")?.after(list);
  }
  list.replaceChildren();
  stopListener?.();
  stopListener = onSnapshot(collection(db, "grupos", group.id, "entregas"), (snapshot) => {
    list.replaceChildren();
    if (snapshot.empty) {
      list.textContent = "O orientador ainda não publicou atividades para este grupo.";
      return;
    }
    snapshot.docs.forEach((taskDoc) => {
      const task = taskDoc.data();
      if (task.tipo === "envio") return;
      const card = document.createElement("article");
      card.className = "atividade-card";
      const title = document.createElement("h2");
      title.textContent = task.titulo || "Atividade";
      const description = document.createElement("p");
      description.textContent = task.descricao || "Sem instruções adicionais.";
      const dueDate = task.dataLimite?.toDate?.() || (task.dataLimite ? new Date(task.dataLimite) : null);
      const overdue = dueDate && dueDate < new Date();
      const deadline = document.createElement("p");
      deadline.textContent = dueDate ? `Prazo: ${dueDate.toLocaleDateString("pt-BR")}${overdue ? " · Atrasada" : ""}` : (task.status === "atraso" ? "Atrasada" : "Prazo não informado");
      const form = document.createElement("form");
      form.innerHTML = '<label>Arquivo (opcional)<input type="file" accept=".pdf,.doc,.docx,.odt,.zip,.png,.jpg"></label><label>Observação<textarea rows="3" maxlength="2000"></textarea></label><button type="submit">Enviar atividade</button><p role="status"></p>';
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const fileInput = form.querySelector('input[type="file"]');
        const noteInput = form.querySelector("textarea");
        const file = fileInput.files[0];
        const note = noteInput.value.trim();
        const status = form.querySelector('[role="status"]');
        if (!file && !note) { status.textContent = "Anexe um arquivo ou escreva uma observação."; return; }
        const button = form.querySelector("button");
        button.disabled = true;
        try {
          let arquivoUrl = "";
          if (file) {
            const storageRef = ref(storage, `entregas/${group.id}/${taskDoc.id}/${session.user.uid}/${Date.now()}-${file.name}`);
            const upload = await uploadBytes(storageRef, file);
            arquivoUrl = await getDownloadURL(upload.ref);
          }
          await addDoc(collection(db, "grupos", group.id, "submissoes"), { atividadeId: taskDoc.id, atividade: task.titulo || "Atividade", alunoUid: session.user.uid, alunoNome: session.profile.nome || "Aluno", observacao: note, arquivoNome: file?.name || "", arquivoUrl, enviadoAtrasado: Boolean(dueDate && Date.now() > dueDate.getTime()), enviadoEm: serverTimestamp() });
          status.textContent = "Atividade enviada com sucesso.";
          form.reset();
        } catch (error) {
          console.error("Erro ao enviar atividade:", error);
          status.textContent = "Não foi possível enviar. Verifique a conexão e as permissões do Firebase Storage.";
        } finally { button.disabled = false; }
      });
      card.append(title, description, deadline, form);
      list.appendChild(card);
    });
  }, (error) => {
    console.error("Erro ao consultar atividades:", error);
    list.textContent = "Não foi possível carregar as atividades.";
  });
}

function montarBiblioteca() {
  const area = $("arquivos");
  if (!area) return;
  area.replaceChildren();
  const form = document.createElement("form");
  form.className = "link-form";
  form.innerHTML = '<h2>Adicionar link do projeto</h2><label>Título<input name="titulo" required maxlength="100"></label><label>URL<input name="url" type="url" placeholder="https://..." required></label><button type="submit">Salvar link</button><p role="status"></p>';
  const list = document.createElement("div");
  list.id = "lista-links";
  area.append(form, list);
  const filesRef = collection(db, "grupos", group.id, "arquivos");
  stopListener?.();
  stopListener = onSnapshot(filesRef, (snapshot) => {
    list.replaceChildren();
    const links = snapshot.docs.map((item) => item.data()).filter((item) => item.url);
    if (!links.length) list.textContent = "Nenhum link cadastrado para o grupo.";
    links.forEach((item) => {
      const card = document.createElement("article");
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.nome || "Link do projeto";
      card.appendChild(link);
      list.appendChild(card);
    });
  }, (error) => {
    console.error("Erro ao carregar Biblioteca:", error);
    list.textContent = "Não foi possível carregar a Biblioteca.";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = form.elements.titulo.value.trim();
    const url = form.elements.url.value.trim();
    let parsedUrl;
    try { parsedUrl = new URL(url); }
    catch { form.querySelector('[role="status"]').textContent = "Informe uma URL válida."; return; }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      form.querySelector('[role="status"]').textContent = "Use um link HTTP ou HTTPS.";
      return;
    }
    try {
      await addDoc(filesRef, { nome: title, url: parsedUrl.href, uid: session.user.uid, autorNome: session.profile.nome || "Aluno", criadoEm: serverTimestamp() });
      form.reset();
      form.querySelector('[role="status"]').textContent = "Link salvo na Biblioteca.";
    } catch (error) {
      console.error("Erro ao salvar link:", error);
      form.querySelector('[role="status"]').textContent = "Não foi possível salvar o link.";
    }
  });
}

window.alunoReady?.then(async (loaded) => {
  if (!loaded) return;
  session = loaded;
  try { await carregarGrupo(); }
  catch (error) {
    console.error("Erro ao carregar grupo do aluno:", error);
    const subtitle = document.querySelector("#conteudo-superior p");
    if (subtitle) subtitle.textContent = "Não foi possível carregar seu grupo.";
  }
});
