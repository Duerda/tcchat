const coresClaro = {
  "--cor-fundo-principal": "#f4f6fa",
  "--cor-fundo-secundario": "#e8ecf3",
  "--cor-fundo-hover": "#dce2ec",
  "--cor-fundo-card": "#ffffff",
  "--cor-cinza-claro": "#dce2ec",
  "--cor-cinza-escuro": "#e8ecf3",
  "--cor-branco": "#18202d",
  "--cor-texto": "#18202d",
  "--cor-texto-secundario": "#526176",
  "--cor-texto-fraco": "#64748b",
  "--cor-borda": "rgb(24 32 45 / 12%)",
};

const propriedadesDeTema = Object.keys(coresClaro);

/**
 * Aplica tema e leitura em qualquer página do aluno. Os estilos de cada página
 * definem uma paleta escura padrão em :root; no tema claro, as mesmas variáveis
 * são sobrescritas inline na raiz, o que mantém painel, grupo, fórum e avisos
 * consistentes sem duplicar regras de cor em cada folha de estilos.
 */
export function aplicarAparenciaAluno(preferencias = {}) {
  const tema = preferencias.tema === "light-mode" ? "light-mode" : "dark-mode";
  document.body.classList.remove("dark-mode", "light-mode");
  document.body.classList.add(tema);
  if (preferencias.tipoFonte) {
    const savedFont = String(preferencias.tipoFonte).trim();
    const fontFamily = savedFont.includes(",") || /['\"]/.test(savedFont)
      ? savedFont
      : `${JSON.stringify(savedFont)}, sans-serif`;
    const style = document.getElementById("dynamic-font-style") || document.createElement("style");
    style.id = "dynamic-font-style";
    style.textContent = `* { font-family: ${fontFamily} !important; }`;
    if (!style.isConnected) document.head.appendChild(style);
  }

  const size = Number(preferencias.tamanhoFonte);
  const scale = ([14, 16, 18].includes(size) ? size : 16) / 16;
  const resizeTree = (root) => {
    const elements = root.nodeType === Node.ELEMENT_NODE
      ? [root, ...root.querySelectorAll("*")]
      : [...(root.querySelectorAll?.("*") || [])];
    elements.forEach((element) => {
      if (["SCRIPT", "STYLE", "SVG", "PATH"].includes(element.tagName)) return;
      if (!element.dataset.originalFontSize) {
        element.dataset.originalFontSize = getComputedStyle(element).fontSize;
      }
      const originalSize = Number.parseFloat(element.dataset.originalFontSize);
      if (originalSize > 0) element.style.fontSize = `${originalSize * scale}px`;
    });
  };
  resizeTree(document.body);
  window.__tcchatTextScaleObserver?.disconnect();
  window.__tcchatTextScaleObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(resizeTree));
  });
  window.__tcchatTextScaleObserver.observe(document.body, { childList: true, subtree: true });

  propriedadesDeTema.forEach((propriedade) => {
    document.documentElement.style.removeProperty(propriedade);
  });
  if (tema === "light-mode") {
    Object.entries(coresClaro).forEach(([propriedade, valor]) => {
      document.documentElement.style.setProperty(propriedade, valor);
    });
  }
}
