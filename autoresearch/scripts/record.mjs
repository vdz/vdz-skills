#!/usr/bin/env node
// autoresearch ledger writer.
// Appends one experiment record to BOTH the per-run log and the global cross-run
// ledger, and upserts the run registry. Deterministic, dependency-free.
//
// Usage:
//   node record.mjs <workspace-dir> '<json-record>'
//
// <json-record> is one experiment object, e.g.:
//   {"run_id":"landing-cvr","round":7,"asset":"index.html","hypothesis":"shorter hero",
//    "change":"rewrote H1","score_before":0.41,"score_after":0.47,
//    "direction":"higher-is-better","kept":true,"best_so_far":0.47}
//
// Home for the global ledger + registry: $AUTORESEARCH_HOME or ~/.autoresearch

import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const HOME = process.env.AUTORESEARCH_HOME || join(homedir(), '.autoresearch');

function die(msg) { console.error(`record.mjs: ${msg}`); process.exit(1); }

const [, , workspace, raw] = process.argv;
if (!workspace || !raw) die('usage: node record.mjs <workspace-dir> \'<json-record>\'');

let rec;
try { rec = JSON.parse(raw); } catch (e) { die(`invalid JSON record: ${e.message}`); }
if (!rec.run_id) die('record needs a run_id');
if (!rec.ts) rec.ts = new Date().toISOString();

mkdirSync(HOME, { recursive: true });
mkdirSync(workspace, { recursive: true });

// 1) per-run log (next to the workspace)
appendFileSync(join(workspace, 'experiments.jsonl'), JSON.stringify(rec) + '\n');

// 2) global cross-run ledger
appendFileSync(join(HOME, 'experiments.jsonl'), JSON.stringify(rec) + '\n');

// 3) registry upsert
const regPath = join(HOME, 'runs.json');
let runs = [];
if (existsSync(regPath)) {
  try { runs = JSON.parse(readFileSync(regPath, 'utf8')); } catch { runs = []; }
}
const i = runs.findIndex(r => r.run_id === rec.run_id);
const entry = {
  run_id: rec.run_id,
  asset: rec.asset ?? runs[i]?.asset ?? '',
  direction: rec.direction ?? runs[i]?.direction ?? 'lower-is-better',
  status: rec.status ?? runs[i]?.status ?? 'running',
  best: rec.best_so_far ?? runs[i]?.best ?? null,
  rounds: rec.round ?? runs[i]?.rounds ?? 0,
  last_update: rec.ts,
  workspace,
};
if (i >= 0) runs[i] = { ...runs[i], ...entry }; else runs.push(entry);
writeFileSync(regPath, JSON.stringify(runs, null, 2) + '\n');

console.log(`recorded ${rec.run_id} round ${rec.round ?? '?'} → global ledger + registry`);
