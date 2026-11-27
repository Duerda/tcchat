import { auth, db } from "../../../backend/firebase/config.js";
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { supabase, SUPABASE_STORAGE_BUCKET } from "../../../backend/supabase/supabase.js";

const TIPOS_ARQUIVO = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".odt", "application/vnd.oasis.opendocument.text"],
  [".zip", "application/zip"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
]);
const TAMANHO_MAXIMO_ARQUIVO = 25 * 1024 * 1024;
let session;
let group;
let stopListener;
let stopSharedLibrary;
const $ = (id) => document.getElementById(id);
window.chat = () => (location.href = "gp.chat.html");
window.orientador = () => (location.href = "gp-cha-ori.html");
window.atividade = () => (location.href = "gp.ativ.html");
window.biblioteca = () => (location.href = "gp.link.html");

async function carregarGrupo() {
  if (!session) return;
  const snapshot = await getDocs(query(collection(db, "grupos"),
    where("codigoSala", "==", session.profile.codigoSala),
    where("membros", "array-contains", session.user.uid)));
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
  const currentChatType = orientador ? "orientador" : "grupo";
  stopListener = onSnapshot(query(messagesRef), (snapshot) => {
    list.replaceChildren();
    const messages = snapshot.docs
      .map((item) => item.data())
      .filter((message) => message.chatTipo
        ? message.chatTipo === currentChatType
        : currentChatType === "grupo")
      .sort((a, b) => (a.criadoEm?.toMillis?.() || 0) - (b.criadoEm?.toMillis?.() || 0));
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
      form.className = "entrega-form";
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
          let arquivoPath = "";
          if (file) {
            const extensao = file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() || "";
            const tipoMime = TIPOS_ARQUIVO.get(extensao);
            if (!tipoMime) throw new Error("tipo_arquivo_nao_permitido");
            if (file.size > TAMANHO_MAXIMO_ARQUIVO) throw new Error("arquivo_maior_que_25mb");
            const nomeSeguro = file.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "entrega";
            arquivoPath = `${session.user.uid}/entregas/${group.id}/${taskDoc.id}/${crypto.randomUUID()}-${nomeSeguro}`;
            const { error: uploadError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET)
              .upload(arquivoPath, file, { contentType: tipoMime, upsert: false });
            if (uploadError) throw uploadError;
          }
          await addDoc(collection(db, "grupos", group.id, "submissoes"), { atividadeId: taskDoc.id, atividade: task.titulo || "Atividade", alunoUid: session.user.uid, alunoNome: session.profile.nome || "Aluno", observacao: note, arquivoNome: file?.name || "", arquivoPath, enviadoAtrasado: Boolean(dueDate && Date.now() > dueDate.getTime()), enviadoEm: serverTimestamp() });
          status.textContent = "Atividade enviada com sucesso.";
          form.reset();
        } catch (error) {
          console.error("Erro ao enviar atividade:", error);
          status.textContent = error.message === "tipo_arquivo_nao_permitido"
            ? "Tipo de arquivo não permitido. Envie PDF, DOC, DOCX, ODT, ZIP, PNG ou JPG."
            : error.message === "arquivo_maior_que_25mb"
              ? "O arquivo ultrapassa o limite de 25 MB."
              : "Não foi possível enviar. Verifique a conexão e se o Supabase Storage foi configurado.";
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
  const form = $("form-biblioteca-grupo");
  const modal = $("modal-biblioteca-grupo");
  const groupList = $("lista-biblioteca");
  const classList = $("lista-recursos-turma");
  const pageStatus = $("status-biblioteca-grupo");
  const categoryFilter = $("filtro-categoria");
  const orderFilter = $("ordem-biblioteca");
  const searchInput = $("busca-biblioteca");
  const counter = $("contador-biblioteca");
  if (!form || !modal || !groupList) return;

  let groupResources = [];
  let classResources = [];
  let renderVersion = 0;

  const showStatus = (element, message, isError = false) => {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("erro", isError);
  };

  const setResourceType = (type) => {
    const isLink = type === "link";
    $("campos-link-grupo").hidden = !isLink;
    $("campos-arquivo-grupo").hidden = isLink;
    $("url-material").required = isLink;
    $("arquivo-material").required = !isLink;
  };

  const openModal = (type) => {
    form.reset();
    showStatus($("status-item-biblioteca"), "");
    const radio = form.querySelector(`input[name="tipo-material"][value="${type}"]`);
    if (radio) radio.checked = true;
    setResourceType(type);
    modal.hidden = false;
    $("nome-material").focus();
  };

  const closeModal = () => {
    modal.hidden = true;
    showStatus($("status-item-biblioteca"), "");
  };

  $("novo-link")?.addEventListener("click", () => openModal("link"));
  $("novo-arquivo")?.addEventListener("click", () => openModal("arquivo"));
  $("cancelar-modal-biblioteca")?.addEventListener("click", closeModal);
  $("fechar-modal-biblioteca")?.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closeModal();
  });
  form.querySelectorAll('input[name="tipo-material"]').forEach((radio) => {
    radio.addEventListener("change", () => setResourceType(radio.value));
  });

  const timestampValue = (timestamp) => timestamp?.toMillis?.()
    || (timestamp?.seconds ? timestamp.seconds * 1000 : 0)
    || (timestamp ? Date.parse(timestamp) || 0 : 0);

  const getFilteredResources = () => {
    const search = searchInput?.value.trim().toLocaleLowerCase("pt-BR") || "";
    const category = categoryFilter?.value || "todas";
    const resources = groupResources.filter((item) => {
      const matchesCategory = category === "todas" || (item.categoria || "Outros") === category;
      const searchable = [item.nome, item.descricao, item.categoria, item.arquivoNome]
        .filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      return matchesCategory && (!search || searchable.includes(search));
    });
    const order = orderFilter?.value || "recentes";
    resources.sort((a, b) => {
      if (order === "nome") return (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" });
      const difference = timestampValue(a.criadoEm) - timestampValue(b.criadoEm);
      return order === "antigos" ? difference : -difference;
    });
    return resources;
  };

  const buildCard = async (item, shared, version) => {
    const card = document.createElement("article");
    card.className = "cartao-material";
    const cover = document.createElement("div");
    cover.className = "capa-material";
    const fallback = document.createElement("span");
    fallback.className = "capa-fallback";
    fallback.textContent = item.categoria || (shared ? "Turma" : "TCC");
    cover.appendChild(fallback);

    if (item.capaPath) {
      try {
        const { data, error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET)
          .createSignedUrl(item.capaPath, 60 * 60);
        if (error) throw error;
        const image = document.createElement("img");
        image.src = data.signedUrl;
        image.alt = "";
        image.loading = "lazy";
        image.onerror = () => image.remove();
        cover.prepend(image);
      } catch (error) {
        console.error("Não foi possível preparar a capa da biblioteca:", error);
      }
    }

    const content = document.createElement("div");
    content.className = "conteudo-cartao-material";
    const labels = document.createElement("div");
    labels.className = "etiquetas-material";
    const category = document.createElement("span");
    category.className = "etiqueta-material";
    category.textContent = shared ? "Material da turma" : (item.categoria || "Outros");
    const type = document.createElement("span");
    type.className = "etiqueta-material tipo";
    type.textContent = item.arquivoPath || item.tipo === "arquivo" ? "Arquivo" : "Link";
    labels.append(category, type);

    const title = document.createElement("h3");
    title.textContent = item.nome || item.arquivoNome || "Material do grupo";
    content.append(labels, title);
    if (item.descricao) {
      const description = document.createElement("p");
      description.className = "descricao-material";
      description.textContent = item.descricao;
      content.appendChild(description);
    }

    const footer = document.createElement("div");
    footer.className = "rodape-cartao-material";
    const author = document.createElement("span");
    author.textContent = shared ? (item.autorNome || "Coordenação ou professor") : (item.autorNome || "Integrante do grupo");
    const date = document.createElement("time");
    const createdAt = timestampValue(item.criadoEm);
    if (createdAt) date.dateTime = new Date(createdAt).toISOString();
    date.textContent = createdAt ? new Date(createdAt).toLocaleDateString("pt-BR") : "Agora há pouco";
    footer.append(author, date);

    const open = document.createElement("a");
    open.className = "abrir-material";
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    open.textContent = item.arquivoPath ? "Abrir arquivo" : "Acessar link";
    open.setAttribute("aria-disabled", "true");
    if (item.arquivoPath) {
      try {
        const { data, error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET)
          .createSignedUrl(item.arquivoPath, 60 * 60);
        if (error) throw error;
        open.href = data.signedUrl;
        open.removeAttribute("aria-disabled");
      } catch (error) {
        console.error("Não foi possível abrir o arquivo da biblioteca:", error);
        open.textContent = "Arquivo indisponível";
      }
    } else if (item.url) {
      try {
        const safeUrl = new URL(item.url);
        if (!["http:", "https:"].includes(safeUrl.protocol)) throw new Error("Protocolo não permitido");
        open.href = safeUrl.href;
        open.removeAttribute("aria-disabled");
      } catch {
        open.textContent = "Link indisponível";
      }
    }
    content.append(footer, open);
    card.append(cover, content);
    return version === renderVersion ? card : null;
  };

  const renderResources = async () => {
    const version = ++renderVersion;
    const filtered = getFilteredResources();
    groupList.replaceChildren();
    if (counter) counter.textContent = `${filtered.length} ${filtered.length === 1 ? "material" : "materiais"} do grupo`;
    if (!filtered.length) {
      const empty = document.createElement("p");
      empty.className = "estado-vazio";
      empty.textContent = groupResources.length
        ? "Nenhum material corresponde à busca e à categoria selecionadas."
        : "A biblioteca do grupo está vazia. Adicionem o primeiro link ou arquivo do TCC.";
      groupList.appendChild(empty);
    }
    for (const item of filtered) {
      const card = await buildCard(item, false, version);
      if (version !== renderVersion) return;
      if (card) groupList.appendChild(card);
    }

    if (classList) {
      classList.replaceChildren();
      if (!classResources.length) {
        const empty = document.createElement("p");
        empty.className = "estado-vazio";
        empty.textContent = "Ainda não há materiais compartilhados pela coordenação ou pelos professores da turma.";
        classList.appendChild(empty);
      }
      for (const item of classResources) {
        const card = await buildCard(item, true, version);
        if (version !== renderVersion) return;
        if (card) classList.appendChild(card);
      }
    }
  };

  searchInput?.addEventListener("input", renderResources);
  categoryFilter?.addEventListener("change", renderResources);
  orderFilter?.addEventListener("change", renderResources);

  const filesRef = collection(db, "grupos", group.id, "arquivos");
  stopListener?.();
  stopListener = onSnapshot(filesRef, (snapshot) => {
    groupResources = snapshot.docs.map((item) => item.data())
      .filter((item) => item.url || item.arquivoPath);
    renderResources();
  }, (error) => {
    console.error("Erro ao carregar a biblioteca do grupo:", error);
    showStatus(pageStatus, "Não foi possível carregar a biblioteca do grupo.", true);
    groupList.textContent = "Verifique sua conexão e tente atualizar a página.";
  });

  if (classList && session.profile.codigoSala) {
    stopSharedLibrary?.();
    stopSharedLibrary = onSnapshot(
      query(collection(db, "biblioteca"), where("codigoSala", "==", session.profile.codigoSala)),
      (snapshot) => {
        classResources = snapshot.docs.map((item) => item.data())
          .filter((item) => item.url || item.arquivoPath);
        renderResources();
      },
      (error) => {
        console.error("Erro ao carregar os materiais compartilhados da turma:", error);
        classResources = [];
        renderResources();
      }
    );
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = $("status-item-biblioteca");
    const submit = $("salvar-material");
    const type = form.querySelector('input[name="tipo-material"]:checked')?.value;
    const name = $("nome-material").value.trim();
    const description = $("descricao-material").value.trim();
    const category = $("categoria-material").value;
    const file = $("arquivo-material").files?.[0];
    const coverFile = $("capa-material").files?.[0];
    if (!name) return showStatus(status, "Informe um título para o material.", true);
    if (type === "arquivo" && !file) return showStatus(status, "Escolha o arquivo que deseja enviar.", true);
    if (file && file.size > TAMANHO_MAXIMO_ARQUIVO) return showStatus(status, "O arquivo ultrapassa o limite de 25 MB.", true);
    if (coverFile && coverFile.size > 5 * 1024 * 1024) return showStatus(status, "A capa ultrapassa o limite de 5 MB.", true);
    if (coverFile && !["image/png", "image/jpeg"].includes(coverFile.type)) {
      return showStatus(status, "A capa precisa estar no formato PNG ou JPG.", true);
    }

    let parsedUrl = "";
    if (type === "link") {
      try {
        const value = new URL($("url-material").value.trim());
        if (!["http:", "https:"].includes(value.protocol)) throw new Error("Use um endereço HTTP ou HTTPS.");
        parsedUrl = value.href;
      } catch (error) {
        return showStatus(status, error.message || "Informe um link válido iniciado por http:// ou https://.", true);
      }
    }

    if (submit?.disabled) return;
    if (submit) { submit.disabled = true; submit.textContent = "Salvando…"; }
    showStatus(status, "Enviando material para a biblioteca do grupo…");
    const uploadedPaths = [];
    try {
      const resource = {
        nome: name,
        descricao: description,
        categoria,
        tipo,
        url: parsedUrl,
        uid: session.user.uid,
        autorNome: session.profile.nome || "Aluno",
        criadoEm: serverTimestamp(),
      };
      const safeFileName = (value) => value.normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-120) || "material";

      if (type === "arquivo") {
        const extension = file.name.match(/\.[^.]+$/)?.[0]?.toLowerCase() || "";
        const contentType = TIPOS_ARQUIVO.get(extension);
        if (!contentType) throw new Error("Formato não permitido. Use PDF, DOC, DOCX, ODT, ZIP, PNG ou JPG.");
        const path = `${session.user.uid}/biblioteca/${group.id}/arquivos/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET)
          .upload(path, file, { contentType, upsert: false });
        if (error) throw error;
        uploadedPaths.push(path);
        resource.arquivoPath = path;
        resource.arquivoNome = file.name;
        resource.contentType = contentType;
      }

      if (coverFile) {
        const extension = coverFile.type === "image/png" ? ".png" : ".jpg";
        const path = `${session.user.uid}/biblioteca/${group.id}/capas/${crypto.randomUUID()}-${safeFileName(coverFile.name || `capa${extension}`)}`;
        const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET)
          .upload(path, coverFile, { contentType: coverFile.type, upsert: false });
        if (error) throw error;
        uploadedPaths.push(path);
        resource.capaPath = path;
        resource.capaNome = coverFile.name;
      }

      await addDoc(filesRef, resource);
      uploadedPaths.length = 0;
      form.reset();
      closeModal();
      showStatus(pageStatus, "Material adicionado à biblioteca do grupo.");
    } catch (error) {
      console.error("Não foi possível adicionar o material à biblioteca do grupo:", error);
      if (uploadedPaths.length) {
        try {
          const { error: cleanupError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove(uploadedPaths);
          if (cleanupError) console.error("Não foi possível remover uploads incompletos:", cleanupError);
        } catch (cleanupError) {
          console.error("Não foi possível remover uploads incompletos:", cleanupError);
        }
      }
      showStatus(status, error.message || "Não foi possível salvar o material. Confira a conexão e o Supabase Storage.", true);
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = "Adicionar material"; }
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
