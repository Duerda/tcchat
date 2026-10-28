import { afterEach, describe, expect, it } from "vitest";
import { appUrl, navigate } from "../../backend/navigation.js";

const originalWindow = globalThis.window;

afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

describe("appUrl", () => {
  it("resolves application paths under the repository root", () => {
    expect(new URL(appUrl("/pages/auth/Login/Log-aluno.html")).pathname)
      .toBe(new URL("../../pages/auth/Login/Log-aluno.html", import.meta.url).pathname);
  });
});

describe("navigate", () => {
  it("resolves root application routes using appUrl", () => {
    globalThis.window = { location: { href: "http://localhost/tcchat/pages/Aluno/Turma/index.html" } };
    navigate("/pages/auth/Login/Log-aluno.html");
    expect(window.location.href).toBe(appUrl("pages/auth/Login/Log-aluno.html"));
  });

  it("keeps relative links relative to the current page", () => {
    globalThis.window = { location: { href: "https://example.test/tcchat/pages/Aluno/Configuracoes/Config.html" } };
    navigate("../Forum/Fo.html");
    expect(window.location.href).toBe("https://example.test/tcchat/pages/Aluno/Forum/Fo.html");
  });
});
