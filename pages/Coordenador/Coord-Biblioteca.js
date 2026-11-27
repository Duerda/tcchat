import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { db } from "../../backend/firebase/config.js";
import { supabase, SUPABASE_STORAGE_BUCKET } from "../../backend/supabase/supabase.js";
import { fillHeader, requireCoordinator } from "../../backend/firebase/professor.js";

const areaLinks = document.getElementById("links");
const areaArquivos = document.getElementById("arquivos");
const form = document.getElementById("form-recurso-biblioteca");
const modal = document.getElementById("modal-recurso-biblioteca");
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const FILE_TYPES = new Map([
    ["pdf", "application/pdf"],
    ["doc", "application/msword"],
    ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["odt", "application/vnd.oasis.opendocument.text"],
    ["zip", "application/zip"],
    ["png", "image/png"],
    ["jpg", "image/jpeg"],
    ["jpeg", "image/jpeg"]
]);

let usuarioAtual = null;

function chaveBiblioteca() {
    const sala = document.getElementById("codigo-sala-biblioteca")?.value.trim().toUpperCase();
    return sala && /^[A-Z]{2,6}-\d{1,2}$/.test(sala) ? sala : null;
}

function mostrarStatus(texto, erro = false) {
    const status = document.getElementById("status-recurso-biblioteca");
    if (status) {
        status.textContent = texto;
        status.classList.toggle("erro", erro);
    }
}

function selecionarTipo(tipo) {
    const radio = document.querySelector(`input[name="tipo-recurso"][value="${tipo}"]`);
    if (radio) radio.checked = true;
    const linkFields = document.getElementById("campos-link-recurso");
    const fileFields = document.getElementById("campos-arquivo-recurso");
    const urlInput = document.getElementById("url-recurso");
    const fileInput = document.getElementById("arquivo-recurso");
    const isLink = tipo === "link";
    if (linkFields) linkFields.hidden = !isLink;
    if (fileFields) fileFields.hidden = isLink;
    if (urlInput) urlInput.required = isLink;
    if (fileInput) fileInput.required = !isLink;
}

function abrirModal(tipo = "link") {
    if (!chaveBiblioteca()) {
        mostrarStatusPagina("Informe uma turma válida para adicionar o recurso.", true);
        document.getElementById("codigo-sala-biblioteca")?.focus();
        return;
    }
    form?.reset();
    mostrarStatus("");
    selecionarTipo(tipo);
    if (modal) modal.style.display = "flex";
}

function fecharModal() {
    if (modal) modal.style.display = "none";
    mostrarStatus("");
}

function mostrarStatusPagina(texto, erro = false) {
    const status = document.getElementById("status-biblioteca");
    if (status) {
        status.textContent = texto;
        status.classList.toggle("erro", erro);
    }
}

document.getElementById("Link")?.addEventListener("click", () => abrirModal("link"));
document.getElementById("ArquivoModelo")?.addEventListener("click", () => abrirModal("arquivo"));
document.getElementById("cancelar-recurso-biblioteca")?.addEventListener("click", fecharModal);
document.querySelectorAll("input[name='tipo-recurso']").forEach((radio) => {
    radio.addEventListener("change", () => selecionarTipo(radio.value));
});

form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!usuarioAtual) return mostrarStatus("Sua sessão ainda está carregando. Tente novamente.", true);
    const codigoSala = chaveBiblioteca();
    if (!codigoSala) return mostrarStatus("Informe um código de turma válido, como DS-3.", true);
    const tipo = form.querySelector("input[name='tipo-recurso']:checked")?.value;
    const nome = document.getElementById("nome-recurso")?.value.trim();
    const submit = document.getElementById("salvar-recurso-biblioteca");
    if (!nome) return mostrarStatus("Informe o nome do recurso.", true);
    if (submit?.disabled) return;
    if (submit) { submit.disabled = true; submit.textContent = "Salvando…"; }

    let uploadedPath = "";
    try {
        const baseData = {
            nome,
            tipo,
            url: "",
            enviadoPor: usuarioAtual.uid,
            codigoSala,
            criadoEm: serverTimestamp()
        };
        if (tipo === "link") {
            const rawUrl = document.getElementById("url-recurso")?.value.trim();
            let parsedUrl;
            try { parsedUrl = new URL(rawUrl); }
            catch { throw new Error("Informe um endereço válido para o link."); }
            if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Use um endereço iniciado por http:// ou https://.");
            const iconUrl = document.getElementById("icone-recurso")?.value.trim() || "";
            if (iconUrl) {
                let parsedIcon;
                try { parsedIcon = new URL(iconUrl); }
                catch { throw new Error("A URL do ícone não é válida."); }
                if (!["http:", "https:"].includes(parsedIcon.protocol)) throw new Error("A URL do ícone deve começar com http:// ou https://.");
            }
            await addDoc(collection(db, "biblioteca"), { ...baseData, url: parsedUrl.href, icone: iconUrl });
        } else {
            const file = document.getElementById("arquivo-recurso")?.files?.[0];
            if (!file) throw new Error("Escolha um arquivo para enviar.");
            if (file.size > MAX_FILE_SIZE) throw new Error("O arquivo ultrapassa o limite de 25 MB.");
            const extension = file.name.split(".").pop()?.toLowerCase() || "";
            const contentType = FILE_TYPES.get(extension);
            if (!contentType) throw new Error("Formato não permitido. Use PDF, DOC, DOCX, ODT, ZIP, PNG ou JPG.");
            const safeName = file.name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "arquivo";
            uploadedPath = `${usuarioAtual.uid}/biblioteca/${codigoSala}/${crypto.randomUUID()}-${safeName}`;
            const { error: uploadError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET)
                .upload(uploadedPath, file, { contentType, upsert: false });
            if (uploadError) throw uploadError;
            await addDoc(collection(db, "biblioteca"), {
                ...baseData,
                arquivoPath: uploadedPath,
                arquivoNome: file.name,
                contentType
            });
            uploadedPath = "";
        }
        fecharModal();
    } catch (error) {
        console.error("Não foi possível adicionar o recurso à biblioteca:", error);
        if (uploadedPath) {
            try {
                const { error: cleanupError } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([uploadedPath]);
                if (cleanupError) console.error("Não foi possível remover o upload incompleto:", cleanupError);
            } catch (cleanupError) {
                console.error("Não foi possível remover o upload incompleto:", cleanupError);
            }
        }
        mostrarStatus(error.message || "Não foi possível adicionar o recurso. Verifique o Supabase Storage e tente novamente.", true);
    } finally {
        if (submit) { submit.disabled = false; submit.textContent = "Adicionar à biblioteca"; }
    }
});

document.getElementById("codigo-sala-biblioteca")?.addEventListener("input", () => mostrarStatusPagina(""));

function aplicarPreferenciasLocais() {
    const font = localStorage.getItem("fontePreferida");
    if (font) {
        const style = document.getElementById("dynamic-font-style") || document.createElement("style");
        style.id = "dynamic-font-style";
        style.textContent = `* { font-family: ${font} !important; }`;
        if (!style.isConnected) document.head.appendChild(style);
    }
    const scale = Number(localStorage.getItem("tamanhoPreferido")) / 16 || 1;
    const resize = (root) => {
        const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll("*")] : [...(root.querySelectorAll?.("*") || [])];
        elements.forEach((element) => {
            if (["SCRIPT", "STYLE", "SVG", "PATH"].includes(element.tagName)) return;
            if (!element.dataset.originalFontSize) element.dataset.originalFontSize = getComputedStyle(element).fontSize;
            const original = Number.parseFloat(element.dataset.originalFontSize);
            if (original > 0) element.style.fontSize = `${original * scale}px`;
        });
    };
    resize(document.body);
    window.__tcchatTextScaleObserver?.disconnect();
    window.__tcchatTextScaleObserver = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach(resize)));
    window.__tcchatTextScaleObserver.observe(document.body, { childList: true, subtree: true });
}

requireCoordinator((user, profile) => {
    usuarioAtual = user;
    fillHeader(profile);
    aplicarPreferenciasLocais();
    escutarBiblioteca();
});

function escutarBiblioteca() {
    const salaInput = document.getElementById("codigo-sala-biblioteca");
    let pararDeOuvir = null;
    const carregarSala = () => {
        const codigoSala = chaveBiblioteca();
        if (!codigoSala) {
            pararDeOuvir?.();
            if (areaLinks) areaLinks.textContent = "Informe um código de turma válido para listar os recursos.";
            if (areaArquivos) areaArquivos.textContent = "Informe um código de turma válido para listar os recursos.";
            return;
        }
        mostrarStatusPagina("");
        pararDeOuvir?.();
        const resourcesQuery = query(collection(db, "biblioteca"), where("codigoSala", "==", codigoSala));
        pararDeOuvir = onSnapshot(resourcesQuery, (snapshot) => {
            areaLinks.replaceChildren();
            areaArquivos.replaceChildren();
            snapshot.forEach((resourceDoc) => {
                const item = resourceDoc.data();
                const id = resourceDoc.id;
                const card = document.createElement("article");
                const anchor = document.createElement("a");
                anchor.className = item.tipo === "link" ? "nome-link" : "nome-arquivo";
                anchor.textContent = item.nome || "Recurso";
                anchor.target = "_blank";
                anchor.rel = "noopener noreferrer";
                if (item.arquivoPath) {
                    anchor.textContent = `Preparando arquivo: ${item.arquivoNome || item.nome || "arquivo"}`;
                    supabase.storage.from(SUPABASE_STORAGE_BUCKET).createSignedUrl(item.arquivoPath, 60 * 60)
                        .then(({ data, error }) => {
                            if (error) throw error;
                            anchor.href = data.signedUrl;
                            anchor.textContent = item.arquivoNome || item.nome || "Abrir arquivo";
                        })
                        .catch((error) => {
                            console.error("Não foi possível preparar o acesso ao arquivo:", error);
                            anchor.textContent = `${item.arquivoNome || item.nome || "Arquivo"} (indisponível)`;
                        });
                } else {
                    anchor.href = item.url || "#";
                }
                if (item.tipo === "link") {
                    card.className = "card-link";
                    const iconBox = document.createElement("span");
                    iconBox.className = "icone-box";
                    if (item.icone) {
                        const image = document.createElement("img");
                        image.src = item.icone;
                        image.alt = "";
                        image.width = 24;
                        iconBox.appendChild(image);
                    } else {
                        iconBox.textContent = "↗";
                    }
                    card.append(iconBox, anchor);
                    areaLinks.appendChild(card);
                } else {
                    card.className = "card-arquivo";
                    card.appendChild(anchor);
                    areaArquivos.appendChild(card);
                }
                const remove = document.createElement("button");
                remove.type = "button";
                remove.className = "excluir";
                remove.textContent = "Excluir";
                remove.addEventListener("click", async () => {
                    if (!confirm("Excluir este item?")) return;
                    try {
                        if (item.arquivoPath) {
                            const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([item.arquivoPath]);
                            if (error) throw error;
                        }
                        await deleteDoc(doc(db, "biblioteca", id));
                    } catch (error) {
                        console.error("Não foi possível excluir o recurso:", error);
                        alert("Não foi possível excluir o recurso. Confira a política de exclusão do Supabase Storage.");
                    }
                });
                card.appendChild(remove);
            });
            if (snapshot.empty) {
                areaLinks.textContent = "Nenhum link cadastrado para esta turma.";
                areaArquivos.textContent = "Nenhum arquivo ou modelo cadastrado para esta turma.";
            }
        }, (error) => {
            console.error("Não foi possível carregar a biblioteca da turma:", error);
            mostrarStatusPagina("Não foi possível carregar os recursos desta turma.", true);
        });
    };
    if (areaLinks) areaLinks.textContent = "Informe um código de turma para listar os recursos.";
    if (areaArquivos) areaArquivos.textContent = "Informe um código de turma para listar os recursos.";
    salaInput?.addEventListener("change", carregarSala);
}
