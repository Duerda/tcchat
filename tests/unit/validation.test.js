import { describe, expect, it } from "vitest";
import { getAccountType, parseClassCode, validateEvaluation } from "../../backend/auth/validation.js";

describe("getAccountType", () => {
  it.each([
    ["ana@aluno.cps.sp.gov.br", "aluno"],
    ["joao@professor.cps.sp.gov.br", "professor"],
    ["coord@cps.sp.gov.br", "coordenador"],
  ])("reconhece %s", (email, type) => {
    expect(getAccountType(email)).toBe(type);
  });

  it.each(["", "aluno.cps.sp.gov.br", "a@exemplo.com", "a@sub.aluno.cps.sp.gov.br", "a@@aluno.cps.sp.gov.br"])(
    "rejeita endereço não autorizado: %s",
    (email) => expect(getAccountType(email)).toBeNull(),
  );
});

describe("parseClassCode", () => {
  it("normaliza sigla e ano e retorna o curso", () => {
    expect(parseClassCode(" ds-3 ")).toEqual({
      code: "DS-3",
      courseCode: "DS",
      courseName: "Desenvolvimento de Sistemas",
      year: "3",
    });
  });

  it.each(["DS", "DS-0", "DS-4", "XX-1", "DS-1-2"])("rejeita código inválido: %s", (code) => {
    expect(parseClassCode(code)).toBeNull();
  });
});

describe("validateEvaluation", () => {
  const valid = {
    groupId: "group-1",
    group: { codigoSala: "DS-1" },
    roomCode: "DS-1",
    grade: "8.5",
    feedback: "Bom progresso",
  };

  it("aceita avaliação de grupo da turma com nota e feedback", () => {
    expect(validateEvaluation(valid)).toBeNull();
  });

  it("rejeita grupo de outra turma", () => {
    expect(validateEvaluation({ ...valid, group: { codigoSala: "DS-2" } })).toBe("group");
  });

  it.each(["", "-1", "10.1", "NaN"])("rejeita nota inválida: %s", (grade) => {
    expect(validateEvaluation({ ...valid, grade })).toBe("grade");
  });

  it("aceita as notas nos extremos de 0 a 10", () => {
    expect(validateEvaluation({ ...valid, grade: "0" })).toBeNull();
    expect(validateEvaluation({ ...valid, grade: "10" })).toBeNull();
  });

  it("rejeita feedback vazio", () => {
    expect(validateEvaluation({ ...valid, feedback: "   " })).toBe("feedback");
  });
});
