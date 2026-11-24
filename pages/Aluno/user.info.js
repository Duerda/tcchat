
// Aplica as configurações salvas globalmente
const fonteSalva = localStorage.getItem('fontePreferida');
if (fonteSalva) {
    let styleTag = document.createElement('style');
    styleTag.id = 'dynamic-font-style';
    styleTag.innerHTML = `* { font-family: ${fonteSalva} !important; }`;
    document.head.appendChild(styleTag);
}

const tamanhoSalvo = localStorage.getItem('tamanhoPreferido');
if (tamanhoSalvo) {
    if (tamanhoSalvo == 14) document.body.style.zoom = "0.85";
    if (tamanhoSalvo == 16) document.body.style.zoom = "1";
    if (tamanhoSalvo == 18) document.body.style.zoom = "1.15";
}
import { requireStudent } from "../../backend/firebase/professor.js";

requireStudent((_user, data) => {
  document.body.classList.add("pronto");

  const name = document.querySelector(".Usuario h4");
  if (name) name.textContent = data.nome || "Usuário";

  const course = document.querySelector(".Usuario h5");
  if (course) course.textContent = data.curso || "Sem curso";

  const initials = document.querySelector("#foto span");
  if (initials) {
    initials.textContent = data.iniciais || (data.nome || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
});
