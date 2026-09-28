// VCA-VOL Oefenplein — app-logica
(function(){
"use strict";
try{ document.documentElement.lang="nl"; }catch(e){}

const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const LET="ABCD";

const LS=window.VCA_LESSTOF||{MODS:[],DIAG:{}};
const MODS=LS.MODS, DIAG=LS.DIAG;
const MOD=Object.fromEntries(MODS.map(m=>[m.id,m]));
const BORDEN=window.VCA_BORDEN||null;
const SCENES=window.VCA_SCENES||[];

// Vragenbank: [mod, vraag, [juist, fout...], uitleg] — juiste antwoord staat op positie 0.
const cnt={};
const QS=(window.VCA_VRAGEN||[]).filter(r=>Array.isArray(r)&&MOD[r[0]]).map(([m,q,o,u])=>{cnt[m]=(cnt[m]||0)+1;return {id:m+"-"+cnt[m],m,q,o,u};});
const QBYID=Object.fromEntries(QS.map(q=>[q.id,q]));
const prep=q=>({...q,opts:shuffle(q.o.map((t,i)=>({t,ok:i===0})))});
const nQ=m=>QS.filter(q=>q.m===m).length;

// ---------- Opslag (alleen in deze browser) ----------
const KEY="vca-vol-oefenplein.v1";
const S=(()=>{let d={};try{d=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){}return Object.assign({read:{},stats:{},wrong:[],exams:[],found:{}},d);})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};
function record(q,ok){
  const s=S.stats[q.m]||(S.stats[q.m]={g:0,n:0}); s.n++; if(ok) s.g++;
  const w=new Set(S.wrong); if(ok) w.delete(q.id); else w.add(q.id); S.wrong=[...w].filter(id=>QBYID[id]);
}
const pctOf=s=>s&&s.n?Math.round(s.g/s.n*100):null;

// ---------- Navigatie ----------
const TABS=["leren","borden","spotten","oefenen","examen"];
let tab="leren";
function show(t,noScroll){
  if(!TABS.includes(t)) t="leren";
  tab=t;
  TABS.forEach(x=>{$("#v-"+x).hidden=x!==t;const b=$(`.tab[data-arg="${x}"]`);if(b){if(x===t)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");}});
  try{history.replaceState(null,"","#"+t);}catch(e){}
  RENDER[t]();
  if(!noScroll) window.scrollTo(0,0);
}
function renderHeader(){
  const r=MODS.filter(m=>S.read[m.id]).length;
  const n=Object.values(S.stats).reduce((a,s)=>a+s.n,0);
  $("#hdr-prog").innerHTML=`<b>${r}</b>/${MODS.length} onderwerpen gelezen · <b>${n}</b> antwoorden gegeven`;
}

// ---------- Leren ----------
let curMod=null, resetAsk=false;
function renderLeren(){
  const el=$("#v-leren");
  if(curMod&&MOD[curMod]){el.innerHTML=modHTML(MOD[curMod]);return;}
  const best=S.exams.length?Math.max(...S.exams.map(e=>Math.round(e.g/e.n*100))):null;
  el.innerHTML=`<div class="stack">
  <section class="intro">
    <div>
      <p class="eyebrow">Veiligheid voor operationeel leidinggevenden</p>
      <h2>Leer de basis en oefen tot het vanzelf gaat</h2>
      <p class="lead">Veertien onderwerpen met de kern van de lesstof, ${QS.length} oefenvragen met uitleg, ${BORDEN?BORDEN.SIGNS.length:0} borden en pictogrammen, en een proefexamen onder echte tijdsdruk.</p>
    </div>
    <div class="facts" aria-label="Het examen in het kort">
      <div><b>70</b><span>meerkeuzevragen</span></div>
      <div><b>105</b><span>minuten</span></div>
      <div><b>49</b><span>goed nodig (70%)</span></div>
      <div><b>${best===null?"–":best+"%"}</b><span>jouw beste proefexamen</span></div>
    </div>
  </section>
  <section>
    <h3>Zo pak je het aan</h3>
    <ol class="route">
      <li><button data-act="mod" data-arg="wet"><b>Lees de onderwerpen</b><span>Begin met wetgeving en risico’s; die komen overal terug.</span></button></li>
      <li><button data-act="tab" data-arg="oefenen"><b>Oefen per onderwerp</b><span>Direct feedback, met uitleg bij elke vraag.</span></button></li>
      <li><button data-act="tab" data-arg="borden"><b>Herken borden</b><span>Vorm en kleur vertellen al wat een bord betekent.</span></button></li>
      <li><button data-act="tab" data-arg="spotten"><b>Spot de gevaren</b><span>Tik aan wat er misgaat op de werkplek.</span></button></li>
      <li><button data-act="tab" data-arg="examen"><b>Doe proefexamens</b><span>70 vragen in 105 minuten. Mik op 80% of meer.</span></button></li>
    </ol>
  </section>
  <section>
    <div class="sec-head"><h3>Onderwerpen</h3><span class="small muted">Tik op een onderwerp om te beginnen</span></div>
    <div class="tiles">${MODS.map(tile).join("")}</div>
  </section>
  <section class="row">
    ${resetAsk?`<span>Al je voortgang, fouten en examenscores wissen?</span><button class="btn danger" data-act="resetYes">Ja, wissen</button><button class="btn" data-act="resetNo">Annuleren</button>`
             :`<button class="link" data-act="resetAsk">Voortgang wissen</button>`}
  </section></div>`;
}
function tile(m){
  const p=pctOf(S.stats[m.id]);
  return `<button class="tile" data-act="mod" data-arg="${m.id}">
    <span class="tile-top">${m.vol?`<span class="pill vol">VOL</span>`:""}${S.read[m.id]?`<span class="pill ok">✓ Gelezen</span>`:""}</span>
    <span class="tile-t">${esc(m.t)}</span>
    <span class="tile-k">${esc(m.k)}</span>
    <span class="tile-s"><span class="meter"><i style="width:${p??0}%"></i></span><span class="mono">${p===null?nQ(m.id)+" vragen":p+"% goed"}</span></span>
  </button>`;
}
function modHTML(m){
  const i=MODS.indexOf(m), nx=MODS[i+1];
  const sec=s=>`<section><h3>${esc(s.h)}</h3>${s.p?`<p>${s.p}</p>`:""}${s.d&&DIAG[s.d]?DIAG[s.d]():""}${s.l?`<ul>${s.l.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}${s.o?`<ol class="plain">${s.o.map(x=>`<li>${x}</li>`).join("")}</ol>`:""}${s.d2&&DIAG[s.d2]?DIAG[s.d2]():""}</section>`;
  return `<button class="link" data-act="back">← Alle onderwerpen</button>
  <article class="mod">
    <div class="mod-head">
      <p class="eyebrow">Onderwerp ${i+1} van ${MODS.length}${m.vol?" · VOL-stof":""}</p>
      <h2>${esc(m.t)}</h2>
      <p class="lead">${esc(m.k)}</p>
      <div class="figs">${m.fig.map(([v,l])=>`<div class="fig"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>
    </div>
    ${m.secs.map(sec).join("")}
    ${m.tip?`<aside class="tip"><b>Examentip</b>${esc(m.tip)}</aside>`:""}
    <div class="mod-actions">
      <button class="btn primary" data-act="practiceMod" data-arg="${m.id}" ${nQ(m.id)?"":"disabled"}>Oefen dit onderwerp (${nQ(m.id)} vragen)</button>
      <button class="btn" data-act="read" data-arg="${m.id}">${S.read[m.id]?"✓ Gelezen":"Markeer als gelezen"}</button>
      ${nx?`<button class="btn" data-act="mod" data-arg="${nx.id}">Volgende: ${esc(nx.t)} →</button>`:""}
    </div>
  </article>`;
}

// ---------- Oefenen ----------
let sel=new Set(), nPick=10, P=null;
function startPractice(mode){
  let pool=mode==="wrong"?S.wrong.map(id=>QBYID[id]).filter(Boolean):QS.filter(q=>!sel.size||sel.has(q.m));
  if(!pool.length) return;
  const n=mode==="wrong"?pool.length:Math.min(nPick,pool.length);
  P={qs:shuffle(pool).slice(0,n).map(prep),i:0,picked:-1,score:0,wrong:[],mode};
  renderOefenen();
}
function renderOefenen(){
  const el=$("#v-oefenen");
  if(!QS.length){el.innerHTML=`<div class="empty">De vragenbank is nog niet geladen.</div>`;return;}
  if(!P){
    const pool=QS.filter(q=>!sel.size||sel.has(q.m)).length;
    el.innerHTML=`<div class="stack">
      <div><p class="eyebrow">Oefenen</p><h2>Oefen per onderwerp</h2><p class="lead">Kies een of meer onderwerpen. Je ziet na elke vraag meteen of het goed is, met uitleg.</p></div>
      <div class="card">
        <h4>Onderwerpen</h4>
        <div class="row" style="margin-block:10px 18px">
          <button class="chip" data-act="selAll" aria-pressed="${!sel.size}">Alles</button>
          ${MODS.map(m=>`<button class="chip" data-act="selMod" data-arg="${m.id}" aria-pressed="${sel.has(m.id)}">${esc(m.t)}</button>`).join("")}
        </div>
        <div class="row">
          <label for="oef-n" class="small">Aantal vragen</label>
          <select id="oef-n">${[10,20,40].map(v=>`<option value="${v}" ${v===nPick?"selected":""}>${v}</option>`).join("")}</select>
          <button class="btn primary" data-act="startPractice">Start (${Math.min(nPick,pool)} van ${pool} vragen)</button>
        </div>
      </div>
      <div class="card row" style="justify-content:space-between">
        <div><h4>Mijn fouten</h4><p class="small muted" style="margin:0">Vragen die je eerder fout had. Goed beantwoord? Dan verdwijnen ze uit deze lijst.</p></div>
        <button class="btn hi" data-act="startWrong" ${S.wrong.length?"":"disabled"}>Oefen ${S.wrong.length} fout${S.wrong.length===1?"":"en"}</button>
      </div>
    </div>`;
    return;
  }
  if(P.i>=P.qs.length){
    const n=P.qs.length, pc=Math.round(P.score/n*100);
    el.innerHTML=`<div class="card q-card">
      <p class="eyebrow">Resultaat</p>
      <div class="verdict ${pc>=70?"ok":"bad"}">${P.score} van ${n} goed · ${pc}%</div>
      <p>${pc>=80?"Sterk. Dit onderwerp zit goed.":pc>=70?"Voldoende, maar herhaal de vragen die fout gingen.":"Lees de lesstof nog eens door en oefen dan opnieuw."}</p>
      ${P.wrong.length?`<h4 style="margin-top:16px">Fout beantwoord</h4>${P.wrong.map(q=>reviewItem(q,null)).join("")}`:""}
      <div class="q-foot"><button class="btn" data-act="stopPractice">Andere onderwerpen</button>
      <div class="row">${P.wrong.length?`<button class="btn hi" data-act="startWrong">Oefen je fouten</button>`:""}<button class="btn primary" data-act="againPractice">Nieuwe ronde</button></div></div>
    </div>`;
    return;
  }
  const q=P.qs[P.i], done=P.picked>=0;
  const right=done&&q.opts[P.picked].ok;
  el.innerHTML=`<div class="card q-card">
    <div class="q-meta"><span>${esc(MOD[q.m].t)}</span><span>Vraag ${P.i+1} / ${P.qs.length} · ${P.score} goed</span></div>
    <div class="prog"><i style="width:${P.i/P.qs.length*100}%"></i></div>
    <p class="q-text">${esc(q.q)}</p>
    <div class="opts">${q.opts.map((o,i)=>{
      let c=""; if(done){ if(o.ok) c="ok"; else if(i===P.picked) c="bad"; }
      return `<button class="opt ${c}" data-act="answer" data-arg="${i}" ${done?"disabled":""}><span class="l">${LET[i]}</span><span>${esc(o.t)}</span></button>`;}).join("")}</div>
    ${done?`<div class="fb ${right?"ok":"bad"}" role="status"><b>${right?"Goed":"Helaas, fout"}</b>${esc(q.u)}</div>`:""}
    <div class="q-foot">
      <button class="link" data-act="stopPractice">Stoppen</button>
      ${done?`<button class="btn primary" id="nx" data-act="next">${P.i+1<P.qs.length?"Volgende vraag →":"Bekijk resultaat"}</button>`:`<span class="kbd">Toets A, B of C</span>`}
    </div>
  </div>`;
  const nx=$("#nx"); if(nx) try{nx.focus({preventScroll:true});}catch(e){}
}
function answerPractice(i){
  if(!P||P.picked>=0) return;
  const q=P.qs[P.i]; if(!q.opts[i]) return;
  P.picked=i; const ok=q.opts[i].ok;
  if(ok) P.score++; else P.wrong.push(q);
  record(q,ok); save(); renderHeader(); renderOefenen();
}

function reviewItem(q,pick,num){
  const right=q.opts.find(o=>o.ok);
  const mine=pick!=null&&pick>=0?q.opts[pick]:null;
  return `<div class="rv">
    ${num!=null?`<span class="qn">Vraag ${num} · ${esc(MOD[q.m].t)}</span>`:""}
    <span class="q">${esc(q.q)}</span>
    ${num!=null?(mine?`<span class="a ${mine.ok?"ok":"bad"}">${mine.ok?"✓":"✗"} Jouw antwoord: ${esc(mine.t)}</span>`:`<span class="a bad">✗ Niet beantwoord</span>`):""}
    ${!mine||!mine.ok?`<span class="a ok">✓ Juist: ${esc(right.t)}</span>`:""}
    <span class="u">${esc(q.u)}</span>
  </div>`;
}

// ---------- Proefexamen ----------
const EX={n:70,min:105};
let E=null, timer=null;
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");};
function examStart(){
  const n=Math.min(EX.n,QS.length);
  // Evenwichtige trekking: vragen per onderwerp gespreid over de bank.
  const byMod={}; shuffle(QS).forEach(q=>(byMod[q.m]=byMod[q.m]||[]).push(q));
  const picked=[]; const mods=Object.keys(byMod);
  while(picked.length<n){let added=false;for(const m of shuffle(mods)){if(picked.length>=n)break;const q=byMod[m].pop();if(q){picked.push(q);added=true;}}if(!added)break;}
  const qs=shuffle(picked).map(prep);
  E={qs,ans:Array(qs.length).fill(-1),flag:Array(qs.length).fill(false),i:0,start:Date.now(),end:Date.now()+EX.min*60000,done:false,confirm:false,filter:"fout",pass:Math.ceil(qs.length*7/10)};
  clearInterval(timer); timer=setInterval(tick,1000);
  renderExamen();
}
function tick(){
  if(!E||E.done){clearInterval(timer);timer=null;return;}
  const left=E.end-Date.now();
  if(left<=0){examFinish();return;}
  const t=$("#ex-timer"); if(t){t.textContent=fmt(left);t.classList.toggle("warn",left<5*60000);}
}
function examFinish(){
  if(!E||E.done) return;
  E.done=true; clearInterval(timer); timer=null;
  let g=0; E.qs.forEach((q,i)=>{const ok=E.ans[i]>=0&&q.opts[E.ans[i]].ok; if(ok)g++; record(q,ok);});
  E.g=g; E.used=Math.min(Date.now(),E.end)-E.start;
  S.exams.unshift({d:Date.now(),g,n:E.qs.length,sec:Math.round(E.used/1000)}); S.exams=S.exams.slice(0,12);
  save(); renderHeader(); renderExamen(); window.scrollTo(0,0);
}
function renderExamen(){
  const el=$("#v-examen");
  if(!QS.length){el.innerHTML=`<div class="empty">De vragenbank is nog niet geladen.</div>`;return;}
  if(!E){
    const n=Math.min(EX.n,QS.length);
    el.innerHTML=`<div class="stack">
      <div><p class="eyebrow">Proefexamen</p><h2>Oefen onder examenomstandigheden</h2>
      <p class="lead">${n} vragen uit alle onderwerpen, ${EX.min} minuten. Je ziet pas aan het eind wat goed en fout was, net als bij het echte examen.</p></div>
      <div class="card">
        <div class="facts" style="margin-bottom:18px">
          <div><b>${n}</b><span>vragen</span></div><div><b>${EX.min}</b><span>minuten</span></div>
          <div><b>${Math.ceil(n*7/10)}</b><span>goed nodig</span></div><div><b>${S.exams.length}</b><span>keer gedaan</span></div>
        </div>
        <ul class="small" style="margin:0 0 18px;padding-left:20px;display:grid;gap:4px">
          <li>Je kunt heen en weer bladeren en antwoorden aanpassen tot je inlevert.</li>
          <li>Markeer twijfelvragen om ze aan het eind terug te vinden.</li>
          <li>Als de tijd om is, wordt het examen automatisch ingeleverd.</li>
        </ul>
        <button class="btn primary" data-act="examStart">Start proefexamen</button>
      </div>
      ${S.exams.length?`<div class="card"><h4>Eerdere proefexamens</h4><div class="tbl"><table class="hist"><thead><tr><th>Datum</th><th>Score</th><th>Tijd</th><th>Uitslag</th></tr></thead><tbody>
        ${S.exams.map(x=>{const pc=Math.round(x.g/x.n*100),ok=x.g>=Math.ceil(x.n*7/10);return `<tr><td>${new Date(x.d).toLocaleDateString("nl-NL",{day:"numeric",month:"short"})} ${new Date(x.d).toLocaleTimeString("nl-NL",{hour:"2-digit",minute:"2-digit"})}</td><td class="mono">${x.g}/${x.n} · ${pc}%</td><td class="mono">${fmt(x.sec*1000)}</td><td><span class="pill ${ok?"ok":"bad"}">${ok?"Geslaagd":"Gezakt"}</span></td></tr>`;}).join("")}
      </tbody></table></div></div>`:""}
    </div>`;
    return;
  }
  if(E.done){renderResult(el);return;}
  const q=E.qs[E.i], n=E.qs.length, answered=E.ans.filter(a=>a>=0).length, left=E.end-Date.now();
  el.innerHTML=`<div class="ex-top">
      <div><p class="eyebrow" style="margin:0">Proefexamen</p><h3 style="margin:0">Vraag ${E.i+1} van ${n}</h3></div>
      <div class="small muted">${answered} van ${n} beantwoord</div>
      <div id="ex-timer" class="timer ${left<5*60000?"warn":""}" aria-label="Resterende tijd">${fmt(left)}</div>
    </div>
    <div class="ex-layout">
      <div class="card">
        <div class="q-meta"><span>${esc(MOD[q.m].t)}</span><span>${E.flag[E.i]?"⚑ Gemarkeerd":""}</span></div>
        <p class="q-text">${esc(q.q)}</p>
        <div class="opts">${q.opts.map((o,i)=>`<button class="opt ${E.ans[E.i]===i?"sel":""}" data-act="exAns" data-arg="${i}" aria-pressed="${E.ans[E.i]===i}"><span class="l">${LET[i]}</span><span>${esc(o.t)}</span></button>`).join("")}</div>
        <div class="q-foot">
          <button class="btn" data-act="exGo" data-arg="${E.i-1}" ${E.i?"":"disabled"}>← Vorige</button>
          <button class="btn" data-act="exFlag">${E.flag[E.i]?"Markering weg":"⚑ Markeer"}</button>
          ${E.i+1<n?`<button class="btn primary" data-act="exGo" data-arg="${E.i+1}">Volgende →</button>`:`<button class="btn hi" data-act="exSubmit">Inleveren</button>`}
        </div>
        <p class="kbd" style="margin:12px 0 0">Toetsen: A/B/C kiezen · ← → bladeren</p>
      </div>
      <div class="card">
        <h4>Overzicht</h4>
        <div class="navgrid">${E.qs.map((_,i)=>`<button class="nb ${E.ans[i]>=0?"a":""} ${E.flag[i]?"f":""} ${i===E.i?"cur":""}" data-act="exGo" data-arg="${i}" aria-label="Vraag ${i+1}">${i+1}</button>`).join("")}</div>
        <div class="legend-row"><span><i style="background:var(--ink);border-color:var(--ink)"></i>beantwoord</span><span><i></i>open</span><span><i style="background:var(--hivis);border-color:var(--hivis);border-radius:50%"></i>gemarkeerd</span></div>
        ${E.confirm?`<div class="confirm"><p><b>Inleveren?</b> ${n-answered?`Je hebt nog ${n-answered} vra${n-answered===1?"ag":"gen"} open.`:"Alle vragen zijn beantwoord."} ${E.flag.filter(Boolean).length?`${E.flag.filter(Boolean).length} gemarkeerd.`:""}</p>
          <div class="row"><button class="btn hi" data-act="exConfirm">Ja, inleveren</button><button class="btn" data-act="exCancel">Nog even kijken</button></div></div>`
          :`<button class="btn" style="width:100%;margin-top:14px" data-act="exSubmit">Inleveren</button>`}
        <button class="link small" style="margin-top:8px" data-act="exQuit">Examen afbreken</button>
      </div>
    </div>`;
}
function renderResult(el){
  const n=E.qs.length, pc=Math.round(E.g/n*100), ok=E.g>=E.pass;
  const per={}; E.qs.forEach((q,i)=>{const p=per[q.m]||(per[q.m]={g:0,n:0});p.n++;if(E.ans[i]>=0&&q.opts[E.ans[i]].ok)p.g++;});
  const rows=Object.entries(per).map(([m,p])=>({m,...p,pc:p.g/p.n})).sort((a,b)=>a.pc-b.pc);
  const list=E.qs.map((q,i)=>({q,i})).filter(({q,i})=>E.filter==="alle"||!(E.ans[i]>=0&&q.opts[E.ans[i]].ok));
  el.innerHTML=`<div class="stack">
    <div class="card">
      <p class="eyebrow">Uitslag proefexamen</p>
      <div class="verdict ${ok?"ok":"bad"}">${ok?"Geslaagd":"Nog niet geslaagd"}</div>
      <p class="lead" style="margin:0"><span class="mono">${E.g}/${n}</span> goed (${pc}%). Nodig: ${E.pass}. Tijd gebruikt: <span class="mono">${fmt(E.used)}</span>.</p>
      <div class="row" style="margin-top:16px"><button class="btn primary" data-act="examStart">Nieuw proefexamen</button><button class="btn" data-act="exQuit">Terug naar overzicht</button>${S.wrong.length?`<button class="btn hi" data-act="goWrong">Oefen je fouten</button>`:""}</div>
    </div>
    <div class="res-grid">
      <div class="card"><h4>Score per onderwerp</h4><p class="small muted">Zwakste bovenaan. De streep staat op 70%.</p>
        <div class="mbars">${rows.map(r=>`<div class="mbar"><span>${esc(MOD[r.m].t)}</span><span class="t"><i style="width:${Math.round(r.pc*100)}%;background:var(${r.pc>=.7?"--ok":"--bad"})"></i></span><span class="v">${r.g}/${r.n}</span></div>`).join("")}</div>
      </div>
      <div class="card"><div class="sec-head"><h4 style="margin:0">Nakijken</h4>
        <div class="row"><button class="chip" data-act="exFilter" data-arg="fout" aria-pressed="${E.filter==="fout"}">Alleen fout (${n-E.g})</button><button class="chip" data-act="exFilter" data-arg="alle" aria-pressed="${E.filter==="alle"}">Alle vragen</button></div></div>
        ${list.length?list.map(({q,i})=>reviewItem(q,E.ans[i],i+1)).join(""):`<p>Alles goed. Knap werk.</p>`}
      </div>
    </div></div>`;
}

// ---------- Borden ----------
let bFilter="all", hideNames=false, revealed=new Set(), SQ=null;
function renderBorden(){
  const el=$("#v-borden");
  if(!BORDEN){el.innerHTML=`<div class="empty">De borden zijn nog niet geladen.</div>`;return;}
  const cats=Object.keys(BORDEN.CAT);
  const items=BORDEN.SIGNS.filter(s=>bFilter==="all"||s.cat===bFilter);
  el.innerHTML=`<div class="stack">
    <div><p class="eyebrow">Borden &amp; symbolen</p><h2>Vorm en kleur vertellen het al</h2>
    <p class="lead">Leer eerst de zes vormen hieronder. Oefen daarna met de kaarten of doe de quiz.</p></div>
    <div class="legend">${cats.map(c=>`<div class="lg">${BORDEN.shape(c)}<b>${esc(BORDEN.CAT[c].naam)}</b><span>${esc(BORDEN.CAT[c].vorm)}${BORDEN.CAT[c].betekenis?". "+esc(BORDEN.CAT[c].betekenis):""}</span></div>`).join("")}</div>
    <div id="b-quiz">${signQuizHTML()}</div>
    <div>
      <div class="sec-head"><h3>Alle borden</h3>
        <button class="chip" data-act="hideNames" aria-pressed="${hideNames}">${hideNames?"Namen verborgen: tik op een bord":"Verberg namen (zelftest)"}</button></div>
      <div class="row" style="margin-bottom:14px">
        <button class="chip" data-act="bFilter" data-arg="all" aria-pressed="${bFilter==="all"}">Alle (${BORDEN.SIGNS.length})</button>
        ${cats.map(c=>`<button class="chip" data-act="bFilter" data-arg="${c}" aria-pressed="${bFilter===c}">${esc(BORDEN.CAT[c].naam)}</button>`).join("")}
      </div>
      <div class="signs">${items.map(s=>{const open=!hideNames||revealed.has(s.id);return `<button class="sign" data-act="signTap" data-arg="${s.id}" aria-label="${open?esc(s.naam):"Verborgen bord, tik om te tonen"}">${BORDEN.svg(s.id)}${open?`<span class="nm">${esc(s.naam)}</span><span class="ux">${esc(s.uitleg)}</span>`:`<span class="hid">Wat betekent dit? Tik om te zien</span>`}</button>`;}).join("")}</div>
    </div></div>`;
}
function signQuizHTML(){
  if(!SQ) return `<div class="card row" style="justify-content:space-between"><div><h4>Bordenquiz</h4><p class="small muted" style="margin:0">10 willekeurige borden en pictogrammen. Kies wat ze betekenen.</p></div><button class="btn primary" data-act="sqStart">Start bordenquiz</button></div>`;
  if(SQ.i>=SQ.items.length) return `<div class="card"><p class="eyebrow">Bordenquiz</p><div class="verdict ${SQ.score>=8?"ok":"bad"}">${SQ.score} van ${SQ.items.length} goed</div><div class="row"><button class="btn primary" data-act="sqStart">Nog een keer</button><button class="btn" data-act="sqStop">Sluiten</button></div></div>`;
  const s=SQ.items[SQ.i];
  if(!SQ.opts[SQ.i]){
    const same=shuffle(BORDEN.SIGNS.filter(x=>x.cat===s.cat&&x.id!==s.id)).slice(0,3);
    const other=shuffle(BORDEN.SIGNS.filter(x=>x.cat!==s.cat)).slice(0,3-same.length);
    SQ.opts[SQ.i]=shuffle([s,...same,...other]);
  }
  const opts=SQ.opts[SQ.i], done=SQ.picked>=0, right=done&&opts[SQ.picked].id===s.id;
  return `<div class="card"><div class="q-meta"><span>Bordenquiz</span><span>${SQ.i+1} / ${SQ.items.length} · ${SQ.score} goed</span></div>
    <div class="prog"><i style="width:${SQ.i/SQ.items.length*100}%"></i></div>
    <div class="sq" style="margin-top:14px"><div class="sq-img">${BORDEN.svg(s.id)}</div>
      <div><p class="q-text" style="margin-top:0">Wat betekent dit ${s.cat==="ghs"?"pictogram":"bord"}?</p>
      <div class="opts">${opts.map((o,i)=>{let c="";if(done){if(o.id===s.id)c="ok";else if(i===SQ.picked)c="bad";}return `<button class="opt ${c}" data-act="sqAns" data-arg="${i}" ${done?"disabled":""}><span class="l">${LET[i]}</span><span>${esc(o.naam)}</span></button>`;}).join("")}</div>
      ${done?`<div class="fb ${right?"ok":"bad"}"><b>${right?"Goed":"Fout: het is "+esc(s.naam)}</b>${esc(BORDEN.CAT[s.cat].naam)}: ${esc(BORDEN.CAT[s.cat].vorm.toLowerCase())}. ${esc(s.uitleg)}</div>
        <div class="q-foot"><button class="link" data-act="sqStop">Stoppen</button><button class="btn primary" id="sqnx" data-act="sqNext">${SQ.i+1<SQ.items.length?"Volgende →":"Bekijk score"}</button></div>`:""}
      </div></div></div>`;
}
function renderSQ(){const b=$("#b-quiz");if(b){b.innerHTML=signQuizHTML();const n=$("#sqnx");if(n)try{n.focus({preventScroll:true});}catch(e){}}}

// ---------- Gevaren spotten ----------
let scIdx=0, scFound=[], scShown=false, scMiss=0;
function renderSpotten(){
  const el=$("#v-spotten");
  if(!SCENES.length){el.innerHTML=`<div class="empty">De scènes zijn nog niet geladen.</div>`;return;}
  const sc=SCENES[scIdx], total=sc.hazards.length;
  const list=scShown?sc.hazards.map((h,i)=>({h,n:i+1,own:scFound.includes(h.id)})):scFound.map((id,i)=>({h:sc.hazards.find(x=>x.id===id),n:i+1,own:true}));
  const best=S.found[sc.id];
  el.innerHTML=`<div class="stack">
    <div><p class="eyebrow">Gevaren spotten</p><h2>Wat gaat hier mis?</h2>
      <p class="lead">${esc(sc.intro||"")} Tik op elk gevaar dat je ziet.</p></div>
    <div>
      ${SCENES.length>1?`<div class="scene-tabs">${SCENES.map((s,i)=>`<button class="chip" data-act="scene" data-arg="${i}" aria-pressed="${i===scIdx}">${esc(s.titel)}${S.found[s.id]!=null?` · ${S.found[s.id]}/${s.hazards.length}`:""}</button>`).join("")}</div>`:""}
      <div class="scene-wrap">
        <svg class="scene" id="scene" viewBox="${sc.viewBox}" role="img" aria-label="Illustratie: ${esc(sc.titel)}">${sc.svg}<g id="marks"></g></svg>
        <div class="card">
          <div class="row" style="justify-content:space-between;align-items:baseline"><span class="big-n">${scFound.length}<span class="muted" style="font-size:20px">/${total}</span></span><span class="small muted">${scMiss} mis${best!=null?` · record ${best}/${total}`:""}</span></div>
          <div class="meter" style="margin-block:10px"><i style="width:${scFound.length/total*100}%"></i></div>
          ${scFound.length===total&&!scShown?`<p class="fb ok" style="margin:0 0 10px"><b>Alles gevonden</b>Je hebt alle ${total} gevaren gespot.</p>`:""}
          ${list.length?`<ol class="found">${list.map(x=>`<li class="${x.own?"":"shown"}"><span class="n">${x.n}</span><div><b>${esc(x.h.titel)}</b><span>${esc(x.h.uitleg)}</span></div></li>`).join("")}</ol>`:`<p class="small muted">Nog niets gevonden. Kijk naar PBM, afzettingen, kabels, opslag en hoe mensen werken.</p>`}
          <div class="row" style="margin-top:16px">
            ${!scShown&&scFound.length<total?`<button class="btn" data-act="scShow">Toon alle gevaren</button>`:""}
            <button class="btn" data-act="scReset">Opnieuw</button>
            ${SCENES.length>1?`<button class="btn primary" data-act="scene" data-arg="${(scIdx+1)%SCENES.length}">Volgende scène →</button>`:""}
          </div>
        </div>
      </div>
    </div></div>`;
  drawMarks();
  $("#scene").addEventListener("click",sceneClick);
}
function drawMarks(){
  const sc=SCENES[scIdx], g=$("#marks"); if(!g) return;
  const ids=scShown?sc.hazards.map(h=>h.id):scFound;
  g.innerHTML=ids.map(id=>{
    const h=sc.hazards.find(x=>x.id===id); const n=scShown?sc.hazards.indexOf(h)+1:scFound.indexOf(id)+1;
    const own=scFound.includes(id);
    return `<rect x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}" rx="8" fill="rgba(242,183,5,.14)" stroke="${own?"#F2B705":"#FFFFFF"}" stroke-width="4" ${own?"":'stroke-dasharray="8 6"'}/>
      <circle cx="${h.x+4}" cy="${h.y+4}" r="15" fill="#16202A" stroke="#F2B705" stroke-width="3"/>
      <text x="${h.x+4}" y="${h.y+9.5}" text-anchor="middle" fill="#F2B705" style="font:600 15px var(--mono)">${n}</text>`;
  }).join("");
}
function sceneClick(e){
  const svg=e.currentTarget, sc=SCENES[scIdx];
  if(scShown) return;
  let p; try{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;p=pt.matrixTransform(svg.getScreenCTM().inverse());}catch(err){return;}
  const pad=6;
  const h=sc.hazards.find(h=>p.x>=h.x-pad&&p.x<=h.x+h.w+pad&&p.y>=h.y-pad&&p.y<=h.y+h.h+pad);
  if(h){
    if(!scFound.includes(h.id)){scFound.push(h.id);
      if(scFound.length>(S.found[sc.id]||0)){S.found[sc.id]=scFound.length;save();}
      renderSpotten();}
  }else{
    scMiss++;
    const g=$("#marks"), m=document.createElementNS("http://www.w3.org/2000/svg","g");
    m.innerHTML=`<path d="M${p.x-10} ${p.y-10}l20 20M${p.x+10} ${p.y-10}l-20 20" stroke="#B8261C" stroke-width="5" stroke-linecap="round"/>`;
    g.appendChild(m); setTimeout(()=>m.remove(),700);
    const c=$("#v-spotten .small.muted"); if(c) c.textContent=c.textContent.replace(/^\d+ mis/,scMiss+" mis");
  }
}

// ---------- Acties ----------
const RENDER={leren:renderLeren,borden:renderBorden,spotten:renderSpotten,oefenen:renderOefenen,examen:renderExamen};
const ACT={
  tab:a=>{if(a==="leren")curMod=null;show(a);},
  mod:a=>{curMod=a;show("leren");},
  back:()=>{curMod=null;show("leren");},
  read:a=>{S.read[a]=!S.read[a];save();renderHeader();renderLeren();},
  resetAsk:()=>{resetAsk=true;renderLeren();},
  resetNo:()=>{resetAsk=false;renderLeren();},
  resetYes:()=>{S.read={};S.stats={};S.wrong=[];S.exams=[];S.found={};save();resetAsk=false;renderHeader();renderLeren();},
  practiceMod:a=>{sel=new Set([a]);P=null;show("oefenen");startPractice();},
  selAll:()=>{sel.clear();renderOefenen();},
  selMod:a=>{sel.has(a)?sel.delete(a):sel.add(a);renderOefenen();},
  startPractice:()=>startPractice(),
  startWrong:()=>startPractice("wrong"),
  againPractice:()=>startPractice(P&&P.mode),
  stopPractice:()=>{P=null;renderOefenen();},
  answer:a=>answerPractice(+a),
  next:()=>{if(!P)return;P.i++;P.picked=-1;renderOefenen();window.scrollTo(0,0);},
  goWrong:()=>{show("oefenen");startPractice("wrong");},
  examStart:()=>{examStart();window.scrollTo(0,0);},
  exAns:a=>{if(!E||E.done)return;E.ans[E.i]=+a;renderExamen();},
  exGo:a=>{if(!E||E.done)return;const i=+a;if(i<0||i>=E.qs.length)return;E.i=i;E.confirm=false;renderExamen();},
  exFlag:()=>{if(!E)return;E.flag[E.i]=!E.flag[E.i];renderExamen();},
  exSubmit:()=>{if(!E)return;E.confirm=true;renderExamen();},
  exCancel:()=>{if(!E)return;E.confirm=false;renderExamen();},
  exConfirm:()=>examFinish(),
  exQuit:()=>{E=null;clearInterval(timer);timer=null;renderExamen();},
  exFilter:a=>{if(!E)return;E.filter=a;renderExamen();},
  bFilter:a=>{bFilter=a;renderBorden();},
  hideNames:()=>{hideNames=!hideNames;revealed.clear();renderBorden();},
  signTap:a=>{if(!hideNames)return;revealed.has(a)?revealed.delete(a):revealed.add(a);renderBorden();},
  sqStart:()=>{SQ={items:shuffle(BORDEN.SIGNS).slice(0,Math.min(10,BORDEN.SIGNS.length)),i:0,picked:-1,score:0,opts:[]};renderSQ();},
  sqAns:a=>{if(!SQ||SQ.picked>=0)return;SQ.picked=+a;if(SQ.opts[SQ.i][SQ.picked].id===SQ.items[SQ.i].id)SQ.score++;renderSQ();},
  sqNext:()=>{if(!SQ)return;SQ.i++;SQ.picked=-1;renderSQ();},
  sqStop:()=>{SQ=null;renderSQ();},
  scene:a=>{scIdx=+a;scFound=[];scShown=false;scMiss=0;renderSpotten();},
  scShow:()=>{scShown=true;renderSpotten();},
  scReset:()=>{scFound=[];scShown=false;scMiss=0;renderSpotten();}
};
document.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b||b.disabled)return;const f=ACT[b.dataset.act];if(f)f(b.dataset.arg,b,e);});
document.addEventListener("change",e=>{if(e.target.id==="oef-n"){nPick=+e.target.value;renderOefenen();}});
document.addEventListener("keydown",e=>{
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  const t=e.target; if(t&&(t.tagName==="SELECT"||t.tagName==="INPUT"||t.tagName==="TEXTAREA")) return;
  const k=e.key.toLowerCase(); const idx="abcd".indexOf(k)>=0?"abcd".indexOf(k):"1234".indexOf(k);
  if(tab==="oefenen"&&P&&P.i<P.qs.length&&P.picked<0&&idx>=0&&idx<P.qs[P.i].opts.length){e.preventDefault();answerPractice(idx);}
  else if(tab==="examen"&&E&&!E.done){
    if(idx>=0&&idx<E.qs[E.i].opts.length){e.preventDefault();ACT.exAns(idx);}
    else if(e.key==="ArrowRight"){e.preventDefault();ACT.exGo(E.i+1);}
    else if(e.key==="ArrowLeft"){e.preventDefault();ACT.exGo(E.i-1);}
  }
  else if(tab==="borden"&&SQ&&SQ.i<SQ.items.length&&SQ.picked<0&&idx>=0&&idx<4){e.preventDefault();ACT.sqAns(idx);}
});

renderHeader();
const h=(location.hash||"").slice(1);
show(TABS.includes(h)?h:"leren",true);
})();
