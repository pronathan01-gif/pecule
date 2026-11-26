/*
 * Pécule — configuration
 * ----------------------------------------------------------
 * Laisse vide pour utiliser l'appli SANS compte (données sur l'appareil).
 * Pour activer les comptes (email + mot de passe, synchro entre appareils),
 * colle ici l'URL et la clé "anon public" de ton projet Supabase
 * (Supabase > Project Settings > API). Voir GUIDE.md.
 */
window.PECULE_CONFIG = {
  supabaseUrl: "https://avpwsuyxwseixbtupffl.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2cHdzdXl4d3NlaXhidHVwZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU3MDc1MzEsImV4cCI6MjExMTI4MzUzMX0.beJE6QSX6jhGDJaRYjMUHS0o2C8khqkai5k0TP2zP_g"
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
