/**
 * Crée le bloc VIDEOS sur la page d'accueil (une seule fois) et vérifie
 * la colonne youtubeUrl sur les articles existants.
 */
const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function main() {
  const existing = await db.homepageBlock.findFirst({ where: { blockType: 'VIDEOS' } })
  if (!existing) {
    const maxOrder = await db.homepageBlock.aggregate({ _max: { order: true } })
    await db.homepageBlock.create({
      data: {
        blockType: 'VIDEOS',
        order: (maxOrder._max.order ?? -1) + 1,
        active: true,
        configJson: JSON.stringify({ eyebrow: 'Reportages vidéo', title: 'Vidéos' }),
      },
    })
    console.log('Bloc VIDEOS créé sur la page d’accueil.')
  } else {
    console.log('Bloc VIDEOS déjà présent (order ' + existing.order + ').')
  }

  const count = await db.article.count({ where: { OR: [{ format: 'VIDEO' }, { youtubeUrl: { not: null } }] } })
  console.log(`Articles vidéo actuellement publiables : ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
