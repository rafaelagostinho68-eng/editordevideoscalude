#!/usr/bin/env python3
"""Validações estáticas da proposta (HTML, JSON-LD, âncoras, datas, contagens)."""
import re, json, sys, pathlib
from html.parser import HTMLParser
base = pathlib.Path(__file__).resolve().parent
orig = (base/"original/melhor-app-agendamento-manicure.published-2026-11-01.html").read_text(encoding="utf8")
new = (base/"proposta/melhor-app-agendamento-manicure.html").read_text(encoding="utf8")
VOID={"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
class P(HTMLParser):
    def __init__(s): super().__init__(); s.stack=[]; s.err=[]; s.ids=[]
    def handle_starttag(s,t,a):
        d=dict(a)
        if 'id' in d: s.ids.append(d['id'])
        if t not in VOID: s.stack.append(t)
    def handle_endtag(s,t):
        if t in VOID: return
        if not s.stack or s.stack[-1]!=t:
            s.err.append(f"fecha </{t}> com topo {s.stack[-1] if s.stack else None}")
            if t in s.stack:
                while s.stack and s.stack[-1]!=t: s.stack.pop()
                s.stack.pop()
        else: s.stack.pop()
def check(name,h):
    p=P(); p.feed(h)
    dup=[i for i in set(p.ids) if p.ids.count(i)>1]
    print(f"[{name}] erros de aninhamento: {len(p.err)} {p.err[:3]} | tags abertas no fim: {p.stack[:5]} | ids duplicados: {dup}")
    return p
po=check("original",orig); pn=check("proposta",new)
# JSON-LD
def ld(h):
    out=[]
    for m in re.finditer(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>',h,re.S):
        out.append(json.loads(m.group(1)))
    return out
lo,ln=ld(orig),ld(new)
print("JSON-LD blocos:",len(lo),"->",len(ln),"(todos parseiam)")
art=[j for j in ln if j.get("@type")=="Article"][0]
print("Article.dateModified:",art["dateModified"],"| datePublished:",art["datePublished"])
il=[j for j in ln if j.get("@type")=="ItemList"][0]
print("ItemList:",il["numberOfItems"],[x["name"] for x in il["itemListElement"]])
# âncoras do ItemList existem como id?
for x in il["itemListElement"]:
    a=x["url"].split("#")[1]
    if a not in pn.ids: print("  ÂNCORA AUSENTE no ItemList:",a)
# FAQ sincronizada
faq=[j for j in ln if j.get("@type")=="FAQPage"][0]
def clean(t): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>','',t)).replace('&quot;','"').replace('&amp;','&').strip()
pairs=re.findall(r'<details class="faq"[^>]*><summary>(.*?)</summary><div class="resp">(.*?)</div></details>',new,re.S)
print("FAQ HTML:",len(pairs),"| FAQ JSON-LD:",len(faq["mainEntity"]))
bad=0
for q,a in pairs:
    js=[e for e in faq["mainEntity"] if clean(e["name"])==clean(q)]
    if not js: print("  FAQ sem par no JSON-LD:",clean(q)); bad+=1; continue
    if clean(js[0]["acceptedAnswer"]["text"])!=clean(a): print("  FAQ divergente:",clean(q)[:70]); bad+=1
print("FAQ divergências:",bad)
# datas coerentes
print("Datas visíveis/estruturadas:",re.findall(r'datetime="(2026-[0-9-]+)"',new), re.findall(r'article:modified_time" content="([^"]+)',new))
# âncoras internas
ids=set(pn.ids); miss=[a for a in set(re.findall(r'href="#([^"]+)"',new)) if a not in ids]
print("âncoras # sem destino:",miss)
# resíduos da contagem antiga
for pat in [r'\b7 sistemas',r'\b7 apps',r'\bsete\b',r'os 7\b',r'dos 7\b',r'Os 7\b',r'seis perguntas']:
    m=re.findall(pat,new); 
    if m: print("  resíduo:",pat,len(m))
print("tamanho:",len(orig),"->",len(new),"bytes")
print("CTAs de cadastro:",len(re.findall(r'app\.agendali\.com\.br/signup',orig)),"->",len(re.findall(r'app\.agendali\.com\.br/signup',new)))
print("imagens:",len(re.findall(r'<img',orig)),"->",len(re.findall(r'<img',new)),"| iframe:",len(re.findall(r'<iframe',orig)),"->",len(re.findall(r'<iframe',new)))
# links externos/novos
newl=set(re.findall(r'href="(https?://[^"]+)"',new))-set(re.findall(r'href="(https?://[^"]+)"',orig)); print("links externos novos:",sorted(newl))
