function Login() {
  window.location.href = "pages/auth/Login/Log-aluno.html";
}
function Cadastrar() {
  window.location.href = "pages/auth/Cadastro/Cad.html";
}

const menuToggle = document.querySelector(".menu-toggle");
const menu = document.querySelector("#menu-principal");

menuToggle?.addEventListener("click", () => {
  const aberto = document.body.classList.toggle("menu-aberto");
  menuToggle.setAttribute("aria-expanded", String(aberto));
});

menu?.querySelectorAll("button").forEach((item) => item.addEventListener("click", () => {
  document.body.classList.remove("menu-aberto");
  menuToggle?.setAttribute("aria-expanded", "false");
}));
