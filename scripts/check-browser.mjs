import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const base = process.env.TEST_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Execute apenas na demonstração local.");
const browser = await chromium.launch({
  channel: process.env.TEST_BROWSER || "msedge",
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base);
  await page.getByRole("button", { name: "Menu de navegação" }).click();
  await page.getByRole("navigation").getByText("Serviços").click();
  await page.getByRole("button", { name: "Facial", exact: true }).click();
  await page.locator("a.service").filter({ hasText: "Buço" }).click();
  await page.getByText("Demonstração local.", { exact: false }).waitFor();
  await page.getByRole("checkbox", { name: /Axila/ }).check();
  await page.getByRole("button", { name: /Continuar/ }).click();
  const days = page.locator(".weekgrid button:enabled");
  if (!(await days.first().isVisible({ timeout: 1000 })))
    await page.waitForFunction(
      () =>
        document.querySelector(".weekgrid button:enabled") ||
        document.body.textContent.includes("Nenhuma data livre"),
    );
  if ((await days.count()) === 0)
    await page.getByRole("button", { name: /Próximo/ }).click();
  await days.last().click();
  await page
    .getByRole("button", { name: /^\d\d:\d\d$/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Cliente de teste");
  await page.getByLabel("WhatsApp com DDD").fill("87988887777");
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await page.waitForURL("**/reserva/**");
  await page.getByText("STATUS · PENDENTE").waitFor();
  await page.reload();
  await page.getByText("STATUS · PENDENTE").waitFor();
  await page.getByRole("button", { name: "Cancelar agendamento" }).click();
  await page.getByRole("button", { name: "Sim, cancelar reserva" }).click();
  await page.getByText("STATUS · CANCELADO").waitFor();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "overflow em " + width,
    );
  }
  console.log(
    "Navegação, filtro, reserva, consulta, cancelamento e larguras 320–1440 px verificados.",
  );
} finally {
  await browser.close();
}
