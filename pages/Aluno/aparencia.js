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
  document.documentElement.style.fontSize = `${Number(preferencias.tamanhoFonte) || 16}px`;
  if (preferencias.tipoFonte) document.body.style.fontFamily = preferencias.tipoFonte;

  propriedadesDeTema.forEach((propriedade) => {
    document.documentElement.style.removeProperty(propriedade);
  });
  if (tema === "light-mode") {
    Object.entries(coresClaro).forEach(([propriedade, valor]) => {
      document.documentElement.style.setProperty(propriedade, valor);
    });
  }
}
