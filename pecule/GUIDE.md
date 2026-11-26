# Pécule — mettre l'appli en ligne (guide pas à pas)

Durée : ~15 min pour GitHub, ~10 min pour les comptes (Supabase).
Tout est gratuit. Tu peux tout faire depuis ton iPhone, mais c'est plus confortable sur un ordinateur.

---

## Partie 1 — Mettre l'appli en ligne avec GitHub Pages

### 1. Préparer les fichiers
1. Télécharge `pecule.zip` (envoyé par Claude).
2. Sur iPhone : ouvre l'app **Fichiers**, touche le zip → il se décompresse dans un dossier `pecule`.

### 2. Créer ton compte GitHub
1. Va sur **github.com** → **Sign up**.
2. E-mail, mot de passe (laisse le Trousseau iCloud en proposer un et l'enregistrer), nom d'utilisateur (ex. `nathan-m`). Retiens-le : il fera partie de l'adresse de ton appli.
3. Valide le code reçu par e-mail.

### 3. Créer le dépôt
1. En haut à droite : **+** → **New repository**.
2. Nom : `pecule` · Visibilité : **Public** (obligatoire pour GitHub Pages gratuit).
3. Coche **Add a README file** → **Create repository**.

> Les données de budget ne sont PAS dans le dépôt : il ne contient que le code de l'appli. Les données restent sur ton téléphone (ou dans ton compte Supabase).

### 4. Envoyer les fichiers
1. Dans le dépôt : **Add file** → **Upload files**.
2. **Choose your files** → sélectionne **tous les fichiers** du dossier `pecule` (il n'y a pas de sous-dossier, tout est à plat ; tu peux aussi envoyer GUIDE.md et supabase.sql, ça ne gêne pas).
3. En bas : **Commit changes**.

Vérifie que tu vois bien : `index.html`, `app.js`, `app.css`, `courses.js`, `config.js`, `sw.js`, `manifest.webmanifest` et les 3 images `.png`.

### 5. Activer GitHub Pages
1. Dans le dépôt : **Settings** → **Pages** (menu de gauche).
2. Source : **Deploy from a branch** · Branch : **main** · dossier **/(root)** → **Save**.
3. Attends 1-2 minutes, recharge : l'adresse apparaît, du type
   `https://TON-PSEUDO.github.io/pecule/`

### 6. L'installer sur l'iPhone
1. Ouvre cette adresse dans **Safari**.
2. Bouton **Partager** → **Sur l'écran d'accueil** → **Ajouter**.
3. L'appli s'ouvre en plein écran, sans barre de navigateur, et marche même hors connexion.

À ce stade, l'appli fonctionne **sans compte** (données sur le téléphone). Pense à faire **Profil → Exporter** de temps en temps.

---

## Partie 2 — Activer les comptes (e-mail + mot de passe, synchro)

### 1. Créer le projet Supabase
1. Va sur **supabase.com** → **Start your project** → connecte-toi **avec GitHub** (pas de nouveau mot de passe à retenir).
2. **New project** · Nom : `pecule` · Database password : clique **Generate** (tu n'en auras pas besoin ensuite) · Région : **West EU (Paris)** ou proche → **Create**.
3. Attends ~2 minutes que le projet soit prêt.

### 2. Créer la table
1. Menu de gauche : **SQL Editor** → **New query**.
2. Copie-colle tout le contenu de `supabase.sql` → **Run**. Tu dois voir « Success ».

### 3. Régler l'adresse de l'appli
1. **Authentication** → **URL Configuration**.
2. **Site URL** : colle `https://TON-PSEUDO.github.io/pecule/`
3. **Redirect URLs** : ajoute la même adresse → **Save**.

### 4. Récupérer les 2 clés
1. **Project Settings** (roue crantée) → **API** (ou **Data API / API Keys**).
2. Copie **Project URL** (`https://xxxx.supabase.co`) et la clé **anon public** (longue clé qui commence souvent par `eyJ`, ou une « publishable key »).
   ⚠️ Ne prends jamais la clé `service_role` / secret.

### 5. Les coller dans l'appli
1. Sur GitHub, ouvre `config.js` → icône crayon ✏️ (Edit).
2. Remplis :
   ```js
   supabaseUrl: "https://xxxx.supabase.co",
   supabaseAnonKey: "ta-clé-anon-public"
   ```
3. **Commit changes**. Attends 1-2 minutes, puis recharge l'appli.

Au prochain lancement, Pécule propose **Connexion / Créer un compte**. Chaque utilisateur a ses propres données, synchronisées sur tous ses appareils. Ce que tu avais rentré sans compte est récupéré automatiquement à ta première connexion.

> La clé « anon public » peut être visible dans le code : c'est prévu comme ça. La sécurité vient des règles de la table (`supabase.sql`) : chacun ne peut lire et modifier que ses propres données.

---

## Mettre à jour l'appli plus tard
Quand Claude te donne une nouvelle version : sur GitHub, **Add file → Upload files**, renvoie les fichiers modifiés (ils remplacent les anciens), **Commit**. L'appli se met à jour toute seule à la prochaine ouverture avec du réseau.

## En cas de souci
- Page 404 : vérifie que `index.html` est bien à la racine du dépôt et que Pages est activé sur `main / (root)`.
- « E-mail non confirmé » : clique le lien reçu (regarde les spams).
- Le micro ne marche pas : utilise le champ texte + le 🎤 du clavier iPhone, ça fait pareil.
