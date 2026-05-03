# vdz-skills

Personal collection of [Claude Code skills](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills) I've used or authored. Kept here for sync, access, and reuse across machines.

## Skills

| Skill | Description |
|---|---|
| [`regression-dog`](regression-dog/) | Review code changes for behavioral regressions. Surfaces "this used to do X, now it does Y" deltas without judging which is correct. |
| [`ripe-init`](ripe-skills/skills/ripe-init/) | Scaffold a new [Ripe Method](https://github.com/vdz/ripe-skills) project: Vite + TypeScript + Redux Toolkit + routing. |
| [`building-ripe-store`](ripe-skills/skills/building-ripe-store/) | Create/modify Redux store branches: actions, reducers, listeners, API functions, dual-structure state. |
| [`building-ripe-components`](ripe-skills/skills/building-ripe-components/) | Create/modify React components: anatomy, semantic TSX, two-level aliases, styled-components. |
| [`building-ripe-routing`](ripe-skills/skills/building-ripe-routing/) | React Router + `setLocation` bridge, preemptive hydration via listeners. |

The four `*-ripe-*` skills live in the [`ripe-skills`](https://github.com/vdz/ripe-skills) submodule (also published to npm as [`ripe-skills`](https://www.npmjs.com/package/ripe-skills)).

## Skills I use (external)

These aren't in this repo — credit to their authors. Listed here so anyone seeing my workflow knows the rest of my stack.

| Plugin | Source | What it provides |
|---|---|---|
| **superpowers** | [obra/superpowers](https://github.com/obra/superpowers) by Jesse Vincent | Brainstorming, writing/executing plans, TDD, systematic debugging, code review, parallel-agent dispatch, git worktrees, verification-before-completion |
| **mattpocock/skills** | [mattpocock/skills](https://github.com/mattpocock/skills) by Matt Pocock | `diagnose`, `tdd`, `grill-me`, `triage`, `to-prd`, `to-issues`, `caveman`, `git-guardrails`, `improve-codebase-architecture`, plus per-repo `setup` |

> **Install:** `superpowers` via Claude Code's plugin system (`claude plugin install obra/superpowers`); Matt Pocock's collection via `npx skills@latest add mattpocock/skills`.

## Install

Clone with submodules:

```sh
git clone --recurse-submodules https://github.com/vdz/vdz-skills.git
```

If already cloned without `--recurse-submodules`:

```sh
git submodule update --init --recursive
```

### Install a single skill into Claude Code

Copy:

```sh
cp -r regression-dog ~/.claude/skills/
```

Or symlink (so updates here are picked up live):

```sh
ln -s "$(pwd)/regression-dog" ~/.claude/skills/regression-dog
```

For the Ripe skills, the easiest path is `npx ripe-skills` (installs all four), or the same copy/symlink pattern from `ripe-skills/skills/<name>/`.

### Update the ripe-skills submodule

```sh
git submodule update --remote ripe-skills
```

## Layout

```
vdz-skills/
├── README.md
├── .gitignore
├── regression-dog/
│   └── SKILL.md
└── ripe-skills/             # submodule → github.com/vdz/ripe-skills
    └── skills/
        ├── ripe-init/
        ├── building-ripe-store/
        ├── building-ripe-components/
        └── building-ripe-routing/
```

## Attribution

`regression-dog` adapted from [Itay Mamman's gist](https://gist.github.com/imaman/24782ada63b2349c04432b50f4475638).

## License

MIT
