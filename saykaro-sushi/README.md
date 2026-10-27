# Saykaro Sushi Delivery — cardápio digital + painel administrativo

Cardápio público em `/` (celular primeiro) e painel privado em `/admin`.
Pedido finalizado **pelo WhatsApp** (v1, sem cobrança online). A arquitetura já separa carrinho, pedido, pagamento e confirmação para plugar Mercado Pago/Pix/cartão depois (veja [`docs/PAGAMENTOS.md`](docs/PAGAMENTOS.md)).

| | |
|---|---|
| Cardápio | `/` |
| Painel | `/admin` (login obrigatório) |
| Pedido do cliente | `/pedido/<token>` (link privado, `noindex`) |

## Prévia
Capturas do sistema (dados de exemplo; produtos ainda sem foto mostram o espaço reservado):
[celular 1](docs/previa/1-cliente-celular-parte1.png) · [celular 2](docs/previa/2-cliente-celular-parte2.png) · [cardápio no desktop](docs/previa/3-cardapio-desktop.png) · [painel](docs/previa/4-admin-painel.png) · [produtos](docs/previa/5-admin-produtos.png) · [pedido](docs/previa/6-admin-detalhe-do-pedido.png) · [editar produto](docs/previa/7-admin-editar-produto.png) · [restaurante](docs/previa/8-admin-restaurante.png)

**Temas:** o cardápio e o painel abrem no tema **claro**; o botão de lua/sol no topo alterna para o tema escuro (a escolha fica salva só naquele aparelho). As cores ficam em `src/app/globals.css` (`@theme` = claro, `[data-theme="dark"]` = escuro).

## Tecnologias
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 + PostgreSQL · sharp (imagens) · zod (validação) · Vitest + Playwright (testes).

## Rodar localmente
Requisitos: Node 20+ e PostgreSQL 14+.

```bash
cd saykaro-sushi
cp .env.example .env            # edite DATABASE_URL e gere um APP_SECRET (veja abaixo)
npm ci
npm run db:migrate              # cria as tabelas (dev)  — em produção: npm run db:deploy
npm run db:seed                 # importa o catálogo inicial (43 produtos, 6 categorias, pendências)
npm run admin:create            # cria o primeiro administrador (pergunta e-mail/senha no terminal)
npm run dev                     # http://localhost:3000   ·   painel: http://localhost:3000/admin
```

Gerar `APP_SECRET`: `openssl rand -base64 48`.

### Primeiro administrador (procedimento seguro)
Não existe usuário/senha padrão e **nenhuma senha fica no código**. Depois de migrar o banco:

```bash
npm run admin:create                                  # interativo: a senha digitada não aparece na tela
# ou, em servidor sem terminal interativo:
ADMIN_EMAIL=dono@exemplo.com ADMIN_NAME="Nome" ADMIN_PASSWORD='senha-longa-e-unica' npm run admin:create
npm run admin:create -- --reset                       # redefine a senha de um admin existente (e encerra as sessões dele)
```
Senha: mínimo 10 caracteres. Guardada apenas como hash **scrypt** (N=2¹⁵). Outros administradores podem ser criados repetindo o comando. Apague `ADMIN_PASSWORD` do histórico do shell/ambiente depois.

## Variáveis de ambiente
| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | sim | URL do PostgreSQL (`postgresql://usuario:senha@host:5432/banco?schema=public`). |
| `APP_SECRET` | sim em produção | Segredo (≥16 caracteres) usado para HMAC dos IPs/e-mails nos limites de tentativa. Nunca versionar. |
| `NEXT_PUBLIC_SITE_URL` | recomendado | URL pública (`https://seudominio.com.br`): links absolutos, sitemap, imagem de compartilhamento. |
| `UPLOAD_DIR` | não | Pasta das fotos/logo. Padrão `./storage/uploads`. **Em produção deve ser um disco persistente** (e entrar no backup). |
| `TRUSTED_PROXY_HOPS` | não (padrão 1) | Quantos proxies/CDNs confiáveis existem na frente do app (define qual IP do `X-Forwarded-For` vale). |
| `TEST_DATABASE_URL` | só testes | Banco **descartável** para os testes de integração (é apagado a cada execução). |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` | só `admin:create` | Uso opcional e pontual para criar o admin sem terminal interativo. |
| `MERCADOPAGO_*` | futuro | Comentadas no `.env.example`; sem uso na v1. |

## Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` / `build` / `start` | desenvolvimento / build de produção / servidor de produção |
| `npm run db:migrate` · `db:deploy` | migrações (dev, interativo) · (produção, só aplica as existentes) |
| `npm run db:seed` | importa o catálogo inicial. **Idempotente**: se já houver categorias não altera nada. |
| `npm run admin:create` | cria/redefine administrador |
| `npm run lint` | checagem de tipos (`tsc --noEmit`) |
| `npm test` | testes unitários + integração com PostgreSQL (se `TEST_DATABASE_URL` existir) |
| `node e2e/acceptance.cjs` | teste de aceitação no navegador (veja abaixo) |
| `./scripts/backup.sh` | backup do banco + fotos (use **antes** de atualizar) |

## Testes
* **Unitários** (`src/lib/*.test.ts`): dinheiro, preços/opções, horário aberto/fechado, mensagem do WhatsApp, IP do cliente.
* **Integração** (`src/server/orders.integration.test.ts`, PostgreSQL real): pedido idempotente, corrida de envios, esgotado/oculto/inexistente, opções obrigatórias, taxa por bairro (e “a confirmar”), pausa, forma de pagamento, limite por IP, histórico imutável.
* **Aceitação ponta a ponta** (`e2e/acceptance.cjs`, Chromium): roteiro completo do cliente no celular e do administrador no desktop (28 verificações).
  ```bash
  npm i -D playwright            # (ou use um Playwright já instalado: PLAYWRIGHT_PATH=/caminho/playwright)
  BASE_URL=http://localhost:3000 E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... node e2e/acceptance.cjs
  ```
  Cria pedidos de teste e um produto temporário (removido ao final). **Use só em desenvolvimento/homologação.**

## Segurança (resumo)
* Login real: senha com **scrypt**, comparação em tempo constante, mesmo tempo de resposta para e-mail inexistente.
* Sessão no banco (token aleatório de 256 bits, só o **hash SHA-256** é guardado), cookie `HttpOnly` + `SameSite=Lax` (+ `Secure` e prefixo `__Host-` em produção), validade de 7 dias, logout encerra no servidor.
* **Limite de tentativas** de login: 5 falhas por IP+e-mail / 15 min e 30 por IP; IPs e e-mails guardados só como HMAC.
* Toda página, Server Action e rota `/api/admin/*` confere a sessão **no servidor** (o middleware é só a 1ª barreira). Server Actions têm proteção de origem (CSRF) do Next; rotas de upload checam `Origin`.
* Preço, disponibilidade e opções **sempre recalculados no servidor**; o cliente só envia IDs e quantidades. Dinheiro em centavos inteiros.
* Uploads: tipo decidido pelo **conteúdo** (não pela extensão), apenas JPG/PNG/WebP até 5 MB, redimensionados e regravados em WebP com nome aleatório (UUID); servidos por rota que só aceita esse padrão de nome (sem *path traversal*).
* Pedidos: criação idempotente, limite de 8 pedidos/10 min por IP, tamanho de requisição limitado.
* Cabeçalhos: `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `/admin`, `/api/admin`, `/pedido` e `/checkout` com `noindex` e sem cache.
* Dados pessoais (nome, telefone, endereço) ficam só no banco e no painel; não vão para logs nem URLs. O backup também os contém — proteja-o.

## Estrutura
```
prisma/            schema, migrações, seed (catálogo inicial + pendências)
scripts/           create-admin.ts, backup.sh
src/lib/           regras puras e testáveis (dinheiro, preços, horários, WhatsApp, schemas)
src/server/        banco, autenticação, pedidos, catálogo, imagens, pagamentos (camada futura)
src/app/           páginas e rotas (cardápio, checkout, pedido, /admin, /api)
src/components/    UI do cardápio, carrinho e painel
e2e/               teste de aceitação
docs/              ROLLBACK, DEPLOY, PAGAMENTOS, CATALOGO
```

## Documentação
* [`docs/ROLLBACK.md`](docs/ROLLBACK.md) — como desfazer/restaurar (código, banco, fotos).
* [`docs/DEPLOY.md`](docs/DEPLOY.md) — publicar em produção.
* [`docs/CATALOGO.md`](docs/CATALOGO.md) — atualizar cardápio, trocar fotos/logo, resolver pendências.
* [`docs/PAGAMENTOS.md`](docs/PAGAMENTOS.md) — onde o Mercado Pago/Pix/cartão se encaixa.
