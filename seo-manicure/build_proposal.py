#!/usr/bin/env python3
"""Gera a PROPOSTA do artigo (cópia isolada) a partir da versão publicada em 01/11/2026.

Uso: python3 -I build_proposal.py
Lê:  original/melhor-app-agendamento-manicure.published-2026-11-01.html
Grava: proposta/melhor-app-agendamento-manicure.html

Cada alteração usa `rep()`, que EXIGE que o trecho original exista na quantidade esperada.
Se a página publicada mudar, o script falha em vez de editar às cegas.
Nada aqui toca em produção.
"""
import json, re, sys, pathlib, html as htmlmod

BASE = pathlib.Path(__file__).resolve().parent
SRC = BASE / "original" / "melhor-app-agendamento-manicure.published-2026-11-01.html"
DST = BASE / "proposta" / "melhor-app-agendamento-manicure.html"
DST.parent.mkdir(exist_ok=True)

h = SRC.read_text(encoding="utf8")
LOG = []


def rep(old, new, count=1, label=""):
    global h
    n = h.count(old)
    if n != count:
        sys.exit(f"ERRO [{label or old[:60]!r}]: esperado {count} ocorrência(s), encontrado {n}")
    h = h.replace(old, new)
    LOG.append(label or old[:60])


NL = '<abbr class="nl" title="Não localizado nas informações públicas consultadas. Isso não significa que o recurso não exista.">{}</abbr>'
DATA = "01/11/2026"

# --------------------------------------------------------------------------------------
# 1. Metadados, contagem (7 -> 9) e data real de atualização
# --------------------------------------------------------------------------------------
OLD_DESC = "Compare 7 apps de agendamento para manicure e nail designer. Veja preços, WhatsApp, sinal e gestão para escolher o sistema adequado à sua rotina."
NEW_DESC = "Compare 9 apps de agendamento para manicure e nail designer: Agendali, GENDA Beleza, Horario.vc, Booksy e mais. Preços, plano grátis, WhatsApp e sinal."
assert len(NEW_DESC) <= 160, len(NEW_DESC)
rep(OLD_DESC, NEW_DESC, count=4, label="meta description / og / twitter / JSON-LD Article.description")

rep('<meta property="article:modified_time" content="2026-10-21">',
    '<meta property="article:modified_time" content="2026-11-01">', label="og modified_time")
rep('"dateModified":"2026-10-21T00:00:00-03:00"', '"dateModified":"2026-11-01T00:00:00-03:00"', label="JSON-LD dateModified") if '"dateModified":"2026-10-21T00:00:00-03:00"' in h else \
    rep('"dateModified": "2026-10-21T00:00:00-03:00"', '"dateModified": "2026-11-01T00:00:00-03:00"', label="JSON-LD dateModified")
rep('Atualizado em <time datetime="2026-10-21">21/10/2026</time>',
    'Atualizado em <time datetime="2026-11-01">01/11/2026</time>', label="data visível")

rep("Comparamos 7 sistemas de agendamento para manicures e nail designers: Agendali, Booksy, Trinks e outras opções. Veja preços, agendamento por link, WhatsApp, cobrança de sinal e controle financeiro.",
    "Comparamos 9 sistemas de agendamento para manicures e nail designers: Agendali, GENDA Beleza, Horario.vc, Booksy, Trinks e outros. Veja preços, plano grátis, link para a cliente, WhatsApp, sinal e financeiro.",
    label="hero sub")
rep("Os 7 sistemas em detalhe</a></li>", "Os 9 sistemas em detalhe</a></li>", label="toc")
rep("<h2>Comparação resumida dos 7 sistemas</h2>", "<h2>Comparação resumida dos 9 sistemas</h2>", label="h2 tabela")
rep("<h2>Os 7 sistemas em detalhe</h2>", "<h2>Os 9 sistemas em detalhe</h2>", label="h2 detalhe")
rep("(os 7 desta página)", "(os 9 desta página)", label="tipos de app")
rep("<h3>Como escolhemos os 7</h3>", "<h3>Como escolhemos os 9</h3>", label="h3 escolhemos")
rep("que é um dos sete sistemas", "que é um dos nove sistemas", count=2, label="imparcial (HTML + JSON-LD)")


# --------------------------------------------------------------------------------------
# 1b. Capa nova (o texto da arte dizia "7 sistemas"): arquivos novos com nome novo, sem sobrescrever os atuais
# --------------------------------------------------------------------------------------
OLD_COVER = "/assets/blog/capas/melhor-app-agendamento-manicure"
n_cover = h.count(OLD_COVER)
assert n_cover >= 7, n_cover
h = h.replace(OLD_COVER + "-640.jpg", OLD_COVER + "-9-sistemas-640.jpg").replace(OLD_COVER + ".jpg", OLD_COVER + "-9-sistemas.jpg")
LOG.append(f"capa nova referenciada ({n_cover} referências: img, srcset, og:image, twitter, JSON-LD)")

# --------------------------------------------------------------------------------------
# 2. Resposta rápida: resumo direto + 2 perfis novos (sem criar seção nova)
# --------------------------------------------------------------------------------------
RESP = (
    '<div class="resp-curta"><p><strong>Em resumo:</strong> para manicure ou nail designer que já tem clientes e quer receber agendamentos '
    'por um link próprio, o <a href="#agendali">Agendali</a> funciona no navegador do celular, sem a cliente instalar app nem criar conta. '
    'Envia confirmação e lembrete pelo WhatsApp da empresa, cobra sinal opcional pelo Mercado Pago e custa '
    '<a href="/precos/">R$ 39,90 por mês ou R$ 399 por ano</a>, com 7 dias grátis, sem cartão e sem fidelidade.</p>'
    '<ul class="resp-pontos">'
    '<li><strong>O que inclui:</strong> um único plano, com serviços de duração e valor próprios, atendimento recorrente, financeiro com comissão por profissional, equipe e Google Agenda. O teste de 7 dias começa quando você publica a agenda.</li>'
    '<li><strong>O que ele não é:</strong> não é marketplace (não traz clientes novas) e não tem plano grátis permanente. As mensagens saem pelo WhatsApp da empresa conectado.</li>'
    '<li><strong>Quando outra opção serve melhor:</strong> Booksy, Fresha ou Trinks, se você precisa ser encontrada por clientes novas; Trinks ou AppBeleza, se a equipe é maior e precisa de estoque.</li>'
    '</ul><p class="resp-ir"><a href="#tabela">Ir direto para a tabela dos 9 sistemas <span aria-hidden="true">→</span></a></p></div>'
    '<p>Cada perfil abaixo leva ao sistema que, pelas páginas oficiais, melhor responde àquela necessidade. As escolhas podem se combinar.</p>'
)
rep("<p>Cada perfil leva ao sistema que, pelas páginas oficiais, melhor responde àquela necessidade. As escolhas podem se combinar.</p>",
    RESP, label="resposta rápida: resumo")


# o resumo acima passa a ser a resposta do Agendali: o cartão antigo repetia o mesmo conteúdo
m = re.search(r'<li class="destaque-ag">.*?</li>', h, re.S)
assert m and "Agenda, WhatsApp e financeiro no mesmo lugar" in m.group(0), "cartão destaque-ag não encontrado"
h = h[:m.start()] + h[m.end():]
LOG.append("perfis: cartão duplicado do Agendali removido (coberto pelo resumo)")

NEW_PERFIS = (
    '<li><span class="quando">Quer começar sem mensalidade</span><span class="quem"><a href="#genda-beleza">GENDA Beleza</a></span>'
    '<p>Plano Grátis sem prazo para 1 profissional, com 50 mensagens de WhatsApp por mês. O prepagamento fica fora do plano grátis. '
    'Teste de 5 dias com tudo liberado, segundo o site oficial.</p></li>'
    '<li><span class="quando">Quer o mesmo valor de lista e preço por tamanho de equipe</span><span class="quem"><a href="#horario-vc">Horario.vc</a></span>'
    '<p>R$ 39,90/mês para 1 a 2 profissionais e R$ 399/ano; teste de 7 dias, sem cartão. Lembrete no WhatsApp incluso (100 mensagens por mês). '
    + NL.format("Sinal não localizado") + '.</p></li>'
)
# entra logo após o perfil "Quer o menor preço mensal divulgado" (Tua Agenda)
marker = '<li><span class="quando">Quer ser encontrada por clientes novas</span>'
rep(marker, NEW_PERFIS + marker, label="perfis: GENDA Beleza e Horario.vc")

# --------------------------------------------------------------------------------------
# 3. Tabela resumida e tabela de períodos
# --------------------------------------------------------------------------------------
rep("Preço de lista mensal para 1 profissional, em R$, lido nas páginas oficiais (13 e 21/10/2026).",
    "Preço de lista mensal para 1 profissional, em R$, lido nas páginas oficiais (13/10 a 01/11/2026).", label="caption resumo")
rep("Planos de lista para 1 profissional, lidos nas páginas oficiais (13 e 21/10/2026).",
    "Planos de lista para 1 profissional, lidos nas páginas oficiais (13/10 a 01/11/2026).", label="caption períodos")


def td(label, cls, content):
    return f'<td data-label="{label}" class="{cls}">{content}</td>'


ROW_GENDA = (
    '<tr id="linha-genda-beleza"><th scope="row"><a href="#genda-beleza">GENDA Beleza</a></th>'
    + td("Preço mensal", "st-verificado", "R$ 39,90/mês (PRO, 1 profissional)")
    + td("Teste", "st-verificado", "5 dias, sem cartão; plano Grátis permanente (1 profissional, 50 mensagens/mês)")
    + td("Link para a cliente", "st-verificado", "Sim, no navegador, sem instalar nada")
    + td("WhatsApp", "st-oficial_com_condicao", "Incluso, inclusive no plano Grátis (limite mensal); conexão por QR Code; lembrete pede confirmação")
    + td("Sinal", "st-oficial_com_condicao", "Prepagamento fora do plano Grátis; meios de pagamento " + NL.format("não localizados"))
    + td("Custos extras", "st-oficial_com_condicao", "Limite mensal de mensagens por plano")
    + "</tr>"
)
ROW_HORARIO = (
    '<tr id="linha-horario-vc"><th scope="row"><a href="#horario-vc">Horario.vc</a></th>'
    + td("Preço mensal", "st-verificado", "R$ 39,90/mês (1 a 2 profissionais)")
    + td("Teste", "st-verificado", "7 dias, sem cartão e sem fidelidade")
    + td("Link para a cliente", "st-verificado", "Sim, sem baixar app")
    + td("WhatsApp", "st-oficial_com_condicao", "Lembrete incluso (100 mensagens/mês, enviadas de um número do Horario.vc)")
    + td("Sinal", "st-verificado", NL.format("Não localizado"))
    + td("Custos extras", "st-oficial_com_condicao", "Preço sobe por faixa de equipe (R$ 69,90 de 3 a 5; R$ 109,90 com 6 ou mais)")
    + "</tr>"
)
rep('<tr id="linha-minha-agenda">', ROW_GENDA + ROW_HORARIO + '<tr id="linha-minha-agenda">', label="tabela resumo: linhas novas")

PER_GENDA = (
    '<tr><th scope="row"><a href="#genda-beleza">GENDA Beleza</a></th>'
    + td("Mensal", "st-verificado", "R$ 39,90/mês (PRO, 1 profissional)")
    + td("Semestral", "st-oficial_com_condicao", "Desconto de 20% informado (trimestral: 10%); valor em reais não lido na página")
    + td("Anual", "st-nao_localizado", "Não divulgado nas páginas consultadas")
    + "</tr>"
)
PER_HORARIO = (
    '<tr><th scope="row"><a href="#horario-vc">Horario.vc</a></th>'
    + td("Mensal", "st-verificado", "R$ 39,90/mês (1 a 2 profissionais)")
    + td("Semestral", "st-nao_localizado", "Não divulgado nas páginas consultadas")
    + td("Anual", "st-verificado", "R$ 399 por 12 meses (o site informa 2 meses grátis; equivale a R$ 33,25/mês, conta nossa); forma de pagamento " + NL.format("não localizada"))
    + "</tr>"
)
rep('<tr><th scope="row"><a href="#minha-agenda">Minha Agenda</a></th><td data-label="Mensal"',
    PER_GENDA + PER_HORARIO + '<tr><th scope="row"><a href="#minha-agenda">Minha Agenda</a></th><td data-label="Mensal"',
    label="tabela períodos: linhas novas")
rep("Nenhum dos 7 divulga plano gratuito permanente nas páginas consultadas.",
    "Dos 9, só a GENDA Beleza divulga plano gratuito permanente (com limites); os demais oferecem apenas período de teste.",
    label="nota plano gratuito")


# --------------------------------------------------------------------------------------
# 4. Fichas novas (GENDA Beleza, Horario.vc) em ordem alfabética
# --------------------------------------------------------------------------------------
def li(items):
    return "<ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>"


def ficha(id_, nome, linha, tipo_html, para, fortes, atencao, dados, fontes):
    dl = "".join(f"<dt>{k}</dt><dd>{v}</dd>" for k, v in dados)
    src = "".join(f'<li><a href="{u}" rel="nofollow noopener" target="_blank">{t}</a> · consultado em {DATA}</li>' for t, u in fontes)
    return (
        f'<details class="ficha" id="{id_}" open><summary><h3>{nome}</h3><span class="resumo-linha">{linha}</span></summary>'
        f'<p class="tipo">{tipo_html}</p><p class="para"><strong>Faz mais sentido para:</strong> {para}</p>'
        f'<div class="duas"><div><strong>Pontos fortes</strong>{li(fortes)}</div><div><strong>Pontos de atenção</strong>{li(atencao)}</div></div>'
        f'<dl class="dados">{dl}</dl><details class="fontes"><summary>Fontes oficiais e datas de consulta</summary><ul>{src}</ul></details></details>'
    )


FICHA_GENDA = ficha(
    "genda-beleza", "GENDA Beleza", "R$ 39,90/mês · plano Grátis permanente · teste 5 dias, sem cartão",
    'Agenda online e confirmação por WhatsApp para salões e profissionais de beleza · <a href="https://genda.work/beleza" rel="nofollow noopener" target="_blank">genda.work/beleza</a>',
    "Quem quer começar sem mensalidade e aceita os limites do plano Grátis, ou quer pagar R$ 39,90 por um plano pago por tamanho de equipe.",
    ["Plano Grátis sem prazo, para 1 profissional, com página de agendamento, histórico de clientes e 50 mensagens de WhatsApp por mês.",
     "Teste de 5 dias com todas as funcionalidades, sem cartão.",
     "Roda no navegador, sem instalar nada, e o lembrete pelo WhatsApp pede confirmação da cliente."],
    ["Mensalistas, produtos, marketing e prepagamento ficam fora do plano Grátis.",
     "O limite de mensagens varia por plano (Grátis 50; PRO 2.000 por mês) e o preço sobe conforme o número de profissionais.",
     "Incluída em 01/11/2026 a partir das páginas oficiais; não testamos o produto por dentro."],
    [("Preço mensal", "R$ 39,90/mês no plano PRO (1 profissional). Avançado: R$ 79,90/mês (até 3 profissionais). Escala: R$ 129,90/mês (profissionais ilimitados)."),
     ("Planos por período", "O site informa desconto de 10% no trimestral e de 20% no semestral; os valores em reais não apareceram na leitura da página. Anual: " + NL.format("não localizado") + "."),
     ("Teste", "5 dias, com tudo liberado e sem cartão de crédito. Sem fidelidade."),
     ("Plano gratuito", "Sim, sem prazo: agenda online, página de agendamento e histórico dos clientes, para 1 profissional e 50 mensagens de WhatsApp por mês."),
     ("Custos adicionais", "Mensagens de WhatsApp têm limite mensal por plano (PRO 2.000; Avançado 6.000; Escala 12.000)."),
     ("No Brasil", "Brasil: site em português do Brasil e preços em R$.")],
    [("Site oficial (planos e perguntas frequentes)", "https://genda.work/beleza")],
)
FICHA_HORARIO = ficha(
    "horario-vc", "Horario.vc", "R$ 39,90/mês (1 a 2 profissionais) · teste 7 dias, sem cartão",
    'Agenda, clientes e financeiro para quem atende com hora marcada · <a href="https://www.horario.vc/precos" rel="nofollow noopener" target="_blank">horario.vc</a>',
    "Autônoma ou pequena equipe que quer link de agendamento sem app, comissões, pacotes e financeiro, com preço por faixa de profissionais.",
    ["Mesmo valor de lista do Agendali no plano mensal (R$ 39,90) e no anual (R$ 399).",
     "As mesmas funções em todos os planos: agenda, link para o cliente, lembrete no WhatsApp, comissões, pacotes, financeiro e relatórios.",
     "Teste de 7 dias, sem cartão e sem fidelidade."],
    ["O lembrete tem 100 mensagens por mês incluídas e sai de um número do Horario.vc, não do seu WhatsApp.",
     "O preço sobe por faixa de equipe (R$ 69,90 para 3 a 5 profissionais; R$ 109,90 para 6 ou mais).",
     "Cobrança de sinal e plano gratuito não foram localizados; incluído em 01/11/2026 a partir das páginas oficiais, sem testar o produto."],
    [("Preço mensal", "R$ 39,90/mês para 1 a 2 profissionais."),
     ("Planos por período", "Anual: R$ 399 por 12 meses (o site informa 2 meses grátis; equivale a R$ 33,25 por mês, valor calculado por nós; a cobrança não é mensal). Forma de pagamento: " + NL.format("não localizada") + ". Semestral: não divulgado."),
     ("Teste", "7 dias, sem cartão de crédito e sem fidelidade."),
     ("Plano gratuito", NL.format("Não localizado") + " nas páginas consultadas."),
     ("Custos adicionais", "O preço muda só pelo tamanho da equipe. Lembretes: 100 mensagens por mês incluídas."),
     ("No Brasil", "Brasil: site em português do Brasil e preços em R$.")],
    [("Preços Horario.vc", "https://www.horario.vc/precos"), ("Horario.vc (recursos)", "https://www.horario.vc/")],
)
rep('<details class="ficha" id="minha-agenda"', FICHA_GENDA + FICHA_HORARIO + '<details class="ficha" id="minha-agenda"', label="fichas novas")

# datas de consulta das páginas realmente reconferidas em 01/11/2026
rep("Site oficial (preços)</a> · consultado em 21/10/2026", f"Site oficial (preços)</a> · consultado em {DATA}", label="data Tua Agenda")
rep("Preços Booksy (Brasil)</a> · consultado em 21/10/2026", f"Preços Booksy (Brasil)</a> · consultado em {DATA}", label="data Booksy")
rep("Planos e preços Trinks</a> · consultado em 21/10/2026", f"Planos e preços Trinks</a> · consultado em {DATA}", label="data Trinks")
rep("Agenda online para manicure (preços)</a> · consultado em 21/10/2026",
    f'Agenda online para manicure (preços)</a> · consultado em {DATA}', label="data Agendali manicure")
rep('<li><a href="https://agendali.com.br/agenda-online-manicure/', f'<li><a href="/precos/">Planos e preços do Agendali</a> · consultado em {DATA}</li><li><a href="https://agendali.com.br/agenda-online-manicure/',
    label="fonte /precos/ na ficha do Agendali")

# --------------------------------------------------------------------------------------
# 5. O Agendali na prática: Google Agenda, equipe e exemplo de durações
# --------------------------------------------------------------------------------------
MAIS = (
    '<div class="mais-ag"><h3>O que mais o plano único inclui</h3><ul>'
    '<li><strong>Google Agenda:</strong> depois de conectar a conta Google, os agendamentos são criados, atualizados e removidos no Google Agenda. '
    'A sincronia é de mão única: mudar o evento no Google não altera o Agendali.</li>'
    '<li><strong>Equipe e colaboradores:</strong> cada profissional com a própria agenda dentro do mesmo link.</li>'
    '<li><strong>Clientes e relatórios:</strong> clientes cadastradas automaticamente a cada agendamento e relatórios de faturamento.</li></ul>'
    '<h3>Exemplo: serviços de unha com durações diferentes</h3>'
    '<p>Cada serviço tem duração e valor próprios, e a agenda evita sobreposição de horários. Exemplo de cadastro, com durações ilustrativas (você define as suas):</p>'
    '<table class="ex-serv"><thead><tr><th scope="col">Serviço</th><th scope="col">Duração (exemplo)</th></tr></thead><tbody>'
    '<tr><td>Esmaltação tradicional</td><td>45 min</td></tr><tr><td>Esmaltação em gel</td><td>1 h</td></tr>'
    '<tr><td>Banho de gel</td><td>1 h 30</td></tr><tr><td>Manutenção de alongamento</td><td>2 h</td></tr>'
    '<tr><td>Alongamento em fibra</td><td>2 h 30</td></tr></tbody></table></div>'
)
m = re.search(r'<p class="demo-fim">Veja a demonstração completa', h)
assert m, "ancora da demonstração não encontrada"
h = h[:m.start()] + MAIS + h[m.start():]
LOG.append("mais-ag inserido antes de 'Veja a demonstração completa'")

# --------------------------------------------------------------------------------------
# 6. Como escolher
# --------------------------------------------------------------------------------------
rep("responda a seis perguntas.", "responda a sete perguntas.", label="seis -> sete")
rep('</ul><h3>Três tipos de app aparecem na busca',
    '<li><strong>Plano grátis, teste ou plano pago?</strong> Plano grátis não tem prazo, mas costuma limitar mensagens, profissionais e recursos; teste libera tudo por poucos dias. '
    'Veja o que fica fora do plano grátis (a cobrança de sinal, por exemplo) antes de montar a sua rotina nele.</li></ul><h3>Três tipos de app aparecem na busca',
    label="pergunta 7")
rep("Depois, R$ 39,90/mês ou R$ 399/ano.</p>",
    'Depois, R$ 39,90/mês ou R$ 399/ano (<a href="/precos/">veja os planos</a>).</p>', label="link /precos/ na faixa de CTA")

# --------------------------------------------------------------------------------------
# 7. Metodologia, histórico e data
# --------------------------------------------------------------------------------------
rep('Publicado em <time datetime="2026-06-09">9 de junho de 2026</time> e atualizado em <time datetime="2026-10-21">21 de outubro de 2026</time>.',
    'Última atualização substancial em <time datetime="2026-11-01">1º de novembro de 2026</time>; o histórico completo está no fim desta seção.', label="quem produz")
rep("Consultamos, entre 13 e 21/10/2026 de 2026,", "Consultamos, entre 13/10 e 01/11/2026,", label="como verificamos")
rep("Cada ficha lista as fontes e as datas.</p>",
    "Cada ficha lista as fontes e as datas. Em 01/11/2026 reconferimos preços e condições do Agendali, AppBeleza, Booksy, Tua Agenda e Trinks e incluímos GENDA Beleza e Horario.vc, "
    "lidos nas páginas oficiais. Fresha e Minha Agenda mantêm a leitura de 21/10/2026: a página de preços da Fresha varia conforme o país e não conseguimos reconferir a versão brasileira nesta atualização.</p>",
    label="como verificamos: 01/11")
rep("Os critérios são os que mais mudam a decisão de uma manicure:",
    "GENDA Beleza e Horario.vc entraram em 01/11/2026 por terem página oficial em português do Brasil, preço em R$ e público de beleza com hora marcada. Os critérios são os que mais mudam a decisão de uma manicure:",
    label="como escolhemos: novos")
HIST_ITEM = (
    '<li><b>1º de novembro de 2026:</b> Inclusão de GENDA Beleza e Horario.vc (9 sistemas), com plano grátis permanente e preço por faixa de equipe; '
    'resumo direto no início da resposta rápida; Google Agenda, equipe e exemplo de durações de serviços de unha na parte sobre o Agendali; '
    'reconferência de preços de Agendali, AppBeleza, Booksy, Tua Agenda e Trinks; perguntas frequentes atualizadas (plano grátis, sinal, durações); '
    'histórico recolhido.</li>'
)
rep('<h3>Histórico de alterações</h3><ul class="hist">',
    '<details class="hist-det"><summary>Histórico de alterações</summary><ul class="hist">', label="histórico: abre details")
# fecha o details logo depois do </ul> do histórico
i = h.index('<details class="hist-det">')
j = h.index("</ul>", i)
h = h[:j] + HIST_ITEM + "</ul></details>" + h[j + len("</ul>"):]
LOG.append("histórico: item 01/11 + details fechado")

# --------------------------------------------------------------------------------------
# 8. Perguntas frequentes (HTML + JSON-LD mantidos em sincronia)
# --------------------------------------------------------------------------------------
rep("Não existe um único melhor: depende do perfil. Entre os sete comparados, o menor preço mensal divulgado é o da Tua Agenda (R$ 19,90); "
    "o Agendali tem um plano único com todos os recursos (R$ 39,90/mês) e sinal opcional pelo Mercado Pago; Booksy, Fresha e Trinks têm marketplace ou portal de clientes; "
    "AppBeleza, Booksy, Fresha, Trinks e Tua Agenda listam controle de estoque nas páginas oficiais; a Minha Agenda não tem preço localizado no site consultado e a Trinks informa preço sob consulta. Veja a tabela e o guia por perfil.",
    "Para manicure ou nail designer que já tem clientes e quer um link próprio de agendamento, com lembrete pelo WhatsApp e sinal opcional pelo Mercado Pago, o Agendali (R$ 39,90/mês, 7 dias grátis, sem cartão). "
    "A resposta muda conforme a necessidade: menor preço de lista, Tua Agenda (R$ 19,90/mês); começar sem mensalidade, GENDA Beleza (plano Grátis com limites); "
    "ser encontrada por clientes novas, Booksy, Fresha ou Trinks; equipe maior com estoque e financeiro amplo, Trinks ou AppBeleza. "
    "A Minha Agenda não tem preço localizado no site consultado. Veja a tabela e o guia por perfil.",
    count=2, label="FAQ 1")
rep("Nas fontes consultadas até 21/10/2026, nenhum dos sete divulga plano gratuito permanente. Todos citam período de teste: Trinks, 5 dias; Agendali, Booksy e Fresha, 7 dias; AppBeleza, Minha Agenda e Tua Agenda, 30 dias.",
    "Sim, com limites. Nas fontes consultadas até 01/11/2026, só a GENDA Beleza divulga plano gratuito permanente: 1 profissional e 50 mensagens de WhatsApp por mês, sem prepagamento. "
    "Os outros oito oferecem período de teste, que libera os recursos por poucos dias e depois exige plano pago: GENDA Beleza e Trinks, 5 dias; Agendali, Booksy, Fresha e Horario.vc, 7 dias; AppBeleza, Minha Agenda e Tua Agenda, 30 dias. "
    "O Agendali não tem plano grátis permanente, só os 7 dias de teste.",
    count=2, label="FAQ 2")
rep("Preços de lista mensais para 1 profissional, em 21/10/2026: Tua Agenda R$ 19,90; Agendali R$ 39,90; Fresha R$ 39,95;",
    "Preços de lista mensais para 1 profissional, entre 21/10 e 01/11/2026: Tua Agenda R$ 19,90; Agendali R$ 39,90; GENDA Beleza R$ 39,90 (plano pago PRO; há também plano Grátis); Horario.vc R$ 39,90 (1 a 2 profissionais); Fresha R$ 39,95;",
    count=2, label="FAQ preços")

# respostas que ganham frase final: lemos o texto atual e acrescentamos
def append_answer(question_start, extra, label):
    """Acrescenta `extra` ao fim da resposta (HTML e JSON-LD) da pergunta que começa com `question_start`."""
    global h
    # HTML
    q = h.index(f"<summary>{question_start}")
    s = h.index('<div class="resp"><p>', q)
    e = h.index("</p></div>", s)
    h = h[:e] + " " + extra + h[e:]
    # JSON-LD
    k = h.index(f'"name":"{question_start}') if f'"name":"{question_start}' in h else h.index(f'"name": "{question_start}')
    t = h.index('"text"', k)
    t_end = h.index('"}', t)
    h = h[:t_end] + " " + extra + h[t_end:]
    LOG.append("FAQ + " + label)


append_answer("A cliente precisa baixar um app para agendar?",
              "A GENDA Beleza informa que roda no navegador, sem instalar nada, e o Horario.vc informa que o cliente marca pelo link, sem baixar app.", "app")
append_answer("Dá para cobrar sinal da cliente?",
              "Na GENDA Beleza, o prepagamento fica fora do plano Grátis; no Horario.vc, a cobrança de sinal não foi localizada nas informações públicas consultadas.", "sinal")

# pergunta nova
NEW_Q = "Como cadastrar serviços de unha com durações diferentes?"
NEW_A = ("No Agendali, cada serviço tem duração e valor próprios, e a agenda evita a sobreposição de horários: uma esmaltação tradicional, um banho de gel e um alongamento em fibra ocupam blocos de tamanhos diferentes. "
         "Cadastre cada procedimento separado, com a duração real do seu atendimento, e a cliente só vê horários em que o serviço escolhido cabe. "
         "Em qualquer sistema, confirme na página oficial ou no teste se a duração é configurável por serviço antes de assinar.")
rep('<details class="faq"><summary>Como divulgar meu link de agendamento no Instagram?</summary>',
    f'<details class="faq"><summary>{NEW_Q}</summary><div class="resp"><p>{NEW_A}</p></div></details>'
    '<details class="faq"><summary>Como divulgar meu link de agendamento no Instagram?</summary>', label="FAQ nova (HTML)")

# JSON-LD FAQPage: acrescenta a pergunta nova (mesmo texto da página)
mm = re.search(r'("@type":\s*"Question",\s*"name":\s*"Como divulgar meu link de agendamento no Instagram\?")', h)
assert mm, "pergunta Instagram não encontrada no JSON-LD"
new_ld = ('{"@type":"Question","name":' + json.dumps(NEW_Q, ensure_ascii=False) + ',"acceptedAnswer":{"@type":"Answer","text":' + json.dumps(NEW_A, ensure_ascii=False) + '}},')
# volta ao '{' que abre a Question
start = h.rfind("{", 0, mm.start() + 1)
h = h[:start] + new_ld + h[start:]
LOG.append("FAQ nova (JSON-LD)")

# --------------------------------------------------------------------------------------
# 9. Dados estruturados: ItemList, mentions
# --------------------------------------------------------------------------------------
def patch_jsonld():
    global h
    def repl(m):
        raw = m.group(2)
        j = json.loads(raw)
        if isinstance(j, dict) and j.get("@type") == "ItemList":
            names = ["Agendali", "AppBeleza", "Booksy", "Fresha", "GENDA Beleza", "Horario.vc", "Minha Agenda", "Trinks", "Tua Agenda"]
            slug = lambda n: n.lower().replace(" ", "-").replace(".", "-")
            base = "https://agendali.com.br/blog/melhor-app-agendamento-manicure/#"
            j["numberOfItems"] = len(names)
            j["itemListElement"] = [{"@type": "ListItem", "position": i + 1, "name": n, "url": base + slug(n)} for i, n in enumerate(names)]
        if isinstance(j, dict) and j.get("@type") == "Article":
            men = j["mentions"]
            men += [{"@type": "SoftwareApplication", "name": "GENDA Beleza", "url": "https://genda.work/beleza"},
                    {"@type": "SoftwareApplication", "name": "Horario.vc", "url": "https://www.horario.vc/"}]
            men.sort(key=lambda x: x["name"].lower())
        return m.group(1) + json.dumps(j, ensure_ascii=False, indent=None) + m.group(3)
    h = re.sub(r'(<script[^>]+application/ld\+json[^>]*>)(.*?)(</script>)', repl, h, flags=re.S)
    LOG.append("JSON-LD: ItemList e mentions")


patch_jsonld()

# --------------------------------------------------------------------------------------
# 10. CSS dos blocos novos (mesmos tokens do blog)
# --------------------------------------------------------------------------------------
CSS = """
/* 01/11/2026: resumo direto, exemplo de durações e histórico recolhido */
.resp-curta{border:1px solid var(--acc);border-radius:16px;background:#fff;box-shadow:var(--shadow-md);padding:16px 18px;margin:1em 0 1.2em}
.resp-curta>p{margin:0 0 10px;font-size:1.05rem;line-height:1.55}
.resp-pontos{list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:.98rem;line-height:1.5}
.resp-pontos li{margin:0;padding-left:0}
.resp-ir{margin:10px 0 0;font-weight:700;font-size:.98rem}
.resp-ir a{color:var(--acc-ink);text-decoration:underline;text-underline-offset:2px}
.mais-ag{margin:1.2em 0}
.mais-ag ul{padding-left:1.2em;margin:.4em 0 1em}
.ex-serv{border-collapse:collapse;width:100%;max-width:520px;margin:.6em 0 1em;font-size:.98rem}
.ex-serv th,.ex-serv td{border:1px solid var(--border);padding:8px 12px;text-align:left}
.ex-serv thead th{background:var(--primary-50)}
.hist-det>summary{cursor:pointer;font-weight:700;font-size:1.05rem;padding:6px 0}
.hist-det[open]>summary{margin-bottom:6px}
/* contraste: célula "não divulgado" da linha do Agendali ficava em 4,45:1 (mínimo 4,5:1) */
.resumo .ag .st-nao_localizado{color:#526077}
"""
rep("</style>", CSS + "</style>", label="CSS novo")

DST.write_text(h, encoding="utf8")
print(f"OK: {len(LOG)} alterações aplicadas -> {DST}")
for x in LOG:
    print(" -", x)
