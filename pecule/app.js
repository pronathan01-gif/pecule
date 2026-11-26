/* Pécule — appli de budget
 * Données : localStorage (toujours) + Supabase (si configuré dans js/config.js)
 */
(function(){
"use strict";

/* ================= Utilitaires ================= */
const $=s=>document.querySelector(s);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clone=o=>JSON.parse(JSON.stringify(o));
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=v=>{const x=parseFloat(String(v==null?"":v).replace(/[\s  €]/g,"").replace(",","."));return isFinite(x)?x:0};
const fmt=n=>{const v=Math.round((Number(n)||0)*100)/100;const d=Math.abs(v%1)>0.004?2:0;return v.toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d})+" €"};
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9+\-., ]/g," ").replace(/\s+/g," ").trim();
const ymKey=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
const keyOffset=n=>{const d=new Date();return ymKey(new Date(d.getFullYear(),d.getMonth()+n,1))};
const monthName=k=>{const[y,m]=k.split("-").map(Number);const s=new Date(y,m-1,1).toLocaleDateString("fr-FR",{month:"long",year:"numeric"});return s.charAt(0).toUpperCase()+s.slice(1)};
const COURSES=window.PECULE_COURSES||{list:[],Player:null};

const CATS=[
  {id:"sorties",e:"🍻",n:"Sorties",syn:["sortie","bar","resto","restaurant","soiree","boite","verre"]},
  {id:"bouffe",e:"🍔",n:"Bouffe",syn:["manger","repas","kebab","burger","mcdo","snack","fast food","dejeuner","diner","pizza"]},
  {id:"courses",e:"🛒",n:"Courses",syn:["course","supermarche","carrefour","leclerc","lidl","auchan"]},
  {id:"transport",e:"⛽",n:"Transport",syn:["essence","carburant","plein","gasoil","peage","train","bus","uber","parking","total","totalenergies","esso","shell","avia","station","sncf","ratp"]},
  {id:"shopping",e:"🛍️",n:"Shopping",syn:["vetement","vetements","habits","amazon","achat"]},
  {id:"loisirs",e:"🎮",n:"Loisirs",syn:["loisir","jeu","jeux","cinema","peche","sport","concert"]},
  {id:"sante",e:"💊",n:"Santé",syn:["pharmacie","medecin","docteur","dentiste"]},
  {id:"autre",e:"✨",n:"Autre",syn:[]}
];
const INC=[
  {id:"salaire",e:"💼",n:"Salaire",syn:["salaire","paie","paye"]},
  {id:"business",e:"🚀",n:"Business",syn:["business","client","clients","freelance","mission","facture","prestation","commande"]},
  {id:"vente",e:"🏷️",n:"Vente",syn:["vente","vendu","revente","vinted","leboncoin"]},
  {id:"cadeau",e:"🎁",n:"Cadeau",syn:["cadeau","anniversaire","noel","etrennes"]},
  {id:"remb",e:"↩️",n:"Remboursement",syn:["remboursement","rembourse","secu","mutuelle"]},
  {id:"aide",e:"🏛️",n:"Aides & primes",syn:["aide","caf","apl","prime","bourse"]},
  {id:"autre",e:"✨",n:"Autre",syn:[]}
];
const incOf=id=>INC.find(c=>c.id===id)||INC[INC.length-1];
const catOf=id=>CATS.find(c=>c.id===id)||CATS[CATS.length-1];
const POT_PRESETS=[
  {n:"Fonds d'urgence",e:"🛟",col:"#0ea5e9"},{n:"Vacances",e:"✈️",col:"#8b5cf6"},{n:"Voiture",e:"🚗",col:"#64748b"},
  {n:"Projet logement",e:"🏠",col:"#f97316"},{n:"Cadeaux",e:"🎁",col:"#ec4899"},{n:"Tech",e:"💻",col:"#14b8a6"}
];
const COLORS=["#0fb37f","#0ea5e9","#8b5cf6","#f97316","#ec4899","#14b8a6","#eab308","#64748b","#ef4444"];

function emptyState(){
  return{v:1,name:"",onboarded:false,obStep:0,
    settings:{avgSalary:0,incomes:[],charges:[
      {id:uid(),n:"Logement / loyer",a:0},{id:uid(),n:"Crédit",a:0},{id:uid(),n:"Assurance",a:0},
      {id:uid(),n:"Transport / essence",a:0},{id:uid(),n:"Téléphone & internet",a:0},{id:uid(),n:"Abonnements",a:0}],
      rule:{base:0,seuil:0,bonus:50},payday:-2,accounts:[]},
    pots:[],months:{},moves:[],lessons:{},liqHist:[],updatedAt:0};
}

/* ================= État & stockage ================= */
let S=emptyState();
const UI={tab:"home",ready:false,cloud:false,user:null,sync:"",authMode:"login",player:null,draftPots:null};
let storeKey="pecule:local";

function loadLocal(key){try{const r=localStorage.getItem(key);return r?JSON.parse(r):null}catch(e){return null}}
function saveLocal(){try{localStorage.setItem(storeKey,JSON.stringify(S))}catch(e){}}
let pushTimer=null;
function snapLiq(){
  if(!S.onboarded)return;const d=new Date().toISOString().slice(0,10),v=Math.round(liquidity().v);
  const h=S.liqHist,l=h[h.length-1];if(l&&l.d===d)l.v=v;else h.push({d,v});if(h.length>400)h.splice(0,h.length-400);
}
function commit(opts){
  snapLiq();S.updatedAt=Date.now();saveLocal();
  if(UI.cloud&&UI.user){clearTimeout(pushTimer);UI.sync="…";pushTimer=setTimeout(pushRemote,800);}
  if(!opts||!opts.noRender)render(opts&&opts.force);
}
function sanitize(o){
  const d=emptyState();if(!o||typeof o!=="object")return d;
  const s=Object.assign(d,o);
  s.settings=Object.assign(emptyState().settings,o.settings||{});
  s.settings.rule=Object.assign({base:0,seuil:0,bonus:50},(o.settings||{}).rule||{});
  ["incomes","charges","accounts"].forEach(k=>{if(!Array.isArray(s.settings[k]))s.settings[k]=[]});
  s.settings.accounts.forEach(a=>{if(!a.id)a.id=uid()});
  if(!Array.isArray(s.pots))s.pots=[];if(!Array.isArray(s.moves))s.moves=[];
  if(!Array.isArray(s.liqHist))s.liqHist=[];
  if(!s.months||typeof s.months!=="object")s.months={};if(!s.lessons||typeof s.lessons!=="object")s.lessons={};
  return s;
}

/* ---------- Supabase (optionnel) ---------- */
const CFG=window.PECULE_CONFIG||{};
let sb=null;
function loadScript(src){return new Promise((ok,ko)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=ko;document.head.appendChild(s);})}
async function initCloud(){
  if(!CFG.supabaseUrl||!CFG.supabaseAnonKey)return false;
  try{
    if(!window.supabase)await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js");
    sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    UI.cloud=true;
    sb.auth.onAuthStateChange((ev,session)=>{
      if(ev==="PASSWORD_RECOVERY"){sheetNewPassword();return}
      if(ev==="SIGNED_OUT"){UI.user=null;storeKey="pecule:local";S=sanitize(loadLocal(storeKey));render(true);}
    });
    const{data}=await sb.auth.getSession();
    if(data&&data.session)await onSignedIn(data.session.user);
    render(true);return true;
  }catch(e){console.warn("Supabase indisponible",e);UI.cloud=false;return false}
}
function enterApp(withTuto){
  if(!S.pots.length)S.pots=[{id:uid(),n:"Épargne",e:"🪙",col:COLORS[0],goal:0,mode:"part",val:100}];
  S.settings.charges=S.settings.charges.filter(c=>num(c.a)>0);
  S.onboarded=true;UI.tab="home";UI.authOpen=false;commit({force:true});window.scrollTo(0,0);
  if(withTuto)setTimeout(()=>sheetTuto(0),350);
}
async function onSignedIn(user){
  UI.user=user;storeKey="pecule:u:"+user.id;
  let local=loadLocal(storeKey);
  const anon=loadLocal("pecule:local");
  UI.sync="…";
  try{
    const{data,error}=await sb.from("budgets").select("data,updated_at").eq("user_id",user.id).maybeSingle();
    if(error)throw error;
    const remote=data&&data.data;UI.hadRemote=!!(remote&&remote.onboarded);
    if(remote&&(!local||num(remote.updatedAt)>=num(local.updatedAt)))local=remote;
    else if(!remote&&!local&&anon&&anon.onboarded){local=anon;}
    S=sanitize(local);saveLocal();
    if(!remote||num(S.updatedAt)>num(remote.updatedAt))await pushRemote();
    UI.sync="ok";
  }catch(e){S=sanitize(local);UI.sync="err";}
  UI.authOpen=false;
  /* nouveau compte : on entre direct dans l'appli + tutoriel ; compte existant : pas de tutoriel */
  if(!S.onboarded){if(UI.pendingName&&!S.name)S.name=UI.pendingName.trim();enterApp(!UI.hadRemote);}
  render(true);
}
async function pushRemote(){
  if(!sb||!UI.user)return;
  try{
    const{error}=await sb.from("budgets").upsert({user_id:UI.user.id,data:S,updated_at:new Date().toISOString()});
    if(error)throw error;UI.sync="ok";
  }catch(e){UI.sync="err";}
  updateSyncDot();
}
function updateSyncDot(){const d=$("#syncdot");if(d)d.textContent=syncLabel();}
function syncLabel(){if(!UI.cloud)return"Sur cet appareil";if(!UI.user)return"Non connecté";return UI.sync==="err"?"⚠️ Synchro en attente":UI.sync==="…"?"Synchro…":"✓ Synchronisé"}
window.addEventListener("online",()=>{if(UI.user)pushRemote()});

/* ================= Calculs ================= */
const sum=(a,f)=>a.reduce((s,x)=>s+num(f?f(x):x),0);
function compute(salary,st){
  st=st||S.settings;
  const extra=sum(st.incomes,i=>i.a),charges=sum(st.charges,c=>c.a);
  const income=salary+extra,dispo=Math.max(0,income-charges);
  let savings=num(st.rule.base)+Math.max(0,salary-num(st.rule.seuil))*num(st.rule.bonus)/100;
  savings=Math.min(savings,dispo);
  const alloc=allocate(savings);
  return{salary,extra,income,charges,savings,alloc,budget:dispo-savings};
}
function allocate(amount){
  const alloc={};let rest=amount;
  S.pots.filter(p=>p.mode==="fixe").forEach(p=>{const v=Math.min(num(p.val),rest);alloc[p.id]=v;rest-=v;});
  const parts=S.pots.filter(p=>p.mode!=="fixe");const tp=sum(parts,p=>p.val);
  if(rest>0){
    if(parts.length&&tp>0)parts.forEach(p=>{alloc[p.id]=(alloc[p.id]||0)+rest*num(p.val)/tp;});
    else if(S.pots.length){const l=S.pots[S.pots.length-1];alloc[l.id]=(alloc[l.id]||0)+rest;}
  }
  /* arrondi à l'euro, la différence va au plus gros pot */
  const ids=Object.keys(alloc);if(ids.length){let tot=0;ids.forEach(k=>{alloc[k]=Math.round(alloc[k]);tot+=alloc[k]});
    const diff=Math.round(amount)-tot;if(diff){const big=ids.reduce((a,b)=>alloc[a]>=alloc[b]?a:b);alloc[big]+=diff;}}
  return alloc;
}
const spent=m=>sum((m&&m.exp)||[],e=>e.a);
const incSum=m=>sum((m&&m.inc)||[],e=>e.a);
const avail=m=>num(m&&m.budget)+incSum(m);
const leftOf=m=>avail(m)-spent(m);
/* pour les stats : sans les reports d'un mois sur l'autre */
const spentReal=m=>sum(((m&&m.exp)||[]).filter(e=>!e.carry),e=>e.a);
const incReal=m=>sum(((m&&m.inc)||[]).filter(e=>!e.carry),e=>e.a);
/* une vraie paie récupère les mouvements notés "sans paie" */
function absorbAuto(k){
  const m=S.months[k];if(!m||k<keyOffset(-1))return;
  Object.keys(S.months).forEach(x=>{const a=S.months[x];if(x!==k&&a.auto){m.exp=(m.exp||[]).concat(a.exp||[]);m.inc=(m.inc||[]).concat(a.inc||[]);delete S.months[x];}});
}
function ensureMonth(){let k=activeKey();if(!k){k=keyOffset(0);S.months[k]={auto:true,manual:true,salary:0,extra:0,income:0,charges:0,savings:0,alloc:{},budget:0,exp:[],inc:[]};}return k}
function potBalance(id){let t=0;Object.values(S.months).forEach(m=>{t+=num((m.alloc||{})[id])});S.moves.forEach(x=>{if(x.p===id)t+=num(x.a)});return t}
function totalSaved(){return sum(S.pots,p=>potBalance(p.id))}
function activeKey(){
  /* la dernière vraie paie récente ; sinon le mois "sans paie" en cours */
  const ok=k=>k>=keyOffset(-1)&&k<=keyOffset(1);
  const keys=Object.keys(S.months).filter(ok).sort();if(!keys.length)return null;
  const real=keys.filter(k=>!S.months[k].auto);
  return real.length?real[real.length-1]:keys[keys.length-1];
}
function nextPayday(){
  const today=new Date();today.setHours(0,0,0,0);const pd=parseInt(S.settings.payday)||0;
  const biz=(y,m,n)=>{let d=new Date(y,m+1,0),c=0;for(let g=0;g<40;g++){const w=d.getDay();if(w!==0&&w!==6){c++;if(c===n)return d;}d=new Date(d.getFullYear(),d.getMonth(),d.getDate()-1);}return d};
  let f;
  if(pd<0)f=(y,m)=>biz(y,m,-pd);
  else if(pd>=1)f=(y,m)=>new Date(y,m,Math.min(pd,new Date(y,m+1,0).getDate()));
  else f=(y,m)=>new Date(y,m+1,1);
  let n=f(today.getFullYear(),today.getMonth());if(n<=today)n=f(today.getFullYear(),today.getMonth()+1);
  return n;
}
const daysToPay=()=>Math.max(1,Math.round((nextPayday()-new Date(new Date().setHours(0,0,0,0)))/864e5));

/* ================= Thème clair / sombre ================= */
const mqDark=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;
function themePref(){try{return localStorage.getItem("pecule:theme")||"auto"}catch(e){return"auto"}}
function applyTheme(){const p=themePref(),dark=p==="dark"||(p==="auto"&&mqDark&&mqDark.matches);
  document.documentElement.dataset.theme=dark?"dark":"light";
  const mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.content=dark?"#0b0d10":(PALS.find(x=>x[0]===palPref())||PALS[0])[2];
  const b=$("#themebtn");if(b)b.querySelector("span").textContent=dark?"Mode clair":"Mode sombre",b.querySelector("i").textContent=dark?"☀️":"🌙";}
const PALS=[["emeraude","Émeraude","#0fb37f"],["ocean","Océan","#0ea5e9"],["indigo","Indigo","#5b5bf0"],["violet","Violet","#a855f7"],["rose","Rose","#ec4899"],["corail","Corail","#f4573f"],["soleil","Soleil","#f59e0b"]];
function palPref(){try{return localStorage.getItem("pecule:pal")||"emeraude"}catch(e){return"emeraude"}}
function applyPal(){document.documentElement.dataset.pal=palPref();}
function setPal(p){try{localStorage.setItem("pecule:pal",p)}catch(e){}applyPal();applyTheme();render(true);}
applyPal();
const STYLES=[["auto","Auto"],["classic","Classique"],["glass","Liquid glass"],["bento","Bento"],["soft","Soft 3D"]];
function stylePref(){try{return localStorage.getItem("pecule:style")||"auto"}catch(e){return"auto"}}
function applyStyle(){const p=stylePref();document.documentElement.dataset.style=p==="auto"?(window.innerWidth>=900?"glass":"classic"):p;}
function setStyle(p){try{localStorage.setItem("pecule:style",p)}catch(e){}applyStyle();render(true);}
window.addEventListener("resize",applyStyle);applyStyle();
function setTheme(p){try{localStorage.setItem("pecule:theme",p)}catch(e){}applyTheme();render(true);}
if(mqDark&&mqDark.addEventListener)mqDark.addEventListener("change",applyTheme);
applyTheme();
/* ================= Rendu ================= */
const app=$("#app");let lastHtml="",rq=0,rqForce=false;
function render(force){
  if(!UI.ready)return;if(force)rqForce=true;if(rq)return;
  rq=requestAnimationFrame(()=>{rq=0;const f=rqForce;rqForce=false;doRender(f);});
}
function doRender(force){
  const a=document.activeElement;
  if(!force&&a&&app.contains(a)&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA"||a.tagName==="SELECT"))return;
  let html;
  const needAuth=!!UI.authOpen&&UI.cloud&&!UI.user;
  const nav=$("#tabs");
  document.body.classList.toggle("noapp",needAuth||!S.onboarded);
  if(needAuth){html=vAuth();nav.style.display="none";app.dataset.tab=""}
  else if(!S.onboarded){html=vOnboard();nav.style.display="none";app.dataset.tab=""}
  else{
    nav.style.display="flex";
    nav.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.tab===UI.tab));
    html=({home:vHome,spend:vSpend,inc:vIn,pots:vPots,learn:vLearn,me:vMe}[UI.tab]||vHome)();
    app.dataset.tab=UI.tab;
  }
  if(html!==lastHtml){
    /* garde le champ en cours de saisie (valeur + focus) quand l'écran se redessine */
    let keep=null;
    if(a&&app.contains(a)&&a.tagName==="INPUT"){
      const sel=a.id?"#"+a.id:a.dataset.k?`[data-k="${a.dataset.k}"]`:a.dataset.l?`[data-l="${a.dataset.l}"][data-i="${a.dataset.i}"][data-f="${a.dataset.f}"]`:null;
      if(sel)keep={sel,v:a.value};
    }
    app.innerHTML=html;lastHtml=html;
    if(keep){const n=app.querySelector(keep.sel);if(n){n.value=keep.v;n.focus({preventScroll:true});}}
  }
}

/* ---------- Auth ---------- */
function vAuth(){
  const m=UI.authMode;
  return `<div class="ob"><div class="logo">🪙</div><h1>Pécule</h1><div class="sub">Ton argent, simple et clair. ${m==="signup"?"Crée ton compte pour retrouver tes données partout.":"Connecte-toi pour retrouver tes données."}</div>
  <div class="seg"><button data-act="authmode" data-m="login" class="${m==="login"?"on":""}">Connexion</button><button data-act="authmode" data-m="signup" class="${m==="signup"?"on":""}">Créer un compte</button></div>
  <form id="authf" autocomplete="on">
   <div class="field"><label>E-mail</label><input id="a_email" type="email" autocomplete="username" inputmode="email" required></div>
   <div class="field"><label>Mot de passe</label><input id="a_pw" type="password" autocomplete="${m==="signup"?"new-password":"current-password"}" minlength="6" required></div>
   <button class="btn" type="submit">${m==="signup"?"Créer mon compte":"Me connecter"}</button>
  </form>
  <div id="authmsg" class="tip" style="text-align:center;min-height:20px"></div>
  ${m==="login"?`<button class="link" data-act="forgot">Mot de passe oublié ?</button>`:""}
  <button class="link muted" data-act="skipauth" style="color:var(--muted)">← Retour</button></div>`;
}
async function doAuth(){
  const email=$("#a_email").value.trim(),pw=$("#a_pw").value,msg=$("#authmsg");
  if(!email||pw.length<6){msg.textContent="E-mail et mot de passe (6 caractères min.) requis.";return}
  msg.textContent="…";
  try{
    if(UI.authMode==="signup"){
      const{data,error}=await sb.auth.signUp({email,password:pw,options:{emailRedirectTo:location.origin+location.pathname}});
      if(error)throw error;
      if(data.session)await onSignedIn(data.user);
      else{msg.innerHTML="📩 Compte créé ! Clique sur le lien reçu par e-mail, puis reviens te connecter.";UI.authMode="login";}
    }else{
      const{data,error}=await sb.auth.signInWithPassword({email,password:pw});
      if(error)throw error;await onSignedIn(data.user);
    }
  }catch(e){msg.textContent=authErr(e)}
}
function authErr(e){const m=(e&&e.message||"").toLowerCase();
  if(m.includes("invalid login"))return"E-mail ou mot de passe incorrect.";
  if(m.includes("not confirmed"))return"Confirme d'abord ton e-mail (regarde tes spams).";
  if(m.includes("already registered"))return"Ce compte existe déjà : connecte-toi.";
  if(m.includes("rate"))return"Trop d'essais, patiente un peu.";
  return"Erreur : "+(e&&e.message||"connexion impossible");}

/* ---------- Bienvenue ---------- */
function vOnboard(){
  return `<div class="ob"><div class="logo">🪙</div><h1>Bienvenue sur Pécule</h1>
   <div class="sub">Ton argent, simple et clair : ce qui rentre, ce qui sort, ce que tu mets de côté.</div>
   <div class="field"><label>Ton prénom</label><input id="w_name" value="${esc(UI.pendingName||S.name||"")}" placeholder="User" autocomplete="given-name" maxlength="30"></div>
   <button class="btn" data-act="wauth" data-m="signup">Créer mon compte</button>
   <button class="btn ghost" style="margin-top:10px" data-act="wauth" data-m="login">J'ai déjà un compte</button>
   <div class="or"><span>ou</span></div>
   <button class="btn line" data-act="wguest">Poursuivre sans connexion</button>
   <div class="tip" style="text-align:center">Tu peux essayer l'appli tout de suite et créer ton compte plus tard, sans rien perdre.</div></div>`;
}
function listRows(list){
  return S.settings[list].map((c,i)=>`<div class="f2"><input data-l="${list}" data-i="${i}" data-f="n" value="${esc(c.n)}" maxlength="40"><input data-l="${list}" data-i="${i}" data-f="a" inputmode="decimal" value="${esc(c.a||"")}" placeholder="0"><button class="x" data-act="delrow" data-l="${list}" data-i="${i}">×</button></div>`).join("");
}
function paydaySelect(){
  const v=parseInt(S.settings.payday)||0;
  const o=[[-1,"Dernier jour ouvré du mois"],[-2,"Avant-dernier jour ouvré"],[-3,"3e jour ouvré avant la fin"]];
  for(let d=1;d<=31;d++)o.push([d,"Le "+d+" du mois"]);o.push([0,"Je ne sais pas (fin de mois)"]);
  return `<select data-k="settings.payday" data-num="1">${o.map(([k,l])=>`<option value="${k}" ${k===v?"selected":""}>${l}</option>`).join("")}</select>`;
}

/* ---------- En-tête commun ---------- */
const MIC=`<button class="iconbtn" data-act="voice" aria-label="Commande vocale">🎙️</button>`;
const header=(title,sub)=>`<div class="top"><div style="min-width:0"><h1>${title}</h1>${sub?`<div class="sub" style="margin:0">${sub}</div>`:""}</div>${MIC}</div><div style="height:16px"></div>`;
/* ---------- Accueil : le récap ---------- */
function liquidity(){
  const acc=S.settings.accounts;
  if(acc.length)return{v:sum(acc,a=>a.a),est:false};
  const k=activeKey(),m=k&&S.months[k];
  return{v:Math.round(Math.max(0,m&&!m.auto?leftOf(m):0)+totalSaved()),est:true};
}
function chart6(){
  const ks=[];for(let i=-5;i<=0;i++)ks.push(keyOffset(i));
  const data=ks.map(k=>{const m=S.months[k];return{k,sp:m?spentReal(m):0,sv:m?num(m.savings):0}});
  const mx=Math.max(1,...data.map(d=>Math.max(d.sp,d.sv)));
  const W=320,H=150,bw=16,gap=W/6;
  const bars=data.map((d,i)=>{const x=i*gap+gap/2;const h1=d.sp/mx*(H-34),h2=d.sv/mx*(H-34);
    const lab=new Date(+d.k.slice(0,4),+d.k.slice(5)-1,1).toLocaleDateString("fr-FR",{month:"short"}).replace(".","");
    return `<rect x="${x-bw-1}" y="${H-18-h1}" width="${bw}" height="${Math.max(h1,1.5)}" rx="4" fill="#f87171"/><rect x="${x+1}" y="${H-18-h2}" width="${bw}" height="${Math.max(h2,1.5)}" rx="4" fill="#10b981"/><text x="${x}" y="${H-3}" text-anchor="middle" font-size="11" fill="currentColor" opacity=".6">${lab}</text>`}).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;color:var(--text);max-height:210px">${bars}</svg>
   <div class="row small" style="justify-content:center;gap:16px;margin-top:6px"><span><span style="color:#f87171">●</span> Dépensé</span><span><span style="color:#10b981">●</span> Épargné</span></div>`;
}
function liqChart(){
  const h=S.liqHist.slice(-90);if(h.length<2)return `<div class="tip" style="margin:0">La courbe se dessine au fil des jours, à chaque mise à jour de tes comptes ou de ton budget.</div>`;
  const W=320,H=120,P=6,vs=h.map(x=>x.v),mn=Math.min(...vs),mx=Math.max(...vs),rg=Math.max(1,mx-mn);
  const pts=h.map((x,i)=>[P+i*(W-2*P)/(h.length-1),P+(H-2*P)*(1-(x.v-mn)/rg)]);
  const line=pts.map((p,i)=>(i?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ");
  const d0=new Date(h[0].d).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}),d1="aujourd'hui";
  const diff=vs[vs.length-1]-vs[0];
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="150" preserveAspectRatio="none" style="display:block"><defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:var(--accent)" stop-opacity=".35"/><stop offset="1" style="stop-color:var(--accent)" stop-opacity="0"/></linearGradient></defs>
   <path d="${line} L${pts[pts.length-1][0]} ${H} L${pts[0][0]} ${H} Z" fill="url(#lg)"/><path d="${line}" fill="none" style="stroke:var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
   <div class="row small muted" style="margin-top:4px"><span>${d0}</span><b class="${diff>=0?"pos":"neg"}">${diff>=0?"+":"−"}${fmt(Math.abs(diff))}</b><span>${d1}</span></div>`;
}
function yearStats(){
  const y=String(new Date().getFullYear());let sp=0,sv=0,inc=0;
  Object.keys(S.months).filter(k=>k.startsWith(y)).forEach(k=>{const m=S.months[k];sp+=spentReal(m);sv+=num(m.savings);inc+=incReal(m);});
  return{y,sp,sv,inc};
}
function vHome(){
  const k=activeKey(),m=k&&S.months[k],real=m&&!m.auto;
  const liq=liquidity(),ys=yearStats(),tip=dailyTip(),A=S.settings.accounts;
  /* 1. Liquidités en haut */
  const liqCard=`<div class="card liqcard" data-act="liq"><div class="row"><span class="label">💧 Mes liquidités${liq.est?" (estim.)":""}</span><span class="small muted">Modifier ›</span></div>
   <div class="big" style="font-size:38px">${fmt(liq.v)}</div>
   ${A.length?`<div class="acclist">${A.map(a=>`<div><span>${esc(a.n)}</span><b class="${num(a.a)<0?"neg":""}">${fmt(a.a)}</b></div>`).join("")}</div>`:`<div class="tip" style="margin:0">Ajoute tes comptes (courant, livret…) pour suivre tout ton argent au même endroit.</div>`}</div>`;
  const quick=`<div class="grid2" style="margin-bottom:14px"><button class="btn qa out" data-act="expense"><span>−</span>Dépense</button><button class="btn qa in" data-act="income"><span>+</span>Entrée</button></div>`;
  /* 2. Reste à dépenser (seulement si une paie est rentrée) */
  let hero="";
  if(real){
    const av=avail(m),l=leftOf(m),pct=av>0?Math.max(0,Math.min(100,l/av*100)):0,d=daysToPay();
    const over=l<0,low=!over&&pct<15;
    hero=`<div class="card hero${over?" over":""}" data-act="tab" data-t="spend"><div class="row"><span class="label">${over?"Budget dépassé":"Reste à dépenser"}</span><span class="pill">${d} j avant la paie</span></div>
     <div class="big">${fmt(l)}</div><div class="bar"><i style="width:${pct}%"></i></div>
     <div class="row" style="margin-top:10px;font-size:14px;font-weight:600"><span>${over?"Lève le pied jusqu'à la paie 💪":low?"⚠️ Bientôt à sec : "+fmt(l/d)+" / jour":"≈ "+fmt(l/d)+" / jour"}</span><span>sur ${fmt(av)}</span></div></div>`;
  }
  const hasData=Object.values(S.months).some(x=>(x.exp||[]).length||num(x.savings)>0);
  const nReal=Object.values(S.months).filter(x=>!x.auto).length;
  /* paie : petite ligne discrète en bas */
  const payRow=`<div class="card payrow" data-act="${real&&k===keyOffset(0)?"editmonth":"pay"}" data-id="${esc(real?k:"")}"><span>💶</span><div class="grow"><b>${real?"Ma paie · "+esc(monthName(k).toLowerCase()):"Ta paie est tombée ?"}</b><span>${real?"Modifier ou ajouter la suivante":"Rentre-la pour calculer ton budget du mois"}</span></div><span class="muted">›</span></div>`;
  const steps=[[real,"Rentre ta paie (ou ce qu'il te reste)","pay"],[Object.values(S.months).some(x=>(x.exp||[]).length),"Note ta première dépense","expense"],[A.length>0,"Ajoute tes comptes","liq"]];
  const todo=steps.filter(x=>!x[0]).length;
  const startCard=!todo?"":S.hideStart?`<div class="card startmini" data-act="showstart"><b>🚀 Bien démarrer (${3-todo}/3)</b><span class="small muted">Afficher ▾</span></div>`:`<div class="card"><div class="row"><b>🚀 Bien démarrer (${3-todo}/3)</b><a class="small muted" data-act="hidestart" style="cursor:pointer">Réduire ▴</a></div>
   ${steps.map(x=>`<div class="check ${x[0]?"on":""}" ${x[0]?"":`data-act="${x[2]}"`}><i>${x[0]?"✓":""}</i><span>${x[1]}</span></div>`).join("")}</div>`;
  const pots=S.pots.map(p=>{const v=potBalance(p.id),g=num(p.goal);return `<div class="it" data-act="pot" data-id="${esc(p.id)}" style="cursor:pointer"><div class="emo" style="background:${esc(p.col)}22">${esc(p.e)}</div><div class="grow"><b>${esc(p.n)}</b>${g>0?`<div class="bar" style="height:6px;margin-top:6px"><i style="width:${Math.min(100,v/g*100)}%;background:${esc(p.col)}"></i></div>`:`<span>${p.mode==="fixe"?fmt(p.val)+" / mois":Math.round(num(p.val))+" % de l'épargne"}</span>`}</div><div class="amt">${fmt(v)}</div></div>`}).join("");
  return `<div class="top"><div><h1>Salut ${esc(S.name||"")} 👋</h1><div class="sub" style="margin:0" id="syncdot">${esc(syncLabel())}</div></div>
   <div class="row" style="gap:8px">${MIC}<button class="iconbtn" data-act="tab" data-t="me" aria-label="Profil">👤</button></div></div><div style="height:14px"></div>
  <div class="dash"><div class="c5">${liqCard}</div>
  <div class="c3 qcol">${quick}</div>
  ${hero?`<div class="c4">${hero}</div>`:""}
  ${m?`<div class="c4"><div class="card"><div class="label" style="margin-bottom:10px">🗓️ Ce mois-ci</div><div class="grid2" style="grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
    <div><div class="small muted">Entrées</div><b>${fmt(num(m.salary)+num(m.extra)+incReal(m))}</b></div><div><div class="small muted">Dépensé</div><b class="neg">${fmt(spentReal(m))}</b></div><div><div class="small muted">Épargné</div><b class="pos">${fmt(m.savings)}</b></div></div></div></div>`:""}
  ${S.liqHist.length>=2?`<div class="c8"><div class="card"><div class="row" style="margin-bottom:8px"><span class="label">📈 Évolution de ton solde</span><span class="small muted">tous comptes</span></div>${liqChart()}</div></div>`:""}
  ${nReal>=2?`<div class="c5"><div class="card"><div class="row" style="margin-bottom:8px"><span class="label">📊 6 derniers mois</span></div>${chart6()}</div></div>`:""}
  ${hasData?`<div class="c3 ycol"><div class="card"><div class="label" style="margin-bottom:10px">📅 Année ${ys.y}</div>
   <div class="grid2" style="grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
    <div><div class="small muted">Épargné</div><b class="pos">${fmt(ys.sv)}</b></div><div><div class="small muted">Dépensé</div><b class="neg">${fmt(ys.sp)}</b></div><div><div class="small muted">Rentrées +</div><b>${fmt(ys.inc)}</b></div></div></div></div>`:""}
  <div class="c4"><div class="sec">Mes pots · ${fmt(totalSaved())} <a data-act="tab" data-t="pots">Gérer</a></div>
  <div class="card list">${pots||`<div class="empty">Aucun pot. <a class="pos" data-act="newpot">Créer un pot</a></div>`}</div></div>
  <div class="c4">${payRow}</div>
  ${startCard?`<div class="c4">${startCard}</div>`:""}
  ${tip?`<div class="c12"><div class="card tip-card" data-act="lesson" data-id="${tip.l.id}"><div class="label">💡 Astuce du jour · ${esc(tip.l.title)}</div><div style="font-weight:700;margin-top:6px">${esc(tip.t)}</div></div></div>`:""}</div>`;
}
function dailyTip(){const all=[];COURSES.list.forEach(l=>l.tips.forEach(t=>all.push({l,t})));if(!all.length)return null;const d=Math.floor(Date.now()/864e5);return all[d%all.length]}
function potCard(p){
  const v=potBalance(p.id),g=num(p.goal),pct=g>0?Math.min(100,v/g*100):0;
  return `<div class="pot" data-act="pot" data-id="${esc(p.id)}"><div class="h"><span class="e" style="background:${esc(p.col)}22">${esc(p.e||"💰")}</span>${esc(p.n)}</div>
   <div class="v">${fmt(v)}</div>${g>0?`<div class="bar" style="height:6px"><i style="width:${pct}%;background:${esc(p.col)}"></i></div><div class="g">${Math.round(pct)} % de ${fmt(g)}</div>`:`<div class="g">${p.mode==="fixe"?fmt(p.val)+" / mois":Math.round(num(p.val))+" % de l'épargne"}</div>`}</div>`;
}
/* dépenses + rentrées du mois, triées */
function movesOf(m){
  return (m.exp||[]).map(e=>Object.assign({k:"exp"},e)).concat((m.inc||[]).map(e=>Object.assign({k:"inc"},e))).sort((a,b)=>b.d.localeCompare(a.d));
}
function mvRow(e){
  const dt=new Date(e.d).toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"});
  if(e.k==="inc")return `<div class="it"><div class="emo">${e.carry?"🔁":incOf(e.c).e}</div><div class="grow"><b>${esc(e.l||incOf(e.c).n)}</b><span>${dt} · ${e.carry?"report":incOf(e.c).n}${e.acc&&accOf(e.acc)?" · "+esc(accOf(e.acc).n):""}</span></div><div class="amt pos">+${fmt(e.a)}</div><button class="x" data-act="delinc" data-id="${esc(e.id)}" aria-label="Supprimer">×</button></div>`;
  return `<div class="it"><div class="emo">${catOf(e.c).e}</div><div class="grow"><b>${esc(e.l||catOf(e.c).n)}</b><span>${dt}${e.acc&&accOf(e.acc)?" · "+esc(accOf(e.acc).n):""}</span></div><div class="amt neg">−${fmt(e.a)}</div><button class="x" data-act="delexp" data-id="${esc(e.id)}" aria-label="Supprimer">×</button></div>`;
}

/* ---------- Dépenses ---------- */
function vSpend(){
  const k=activeKey(),m=k&&S.months[k];
  const head=header("Dépenses",m?(m.auto?"Ce mois-ci":"Depuis ta paie "+esc(monthName(k).toLowerCase())):"Tout ce qui sort de ton budget.")+`
   <button class="btn" data-act="expense" style="margin-bottom:14px">➖ Ajouter une dépense</button>`;
  if(!m||!(m.exp||[]).length)return head+`<div class="card empty">Aucune dépense pour l'instant.<br>Astuce : 🎙️ « moins 12 kebab »</div>`;
  const sp=spent(m),av=avail(m);
  const by={};(m.exp||[]).forEach(e=>by[e.c]=(by[e.c]||0)+num(e.a));
  const mx=Math.max(1,...Object.values(by));
  const cats=Object.keys(by).sort((a,b)=>by[b]-by[a]).map(c=>`<div class="catbar"><span>${catOf(c).e}</span><div><div class="small" style="font-weight:700;margin-bottom:4px">${catOf(c).n}</div><div class="bar"><i style="width:${by[c]/mx*100}%"></i></div></div><b class="small">${fmt(by[c])}</b></div>`).join("");
  const pct=av>0?Math.min(100,sp/av*100):0;
  return head+`<div class="card"><div class="row"><div><div class="label">Dépensé</div><div class="mid">${fmt(sp)}</div></div>${m.auto?"":`<div style="text-align:right"><div class="label">Reste</div><div class="mid">${fmt(leftOf(m))}</div></div>`}</div>
   ${m.auto?`<div class="tip">Rentre ta paie dans « Entrées » pour voir ton budget.</div>`:`<div class="bar" style="margin-top:12px"><i style="width:${pct}%;background:${pct>90?"var(--danger)":"var(--accent)"}"></i></div>`}</div>
  <div class="card">${cats}</div>
  <div class="sec">Détail</div><div class="card list">${movesOf(m).filter(x=>x.k==="exp").map(mvRow).join("")}</div>`;
}

/* ---------- Entrées ---------- */
function vIn(){
  const k=activeKey(),m=k&&S.months[k];
  const keys=Object.keys(S.months).filter(x=>!S.months[x].auto).sort().reverse();
  const incs=m?movesOf(m).filter(x=>x.k==="inc"):[];
  const potIn=S.moves.filter(x=>x.a>0).slice(-8).reverse();
  const sal=m&&!m.auto?num(m.salary)+num(m.extra):0;
  const by={};if(sal)by.salaire=sal;incs.filter(x=>!x.carry).forEach(e=>{const c=incOf(e.c).id;by[c]=(by[c]||0)+num(e.a)});
  const tot=Object.values(by).reduce((x,y)=>x+y,0),mx=Math.max(1,...Object.values(by));
  const bars=Object.keys(by).sort((x,y)=>by[y]-by[x]).map(c=>`<div class="catbar"><span>${incOf(c).e}</span><div><div class="small" style="font-weight:700;margin-bottom:4px">${incOf(c).n}</div><div class="bar"><i style="width:${by[c]/mx*100}%"></i></div></div><b class="small">${fmt(by[c])}</b></div>`).join("");
  return header("Entrées","Tout l'argent qui rentre : salaire, business, ventes…")+`
  <div class="grid2" style="margin-bottom:14px"><button class="btn" data-act="pay">💼 Salaire</button><button class="btn ghost" data-act="income">➕ Autre entrée</button></div>
  ${tot?`<div class="card"><div class="row"><div><div class="label">Entrées ${m&&!m.auto?"depuis ta paie":"ce mois-ci"}</div><div class="mid">${fmt(tot)}</div></div></div><div style="margin-top:8px">${bars}</div></div>`:""}
  <div class="sec">Détail</div>
  <div class="card list">${incs.length?incs.map(mvRow).join(""):`<div class="empty">Un client, une vente, un cadeau… ajoute-le ici.<br>Astuce : 🎙️ « +30 client »</div>`}</div>
  ${potIn.length?`<div class="sec">Versés dans les pots</div><div class="card list">${potIn.map(x=>{const p=S.pots.find(q=>q.id===x.p);return p?`<div class="it"><div class="emo">${esc(p.e)}</div><div class="grow"><b>${esc(x.l||"Ajout")}</b><span>${esc(p.n)} · ${new Date(x.d).toLocaleDateString("fr-FR")}</span></div><div class="amt pos">+${fmt(x.a)}</div></div>`:""}).join("")}</div>`:""}
  <div class="sec">Mes paies</div><div class="card list">${keys.length?keys.map(x=>{const mm=S.months[x];return `<div class="it" data-act="editmonth" data-id="${esc(x)}" style="cursor:pointer"><div class="emo">📅</div><div class="grow"><b>${esc(monthName(x))}</b><span>${mm.manual?"Saisie à la main":"Paie "+fmt(mm.salary)} · dépensé ${fmt(spent(mm))}</span></div><div class="amt pos">+${fmt(mm.savings)}</div></div>`}).join(""):`<div class="empty">Aucune paie enregistrée.</div>`}</div>`;
}

/* ---------- Pots ---------- */
function vPots(){
  return header("Mes pots",`Total : <b>${fmt(totalSaved())}</b>`)+`
  <div class="grid2">${S.pots.map(potCard).join("")}<div class="pot add" data-act="newpot">＋ Nouveau pot</div></div>
  <div class="tip" style="margin-top:14px">Touche un pot pour ajouter ou retirer de l'argent, ou le modifier. Astuce : dis « +250 euros ${esc(S.pots[0]?S.pots[0].n:"Vacances")} » avec 🎙️.</div>`;
}

/* ---------- Cours ---------- */
function vLearn(){
  const L=COURSES.list,done=L.filter(l=>S.lessons[l.id]&&S.lessons[l.id].done).length;
  return `<h1>Apprendre</h1><div class="sub">Des cours courts pour mieux gérer ton argent. ${done}/${L.length} terminés.</div>
  <div class="bar" style="margin-bottom:18px"><i style="width:${L.length?done/L.length*100:0}%"></i></div>
  ${L.map((l,i)=>{const d=S.lessons[l.id]&&S.lessons[l.id].done;return `<div class="card lesson" data-act="lesson" data-id="${l.id}"><div class="n" style="background:linear-gradient(140deg,${l.c1},${l.c2})">${l.e}</div>
   <div class="grow"><b>${i+1}. ${esc(l.title)}</b><span>▶︎ Vidéo + ${l.min} min de lecture</span></div>${d?`<span class="done-badge">✓ Fait</span>`:""}</div>`}).join("")}`;
}

/* ---------- Profil ---------- */
function vMe(){
  const st=S.settings;
  let acc;
  if(!UI.cloud)acc=`<div class="label">Compte</div><div style="margin:6px 0">Données enregistrées sur cet appareil.</div><div class="tip">Pense à exporter une sauvegarde de temps en temps (en bas de la page).</div>`;
  else if(!UI.user)acc=`<div class="label">Compte</div><div style="margin:6px 0 12px">Tu utilises Pécule sans compte.</div><button class="btn" data-act="gologin">Me connecter / créer un compte</button>`;
  else acc=`<div class="label">Connecté</div><div style="margin:6px 0;font-weight:700;word-break:break-all">${esc(UI.user.email)}</div><div class="tip" id="syncdot">${esc(syncLabel())}</div><button class="btn line" style="margin-top:12px" data-act="logout">Se déconnecter</button>`;
  const tp=themePref();
  return `<h1>Profil</h1><div class="sub">Chaque modif est enregistrée automatiquement.</div>
  <div class="card"><div class="label" style="margin-bottom:8px">Apparence</div><div class="seg" style="margin:0">${[["auto","Auto"],["light","☀️ Clair"],["dark","🌙 Sombre"]].map(x=>`<button data-act="theme" data-m="${x[0]}" class="${tp===x[0]?"on":""}">${x[1]}</button>`).join("")}</div>
   <div class="label" style="margin:14px 0 8px">Style</div><div class="chips" style="margin:0">${STYLES.map(x=>`<button class="chip ${stylePref()===x[0]?"on":""}" data-act="style" data-m="${x[0]}">${x[1]}</button>`).join("")}</div>
   <div class="label" style="margin:14px 0 8px">Couleur · froides → chaudes</div><div class="pals">${PALS.map(x=>`<button class="pal ${palPref()===x[0]?"on":""}" data-act="pal" data-m="${x[0]}" style="background:${x[2]}" aria-label="${x[1]}" title="${x[1]}"></button>`).join("")}</div>
   <div class="row" style="justify-content:flex-start;gap:4px;flex-wrap:wrap;padding-top:8px"><button class="link" data-act="tuto" data-i="0" style="padding:8px 10px 0 0">▶︎ Revoir le tutoriel</button>${S.hideStart?`<button class="link" data-act="showstart" style="padding:8px 0 0">🚀 Réafficher « Bien démarrer »</button>`:""}</div></div>
  <div class="card">${acc}</div>
  <div class="card"><div class="label">⚡ Apple Pay → Pécule (iPhone)</div>
   <div class="tip" style="margin-top:6px">Quand tu paies avec Apple Pay, Pécule peut s'ouvrir avec la dépense déjà remplie : tu n'as plus qu'à valider.</div>
   <ol class="tip" style="padding-left:18px;margin:8px 0 0;line-height:1.6">
    <li>App <b>Raccourcis</b> → <b>Automatisation</b> → <b>+</b> → <b>Transaction</b>.</li>
    <li>Choisis tes cartes, coche <b>Exécuter immédiatement</b>.</li>
    <li>Action <b>Ouvrir les URL</b>, avec ce lien (remplace les mots entre crochets par les variables <i>Montant</i>, <i>Commerçant</i>, <i>Carte</i>) :</li></ol>
   <div class="code" id="aplink">${esc(location.origin+location.pathname)}?add=[Montant]&amp;m=[Commerçant]&amp;card=[Carte]</div>
   <button class="btn ghost sm" data-act="copylink">Copier le lien</button>
   <div class="tip">Astuce : donne à tes comptes le même nom que tes cartes, Pécule choisira le bon compte tout seul. Fonctionne au mieux avec un compte Pécule connecté.</div></div>
  <div class="card"><div class="field"><label>Prénom</label><input data-k="name" value="${esc(S.name)}"></div></div>
  <div class="sec">Rentrées</div><div class="card"><div class="field"><label>Salaire net moyen (€)</label><input data-k="settings.avgSalary" inputmode="decimal" value="${esc(st.avgSalary||"")}"></div>
   <div class="label" style="margin-bottom:8px">Autres rentrées fixes</div>${listRows("incomes")}<button class="btn ghost sm" data-act="addrow" data-l="incomes">+ Ajouter</button></div>
  <div class="sec">Charges fixes · ${fmt(sum(st.charges,c=>c.a))}/mois</div><div class="card">${listRows("charges")}<button class="btn ghost sm" data-act="addrow" data-l="charges">+ Ajouter</button></div>
  <div class="sec">Règle d'épargne</div><div class="card">
   <div class="field"><label>Épargne chaque mois (€)</label><input data-k="settings.rule.base" inputmode="decimal" value="${esc(st.rule.base)}"></div>
   <div class="grid2"><div class="field"><label>Si ma paie dépasse (€)</label><input data-k="settings.rule.seuil" inputmode="decimal" value="${esc(st.rule.seuil)}"></div>
   <div class="field"><label>…j'épargne en plus (%)</label><input data-k="settings.rule.bonus" inputmode="decimal" value="${esc(st.rule.bonus)}"></div></div>
   <div class="field"><label>Jour de ta paie</label>${paydaySelect()}</div>
   <div class="tip">Exemple : une paie de ${fmt(num(st.rule.seuil)+200)} → ${fmt(Math.min(compute(num(st.rule.seuil)+200).savings,1e9))} d'épargne.</div></div>
  <div class="sec">Sauvegarde</div><div class="card">
   <button class="btn ghost" data-act="export">📤 Exporter mes données</button>
   <label class="btn ghost" style="margin-top:10px">📥 Importer une sauvegarde<input type="file" accept="application/json,.json" id="importf" style="display:none"></label>
   <button class="btn danger" style="margin-top:10px" data-act="reset">Tout effacer</button></div>
  <div class="tip" style="text-align:center;margin:10px 0 20px">Pécule · fait avec 💚</div>`;
}

/* ================= Fenêtres ================= */
const bg=$("#sheetBg"),sh=$("#sheet");
function openSheet(html,full){
  if(UI.player){UI.player.stop();UI.player=null}
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  sh.className="sheet"+(full?" full":"");sh.innerHTML=(full?"":`<div class="grab"></div>`)+html;
  bg.classList.add("open");document.body.classList.add("lock");
  const i=sh.querySelector("[autofocus]");if(i)i.focus({preventScroll:true});
}
function closeSheet(){
  if(UI.player){UI.player.stop();UI.player=null}
  if(UI.rec){try{UI.rec.abort()}catch(e){}UI.rec=null}
  if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
  bg.classList.remove("open");document.body.classList.remove("lock");sh.innerHTML="";render(true);
}
bg.addEventListener("click",e=>{if(e.target===bg)closeSheet()});
let tt;function toast(t,undo){const el=$("#toast");el.textContent=t;UI.undo=undo||null;
  if(undo){const b=document.createElement("button");b.textContent="Annuler";b.dataset.act="undo";el.appendChild(b);}
  el.classList.toggle("act",!!undo);el.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>{el.classList.remove("on","act");UI.undo=null},undo?5000:2200)}
const monthOpts=(sel)=>{const o=[];for(let i=-6;i<=2;i++)o.push(keyOffset(i));if(sel&&!o.includes(sel))o.push(sel);o.sort();return o.map(k=>`<option value="${k}" ${k===sel?"selected":""}>${esc(monthName(k))}${S.months[k]?" ✓":""}</option>`).join("")};

function sheetPay(key){
  key=key||keyOffset(0);const ex=S.months[key];
  openSheet(`<h2>💶 Ma paie</h2>
   <div class="field"><label>Paie de quel mois ?</label><select id="p_month">${monthOpts(key)}</select></div>
   <input id="p_sal" class="bigin" inputmode="decimal" placeholder="Salaire net" value="${ex&&!ex.manual?esc(ex.salary):""}" autofocus>
   <div class="brk card" id="p_brk" style="box-shadow:none;background:var(--card2);margin-top:12px"></div>
   ${carryHtml(key)}
   <button class="btn" data-act="savepay">Valider</button>
   <button class="btn ghost" style="margin-top:10px" data-act="manual" data-id="${esc(key)}">✍️ Saisir à la main (épargne / reste)</button>
   ${ex?`<button class="btn danger" style="margin-top:10px" data-act="delmonth" data-src="p_month">Supprimer ce mois</button>`:""}`);
  const upd=()=>{
    const s=num($("#p_sal").value),b=$("#p_brk");
    if(!s){b.innerHTML=`<div class="tip" style="margin:0">Tape ton salaire net, je calcule tout.</div>`;return}
    const c=compute(s);
    b.innerHTML=`<div class="it"><span>Salaire${c.extra?" + rentrées":""}</span><b>${fmt(c.income)}</b></div>
     <div class="it"><span>Charges fixes</span><b class="neg">−${fmt(c.charges)}</b></div>
     <div class="it"><span>Épargne</span><b class="pos">−${fmt(c.savings)}</b></div>
     ${S.pots.filter(p=>c.alloc[p.id]>0.005).map(p=>`<div class="it small muted"><span>↳ ${esc(p.e)} ${esc(p.n)}</span><span>${fmt(c.alloc[p.id])}</span></div>`).join("")}
     <div class="it tot"><span>Pour toi ce mois</span><span>${fmt(c.budget)}</span></div>`;
  };
  $("#p_sal").addEventListener("input",upd);
  $("#p_month").addEventListener("change",e=>{const v=S.months[e.target.value];$("#p_sal").value=v&&!v.manual?v.salary:"";upd();});
  upd();
}
/* reste de la paie précédente : on ne le perd pas */
function prevLeft(key){const pk=activeKey();if(!pk||pk===key||pk>key)return null;const pm=S.months[pk];if(!pm||pm.auto)return null;const l=leftOf(pm);return l>0.5?{k:pk,l}:null}
function carryHtml(key){const p=prevLeft(key);if(!p)return"";
  return `<div class="field"><label>Il te restait ${fmt(p.l)} de ta paie ${esc(monthName(p.k).toLowerCase())}. Tu en fais quoi ?</label><select id="p_carry"><option value="budget">Je l'ajoute à mon budget de ce mois</option>${S.pots.map(x=>`<option value="${esc(x.id)}">Je le mets dans ${esc(x.e)} ${esc(x.n)}</option>`).join("")}<option value="">Rien (je l'ai déjà dépensé)</option></select></div>`}
function sheetManual(key){
  key=key||keyOffset(-1);const ex=S.months[key];
  openSheet(`<h2>✍️ Saisie à la main</h2><div class="tip" style="margin:-4px 0 12px">Pour un mois hors règle : indique simplement ce que tu as mis de côté et ce qu'il te reste.</div>
   <div class="field"><label>Paie de quel mois ?</label><select id="m_month">${monthOpts(key)}</select></div>
   <div class="field"><label>Mis de côté (€)</label><input id="m_ep" inputmode="decimal" placeholder="0" value="${ex&&!ex.auto?esc(Math.round(ex.savings)):""}"></div>
   <div class="field"><label>Il me reste à dépenser (€)</label><input id="m_rest" inputmode="decimal" placeholder="500" value="${ex&&!ex.auto?esc(Math.round(leftOf(ex))):""}" autofocus></div>
   ${S.pots.length?`<div class="field"><label>L'épargne est allée dans…</label><select id="m_pot"><option value="">Répartir selon mes pots</option>${S.pots.map(p=>`<option value="${esc(p.id)}">${esc(p.e)} ${esc(p.n)}</option>`).join("")}</select></div>`:""}
   <button class="btn" data-act="savemanual">Valider</button>
   ${ex?`<button class="btn danger" style="margin-top:10px" data-act="delmonth" data-src="m_month">Supprimer ce mois</button>`:""}`);
}
/* choix de la date : aujourd'hui, hier, ou n'importe quel jour au calendrier */
const dayStr=n=>{const d=new Date(Date.now()-n*864e5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
function dateRow(){return `<div class="daterow" id="d_row"><button class="chip on" data-d="0">Aujourd'hui</button><button class="chip" data-d="1">Hier</button><label class="chip datechip">📅 <span id="d_lab">Autre date</span><input type="date" id="d_in" max="${dayStr(0)}"></label></div>`}
function bindDate(){
  sh.dataset.date=dayStr(0);const row=$("#d_row"),inp=$("#d_in");
  const mark=el=>row.querySelectorAll(".chip").forEach(x=>x.classList.toggle("on",x===el));
  row.addEventListener("click",e=>{const b=e.target.closest("[data-d]");if(!b)return;sh.dataset.date=dayStr(+b.dataset.d);$("#d_lab").textContent="Autre date";inp.value="";mark(b);});
  inp.addEventListener("change",()=>{if(!inp.value)return;const v=inp.value>dayStr(0)?dayStr(0):inp.value;sh.dataset.date=v;
    $("#d_lab").textContent=new Date(v+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"});mark(inp.parentElement);});
}
function pickedDate(){const d=sh.dataset.date;return !d||d===dayStr(0)?new Date().toISOString():new Date(d+"T12:00:00").toISOString()}
const accOf=id=>S.settings.accounts.find(a=>a.id===id);
function accRow(label,pre){
  const A=S.settings.accounts;if(!A.length)return"";
  const sel=pre&&accOf(pre)?pre:(accOf(S.lastAcc)?S.lastAcc:A[0].id);
  return `<div class="label" style="margin:4px 0 0">${label}</div><div class="chips" id="acc_c">${A.map(a=>`<button class="chip ${a.id===sel?"on":""}" data-acc="${esc(a.id)}">🏦 ${esc(a.n)}</button>`).join("")}<button class="chip ${sel==="none"?"on":""}" data-acc="">Aucun</button></div>`;
}
function bindAcc(){const r=$("#acc_c");if(!r)return;const on=r.querySelector(".chip.on");sh.dataset.acc=on?on.dataset.acc:"";
  r.addEventListener("click",e=>{const b=e.target.closest("[data-acc]");if(!b)return;sh.dataset.acc=b.dataset.acc;r.querySelectorAll(".chip").forEach(x=>x.classList.toggle("on",x===b));});}
function moveAcc(id,delta){const a=accOf(id);if(a)a.a=Math.round((num(a.a)+delta)*100)/100;}
function sheetExpense(prefill){
  let cat=(prefill&&prefill.c)||"sorties";
  openSheet(`<h2>➖ Nouvelle dépense</h2><input id="e_a" class="bigin" inputmode="decimal" placeholder="0 €" value="${prefill&&prefill.a?esc(prefill.a):""}" autofocus>
   ${dateRow()}
   <div class="chips" id="e_c">${CATS.map(c=>`<button class="chip ${c.id===cat?"on":""}" data-c="${c.id}">${c.e} ${c.n}</button>`).join("")}</div>
   ${accRow("Payé avec",prefill&&prefill.acc)}
   <div class="field"><input id="e_l" placeholder="Note (facultatif)" maxlength="60" value="${prefill&&prefill.l?esc(prefill.l):""}"></div><button class="btn" data-act="saveexp">Ajouter</button>`);
  sh.dataset.cat=cat;bindDate();bindAcc();
  $("#e_c").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(!b)return;sh.dataset.cat=b.dataset.c;sh.querySelectorAll("#e_c .chip").forEach(x=>x.classList.toggle("on",x===b));});
}
function sheetIncome(pre){
  const cat=(pre&&pre.c)||"business";
  openSheet(`<h2>➕ Entrée d'argent</h2><input id="i_a" class="bigin" inputmode="decimal" placeholder="0 €" value="${pre&&pre.a?esc(pre.a):""}" autofocus>
   ${dateRow()}
   <div class="label" style="margin:4px 0 0">C'est quoi ?</div>
   <div class="chips" id="i_c">${INC.map(c=>`<button class="chip ${c.id===cat?"on":""}" data-c="${c.id}">${c.e} ${c.n}</button>`).join("")}</div>
   <div class="field"><input id="i_l" placeholder="Note (facultatif) : nom du client, objet vendu…" maxlength="60"></div>
   ${accRow("Arrive sur")}
   <div class="label" style="margin:4px 0 0">À mettre de côté dans un pot ?</div>
   <div class="chips" id="i_to"><button class="chip on" data-to="">Non, dans mon budget</button>${S.pots.map(p=>`<button class="chip" data-to="${esc(p.id)}">${esc(p.e)} ${esc(p.n)}</button>`).join("")}</div>
   <button class="btn" data-act="saveinc">Ajouter</button>`);
  sh.dataset.to="";sh.dataset.cat=cat;bindDate();bindAcc();
  $("#i_c").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(!b)return;
    if(b.dataset.c==="salaire"){const v=$("#i_a").value;sheetPay();if(num(v)){$("#p_sal").value=v;$("#p_sal").dispatchEvent(new Event("input"))}toast("Salaire : Pécule calcule ton épargne");return}
    sh.dataset.cat=b.dataset.c;sh.querySelectorAll("#i_c .chip").forEach(x=>x.classList.toggle("on",x===b));});
  $("#i_to").addEventListener("click",e=>{const b=e.target.closest("[data-to]");if(!b)return;sh.dataset.to=b.dataset.to;sh.querySelectorAll("#i_to .chip").forEach(x=>x.classList.toggle("on",x===b));});
}
function sheetLiq(){
  const acc=S.settings.accounts.length?S.settings.accounts:[{n:"Compte courant",a:""},{n:"Livret A",a:""}];
  openSheet(`<h2>💧 Mes liquidités</h2><div class="tip" style="margin:-4px 0 12px">Le solde de chacun de tes comptes (compte courant, livrets, espèces…). Ensuite, choisis le compte quand tu notes une dépense ou une entrée : le solde se met à jour tout seul.</div>
   <div id="lq">${acc.map(a=>liqRow(a)).join("")}</div>
   <button class="btn ghost sm" data-act="liqadd">+ Ajouter un compte</button>
   <div class="row" style="margin:14px 0 4px"><span class="label">Total</span><b id="lqtot">${fmt(sum(acc,a=>a.a))}</b></div>
   <button class="btn" data-act="liqsave" style="margin-top:8px">Enregistrer</button>
   <div class="tip">Sans compte renseigné, Pécule estime tes liquidités : reste du mois + épargne.</div>`);
  $("#lq").addEventListener("input",()=>{$("#lqtot").textContent=fmt(sum([...sh.querySelectorAll(".lqa")],i=>i.value))});
}
const liqRow=a=>`<div class="f2" data-id="${esc(a.id||"")}"><input class="lqn" value="${esc(a.n)}" maxlength="30" placeholder="Nom du compte"><input class="lqa" inputmode="decimal" value="${esc(a.a)}" placeholder="0"><button class="x" data-act="liqdel">×</button></div>`;
function sheetPot(id){
  const p=S.pots.find(x=>x.id===id);if(!p)return;
  const mv=S.moves.filter(x=>x.p===id).slice(-5).reverse();
  openSheet(`<div class="row"><h2 style="margin:0">${esc(p.e)} ${esc(p.n)}</h2><button class="btn ghost sm" data-act="editpot" data-id="${esc(id)}">Modifier</button></div>
   <div class="big">${fmt(potBalance(id))}</div>
   <div class="seg" id="po_seg"><button data-s="1" class="on">＋ Ajouter</button><button data-s="-1">－ Retirer</button></div>
   <input id="po_a" class="bigin" inputmode="decimal" placeholder="0 €">
   <div class="field" style="margin-top:10px"><input id="po_l" placeholder="Note (ex. billets d'avion)" maxlength="60"></div>
   <button class="btn" data-act="savemove" data-id="${esc(id)}">Valider</button>
   ${mv.length?`<div class="sec">Derniers mouvements</div><div class="list">${mv.map(x=>`<div class="it"><div class="grow"><b>${esc(x.l||(x.a>0?"Ajout":"Retrait"))}</b><span>${new Date(x.d).toLocaleDateString("fr-FR")}</span></div><div class="amt ${x.a>0?"pos":"neg"}">${x.a>0?"+":"−"}${fmt(Math.abs(x.a))}</div><button class="x" data-act="delmove" data-id="${esc(x.id)}">×</button></div>`).join("")}</div>`:""}`);
  sh.dataset.sign="1";
  $("#po_seg").addEventListener("click",e=>{const b=e.target.closest("[data-s]");if(!b)return;sh.dataset.sign=b.dataset.s;sh.querySelectorAll("#po_seg button").forEach(x=>x.classList.toggle("on",x===b));});
}
function sheetEditPot(id){
  const p=id?S.pots.find(x=>x.id===id):{id:"",n:"",e:"💰",col:COLORS[S.pots.length%COLORS.length],goal:0,mode:"part",val:S.pots.length?0:100};
  if(!p)return;
  openSheet(`<h2>${id?"Modifier le pot":"Nouveau pot"}</h2>
   <div class="row" style="gap:8px;align-items:flex-end"><div class="field" style="width:80px"><label>Emoji</label><input id="pe_e" value="${esc(p.e)}" maxlength="4" style="text-align:center;font-size:22px"></div>
   <div class="field grow"><label>Nom</label><input id="pe_n" value="${esc(p.n)}" maxlength="30" placeholder="Ex. Bali" ${id?"":"autofocus"}></div></div>
   <div class="field"><label>Comment l'alimenter à chaque paie ?</label><div class="seg" id="pe_mode"><button data-m="part" class="${p.mode!=="fixe"?"on":""}">% de l'épargne</button><button data-m="fixe" class="${p.mode==="fixe"?"on":""}">Montant fixe</button></div>
   <input id="pe_v" inputmode="decimal" value="${esc(p.val)}"><div class="tip" id="pe_hint">${p.mode==="fixe"?"Euros par mois, versés en priorité.":"Part de ce qui reste de l'épargne après les montants fixes."}</div></div>
   <div class="field"><label>Objectif (€, facultatif)</label><input id="pe_g" inputmode="decimal" value="${esc(p.goal||"")}" placeholder="Ex. 2000"></div>
   <div class="chips" id="pe_col">${COLORS.map(c=>`<button class="chip ${c===p.col?"on":""}" data-col="${c}" style="width:36px;height:36px;padding:0;background:${c};border-color:${c===p.col?"var(--text)":c}"></button>`).join("")}</div>
   <button class="btn" data-act="savepot" data-id="${esc(id||"")}">Enregistrer</button>
   ${id?`<button class="btn danger" style="margin-top:10px" data-act="delpot" data-id="${esc(id)}">Supprimer ce pot</button>`:""}`);
  sh.dataset.mode=p.mode==="fixe"?"fixe":"part";sh.dataset.col=p.col;
  $("#pe_mode").addEventListener("click",e=>{const b=e.target.closest("[data-m]");if(!b)return;sh.dataset.mode=b.dataset.m;sh.querySelectorAll("#pe_mode button").forEach(x=>x.classList.toggle("on",x===b));$("#pe_hint").textContent=b.dataset.m==="fixe"?"Euros par mois, versés en priorité.":"Part de ce qui reste de l'épargne après les montants fixes.";});
  $("#pe_col").addEventListener("click",e=>{const b=e.target.closest("[data-col]");if(!b)return;sh.dataset.col=b.dataset.col;sh.querySelectorAll("#pe_col .chip").forEach(x=>{x.classList.toggle("on",x===b);x.style.borderColor=x===b?"var(--text)":x.dataset.col});});
}
function sheetLesson(id){
  const l=COURSES.list.find(x=>x.id===id);if(!l)return;
  const st=S.lessons[id]||{};const tips=st.tips||[];
  openSheet(`<div class="row" style="margin-bottom:12px"><button class="btn ghost sm" data-act="close">✕ Fermer</button><span class="small muted">${l.min} min</span></div>
   <div class="player" id="player"></div><h2>${l.e} ${esc(l.title)}</h2><div class="article">${l.body}</div>${toolsHtml(id)}
   <h3>✅ À faire</h3><div class="card" style="padding:4px 16px">${l.tips.map((t,i)=>`<div class="check ${tips.includes(i)?"on":""}" data-act="tiptoggle" data-id="${id}" data-i="${i}"><i>${tips.includes(i)?"✓":""}</i><span>${esc(t)}</span></div>`).join("")}</div>
   <button class="btn" data-act="lessondone" data-id="${id}" style="margin-top:6px">${st.done?"✓ Cours terminé":"J'ai terminé ce cours"}</button>`,true);
  if(COURSES.Player)UI.player=COURSES.Player($("#player"),l);
}
function toolsHtml(id){
  const l=COURSES.list.find(x=>x.id===id)||{},AFF=window.PECULE_AFFILIATES||{};
  const t=(l.tools||[]).concat((window.PECULE_TOOLS||[]).filter(x=>x&&x.lesson===id)).map(x=>{
    const u=AFF[x.n];return u&&/^https:\/\//.test(u)?Object.assign({},x,{url:u,aff:true}):x;});
  if(!t.length)return"";
  const item=x=>{const ok=/^https:\/\//.test(x.url||"");const inner=`<div class="emo">${esc(x.e||"🔗")}</div><div class="grow"><b style="white-space:normal">${esc(x.n)}</b><span>${esc(x.d||"")}${x.aff?" · <i>Lien partenaire</i>":""}</span></div>${ok?`<span class="muted" style="font-size:20px">›</span>`:""}`;
    return ok?`<a class="it" href="${esc(x.url)}" target="_blank" rel="noopener${x.aff?" sponsored":""}" style="color:inherit;text-decoration:none">${inner}</a>`:`<div class="it">${inner}</div>`;};
  return `<h3>🧰 Les solutions pour passer à l'action</h3><div class="card list" style="padding:4px 16px">${t.map(item).join("")}</div>`;
}
const TUTO=[
  ["👋","Bienvenue !","Pécule t'aide à savoir, à tout moment, combien tu peux encore dépenser. 30 secondes pour comprendre."],
  ["💶","1. Rentre ce qui arrive","Ta paie, un client, une vente… Dans « Entrées », tu notes l'argent qui rentre. Pour la paie, Pécule met ton épargne de côté tout seul."],
  ["➖","2. Note ce qui sort","Le bouton « − Dépense » : un montant, une catégorie, c'est fait en 2 gestes."],
  ["🎯","3. Ton reste à dépenser","La grande carte verte te dit ce qu'il te reste et combien par jour jusqu'à ta prochaine paie."],
  ["🪙","4. Tes pots","Un pot par objectif (vacances, urgence…). Ton épargne y est répartie automatiquement."],
  ["🎙️","Bonus","Dis « moins 12 kebab » ou « +250 Bali » avec le micro. Et l'onglet Apprendre te donne des astuces pour économiser."]
];
function sheetTuto(i){
  const t=TUTO[i],last=i===TUTO.length-1;
  openSheet(`<div class="tuto"><div class="steps">${TUTO.map((_,k)=>`<i class="${k<=i?"on":""}"></i>`).join("")}</div>
   <div class="tuto-e a-pop">${t[0]}</div><h2>${t[1]}</h2><p class="muted">${t[2]}</p>
   <button class="btn" data-act="${last?"close":"tuto"}" data-i="${i+1}">${last?"C'est parti 🚀":"Suivant"}</button>
   ${last?"":`<button class="link" data-act="close" style="color:var(--muted)">Passer le tutoriel</button>`}</div>`);
}
function sheetNewPassword(){
  openSheet(`<h2>🔑 Nouveau mot de passe</h2><div class="field"><input id="np" type="password" autocomplete="new-password" minlength="6" autofocus></div><button class="btn" data-act="setpw">Enregistrer</button><div class="tip" id="npmsg"></div>`);
}

/* ================= Commande vocale ================= */
const WORDS={zero:0,un:1,une:1,deux:2,trois:3,quatre:4,cinq:5,six:6,sept:7,huit:8,neuf:9,dix:10,onze:11,douze:12,treize:13,quatorze:14,quinze:15,seize:16,vingt:20,trente:30,quarante:40,cinquante:50,soixante:60,cent:100,cents:100,mille:1000};
function wordsToNum(tokens){
  let total=0,cur=0,found=false,used=[];
  tokens.forEach((t,i)=>{
    const parts=t.split("-");let ok=true;
    parts.forEach(p=>{if(p==="et")return;if(!(p in WORDS)){ok=false;return}found=true;const v=WORDS[p];
      if(v===100){cur=(cur||1)*100}else if(v===1000){total+=(cur||1)*1000;cur=0}else cur+=v;});
    if(ok&&(parts.some(p=>p in WORDS)||t==="et"&&found))used.push(i);
  });
  return found?{v:total+cur,used}:null;
}
const PLUS=["+","plus","ajoute","ajouter","ajouté","rajoute","rajouter","mets","met","mettre","verse","verser","depose","deposer","epargne","credite"];
const MINUS=["-","moins","retire","retirer","enleve","enlever","sors","sortir","depense","depenser","paye","payer","paie","debite","achete","achat"];
const FILLER=["euro","euros","eur","€","dans","sur","le","la","les","l","pot","dossier","enveloppe","du","de","des","d","au","aux","a","pour","en","mon","ma","mes","j","ai","je","stp","s'il","te","plait","et"];
function parseCommand(raw){
  let t=norm(raw).replace(/(\d)\s+(\d{3})\b/g,"$1$2").replace(/([+\-])(\d)/g,"$1 $2").replace(/(\d)(euros?|€)/g,"$1 $2");
  let toks=t.split(" ").filter(Boolean);
  let sign=0;
  toks=toks.filter(w=>{if(PLUS.includes(w)){if(!sign)sign=1;return false}if(MINUS.includes(w)){if(!sign)sign=-1;return false}return true});
  let amount=null;
  const ni=toks.findIndex(w=>/^\d+([.,]\d+)?$/.test(w));
  if(ni>=0){amount=num(toks[ni]);toks.splice(ni,1);}
  else{const r=wordsToNum(toks);if(r){amount=r.v;toks=toks.filter((_,i)=>!r.used.includes(i));}}
  toks=toks.filter(w=>!FILLER.includes(w)&&!/^\d/.test(w));
  let target=toks.join(" ").trim();
  if(!amount||amount<=0)return{err:"Je n'ai pas compris le montant."};
  let best=null,bs=0;
  S.pots.forEach(p=>{const pn=norm(p.n);const pt=pn.split(" ").filter(w=>w.length>1&&!FILLER.includes(w));
    let sc=0;if(target&&pn===target)sc=10;else if(target&&(pn.includes(target)||target.includes(pn)))sc=6;
    else pt.forEach(w=>{if(toks.some(x=>x===w))sc+=3;else if(toks.some(x=>x.length>2&&(w.startsWith(x)||x.startsWith(w))))sc+=1;});
    if(sc>bs){bs=sc;best=p}});
  if(best)return{type:"pot",pot:best,a:amount,sign:sign||1};
  const cap=t=>t?t.charAt(0).toUpperCase()+t.slice(1):t;
  if(sign===1){const ic=INC.find(c=>c.syn.some(x=>toks.includes(x)))||incOf("autre");return{type:"inc",a:amount,c:ic.id,l:cap(target),sign:1};}
  const cat=CATS.find(c=>target&&(norm(c.n)===target||c.syn.some(s=>toks.includes(s)||target.includes(s))))||catOf("autre");
  return{type:"exp",a:amount,c:cat.id,l:cap(target||""),sign:-1};
}
function describe(r){
  if(r.err)return r.err;
  if(r.type==="pot")return `${r.sign>0?"Ajouter":"Retirer"} ${fmt(r.a)} ${r.sign>0?"dans":"de"} ${r.pot.e} ${r.pot.n}`;
  if(r.type==="inc")return `Entrée de ${fmt(r.a)} · ${incOf(r.c).e} ${incOf(r.c).n}${r.l?" ("+r.l+")":""}`;
  return `Dépense de ${fmt(r.a)} · ${catOf(r.c).e} ${catOf(r.c).n}${r.l&&r.c!=="autre"?" ("+r.l+")":""}`;
}
function applyCommand(r){
  if(!r||r.err)return false;
  if(r.type==="pot"){S.moves.push({id:uid(),p:r.pot.id,a:r.sign*r.a,d:new Date().toISOString(),l:"🎙️ Vocal"});commit({force:true});toast(`${r.sign>0?"+":"−"}${fmt(r.a)} · ${r.pot.n} = ${fmt(potBalance(r.pot.id))}`);return true}
  const k=ensureMonth(),m=S.months[k];
  if(r.type==="inc"){m.inc=(m.inc||[]).concat([{id:uid(),a:r.a,c:r.c,l:r.l,d:new Date().toISOString()}]);commit({force:true});toast(`+${fmt(r.a)} · reste ${fmt(leftOf(m))}`);return true}
  const acc=accOf(S.lastAcc)?S.lastAcc:"";if(acc)moveAcc(acc,-r.a);
  m.exp=(m.exp||[]).concat([{id:uid(),a:r.a,c:r.c,l:r.l,d:new Date().toISOString(),acc}]);commit({force:true});
  toast(m.auto?`−${fmt(r.a)} noté`:`−${fmt(r.a)} · reste ${fmt(leftOf(m))}`);return true;
}
function sheetVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  openSheet(`<h2 style="text-align:center">🎙️ Commande vocale</h2>
   ${SR?`<button class="mic" id="micb" data-act="mic">🎙️</button>`:""}
   <div class="heard" id="heard">${SR?"Appuie et parle":""}</div>
   <div class="row" style="gap:8px"><input id="vtxt" placeholder="Ou écris : +250 Bali" autocomplete="off" ${SR?"":"autofocus"}><button class="btn sm" data-act="vparse">OK</button></div>
   <div id="vprev"></div>
   <div class="tip"><b>Exemples :</b><br>« +250 euros Bali » → ajoute au pot Bali<br>« moins 100 Bali » → retire du pot<br>« moins 12 kebab » → dépense Bouffe<br>« +30 client » → rentrée dans ton budget<br>${SR?"":"Astuce : utilise le 🎤 du clavier pour dicter."}</div>`);
  if(SR)startRec();
}
function showPreview(text){
  const r=parseCommand(text);UI.vcmd=r;
  $("#vprev").innerHTML=`<div class="preview ${r.err?"bad":""}">${esc(describe(r))}</div>${r.err?"":`<button class="btn" data-act="vok">Confirmer</button>`}`;
}
function startRec(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  try{
    const rec=new SR();UI.rec=rec;rec.lang="fr-FR";rec.interimResults=true;rec.maxAlternatives=1;rec.continuous=false;
    const mic=$("#micb"),h=$("#heard");let final="";
    rec.onstart=()=>{mic&&mic.classList.add("rec");h.textContent="J'écoute…";};
    rec.onresult=e=>{let s="";for(let i=0;i<e.results.length;i++)s+=e.results[i][0].transcript;h.textContent="« "+s+" »";final=s;};
    rec.onerror=e=>{mic&&mic.classList.remove("rec");h.textContent=e.error==="not-allowed"||e.error==="service-not-allowed"?"Micro refusé : écris la commande ou utilise le 🎤 du clavier.":"Je n'ai rien entendu. Réessaie.";};
    rec.onend=()=>{mic&&mic.classList.remove("rec");UI.rec=null;if(final){$("#vtxt").value=final;showPreview(final);}};
    rec.start();
  }catch(e){const h=$("#heard");if(h)h.textContent="Micro indisponible : écris la commande.";}
}

/* ================= Actions ================= */
function setPath(path,val){const p=path.split(".");let o=S;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=val;}
let editTimer;
document.addEventListener("input",e=>{
  const t=e.target;if(!app.contains(t))return;
  if(t.dataset.k){setPath(t.dataset.k,t.dataset.num?parseInt(t.value):t.value);}
  else if(t.dataset.l){S.settings[t.dataset.l][+t.dataset.i][t.dataset.f]=t.value;}
  else return;
  clearTimeout(editTimer);editTimer=setTimeout(()=>{normalizeSettings();commit({noRender:true});},400);
});
document.addEventListener("change",e=>{const t=e.target;
  if(t.id==="importf"&&t.files[0]){const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!o||!o.settings)throw 0;S=sanitize(o);commit({force:true});toast("Sauvegarde importée ✅")}catch(x){toast("Fichier invalide")}};r.readAsText(t.files[0]);t.value="";}
  else if(t.tagName==="SELECT"&&app.contains(t)){t.blur();render(true);}
});
document.addEventListener("focusout",e=>{if(app.contains(e.target))setTimeout(()=>{const a=document.activeElement;if(!a||!app.contains(a)||!/INPUT|TEXTAREA|SELECT/.test(a.tagName))render(true)},60)});
function normalizeSettings(){
  const st=S.settings;st.avgSalary=num(st.avgSalary);["base","seuil","bonus"].forEach(k=>st.rule[k]=num(st.rule[k]));
  ["incomes","charges","accounts"].forEach(l=>st[l].forEach(r=>{r.a=num(r.a)}));
}
document.addEventListener("submit",e=>{if(e.target.id==="authf"){e.preventDefault();doAuth()}});
sh.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.tagName==="INPUT"){const b=sh.querySelector(e.target.id==="vtxt"?"[data-act=vparse]":".btn[data-act^='save']");if(b){e.preventDefault();b.click()}}});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&bg.classList.contains("open"))return closeSheet();
  if(e.metaKey||e.ctrlKey||e.altKey||!S.onboarded||bg.classList.contains("open"))return;
  const t=e.target;if(t&&/INPUT|TEXTAREA|SELECT/.test(t.tagName))return;
  const k=e.key.toLowerCase();
  if(k==="d"||k==="-"){e.preventDefault();sheetExpense()}
  else if(k==="e"||k==="+"){e.preventDefault();sheetIncome()}
  else if(k==="p"){e.preventDefault();sheetPay()}
  else if(k==="v"){e.preventDefault();sheetVoice()}
  else if(/^[1-5]$/.test(k)){UI.tab=["home","spend","inc","pots","learn"][+k-1];window.scrollTo(0,0);render(true)}
});
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(!b)return;
  if(UI.tab===b.dataset.tab){window.scrollTo({top:0,behavior:"smooth"});return}UI.tab=b.dataset.tab;window.scrollTo(0,0);render(true);});

document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act,id=b.dataset.id;
  switch(a){
  case"close":return closeSheet();
  case"tab":UI.tab=b.dataset.t;window.scrollTo(0,0);return render(true);
  case"authmode":UI.authMode=b.dataset.m;return render(true);
  case"skipauth":UI.authOpen=false;return render(true);
  case"gologin":UI.authOpen=true;UI.authMode="login";return render(true);
  case"wauth":{UI.pendingName=($("#w_name")||{}).value||"";
    if(!UI.cloud){toast("Les comptes seront actifs dès la mise en ligne. En attendant : « Poursuivre sans connexion ».");return}
    UI.authMode=b.dataset.m;UI.authOpen=true;return render(true)}
  case"wguest":{S.name=(($("#w_name")||{}).value||"").trim();enterApp(true);return}
  case"tuto":return sheetTuto(+b.dataset.i||0);
  case"forgot":{const em=$("#a_email").value.trim();if(!em){$("#authmsg").textContent="Entre ton e-mail d'abord.";return}
    try{const{error}=await sb.auth.resetPasswordForEmail(em,{redirectTo:location.origin+location.pathname});if(error)throw error;$("#authmsg").textContent="📩 E-mail envoyé pour réinitialiser ton mot de passe."}catch(x){$("#authmsg").textContent=authErr(x)}return}
  case"setpw":{const pw=$("#np").value;if(pw.length<6){$("#npmsg").textContent="6 caractères minimum.";return}
    const{error}=await sb.auth.updateUser({password:pw});if(error){$("#npmsg").textContent=authErr(error);return}closeSheet();toast("Mot de passe changé ✅");return}
  case"logout":if(sb){await pushRemote();await sb.auth.signOut();}UI.authOpen=false;UI.tab="home";return render(true);
  /* onboarding */
  case"obnext":normalizeSettings();S.obStep=(S.obStep||0)+1;commit({force:true});return window.scrollTo(0,0);
  case"obskip":{S.settings.charges=[];if(!S.pots.length)S.pots=[{id:uid(),n:"Épargne",e:"🪙",col:COLORS[0],goal:0,mode:"part",val:100}];
    S.onboarded=true;UI.tab="home";commit({force:true});window.scrollTo(0,0);toast("C'est parti 🚀 Tu régleras le reste dans 👤");return}
  case"obprev":S.obStep=Math.max(0,(S.obStep||0)-1);commit({force:true});return;
  case"obpot":{const n=b.dataset.n,l=UI.draftPots;const i=l.indexOf(n);if(i>=0)l.splice(i,1);else l.push(n);return render(true)}
  case"obaddpot":{const v=$("#ob_custom").value.trim();if(!v)return;if(!UI.draftPots.includes(v))UI.draftPots.push(v);return render(true)}
  case"obfinish":{
    normalizeSettings();const sel=UI.draftPots&&UI.draftPots.length?UI.draftPots:["Fonds d'urgence"];
    const keep=S.pots.filter(p=>sel.includes(p.n));
    sel.forEach((n,i)=>{if(!keep.some(p=>p.n===n)){const pr=POT_PRESETS.find(p=>p.n===n);keep.push({id:uid(),n,e:pr?pr.e:"⭐",col:pr?pr.col:COLORS[i%COLORS.length],goal:0,mode:"part",val:0});}});
    const sh_=Math.floor(100/keep.length);keep.forEach((p,i)=>{if(p.mode!=="fixe")p.val=i===0?100-sh_*(keep.length-1):sh_});
    S.pots=keep;S.settings.charges=S.settings.charges.filter(c=>num(c.a)>0);S.settings.incomes=S.settings.incomes.filter(c=>num(c.a)>0);
    S.onboarded=true;UI.tab="home";commit({force:true});window.scrollTo(0,0);toast("Ton budget est prêt 🎉");return}
  case"addrow":S.settings[b.dataset.l].push({id:uid(),n:b.dataset.l==="charges"?"Nouvelle charge":"Nouvelle rentrée",a:0});return commit({force:true});
  case"delrow":S.settings[b.dataset.l].splice(+b.dataset.i,1);return commit({force:true});
  /* paie */
  case"pay":return sheetPay();
  case"editmonth":{const m=S.months[id];if(!id)return sheetPay();return m&&m.manual?sheetManual(id):sheetPay(id)}
  case"manual":return sheetManual(id||null);
  case"savepay":{const k=$("#p_month").value,s=num($("#p_sal").value);if(s<=0){toast("Entre ton salaire net");return}
    const carrySel=$("#p_carry")?$("#p_carry").value:"";const prev=prevLeft(k);
    const c=compute(s),old=S.months[k];S.months[k]=Object.assign(c,{manual:false,exp:old&&old.exp?old.exp:[],inc:old&&old.inc?old.inc:[],at:new Date().toISOString()});
    absorbAuto(k);
    if(prev&&carrySel){const pm=S.months[prev.k],d=new Date().toISOString();pm.exp=(pm.exp||[]).concat([{id:uid(),a:prev.l,c:"autre",l:"Report vers la paie suivante",d,carry:true}]);
      if(carrySel==="budget")S.months[k].inc=(S.months[k].inc||[]).concat([{id:uid(),a:prev.l,l:"Reste de la paie précédente",d,carry:true}]);
      else S.moves.push({id:uid(),p:carrySel,a:prev.l,d,l:"Reste de "+monthName(prev.k).toLowerCase()});}
    closeSheet();commit({force:true});toast(`Paie enregistrée ✅ ${fmt(c.savings)} épargnés`);return}
  case"savemanual":{const k=$("#m_month").value,ep=Math.max(0,num($("#m_ep").value)),rest=num($("#m_rest").value),pt=$("#m_pot")?$("#m_pot").value:"";
    const alloc=pt?{[pt]:ep}:allocate(ep),old=S.months[k];
    S.months[k]={manual:true,salary:0,extra:0,income:0,charges:0,savings:ep,alloc,budget:0,exp:old&&old.exp?old.exp:[],inc:old&&old.inc?old.inc:[],at:new Date().toISOString()};
    absorbAuto(k);const nm=S.months[k];nm.budget=rest+spent(nm)-incSum(nm); /* "il me reste" = maintenant, mouvements déjà inclus */closeSheet();commit({force:true});toast("Enregistré ✅ reste "+fmt(leftOf(S.months[k])));return}
  case"delmonth":{const k=$("#"+(b.dataset.src||"p_month")).value;if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Appuie encore pour confirmer";return}
    delete S.months[k];closeSheet();commit({force:true});toast("Mois supprimé");return}
  /* dépenses */
  case"expense":return sheetExpense();
  case"saveexp":{const v=num($("#e_a").value);if(v<=0){toast("Entre un montant");return}const k=ensureMonth(),m=S.months[k];
    const acc=sh.dataset.acc||"";if(acc){moveAcc(acc,-v);S.lastAcc=acc;}
    m.exp=(m.exp||[]).concat([{id:uid(),a:v,c:sh.dataset.cat||"autre",l:$("#e_l").value.trim(),d:pickedDate(),acc}]);
    closeSheet();commit({force:true});toast(acc&&accOf(acc)?`−${fmt(v)} · ${accOf(acc).n} : ${fmt(accOf(acc).a)}`:m.auto?`−${fmt(v)} noté`:`−${fmt(v)} · reste ${fmt(leftOf(m))}`);return}
  case"income":return sheetIncome();
  case"liq":return sheetLiq();
  case"liqadd":$("#lq").insertAdjacentHTML("beforeend",liqRow({n:"",a:""}));return;
  case"liqdel":b.parentElement.remove();$("#lqtot").textContent=fmt(sum([...sh.querySelectorAll(".lqa")],i=>i.value));return;
  case"liqsave":{const rows=[...sh.querySelectorAll("#lq .f2")].map(r=>({id:r.dataset.id||uid(),n:r.querySelector(".lqn").value.trim(),a:num(r.querySelector(".lqa").value)})).filter(r=>r.n||r.a!==0);
    rows.forEach(r=>{if(!r.n)r.n="Compte"});S.settings.accounts=rows;closeSheet();commit({force:true});toast("Liquidités à jour ✅");return}
  case"saveinc":{const v=num($("#i_a").value);if(v<=0){toast("Entre un montant");return}const c=sh.dataset.cat||"autre",l=$("#i_l").value.trim(),to=sh.dataset.to,acc=sh.dataset.acc||"";
    if(acc){moveAcc(acc,v);S.lastAcc=acc;}
    if(to){S.moves.push({id:uid(),p:to,a:v,c,d:pickedDate(),l:l||incOf(c).n,acc});closeSheet();commit({force:true});toast(`+${fmt(v)} · ${S.pots.find(p=>p.id===to).n}`);return}
    const k=ensureMonth(),m=S.months[k];m.inc=(m.inc||[]).concat([{id:uid(),a:v,c,l,d:pickedDate(),acc}]);
    closeSheet();commit({force:true});toast(m.auto?`+${fmt(v)} noté`:`+${fmt(v)} · reste ${fmt(leftOf(m))}`);return}
  case"style":return setStyle(b.dataset.m);
  case"pal":return setPal(b.dataset.m);
  case"showstart":S.hideStart=false;UI.tab="home";commit({force:true});window.scrollTo(0,0);return;
  case"theme":return setTheme(b.dataset.m||(document.documentElement.dataset.theme==="dark"?"light":"dark"));
  case"copylink":{const t=location.origin+location.pathname+"?add=[Montant]&m=[Commerçant]&card=[Carte]";try{await navigator.clipboard.writeText(t);toast("Lien copié ✅")}catch(x){toast("Sélectionne le lien et copie-le")}return}
  case"undo":{const f=UI.undo;UI.undo=null;$("#toast").classList.remove("on","act");if(f)f();return}
  case"gome":UI.tab="me";window.scrollTo(0,0);return render(true);
  case"hidestart":S.hideStart=true;return commit({force:true});
  case"delinc":{const k=activeKey(),m=S.months[k];if(!m)return;const it=(m.inc||[]).find(x=>x.id===id);if(!it)return;m.inc=m.inc.filter(x=>x.id!==id);if(it.acc)moveAcc(it.acc,-it.a);commit({force:true});
    toast("Entrée supprimée",()=>{m.inc.push(it);if(it.acc)moveAcc(it.acc,it.a);commit({force:true})});return}
  case"delexp":{const k=activeKey(),m=S.months[k];if(!m)return;const ex=m.exp.find(x=>x.id===id);if(!ex)return;m.exp=m.exp.filter(x=>x.id!==id);if(ex.acc)moveAcc(ex.acc,ex.a);commit({force:true});
    toast("Dépense supprimée",()=>{m.exp.push(ex);if(ex.acc)moveAcc(ex.acc,-ex.a);commit({force:true})});return}
  /* pots */
  case"pot":return sheetPot(id);
  case"newpot":return sheetEditPot(null);
  case"editpot":return sheetEditPot(id);
  case"savepot":{const n=$("#pe_n").value.trim();if(!n){toast("Donne un nom au pot");return}
    const data={n,e:$("#pe_e").value.trim()||"💰",mode:sh.dataset.mode,val:num($("#pe_v").value),goal:num($("#pe_g").value),col:sh.dataset.col};
    if(id){Object.assign(S.pots.find(p=>p.id===id),data)}else S.pots.push(Object.assign({id:uid()},data));
    closeSheet();commit({force:true});toast("Pot enregistré ✅");return}
  case"delpot":{if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent=`Supprimer (${fmt(potBalance(id))} perdus du suivi) ?`;return}
    S.pots=S.pots.filter(p=>p.id!==id);S.moves=S.moves.filter(x=>x.p!==id);closeSheet();commit({force:true});toast("Pot supprimé");return}
  case"savemove":{const v=num($("#po_a").value);if(v<=0){toast("Entre un montant");return}const s=+sh.dataset.sign||1;
    S.moves.push({id:uid(),p:id,a:s*v,d:new Date().toISOString(),l:$("#po_l").value.trim()});closeSheet();commit({force:true});
    toast(`${s>0?"+":"−"}${fmt(v)} · ${S.pots.find(p=>p.id===id).n}`);return}
  case"delmove":{const mv=S.moves.find(x=>x.id===id);S.moves=S.moves.filter(x=>x.id!==id);commit({noRender:true});const pid=mv&&mv.p;closeSheet();if(pid)sheetPot(pid);return}
  /* voix */
  case"voice":return sheetVoice();
  case"mic":if(UI.rec){try{UI.rec.stop()}catch(x){}return}return startRec();
  case"vparse":{const v=$("#vtxt").value.trim();if(v)showPreview(v);return}
  case"vok":if(applyCommand(UI.vcmd))closeSheet();return;
  /* cours */
  case"lesson":return sheetLesson(id);
  case"tiptoggle":{const st=S.lessons[id]||(S.lessons[id]={tips:[]});st.tips=st.tips||[];const i=+b.dataset.i;const j=st.tips.indexOf(i);if(j>=0)st.tips.splice(j,1);else st.tips.push(i);
    b.classList.toggle("on",j<0);b.querySelector("i").textContent=j<0?"✓":"";commit({noRender:true});return}
  case"lessondone":{const st=S.lessons[id]||(S.lessons[id]={tips:[]});st.done=!st.done;commit({noRender:true});b.textContent=st.done?"✓ Cours terminé":"J'ai terminé ce cours";if(st.done)toast("Bravo 🎉");return}
  /* sauvegarde */
  case"export":{const data=JSON.stringify(S,null,1);
    try{const blob=new Blob([data],{type:"application/json"});const u=URL.createObjectURL(blob);const l=document.createElement("a");l.href=u;l.download="pecule-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}catch(x){}
    try{await navigator.clipboard.writeText(data);toast("Sauvegarde téléchargée et copiée ✅")}catch(x){toast("Sauvegarde téléchargée ✅")}return}
  case"reset":{if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="⚠️ Appuie encore : tout sera effacé";return}
    S=emptyState();UI.draftPots=null;commit({force:true});toast("Données effacées");return}
  }
});

/* ================= Démarrage ================= */
function handleLink(){
  try{
    const q=new URLSearchParams(location.search);const a=num(q.get("add")||q.get("inc"));if(!a)return;
    const isInc=q.has("inc"),m=(q.get("m")||"").slice(0,60),card=norm(q.get("card")||"");
    history.replaceState(null,"",location.pathname);
    if(!S.onboarded)return;
    const acc=card?S.settings.accounts.find(x=>{const n=norm(x.n);return n&&(card.includes(n)||n.includes(card))}):null;
    const cat=CATS.find(c=>c.syn.some(w=>norm(m).includes(w)));
    setTimeout(()=>{isInc?sheetIncome({a}):sheetExpense({a:Math.abs(a),l:m,acc:acc&&acc.id,c:cat?cat.id:"autre"});toast("Paiement détecté : vérifie puis valide");},400);
  }catch(e){}
}
async function start(){
  S=sanitize(loadLocal(storeKey));
  if(CFG.supabaseUrl&&CFG.supabaseAnonKey){
    /* attend la session (6 s max, ex. hors connexion) pour éviter un écran qui clignote */
    await Promise.race([initCloud(),new Promise(r=>setTimeout(r,6000))]);
  }
  UI.ready=true;render(true);handleLink();
  if("serviceWorker" in navigator&&location.protocol==="https:"&&!location.hostname.endsWith("claude.ai")&&!location.hostname.endsWith("claudeusercontent.com")){
    try{navigator.serviceWorker.register("sw.js")}catch(e){}
  }
}
start();
})();
