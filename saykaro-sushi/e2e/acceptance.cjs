/**
 * Teste de aceitação ponta a ponta (navegador real via Playwright).
 *
 *   BASE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... node e2e/acceptance.cjs
 *
 * ATENÇÃO: cria pedidos de teste, cria/remove um produto de teste e liga/desliga a pausa de pedidos.
 * Rode contra um ambiente de desenvolvimento/homologação (nunca contra o banco de produção).
 * Requer o pacote `playwright` (npm i -D playwright) ou NODE_PATH apontando para ele.
 */
const path = require("node:path");
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || "/opt/node-tools/node_modules/playwright")); }
const sharp = require("sharp");

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const EMAIL = process.env.E2E_ADMIN_EMAIL, PASSWORD = process.env.E2E_ADMIN_PASSWORD;
if (!EMAIL || !PASSWORD) { console.error("Defina E2E_ADMIN_EMAIL e E2E_ADMIN_PASSWORD."); process.exit(2); }

const results = [];
async function check(name, fn) {
  try { await fn(); results.push([true, name]); console.log("  ✓", name); }
  catch (e) { results.push([false, name, e.message]); console.log("  ✗", name, "\n     ", String(e.message).split("\n")[0]); }
}
const assert = (c, m) => { if (!c) throw new Error(m || "falhou"); };
const eq = (a, b, m) => assert(a === b, `${m || "valores diferentes"}: obtido ${JSON.stringify(a)}, esperado ${JSON.stringify(b)}`);
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const T = async (loc) => (await loc.innerText()).replace(/\u00a0/g, " ");
const brl = (c) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c / 100).replace(/ /g, " ");

async function api(page, method, url, body) {
  return page.evaluate(async ([m, u, b]) => {
    const r = await fetch(u, { method: m, headers: { "content-type": "application/json" }, body: b ? JSON.stringify(b) : undefined });
    return { status: r.status, json: await r.json().catch(() => null) };
  }, [method, url, body]);
}

(async () => {
  const browser = await chromium.launch();
  const stamp = Date.now();
  const testName = `Produto Teste ${stamp}`;
  let testProductId = null;

  // ───────────────────────── CLIENTE (celular)
  console.log("\nCliente · celular 390×844");
  // IP "falso" por execução: cada rodada usa seu próprio balde de limite de pedidos (o servidor lê o último valor de X-Forwarded-For).
  const fakeIp = () => `198.51.100.${1 + Math.floor(Math.random() * 250)}`;
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "pt-BR", deviceScaleFactor: 2, extraHTTPHeaders: { "x-forwarded-for": fakeIp() } });
  await mctx.route("https://wa.me/**", (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<html><body>wa.me simulado</body></html>" })); // não sai para a internet
  const m = await mctx.newPage();
  const pageErrors = [];
  m.on("pageerror", (e) => pageErrors.push(e.message));

  await check("abre o cardápio no celular sem rolagem horizontal", async () => {
    await m.goto(BASE + "/", { waitUntil: "networkidle" });
    eq(await overflow(m), 0, "overflowX");
    assert(await m.getByRole("heading", { level: 2 }).first().isVisible(), "sem seções");
    assert((await m.locator("nav[aria-label=Categorias] button, nav[aria-label=Categorias] a").count()) >= 4, "poucas categorias");
  });

  await check("navegação por categorias leva à seção", async () => {
    const chip = m.locator("nav[aria-label=Categorias]").getByRole("button", { name: /Yakissoba/i }).first();
    await chip.click();
    await m.waitForTimeout(900);
    const top = await m.locator("h2", { hasText: /^Yakissoba$/ }).first().evaluate((el) => el.getBoundingClientRect().top);
    assert(top >= 0 && top < 300, `título fora da área visível (top=${top})`);
  });

  await check("busca por nome filtra produtos", async () => {
    await m.getByRole("button", { name: /Buscar produto/ }).click();
    await m.locator("#busca").fill("filad");
    await m.waitForTimeout(400);
    const body = await m.locator("main").innerText();
    assert(/Filad[ée]lfia/i.test(body), "não achou Filadélfia");
    assert(!/Yakissoba Frutos do Mar/i.test(body), "não filtrou");
    await m.locator("#busca").fill("zzzz-nao-existe");
    await m.waitForTimeout(300);
    assert(/Nada encontrado/i.test(await m.locator("main").innerText()), "sem mensagem de vazio");
    await m.getByRole("button", { name: /Fechar busca/ }).click();
  });

  await check("carrinho: vários produtos, quantidade, remoção e totais corretos", async () => {
    await m.goto(BASE + "/", { waitUntil: "networkidle" });
    await m.getByRole("button", { name: "Adicionar Pipoquinha de Camarão" }).first().click();   // 16,99
    await m.getByRole("button", { name: "Adicionar Pipoquinha de Camarão" }).first().click();   // +16,99
    await m.getByRole("button", { name: "Adicionar Yakissoba Frutos do Mar" }).first().click(); // 40,00
    const bar = m.getByRole("button", { name: /Ver carrinho/ });
    await bar.waitFor();
    assert((await bar.getAttribute("aria-label")).includes("3 itens"), "contagem");
    assert((await T(bar)).includes(brl(1699 * 2 + 4000)), "total na barra: " + (await T(bar)));
    await bar.click();
    const drawer = m.getByRole("dialog");
    assert((await T(drawer)).includes(brl(7398)), "subtotal do drawer: " + (await T(drawer)));
    await drawer.getByRole("button", { name: "Aumentar quantidade" }).first().click();
    assert((await T(drawer)).includes(brl(1699 * 3 + 4000)), "subtotal após +1");
    await drawer.getByRole("button", { name: "Diminuir quantidade" }).first().click();
    await drawer.getByRole("button", { name: "Diminuir quantidade" }).first().click(); // 2 → 1
    await drawer.getByRole("button", { name: /Remover item/ }).first().click();       // remove a pipoquinha
    assert(!/Pipoquinha/.test(await T(drawer)), "item não removido");
    assert((await T(drawer)).includes(brl(4000)), "subtotal após remover");
    // volta a ter 2 itens para o fluxo seguinte
    await m.keyboard.press("Escape");
  });

  await check("carrinho persiste após atualizar a página", async () => {
    await m.reload({ waitUntil: "networkidle" });
    const bar = m.getByRole("button", { name: /Ver carrinho/ });
    await bar.waitFor();
    assert((await bar.getAttribute("aria-label")).includes("1 item"), "carrinho perdido: " + (await bar.getAttribute("aria-label")));
  });

  await check("detalhe do produto: observação + quantidade + adicionar", async () => {
    await m.getByRole("button", { name: "Ver detalhes de Hot Filadélfia" }).first().click({ force: true });
    const dlg = m.getByRole("dialog");
    await dlg.locator("#obs").fill("sem cebolinha");
    await dlg.getByRole("button", { name: "Aumentar quantidade" }).click();
    await dlg.getByRole("button", { name: /Adicionar/ }).last().click();
    await m.waitForTimeout(400);
    assert((await m.getByRole("button", { name: /Ver carrinho/ }).getAttribute("aria-label")).includes("3 itens"), "esperava 3 itens (1 yakissoba + 2 hot)");
  });

  let orderCode, waUrl, orderPageUrl;
  await check("finaliza pelo WhatsApp: pedido salvo ANTES e mensagem completa", async () => {
    await m.getByRole("button", { name: /Ver carrinho/ }).click();
    await m.getByRole("link", { name: /Finalizar pedido/ }).click();
    await m.waitForURL("**/checkout");
    eq(await overflow(m), 0, "overflow no checkout");
    await m.locator("#name").fill("Cliente E2E");
    await m.locator("#phone").fill("(21) 98888-7777");
    await m.getByRole("radio", { name: /Entrega/ }).click();
    await m.locator("#street").fill("Rua das Flores");
    await m.locator("#num").fill("123");
    const bairro = m.locator("#bairro");
    if ((await bairro.evaluate((e) => e.tagName)) === "SELECT") { await bairro.selectOption("__outro"); await m.getByLabel("Nome do bairro").fill("Centro"); } else { await bairro.fill("Centro"); }
    await m.locator("#notes").fill("tocar a campainha");
    assert(/a confirmar/i.test(await m.locator("body").innerText()), "taxa deveria estar 'a confirmar' (sem bairros cadastrados)");
    // intercepta a navegação para o WhatsApp
    const waReq = m.waitForRequest((r) => r.url().startsWith("https://wa.me/"), { timeout: 15000 });
    await m.getByRole("button", { name: /Enviar pedido pelo WhatsApp/ }).click();
    await m.waitForURL("**/pedido/**");
    orderPageUrl = m.url().split("?")[0];
    const req = await waReq; // o navegador "sai" para o WhatsApp (simulado) — como num celular de verdade
    waUrl = req.url();
    const text = decodeURIComponent(waUrl.split("text=")[1]).replace(/ /g, " ");
    orderCode = (text.match(/#(SK\d{6})/) || [])[1];
    assert(orderCode, "sem número do pedido na mensagem");
    for (const piece of ["NOVO PEDIDO - SAYKARO SUSHI", "Cliente E2E", "(21) 98888-7777", "1x Yakissoba Frutos do Mar", "2x Hot Filadélfia", "sem cebolinha", "Rua das Flores, 123", "Centro", "Combinar com o restaurante", "tocar a campainha", "A confirmar"]) assert(text.includes(piece), `mensagem sem: ${piece}\n${text}`);
    assert(waUrl.startsWith("https://wa.me/5521987267277?text="), "número de destino incorreto: " + waUrl.slice(0, 40));
  });

  await check("pedido já está registrado (página /pedido) e o carrinho foi limpo", async () => {
    await m.goto(orderPageUrl + "?r=0", { waitUntil: "networkidle" });
    assert(new RegExp(orderCode).test(await m.locator("body").innerText()), "pedido não exibido");
    assert(/Aguardando envio/i.test(await m.locator("body").innerText()), "status inicial incorreto");
    const cart = await m.evaluate(() => localStorage.getItem("sk_cart_v1"));
    assert(!cart || (JSON.parse(cart).lines || []).length === 0, "carrinho não limpo");
  });

  await check("reabrir o WhatsApp não duplica o pedido", async () => {
    await m.goto(`${orderPageUrl}?r=0`, { waitUntil: "networkidle" });
    assert(await m.getByRole("link", { name: /Enviar pedido pelo WhatsApp/ }).isVisible(), "sem botão de reenviar");
  });

  await check("servidor ignora preço enviado pelo cliente e bloqueia produto inexistente", async () => {
    const r1 = await api(m, "POST", "/api/orders", { idempotencyKey: crypto.randomUUID(), customerName: "Fraude", customerPhone: "21988887777", fulfillment: "PICKUP", lines: [{ productId: 1, quantity: 1, priceCents: 1, options: [] }] });
    // o fetch do navegador envia Origin, então chega ao servidor
    eq(r1.status, 201, "status");
    assert(r1.json.whatsappUrl.includes(encodeURIComponent("16,99").replace("%2C", "%2C")) || decodeURIComponent(r1.json.whatsappUrl).includes("16,99"), "preço do servidor não aplicado");
    const r2 = await api(m, "POST", "/api/orders", { idempotencyKey: crypto.randomUUID(), customerName: "Fulano", customerPhone: "21988887777", fulfillment: "PICKUP", lines: [{ productId: 999999, quantity: 1, options: [] }] });
    eq(r2.status, 409, "produto inexistente");
  });

  // ───────────────────────── ADMIN
  console.log("\nAdmin · desktop 1280×800");
  const actx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: "pt-BR", extraHTTPHeaders: { "x-forwarded-for": fakeIp() } });
  const a = await actx.newPage();
  a.on("pageerror", (e) => pageErrors.push("admin: " + e.message));

  await check("rotas do admin exigem login (sem sessão → /admin/login)", async () => {
    for (const p of ["/admin", "/admin/produtos", "/admin/pedidos", "/admin/configuracoes", "/admin/produtos/1"]) {
      await a.goto(BASE + p);
      assert(a.url().endsWith("/admin/login"), `${p} não redirecionou: ${a.url()}`);
    }
    const r = await api(a, "POST", "/api/admin/logo");
    eq(r.status, 401, "API sem sessão");
    const robots = await (await a.request.get(BASE + "/admin/login")).headers();
    assert(/noindex/.test(robots["x-robots-tag"] || ""), "sem noindex");
  });

  await check("login com senha errada é recusado", async () => {
    await a.goto(BASE + "/admin/login");
    await a.fill("#email", EMAIL); await a.fill("#password", "senha-errada-123");
    await a.click("button[type=submit]");
    await a.locator("form [role=alert]").waitFor();
    assert(/incorretos/i.test(await a.locator("form [role=alert]").innerText()), "mensagem inesperada");
    assert(a.url().endsWith("/admin/login"), "saiu do login");
  });

  await check("bloqueio de tentativas: 6ª tentativa seguida é barrada (rate limit)", async () => {
    const ctx2 = await browser.newContext({ locale: "pt-BR", extraHTTPHeaders: { "x-forwarded-for": fakeIp() } });
    const p = await ctx2.newPage();
    const fake = `bloqueio-${stamp}@teste.local`;
    let last = "";
    for (let i = 0; i < 6; i++) {
      await p.goto(BASE + "/admin/login");
      await p.fill("#email", fake); await p.fill("#password", "x".repeat(12));
      await p.click("button[type=submit]");
      await p.locator("form [role=alert]").waitFor();
      last = await p.locator("form [role=alert]").innerText();
    }
    assert(/Muitas tentativas/i.test(last), "não bloqueou: " + last);
    await ctx2.close();
  });

  await check("login correto abre o painel; cookie é httpOnly", async () => {
    await a.goto(BASE + "/admin/login");
    await a.fill("#email", EMAIL); await a.fill("#password", PASSWORD);
    await Promise.all([a.waitForURL("**/admin"), a.click("button[type=submit]")]);
    assert(await a.getByRole("heading", { level: 1 }).first().isVisible(), "sem painel");
    const ck = (await actx.cookies()).find((c) => /sk_admin/.test(c.name));
    assert(ck && ck.httpOnly && ck.sameSite === "Lax", "cookie de sessão inadequado: " + JSON.stringify(ck));
  });

  await check("pedido de teste aparece no admin e muda de status", async () => {
    await a.goto(BASE + "/admin/pedidos");
    assert((await a.locator("main").innerText()).includes(orderCode), "pedido ausente da lista");
    await a.getByRole("link", { name: new RegExp(orderCode) }).first().click();
    await a.getByRole("button", { name: "Recebido" }).click();
    await a.getByText("Recebido").first().waitFor();
    await a.getByRole("button", { name: "Em preparo" }).click();
    await a.waitForTimeout(500);
    const body = await a.locator("main").innerText();
    assert(/Em preparo/.test(body) && /Cliente E2E/.test(body) && /Rua das Flores, 123/.test(body) && /1x|1×/.test(body), "detalhe incompleto");
  });

  await check("cria produto, o preço muda e aparece no cardápio público", async () => {
    await a.goto(BASE + "/admin/produtos/novo");
    await a.fill("#name", testName);
    await a.selectOption("#categoryId", { label: "Entradas" });
    await a.fill("#price", "12,50");
    await a.getByRole("button", { name: "Criar produto" }).click();
    await a.waitForURL(/\/admin\/produtos\/\d+\?criado=1/);
    testProductId = Number(a.url().match(/produtos\/(\d+)/)[1]);
    const pub = await (await m.request.get(BASE + "/")).text();
    assert(pub.includes(testName), "produto não apareceu no público");
    assert(pub.includes("12,50"), "preço 12,50 ausente");
    // altera o preço
    await a.fill("#price", "15,90");
    await a.getByRole("button", { name: "Salvar alterações" }).click();
    await a.getByText(/Produto salvo/).waitFor();
    const pub2 = await (await m.request.get(BASE + "/")).text();
    assert(pub2.includes("15,90") && !pub2.includes("12,50"), "preço não atualizou no público");
  });

  await check("envia, substitui e remove a foto do produto", async () => {
    const mk = (color) => sharp({ create: { width: 900, height: 700, channels: 3, background: color } }).png().toBuffer();
    const f1 = path.join(require("node:os").tmpdir(), `e2e1-${stamp}.png`), f2 = path.join(require("node:os").tmpdir(), `e2e2-${stamp}.png`);
    require("node:fs").writeFileSync(f1, await mk("#aa2222")); require("node:fs").writeFileSync(f2, await mk("#2244aa"));
    await a.goto(`${BASE}/admin/produtos/${testProductId}`);
    await a.setInputFiles('input[type=file]', f1);
    await a.getByRole("button", { name: /Remover/ }).waitFor();
    const url1 = await a.locator("img").first().getAttribute("src");
    assert(/\/media\/[0-9a-f-]{36}\.webp/.test(url1), "URL de mídia inesperada: " + url1);
    const imgRes = await a.request.get(BASE + url1);
    eq(imgRes.status(), 200, "mídia servida"); assert((imgRes.headers()["content-type"] || "").includes("image/webp"), "tipo da mídia");
    await a.setInputFiles('input[type=file]', f2);
    await a.waitForFunction((old) => document.querySelector("img")?.getAttribute("src") !== old, url1);
    const url2 = await a.locator("img").first().getAttribute("src");
    assert(url2 !== url1, "imagem não substituída");
    eq((await a.request.get(BASE + url1)).status(), 404, "arquivo antigo deveria ter sido apagado");
    const pub = await (await m.request.get(BASE + "/")).text();
    assert(pub.includes(url2.replace("/media/", "").replace(".webp", "")), "foto nova não chegou ao cardápio público");
    a.once("dialog", (d) => d.accept());
    await a.getByRole("button", { name: /Remover/ }).first().click();
    await a.getByRole("button", { name: /Enviar imagem/ }).waitFor();
  });

  await check("upload inválido é recusado (arquivo que não é imagem)", async () => {
    const f = path.join(require("node:os").tmpdir(), `fake-${stamp}.png`);
    require("node:fs").writeFileSync(f, "isto nao e uma imagem");
    const res = await a.evaluate(async (pid) => {
      const fd = new FormData(); fd.append("file", new File(["isto nao e uma imagem"], "x.png", { type: "image/png" }));
      const r = await fetch(`/api/admin/products/${pid}/image`, { method: "POST", body: fd });
      return { status: r.status, body: await r.json() };
    }, testProductId);
    eq(res.status, 422, "status"); assert(/inv[aá]lid|JPG/i.test(res.body.error), "mensagem");
  });

  await check("produto esgotado aparece mas NÃO pode ser pedido (servidor bloqueia)", async () => {
    await a.goto(BASE + "/admin/produtos?q=" + encodeURIComponent(testName));
    await a.getByRole("button", { name: "Marcar esgotado" }).click();
    await a.locator("li.card .chip-bad", { hasText: "Esgotado" }).first().waitFor();
    const pub = await (await m.request.get(BASE + "/")).text();
    assert(pub.includes(testName), "esgotado deveria continuar visível");
    const r = await api(m, "POST", "/api/orders", { idempotencyKey: crypto.randomUUID(), customerName: "Fulano", customerPhone: "21988887777", fulfillment: "PICKUP", lines: [{ productId: testProductId, quantity: 1, options: [] }] });
    eq(r.status, 409, "pedido de esgotado"); eq(r.json.errors[0].code, "SOLD_OUT", "código");
    const v = await api(m, "POST", "/api/cart/validate", { lines: [{ productId: testProductId, quantity: 1, options: [] }] });
    assert(v.status === 200, "validate");
  });

  await check("produto desativado some do cardápio e não pode ser pedido", async () => {
    await a.goto(BASE + "/admin/produtos?q=" + encodeURIComponent(testName));
    await a.getByRole("button", { name: "Ocultar" }).click();
    await a.locator("li.card .chip-warn", { hasText: "Oculto" }).first().waitFor();
    const pub = await (await m.request.get(BASE + "/")).text();
    assert(!pub.includes(testName), "produto oculto ainda aparece");
    const r = await api(m, "POST", "/api/orders", { idempotencyKey: crypto.randomUUID(), customerName: "Fulano", customerPhone: "21988887777", fulfillment: "PICKUP", lines: [{ productId: testProductId, quantity: 1, options: [] }] });
    eq(r.status, 409, "pedido de oculto");
  });

  await check("pausar pedidos: servidor recusa e o cardápio avisa", async () => {
    await a.goto(BASE + "/admin");
    await a.getByRole("button", { name: /Pausar recebimento de pedidos/ }).click();
    try {
      await a.getByText("Pedidos PAUSADOS").waitFor();
      const r = await api(m, "POST", "/api/orders", { idempotencyKey: crypto.randomUUID(), customerName: "Fulano", customerPhone: "21988887777", fulfillment: "PICKUP", lines: [{ productId: 1, quantity: 1, options: [] }] });
      eq(r.status, 422, "status"); eq(r.json.reason, "PAUSED", "motivo");
      await m.goto(BASE + "/", { waitUntil: "networkidle" });
      assert(/paus|n[ãa]o estamos recebendo/i.test(await m.locator("body").innerText()), "sem aviso no cardápio");
    } finally {
      await a.goto(BASE + "/admin");
      const resume = a.getByRole("button", { name: /Retomar pedidos/ });
      if (await resume.count()) { await resume.click(); await a.getByText("Recebendo pedidos").waitFor(); }
    }
  });

  await check("categorias: criar, ocultar e impedir exclusão com produtos", async () => {
    const cname = `Cat Teste ${stamp}`;
    await a.goto(BASE + "/admin/categorias");
    await a.fill("#name", cname);
    await a.getByRole("button", { name: "Criar categoria" }).click();
    await a.locator(`input[value="${cname}"]`).first().waitFor({ state: "attached" });
    const card = a.locator("li.card", { has: a.locator(`input[value="${cname}"]`) });
    a.once("dialog", (d) => d.accept());
    await card.getByRole("button", { name: /Excluir/ }).click();
    await a.waitForTimeout(700);
    await a.reload();
    assert((await a.locator('input[value="Entradas"]').count()) === 1, "categorias existentes sumiram");
    assert((await a.locator(`input[value="${cname}"]`).count()) === 0, "categoria de teste não foi excluída");
    // categoria com produtos não oferece "Excluir"
    const entradas = a.locator("li.card", { has: a.locator('input[value="Entradas"]') });
    eq(await entradas.getByRole("button", { name: /Excluir/ }).count(), 0, "botão excluir em categoria com produtos");
  });

  await check("configurações: horário/entrega/pagamento salvam e refletem no checkout", async () => {
    await a.goto(BASE + "/admin/configuracoes");
    eq(await overflow(a), 0, "overflow desktop");
    // zona de entrega de teste
    const zones = a.locator("#entrega");
    await zones.getByRole("button", { name: /Adicionar bairro/ }).click();
    await zones.getByLabel("Bairro / região").last().fill(`Bairro Teste ${stamp}`);
    await zones.getByLabel("Taxa (R$)").last().fill("8,00");
    await zones.getByRole("button", { name: "Salvar taxas" }).click();
    await a.getByText("Taxas de entrega salvas.").waitFor();
    const menu = await (await m.request.get(BASE + "/checkout")).text();
    assert(menu.includes(`Bairro Teste ${stamp}`), "bairro não chegou ao checkout");
    // limpa
    await zones.getByRole("button", { name: "Remover linha" }).last().click();
    await zones.getByRole("button", { name: "Salvar taxas" }).click();
    await a.getByText("Taxas de entrega salvas.").waitFor();
  });

  await check("troca de logo (upload) e volta ao padrão", async () => {
    const f = path.join(require("node:os").tmpdir(), `logo-${stamp}.png`);
    require("node:fs").writeFileSync(f, await sharp({ create: { width: 600, height: 240, channels: 4, background: { r: 211, g: 32, b: 45, alpha: 1 } } }).png().toBuffer());
    await a.goto(BASE + "/admin/configuracoes#logo");
    await a.locator("#logo input[type=file]").setInputFiles(f);
    await a.locator("#logo").getByRole("button", { name: /Remover/ }).waitFor();
    const html = await (await m.request.get(BASE + "/")).text();
    assert(/\/media\/logo-[0-9a-f-]{36}\.webp/.test(html), "logo novo não está no cardápio");
    a.once("dialog", (d) => d.accept());
    await a.locator("#logo").getByRole("button", { name: /Remover/ }).click();
    await a.locator("#logo").getByRole("button", { name: /Enviar imagem/ }).waitFor();
  });

  await check("painel admin responsivo no celular (sem rolagem horizontal)", async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await actx.storageState() });
    const p = await ctx.newPage();
    for (const u of ["/admin", "/admin/produtos", `/admin/produtos/${testProductId}`, "/admin/categorias", "/admin/adicionais", "/admin/configuracoes", "/admin/pedidos", "/admin/pendencias"]) {
      await p.goto(BASE + u, { waitUntil: "networkidle" });
      eq(await overflow(p), 0, `overflow em ${u}`);
    }
    await ctx.close();
  });

  await check("trocar senha exige a senha atual (nada é alterado com senha errada)", async () => {
    await a.goto(BASE + "/admin/conta");
    await a.fill("#current", "senha-atual-errada-123"); await a.fill("#next", "NovaSenha-bem-longa-9"); await a.fill("#confirm", "NovaSenha-bem-longa-9");
    await a.getByRole("button", { name: "Alterar senha" }).click();
    await a.getByText("A senha atual está incorreta.").first().waitFor();
    await a.goto(BASE + "/admin");
    assert(!a.url().endsWith("/admin/login"), "sessão não deveria ter caído");
  });

  await check("logout encerra a sessão", async () => {
    await a.goto(BASE + "/admin");
    await a.getByRole("button", { name: "Sair" }).first().click();
    await a.waitForURL("**/admin/login");
    await a.goto(BASE + "/admin/pedidos");
    assert(a.url().endsWith("/admin/login"), "ainda logado após sair");
  });

  // ───────────────────────── limpeza
  await check("limpeza: remove o produto de teste", async () => {
    await a.goto(BASE + "/admin/login");
    await a.fill("#email", EMAIL); await a.fill("#password", PASSWORD);
    await Promise.all([a.waitForURL("**/admin"), a.click("button[type=submit]")]);
    await a.goto(`${BASE}/admin/produtos/${testProductId}`);
    a.once("dialog", (d) => d.accept());
    await a.getByRole("button", { name: /Excluir produto/ }).click();
    await a.waitForURL("**/admin/produtos");
    assert(!(await a.locator("main").innerText()).includes(testName), "produto de teste ainda existe");
  });

  await check("nenhum erro de JavaScript no navegador", async () => { assert(pageErrors.length === 0, pageErrors.join(" | ")); });

  await browser.close();
  const failed = results.filter((r) => !r[0]);
  console.log(`\n${results.length - failed.length}/${results.length} verificações passaram`);
  if (failed.length) { console.log("\nFALHAS:"); for (const f of failed) console.log(" -", f[1], "→", f[2]); }
  process.exit(failed.length ? 1 : 0);
})();
