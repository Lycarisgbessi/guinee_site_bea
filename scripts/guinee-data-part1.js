// Contenus éditoriaux Guinée+ — Partie 1 : articles 1 à 7
// Helpers Tiptap (structure identique au seed officiel)
export const p = (t) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] })
export const h2 = (t) => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: t }] })
export const q = (t) => ({
  type: 'blockquote',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: t, marks: [{ type: 'italic' }] }] }],
})
export const ul = (items) => ({
  type: 'bulletList',
  content: items.map((t) => ({ type: 'listItem', content: [p(t)] })),
})
export const doc = (...c) => ({ type: 'doc', content: c })

const U = '/uploads/guinee'

export const articles1 = [
  {
    find: 'eau-cevennes-source-tourisme-hors-sol',
    data: {
      slug: 'bauxite-sangaredi-terre-rouge-richesse-region-miniere',
      title: 'Bauxite : la terre rouge de Sangarédi, entre richesse nationale et blessures du terrain',
      subtitle: 'Reportage dans la région de Boké, premier poumon minier de la Guinée',
      chapo:
        'Premier exportateur mondial de bauxite, la Guinée nourrit des usines d’aluminium à travers le monde. À Sangarédi, les bulldozers tournent jour et nuit. Entre emplois, espoirs et environnements meurtris, les habitants attendent que la richesse souterraine change enfin leur quotidien.',
      format: 'REPORTAGE',
      catSlug: 'economie-mines',
      coverImage: `${U}/bauxite-b.jpg`,
      coverCredit: 'Photo d’illustration : Pexels',
      seoTitle: 'Bauxite en Guinée : reportage à Sangarédi, cœur de la région de Boké',
      seoDescription:
        'Premier exportateur mondial de bauxite, la Guinée vit au rythme de la mine. Reportage à Sangarédi : emplois, comités de développement, poussière rouge et attentes des villages.',
      readingTime: 8,
      featured: true,
      tags: ['Bauxite', 'Boké', 'Minerais', 'Économie'],
      content: doc(
        p('Cinq heures du matin, Sangarédi. Avant même que le marché ne s’anime, les premiers camions de la mine amorcent leur convoi : plus de quarante tonnes de terre rouge par voyage, quatorze à la minute aux heures de pointe sur certaines plateformes de Kamsar. Ici, on ne dit pas « la mine » : on dit « la terre ». Elle fait vivre des milliers de familles, et elle les réveille à toutes les heures du jour et de la nuit.'),
        h2('Un trésor géologique hors norme'),
        p('Sous les plateaux de la région de Boké repose l’une des plus grandes réserves de bauxite de la planète. Coupée à fleur de sol, la roche se charge à ciel ouvert : un décapeur, une pelleteuse, un drapeau planté au bord de la concession. La Guinée en tire l’essentiel de ses recettes d’exportation et sa place de premier fournisseur mondial de la matière première de l’aluminium, au prix d’une dépendance quasi totale à ce minerai.'),
        p('À l’entrée des sites, les affiches ne mentent pas sur l’ambition : écoles réhabilitées, forages, dispensaires. Les compagnies — la Compagnie des Bauxites de Guinée, les consortiums présents à Kamsar et à Boffa — affichent des programmes sociaux qui changent la vie de plusieurs communes. Le personnel local, ingénieurs, conducteurs, agents de sécurité, en est le premier bénéficiaire.'),
        h2('La poussière et les promesses'),
        p('Mais à quelques kilomètres des pistes asphaltées, le discours se fait plus dur. Des villages entiers ont dû céder leurs terres les plus fertiles ; les paysans racontent des manguiers abattus, des puits asséchés, un bétail inquiet. La poussière rouge recouvre les feuilles quand la saison sèche s’installe, et les redevances tardent à se transformer en infrastructures visibles.'),
        q('« Ils exportent notre colline par cargos entiers. Nous, ce qui nous reste, c’est la poussière et l’espoir que nos enfants trouvent un travail. »'),
        p('Les comités locaux de développement, censés recevoir une part des recettes minières, sont devenus le nerf de la négociation. Quand l’argent arrive, une salle de classe sort de terre en quelques mois ; quand il tarde, les griefs s’accumulent plus vite que les pavillons. La loi minière de 2013, révisée en 2023, impose pourtant contrats de location, fonds communautaires et plans de développement local.'),
        p('Sur le port de Kamsar, la file des cargos s’étire à perte de vue. La terre rouge part vers la Chine, l’Inde, l’Europe. À Sangarédi, on suit les prix mondiaux comme une météo : quand l’aluminium grimpe, les promesses aussi. Entre les deux, il y a un chemin d’école à réparer, une saison pluvieuse à surveiller, et une génération qui voudrait voir autre chose que des camions filer vers la mer.'),
      ),
    },
  },
  {
    find: 'reforme-retraites-ce-que-contient-le-texte-vote-a-l-assemblee',
    data: {
      slug: 'dialogue-national-ce-que-contient-feuille-route-transition',
      title: 'Dialogue national : ce que contient vraiment la feuille de route de la transition',
      subtitle: 'Réconciliation, réformes, calendrier : le décryptage des engagements',
      chapo:
        'Réconciliation nationale, refondation institutionnelle, calendrier : la feuille de route issue du dialogue national fixe des objectifs ambitieux pour la Guinée. Décryptage des engagements, des zones d’ombre et des conditions d’une confiance à reconstruire.',
      format: 'ARTICLE',
      catSlug: 'politique',
      coverImage: `${U}/mosquee-conakry.jpg`,
      coverCredit: 'Le Palais du Peuple de Conakry. Photo : Trek Zone',
      seoTitle: 'Dialogue national en Guinée : ce que contient la feuille de route de la transition',
      seoDescription:
        'Réconciliation, réformes institutionnelles, calendrier : analyse des engagements du dialogue national guinéen et des conditions de leur mise en œuvre.',
      readingTime: 7,
      featured: false,
      tags: ['Transition', 'Institutions', 'Conakry'],
      content: doc(
        p('Le débat n’a pas eu lieu que dans les salles officielles : dans les radios de quartier, les taxis de Kaloum et les groupes WhatsApp de la diaspora, la feuille de route de la transition se commente, s’apprécie, se doute. Le document, issu de consultations nationales auxquelles ont participé partis, syndicats, société civile et autorités religieuses, fixe un cap. Encore faut-il le lire en entier.'),
        h2('Trois piliers, des dizaines d’engagements'),
        p('Premier pilier : la réconciliation. Commission vérité, dédommagement des victimes des crises passées, libération ou jugement des détenus d’opinion selon les engagements annoncés — le texte multiplie les signaux destinés à apaiser un climat politique longtemps empoisonné. Deuxième pilier : la réforme. Constitution, loi électorale, décentralisation : l’ossature institutionnelle doit être réécrite et soumise aux urnes. Troisième pilier : le calendrier, la partie la plus scrutée, puisque tout le reste s’y suspend.'),
        ul([
          'Une commission de suivi incluant la médiation communautaire et religieuse.',
          'Des élections locales avant les scrutins nationaux, selon la séquence annoncée.',
          'Un audit des grands contrats publics, mines en tête.',
          'La dotation de la commission électorale en moyens humains et financiers.',
        ]),
        h2('La confiance, condition de tout le reste'),
        p('Les leaders d’opinion saluent la méthode — des consultations élargies — mais réservent leur jugement sur les délais et sur le périmètre réel du dialogue. « Une feuille de route n’est qu’un papier tant que chaque étape n’a pas de date et de bilan public », résume un analyste de Conakry. La communauté internationale, CEDEAO en tête, a fait du calendrier son principal point de suivi.'),
        p('Reste le plus difficile : transformer les rendez-vous en habitudes. La Guinée a connu d’autres transitions, d’autres promesses de rupture. Cette fois, disent les organisateurs, chaque engagement sera tracé, publié, contrôlable. Le pays a pris l’habitude d’attendre ; il a aussi appris à compter.'),
      ),
    },
  },
  {
    find: 'entretien-amara-diallo-mediateur-europeen',
    data: {
      slug: 'simandou-sans-rail-le-fer-ne-vaudra-rien-entretien',
      title: '« Sans rail, Simandou ne vaudra rien » : entretien avec l’économiste Fatoumata Camara',
      subtitle: 'Infrastructure, contenu local, transformation : les conditions du succès du géant de fer',
      chapo:
        'Le plus grand gisement de fer inexploité du monde entre dans sa phase décisive. L’économiste Fatoumata Camara analyse les enjeux du projet Simandou : la bataille des infrastructures, le contenu local et le risque du « piège du minerai brut ».',
      format: 'INTERVIEW',
      catSlug: 'economie-mines',
      coverImage: `${U}/mont-nimba-2.jpg`,
      coverCredit: 'Photo d’illustration : Springs',
      seoTitle: 'Simandou : entretien avec l’économiste Fatoumata Camara sur le géant du fer guinéen',
      seoDescription:
        'Rail transguinéen, contenu local, transformation locale : l’économiste Fatoumata Camara détaille les conditions de réussite du projet de fer de Simandou.',
      readingTime: 6,
      featured: false,
      tags: ['Simandou', 'Minerais', 'Économie', 'Entretien'],
      content: doc(
        p('Guinée+, à Conakry. Fatoumata Camara dirige un cabinet d’analyse économique basé à Kaloum et enseigne à l’université Gamal Abdel Nasser. Elle décortique depuis dix ans les contrats miniers guinéens. Entretien.'),
        q('Guinée+ : Simandou est présenté comme le projet du siècle pour la Guinée. Est-ce le bon mot ?'),
        p('C’est un mot marketing, mais le potentiel est réel. Simandou contient un des plus grands gisements de fer de haute teneur au monde, et il était resté sous le sol pendant vingt ans à cause des conflits de droits et de l’absence d’infrastructure. Maintenant que les partenaires industriels sont en place et que la construction avance, on parle d’une capacité d’exportation qui peut faire doubler le poids du secteur minier dans nos exportations.'),
        q('Le rail transguinéen est au cœur du projet. Pourquoi est-il si déterminant ?'),
        p('Sans rail, Simandou ne vaudra rien : c’est un minerai lourd, dans des collines éloignées de la côte, à plus de six cents kilomètres. La bataille, c’est donc celle de la ligne fer Simandou–Conakry : sa construction, mais surtout sa gouvernance. Si le rail reste un couloir minier privé, il ne servira qu’aux cargos de minerai. S’il est ouvert, conventionné, desservi, il peut désenclaver la Haute-Guinée, faire baisser le coût du riz importé, du ciment, des engrais. C’est là que se joue la différence entre un projet minier et un projet national.'),
        q('Que conseillez-vous sur le contenu local ?'),
        p('Trois choses. Premièrement, exiger des contrats qu’ils chiffrent les embauches locales par métier et par année — sinon le contenu local reste un slogan. Deuxièmement, préparer la main-d’œuvre maintenant : soudeurs, électriciens, logisticiens ; les écoles de formation doivent être calées sur les besoins réels des chantiers. Troisièmement, viser la transformation : l’acier, pas seulement le minerai. Chaque tonne transformée sur place, c’est de la valeur, des emplois et des recettes qui restent.'),
        q('Quel risque voyez-vous en priorité ?'),
        p('Le piège du minerai brut : des recettes massives, volatiles, concentrées, qui arrivent plus vite que les institutions capables de les gérer. Le Nigeria, l’Angola, la Guinée elle-même avec la bauxite l’ont payé. Il faut une règle budgétaire claire, une visibilité publique des flux et un contrôle parlementaire solide. Le fer doit financer des écoles, des routes, des barrages — pas des comptes d’attente.'),
      ),
    },
  },
  {
    find: 'coulisses-theatre-de-la-ville-saison-tendance',
    data: {
      slug: 'fouta-djallon-trois-jours-plateaux-chateau-eau-afrique',
      title: 'Fouta Djallon : trois jours sur les plateaux du « château d’eau » de l’Afrique de l’Ouest',
      subtitle: 'De Dalaba à Labé, entre falaises, sources du Niger et reboisement',
      chapo:
        'Les hauts plateaux du Fouta Djallon donnent naissance au Niger, à la Gambie et au Sénégal : ils font vivre des centaines de millions de personnes en aval. Face à l’érosion et à la déforestation, villages et ONG replantent les crêtes. Reportage.',
      format: 'REPORTAGE',
      catSlug: 'environnement',
      coverImage: `${U}/fouta-djallon.jpg`,
      coverCredit: 'Photo : E.A.Travel',
      seoTitle: 'Fouta Djallon : reportage sur les hauts plateaux, château d’eau de l’Afrique de l’Ouest',
      seoDescription:
        'Sources du Niger, cascades de Kinkon, reboisement communautaire : trois jours de reportage dans le Fouta Djallon, la forteresse verte de la Guinée.',
      readingTime: 9,
      featured: false,
      tags: ['Fouta Djallon', 'Eau', 'Environnement'],
      content: doc(
        p('Le matin, la brume remonte des vallées comme une marée. Depuis la crête, on voit les falaises se découper une à une : le Fouta Djallon n’est pas une montagne, c’est une forteresse — un plateau de grès fendu de canyons, couvert de savanes arborées, d’orangers sauvages et de rizières suspendues. Ici naissent trois des grands fleuves d’Afrique de l’Ouest : le Niger, qui file vers le Sahel et le delta nigérian ; la Gambie et le Sénégal, qui s’élargissent vers l’Atlantique.'),
        h2('Une source qui fait vivre des millions de personnes'),
        p('Les hydrologues ont un terme : « château d’eau de l’Afrique de l’Ouest ». Les campagnes environnantes, plus concret : à Foumban, à Kinkon, à Doucky, chaque source a un nom, un gardien, une histoire. Quand la forêt de crête est coupée pour le bois ou l’agriculture, le ruissellement emporte la latérite ; les marigots deviennent boueux, les barrages en aval s’envasent. L’érosion du Fouta, ce n’est pas un problème local : c’est une facture partagée de Dakar à Lagos.'),
        h2('Replanter, mais replanter juste'),
        p('Depuis une décennie, des coopératives et des ONG relancent la restauration des crêtes : pépinières de latanier et de kinkeliba, cordons pierreux, mise en défens des sources. Les résultats se lisent sur le terrain : des bas-fonds qui gardent l’eau jusqu’en saison sèche, des vergers qui reprennent, des guépards d’histoire récemment — mais surtout des femmes moins longues à la corvée d’eau. Le défis restent énormes : coupe illégale, bétail en divagation, moyens des gardes forestiers dérisoires.'),
        p('Le soir, au campement de Kambadaga, les guides repassent la carte des sentiers : cascade du Voile de la Mariée, plateaux de Kankalabé, pont de sable de Diallabé. Le tourisme communautaire, encore balbutiant, pourrait devenir l’argument économique de la conservation — à condition que la route de Labé reste une promesse, et non un gouffre budgétaire. Le château d’eau, dit un ancien, « ne se défend pas avec des discours, mais avec des racines ».'),
      ),
    },
  },
  {
    find: 'ia-generative-vote-parlement-europeen-mesure',
    data: {
      slug: 'conakry-epreuve-croissance-trafic-dechets-grands-chantiers',
      title: 'Conakry à l’épreuve de sa croissance : trafic, déchets et grands chantiers',
      subtitle: 'Sur une péninsule exiguë, deux millions d’habitants veulent respirer',
      chapo:
        'Deux millions d’habitants entassés sur une langue de terre entre l’océan et la mangrove : la capitale guinéenne étouffe sous le trafic et les déchets, mais se transforme aussi à grands coups de voirie et de nouveaux quartiers. Enquête sur une ville en quête d’air.',
      format: 'ARTICLE',
      catSlug: 'societe',
      coverImage: `${U}/rue-conakry.jpg`,
      coverCredit: 'Photo : Bloomberg',
      seoTitle: 'Conakry, capitale sous tension : trafic, déchets et grands chantiers',
      seoDescription:
        'Congestion, gestion des déchets, nouveaux axes : enquête sur les défis urbains de Conakry, capitale guinéenne en croissance exponentielle.',
      readingTime: 7,
      featured: false,
      tags: ['Conakry', 'Urbanisation', 'Transport'],
      content: doc(
        p('À 7 h 30, le pont qui relie Kaloum au reste de la ville ressemble à un parking incliné. Motos-taxis, minibus « tokpa », camions de marchandises, voitures de fonction : tout le monde se presse vers le centre administratif, et tout le monde arrive en retard. Conakry s’est construite sur une péninsule de quelques kilomètres de large, incapable depuis longtemps d’absorber sa propre croissance.'),
        h2('Le règne des embouteillages'),
        p('Les économistes chiffrent la congestion en milliards de francs guinéens perdus chaque année : temps de travail évaporé, carburant brûlé, marchandises avariées. Les réponses viennent lentement : élargissements d’axes, feux intelligents, projets de transport en commun en site propre, désengorgement du port qui libère des emprises en plein cœur de ville. Mais chaque axe ouvert est aussitôt saturé par la vague de nouveaux véhicules d’occasion.'),
        h2('Les déchets, l’autre front'),
        p('Le deuxième combat est celui des ordures. La capitale produit chaque jour des milliers de tonnes de déchets, et le service de collecte n’en capte qu’une partie. Les décharges sauvages bordent les caniveaux ; à la saison des pluies, l’eau stagne et le choléra rôde. Des associations de quartier organisent des brigades de ramassage, des entreprises s’installent sur le recyclage du plastique ; la mairie promet une gestion déléguée plus ambitieuse.'),
        p('Entre deux embouteillages, Conakry réinvente son skyline : tours de bureaux, résidences haut de gamme au bord de la mer, réhabilitations de la corniche. La ville veut devenir la vitrine d’une Guinée qui avance. Reste à accorder les cadences : le béton monte plus vite que les égouts, et les habitants, eux, jugent sur deux critères simples — combien de temps pour rejoindre le bureau, et si l’eau coule quand on ouvre le robinet.'),
      ),
    },
  },
  {
    find: 'cantine-scolaire-un-euro-bilan-contraste',
    data: {
      slug: 'vie-chere-marche-madina-arbitrages-familles',
      title: 'Vie chère : au marché de Madina, les familles font leurs arbitrages au franc guinéen',
      subtitle: 'Riz, huile, oignon : le budget du quotidien sous tension à Conakry',
      chapo:
        'Riz, huile, oignons, transport : à Conakry, la hausse du coût de la vie dicte les menus et les budgets. Au plus grand marché de la capitale, commerçantes et consommateurs racontent une économie du quotidien sous tension.',
      format: 'ARTICLE',
      catSlug: 'societe',
      coverImage: `${U}/marche-2.jpg`,
      coverCredit: 'Photo d’illustration : Tripadvisor',
      seoTitle: 'Vie chère en Guinée : reportage au marché de Madina, à Conakry',
      seoDescription:
        'Prix du riz, du carburant, des denrées de première nécessité : au marché de Madina de Conakry, les familles guinéennes arbitrent chaque franc.',
      readingTime: 6,
      featured: false,
      tags: ['Vie chère', 'Conakry', 'Commerce'],
      content: doc(
        p('Sous les parasols du marché de Madina, les prix se crient, se négocient, se regrettent. Fatou, quarante-deux ans, trois enfants scolarisés, déroule sa liste comme un plaidoyer : un sac de riz brisé, deux litres d’huile, des oignons, un peu de poisson fumé. « L’an passé, avec vingt mille francs, je remplissais le panier. Aujourd’hui, je choisis. »'),
        h2('La facture du panier'),
        p('La Guinée importe l’essentiel de son riz et de sa farine : le panier familial dépend donc du dollar, du fret maritime et des taux de change autant que des récoltes locales. Quand la livre ster­ling ou le baht s’affole, c’est au comptoir de Madina que ça se voit. Les commerçantes, elles, se défendent : « Le camion arrive cher du port, la douane, le carburant… Nous ne faisons que transporter. »'),
        p('Les substitutions font le quotidien : riz local de la Haute-Guinée quand il est disponible, feuilles de patate à la place des haricots importés, poisson au lieu de viande. Les matrones du marché savent tout : qui a baissé d’un cran, qui a ajouté un jour de vente, quel grossiste paie cash. La vie chère ne se mesure pas seulement aux étals, mais au rythme des retraits dans les banques de quartier.'),
        h2('Riz local : la solution attendue'),
        p('La plaine du Niger, la Haute-Guinée, la mangrove de Kaback : la Guinée a des terres pour nourrir ses villes, dit-on depuis quarante ans. Les programmes de riziculture, d’engins agricoles subventionnés et de crédit rural reviennent chaque saison avec de nouvelles ambitions. À Madina, le riz de Boké et de Kandéia commence à occuper des sacs entiers. C’est le seul prix que personne ne négocie de trop loin — celui qui rapproche la Guinée de son indépendance alimentaire.'),
      ),
    },
  },
  {
    find: 'sahel-un-ete-au-fil-du-fleuve-photographe',
    data: {
      slug: 'iles-de-los-week-end-large-conakry-photographe',
      title: 'Îles de Los : un week-end au large de Conakry, en photographe',
      subtitle: 'Kassa, Roume, Souawé : carnet visuel au large de la capitale',
      chapo:
        'À quarante minutes de pirogue de la capitale, les îles de Los offrent plages, mangroves et villages de pêcheurs. Un carnet visuel entre Kassa, Roume et Souawé, loin du vacarme de Conakry.',
      format: 'PORTFOLIO',
      catSlug: 'environnement',
      coverImage: `${U}/plage-guinee.jpg`,
      coverCredit: 'Photo d’illustration : Trip.com',
      seoTitle: 'Îles de Los : carnet photo d’un week-end au large de Conakry',
      seoDescription:
        'Plages de Souawé, village de Kassa, mangroves et pirogues : portfolio photographique sur les îles de Los, joyau littoral de la Guinée.',
      readingTime: 4,
      featured: false,
      tags: ['Îles de Los', 'Tourisme', 'Littoral'],
      content: doc(
        p('Le premier samedi du mois, le quai de Boulbinet s’éveille tôt : pirogues peintes, caisses de poisson, familles avec glacières et enceintes Bluetooth. Destination : les îles de Los, l’archipel qui garde l’entrée de la baie de Conakry. Quarante minutes de mer, et le bruit de la capitale se dissout dans le clapotis.'),
        p('Kassa, la plus proche, vit de la pêche et des week-ends : grilleurs de poisson, locations de chaises, enfants arbitrant un match de foot au bord de l’eau. Plus loin, Roume garde ses maisons coloniales passées et son ancien cimetière, mémoire de l’époque où l’archipel servait de comptoir et de sanatorium.'),
        p('Le clou du voyage est à Souawé : une longue plage de sable blond adossée à des cocotiers, où l’eau s’efface par paliers. Les guides locaux y organisent snorkeling et grillades ; la mangrove, côté nord, se découvre en pirogue à marée haute, entre crabes, oiseaux et palétuviers à racines lettrées.'),
        p('Le luxe de ces îles tient à trois choses : la lumière du soir sur la baie, la fraîcheur du poisson grillé, et la lenteur. Les connaisseurs conseillent de repartir sur la pirogue de 17 h, quand le soleil bas fait de Conakry une silhouette dorée sur l’horizon — la plus belle carte postale que la capitale offre à ses visiteurs du jour.'),
      ),
    },
  },
]
