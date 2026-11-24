// État initial des contenus avant tests E2E dashboard → site
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  const art = await db.article.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: { id: true, title: true, slug: true, chapo: true },
  });
  console.log('ARTICLE_TEST=' + JSON.stringify(art));

  const cat = await db.category.findFirst({ select: { id: true, name: true, slug: true } });
  console.log('RUBRIQUE_TEST=' + JSON.stringify(cat));

  const page = await db.page.findFirst({ select: { id: true, title: true, slug: true } });
  console.log('PAGE_TEST=' + JSON.stringify(page));

  const heroBlock = await db.homepageBlock.findFirst({
    where: { blockType: 'HERO_UNE' },
    select: { id: true, blockType: true, order: true, active: true, configJson: true },
  });
  console.log('HERO_TEST=' + JSON.stringify(heroBlock));

  const footerSetting = await db.siteSetting.findUnique({ where: { key: 'footer_text' } });
  console.log('FOOTER_TEST=' + JSON.stringify(footerSetting));

  const contactTitle = await db.siteSetting.findUnique({ where: { key: 'contact_title' } });
  console.log('CONTACT_TITLE_TEST=' + JSON.stringify(contactTitle));

  await db.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
