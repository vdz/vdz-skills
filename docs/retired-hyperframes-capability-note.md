# HyperFrames — what it could do for you (retired from the harness 17 Aug 2026)

Removed from `~/.claude/skills` during the harness spring-clean: never invoked in 1,551
sessions except `hyperframes-media` once. **Nothing was deleted** — all ten skills still
live in `~/.agents/skills/`. This note exists so the capability isn't forgotten.

## What it is

HyperFrames builds **video from HTML**. You author a composition as an HTML file; it
renders to an actual video file. The mental split that matters:

> **read-and-keep → `html-report`** (which you use constantly) · **watch-and-play → `hyperframes`**

## What it can actually make

| Capability | Concretely |
|---|---|
| Title cards, overlays, scene transitions | Crossfades, wipes, reveals, shader transitions |
| Captions synced to audio | Auto-generated from a transcript, word-level timing |
| Text-to-speech narration | Local Kokoro TTS — no cloud, no API key |
| Transcription | Local Whisper — feed it audio, get caption timings |
| Audio-reactive animation | Beat sync, glow, pulse driven by a music track |
| Animated text emphasis | Marker sweeps, hand-drawn circles, burst lines, scribble |
| Background removal | Local u2net — turn a video into a transparent overlay |
| Website → video | Point it at a URL, get a promo/product-tour video |

## The ten skills, and what each was for

**Core (4):** `hyperframes` (authoring, timing, media) · `hyperframes-cli` (`init`, `lint`,
`inspect`, `preview`, `render`, `doctor`) · `hyperframes-media` (TTS, transcribe,
remove-background) · `hyperframes-registry` (install prebuilt blocks/components).

**Entry point (1):** `website-to-hyperframes` — the "here's a URL, make me a video" path.
This is the one to try first if you ever want to demo it.

**Animation adapters (5):** `gsap`, `animejs`, `lottie`, `three`, `css-animations` — only
useful *inside* a composition, to make motion deterministic and seek-driven so it renders
frame-accurately.

## Where it would have earned its place

Realistic uses in your world, none of which you've hit yet:

- A 60-second demo video of the **LSTV Pi replacement** instead of a live demo that can fail.
- A narrated **VF UK Trade-In** walkthrough for a client who won't join a call.
- An **R&D Townhall** segment — animated architecture explainer rather than slides.
- Turning a `visual-recap` of a big PR into something a non-engineer will actually watch.

## Bringing it back

```bash
for s in hyperframes hyperframes-cli hyperframes-media hyperframes-registry website-to-hyperframes gsap animejs lottie three css-animations; do ln -s ../../.agents/skills/$s ~/.claude/skills/$s; done
```

Or just the entry point, which is what you'd actually want first:

```bash
ln -s ../../.agents/skills/website-to-hyperframes ~/.claude/skills/website-to-hyperframes && ln -s ../../.agents/skills/hyperframes ~/.claude/skills/hyperframes
```
