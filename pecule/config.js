/*
 * Pécule — configuration
 * ----------------------------------------------------------
 * Laisse vide pour utiliser l'appli SANS compte (données sur l'appareil).
 * Pour activer les comptes (email + mot de passe, synchro entre appareils),
 * colle ici l'URL et la clé "anon public" de ton projet Supabase
 * (Supabase > Project Settings > API). Voir GUIDE.md.
 */
window.PECULE_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: ""
};

/*
 * AFFILIATION — chaque cours propose déjà des solutions (applis, sites).
 * Quand tu as un lien partenaire pour l'une d'elles, colle-le ici avec son nom
 * EXACT : l'appli utilisera ton lien et affichera « Lien partenaire »
 * (mention obligatoire quand tu touches une commission).
 */
window.PECULE_AFFILIATES = {
  // "LeLynx": "https://ton-lien-partenaire...",
  // "iGraal (cashback)": "https://ton-lien-de-parrainage...",
};

/* Outils supplémentaires à ajouter dans un cours (facultatif) :
 * { lesson: "abos", e: "🔗", n: "Nom", d: "Description", url: "https://...", aff: true } */
window.PECULE_TOOLS = [];
