// Migration de marque : La Vigie → Guinée+ (réglages, pages, articles, couleurs)
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const SETTINGS = {
  site_name: 'Guinée+',
  site_slogan: 'Avec Guinée+, vivez l’info en continu',
  site_logo: '/brand/logo-guineeplus-round.png',
  site_favicon: '/brand/favicon-48.png',
  accent_color: '#E02310',
  seo_default_title: 'Guinée+ — Site web d’actualités',
  seo_default_description:
    'Guinée+, site web d’actualités : toute l’info en continu — politique, société, économie, sport et culture. Avec Guinée+, vivez l’info en continu.',
  social_facebook: 'https://www.facebook.com/guineeplus',
  social_twitter: '',
  social_instagram: '',
  social_linkedin: '',
  social_youtube: '',
  contact_email: 'contact@guineeplus.com',
  contact_phone: '+224 625 37 54 09',
  contact_intro:
    'Une question, une réaction, une information à nous transmettre ? L’équipe de Guinée+ vous lit attentivement et répond sous 48 heures ouvrées.',
  maintenance_message:
    'Guinée+ fait peau neuve. Nous revenons dans quelques instants avec un site encore plus beau. Merci de votre patience.',
  footer_text:
    'Guinée+ est un site web d’actualités indépendant. Chaque information est vérifiée, sourcée et relue avant publication. Avec Guinée+, vivez l’info en continu.',
};

const CAT_COLORS = {
  politique: '#D6220F',      // rouge logo
  international: '#A51306',  // rouge profond du dégradé
  societe: '#EDB405',        // or officiel
  culture: '#C29200',        // or profond (lisible)
  environnement: '#01B458',  // vert officiel
  'sciences-tech': '#0B9A50' // vert profond
};

// Remplacements de texte fidèles pour les contenus éditoriaux
const REPLACEMENTS = [
  ['La Vigie — Média indépendant', 'Guinée+ — Site web d’actualités'],
  ['La Vigie est un média indépendant financé par ses lecteurs', 'Guinée+ est un site web d’actualités indépendant'],
  ['La Vigie est financée par ses lecteurs', 'Guinée+ est financé par ses lecteurs'],
  ['La Vigie a fait le choix', 'Guinée+ a fait le choix'],
  ['La Vigie, média digital indépendant', 'Guinée+, site web d’actualités'],
  ['La Vigie fait peau neuve', 'Guinée+ fait peau neuve'],
  ['la rédaction de La Vigie', 'la rédaction de Guinée+'],
  ['12 rue des Archives, 75003 Paris', 'médiaGuinéeplus.com'],
  ['redaction@lavigie.fr', 'contact@guineeplus.com'],
  ['La Vigie', 'Guinée+'],
  ['lavigie.fr', 'guineeplus.com'],
];

function applyReplacements(text) {
  let out = text;
  for (const [from, to] of REPLACEMENTS) out = out.split(from).join(to);
  return out;
}

function walkJson(node, fn) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach((n) => walkJson(n, fn)); return; }
  if (typeof node.text === 'string') node.text = fn(node.text);
  if (typeof node.src === 'string') node.src = fn(node.src);
  if (typeof node.alt === 'string') node.alt = fn(node.alt);
  if (typeof node.caption === 'string') node.caption = fn(node.caption);
  if (typeof node.credit === 'string') node.credit = fn(node.credit);
  Object.values(node).forEach((v) => { if (v && typeof v === 'object') walkJson(v, fn); });
}

(async () => {
  // 1) Réglages
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  console.log('Réglages mis à jour :', Object.keys(SETTINGS).length);

  // 2) Pages CMS
  const pages = await db.page.findMany();
  for (const p of pages) {
    const title = applyReplacements(p.title || '');
    const contentText = applyReplacements(p.contentText || '');
    let contentJson = p.contentJson;
    try {
      const j = JSON.parse(p.contentJson);
      walkJson(j, applyReplacements);
      contentJson = JSON.stringify(j);
    } catch { contentJson = applyReplacements(p.contentJson || ''); }
    await db.page.update({ where: { id: p.id }, data: { title, contentText, contentJson } });
  }
  console.log('Pages mises à jour :', pages.map((p) => p.slug).join(', '));

  // 3) Articles (mentions de marque uniquement, contenus inchangés sinon)
  const articles = await db.article.findMany();
  let touched = 0;
  for (const a of articles) {
    const data = {};
    const hasV = [a.title, a.chapo, a.contentText, a.seoTitle, a.seoDescription, a.contentJson, a.coverCredit].some((s) => s && (s.includes('Vigie') || s.includes('lavigie')));
    if (!hasV) continue;
    data.title = applyReplacements(a.title || '');
    data.chapo = a.chapo ? applyReplacements(a.chapo) : null;
    data.contentText = applyReplacements(a.contentText || '');
    data.seoTitle = a.seoTitle ? applyReplacements(a.seoTitle) : null;
    data.seoDescription = a.seoDescription ? applyReplacements(a.seoDescription) : null;
    data.coverCredit = a.coverCredit ? applyReplacements(a.coverCredit) : null;
    try {
      const j = JSON.parse(a.contentJson);
      walkJson(j, applyReplacements);
      data.contentJson = JSON.stringify(j);
    } catch { /* garde l'original */ }
    await db.article.update({ where: { id: a.id }, data });
    touched++;
  }
  console.log('Articles mis à jour :', touched);

  // 4) Couleurs officielles des rubriques
  for (const [slug, color] of Object.entries(CAT_COLORS)) {
    await db.category.updateMany({ where: { slug }, data: { color } });
  }
  console.log('Rubriques recolorées :', Object.keys(CAT_COLORS).join(', '));

  // Vérification finale : plus aucune mention ?
  const rest = await db.article.findMany({ where: { OR: [{ contentText: { contains: 'Vigie' } }, { title: { contains: 'Vigie' } }] }, select: { slug: true } });
  console.log('Articles mentionnant encore l’ancienne marque :', rest.length === 0 ? 'aucun ✓' : rest.map((r) => r.slug).join(', '));
  await db.$disconnect();
})().catch((e) => { console.error('ERREUR:', e.message); process.exit(1); });
