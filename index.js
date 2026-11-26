function Login() {
  window.location.href = "pages/auth/Login/Log-aluno.html";
}

function Cadastrar() {
  window.location.href = "pages/auth/Cadastro/Cad.html";
}

const menuToggle = document.querySelector(".menu-toggle");
const navbar = document.querySelector(".navbar");
const navLinks = document.querySelectorAll(".nav-links a");

menuToggle?.addEventListener("click", () => {
  const aberto = navbar.classList.toggle("menu-aberto");
  menuToggle.setAttribute("aria-expanded", String(aberto));
  menuToggle.textContent = aberto ? "Fechar" : "Menu";
});

navLinks.forEach((link) => link.addEventListener("click", () => {
  navbar?.classList.remove("menu-aberto");
  menuToggle?.setAttribute("aria-expanded", "false");
  if (menuToggle) menuToggle.textContent = "Menu";
}));

function scrollParaInicio() {
  document.getElementById("inicio")?.scrollIntoView({ behavior: "smooth" });
}
