function Login() {
  window.location.href = "pages/auth/Login/Log-aluno.html";
}

function Cadastrar() {
  window.location.href = "pages/auth/Cadastro/Cad.html";
}

function scrollParaInicio() {
  document.getElementById("inicio")?.scrollIntoView({ behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll(".nav-links a");

  if (!menuToggle || !navbar) return;

  const setMenuOpen = (open) => {
    navbar.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Fechar menu de navegação" : "Abrir menu de navegação",
    );
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!navbar.contains(event.target)) setMenuOpen(false);
  });
});
