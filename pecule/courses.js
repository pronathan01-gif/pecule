/* Pécule — cours & lecteur "motion design" */
(function(){
"use strict";

const L = [
{
  id:"pay-first", tools:[{"e": "🏦", "n": "Ton appli bancaire", "d": "Onglet virements → « virement permanent » le jour de ta paie, vers ton livret.", "url": ""},{"e": "📘", "n": "Mes Questions d'Argent", "d": "Le site officiel de la Banque de France pour apprendre à gérer son budget, gratuit.", "url": "https://www.mesquestionsdargent.fr/"}], e:"💸", c1:"#11c08a", c2:"#0a5b7a", title:"Paye-toi en premier", min:3,
  scenes:[
    {cap:"Le piège classique", sub:"Tu dépenses… et tu épargnes ce qui reste", v:{t:"emoji",e:"🫠"}},
    {cap:"Résultat : il ne reste jamais rien", v:{t:"bars",items:[{l:"Paie",v:100},{l:"J+10",v:55},{l:"J+20",v:20},{l:"Fin",v:3}]}},
    {cap:"La bonne méthode", sub:"Le jour de la paie, l'épargne part EN PREMIER", v:{t:"list",items:["1️⃣ Paie reçue","2️⃣ Virement épargne auto","3️⃣ Le reste = ton budget"]}},
    {cap:"Même 50 € par mois…", sub:"…ça fait 600 € en un an, sans y penser", v:{t:"num",from:0,to:600,suffix:" €"}},
    {cap:"Automatise, et oublie", v:{t:"coins",e:"🏦"}}
  ],
  body:`<p>La plupart des gens dépensent pendant le mois et espèrent qu'il restera quelque chose à épargner à la fin. Il ne reste presque jamais rien : les dépenses s'adaptent toujours à l'argent disponible.</p>
<p>La solution : <b>inverser l'ordre</b>. Le jour où ta paie tombe, une somme part automatiquement vers ton épargne. Tu vis ensuite avec ce qui reste, comme si l'épargne n'existait pas.</p>
<ul><li>Programme un <b>virement permanent</b> vers ton livret le jour de la paie (ou le lendemain).</li>
<li>Commence petit si besoin : 5 % de ta paie, puis augmente de 1 % tous les 2-3 mois.</li>
<li>Utilise Pécule : quand tu rentres ta paie, l'épargne est calculée avant ton budget « pour toi ».</li></ul>`,
  tips:["Créer un virement automatique le jour de la paie","Fixer un montant de départ, même petit","Prévoir d'augmenter ce montant dans 3 mois"]
},
{
  id:"503020", tools:[{"e": "📘", "n": "Mes Questions d'Argent", "d": "Fiches et outils gratuits de la Banque de France pour construire ton budget.", "url": "https://www.mesquestionsdargent.fr/"}], e:"🥧", c1:"#6d5dfc", c2:"#2b1f7a", title:"La règle 50/30/20", min:3,
  scenes:[
    {cap:"Une règle simple pour tout ranger", v:{t:"emoji",e:"🥧"}},
    {cap:"50 % pour les besoins", sub:"Logement, transport, assurances, courses", v:{t:"bars",items:[{l:"Besoins",v:50}]}},
    {cap:"30 % pour les envies", sub:"Sorties, loisirs, shopping", v:{t:"bars",items:[{l:"Besoins",v:50},{l:"Envies",v:30}]}},
    {cap:"20 % pour l'épargne", sub:"Et les projets", v:{t:"bars",items:[{l:"Besoins",v:50},{l:"Envies",v:30},{l:"Épargne",v:20}]}},
    {cap:"Adapte-la à ta vie", sub:"Chez tes parents ? Vise plutôt 30 % d'épargne", v:{t:"emoji",e:"🎯"}}
  ],
  body:`<p>La règle 50/30/20 découpe ton revenu net en trois parts : <b>50 % pour les besoins</b> (ce que tu dois payer quoi qu'il arrive), <b>30 % pour les envies</b> et <b>20 % pour l'épargne</b>.</p>
<p>Ce n'est pas une loi : c'est un repère. Si tu as peu de charges (logé chez tes parents, par exemple), monte l'épargne à 30-40 % : c'est le meilleur moment de ta vie pour mettre de côté.</p>
<ul><li>Additionne tes charges fixes dans Profil : tu vois tout de suite ta part « besoins ».</li>
<li>Si tes besoins dépassent 60 %, c'est là qu'il faut chercher des économies en priorité (assurance, forfait, abonnements).</li></ul>`,
  tips:["Calculer mes 3 parts avec mon salaire","Vérifier si mes besoins dépassent 50-60 %","Choisir mon pourcentage d'épargne"]
},
{
  id:"urgence", tools:[{"e": "🏦", "n": "Un livret réglementé", "d": "Ouvrable dans n'importe quelle banque, disponible à tout moment, sans risque.", "url": ""},{"e": "📘", "n": "Mes Questions d'Argent · épargne", "d": "Comprendre les livrets et l'épargne de précaution.", "url": "https://www.mesquestionsdargent.fr/"}], e:"🛟", c1:"#0ea5e9", c2:"#0b3b66", title:"Le fonds d'urgence", min:3,
  scenes:[
    {cap:"La voiture tombe en panne", sub:"800 € de réparation, imprévu", v:{t:"emoji",e:"🚗💥"}},
    {cap:"Sans réserve…", sub:"Découvert, crédit, stress", v:{t:"emoji",e:"😰"}},
    {cap:"Avec un fonds d'urgence", sub:"Tu paies, tu respires", v:{t:"emoji",e:"😌"}},
    {cap:"Objectif : 3 à 6 mois de dépenses", v:{t:"num",from:0,to:3,suffix:" mois"}},
    {cap:"Sur un livret dispo à tout moment", sub:"Pas en bourse, pas bloqué", v:{t:"coins",e:"🛟"}}
  ],
  body:`<p>Le fonds d'urgence, c'est l'argent qui sert <b>uniquement aux imprévus</b> : panne, frais médicaux, perte de revenu. Il évite de finir à découvert ou de prendre un crédit au pire moment.</p>
<ul><li><b>Objectif</b> : 3 mois de dépenses pour commencer, 6 mois idéalement.</li>
<li><b>Où</b> : un livret d'épargne réglementé, disponible à tout moment, sans risque.</li>
<li><b>Règle d'or</b> : on n'y touche pas pour des vacances. Si tu l'utilises, tu le reconstitues en priorité.</li></ul>
<p>Dans Pécule, crée un pot « Fonds d'urgence » avec un objectif : la barre te montre où tu en es.</p>`,
  tips:["Calculer 3 mois de mes dépenses","Créer un pot Fonds d'urgence avec cet objectif","L'alimenter avant les pots plaisir"]
},
{
  id:"abos", tools:[{"e": "📱", "n": "Abonnements de ton iPhone", "d": "Réglages → ton nom → Abonnements : tout ce qui passe par Apple, résiliable en 2 touches.", "url": ""},{"e": "📶", "n": "Comparateur forfaits & box (Selectra)", "d": "Compare les forfaits mobile et box internet du moment.", "url": "https://selectra.info/telecom/comparateur/forfaits-mobile"},{"e": "📶", "n": "Alloforfait", "d": "Comparateur télécom indépendant : forfaits mobile et box.", "url": "https://www.alloforfait.fr/"},{"e": "✂️", "n": "Résilier.fr", "d": "Guides et modèles pour résilier n'importe quel abonnement.", "url": "https://resilier.fr/abonnement-app-store-google-play.php"}], e:"🔁", c1:"#f97316", c2:"#7a2a0b", title:"La chasse aux abonnements", min:3,
  scenes:[
    {cap:"10 € par-ci, 13 € par-là…", v:{t:"list",items:["🎬 Streaming 13 €","🎵 Musique 11 €","📦 Livraison 7 €","🏋️ Salle 30 €"]}},
    {cap:"Ça fait vite beaucoup", v:{t:"num",from:0,to:61,suffix:" €/mois"}},
    {cap:"Soit, sur un an…", v:{t:"num",from:0,to:732,suffix:" €"}},
    {cap:"Garde ce que tu utilises VRAIMENT", sub:"Résilie le reste, quitte à reprendre plus tard", v:{t:"emoji",e:"✂️"}}
  ],
  body:`<p>Les abonnements sont les dépenses les plus sournoises : petites, automatiques, oubliées. Fais un <b>audit une fois par trimestre</b>.</p>
<ul><li>Ouvre tes 3 derniers relevés bancaires et liste tout ce qui revient chaque mois.</li>
<li>Pour chaque abonnement : « Est-ce que je l'ai utilisé ces 2 dernières semaines ? » Si non, résilie.</li>
<li>Fais tourner tes plateformes de streaming : une seule à la fois, tu changes quand tu as fini tes séries.</li>
<li>Renégocie ton forfait mobile et ta box : les offres changent souvent, une simple comparaison peut diviser la facture.</li>
<li>Sur iPhone : Réglages > ton nom > Abonnements, pour voir ceux payés via Apple.</li></ul>`,
  tips:["Lister tous mes prélèvements mensuels","Résilier au moins 1 abonnement inutile","Comparer mon forfait mobile"]
},
{
  id:"72h", tools:[{"e": "📝", "n": "Ta liste d'envies", "d": "Crée une note « Envies » : tu y mets l'article et la date, tu relis 3 jours après.", "url": ""},{"e": "📧", "n": "Moins de tentations", "d": "Désabonne-toi des newsletters promo (lien « se désinscrire » en bas des e-mails) et coupe les notifications des applis de shopping.", "url": ""}], e:"⏳", c1:"#ec4899", c2:"#6b0f3a", title:"La règle des 72 heures", min:2,
  scenes:[
    {cap:"Coup de cœur sur un truc à 120 €", v:{t:"emoji",e:"😍🛍️"}},
    {cap:"Stop. Attends 72 heures.", v:{t:"num",from:72,to:0,suffix:" h"}},
    {cap:"3 jours plus tard…", sub:"L'envie est souvent passée", v:{t:"emoji",e:"🤷"}},
    {cap:"Calcule en heures de travail", sub:"120 € ≈ 12 h de boulot. Ça les vaut ?", v:{t:"vs",a:{l:"Prix",v:"120 €"},b:{l:"Ton temps",v:"12 h"},win:"b"}}
  ],
  body:`<p>La plupart des achats impulsifs sont des achats émotionnels. La règle : pour tout achat non prévu au-dessus d'un certain montant (par exemple 30 €), <b>attends 72 heures</b>. Si tu en as encore envie après, et que ton budget le permet, achète-le sans culpabiliser.</p>
<ul><li>Mets l'article dans une liste d'envies plutôt que dans le panier.</li>
<li>Convertis le prix en <b>heures de travail</b> : prix ÷ ton salaire horaire net.</li>
<li>Désactive les notifications des applis de shopping et désinscris-toi des newsletters promo.</li>
<li>Ne garde pas ta carte enregistrée sur les sites : la friction t'aide.</li></ul>`,
  tips:["Fixer mon seuil d'achat réfléchi","Supprimer ma carte des sites de shopping","Me désabonner des newsletters promo"]
},
{
  id:"courses", tools:[{"e": "🥡", "n": "Too Good To Go", "d": "Des paniers d'invendus de boulangeries, supermarchés et restos à petit prix.", "url": "https://www.toogoodtogo.com/fr"},{"e": "🥕", "n": "Phenix", "d": "Appli anti-gaspi : paniers d'invendus près de chez toi.", "url": "https://www.wearephenix.com/"},{"e": "💸", "n": "iGraal (cashback)", "d": "Récupère un pourcentage de tes achats en ligne en passant par leur site.", "url": "https://fr.igraal.com/"}], e:"🛒", c1:"#22c55e", c2:"#14532d", title:"Courses malines", min:3,
  scenes:[
    {cap:"Les courses sans liste", v:{t:"emoji",e:"🛒😵"}},
    {cap:"Avec une liste et un repas planifié", v:{t:"vs",a:{l:"Sans liste",v:"85 €"},b:{l:"Avec liste",v:"60 €"},win:"b"}},
    {cap:"Les 4 réflexes", v:{t:"list",items:["📝 Une liste, rien d'autre","🍽️ Jamais le ventre vide","⚖️ Le prix au kilo","🏷️ Marques distributeur"]}},
    {cap:"Et la gamelle au boulot", sub:"Au lieu de 10 € le midi", v:{t:"num",from:0,to:150,suffix:" €/mois"}}
  ],
  body:`<p>L'alimentation est un des postes où l'on peut économiser le plus sans se priver.</p>
<ul><li><b>Planifie</b> 4-5 repas pour la semaine et fais une liste. Tiens-t'en à la liste.</li>
<li>Ne fais jamais les courses le ventre vide.</li>
<li>Compare le <b>prix au kilo</b> (petite ligne sur l'étiquette), pas le prix du paquet.</li>
<li>Les marques distributeur sont souvent fabriquées dans les mêmes usines.</li>
<li>Cuisine en grande quantité et prends ta <b>gamelle</b> : 10 € de sandwich par jour, c'est environ 200 € par mois.</li>
<li>Applis anti-gaspi (paniers d'invendus) : de bons produits à petit prix.</li></ul>`,
  tips:["Planifier mes repas de la semaine","Faire ma liste avant d'y aller","Préparer ma gamelle 3 jours par semaine"]
},
{
  id:"voiture", tools:[{"e": "⛽", "n": "Prix des carburants (officiel)", "d": "Le site du gouvernement : toutes les stations et leurs prix près de chez toi. Applis aussi pratiques : Gasoil Now, Essence&CO, SLMC (App Store).", "url": "https://www.prix-carburants.gouv.fr/"},{"e": "🚗", "n": "BlaBlaCar", "d": "Covoiturage : partage les frais sur tes trajets réguliers ou longs.", "url": "https://www.blablacar.fr/"},{"e": "🛡️", "n": "LeLynx", "d": "Comparateur d'assurance auto : des devis en quelques minutes.", "url": "https://www.lelynx.fr/"},{"e": "🛡️", "n": "LesFurets", "d": "Autre comparateur d'assurance auto, pour croiser les devis.", "url": "https://www.lesfurets.com/"}], e:"🚗", c1:"#64748b", c2:"#1e293b", title:"Rouler moins cher", min:3,
  scenes:[
    {cap:"La voiture, un gouffre discret", v:{t:"list",items:["⛽ Carburant","🛡️ Assurance","🔧 Entretien","💳 Crédit"]}},
    {cap:"Conduite souple", sub:"Anticiper, moins accélérer", v:{t:"num",from:0,to:15,suffix:" % d'économie"}},
    {cap:"Pneus bien gonflés", sub:"Moins de conso, plus de sécurité", v:{t:"emoji",e:"🛞"}},
    {cap:"Compare le prix à la pompe", sub:"L'écart entre stations peut être énorme", v:{t:"vs",a:{l:"Station A",v:"1,89"},b:{l:"Station B",v:"1,72"},win:"b"}},
    {cap:"Remets ton assurance en concurrence", sub:"Chaque année", v:{t:"emoji",e:"🔄"}}
  ],
  body:`<p>Entre carburant, assurance, entretien et crédit, la voiture est souvent le 2e poste de dépense.</p>
<ul><li><b>Éco-conduite</b> : accélérations douces, anticipation, frein moteur, vitesse stable. C'est jusqu'à 10-15 % de carburant en moins.</li>
<li>Vérifie la <b>pression des pneus</b> une fois par mois.</li>
<li>Compare les prix des stations (site officiel prix-carburants.gouv.fr ou applis), les grandes surfaces sont souvent moins chères.</li>
<li>Après un an de contrat, tu peux <b>changer d'assurance auto</b> facilement : demande des devis chaque année.</li>
<li>Covoiturage pour les trajets réguliers : les frais se partagent.</li></ul>`,
  tips:["Vérifier la pression de mes pneus","Comparer 3 devis d'assurance","Repérer la station la moins chère sur mon trajet"]
},
{
  id:"credit", tools:[{"e": "📘", "n": "Mes Questions d'Argent · crédit", "d": "Comprendre le TAEG, le coût d'un crédit et éviter le surendettement (Banque de France).", "url": "https://www.mesquestionsdargent.fr/"},{"e": "🤝", "n": "Points Conseil Budget", "d": "Accompagnement gratuit si les fins de mois deviennent difficiles : la carte est sur Mes Questions d'Argent.", "url": "https://www.mesquestionsdargent.fr/"}], e:"🧨", c1:"#ef4444", c2:"#5b0d0d", title:"Les pièges du crédit", min:3,
  scenes:[
    {cap:"« Payez en 4 fois sans frais »", v:{t:"emoji",e:"🪤"}},
    {cap:"Facile… et ça s'additionne", v:{t:"list",items:["📱 Tel : 4 × 30 €","👟 Baskets : 3 × 40 €","🎮 Jeu : 4 × 20 €"]}},
    {cap:"Le crédit renouvelable", sub:"Des taux parmi les plus chers", v:{t:"emoji",e:"🔥"}},
    {cap:"La règle", sub:"Si tu ne peux pas le payer cash, tu ne peux pas te l'offrir (sauf logement)", v:{t:"emoji",e:"✋"}}
  ],
  body:`<p>Le crédit n'est pas un mal en soi (immobilier, voiture nécessaire au travail), mais certaines formes sont de vrais pièges.</p>
<ul><li><b>Paiement fractionné</b> (3x, 4x) : indolore sur le moment, mais plusieurs en parallèle mangent ton budget des mois suivants.</li>
<li><b>Crédit renouvelable</b> (cartes de magasin, « réserve d'argent ») : taux très élevés, à éviter.</li>
<li><b>Découvert</b> : les agios et frais d'incident coûtent cher. Ton fonds d'urgence est là pour l'éviter.</li>
<li>Avant tout crédit, regarde le <b>coût total</b> (TAEG et montant total remboursé), pas seulement la mensualité.</li></ul>`,
  tips:["Lister mes paiements fractionnés en cours","Refuser les cartes de crédit de magasin","Vérifier le coût total de mes crédits"]
},
{
  id:"placements", tools:[{"e": "🏛️", "n": "Service-public.fr", "d": "Règles et plafonds officiels des livrets, PEL, PEA et assurance vie.", "url": "https://www.service-public.fr/"},{"e": "🏛️", "n": "AMF (Autorité des marchés financiers)", "d": "Le gendarme de la bourse : guides pour débutants et listes noires des arnaques.", "url": "https://www.amf-france.org/"},{"e": "📘", "n": "Mes Questions d'Argent · épargne", "d": "Choisir son épargne selon ses projets.", "url": "https://www.mesquestionsdargent.fr/"}], e:"🏦", c1:"#0d9488", c2:"#083344", title:"Où ranger son épargne", min:4,
  scenes:[
    {cap:"Chaque argent a sa place", v:{t:"emoji",e:"🗂️"}},
    {cap:"Court terme : dispo tout de suite", sub:"Imprévus, projets < 2 ans", v:{t:"list",items:["🛟 Livrets réglementés","💶 Disponible, sans risque"]}},
    {cap:"Moyen terme : projets", sub:"Logement, gros achat", v:{t:"list",items:["🏠 PEL","📅 Argent bloqué un temps"]}},
    {cap:"Long terme : faire fructifier", sub:"5 ans et plus", v:{t:"list",items:["📈 PEA (actions)","🧾 Assurance vie"]}},
    {cap:"Plus c'est long, plus le temps travaille", v:{t:"bars",items:[{l:"1 an",v:20},{l:"5 ans",v:45},{l:"10 ans",v:70},{l:"20 ans",v:100}]}}
  ],
  body:`<p>Avant d'investir, range ton argent par <b>horizon</b> : quand en auras-tu besoin ?</p>
<ul><li><b>Moins de 2 ans</b> (fonds d'urgence, vacances) : livrets réglementés. Disponibles et sans risque, mais rendement modeste.</li>
<li><b>Projet immobilier</b> : le PEL peut avoir du sens, mais l'argent y est moins disponible.</li>
<li><b>Plus de 5 ans</b> : le PEA (actions européennes ou ETF éligibles) et l'assurance vie offrent des avantages fiscaux avec le temps. Ils comportent un <b>risque de perte</b> : n'y mets que de l'argent dont tu n'as pas besoin avant longtemps.</li>
<li>Investir un peu chaque mois (versements programmés) lisse les hauts et les bas des marchés.</li></ul>
<p class="muted small">Les taux et règles fiscales évoluent : vérifie-les sur service-public.fr ou auprès de ta banque. Ceci n'est pas un conseil financier personnalisé.</p>`,
  tips:["Classer mes pots par horizon","Avoir mon fonds d'urgence avant d'investir","Me renseigner sur les frais avant d'ouvrir un compte"]
},
{
  id:"defis", tools:[{"e": "🪙", "n": "Un pot « Défi » dans Pécule", "d": "Crée un pot dédié et ajoute-y chaque victoire avec 🎙️ « +10 défi ».", "url": ""}], e:"🏆", c1:"#eab308", c2:"#713f12", title:"Défis pour épargner", min:2,
  scenes:[
    {cap:"Rends l'épargne fun", v:{t:"emoji",e:"🎮"}},
    {cap:"Semaine à 0 €", sub:"Aucune dépense non essentielle pendant 7 jours", v:{t:"num",from:7,to:0,suffix:" jours"}},
    {cap:"Le défi des 52 semaines", sub:"1 € la semaine 1, 2 € la semaine 2…", v:{t:"num",from:0,to:1378,suffix:" €"}},
    {cap:"Le bocal des pièces", sub:"Toutes tes pièces de 1 et 2 € y passent", v:{t:"coins",e:"🫙"}}
  ],
  body:`<p>Transformer l'épargne en jeu aide à tenir dans la durée.</p>
<ul><li><b>Semaine à 0 €</b> : pendant 7 jours, aucune dépense en dehors de l'essentiel (courses prévues, carburant). Note dans Pécule tout ce que tu as évité d'acheter.</li>
<li><b>52 semaines</b> : semaine 1 tu mets 1 €, semaine 2 tu mets 2 €… semaine 52 tu mets 52 €. Total : 1 378 € sur l'année.</li>
<li><b>Arrondi</b> : chaque dépense arrondie à l'euro supérieur, la différence part dans un pot.</li>
<li><b>Bocal</b> : toutes tes pièces de 1 € et 2 € finissent dans un bocal, versé chaque mois sur ton livret.</li></ul>`,
  tips:["Choisir un défi et la date de départ","Créer un pot dédié au défi","Me dire le résultat à la fin 😉"]
},
{
  id:"gagner", tools:[{"e": "👕", "n": "Vinted", "d": "Revends vêtements, jeux, objets.", "url": "https://www.vinted.fr/"},{"e": "📦", "n": "Leboncoin", "d": "Revends tout ce qui dort chez toi, même le matériel.", "url": "https://www.leboncoin.fr/"},{"e": "📱", "n": "Back Market", "d": "Fais reprendre tes vieux téléphones et appareils.", "url": "https://www.backmarket.fr/"},{"e": "🎓", "n": "Superprof", "d": "Donne des cours dans ce que tu maîtrises.", "url": "https://www.superprof.fr/"},{"e": "💼", "n": "Malt", "d": "Propose tes compétences en freelance.", "url": "https://www.malt.fr/"},{"e": "📝", "n": "Urssaf auto-entrepreneur", "d": "Le site officiel pour créer ton statut quand ça devient régulier.", "url": "https://www.autoentrepreneur.urssaf.fr/"}], e:"➕", c1:"#8b5cf6", c2:"#3b0764", title:"Gagner un peu plus", min:3,
  scenes:[
    {cap:"Économiser a une limite", sub:"Gagner plus, non", v:{t:"emoji",e:"🚀"}},
    {cap:"Revends ce qui dort", v:{t:"list",items:["👕 Vêtements","🎮 Jeux & consoles","📱 Vieux téléphones","🔧 Matériel"]}},
    {cap:"Valorise ce que tu sais faire", sub:"Petits services, cours, réparations", v:{t:"emoji",e:"🧰"}},
    {cap:"Chaque euro gagné va dans un pot", sub:"Pas dans les dépenses", v:{t:"coins",e:"💰"}}
  ],
  body:`<p>Une fois les économies faites, le levier le plus puissant est d'augmenter tes revenus.</p>
<ul><li><b>Revendre</b> ce que tu n'utilises plus sur les plateformes d'occasion : un tri de placard rapporte souvent plus qu'on ne croit.</li>
<li><b>Tes compétences</b> : bricolage, mécanique, cours particuliers, montage vidéo, création de contenu… commence petit, avec ton entourage.</li>
<li><b>Ton passe-temps</b> peut devenir une source de revenus (contenu, fabrication artisanale), mais teste la demande avant d'investir.</li>
<li>Renseigne-toi sur le statut adapté (par exemple micro-entrepreneur) dès que ça devient régulier.</li>
<li>Règle d'or : chaque euro gagné en plus part dans un pot d'épargne ou de projet, pas dans tes dépenses courantes.</li></ul>`,
  tips:["Lister 5 objets à revendre","Noter 3 compétences que je pourrais proposer","Créer un pot « Revenus en plus »"]
}
];

/* ---------- Lecteur motion design ---------- */
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function visual(v){
  if(!v)return "";
  if(v.t==="emoji")return `<div class="v-emoji a-pop">${esc(v.e)}</div>`;
  if(v.t==="num")return `<div class="v-num a-pop" data-from="${v.from}" data-to="${v.to}" data-suf="${esc(v.suffix||"")}">${v.from}${esc(v.suffix||"")}</div>`;
  if(v.t==="bars"){const m=Math.max(...v.items.map(i=>i.v));return `<div class="v-bars">${v.items.map((i,k)=>`<div class="b"><span class="a-fade" style="animation-delay:${.3+k*.15}s">${i.v}${m===100&&v.items.length<=3?" %":""}</span><i style="height:${i.v/m*78}%;animation-delay:${k*.15}s"></i><span style="margin-top:6px">${esc(i.l)}</span></div>`).join("")}</div>`;}
  if(v.t==="list")return `<div class="v-list">${v.items.map((i,k)=>`<div class="a-up" style="animation-delay:${k*.35}s">${esc(i)}</div>`).join("")}</div>`;
  if(v.t==="vs")return `<div class="v-vs"><div class="a-up ${v.win==="a"?"win":""}">${esc(v.a.l)}<b>${esc(v.a.v)}</b></div><div class="a-up ${v.win==="b"?"win":""}" style="animation-delay:.4s">${esc(v.b.l)}<b>${esc(v.b.v)}</b></div></div>`;
  if(v.t==="coins"){let c="";for(let i=0;i<7;i++)c+=`<span class="coin" style="left:${18+i*10}%;top:40%;animation-delay:${i*.25}s">🪙</span>`;return `<div class="v-emoji a-pop" style="position:relative;z-index:2">${esc(v.e)}</div>${c}`;}
  return "";
}
function Player(el,lesson){
  const DUR=4200;let i=0,t0=0,elapsed=0,paused=false,raf=0,alive=true;
  el.style.setProperty("--c1",lesson.c1);el.style.setProperty("--c2",lesson.c2);
  el.innerHTML=`<span class="blob" style="width:160px;height:160px;left:-40px;bottom:-50px"></span><span class="blob" style="width:110px;height:110px;right:-20px;top:30px;animation-delay:-3s"></span>
   <div class="segs">${lesson.scenes.map(()=>"<i><b></b></i>").join("")}</div><div class="stage"></div><div class="paused">▶︎</div>`;
  const stage=el.querySelector(".stage"),bars=[...el.querySelectorAll(".segs b")];
  function show(k){
    i=k;const s=lesson.scenes[k];
    stage.innerHTML=`<div class="vis">${visual(s.v)}</div><div class="cap a-up">${esc(s.cap)}</div>${s.sub?`<div class="cap2 a-up" style="animation-delay:.15s">${esc(s.sub)}</div>`:""}`;
    bars.forEach((b,j)=>b.style.width=j<k?"100%":"0");
    const n=stage.querySelector(".v-num");
    if(n){const f=+n.dataset.from,to=+n.dataset.to,suf=n.dataset.suf,st=performance.now();
      const step=now=>{if(!alive)return;const p=Math.min(1,(now-st)/1400),e=1-Math.pow(1-p,3);n.textContent=Math.round(f+(to-f)*e).toLocaleString("fr-FR")+suf;if(p<1)requestAnimationFrame(step);};requestAnimationFrame(step);}
    elapsed=0;t0=performance.now();
  }
  function tick(now){
    if(!alive)return;
    if(!paused){
      const p=Math.min(1,(elapsed+(now-t0))/DUR);bars[i].style.width=(p*100)+"%";
      if(p>=1){if(i<lesson.scenes.length-1)show(i+1);else{paused=true;el.classList.add("is-paused");el.querySelector(".paused").textContent="↻";}}
    }
    raf=requestAnimationFrame(tick);
  }
  el.onclick=()=>{
    if(paused){
      if(el.querySelector(".paused").textContent==="↻"){el.querySelector(".paused").textContent="▶︎";show(0);}
      else t0=performance.now();
      paused=false;el.classList.remove("is-paused");
    }else{elapsed+=performance.now()-t0;paused=true;el.classList.add("is-paused");}
  };
  show(0);raf=requestAnimationFrame(tick);
  return{stop(){alive=false;cancelAnimationFrame(raf);}};
}

window.PECULE_COURSES={list:L,Player};
})();
