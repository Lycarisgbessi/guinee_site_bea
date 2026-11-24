# Déploiement Guinée+ — 100 % gratuit

Architecture cible : **GitHub** (code) → **Vercel** (hébergement serverless) →
**Neon** (base PostgreSQL) → **Cloudinary** (médias + CDN).

## Pourquoi cette architecture

| Contrainte plan gratuit | Réponse du projet |
|---|---|
| Neon : 1 Go de stockage | Maintenance anti-saturation quotidienne (voir §5) + widget de suivi du quota dans le dashboard |
| Neon : suspension après 5 min d'inactivité (~1 s de réveil) | Acceptable pour un média ; le cron quotidien réveille la base |
| Vercel : corps de requête ~4,5 Mo | Compression navigateur systématique + upload **direct** Cloudinary pour les gros fichiers |
| Vercel : cron limité à 1×/jour | La maintenance quotidienne suffit (rétentions ≥ 30 j) |
| Vercel : 5 000 transformations d'images/mois | Images servies par le CDN Cloudinary (`res.cloudinary.com`), pas par l'optimiseur Vercel |
| Système de fichiers serverless éphémère | Tous les médias vont chez Cloudinary (le disque local ne sert qu'au dev) |

---

## 1. Base de données — Neon (gratuit)

1. Créer un compte sur [neon.com](https://neon.com) (plan Free : 1 Go, 100 CU-heures/mois).
2. Créer un projet, par ex. `guineeplus`, région `eu-central-1` (Europe → Guinée).
3. Récupérer **les deux** chaînes de connexion (Dashboard → Connection string) :
   - `DATABASE_URL` : la chaîne **poolée** — l'hôte contient `-pooler`
   - `DIRECT_URL` : la chaîne **directe** — sans `-pooler`
4. Appliquer le schéma et migrer les données existantes :

   ```bash
   # avec les URL Neon dans .env
   npm run db:push                # crée les tables
   bun scripts/migrate-sqlite-to-neon.ts   # copie le contenu de prisma/custom.db
   ```

> **Dev local sans Neon** : `docker run -d --name guinee-postgres -e POSTGRES_PASSWORD=guinee_dev
> -e POSTGRES_DB=guinee -p 5433:5432 postgres:16-alpine` puis `docker start guinee-postgres`.
> Le `.env` local pointe déjà dessus.

## 2. Médias — Cloudinary (gratuit ~25 Go)

1. Créer un compte sur [cloudinary.com](https://cloudinary.com) (plan Free).
2. Settings → API Keys → copier l'`API Key`, l'`API Secret` et le `Cloud name`.
3. Variable d'environnement au format : `CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`

Fonctionnement (automatique, aucune action) :
- **Petites images** : compression dans le navigateur → serveur (optimisation sharp
  WebP) → Cloudinary. Dossier `guineeplus/AAAA/MM`.
- **Gros fichiers (> 4 Mo, vidéos…)** : upload **direct** navigateur → Cloudinary
  (signature demandée à `/api/admin/media/sign`), puis enregistrement en base.
  Le fichier ne transite jamais par Vercel.
- Sans `CLOUDINARY_URL` (dev), l'upload retombe sur `public/uploads` (disque local).

### Migrer les médias déjà dans public/uploads vers Cloudinary

Les fichiers existants restent servis depuis le dépôt (ils font ~9 Mo, sans
impact sur le quota Neon). Pour les déplacer chez Cloudinary plus tard :
médiathèque → les ré-importer, ou demander le script de bascule.

## 3. Code — GitHub

```bash
git remote add origin https://github.com/<compte>/guineeplus.git
git push -u origin main
```

Le repo est propre : `.env`, bases `.db` et uploads locaux sont ignorés
(`git status` doit rester vide). Un `.env.example` documente toutes les variables.

## 4. Hébergement — Vercel (Hobby, gratuit)

1. [vercel.com](https://vercel.com) → Add New Project → importer le repo GitHub.
2. Framework détecté : Next.js (aucun réglage de build à changer).
3. Variables d'environnement (Production + Preview) :

   | Variable | Valeur |
   |---|---|
   | `DATABASE_URL` | chaîne **poolée** Neon (`...-pooler...`) |
   | `DIRECT_URL` | chaîne directe Neon |
   | `AUTH_SECRET` | `openssl rand -base64 48` — **obligatoire**, sinon le login refuse de fonctionner (fail-closed) |
   | `CLOUDINARY_URL` | `cloudinary://key:secret@cloud_name` |
   | `CRON_SECRET` | `openssl rand -hex 24` — protège le cron de maintenance |

4. Deploy. Le cron `/api/cron/maintenance` est déclaré dans `vercel.json`
   (chaque nuit à 03:00 UTC).

## 5. Le système anti-saturation (cœur du projet)

Chaque nuit à 03:00 UTC (et à la demande depuis *Paramètres → Maintenance*) :

1. **Versions d'articles** : seules les 10 dernières par article sont conservées
   (chaque sauvegarde faisait une copie complète du contenu — ~350 Mo/an sinon).
2. **Journal d'activité** : purge au-delà de 90 jours.
3. **Corbeille** : suppression définitive au-delà de 30 jours.
4. **Vues quotidiennes** : les plus de 90 jours sont compressées en un agrégat
   **mensuel** par article (÷30 en taille) — les graphes du dashboard restent
   alimentés par le quotidien récent, les totaux par les compteurs.
5. **Bonus** : publication automatique des articles programmés échus.

À l'écriture : `contentText` (index de recherche) est tronqué à 5 000 caractères,
et une version n'est créée que si le contenu **ou** le titre a réellement changé.

**Suivi** : *Dashboard → Paramètres → Maintenance → Santé de la base* affiche la
taille réelle (`pg_database_size`), le % du quota Neon et passe en alerte rouge
à 70 %. Budget type : ~100-150 Mo pour des années de publication.

## 6. Comptes & identifiants de démonstration

- Connexion dashboard (données migrées de l'ancienne base) : voir avec la rédaction.
  À changer après la première connexion (Paramètres → Profil).
- En base seedée : `claire@lavigie.fr` / `admin2026`.

## 7. Dépannage rapide

| Symptôme | Cause probable |
|---|---|
| Login refuse en prod | `AUTH_SECRET` absent sur Vercel (message explicite) |
| « Import direct indisponible » | `CLOUDINARY_URL` absent/mal formé |
| Première page lente après une pause | Réveil Neon (autoscale-to-zero) — normal |
| Cron 401 | `CRON_SECRET` différent entre Vercel et l'appelant |
| Recherche ne trouve pas | (corrigé) `contains` est passé en `mode: 'insensitive'` pour PostgreSQL |
