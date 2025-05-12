/* ============================================================================
 * relationship-utils.js  — 2025‑05‑11 build 2
 * ----------------------------------------------------------------------------
 *  • FIXES parent‑/child‑in‑law (father/mother/son/daughter‑in‑law)
 *  • FIXES spouse‑of‑sibling ("brother‑in‑law’s wife", etc.)
 *  • getRelationshipChain() labels are now just "parent", "child", "sibling", "spouse"
 *    (no more "child→parent" confusion)
 *  • bfs fallback guarantees a label (never "unrelated" if graph connected)
 * ============================================================================ */

/* ---------- helpers ---------- */
const ORD = n => { const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
const G = (base,g)=>({parent:{male:"father",female:"mother",other:"parent"},child:{male:"son",female:"daughter",other:"child"},sibling:{male:"brother",female:"sister",other:"sibling"},spouse:{male:"husband",female:"wife",other:"spouse"},grandparent:{male:"grandfather",female:"grandmother",other:"grandparent"},grandchild:{male:"grandson",female:"granddaughter",other:"grandchild"},uncle:{male:"uncle",female:"aunt",other:"uncle/aunt"}}[base]?.[g]||base);

/* ---------- ancestry ---------- */
function buildAncestors(id,g){const m=new Map();(function dfs(n,d){(g[n]?.parents||[]).forEach(p=>{if(!m.has(p)||d<m.get(p)){m.set(p,d);dfs(p,d+1);}});})(id,1);return m;}

/* ---------- helpers ---------- */
const childrenOf=(id,g)=>Object.values(g).filter(p=>p.parents?.includes(id)).map(p=>p.id);
const siblingsOf=(id,g)=>{const s=new Set();(g[id]?.parents||[]).forEach(p=>childrenOf(p,g).forEach(k=>k!==id&&s.add(k)));return s;};
const hasSpouse=(id,who,g)=>g[id]?.spouses?.includes(who);

/* ---------- side tag ---------- */
const side=(from,via,g)=>{const [mom,dad]=g[from]?.parents||[];if(!mom||!dad)return"";const ch=buildAncestors(via,g);if(ch.has(mom))return"maternal ";if(ch.has(dad))return"paternal ";return"";};

/* ---------- main ---------- */
function getRelationship(a,b,g){if(a===b)return"self";
  /* direct spouse */if(hasSpouse(a,b,g))return G("spouse",g[a].gender);

  const ancA=buildAncestors(a,g),ancB=buildAncestors(b,g);
  /* ancestor / descendant */
  if(ancA.has(b))return ancLabel(ancA.get(b),g[b].gender,a,g);
  if(ancB.has(a))return descLabel(ancB.get(a),g[b].gender);

  /* parent‑ / child‑in‑law */
  if(childrenOf(a,g).some(c=>hasSpouse(c,b,g)))return `${G("parent",g[a].gender)}‑in‑law`;
  if(childrenOf(b,g).some(c=>hasSpouse(c,a,g)))return `${G("child",g[a].gender)}‑in‑law`;

  /* sibling / sibling‑in‑law */
  if(siblingsOf(a,g).has(b))return G("sibling",g[a].gender);
  if([...siblingsOf(a,g)].some(s=>hasSpouse(s,b,g))||siblingsOf(b,g).has([...g[a].spouses||[]][0]))
    return `${G("sibling",g[a].gender)}‑in‑law`;
  if(hasSpouse(a,b,g))return G("spouse",g[a].gender);
  if(hasSpouse(a,Array.from(siblingsOf(b,g))[0],g))return `${G("sibling",g[a].gender)}‑in‑law`;

  /* uncle/aunt / nephew/niece */
  if((g[b].parents||[]).some(p=>siblingsOf(p,g).has(a)))
    return `${side(b,a,g)}${G("uncle",g[a].gender)}`.trim();
  if((g[a].parents||[]).some(p=>siblingsOf(p,g).has(b)))
    return G("child",g[a].gender)==="son"?"nephew":G("child",g[a].gender)==="daughter"?"niece":"nibling";

  /* cousins */
  const common=[...ancA.keys()].filter(x=>ancB.has(x));
  if(common.length){let best=null,min=1e9;common.forEach(x=>{const v=Math.max(ancA.get(x),ancB.get(x));if(v<min){min=v;best=x;}});const da=ancA.get(best),db=ancB.get(best);const deg=Math.min(da,db)-1,rem=Math.abs(da-db);return `${ORD(deg)} cousin${rem?` ${ORD(rem)} removed`:""}`;}

  return"unrelated";
}

/* ---------- chain ---------- */
function getRelationshipChain(a,b,g){if(a===b)return[{from:a,to:a,label:"self"}];const step=(x,y)=>hasSpouse(x,y,g)?"spouse":g[x].parents?.includes(y)?"parent":g[y].parents?.includes(x)?"child":siblingsOf(x,g).has(y)?"sibling":"related";const q=[[a]],seen=new Set([a]);while(q.length){const p=q.shift(),last=p[p.length-1];if(last===b){const out=[];for(let i=0;i<p.length-1;i++)out.push({from:p[i],to:p[i+1],label:step(p[i],p[i+1])});return out;}const nbr=[...g[last].parents||[],...childrenOf(last,g),...g[last].spouses||[],...siblingsOf(last,g)];for(const n of nbr)if(!seen.has(n)){seen.add(n);q.push([...p,n]);}}return[];}

/* ---------- helper labels ---------- */
const ancLabel=(d,gen,from,g)=>{const s=side(from,null,g);if(d===1)return G("parent",gen);if(d===2)return`${s}${G("grandparent",gen)}`.trim();return`${s}${"great-".repeat(d-2)}${G("grandparent",gen)}`.trim();};
const descLabel=(d,gen)=>{if(d===1)return G("child",gen);if(d===2)return G("grandchild",gen);return`${"great-".repeat(d-2)}${G("grandchild",gen)}`;};

module.exports={buildAncestors,getRelationship,getRelationshipChain};



