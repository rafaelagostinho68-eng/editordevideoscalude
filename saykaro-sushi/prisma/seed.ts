/**
 * Importa o catálogo inicial a partir dos cardápios enviados pelo restaurante.
 *  • Idempotente e SEGURO: se já existirem categorias, NÃO sobrescreve nada (preserva edições do painel).
 *    Use --force-catalog apenas em ambiente de desenvolvimento para recriar o catálogo.
 *  • Itens ambíguos NÃO viram produtos: vão para a tabela CatalogPending (aba "Pendências" do painel).
 *  • Nada de descrições/ingredientes inventados: só o que aparece no material original.
 */
import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const db = new PrismaClient();
const force = process.argv.includes("--force-catalog");

type P = { name: string; portion?: string; price: number; description?: string; featured?: boolean; isNew?: boolean };
const cents = (n: number) => Math.round(n * 100);

const CATALOG: { name: string; description?: string; products: P[] }[] = [
  {
    name: "Entradas",
    products: [
      { name: "Pipoquinha de Camarão", portion: "1 porção", price: 16.99, featured: true },
      { name: "Hot Filadélfia", portion: "10 peças", price: 19.99, featured: true },
      { name: "Hot de Camarão", portion: "10 peças", price: 21.99 },
      { name: "Hot Skin", portion: "10 peças", price: 17.99 },
      { name: "Hot Crisp Batata Doce", portion: "10 unidades", price: 21.99 },
      { name: "Hot Crisp Alho-Poró", portion: "10 porções", price: 21.99 },
      { name: "Missô (Sopa de Soja)", portion: "1 porção", price: 14.99 },
      { name: "Gyoza Suína", portion: "4 unidades", price: 14.99 },
      { name: "Gyoza Frango", portion: "4 unidades", price: 14.99 },
      { name: "Haru Skin", portion: "10 unidades", price: 18.99 },
      { name: "Haru Filadélfia", portion: "10 unidades", price: 19.99 },
      { name: "Haru Camarão", portion: "10 peças", price: 21.99 },
      { name: "Haru Salmão com Cream Cheese", portion: "10 peças", price: 21.99 },
      { name: "Haru Crisp Batata Doce", portion: "10 peças", price: 21.99 },
    ],
  },
  {
    name: "Sushi e Sashimi",
    products: [
      { name: "Pirulito de Salmão", portion: "6 unidades", price: 19.99 },
      { name: "Sushi Salmão", portion: "4 unidades", price: 11.99 },
      { name: "Sushi Salmão Maçaricado", portion: "4 unidades", price: 12.99 },
      { name: "Sushi de Kani", portion: "4 unidades", price: 7.99 },
      { name: "Sushi Skin", portion: "4 unidades", price: 7.99 },
      { name: "Sushi de Camarão", portion: "4 unidades", price: 12.99 },
      { name: "Sushi de Atum", portion: "4 unidades", price: 12.99 },
      { name: "Sushi de Atum Maçaricado", portion: "4 unidades", price: 13.99 },
      { name: "Sashimi Salmão", portion: "5 unidades", price: 14.99 },
      { name: "Sashimi Salmão Maçaricado", portion: "5 unidades", price: 14.99 },
      { name: "Sashimi Atum", portion: "5 unidades", price: 14.99 },
      { name: "Sashimi Atum Maçaricado", portion: "5 unidades", price: 13.99 },
    ],
  },
  {
    name: "Harumakis",
    products: [
      { name: "Harumaki Camarão", portion: "4 unidades", price: 18.99 },
      { name: "Harumaki Salmão", portion: "4 unidades", price: 18.99 },
      { name: "Harumaki Frango", portion: "4 unidades", price: 17.99 },
      { name: "Harumaki Queijo", portion: "4 unidades", price: 16.99 },
    ],
  },
  { name: "Combos", products: [{ name: "Combo Hot Frito", portion: "36 peças", price: 55.0, isNew: true }] },
  {
    name: "Yakissoba",
    products: [
      { name: "Yakissoba Frutos do Mar", price: 40.0 },
      { name: "Yakissoba de Salmão", price: 35.0 },
      { name: "Yakissoba de Camarão", price: 30.0 },
      { name: "Yakissoba Salmão e Camarão", price: 35.0 },
      { name: "Yakissoba Misto (Carne, Frango e Calabresa)", price: 30.0 },
      { name: "Yakissoba Calabresa", price: 22.99 },
      { name: "Yakissoba Carne", price: 29.0 },
      { name: "Yakissoba Misto (Carne, Frango e Camarão)", price: 32.0 },
      { name: "Yakissoba Legumes", price: 17.99 },
      { name: "Legumes Salteados", price: 18.99 },
    ],
  },
  {
    name: "Acompanhamentos",
    products: [
      { name: "Batata Frita", portion: "1 porção", price: 19.99, isNew: true },
      { name: "Salmão Cube", portion: "6 unidades", price: 17.99, isNew: true },
    ],
  },
];

const PENDING: { title: string; details: string; source: string }[] = [
  { title: "Opções de uramaki ('Adicionar')", source: "Cardápio Entradas — anotação sobreposta junto a Missô/Gyoza/Haru",
    details: "Aparece o texto 'Adicionar: Uramaki Califórnia, Uramaki skin, Uramaki Filadélfia, Uramaki especial', sem preço nem porção. Confirmar se são produtos, adicionais ou outra coisa, e quais os valores." },
  { title: "Opções 'Joe'", source: "Cardápio Outras Opções — anotação sobreposta junto aos Harumakis",
    details: "Aparece: 'Joe cream cheese, Joe geleia de pimenta, Joe geleia de maracujá, Joe com alho poro, Joe de camarão, Joe de salmão', sem preço. Confirmar o que são (produto? adicional?) e os valores." },
  { title: "'Rosomaki'", source: "Cardápio Entradas — anotação ao lado de Haru Filadélfia", details: "Aparece apenas o nome 'Rosomaki', sem preço nem porção. Confirmar se é um produto." },
  { title: "Hot Crisp Alho-Poró: unidade da porção", source: "Cardápio Entradas", details: "Está como '10 porções' (os demais Hot Crisp usam 'unidades'). Confirmar se o correto é 10 unidades." },
  { title: "Nome: Haru Salmão com Cream Cheese", source: "Cardápio Entradas", details: "No material original está escrito 'cream tiese' (provável erro de digitação). Publicado como 'Cream Cheese' — confirmar." },
  { title: "Nome completo: Legumes Salteados", source: "Cardápio Yakissoba (página 3)", details: "O início do nome está coberto por uma marcação verde. Publicado como 'Legumes Salteados' — confirmar se é 'Yakissoba Legumes Salteado'." },
  { title: "Preço: Sashimi Atum Maçaricado", source: "Cardápio Outras Opções", details: "Está R$ 13,99, abaixo do Sashimi Atum comum (R$ 14,99). Confirmar se o valor está correto." },
  { title: "Quais são os 'Favoritos'", source: "Cardápio Entradas", details: "O material tem o selo 'Os Favoritos!' com seta apontando para o início da lista. Foram marcados como destaque Pipoquinha de Camarão e Hot Filadélfia; ajustar no painel." },
  { title: "Outras páginas do cardápio", source: "Cardápio Yakissoba", details: "A imagem do yakissoba é a 'PÁGINA 3'. Confirmar se existem outras páginas (bebidas, combos, sobremesas) não enviadas." },
  { title: "Fotografias dos produtos", source: "Geral", details: "As imagens enviadas têm baixa qualidade e não servem como foto individual. Enviar fotos reais de cada produto pelo painel (o espaço já está pronto)." },
  { title: "Horários de funcionamento", source: "Configuração", details: "Não constam no material. Cadastrar em Configurações e mudar o status para 'Automático'." },
  { title: "Bairros atendidos e taxas de entrega", source: "Configuração", details: "Não constam no material. Enquanto não houver bairro cadastrado, o pedido informa 'taxa a confirmar'." },
  { title: "Formas de pagamento aceitas", source: "Configuração", details: "Não constam no material. Por enquanto só 'Combinar com o restaurante' está habilitada." },
];

async function main() {
  await db.restaurantSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await db.paymentMethod.upsert({ where: { code: "AGREE" }, update: {}, create: { code: "AGREE", label: "Combinar com o restaurante", sortOrder: 0, enabled: true } });

  const existing = await db.category.count();
  if (existing > 0 && !force) {
    console.log(`Catálogo já existe (${existing} categorias). Nada foi alterado. (use --force-catalog só em desenvolvimento)`);
    return;
  }
  if (force) {
    console.log("--force-catalog: recriando catálogo (produtos e categorias; pedidos antigos mantêm o histórico).");
    await db.product.deleteMany();
    await db.category.deleteMany();
  }

  let ci = 0;
  for (const c of CATALOG) {
    const cat = await db.category.create({ data: { name: c.name, slug: slugify(c.name), description: c.description, sortOrder: ci++ * 10 } });
    let pi = 0;
    for (const p of c.products) {
      await db.product.create({
        data: {
          categoryId: cat.id, name: p.name, slug: slugify(p.name), description: p.description ?? null, portion: p.portion ?? null,
          priceCents: cents(p.price), featured: !!p.featured, isNew: !!p.isNew, sortOrder: pi++ * 10,
        },
      });
    }
  }
  if ((await db.catalogPending.count()) === 0) await db.catalogPending.createMany({ data: PENDING });
  const n = await db.product.count();
  console.log(`Catálogo importado: ${CATALOG.length} categorias, ${n} produtos, ${PENDING.length} pendências registradas.`);
}

main().finally(() => db.$disconnect());
