// Contenus éditoriaux Guinée+ — Partie 2 : articles 8 à 14, rubriques, tags, pages CMS
import { p, h2, q, ul, doc } from './guinee-data-part1.js'

const U = '/uploads/guinee'

export const articles2 = [
  {
    find: 'sobriete-energetique-collectivites-montrent-voie',
    data: {
      slug: 'ecole-effectifs-plethoriques-manuels-bataille-primaire',
      title: 'École : effectifs pléthoriques, manuels rares — la bataille du primaire',
      subtitle: 'Dans les écoles publiques, des classes de 70 élèves et des livres partagés à quatre',
      chapo:
        'Dans les écoles publiques de Conakry et des régions, des classes de 70 élèves et des manuels partagés à quatre. Parents, enseignants et associations dressent l’état des lieux et réclament un plan d’urgence pour l’école guinéenne.',
      format: 'ARTICLE',
      catSlug: 'societe',
      coverImage: `${U}/ecole-classe.jpg`,
      coverCredit: 'Photo d’illustration : World Vision International',
      seoTitle: 'École en Guinée : effectifs pléthoriques et manque de manuels au primaire',
      seoDescription:
        'Classes surchargées, manuels insuffisants, grèves : état des lieux de l’école primaire publique guinéenne et des pistes de réforme.',
      readingTime: 6,
      featured: false,
      tags: ['Éducation', 'École', 'Jeunesse'],
      content: doc(
        p('La cour retentit de cent voix, mais il n’y a que deux salles. Dans la classe du CM2, à Ratoma, les tables doubles accueillent trois élèves ; derrière, d’autres suivent debout, cahiers sur les genoux. Le maître, functionnaire depuis douze ans, écrit la leçon au tableau en priant pour que le soleil décline : « À 70 par classe, on ne fait plus de la pédagogie, on fait de la logistique. »'),
        h2('Le compte à rebours des manuels'),
        p('Le second combat est celui des manuels. En mathématiques comme en lecture, les exemplaires manquent, et chaque livre sert quatre élèves — parfois six quand la rentrée a dépassé les prévisions. Les associations de parents complètent autant qu’elles peuvent : photocopie par centaines, cahiers de textes collectifs, livres prêtés par les aînés. Le ministère annonce chaque année de nouvelles dotations ; sur le terrain, on les attend encore par containers entiers.'),
        p('Les enseignants, eux, réclament des effectifs réduits, des formations continues et des carrières plus lisible. Les grèves ont rythmé les dernières rentrées, arrachant primes et revalorisations partielles. Les parents, de leur côté, payent de plus en plus de frais annexes : gardes, copies, entretien des salles.'),
        h2('Ce qui change déjà'),
        p('Dans quelques écoles pilotes, le tableau change : classes dédoublées en CP grâce à des financements partenaires, cantines qui stabilisent la fréquentation, cartes didactiques imprimées localement. Les expérimentations de pédagogie bilingue — langues nationales au CP puis français — avancent prudemment. La bataille du primaire se gagnera là : dans la salle de classe, un élève sur un banc, un livre par paire de mains.'),
      ),
    },
  },
  {
    find: 'nuit-du-train-reprend-du-service-en-france',
    data: {
      slug: 'football-feminin-mamans-syli-projecteurs',
      title: 'Football féminin : les « Mamans Syli » veulent leur place sous les projecteurs',
      subtitle: 'Terrains, salaires, visibilité : le plaidoyer d’une génération de joueuses',
      chapo:
        'Portée par la montée en puissance du football féminin africain, la sélection guinéenne réclame les moyens de sa ambition : championnat structuré, terrains, préparation. Enquête sur une révolution silencieuse.',
      format: 'ARTICLE',
      catSlug: 'sports',
      coverImage: `${U}/foot-stade.jpg`,
      coverCredit: 'Photo d’illustration : BBC',
      seoTitle: 'Football féminin en Guinée : les Mamans Syli en quête de reconnaissance',
      seoDescription:
        'Championnat féminin, conditions des joueuses, préparation de la sélection : état des lieux du football féminin guinéen.',
      readingTime: 5,
      featured: false,
      tags: ['Football', 'Sports', 'Jeunesse'],
      content: doc(
        p('Sur le terrain en terre battue de Sonfonia, l’entraînement du mardi se termine à la lampe frontale. Aminata, vingt-trois ans, attaquante, replie son maillot : « Nous avons le niveau. Ce qui nous manque, c’est ce qui vient après : un championnat complet, des contrats, des matchs retransmis. » Dans toute l’Afrique de l’Ouest, le football féminin change de dimension ; la Guinée veut suivre.'),
        h2('Un championnat à structurer'),
        p('Le championnat national féminin existe, mais il souffre du même mal que ses aînés : calendriers irréguliers, clubs sans stades attitrés, joueuses « amateurs » qui travaillent à côté. Les clubs pionniers de Conakry, de Kankan et de Labé attirent de plus en plus de filles des quartiers ; les stages de la fédération remplissent leurs listes d’attente. Ce qui manque, disent les entraîneurs, c’est la chaîne : écoles de foot, compétitions U15, détecteurs salariés.'),
        p('La sélection nationale, elle, a prouvé qu’elle pouvait tenir le rang lors des dernières éliminatoires continentales. Ses cadres évoluent à l’étranger — Maroc, France, Turquie — et servent d’ambassadrices. Chaque match retransmis crée un cortège de nouvelles licenciées : « Les petites nous regardent et se disent que c’est possible », sourit la capitaine.'),
        h2('L’effet CAN'),
        p('La Coupe d’Africaine féminine, de plus en plus médiatisée et dotée, a changé le regard des familles. Les pères qui interdisaient viennent maintenant aux matchs ; les sponsors s’invitent aux maillots. La fédération promet une convention pour les terrains et les indemnités. La génération actuelle a un objectif simple, énoncé par Aminata : « Que nos petites sœurs n’aient plus à choisir entre le terrain et le reste. »'),
      ),
    },
  },
  {
    find: 'marion-leroy-la-vitesse-n-est-pas-une-fatalite',
    data: {
      slug: 'peche-artisanale-se-meurt-en-silence-entretien-mamadou-sylla',
      title: '« La pêche artisanale se meurt en silence » : entretien avec Mamadou Sylla, pêcheur de Coyah',
      subtitle: 'Chalutiers, carburant, poisson qui fuit : le crépuscule d’un métier',
      chapo:
        'Chalutiers industriels, carburant hors de prix, espèces qui migrent : le président de la coopérative des pêcheurs de Coyah décrit la lente érosion d’un métier qui nourrit des milliers de familles sur le littoral guinéen.',
      format: 'INTERVIEW',
      catSlug: 'environnement',
      coverImage: `${U}/peche-pirogues.jpg`,
      coverCredit: 'Photo : France 24',
      seoTitle: 'Pêche artisanale en Guinée : entretien avec un pêcheur de Coyah',
      seoDescription:
        'Chalutage industriel, coût du carburant, gestion des ressources : Mamadou Sylla, pêcheur de Coyah, alerte sur l’état de la pêche artisanale guinéenne.',
      readingTime: 6,
      featured: false,
      tags: ['Pêche', 'Littoral', 'Entretien'],
      content: doc(
        p('Guinée+, Coyah. Fils et petit-fils de pêcheurs, Mamadou Sylla préside une coopérative qui regroupe des dizaines de pirogues du littoral. Il reçoit à l’ombre du hangar à filets, entre deux marées. Entretien.'),
        q('Guinée+ : Vous dites que la pêche artisanale « se meurt en silence ». Pourquoi ce silence ?'),
        p('Parce que nous partons la nuit et rentrons à l’aube. Personne ne voit le trajet, personne ne voit les filets vides. La pêche industrielle, elle, a des armateurs, des statistiques, des lobbyistes. Nous, on a des mains. Et pourtant, c’est nous qui approvisionnons les marchés, les fumoirs, les écoles de quartier. Si la pirogue s’arrête, c’est la table familiale qui se vide.'),
        q('Qu’est-ce qui a le plus changé en vingt ans ?'),
        p('Trois choses. D’abord les chalutiers qui raclent au bord de nos zones, parfois la nuit, parfois dans les zones réservées — la pêche illicite, non déclarée, non réglementée. Ensuite le carburant : quand le litre grimpe, la sortie devient un pari. Enfin le poisson lui-même : les petits pélagiques bougent, la saison se décale. Nos pères lisaient le ciel et la lune ; maintenant il faut lire les cartes de température de l’eau.'),
        q('Qu’est-ce que la Guinée devrait faire en priorité ?'),
        p('Faire respecter la bande côtière — avec des gardes, des radars, des sanctions réelles, pas des promesses. Moderniser la chaîne du froid : un poisson bien conservé, c’est un revenu qui double. Et organiser la filière : coopératives solides, quai de débarquement propres, accès au crédit. Le poisson ne manque pas encore. Ce qui manque, c’est la volonté de laisser une place aux pirogues.'),
      ),
    },
  },
  {
    find: 'video-nantes-reverdit-ses-ecoles-cour-en-cour',
    data: {
      slug: 'video-balafon-kora-hip-hop-nouvelle-scene-musicale-conakry',
      title: 'Vidéo : balafon, kora et hip-hop — la nouvelle scène musicale de Conakry',
      subtitle: 'Du Sosso-Bala de Niagassola aux studios de Kaloum',
      chapo:
        'Du balafon sacré de Niagassola aux studios de Kaloum, la musique guinéenne puise dans son héritage mandingue pour réinventer le son urbain. Rencontre avec une génération qui mélange balafon, kora et beats électroniques.',
      format: 'VIDEO',
      catSlug: 'culture',
      coverImage: `${U}/musique-balafon.jpg`,
      coverCredit: 'Photo : World Music Central',
      seoTitle: 'Musique guinéenne : balafon, kora et hip-hop, la nouvelle scène de Conakry',
      seoDescription:
        'Héritage mandingue, griots, hip-hop de Conakry : comment la jeune musique guinéenne réinvente le balafon et la kora.',
      readingTime: 5,
      featured: false,
      tags: ['Musique', 'Culture', 'Conakry'],
      content: doc(
        p('Dans un studio de Kaloum, la session commence comme une cérémonie : le balafoniste pose son instrument, tape deux fois la caisse, salue les ancêtres d’un mot. Puis le beat tombe. À la console, un producteur de vingt-six ans superpose la ligne de balafon, une kora enregistrée à Kouroussa et une boîte à rythmes. La chanson, partagée en quelques jours, a dépassé les frontières de la Guinée sur les plateformes.'),
        h2('Un patrimoine qui respire encore'),
        p('La Guinée reste l’un des grands réservoirs de la culture mandingue : les griots y portent des répertoires millénaires, et le Sosso-Bala — le balafon historique gardé à Niagassola, inscrit au patrimoine immatériel de l’UNESCO — y est encore joué lors des grandes circonstances. Les ensembles nationaux, hérités des années Sékou Touré, ont formé des générations d’instrumentistes d’exception, de Mory Kanté à Master Soury.'),
        h2('La génération remix'),
        p('Leur héritiers veulent autre chose que le folklore de salon : du hip-hop en soussou et en malinké, de l’afrobeat teinté de ternal de la foret guinéenne, des collaborations avec les scènes d’Abidjan, Bamako et Dakar. Les festivals —Nation Sawa, les nuits de l’Institut français — servent de rampe de lancement ; la diaspora finance les clips. La boucle est bouclée quand un groupe comme ceux de la nouvelle vague rappelle : « Nous ne mélangeons pas l’ancien et le nouveau. Nous continuons la même histoire. »'),
      ),
    },
  },
  {
    find: 'enquete-influenceurs-sante-regulation-floue',
    data: {
      slug: 'enquete-bauxite-fleuves-promesses-villages',
      title: 'Enquête : bauxite et fleuves, ce que les compagnies minières promettent aux villages',
      subtitle: 'Fonds communautaires, écoles, puits : l’état des promesses autour des mines',
      chapo:
        'Fonds sociaux miniers, écoles promises, puits forés : autour des zones d’extraction de Boké et de Kindia, les engagements s’accumulent. Notre enquête sur ce qui est réellement livré — et ce qui reste lettre morte.',
      format: 'REPORTAGE',
      catSlug: 'economie-mines',
      coverImage: `${U}/fouta-cascade.jpg`,
      coverCredit: 'Photo : E.A.Travel',
      seoTitle: 'Mines et villages en Guinée : l’état des promesses sociales des compagnies',
      seoDescription:
        'Enquête sur les programmes sociaux miniers en Guinée : écoles, puits, fonds communautaires autour des zones de bauxite.',
      readingTime: 8,
      featured: false,
      tags: ['Bauxite', 'Enquête', 'Minerais'],
      content: doc(
        p('Le cahier des promesses est épais comme un registre paroissial : une école à six classes ici, un forage là, un dispensaire plus loin, des centaines de millions de francs versés aux fonds de développement local. Autour des concessions de bauxite de Boké, de Kindia et de Fria, chaque compagnie affiche son programme social. Guinée+ a vérifié, village par village, ce qui est sorti de terre.'),
        h2('Ce qui est construit'),
        p('Les réalisations existent, parfois remarquables : des écoles clés en main avec logements de maîtres, des pistes réhabilitées qui tiennent deux saisons des pluies, des forages solaires entretenus par des comités formés. Les compagnies publient des bilans, les préfectures contresignent, les ONG locales valident à la louche — ou au GPS. Dans certains villages, la mine est la seule administration qui a livré du béton en dix ans.'),
        h2('Ce qui s’évapore'),
        p('Mais l’enquête relève aussi des angles morts : des infrastructures livrées sans budget de fonctionnement — l’école sans enseignants affectés, le forage sans pièce de rechange ; des fonds communautaires dont les arbitrages se font loin des bénéficiaires ; des déplacements de populations où l’indemnisation, calculée à l’hectare, néglige les vergers et les sites sacrés. Et partout, la même asymétrie : les habitants n’ont pas accès aux contrats, et ne peuvent donc contester que ce qu’ils voient.'),
        p('Les instruments existent pourtant : la loi minière impose plans de développement local, publications des paiements et consultations préalables. Le travail des années à venir consistera à donner des dents à ces textes : comités locaux outillés, données publiques, justice accessible. La terre rouge rapporte des milliards ; la question de la décennie est simple : combien de ponts, d’écoles et de confiance, au kilo de minerai ?'),
      ),
    },
  },
  {
    find: 'rentree-litteraire-2026-palmares-dix-titres',
    data: {
      slug: 'wax-bazin-indigo-mode-guineenne-veut-s-exporter',
      title: 'Wax, bazin et indigo : la mode guinéenne veut s’exporter',
      subtitle: 'Stylistes de Conakry, couturières de Kankan : portrait d’une filière en quête d’usines',
      chapo:
        'Stylistes de Conakry, couturières de Kankan, marchés aux tissus bondés : la création textile guinéenne mise sur le bazin riche et le wax pour conquérir les podiums et les diasporas. Portrait d’une filière en quête d’usines.',
      format: 'ARTICLE',
      catSlug: 'culture',
      coverImage: `${U}/tissu-wax.jpg`,
      coverCredit: 'Photo : Afrika Warehouse',
      seoTitle: 'Mode guinéenne : wax, bazin et indigo à la conquête du monde',
      seoDescription:
        'Bazin riche, wax, teintures indigo : comment les stylistes et couturières guinéennes structurent une filière mode exportable.',
      readingTime: 5,
      featured: false,
      tags: ['Mode', 'Artisanat', 'Culture'],
      content: doc(
        p('Les rouleaux s’empilent comme des colonnes de temple : wax néerlandais, bazin riche getzner, indigo teinté à la main. Au marché de Madina comme dans les boutiques de Taouyah, le tissu est le premier luxe des familles guinéennes — celui des mariages, desTabaski, des baptêmes. Et depuis quelques années, il est aussi devenu le drapeau d’une création locale qui monte.'),
        h2('Le règne du bazin'),
        p('Aucune grande cérémonie guinéenne ne se conçoit sans bazin : repassé, plissé, brodé à l’or, porté en boubou trois pièces. Les ateliers de broderie de Conakry et de Kankan tournent à plein régime en période de fêtes, et les maîtres brodeurs ont leurs clientèles fidèles jusqu’à Paris et New York. Le défi n’est plus le talent — il est industriel : teinture locale, couture de série, contrôle qualité.'),
        h2('Podiums et diasporas'),
        p('Les stylistes guinéens enchaînent les défilés : Fashion Week d’Abidjan, plateformes diasporiques de Paris, concours continentaux. Leur promesse : une élégance guinéenne qui assume le détail mandingue — col brodé, drapé foulé, imprimés inspirés des dessins de la côte. Pour transformer l’essai, la filière réclame ce qui manque : zones d’activité textile, formation professionnelle couture, crédit d’équipement. Le jour où le boubou porté à Bruxelles sera cousu à Sonfonia, la mode aura gagné sa bataille.'),
      ),
    },
  },
  {
    find: null,
    data: {
      slug: 'tabaski-conakry-priere-solidarite-prix-moutons',
      title: 'Tabaski à Conakry : prière, solidarité et prix des moutons',
      subtitle: 'La grande fête à l’heure de la mosquée Mohammed VI',
      chapo:
        'Prière à l’aube, marchés aux moutons bondés, plats partagés de quartier : Conakry vit la Tabaski entre ferveur, solidarité et course aux prix. Reportage dans la capitale au jour de la grande fête.',
      format: 'ARTICLE',
      catSlug: 'societe',
      coverImage: `${U}/mosquee-conakry-2.jpg`,
      coverCredit: 'Photo : Yeni Safak',
      seoTitle: 'Tabaski à Conakry : prière, solidarité et marché aux moutons',
      seoDescription:
        'Prière de l’Aïd, prix des moutons, solidarité de quartier : la Tabaski à Conakry, entre tradition et vie chère.',
      readingTime: 4,
      featured: false,
      tags: ['Tabaski', 'Conakry', 'Société'],
      content: doc(
        p('Dès les premières lueurs, les chemises brodées et les boubous bazin sortent des armoires. À la mosquée Mohammed VI, inaugurée au bord de la mer, comme devant la Grande Mosquée Fayçal, les fidèles s’alignent en longues rangées paisibles : la Tabaski, l’Aïd al-Adha, est le jour où Conakry prie ensemble, avant de sacrifier et de partager.'),
        p('Les semaines précédentes ont été une course : moutons du Fouta et du Mali négociés dans les parcs improvisés, prix surveillés de près dans une capitale sensible à la vie chère. « Cette année, beaucoup ont choisi le mouton plus petit, ou la part collective », résume un commerçant du parc de Kagbelen. La bague, la tradition du partage, s’adapte à tous les budgets.'),
        p('Car la Tabaski est aussi l’économie de la solidarité : le mouton se partage en trois — la famille, les proches, les nécessiteux. Les plats circulent entre les cours, les gardiens de quartiers reçoivent leur part, la diaspora envoie ses virements de dernière minute. Le soir, la ville sent le grillé et la peur de rien : demain, les familles recommenceront à compter — mais ce soir, personne ne compte.'),
      ),
    },
  },
]

export const categories = [
  {
    find: 'politique',
    data: {
      name: 'Politique',
      description: 'Institutions, transition, gouvernance et vie publique : le pouvoir guinéen observé sans complaisance.',
      coverImage: `${U}/mosquee-conakry.jpg`,
      color: '#D6220F',
    },
  },
  {
    find: 'international',
    data: {
      name: 'Économie & Mines',
      slug: 'economie-mines',
      description: 'Bauxite, fer, agriculture, commerce : les chiffres et les réalités de l’économie guinéenne.',
      coverImage: `${U}/bauxite-b.jpg`,
      color: '#A51306',
    },
  },
  {
    find: 'societe',
    data: {
      name: 'Société',
      description: 'Vie quotidienne, éducation, santé, villes et villages : la Guinée d’aujourd’hui au plus près des gens.',
      coverImage: `${U}/marche-2.jpg`,
      color: '#EDB405',
    },
  },
  {
    find: 'culture',
    data: {
      name: 'Culture',
      slug: 'culture',
      description: 'Musique, mode, patrimoine mandingue et création contemporaine : le rayonnement culturel de la Guinée.',
      coverImage: `${U}/tissu-wax.jpg`,
      color: '#C29200',
    },
  },
  {
    find: 'environnement',
    data: {
      name: 'Environnement',
      description: 'Fouta Djallon, littoral, forêts et parcs naturels : la bataille pour un développement durable.',
      coverImage: `${U}/fouta-djallon.jpg`,
      color: '#01B458',
    },
  },
  {
    find: 'sciences-tech',
    data: {
      name: 'Sports',
      slug: 'sports',
      description: 'Syli National, football féminin, basket, lutte : le sport qui fait vibrer tout le pays.',
      coverImage: `${U}/foot-stade.jpg`,
      color: '#0B9A50',
    },
  },
]

export const tags = [
  'Enquête', 'Reportage', 'Entretien', 'Bauxite', 'Simandou', 'Conakry', 'Boké',
  'Fouta Djallon', 'Îles de Los', 'Vie chère', 'Éducation', 'Pêche', 'Musique',
  'Mode', 'Football', 'Tabaski', 'Transition', 'Minerais', 'Économie', 'Jeunesse',
]

export const tagLinks = {
  'bauxite-sangaredi-terre-rouge-richesse-region-miniere': ['Bauxite', 'Boké', 'Minerais', 'Économie'],
  'dialogue-national-ce-que-contient-feuille-route-transition': ['Transition', 'Conakry'],
  'simandou-sans-rail-le-fer-ne-vaudra-rien-entretien': ['Simandou', 'Minerais', 'Économie', 'Entretien'],
  'fouta-djallon-trois-jours-plateaux-chateau-eau-afrique': ['Fouta Djallon', 'Reportage'],
  'conakry-epreuve-croissance-trafic-dechets-grands-chantiers': ['Conakry', 'Reportage'],
  'vie-chere-marche-madina-arbitrages-familles': ['Vie chère', 'Conakry'],
  'iles-de-los-week-end-large-conakry-photographe': ['Îles de Los', 'Reportage'],
  'ecole-effectifs-plethoriques-manuels-bataille-primaire': ['Éducation', 'Jeunesse'],
  'football-feminin-mamans-syli-projecteurs': ['Football', 'Jeunesse'],
  'peche-artisanale-se-meurt-en-silence-entretien-mamadou-sylla': ['Pêche', 'Entretien'],
  'video-balafon-kora-hip-hop-nouvelle-scene-musicale-conakry': ['Musique', 'Conakry'],
  'enquete-bauxite-fleuves-promesses-villages': ['Bauxite', 'Enquête'],
  'wax-bazin-indigo-mode-guineenne-veut-s-exporter': ['Mode'],
  'tabaski-conakry-priere-solidarite-prix-moutons': ['Tabaski', 'Conakry'],
}

export const pages = {
  'a-propos': {
    title: 'À propos de Guinée+',
    heroImage: `${U}/fouta-djallon.jpg`,
    seoTitle: 'À propos de Guinée+ — journalisme indépendant guinéen',
    seoDescription:
      'Guinée+ est un média numérique indépendant basé à Conakry : reportages, enquêtes et analyses sur la Guinée, financé par ses lecteurs.',
    content: doc(
      p('Guinée+ est née d’un constat simple : la Guinée mérite une presse à la hauteur de ses histoires. Des mines de Boké aux plateaux du Fouta Djallon, du port de Kamsar aux marchés de Madina, ce pays produit chaque jour des faits, des débats et des visages que les formats courts racontent mal. Nous avons choisi le terrain, la vérification et le format long.'),
      h2('Notre mission'),
      p('Informer sans détour, contextualiser sans jargon, donner la parole à celles et ceux qui font la Guinée : décideurs, chercheurs, paysans, artistes, commerçantes, étudiants. Nous traitons la politique, l’économie et les mines, la société, l’environnement, la culture et le sport avec la même exigence : chaque affirmation sourcée, chaque chiffre vérifié, chaque partie adverse entendue.'),
      h2('Notre ligne éditoriale'),
      p('Trois convictions guident chacun de nos articles. D’abord, le terrain : pas d’article sans déplacement, sans rencontre, sans voix directes. Ensuite, l’exigence du format long : la complexité de la Guinée mérite mieux que des résumés de trois paragraphes. Enfin, l’indépendance économique : Guinée+ est financé par ses lecteurs, sans publicité cachée ni actionnaire qui dicterait la ligne.'),
      q('Un média qui ne doit rien à personne ne doit tout qu’au lecteur.'),
      h2('La rédaction'),
      p('Guinée+ est fondé et dirigé par Claire Vasseur, journaliste indépendante basée à Conakry, spécialiste des questions sociales, environnementales et minières. La rédaction s’appuie sur un réseau de correspondants dans les quatre coins naturels du pays — Basse-Guinée, Moyenne-Guinée, Haute-Guinée et Guinée forestière — et sur des partenaires photographiques dans toute l’Afrique de l’Ouest.'),
      h2('Nos standards'),
      ul([
        'Correction publique : toute erreur signalée est corrigée avec mention visible.',
        'Distinction nette entre faits vérifiés, analyses et opinions.',
        'Protection des sources et anonymat accordé avec parcimonie et justification.',
        'Aucun contenu sponsorisé déguisé en article d’information.',
      ]),
      h2('Nous écrire'),
      p('Une info, une correction, une proposition de sujet, un témoignage : la rédaction lit tout et répond sous 48 heures ouvrées. Écrivez à contact@guineeplus.com ou appelez le +224 625 37 54 09. Les signalements sensibles peuvent être envoyés en demandant un canal chiffré.'),
    ),
  },
  'mentions-legales': {
    title: 'Mentions légales',
    content: doc(
      h2('Éditeur du site'),
      p('Guinée+ — média numérique indépendant. Rédaction basée à Conakry, République de Guinée. Directrice de la publication : Claire Vasseur. Contact : contact@guineeplus.com — +224 625 37 54 09.'),
      h2('Hébergement'),
      p('Le site est hébergé sur une infrastructure cloud sécurisée, avec chiffrement des échanges (HTTPS) et sauvegardes quotidiennes des contenus.'),
      h2('Propriété intellectuelle'),
      p('L’ensemble des contenus éditoriaux (textes, illustrations, logos, mise en page) est protégé par le droit d’auteur. Toute reproduction, même partielle, est soumise à autorisation préalable, hors citation brève avec lien vers la page d’origine. Les photographies d’illustration créditées demeurent la propriété de leurs auteurs et sources respectives.'),
      h2('Responsabilité'),
      p('Guinée+ s’efforce d’assurer l’exactitude des informations publiées et corrige publiquement les erreurs signalées. Les liens externes et contenus de tiers n’engagent pas la rédaction.'),
    ),
  },
  'politique-de-confidentialite': {
    title: 'Politique de confidentialité',
    content: doc(
      h2('Données collectées'),
      p('Guinée+ collecte uniquement les données nécessaires à ses services : adresse e-mail pour la newsletter (avec double opt-in), pseudonyme et contenu de commentaire si vous en publiez, message et coordonnées si vous utilisez le formulaire de contact. Aucune donnée n’est vendue ni cédée à des tiers.'),
      h2('Mesure d’audience'),
      p('Nous mesurons la fréquentation du site de façon agrégée et anonymisée afin d’améliorer nos contenus. Vous pouvez naviguer en refusant les cookies optionnels sans perte de fonctionnalités éditoriales.'),
      h2('Vos droits'),
      p('Conformément à la législation applicable en matière de protection des données personnelles, vous disposez d’un droit d’accès, de rectification, d’effacement et d’opposition. Pour l’exercer, écrivez à contact@guineeplus.com : la réponse intervient sous trente jours.'),
      h2('Conservation et sécurité'),
      p('Les données sont conservées pour la durée nécessaire au service concerné, puis supprimées. Les échanges sont chiffrés, les accès à la base de données restreints et journalisés.'),
    ),
  },
}

export const settingsUpdates = {
  ticker_label: 'Flash info',
  site_slogan: 'Toute la Guinée, en continu',
  trust_title: 'Un journalisme guinéen indépendant, financé par ses lecteurs',
  trust_subtitle:
    'Reportages, enquêtes et analyses sur toute la Guinée — de Boké à Nzérékoré, de Conakry au Fouta Djallon.',
  newsletter_intro:
    'Chaque vendredi, recevez l’essentiel de l’actualité guinéenne, nos reportages et nos enquêtes, directement dans votre boîte mail.',
}
