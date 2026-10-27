# Atualizar o cardápio

Tudo é feito pelo painel (`/admin`) — não é preciso mexer em código nem reimplantar.

## Cardápio rápido (o dia a dia)
Em **Cardápio** (`/admin/produtos`): toque no **preço** ou no **nome** para editar (Enter salva, Esc cancela); use os interruptores **Disponível/Esgotado** e **No cardápio/Oculto**; **Voltar tudo ao estoque** limpa todos os esgotados de uma vez (bom para começar o dia); o interruptor ao lado do nome da categoria esconde a categoria inteira. O botão **⋯** de cada linha tem destaque, etiqueta NOVO, subir/descer e "Editar tudo".

## Produtos
* **Produtos → Novo produto**: nome, categoria, preço (`19,90`), porção (opcional), descrição (opcional), visibilidade.
* **Mudar preço/nome**: abra o produto e salve — vale na hora. Pedidos antigos **não mudam**.
* **Esgotado hoje**: botão “Marcar esgotado” na lista. O item continua visível, mas o botão de adicionar fica desativado e o **servidor recusa** o pedido.
* **Ocultar**: tira do cardápio sem apagar (e sem perder o histórico). **Excluir** apaga o produto e a foto; pedidos antigos ficam intactos.
* **Ordem**: setas ▲▼ na lista (dentro da categoria) ou o campo “Posição”.
* **Destaques**: marque *Destaque* ou *Novidade*; eles aparecem na aba “Destaques” (novidade também ganha a etiqueta NOVO).
* **Descrição e porção**: só preencha o que for **confirmado**. Em branco = nada é exibido.

## Categorias
**Categorias**: criar, renomear, ocultar/mostrar e reordenar (▲▼). Não é possível excluir categoria que ainda tenha produtos — oculte-a ou mova os produtos antes.

## Adicionais e opções
**Adicionais → Novo grupo**: nome (ex.: “Molho extra”), mínimo/máximo de escolhas, obrigatório ou não, opções (preço vazio = grátis) e **quais produtos** oferecem o grupo. Nenhum adicional pago foi cadastrado por conta própria: só entra o que o restaurante confirmar.

## Trocar fotos
* **Várias de uma vez:** `Fotos` no menu → arraste as fotos (ou escolha no aparelho). Se o arquivo tem o nome do produto (`hot-filadelfia.jpg`, `Yakissoba Frutos do Mar.png`), o produto já vem escolhido; confira e toque em **Enviar**. Fotos sem nome claro (`IMG_2041.jpg`) você escolhe o produto na lista.
* Produto → **Foto do produto → Enviar/Trocar imagem** (JPG, PNG ou WebP, até 5 MB, mínimo 200×150 px).
* O sistema recorta em **4:3**, gera versão grande e miniatura em WebP e apaga a foto anterior. Para remover, use **Remover** (volta o espaço reservado com a marca).
* Dicas: fotografe de cima ou a 45°, luz natural, fundo limpo e o prato centralizado (o recorte automático mantém o centro).
* Logo: **Restaurante → Logo**. Sem logo enviada, o cardápio usa a logo tipográfica “Saykaro Sushi”.

## Taxas, horários, pagamento
**Restaurante**: horários da semana, status (automático/aberto/fechado), pausar pedidos, aviso no topo, bairros e taxas, formas de pagamento, WhatsApp e Instagram. Bairro que não estiver cadastrado aparece como “taxa a confirmar” — o sistema nunca inventa valor.

## Catálogo inicial e reimportação
O catálogo inicial vem de `prisma/seed.ts` (cardápios enviados pelo restaurante). `npm run db:seed` **não sobrescreve nada** se já existirem categorias. Em desenvolvimento, `npm run db:seed -- --force-catalog` recria o catálogo do zero.

## Pendências de confirmação (não publicadas)
Itens do material original que ficaram de fora ou precisam de confirmação estão em **Painel → Pendências** (13 itens ao entrar): opções “Adicionar” dos uramakis, opções “Joe”, “Rosomaki”, unidade da porção do Hot Crisp Alho-Poró, nome “Haru Salmão com Cream Cheese”, nome completo de “Legumes Salteados”, preço do Sashimi Atum Maçaricado (R$ 13,99, menor que o Sashimi Atum), quais são os “Favoritos”, outras páginas do cardápio, fotos, horários, bairros/taxas e formas de pagamento.
Quando o restaurante confirmar: cadastre o produto/opção/configuração e clique **Resolvida**.
