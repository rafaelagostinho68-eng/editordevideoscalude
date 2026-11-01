# Auditoria do artigo "Melhor app de agendamento para manicure e nail designer" (Agendali)

Data de referência: 01/11/2026 (America/Sao_Paulo). Análise independente: as conclusões abaixo são minhas, com as evidências e limites indicados em cada ponto.

**Nada foi publicado.** Não tive acesso ao projeto nem ao VPS do Agendali. Trabalhei sobre a versão **pública** do artigo, baixada de produção em 01/11/2026 (19:28 GMT), e produzi uma **cópia isolada** com as melhorias. Tudo está em `seo-manicure/` neste repositório.

---

## 0. Resumo executivo

1. **O artigo do Agendali já é, em profundidade e confiança, superior ao da GENDA.** Fontes e datas por dado, metodologia, telas reais, vídeo, dados estruturados válidos. Não era preciso refazê-lo.
2. **Mas a GENDA tem três vantagens observáveis que explicam bem a aparição dela em respostas de IA**, sem precisar de teorias sobre automação ou datas artificiais:
   - **Plano grátis permanente** (1 profissional, 50 mensagens de WhatsApp por mês). É um fato de produto, e "grátis" é uma das intenções mais comuns de quem busca "app para manicure".
   - **Resposta curta com recomendação nomeada na primeira dobra**, no formato "para X, a Y". O Agendali abre com uma lista de 7 perfis e a primeira pergunta do FAQ começa com "Não existe um único melhor".
   - **Documento curto e fácil de extrair**: 2.133 palavras contra 5.117 do Agendali (antes desta revisão). No celular (390 px), a resposta da GENDA começa em 756 px e a tabela em 1.237 px; no Agendali, em 965 px e 2.726 px.
3. **Descoberta que importa:** o artigo do Agendali afirmava que "nenhum dos sete divulga plano gratuito permanente". Com a GENDA no mercado, essa frase deixou de ser verdadeira. Corrigir isso é mais importante do que acrescentar palavras-chave.
4. **O que implementei (isolado):** resumo direto no início da "Resposta rápida" (sem seção nova), 9 sistemas (entram GENDA Beleza e Horario.vc, ambos lidos nas páginas oficiais), FAQ corrigido, Google Agenda e exemplo de durações de serviços de unha, capa nova (a arte dizia "7 sistemas"), data real `01/11/2026` e histórico recolhido.
5. **O que não consegui fazer:** ver o Search Console/Bing Webmaster, rodar o ChatGPT e medir Core Web Vitals reais. Detalhes na seção 6.
6. **Um custo da revisão que você precisa decidir:** o texto cresceu 27% (5.117 → 6.502 palavras) e a tabela, no celular, ficou ~930 px mais longe (2.726 → 3.654 px). Mitiguei com um link "Ir direto para a tabela" dentro do resumo, mas é um trade-off real (seção 14).

---

## 1. Regra zero: backup, hashes e rollback

**Acesso ao projeto:** não tenho. Não inventei caminhos nem arquivos de servidor.

**Versão em produção que tomei como base:** `https://agendali.com.br/blog/melhor-app-agendamento-manicure/`, baixada em 01/11/2026 19:28 GMT.

| Item | Valor |
|---|---|
| Resposta HTTP | 200, `text/html`, gzip, nginx 1.18 |
| `last-modified` do servidor | **Qui, 29/10/2026 21:07 GMT** |
| Data editorial no conteúdo | 21/10/2026 (`dateModified`, sitemap `lastmod`) |
| SHA-256 da versão em produção | `184dc910…085f74c` |

**Atenção antes de publicar:** o servidor informa modificação em 29/10, posterior à data editorial de 21/10. Pode ser só um rebuild, mas **eu não sei**. Antes de copiar qualquer coisa para produção, compare o arquivo do VPS com `original/melhor-app-agendamento-manicure.published-2026-11-01.html`. Se diferirem, reaplique minhas mudanças sobre a versão atual com `build_proposal.py` (ele falha de propósito se o trecho esperado não existir).

**Backup:** `original/` contém a versão publicada (e o artigo da GENDA lido), com `SHA256SUMS`. Os backups que você já tem no VPS não foram tocados (nem os vi).

**Hashes antes/depois:** `HASHES.md`.

**Rollback (3 passos):**
1. Restaurar o HTML anterior no VPS (o backup que você fará na etapa de publicação, idêntico a `original/…published-2026-11-01.html` se nada mudou).
2. Restaurar a linha do artigo no `sitemap.xml` para `<lastmod>2026-10-21</lastmod>`.
3. Opcional: remover os dois JPGs novos de `/assets/blog/capas/` (a capa antiga continua intacta, porque os arquivos novos têm nome diferente).

Como a capa nova tem **nome novo** e o artigo antigo não referencia esse nome, subir os JPGs antes do HTML é seguro.

---

## 2. Diagnóstico independente do artigo do Agendali

Li o conteúdo inteiro e olhei a página como as seis pessoas/máquinas que você descreveu (manicure iniciante, nail designer com faltas, quem já usa outro app, quem pesquisa preço, buscador, assistente de IA).

### Cinco maiores forças (preservadas)
1. **Transparência editorial rara:** autor declarado, "não localizado" com explicação, método de escolha e de verificação, canal para correção.
2. **Cada dado de preço tem fonte e data de consulta**, e o artigo explica a diferença entre preço mensal, plano por período, à vista, parcelado e teste. Isso é o que mais falta nos concorrentes.
3. **Evidência real do produto:** telas com dados fictícios, vídeo, recorrência, domínio próprio, sinal pelo Mercado Pago, cada recurso com a sua condição.
4. **Estrutura técnica sólida:** HTML estático (conteúdo legível sem JavaScript), canonical correto, redirects 301, gzip, `Article`, `ItemList`, `FAQPage`, `VideoObject`, `BreadcrumbList` válidos; tabela vira cartões no celular.
5. **Honestidade comercial:** o Agendali admite que não é marketplace, que não tem plano grátis permanente e que depende do WhatsApp conectado. Isso aumenta a citabilidade.

### Cinco maiores fraquezas
1. **Não havia resposta direta.** A "Resposta rápida por perfil" era uma lista de 7 cartões, e o FAQ principal começava com "Não existe um único melhor". É honesto, mas é o texto menos "citável" do documento.
2. **Afirmação factual defasada:** "nenhum dos sete divulga plano gratuito permanente" (FAQ + JSON-LD). Deixou de ser verdade com a GENDA.
3. **Cobertura:** faltavam concorrentes diretos que aparecem nas mesmas buscas (GENDA Beleza e Horario.vc, este com o **mesmo preço de lista**: R$ 39,90/mês e R$ 399/ano).
4. **Peso no celular:** 32 mil caracteres, a tabela a ~2.700 px da abertura e 20 mil px de página. A leitora que vem do Instagram precisa rolar muito para chegar à comparação.
5. **Atualidade e coerência:** "Atualizado em 21/10" (11 dias antes), a arte da capa e a imagem de compartilhamento diziam "7 sistemas", e a metodologia tinha um erro ("13 e 21/10/2026 de 2026").

Observação: o artigo já mostra apenas a data de **atualização** na área principal. O histórico de alterações já estava no fim, mas ocupava espaço no corpo; agora está recolhido.

---

## 3. Diagnóstico do artigo da GENDA Beleza

Lido na íntegra (cópia em `original/genda-melhores-apps-manicure.published-2026-11-01.html`).

**Fatos verificados:**
- Publicado em **28/10/2026**; `datePublished = dateModified = 2026-10-28`. **Não há evidência de atualização artificial de data**, e não afirmo isso.
- 2.133 palavras, **nenhuma imagem, nenhum vídeo**, 3 tabelas, `Article` + `FAQPage` + `BreadcrumbList`. Sem `og:image` no HTML.
- Estrutura: **"Resposta curta"** (recomenda a própria GENDA para "começar sem mensalidade", cita a menor mensalidade e o "plano único com tudo") → tabela de 9 sistemas → tabela de plano grátis/teste/lembrete → perfil por sistema → "o que uma manicure autônoma precisa" → **conta do custo de faltas** → **"Quando a GENDA Beleza não é a escolha certa"** → metodologia → FAQ (6 perguntas) → CTA "Criar conta grátis".
- Revela ser a autora do comparativo ("por isso ela aparece primeiro").
- Cita as páginas oficiais dos concorrentes, com data. Para a Agende-me, a fonte é um **post de blog do concorrente**, e para a Simples Agenda a página oficial **bloqueia acesso automatizado (403)** nas minhas tentativas; então não usei esses dois dados como fatos.
- Ecossistema: páginas próprias para nail designer, esmalteria, manicure autônoma, sobrancelha, cílios ("grátis, com WhatsApp") e 3 comparativos publicados no mesmo dia (28/10).

**O que eu não posso afirmar:** que a GENDA use automação ou IA para gerar texto; isso não tem evidência. Também não copiei nada: nem estrutura criativa, nem calculadora, nem tabelas.

**Dados do produto GENDA (páginas oficiais, 01/11/2026):** plano Grátis sem prazo (1 profissional, 50 mensagens de WhatsApp/mês, página de agendamento, histórico); teste de 5 dias, sem cartão; PRO R$ 39,90 (1 prof., 2.000 mensagens), Avançado R$ 79,90 (até 3), Escala R$ 129,90 (ilimitados); fora do grátis: mensalistas, produtos, marketing e prepagamento; conexão do WhatsApp por QR Code. O desconto de 10%/20% (trimestral/semestral) é informado, mas não li os valores em reais.

---

## 4. Matriz comparativa (notas heurísticas minhas, não oficiais)

Notas de 0 a 10 do **artigo antes desta revisão**. São julgamentos meus, baseados em evidências observáveis; não são pontuação do Google, do Bing ou do ChatGPT.

| # | Critério | Agendali | GENDA | Evidência |
|---|---|:--:|:--:|---|
| 1 | Intenção de busca | 8 | 8 | Ambos respondem "melhor app/apps para manicure"; a GENDA estreita para "autônoma" |
| 2 | Resposta direta | **5** | **9** | GENDA: "Resposta curta" com nomes; Agendali: lista de perfis + "Não existe um único melhor" |
| 3 | Qualidade da comparação | 9 | 7 | Agendali: 3 tabelas + fichas com fonte e data por dado |
| 4 | Profundidade útil | 9 | 6 | 5.117 vs 2.133 palavras |
| 5 | Atualidade | 7 | 8 | 21/10 vs 28/10 (mesma ordem de grandeza) |
| 6 | Verificabilidade de preços | 9 | 7 | GENDA cita um post de blog e um site com bloqueio para dois sistemas |
| 7 | Evidências de produto | **9** | **2** | Agendali: 9 imagens e vídeo; GENDA: nenhuma |
| 8 | Experiência mobile | 6 | 8 | Medido a 390 px: resposta em 965 vs 756 px; tabela em 2.726 vs 1.237 px |
| 9 | Dados estruturados | 9 | 7 | Agendali: Article+ItemList+FAQ+Video+Breadcrumb; GENDA: sem `og:image`, `dateModified` = publicação |
| 10 | SEO técnico | 8 | 7 | Ambos indexáveis; o Agendali tem sitemap com `lastmod` coerente |
| 11 | Links internos | 8 | 6 | 8 links relacionados e `/comparar/` vs 3 |
| 12 | Capacidade de conversão | 7 | 7 | 4 CTAs vs CTA único; o grátis permanente reduz atrito (produto, não texto) |
| 13 | Limitações dos sistemas | 9 | 7 | Agendali traz "pontos de atenção" de todos; GENDA é mais franca sobre si mesma |
| 14 | Extração por IA | **6** | **9** | Documento curto, resposta primeiro, tabelas simples |
| 15 | Originalidade e confiança | 8 | 6 | Metodologia, fontes e telas reais |

**Onde a GENDA é superior:** 2, 5, 8, 14.
**Onde o Agendali é superior:** 3, 4, 6, 7, 9, 11, 13, 15.
**Equivalentes:** 1, 10, 12.
**Preservar:** tudo o que dá vantagem ao Agendali (3, 6, 7, 9, 13, 15). Não toquei nessas camadas.

---

## 5. Por que a GENDA pode aparecer no ChatGPT: hipóteses e evidências

Em ordem de plausibilidade, com o que sustenta cada uma:

1. **Plano grátis permanente × intenção "app para manicure".** *Evidência:* fato de produto verificado na página oficial; a frase de abertura da GENDA o usa. Hipótese forte, mas indireta.
2. **Formato "resposta primeiro".** *Evidência:* observação direta dos dois textos. Um assistente que precisa de uma recomendação em uma frase encontra isso na GENDA e não encontra no Agendali.
3. **Documento curto e escaneável.** *Evidência:* medições de tamanho e de posição da tabela.
4. **Recência (28/10).** *Evidência:* data visível e sitemap da GENDA. **Fraca**: a diferença para 21/10 é pequena e não consigo saber se a recência pesa.
5. **Cluster de páginas da GENDA** (manicure, nail designer, esmalteria, comparativos) e o artigo citando o Agendali como fonte. *Evidência:* sitemap da GENDA. Não sei se influencia.

**O que NÃO pode ser concluído sem dados reais:** se o ChatGPT usou busca na web naquelas respostas; quais fontes ele efetivamente citou; se o artigo do Agendali foi **indexado/recuperado** pelo Bing/OAI-SearchBot; se a GENDA aparece por esse artigo ou por outra página; se a diferença é estável ou variação normal entre conversas.

**Rastreamento (verificado):** `robots.txt` do Agendali libera todos os agentes (`User-agent: *` / `Allow: /`) e aponta o sitemap; o artigo retorna 200 com o mesmo HTML para Googlebot, Bingbot, OAI-SearchBot, GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot e iPhone (testei pelo `User-Agent`; **não consigo provar que o CDN/firewall trata igual os IPs reais** desses rastreadores). Sem `X-Robots-Tag`, sem `noindex`. Conforme a documentação oficial da OpenAI (`platform.openai.com/docs/bots`, lida em 01/11/2026): o **OAI-SearchBot** controla a presença em resultados de busca do ChatGPT, o **GPTBot** controla o uso para treinamento (as duas regras são independentes) e o **ChatGPT-User** visita páginas por ação de um usuário, sem rastreamento automático, e pode não seguir o `robots.txt`. Permitir o OAI-SearchBot torna a página elegível para a busca do ChatGPT, mas **não garante recomendação**.

**Relato que não consegui verificar:** o texto que você colou de outra conversa diz que os logs do servidor mostram o ChatGPT-User buscando o artigo 6 vezes e o OAI-SearchBot 12 vezes. Eu não vi esses logs. Se for verdade, a página **é encontrada e lida** pela busca do ChatGPT, o que enfraquece a hipótese de problema de rastreamento e reforça a de "encontrada, mas não escolhida" (formato e produto), que é a que trabalhei.

### Testes de busca que consegui fazer

Plataforma: ferramenta de busca web deste assistente (geral, restrita aos EUA), em 01/11/2026. **Não é ChatGPT nem Google Brasil.** Amostra de 5 consultas: sem valor estatístico.

| Consulta | Agendali no resultado? | GENDA no resultado? | Fontes que apareceram |
|---|:--:|:--:|---|
| melhor app para manicure agendamento online | Não | Não | Koalendar, Planimani, Anolla, AgendaPro, Fresha |
| melhor app de agendamento para manicure autônoma 2026 | Não | Não | Koalendar, Avynel, Agendiva, Salão 365º |
| título exato do artigo do Agendali + "Agendali" | **Não** | Não | Koalendar, AgendaPro, apps da App Store |
| título exato do artigo da GENDA + "GENDA BELEZA" | Não | **Não** | Koalendar, AgendaPro, Capterra |
| agenda online manicure plano grátis whatsapp lembrete | Não | Não | Koalendar, Planimani, Minha Agenda, Tua Agenda, Booksy |

Leitura honesta: nem o artigo do Agendali nem o da GENDA apareceram, **inclusive buscando pelo título exato**. Isso mostra que **essa ferramenta não é um bom proxy do Google/Bing Brasil**, e não prova nada sobre queda do Agendali. Ela só mostra que, nessa ferramenta, as consultas com essa intenção são dominadas por opções grátis (Koalendar, Planimani).

---

## 6. Dados que não consegui obter

| Dado | Por quê |
|---|---|
| Search Console (7/28/90 dias, CTR, posição, consultas) | Sem acesso autorizado |
| Bing Webmaster Tools | Sem acesso autorizado |
| Respostas reais do ChatGPT | Não tenho o ChatGPT nem sessão logada |
| Core Web Vitals de campo (CrUX) | Sem acesso; medi só em laboratório |
| Logs do servidor (visitas de rastreadores) | Sem acesso ao VPS (a conversa que você colou menciona acessos do ChatGPT-User e do OAI-SearchBot ao artigo, mas eu não vi esses logs) |
| Cobertura de índice do Google/Bing | Só o Search Console/Bing mostram |

Não inventei volume de busca, posição, autoridade de domínio nem frequência de citação.

---

## 7. SEO técnico: o que encontrei

**Bem resolvido (não mexer):** HTTP 200; canonical correto; `http`, `www` e sem barra final redirecionam por 301 para a URL canônica; gzip; `lang="pt-BR"`; `robots index, follow`; sitemap com a URL (`lastmod 2026-10-21`, prioridade 0,90); H1 único e hierarquia H2/H3 coerente; todas as imagens com `alt` descritivo (a única sem `alt` é decorativa e tem `alt=""`); srcset e `fetchpriority` na capa; 57 links/recursos verificados.

**Problemas e observações:**

| # | Achado | Gravidade | Ação |
|---|---|---|---|
| 1 | Capa e imagem de compartilhamento (og:image) diziam **"7 sistemas"** | Média (inconsistência visível) | Corrigido: capa nova em arquivo novo |
| 2 | "9 apps" vs "7 apps" na meta description, og, twitter e JSON-LD | Média | Corrigido (contagem consistente) |
| 3 | FAQ e JSON-LD afirmavam que nenhum sistema tem plano grátis permanente | **Alta** (fato incorreto) | Corrigido |
| 4 | Erro de texto "13 e 21/10/2026 de 2026" | Baixa | Corrigido |
| 5 | Contraste 4,45:1 (mínimo 4,5:1) na célula "Semestral" do Agendali | Baixa | Corrigido com 1 regra CSS |
| 6 | `<aside>` aninhado dentro de `<article>` (alerta axe "complementary landmark") | Baixa | **Não alterei**: pré-existente e sem efeito em SEO |
| 7 | 2 links para a central de ajuda do AppBeleza retornam 403 para robôs | Baixa | Provável bloqueio de bot; humanos acessam. Conferir à mão |
| 8 | `last-modified` do servidor (29/10) ≠ `dateModified` (21/10) | Informativa | Ver seção 1 |
| 9 | `llms.txt` **não cita** sinal pelo Mercado Pago, atendimento recorrente nem o plano único | Média | Recomendação (fora do escopo; ver seção 17) |
| 10 | Marcação `FAQPage` | Informativa | Mantida e sincronizada com o texto. O Google restringiu o rich result de FAQ a sites de governo e saúde; aqui serve só como dado estruturado. **Não acrescentei** FAQPage em outras páginas |
| 11 | `Article.mentions` com `SoftwareApplication` só com nome e URL | Baixa | Mantido por consistência; não gera rich result |

**Dados estruturados (auditoria):** `Article` (headline, description, `datePublished` 2026-06-09, `dateModified`, author/publisher `Organization` com `@id`, `mainEntityOfPage`, `image`), `BreadcrumbList`, `Organization`, `ItemList`, `FAQPage`, `VideoObject`. Nenhuma avaliação, estrela, prêmio, número de clientes ou autor humano inventado. A `ItemList` e o `mentions` agora refletem os 9 sistemas.

**Desempenho (laboratório, sem throttling, não é Core Web Vitals de campo):** LCP 0,8 a 1,1 s e CLS ≈ 0 nas duas versões; HTML de 21,1 KB para 24,5 KB comprimido; DOM de 834 para 1.013 nós. Sem regressão aparente. Core Web Vitals reais dependem do CrUX/Search Console.

---

## 8. Consultas e intenções (e canibalização)

| Intenção | Consultas típicas | Dono da consulta |
|---|---|---|
| **A. Comparação e escolha** | melhor app para manicure, melhor aplicativo de agendamento 2026 | **Este artigo** |
| **B. Preço** | quanto custa app de agenda para manicure | Este artigo (tabela) + `/precos/` |
| **C. Funcionalidades** | confirma horário pelo WhatsApp, cobrar sinal, Pix | `/agenda-online-manicure/` e `/sistema-para-nail-designer/` (este artigo só compara) |
| **D. Problema** | reduzir faltas, organizar horários, link no Instagram | `/blog/como-evitar-faltas-manicure/`, `/blog/como-organizar-agenda-manicure/`, `/blog/link-agendamento-manicure-instagram/` |
| **E. Gratuito** | app grátis para manicure | **Este artigo, na FAQ** (agora com resposta correta) |
| **F. Autônoma** | app para manicure autônoma | `/blog/app-para-manicure-autonoma/` (guia) e este artigo (comparação) |
| **G. Com equipe** | sistema para esmalteria | `/sistema-agendamento-online-salao-de-beleza/` |
| **H. Pronta para contratar** | Agendali preço, teste grátis | `/precos/` |

**Risco de canibalização:** existe **sobreposição moderada** entre este artigo e `/blog/app-para-manicure-autonoma/` ("App para Manicure Autônoma: Como Organizar sua Agenda Sozinha") para consultas de "app para manicure autônoma". As intenções são diferentes (comparar vs organizar), então não recomendo mexer nos títulos. O artigo já liga para o guia. **Não criei novo artigo.**

---

## 9. Aplicativos no comparativo: 7 → 9

| Sistema | Decisão | Motivo |
|---|---|---|
| Agendali, AppBeleza, Booksy, Fresha, Minha Agenda, Trinks, Tua Agenda | Mantidos | Já verificados; preços reconferidos em 01/11 (exceto Fresha, ver abaixo) |
| **GENDA Beleza** | **Entra** | Página oficial em PT-BR, preços em R$, público de beleza, concorrente direto nas buscas |
| **Horario.vc** | **Entra** | Página oficial em PT-BR; mesmo preço de lista (R$ 39,90 / R$ 399 por ano); cita esmalterias e manicures |
| Agende-me | Fora | Não consegui ler uma página oficial de preços (a `/precos` retorna 404); só um post de blog |
| Simples Agenda | Fora | Site oficial bloqueia acesso automatizado (403); o preço que circula vem de outro comparativo |
| Koalendar, Planimani, Avynel, AgendaPro, Anolla | Fora | Estrangeiros, só para iPhone/sem página PT-BR comparável ou em espanhol; não verifiquei |

Escolhi **9 bem documentados em vez de 12 superficiais**.

**Fresha:** a página de preços respondeu em dólar (US$ 19,95, 100 mensagens) para o meu acesso dos EUA, ao contrário da versão brasileira lida em 21/10 (R$ 39,95, 20 mensagens). Como não consegui reconferir a versão brasileira, **mantive a leitura de 21/10** e escrevi isso na metodologia, em vez de "atualizar" com um dado que pode ser de outro país.

---

## 10. Matriz atualizada de preços e funcionalidades (1 profissional)

| Sistema | Mensal | Anual / período | Teste | Plano grátis permanente | Lembrete WhatsApp | Sinal | Leitura |
|---|---|---|---|---|---|---|---|
| **Agendali** | R$ 39,90 | R$ 399/ano | 7 dias, sem cartão | Não | Confirmação e lembrete, WhatsApp da empresa conectado; sem custo por mensagem | Opcional, Mercado Pago | 01/11 (`/precos/`) |
| AppBeleza | R$ 79,90 | R$ 670,80/ano; R$ 406,80/6 meses | 30 dias | Não localizado | Lembrete incluído; WhatsApp/SMS são módulos | Pagamento antecipado (exige ativação e CNPJ) | 01/11 |
| Booksy | R$ 99,99 + impostos | Não divulgado | 7 dias | Não localizado | Lembretes incluídos; canal não localizado | Não localizado | 01/11 |
| Fresha | R$ 39,95 | Não divulgado | 7 dias | Não localizado | 20 mensagens grátis/mês (versão BR) | Depósitos e taxa de cancelamento | **21/10** |
| **GENDA Beleza** | R$ 39,90 (PRO) | Desconto de 10% (tri) e 20% (semestral); valor não lido | 5 dias, sem cartão | **Sim** (50 msg/mês) | Incluso; pede confirmação; QR Code | Prepagamento fora do grátis | 01/11 |
| **Horario.vc** | R$ 39,90 (1-2 prof.) | R$ 399/ano | 7 dias, sem cartão | Não localizado | 100 msgs/mês, de um número do Horario.vc | Não localizado | 01/11 |
| Minha Agenda | Não localizado | Não localizado | 30 dias (App Store) | Não localizado | Sim (integração) | Registra cobranças; sinal não localizado | 21/10 |
| Trinks | Sob consulta | Sob consulta | 5 dias | Não localizado | Adicional ao plano | Link de pagamento (integração) | 01/11 |
| Tua Agenda | R$ 19,90 | R$ 199/ano; R$ 99,50/6 meses | 30 dias, sem cartão | Não localizado | Mensagens automáticas; custo extra possível | Sim (integrações) | 01/11 |

Cada ficha no artigo traz as fontes e as datas de consulta.

---

## 11. Diferenciais reais do Agendali pouco explorados

Todos confirmados nas **páginas públicas** do Agendali (`/precos/`, `/sistema-para-nail-designer/`, `/agenda-online-manicure/`, `llms.txt`):

- **Google Agenda:** sincronização de mão única (criar, atualizar, remover). Antes ausente do artigo. Agora incluída.
- **Equipe e colaboradores**, **clientes cadastradas automaticamente** e **relatórios de faturamento**: listados na página de preços. Agora incluídos.
- **Serviços com duração própria** (ponto central em unhas): o artigo já dizia, mas sem exemplo. Agora há um exemplo de cadastro (durações **ilustrativas**, sem preços inventados).
- **Atendimento recorrente** (até 52 datas): já estava; preservado.

**Perguntas ao time de produto** (não afirmei nenhuma das duas, por não ter como verificar):
1. O lembrete do Agendali **pede confirmação da cliente** e mostra quem confirmou? O lembrete da GENDA pede ("Confirmar") e isso é argumento de peso contra faltas. Se o Agendali faz o mesmo, vale destacar.
2. Existe **intervalo/tempo de limpeza entre atendimentos**? A GENDA admite não ter; se o Agendali tiver, é um diferencial concreto para unhas.

---

## 12. O que foi implementado (cópia isolada)

Arquivo: `proposta/melhor-app-agendamento-manicure.html` (+ 2 JPGs de capa). Gerado por `build_proposal.py` com 45 substituições verificadas.

| # | Mudança | Por quê |
|---|---|---|
| 1 | **Resumo "Em resumo:" no início da "Resposta rápida"** (sem criar seção) | Resposta direta e citável. Ver texto abaixo |
| 2 | Cartão duplicado do Agendali na lista de perfis **removido** | O resumo cumpre o papel; evita repetição |
| 3 | Dois perfis novos: "começar sem mensalidade" (GENDA) e "mesmo valor, preço por equipe" (Horario.vc) | Honestidade e cobertura |
| 4 | GENDA Beleza e Horario.vc nas 2 tabelas e em 2 fichas completas | 9 sistemas bem documentados |
| 5 | FAQ 1 (melhor app) reescrita com recomendação nomeada; FAQ 2 (grátis) **corrigida**; FAQ de preço, app e sinal ampliadas; **1 pergunta nova** sobre durações de unha | Correção factual e extração |
| 6 | "O Agendali na prática": Google Agenda, equipe, clientes/relatórios e exemplo de durações | Diferenciais confirmados |
| 7 | "Como escolher": 7ª pergunta (plano grátis x teste x pago) e link para `/precos/` | Decisão e link interno |
| 8 | Capa nova "9 sistemas" (arquivos novos) | Consistência da arte e do compartilhamento |
| 9 | **Data: "Atualizado em 01/11/2026"**; `article:modified_time` e `dateModified` iguais; `datePublished` (09/06/2026) preservada | Revisão substantiva real |
| 10 | Histórico recolhido (`<details>`), com item de 01/11; "Publicado em…" retirado do texto visível | Menos intrusivo, registro preservado |
| 11 | Metodologia: contagem, datas e nota sobre Fresha; erro "de 2026 de 2026" corrigido | Transparência |
| 12 | `ItemList`/`mentions`/`FAQPage` atualizados e sincronizados | Dados estruturados coerentes |
| 13 | CSS: blocos novos e contraste de 1 célula | Acessibilidade |

**Título e H1: não alterados.** Justificativa: o `title` ("Melhor app para manicure e nail designer em 2026 | Agendali") já casa com a intenção e não tem contagem no texto. A única alteração em metadados é a **meta description**, que passou de 7 para 9 sistemas: *Compare 9 apps de agendamento para manicure e nail designer: Agendali, GENDA Beleza, Horario.vc, Booksy e mais. Preços, plano grátis, WhatsApp e sinal.* (rótulo "plano grátis" incluído porque agora é verdade no recorte e é uma consulta frequente).

### Nova resposta curta (implementada)

> **Em resumo:** para manicure ou nail designer que já tem clientes e quer receber agendamentos por um link próprio, o Agendali funciona no navegador do celular, sem a cliente instalar app nem criar conta. Envia confirmação e lembrete pelo WhatsApp da empresa, cobra sinal opcional pelo Mercado Pago e custa R$ 39,90 por mês ou R$ 399 por ano, com 7 dias grátis, sem cartão e sem fidelidade.
> **O que inclui:** um único plano, com serviços de duração e valor próprios, atendimento recorrente, financeiro com comissão por profissional, equipe e Google Agenda. O teste de 7 dias começa quando você publica a agenda.
> **O que ele não é:** não é marketplace (não traz clientes novas) e não tem plano grátis permanente. As mensagens saem pelo WhatsApp da empresa conectado.
> **Quando outra opção serve melhor:** Booksy, Fresha ou Trinks, se você precisa ser encontrada por clientes novas; Trinks ou AppBeleza, se a equipe é maior e precisa de estoque.

Segue o seu pedido: não destaca concorrentes gratuitos na primeira resposta (o plano grátis da GENDA aparece nos perfis logo abaixo, na tabela e na FAQ), mas **não omite** o que o Agendali não tem.

### Conteúdo adicionado, removido e preservado
- **Adicionado:** o que está acima. O texto passou de **5.117 para 6.502 palavras** (+27%).
- **Removido:** o cartão do Agendali nos perfis (duplicado), a frase "nenhum dos sete…" (falsa), "Publicado em…" no texto visível e "de 2026 de 2026".
- **Preservado integralmente:** URL, canonical, 9 imagens, vídeo, 4 CTAs de cadastro, fichas dos 7 sistemas já existentes, demos, metodologia, links internos, `datePublished`.

---

## 13. Testes (ambiente isolado)

Executados sobre o HTML local, servido no lugar da URL real por interceptação de rede (CSS, imagens e fontes reais do site), com rastreadores (GTM/GA/Meta) **bloqueados**: nenhum evento de analytics foi disparado.

| Teste | Resultado |
|---|---|
| HTML: aninhamento e `id` duplicado | 0 erros, 0 duplicados |
| JSON-LD (6 blocos) | Todos parseiam; `ItemList` com 9 itens e âncoras existentes |
| FAQ (HTML ⇄ JSON-LD) | 10 perguntas, **0 divergências** |
| Datas | Visível, `time`, `article:modified_time` e `dateModified` = 2026-11-01; `datePublished` = 2026-06-09 |
| Âncoras internas (`#…`) | Nenhuma quebrada |
| Imagens | 9 → 9, todas carregam; iframe do vídeo: 1 → 1 |
| CTAs de cadastro | 4 → 4, mesmos destinos |
| Links externos novos | 3 (GENDA e Horario.vc, `nofollow noopener`) |
| Larguras 320, 360, 390, 768, 1280 px | Sem rolagem horizontal; sem elementos para fora da tela |
| Acessibilidade (axe, WCAG A/AA) | Contraste corrigido; resta só o alerta pré-existente do `<aside>` |
| Desempenho (lab) | LCP 0,8 a 1,1 s; CLS ≈ 0; sem regressão |
| Contagens e resíduos ("7 sistemas") | Nenhum resíduo indevido |

**Ressalva honesta:** o teste automático acusou "7 imagens quebradas" nas duas versões porque elas têm `loading="lazy"`; ao rolar devagar todas carregam (0 quebradas, nas duas). O vídeo do YouTube foi bloqueado no teste (rede restrita), então verifiquei só que o `iframe` existe.

Não testei: o formulário de cadastro, o clique real nos CTAs (apontam para o mesmo `app.agendali.com.br/signup` de antes) e o artigo em aparelhos físicos.

**Comparação visual antes/depois** (`testes/`): `cmp-390-topo.png` e `cmp-1280-topo.png` (abertura), e capturas por seção: `proposta-390-_resposta_por_perfil.png`, `…_tabela.png`, `…_genda_beleza.png`, `…_horario_vc.png`, `…_mais_ag.png`, `…_faq.png`, `…_hist_det.png`, com as `original-390-…` correspondentes.

Medidas no celular (390 px), **antes → depois:** resposta rápida em 965 → 965 px; tabela em 2.726 → 3.654 px; altura total 19.998 → 22.646 px. Em 1280 px: tabela 1.993 → 2.427 px.

---

## 14. Priorização (Impacto × Esforço × Confiança)

**A. Alto impacto, baixo risco: feitas na proposta**
- Corrigir a afirmação sobre plano grátis (FAQ + JSON-LD). *Impacto alto, esforço baixo, confiança alta.*
- Resumo direto e FAQ 1 com recomendação nomeada. *Impacto alto para IA, baixo risco.*
- Incluir GENDA Beleza e Horario.vc. *Médio/alto, confiança alta.*
- Capa e metadados com a contagem correta. *Médio, baixo risco.*
- Data real, histórico recolhido. *Médio.*

**B. Relevantes, mas exigem validação**
- **Distância da tabela no celular (+928 px).** Decisão sua: aceito o custo pela cobertura, ou enxugo (ex.: tirar os 2 perfis novos e manter só a FAQ). Mitiguei com o link dentro do resumo. Recomendo medir no Search Console o comportamento depois da publicação.
- Destacar a confirmação por resposta da cliente e o tempo entre atendimentos, **se o produto fizer** (perguntas na seção 11).
- Atualizar o `llms.txt`.

**C. Ideias sem evidência suficiente**
- Calculadora de faltas própria (a GENDA tem uma conta de exemplo; não copiei). Só com dados reais de faltas do Agendali.
- Depoimentos e avaliações: **só se forem reais e autorizados**.

**D. Não vale agora**
- Passar para 12 sistemas; mudar `title`/H1; criar novo artigo (canibalização); mais FAQPage em outras páginas; automatizar atualização de data.

---

## 15. Plano de publicação seguro (para você executar, com a minha ajuda se quiser)

1. **Congelar:** confirmar que ninguém publicou nada novo no artigo desde 01/11 (comparar o arquivo do VPS com `original/…`). Se mudou, reaplicar com `build_proposal.py`.
2. **Backup no VPS** do HTML atual, do `sitemap.xml` e da pasta `assets/blog/capas/`, com `sha256sum`. **Não apagar backups antigos.**
3. **Subir primeiro os 2 JPGs novos** para `/assets/blog/capas/` (nome novo, sem impacto no que já existe).
4. **Substituir só o HTML do artigo.** Conferir em `curl -I` e no navegador: 200, canonical, data "01/11/2026", 9 sistemas, capa nova.
5. **Sitemap:** alterar só a linha deste artigo para `<lastmod>2026-11-01</lastmod>`.
6. **Validar em produção:** Rich Results Test e validador de Schema.org no URL, e abrir no celular.
7. **Indexação:** pedir inspeção/reindexação da URL no Search Console e usar IndexNow/Bing Webmaster, se estiver configurado. Registrar a data.
8. **Medir** por 7, 28 e 90 dias (impressões, CTR, posição, cliques para o cadastro) e repetir os testes de pergunta no ChatGPT, anotando **data, se houve busca na web, fontes citadas e se Agendali e GENDA apareceram**. Uma amostra pequena não é evidência estatística.
9. **Rollback** (seção 1) se algo sair errado.

**Nada disso toca** backend, PM2, WhatsApp, banco, pagamentos, GA4/GTM/Meta Pixel ou nginx.

---

## 16. Oportunidades futuras (fora desta alteração)

- Páginas `/comparar/agendali-vs-genda-beleza/` e `/comparar/agendali-vs-horario-vc/`, no padrão das de Trinks e Booksy, para as buscas de marca.
- Decisão de **produto/comercial** sobre ter um plano de entrada gratuito ou um teste maior: é a diferença estrutural que a GENDA explora, e nenhuma otimização de texto a substitui.
- Reestruturar a página `/blog/app-para-manicure-autonoma/` como guia (não comparativo) para reduzir a sobreposição.
- Monitoramento mensal: preços dos 9 sistemas e consultas de IA, com o mesmo protocolo.
- Atualizar o `llms.txt` para incluir sinal pelo Mercado Pago, recorrência e o plano único.

---

## 17. ONDE MINHA ANÁLISE DISCORDA DAS SUGESTÕES INICIAIS

1. **"A GENDA aparece porque o artigo é mais recente."** A diferença de data é de 7 dias e as duas páginas são indexáveis. Isso é a hipótese **mais fraca** que tenho. O que está comprovado é a diferença de **produto** (plano grátis) e de **formato** (resposta primeiro, documento curto). Se eu apenas "atualizasse a data", não resolveria nada.
2. **"Mais conteúdo ajuda."** O concorrente que aparece tem **menos da metade do texto**. Por isso hesitei em crescer: o texto cresceu 27% e a tabela ficou mais distante no celular. Cada bloco novo precisa justificar seu custo. A direção certa não é só adicionar: é **responder primeiro** e deixar o detalhe para quem rola.
3. **"Não enfatizar concorrentes gratuitos."** Concordo para o **primeiro parágrafo**. Mas ocultar o plano grátis da GENDA do resto do documento seria o erro, porque é a intenção que mais atrai quem digita "app para manicure". O artigo continha uma afirmação falsa ("nenhum divulga plano gratuito") que, se uma IA checar, derruba a confiança no texto inteiro. Corrigi, sem pôr isso na primeira resposta.
4. **"Ampliar para 9, 10 ou até 12."** Ficou em 9, e não por falta de candidatos: dos que faltavam (Agende-me, Simples Agenda), **não consegui ler uma página oficial de preços**. Incluí-los com dados de terceiros violaria a própria metodologia do artigo.
5. **"Atualizar todos os preços."** Reconferi o que pude (7 dos 9) e **não** atualizei a Fresha, porque a página mostrou outro país. Um preço "atualizado" errado é pior do que um preço datado.
6. **"Aparecer no ChatGPT" como meta mensurável.** Não existe garantia nem como medir direito sem Search Console, Bing e sessões controladas. Meus testes de busca (seção 5) **não** mostraram nem o Agendali nem a GENDA, o que indica que a ferramenta que tenho não representa o ChatGPT. Não trate isso como queda do Agendali.
7. **O maior risco que vejo é fora do artigo:** se a diferença decisiva é "grátis", um texto melhor reduz a distância, mas não a elimina. Convém discutir a oferta, não só o conteúdo.

---

## 18. Lista de arquivos

```
seo-manicure/
  RELATORIO.md                         este relatório
  HASHES.md                            SHA-256 antes/depois e dos scripts
  build_proposal.py                    gera a proposta a partir da versão publicada (falha se o original mudou)
  make_cover.py                        gera a capa "9 sistemas"
  validate.py                          validações estáticas
  original/                            versão publicada (backup) + SHA256SUMS + artigo da GENDA lido
  proposta/
    melhor-app-agendamento-manicure.html
    assets/blog/capas/melhor-app-agendamento-manicure-9-sistemas.jpg       (1200×630)
    assets/blog/capas/melhor-app-agendamento-manicure-9-sistemas-640.jpg   (640×336)
  testes/                              capturas antes/depois, resultados-visuais.json, a11y-perf.json, validacao-estatica.txt
```

**Hashes:** antes `184dc910a0689dc325a4c8a1aac4a258bfa40a50bfde8ad9b8ec3da60085f74c`; depois: ver `HASHES.md` (regenerado a cada build).

---

*Fontes consultadas em 01/11/2026 (páginas oficiais): agendali.com.br (`/precos/`, `/agenda-online-manicure/`, `/sistema-para-nail-designer/`, `llms.txt`, `robots.txt`, `sitemap.xml`), genda.work/beleza, horario.vc, tuaagenda.com, appbeleza.com.br, biz.booksy.com/pt-br, negocios.trinks.com, fresha.com/pt. Documentação de rastreadores: página oficial da OpenAI sobre bots (lida nesta rodada). Do Google Search Central usei meu conhecimento prévio (por exemplo, a restrição do rich result de FAQ); **não reabri** a documentação do Google nesta rodada.*
