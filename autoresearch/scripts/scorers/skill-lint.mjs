#!/usr/bin/env node
// skill-lint.mjs — a deterministic authoring-convention scorer for Claude Code skills.
//
//   node skill-lint.mjs <skill-dir> [--json]
//
// Emits a weighted *violation count* (lower is better) measuring how well a skill
// follows the navigator-shape authoring conventions:
//   - SKILL.md has well-formed frontmatter (name + description) and a body heading
//   - the description is informative but not bloated
//   - a navigator (multi-file) SKILL.md stays lean
//   - every relative link in SKILL.md resolves
//   - no orphan reference files (present but never linked)
//   - each reference file opens with a "When to read this" preface
//   - reference filenames are scenario/topic-based, not generic
//   - no concept is duplicated as a section heading across files (single source of truth)
//
// Pure parse/grep — no deps, no model calls, deterministic. Same input → same number.
// This is the locked scorer for the S2 "authoring-convention lint" autoresearch run;
// the loop reads it to judge and never edits it.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename, dirname, resolve } from "node:path";

const WEIGHTS = {
  missing_frontmatter: 5,
  missing_name: 4,
  missing_description: 4,
  description_too_thin: 2,     // < 40 chars
  description_too_bloated: 2,  // > 600 chars
  missing_body_heading: 1,
  navigator_too_long: 1,       // per 20 lines over the budget
  broken_link: 3,              // per dead relative link in SKILL.md
  orphan_reference: 2,         // per reference file never linked from SKILL.md
  missing_when_to_read: 2,     // per reference file without a "when to read" preface
  generic_ref_name: 1,         // per generically-named reference file
  duplicated_heading: 1,       // per heading text repeated across files
};

const NAV_LINE_BUDGET = 100;             // navigator SKILL.md soft cap
const GENERIC_NAMES = /^(ref|reference|misc|notes?|stuff|extra|other|tmp|temp|doc|docs|info|details?|more|part\d+|file\d+|\d+)$/i;

function readFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

function normalizeHeading(h) {
  return h.replace(/^#+\s*/, "").trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

function lintSkill(dir) {
  const violations = [];
  const add = (kind, detail, n = 1) =>
    violations.push({ kind, detail, weight: WEIGHTS[kind] * n });

  const skillPath = join(dir, "SKILL.md");
  if (!existsSync(skillPath)) {
    return { dir, score: Infinity, error: "no SKILL.md", violations: [] };
  }
  const skill = readFileSync(skillPath, "utf8");

  // ── frontmatter ──
  const fm = readFrontmatter(skill);
  if (!fm) add("missing_frontmatter", "no --- frontmatter block");
  else {
    if (!fm.name) add("missing_name", "frontmatter lacks name:");
    if (!fm.description) add("missing_description", "frontmatter lacks description:");
    else {
      const d = fm.description.length;
      if (d < 40) add("description_too_thin", `description is ${d} chars`);
      if (d > 600) add("description_too_bloated", `description is ${d} chars`);
    }
  }

  // ── body heading ──
  const body = skill.replace(/^---\n[\s\S]*?\n---\n?/, "");
  if (!/^#\s+\S/m.test(body)) add("missing_body_heading", "no '# Title' heading in body");

  // ── reference files ──
  const refDirs = ["reference", "references", "docs"].map((d) => join(dir, d)).filter(existsSync);
  const refFiles = [];
  for (const rd of refDirs) {
    for (const f of readdirSync(rd)) {
      if (f.endsWith(".md") && statSync(join(rd, f)).isFile()) refFiles.push(join(rd, f));
    }
  }
  const isNavigator = refFiles.length > 0;

  // ── navigator length budget ──
  if (isNavigator) {
    const lines = skill.split("\n").length;
    if (lines > NAV_LINE_BUDGET) {
      add("navigator_too_long", `${lines} lines (budget ${NAV_LINE_BUDGET})`, Math.ceil((lines - NAV_LINE_BUDGET) / 20));
    }
  }

  // ── links in SKILL.md ──
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  const linkedRefs = new Set();
  let m;
  while ((m = linkRe.exec(skill))) {
    const target = m[1].split("#")[0].trim();
    if (!target || /^[a-z]+:\/\//i.test(target) || target.startsWith("mailto:")) continue; // external
    const abs = resolve(dir, target);
    if (!existsSync(abs)) add("broken_link", target);
    else if (abs.endsWith(".md")) linkedRefs.add(abs);
  }

  // ── orphan references + when-to-read + generic names ──
  for (const rf of refFiles) {
    const abs = resolve(rf);
    if (!linkedRefs.has(abs)) add("orphan_reference", basename(rf));
    const head = readFileSync(rf, "utf8").slice(0, 1200).toLowerCase();
    if (!/when (to|you) (read|should)/.test(head) && !/read this when/.test(head))
      add("missing_when_to_read", basename(rf));
    const stem = basename(rf, ".md");
    if (GENERIC_NAMES.test(stem)) add("generic_ref_name", stem);
  }

  // ── duplicated headings across files (single source of truth) ──
  const headingOwners = new Map(); // normalized heading -> Set(file)
  const allFiles = [skillPath, ...refFiles];
  for (const f of allFiles) {
    const txt = readFileSync(f, "utf8");
    for (const line of txt.split("\n")) {
      if (/^#{2,}\s+\S/.test(line)) {
        const h = normalizeHeading(line);
        if (h.length < 4) continue;
        if (!headingOwners.has(h)) headingOwners.set(h, new Set());
        headingOwners.get(h).add(basename(f));
      }
    }
  }
  for (const [h, owners] of headingOwners) {
    if (owners.size > 1) add("duplicated_heading", `"${h}" in ${[...owners].join(", ")}`);
  }

  const score = violations.reduce((s, v) => s + v.weight, 0);
  return { dir, score, isNavigator, refCount: refFiles.length, violations };
}

// ── CLI ──
const args = process.argv.slice(2);
const jsonOut = args.includes("--json");
const dirs = args.filter((a) => !a.startsWith("--"));
if (dirs.length === 0) {
  console.error("usage: node skill-lint.mjs <skill-dir> [more-dirs…] [--json]");
  process.exit(2);
}

const results = dirs.map(lintSkill);
if (jsonOut) {
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
} else {
  for (const r of results) {
    if (r.error) { console.log(`${r.score}\t${basename(r.dir)}\t(${r.error})`); continue; }
    console.log(`\n${basename(r.dir)} — score ${r.score} (${r.isNavigator ? `navigator, ${r.refCount} refs` : "single-file"})`);
    for (const v of r.violations) console.log(`  +${v.weight}  ${v.kind}: ${v.detail}`);
  }
}
