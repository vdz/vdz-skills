#!/usr/bin/env node
// autoresearch cross-run dashboard generator.
// Reads the global ledger ($AUTORESEARCH_HOME/experiments.jsonl) + registry
// (runs.json) and emits ONE self-contained .html file: inlined JSON, hand-rolled
// inline SVG charts, vanilla-JS interactivity, auto dark/light. No deps, no server.
//
// Usage:
//   node build-dashboard.mjs [out.html]
//   AUTORESEARCH_HOME=/path node build-dashboard.mjs ~/ar-dashboard.html
//
// Opens anywhere; the data is baked in, so it's a snapshot — re-run to refresh.

import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const HOME = process.env.AUTORESEARCH_HOME || join(homedir(), '.autoresearch');
const OUT = process.argv[2] || join(HOME, 'dashboard.html');

// ---- load ----------------------------------------------------------------
function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n').map(l => l.trim()).filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}
function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
}

const ledger = readJsonl(join(HOME, 'experiments.jsonl'));
const registry = readJson(join(HOME, 'runs.json'), []);

// ---- aggregate -----------------------------------------------------------
const better = (dir) => (dir === 'higher-is-better' ? 1 : -1); // sign of improvement
const byRun = new Map();
for (const r of ledger) {
  if (!byRun.has(r.run_id)) byRun.set(r.run_id, []);
  byRun.get(r.run_id).push(r);
}

const runs = [...byRun.entries()].map(([run_id, recs]) => {
  recs.sort((a, b) => (a.round ?? 0) - (b.round ?? 0));
  const meta = registry.find(x => x.run_id === run_id) || {};
  const dir = recs[0]?.direction || meta.direction || 'lower-is-better';
  const s = better(dir);
  const baseline = recs[0]?.score_before ?? recs[0]?.score_after ?? null;
  const best = recs.at(-1)?.best_so_far ?? null;
  const series = recs.map(r => ({
    round: r.round ?? 0,
    score: r.score_after,
    best: r.best_so_far,
    kept: !!r.kept,
    hypothesis: r.hypothesis || r.change || '',
    // normalized improvement vs baseline, % (positive = better, any direction)
    impr: baseline != null && r.best_so_far != null && baseline !== 0
      ? s * (r.best_so_far - baseline) / Math.abs(baseline) * 100 : 0,
  }));
  return {
    run_id, asset: meta.asset || recs.at(-1)?.asset || '', direction: dir,
    status: meta.status || 'unknown', baseline, best,
    rounds: recs.at(-1)?.round ?? recs.length,
    wins: recs.filter(r => r.kept).length, total: recs.length,
    improvement: baseline != null && best != null && baseline !== 0
      ? s * (best - baseline) / Math.abs(baseline) * 100 : 0,
    series,
  };
});

const summary = {
  generatedAt: new Date().toISOString(),
  runCount: runs.length,
  experiments: ledger.length,
  wins: runs.reduce((a, r) => a + r.wins, 0),
  active: runs.filter(r => r.status === 'running' || r.status === 'active').length,
};

const DATA = { summary, runs };

// ---- render --------------------------------------------------------------
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>autoresearch · cross-run dashboard</title>
<style>
  :root{
    --bg:#fbfaf7; --panel:#fff; --ink:#1a1a1a; --muted:#6b6b6b; --line:#e7e3da;
    --accent:#b5462f; --good:#2f7d4f; --bad:#b08; --grid:#eee8dd;
    --pal0:#b5462f; --pal1:#2f6db5; --pal2:#2f7d4f; --pal3:#8a5cb5; --pal4:#c08a1e; --pal5:#1e9aa0;
    --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  }
  @media (prefers-color-scheme:dark){:root{
    --bg:#15140f; --panel:#1e1d17; --ink:#ece8df; --muted:#9a958a; --line:#322f26;
    --grid:#262319; --pal0:#e0795f; --pal1:#6aa0e0; --pal2:#6fc28e; --pal3:#b58ce0;
  }}
  *{box-sizing:border-box} html,body{margin:0}
  body{background:var(--bg);color:var(--ink);font:15px/1.5 var(--sans);padding:28px;max-width:1080px;margin:0 auto}
  header h1{font-size:20px;margin:0 0 2px;letter-spacing:.2px}
  header .sub{color:var(--muted);font:12px var(--mono)}
  .cards{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}
  .card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 16px;min-width:120px}
  .card b{display:block;font-size:24px} .card span{color:var(--muted);font-size:12px}
  section{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;margin:16px 0}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0 0 14px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{text-align:left;padding:7px 8px;border-bottom:1px solid var(--line)}
  th{color:var(--muted);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em}
  tr.run{cursor:pointer} tr.run:hover{background:var(--grid)}
  tr.run.sel{background:var(--grid)} td.num{font:13px var(--mono);text-align:right}
  .pos{color:var(--good)} .neg{color:var(--bad)}
  .dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:middle}
  .legend{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;font:12px var(--mono)}
  .legend label{cursor:pointer;user-select:none;opacity:.45} .legend label.on{opacity:1}
  svg{width:100%;height:auto;display:block} .ax{stroke:var(--line)} .gl{stroke:var(--grid)}
  .axt{fill:var(--muted);font:10px var(--mono)} .hint{color:var(--muted);font-size:12px}
  .empty{color:var(--muted);text-align:center;padding:40px;font:13px var(--mono)}
</style></head>
<body>
<header>
  <h1>autoresearch · cross-run dashboard</h1>
  <div class="sub" id="sub"></div>
</header>
<div class="cards" id="cards"></div>
<section id="curveSec">
  <h2>Best-so-far · normalized % improvement vs baseline</h2>
  <div class="legend" id="legend"></div>
  <div id="curve"></div>
  <div class="hint">Click a run in the table to inspect its per-round scores.</div>
</section>
<section>
  <h2>Runs</h2>
  <table><thead><tr>
    <th>Run</th><th>Asset</th><th>Status</th><th class="num">Rounds</th>
    <th class="num">Baseline→Best</th><th class="num">Δ%</th><th class="num">Win rate</th>
  </tr></thead><tbody id="rows"></tbody></table>
</section>
<section id="detailSec" hidden>
  <h2 id="detailTitle"></h2>
  <div id="detail"></div>
  <div class="hint">● kept (new baseline) · ○ reverted</div>
</section>
<script type="application/json" id="data">${JSON.stringify(DATA)}</script>
<script>
const DATA = JSON.parse(document.getElementById('data').textContent);
const PAL = ['--pal0','--pal1','--pal2','--pal3','--pal4','--pal5'].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'#b5462f');
const cv = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const fmt = n => n==null?'—':(Math.abs(n)>=100?n.toFixed(0):Math.abs(n)>=1?n.toFixed(2):n.toPrecision(2));
const pct = n => (n>0?'+':'')+n.toFixed(1)+'%';

DATA.runs.forEach((r,i)=>r.color=PAL[i%PAL.length]);
const visible = new Set(DATA.runs.map(r=>r.run_id));

// header + cards
document.getElementById('sub').textContent =
  'generated '+DATA.summary.generatedAt.replace('T',' ').replace(/\\..*/,' UTC');
const cards=[['runs',DATA.summary.runCount],['experiments',DATA.summary.experiments],
  ['wins kept',DATA.summary.wins],['active',DATA.summary.active]];
document.getElementById('cards').innerHTML = cards.map(([l,v])=>
  '<div class="card"><b>'+v+'</b><span>'+l+'</span></div>').join('');

if(!DATA.runs.length){
  document.querySelectorAll('section').forEach(s=>s.innerHTML='<div class="empty">No experiments recorded yet. Run a loop, then re-generate.</div>');
} else { renderCurve(); renderRows(); }

function svg(w,h){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.setAttribute('viewBox','0 0 '+w+' '+h);s.setAttribute('width',w);s.setAttribute('height',h);return s;}
function el(p,n,a){const e=document.createElementNS('http://www.w3.org/2000/svg',n);
  for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e;}

function renderCurve(){
  const leg=document.getElementById('legend'); leg.innerHTML='';
  DATA.runs.forEach(r=>{
    const lab=document.createElement('label'); lab.className='on'; lab.dataset.run=r.run_id;
    lab.innerHTML='<span class="dot" style="background:'+r.color+'"></span>'+r.run_id;
    lab.onclick=()=>{ if(visible.has(r.run_id)){visible.delete(r.run_id);lab.classList.remove('on');}
      else{visible.add(r.run_id);lab.classList.add('on');} drawCurve(); };
    leg.appendChild(lab);
  });
  drawCurve();
}
function drawCurve(){
  const host=document.getElementById('curve'); host.innerHTML='';
  const W=1000,H=320,m={l:54,r:16,t:16,b:34};
  const rs=DATA.runs.filter(r=>visible.has(r.run_id)&&r.series.length);
  const maxR=Math.max(1,...DATA.runs.flatMap(r=>r.series.map(p=>p.round)));
  const vals=rs.flatMap(r=>r.series.map(p=>p.impr)).concat([0]);
  const lo=Math.min(...vals), hi=Math.max(...vals,1);
  const x=r=>m.l+(W-m.l-m.r)*(maxR?r/maxR:0);
  const y=v=>H-m.b-(H-m.t-m.b)*((v-lo)/((hi-lo)||1));
  const s=svg(W,H); host.appendChild(s);
  // gridlines + y labels
  for(let g=0;g<=4;g++){const v=lo+(hi-lo)*g/4;
    el(s,'line',{class:'gl',x1:m.l,x2:W-m.r,y1:y(v),y2:y(v)});
    el(s,'text',{class:'axt',x:m.l-8,y:y(v)+3,'text-anchor':'end'}).textContent=v.toFixed(0)+'%';}
  el(s,'line',{class:'ax',x1:m.l,x2:m.l,y1:m.t,y2:H-m.b});
  el(s,'line',{class:'ax',x1:m.l,x2:W-m.r,y1:y(0),y2:y(0)});
  el(s,'text',{class:'axt',x:W-m.r,y:H-m.b+24,'text-anchor':'end'}).textContent='round →';
  rs.forEach(r=>{
    const pts=r.series.map(p=>x(p.round)+','+y(p.impr)).join(' ');
    el(s,'polyline',{points:pts,fill:'none',stroke:r.color,'stroke-width':2,'stroke-linejoin':'round'});
    const last=r.series.at(-1);
    el(s,'circle',{cx:x(last.round),cy:y(last.impr),r:3.5,fill:r.color});
  });
}
function renderRows(){
  const tb=document.getElementById('rows'); tb.innerHTML='';
  DATA.runs.forEach(r=>{
    const tr=document.createElement('tr'); tr.className='run'; tr.dataset.run=r.run_id;
    const wr=r.total?Math.round(100*r.wins/r.total):0;
    tr.innerHTML='<td><span class="dot" style="background:'+r.color+'"></span>'+r.run_id+'</td>'
      +'<td class="hint">'+r.asset+'</td><td>'+r.status+'</td>'
      +'<td class="num">'+r.rounds+'</td>'
      +'<td class="num">'+fmt(r.baseline)+' → '+fmt(r.best)+'</td>'
      +'<td class="num '+(r.improvement>=0?'pos':'neg')+'">'+pct(r.improvement)+'</td>'
      +'<td class="num">'+wr+'% ('+r.wins+'/'+r.total+')</td>';
    tr.onclick=()=>{document.querySelectorAll('tr.run').forEach(x=>x.classList.remove('sel'));
      tr.classList.add('sel'); detail(r);};
    tb.appendChild(tr);
  });
}
function detail(r){
  const sec=document.getElementById('detailSec'); sec.hidden=false;
  document.getElementById('detailTitle').textContent=r.run_id+' · '+r.asset+' · '+r.direction;
  const host=document.getElementById('detail'); host.innerHTML='';
  const W=1000,H=300,m={l:60,r:16,t:16,b:34};
  const sc=r.series.map(p=>p.score).filter(v=>v!=null);
  const lo=Math.min(...sc), hi=Math.max(...sc), maxR=Math.max(1,...r.series.map(p=>p.round));
  const x=rr=>m.l+(W-m.l-m.r)*(rr/maxR), y=v=>H-m.b-(H-m.t-m.b)*((v-lo)/((hi-lo)||1));
  const s=svg(W,H); host.appendChild(s);
  for(let g=0;g<=4;g++){const v=lo+(hi-lo)*g/4;
    el(s,'line',{class:'gl',x1:m.l,x2:W-m.r,y1:y(v),y2:y(v)});
    el(s,'text',{class:'axt',x:m.l-8,y:y(v)+3,'text-anchor':'end'}).textContent=fmt(v);}
  el(s,'line',{class:'ax',x1:m.l,x2:m.l,y1:m.t,y2:H-m.b});
  // best-so-far step line
  el(s,'polyline',{points:r.series.map(p=>x(p.round)+','+y(p.best)).join(' '),
    fill:'none',stroke:r.color,'stroke-width':2,'stroke-dasharray':'2 3',opacity:.7});
  // per-round scores: ● kept, ○ reverted
  r.series.forEach(p=>{if(p.score==null)return;
    const c=el(s,'circle',{cx:x(p.round),cy:y(p.score),r:4,
      fill:p.kept?r.color:cv('--panel'),stroke:r.color,'stroke-width':1.5});
    el(c,'title',{}).textContent='round '+p.round+': '+fmt(p.score)+(p.kept?' · kept':' · reverted')+'\\n'+p.hypothesis;
  });
  el(s,'text',{class:'axt',x:W-m.r,y:H-m.b+24,'text-anchor':'end'}).textContent='round →';
}
</script>
</body></html>`;

writeFileSync(OUT, html);
console.log(`dashboard → ${OUT}  (${runs.length} runs, ${ledger.length} experiments)`);
