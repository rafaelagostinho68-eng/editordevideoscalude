#!/usr/bin/env python3
"""Gera a capa 9 sistemas a partir da capa publicada (só reescreve o subtítulo: 7 -> 9).
Entrada: capa publicada baixada em /tmp/.../capa.jpg (ou caminho passado). Saída em proposta/assets/blog/capas/."""
import sys, pathlib
from PIL import Image, ImageDraw, ImageFont
base = pathlib.Path(__file__).resolve().parent
src = pathlib.Path(sys.argv[1])
out = base / "proposta/assets/blog/capas"; out.mkdir(parents=True, exist_ok=True)
im = Image.open(src).convert("RGB")
FONT = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"
L1_OLD, L1_NEW = "7 sistemas lado a lado: preço, link,", "9 sistemas lado a lado: preço, link,"
L2 = "WhatsApp, sinal e custos extras"
# acha o tamanho que reproduz a largura original da linha 1 (65 -> ~537 px)
target = 472
size = next(s for s in range(34, 18, -1) if ImageFont.truetype(FONT, s).getlength(L1_OLD) <= target + 3)
f = ImageFont.truetype(FONT, size)
d = ImageDraw.Draw(im)
d.rectangle((58, 424, 600, 504), fill=(255, 255, 255))   # fundo branco sob o subtítulo
col = (51, 65, 85)
d.text((65, 428), L1_NEW, font=f, fill=col)
d.text((65, 428 + round(size * 1.42)), L2, font=f, fill=col)
im.save(out / "melhor-app-agendamento-manicure-9-sistemas.jpg", quality=92, optimize=True)
w = 640; im.resize((w, round(630 * w / 1200)), Image.LANCZOS).save(out / "melhor-app-agendamento-manicure-9-sistemas-640.jpg", quality=88, optimize=True)
print("tamanho da fonte:", size, "->", out)
