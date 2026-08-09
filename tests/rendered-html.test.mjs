import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Prompt Studio mission", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Prompt Studio — atelier guidé<\/title>/i);
  assert.match(html, /Du besoin flou/);
  assert.match(html, /HelioTech Services · Cap Managers/);
  assert.match(html, /Prompt Lab/);
  assert.match(html, /Quality Check/);
  assert.match(html, /horizonduo\.net/);
  assert.doesNotMatch(html, /codex-preview|loading skeleton|react-loading-skeleton/i);
});

test("ships the finished interface and its workshop resources", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /localStorage/);
  assert.match(page, /Exploitable/);
  assert.match(page, /À corriger ou vérifier/);
  assert.match(page, /À ne pas diffuser/);
  assert.match(page, /Bibliothèque personnelle/i);
  assert.match(page, /Variables rapides/i);
  assert.match(page, /workshopIntroVideoUrl/);
  assert.match(page, /SAS CONFIDENTIALITÉ AVANT IA/);
  assert.match(page, /Du prompt à la méthode réutilisable/);
  assert.match(page, /methodStable/);
  assert.match(page, /Validation humaine indispensable/);
  assert.match(page, /matière première d’un Skill/);
  assert.match(page, /pack-fiches-prompt-engineering\.pdf/);
  assert.match(layout, /Prompt Studio/);
  assert.match(css, /--violet/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/resources/pack-fiches-prompt-engineering.pdf", import.meta.url));
});
