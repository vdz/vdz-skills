# Tooling — interactive snippets

> Copy-paste implementations of the interactions a report can earn. Pulled verbatim
> from the two shipped examples so they match the styles' conventions. Add an affordance
> only after [`choosing.md`](choosing.md) §2 says the reader will use it.

## Conventions these all share

- **One storage key prefix per report.** Pick a unique prefix (e.g. `myreport:`) and never
  collide with another report's. Two patterns are in use:
  - **Single JSON blob** under one key (Editorial): `{ "note-id": "text", "done": {...} }`.
  - **One key per note** (Ledger): `prefix + ":" + noteId`. Either is fine — be consistent
    within a report.
- **Graceful degradation.** Wrap all `localStorage` access in `try/catch`; notes fall back
  to in-memory if storage is unavailable. Clipboard has an `execCommand` fallback.
- **No blocking dialogs.** Destructive actions use a two-click arm/confirm, never `confirm()`.
- **Vanilla JS only.** No libraries. Everything degrades to a readable static document with
  JS off.

---

## 1. Inline notes (auto-saving, auto-growing)

A `<textarea data-note-id="…">` per annotatable spot. Saves on input (debounced), restores
on load, grows to fit. **Ledger pattern (one key per note):**

```html
<div class="note" data-note-id="t1" data-note-title="Decision 1 — caching">
  <textarea placeholder="Your note…"></textarea>
  <span class="save-hint">saved</span>
</div>
```

```js
const PREFIX = "myreport";                       // ← unique per report
const keyFor = id => PREFIX + ":" + id;
const notes = [...document.querySelectorAll(".note")];

function wireNote(n) {
  const ta = n.querySelector("textarea");
  const id = n.getAttribute("data-note-id");
  const hint = n.querySelector(".save-hint");
  if (!ta || !id) return;
  try { const v = localStorage.getItem(keyFor(id)); if (v != null) ta.value = v; } catch {}
  const grow = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
  n.classList.toggle("has-content", ta.value.trim().length > 0);
  grow();
  let t;
  ta.addEventListener("input", () => {
    grow();
    n.classList.toggle("has-content", ta.value.trim().length > 0);
    clearTimeout(t);
    t = setTimeout(() => {
      const val = ta.value;
      try {
        if (val.trim()) { localStorage.setItem(keyFor(id), val); }
        else { localStorage.removeItem(keyFor(id)); }
      } catch {}                                  // storage unavailable → in-memory only
      if (hint) { hint.classList.add("show"); setTimeout(() => hint.classList.remove("show"), 1100); }
      refreshCount();
    }, 350);
  });
}
notes.forEach(wireNote);
```

**Editorial variant (single JSON blob)** — when you also store other state (done flags,
theme) under the same key:

```js
const STORAGE_KEY = "myreport-notes";
const readStore = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } };
const stored = readStore();
document.querySelectorAll("textarea[data-note]").forEach(t => {
  const key = t.getAttribute("data-note");
  const grow = () => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; };
  if (stored[key]) t.value = stored[key];
  grow();
  t.addEventListener("input", () => {
    grow();
    const c = readStore(); c[key] = t.value; localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  });
});
```

---

## 2. Copy all notes (to markdown)

Gathers every non-empty note into a markdown blob and copies it — the bridge from report to
PR/ticket/doc. Includes the clipboard fallback.

```js
document.getElementById("copyAll").addEventListener("click", () => {
  const lines = ["# Report Notes", ""];
  let any = false;
  notes.forEach(n => {
    const ta = n.querySelector("textarea");
    if (!ta || !ta.value.trim()) return;
    any = true;
    const title = n.getAttribute("data-note-title") || n.getAttribute("data-note-id") || "Note";
    lines.push("## " + title, ta.value.trim(), "");
  });
  if (!any) { showToast("No notes yet — nothing to copy."); return; }
  const text = lines.join("\n");
  const count = lines.filter(l => l.startsWith("## ")).length;
  const done = () => showToast(`Copied ${count} note${count === 1 ? "" : "s"}.`);
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => { fallbackCopy(text); done(); });
  else { fallbackCopy(text); done(); }
});

function fallbackCopy(text) {
  const tmp = document.createElement("textarea");
  tmp.value = text; tmp.style.position = "fixed"; tmp.style.opacity = "0";
  document.body.appendChild(tmp); tmp.select();
  try { document.execCommand("copy"); } catch {}
  document.body.removeChild(tmp);
}
```

## 2b. Copy a single code block

A "Copy" button injected into every `<pre>` — used by Editorial's code panels.

```js
document.querySelectorAll("pre.block, .code-panel").forEach(box => {
  const pre = box.matches("pre") ? box : box.querySelector("pre");
  if (!pre) return;
  const b = document.createElement("button");
  b.className = "copy-btn"; b.textContent = "Copy";
  b.addEventListener("click", () => navigator.clipboard.writeText(pre.innerText).then(() => {
    b.textContent = "Copied"; b.classList.add("done");
    setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1600);
  }));
  box.appendChild(b);
});
```

---

## 3. Live note count

A small "N notes" readout in the toolbar; call `refreshCount()` after any note change.

```js
function refreshCount() {
  const n = notes.filter(x => x.querySelector("textarea")?.value.trim()).length;
  const el = document.querySelector(".note-count");
  if (el) el.innerHTML = n ? `<b>${n}</b> note${n === 1 ? "" : "s"}` : "no notes";
}
refreshCount();
```

---

## 4. Clear all (two-click arm/confirm)

Destructive, but no blocking `confirm()`. First click arms (and labels) the button; a second
within 3.5s commits; otherwise it disarms.

```js
const clearBtn = document.getElementById("clearAll");
let armed = false, armTimer = null;
clearBtn.addEventListener("click", () => {
  if (!armed) {
    armed = true; clearBtn.textContent = "Confirm clear"; clearBtn.classList.add("is-armed");
    armTimer = setTimeout(() => { armed = false; clearBtn.textContent = "Clear all"; clearBtn.classList.remove("is-armed"); }, 3500);
    return;
  }
  clearTimeout(armTimer); armed = false;
  clearBtn.textContent = "Clear all"; clearBtn.classList.remove("is-armed");
  notes.forEach(n => {
    const ta = n.querySelector("textarea"); const id = n.getAttribute("data-note-id");
    if (ta) ta.value = "";
    n.classList.remove("has-content");
    try { localStorage.removeItem(keyFor(id)); } catch {}
  });
  refreshCount();
  showToast("All notes cleared.");
});
```

---

## 5. Toast (transient confirmation)

One reusable non-blocking message used by copy/clear above.

```html
<div id="toast" class="toast" role="status" aria-live="polite"></div>
```

```css
.toast { position: fixed; left: 50%; bottom: 28px; transform: translate(-50%, 12px);
  background: var(--ink); color: var(--paper); padding: 10px 18px; border-radius: 8px;
  font-size: 14px; opacity: 0; pointer-events: none; transition: opacity .2s, transform .2s; z-index: 100; }
.toast.show { opacity: 1; transform: translateX(-50%); }
```

```js
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
```

---

## 6. Theme / palette switch (persisted)

Editorial scopes palettes with `html[data-palette]`; `:root` is the default. A segmented
control flips the attribute and persists the choice.

```js
(function () {
  const DEFAULT = "daylight", PAL_KEY = "report-palette";
  const opts = [...document.querySelectorAll("#palette-tool .seg-opt")];
  function apply(name, save) {
    if (name === DEFAULT) document.documentElement.removeAttribute("data-palette");
    else document.documentElement.setAttribute("data-palette", name);
    opts.forEach(o => o.setAttribute("aria-pressed", o.dataset.palette === name));
    if (save) { const st = readStore(); st[PAL_KEY] = name; localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); }
  }
  opts.forEach(o => o.addEventListener("click", () => apply(o.dataset.palette, true)));
  apply(readStore()[PAL_KEY] || DEFAULT, false);   // restore on load
})();
```

The CSS side is just attribute-scoped token overrides — no JS knows the actual colors:

```css
:root              { --paper: #f6f2ea; --ink: #2f2c27; /* …default (daylight) */ }
html[data-palette="dusk"] { --paper: #211d17; --ink: #efe7d6; /* …dark */ }
```

---

## 7. Done checkboxes (strike + persist)

Per-step completion that strikes the title and survives reload (Editorial; stored under a
`done` sub-object in the JSON blob).

```js
document.querySelectorAll(".done-box[data-done]").forEach(box => {
  const key = box.getAttribute("data-done");
  const step = box.closest(".step");
  const done = (stored.done && typeof stored.done === "object") ? stored.done : {};
  box.checked = !!done[key];
  step?.classList.toggle("done", box.checked);
  box.addEventListener("change", () => {
    const c = readStore(); const d = (c.done && typeof c.done === "object") ? c.done : {};
    d[key] = box.checked; c.done = d; localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    step?.classList.toggle("done", box.checked);
  });
});
```

---

## 8. Collapsible detail (toggle)

Show/hide long detail (logs, full diffs) without a library. Prefer native `<details>` when
you don't need to relocate content; use a button when you do (Editorial moves the note row
below the code when its panel opens).

```html
<details class="drawer"><summary>Full diff</summary><pre class="block">…</pre></details>
```

```js
// Button variant — toggles a sibling panel and relabels itself.
document.querySelectorAll(".toggle").forEach(btn => btn.addEventListener("click", () => {
  const panel = btn.closest(".main").querySelector(".code-panel");
  const open = panel.classList.toggle("open");
  btn.classList.toggle("open", open);
  btn.firstChild.textContent = open ? "Hide code " : "View code ";
}));
```

---

## When you need something not here

If the report's job needs an interaction none of these cover (drag-to-reorder, a slider-
driven viz, an editable live-rendered template, keyboard deck nav), build it from these
conventions — `try/catch` storage, fallback clipboard, arm/confirm for destructive, vanilla
JS, degrade gracefully — and if it's a shape you'll reuse, fold it into a style's spec +
example rather than leaving it a one-off (SKILL.md → *Adding a new style*).
```
