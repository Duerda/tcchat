export const COURSES = Object.freeze({
  DS: "Desenvolvimento de Sistemas",
  DI: "Design de Interiores",
  HOSP: "Hospedagem",
  IPI: "Informática para Internet - MTEC",
  MA: "Meio Ambiente",
  SEC: "Secretariado",
  ADM: "Administração",
  INF: "Informática - MTEC",
});

const EMAIL_TYPES = Object.freeze({
  "aluno.cps.sp.gov.br": "aluno",
  "professor.cps.sp.gov.br": "professor",
  "cps.sp.gov.br": "coordenador",
});

export function getAccountType(email) {
  const parts = String(email || "").trim().toLowerCase().split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return EMAIL_TYPES[parts[1]] || null;
}

export function parseClassCode(value) {
  const code = String(value || "").trim().toUpperCase();
  const match = /^([A-Z]+)-([123])$/.exec(code);
  if (!match || !COURSES[match[1]]) return null;

  return {
    code,
    courseCode: match[1],
    courseName: COURSES[match[1]],
    year: match[2],
  };
}

export function validateEvaluation({ groupId, group, roomCode, grade, feedback }) {
  if (!groupId || !group || !roomCode || group.codigoSala !== roomCode) return "group";
  if (grade === "" || grade === null || grade === undefined) return "grade";

  const numericGrade = Number(grade);
  if (!Number.isFinite(numericGrade) || numericGrade < 0 || numericGrade > 10) return "grade";
  if (!String(feedback || "").trim()) return "feedback";
  return null;
}
