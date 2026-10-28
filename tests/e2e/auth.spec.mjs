import { expect, test } from "@playwright/test";

const projectId = "demo-tcchat";
const firestoreRoot = `http://127.0.0.1:8080/v1/projects/${projectId}/databases/(default)/documents`;
const authRoot = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1`;

async function writeDocument(collection, id, fields) {
  const encodeValue = (value) => {
    if (typeof value === "boolean") return { booleanValue: value };
    if (typeof value === "number") return { integerValue: String(value) };
    return { stringValue: String(value) };
  };
  const response = await fetch(`${firestoreRoot}/${collection}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, encodeValue(value)])) }),
  });
  if (!response.ok) throw new Error(`Firestore emulator returned ${response.status}: ${await response.text()}`);
}

async function createAuthUser(email, password) {
  const response = await fetch(`${authRoot}/accounts:signUp?key=fake-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`Auth emulator returned ${response.status}: ${await response.text()}`);
  return response.json();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("tcchat.useFirebaseEmulators", "true"));
});

test("landing page opens student login", async ({ page }) => {
  await page.goto("/index.html");
  await page.getByRole("button", { name: "Login" }).first().click();
  await expect(page).toHaveURL(/\/pages\/auth\/Login\/Log-aluno\.html$/);
  await expect(page.locator("form")).toHaveCount(1);
});

test("professor login has one valid form and unique field IDs", async ({ page }) => {
  await page.goto("/pages/auth/Login/Log-Prof.html");
  await expect(page.locator("form")).toHaveCount(1);
  await expect(page.locator("form#loginForm")).toHaveCount(1);
  await expect(page.locator("#E-mail")).toHaveCount(1);
  await expect(page.locator("#Senhas")).toHaveCount(1);
  await expect(page.locator("#Codigo-coordenador")).toHaveCount(1);
});

test("registration page exposes the required account fields", async ({ page }) => {
  await page.goto("/pages/auth/Cadastro/Cad.html");
  await expect(page.locator("#formCadastro")).toHaveCount(1);
  await expect(page.locator("#Nome-da-pessoa")).toHaveCount(1);
  await expect(page.locator("#Email")).toHaveCount(1);
  await expect(page.locator("#Senha")).toHaveCount(1);
  await expect(page.locator("#Codigo-da-pessoa")).toHaveCount(1);
});

test("student signup creates its profile against Firebase emulators", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `aluno.${suffix}@aluno.cps.sp.gov.br`;
  const password = "TesteLocal2026!";
  const accessCodeId = `seed-${suffix}`;
  await writeDocument("codigosAcesso", accessCodeId, {
    codigo: "DS-1",
    tipo: "aluno",
    usos: 0,
    revogado: false,
  });
  page.on("dialog", (dialog) => dialog.accept());

  await page.goto("/pages/auth/Cadastro/Cad.html");
  await page.locator("#Nome-da-pessoa").fill("Aluno de Teste");
  await page.locator("#Email").fill(email);
  await page.locator("#Senha").fill(password);
  await page.locator("#RepitaSenha").fill(password);
  await page.locator("#Codigo-da-pessoa").fill("DS-1");
  await page.locator("#formCadastro").evaluate((form) => form.requestSubmit());

  await expect(page).toHaveURL(/\/pages\/Aluno\/Turma\/index\.html$/);
  const profilesResponse = await fetch(`${firestoreRoot}/usuarios?pageSize=100`);
  expect(profilesResponse.ok).toBeTruthy();
  const profiles = await profilesResponse.json();
  const profile = profiles.documents?.find((item) => item.fields.email?.stringValue === email);
  expect(profile).toBeTruthy();
  expect(profile.fields.tipo.stringValue).toBe("aluno");
  expect(profile.fields.codigoSala.stringValue).toBe("DS-1");
});

test("student signup completes an existing Auth account with no Firestore profile", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `aluno.${suffix}@aluno.cps.sp.gov.br`;
  const password = "TesteLocal2026!";
  await createAuthUser(email, password);
  await writeDocument("codigosAcesso", `seed-${suffix}`, {
    codigo: "DS-1",
    tipo: "aluno",
    usos: 0,
    revogado: false,
  });
  let dialogMessage = "";
  page.on("dialog", async (dialog) => {
    dialogMessage = dialog.message();
    await dialog.accept();
  });

  await page.goto("/pages/auth/Cadastro/Cad.html");
  await page.locator("#Nome-da-pessoa").fill("Perfil Recuperado");
  await page.locator("#Email").fill(email);
  await page.locator("#Senha").fill(password);
  await page.locator("#RepitaSenha").fill(password);
  await page.locator("#Codigo-da-pessoa").fill("DS-1");
  await page.locator("#formCadastro").evaluate((form) => form.requestSubmit());

  await expect(page).toHaveURL(/\/pages\/Aluno\/Turma\/index\.html$/);
  expect(dialogMessage).toContain("Cadastro realizado com sucesso");
  const profilesResponse = await fetch(`${firestoreRoot}/usuarios?pageSize=100`);
  expect(profilesResponse.ok).toBeTruthy();
  const profiles = await profilesResponse.json();
  const profile = profiles.documents?.find((item) => item.fields.email?.stringValue === email);
  expect(profile?.fields.tipo.stringValue).toBe("aluno");
});

test("student profile cannot submit the professor login form", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `aluno.${suffix}@aluno.cps.sp.gov.br`;
  const password = "TesteLocal2026!";
  const user = await createAuthUser(email, password);
  await writeDocument("usuarios", user.localId, {
    uid: user.localId,
    nome: "Aluno de Teste",
    email,
    tipo: "aluno",
    codigoSala: "DS-1",
  });
  await page.goto("/pages/auth/Login/Log-Prof.html");
  await page.locator("#E-mail").fill(email);
  await page.locator("#Senhas").fill(password);
  const dialogPromise = page.waitForEvent("dialog");
  await page.locator("#loginForm").evaluate((form) => form.requestSubmit());
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain("Esta conta não possui perfil de professor");
  await dialog.accept();
  await expect(page).toHaveURL(/\/pages\/auth\/Login\/Log-Prof\.html$/);
});

test("revoked student profile cannot enter the student dashboard", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `aluno.${suffix}@aluno.cps.sp.gov.br`;
  const password = "TesteLocal2026!";
  const user = await createAuthUser(email, password);
  await writeDocument("usuarios", user.localId, {
    uid: user.localId,
    nome: "Aluno Revogado",
    email,
    tipo: "aluno",
    codigoSala: "DS-1",
    acessoAtivo: false,
  });
  await page.goto("/pages/auth/Login/Log-aluno.html");
  await page.locator("#Email input").fill(email);
  await page.locator("#Senha input").fill(password);
  const dialogPromise = page.waitForEvent("dialog");
  await page.locator("form").evaluate((form) => form.requestSubmit());
  const dialog = await dialogPromise;
  expect(dialog.message()).toContain("O acesso desta conta foi revogado");
  await dialog.accept();
  await expect(page).toHaveURL(/\/pages\/auth\/Login\/Log-aluno\.html$/);
});
