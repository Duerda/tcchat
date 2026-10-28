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
