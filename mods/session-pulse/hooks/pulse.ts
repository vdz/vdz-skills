// The Pulse line: the one line Claude ends a reply with while work is open.
//   ◂ your move · 3/5 · next: approve the PR
// Move first, then the Step (optional), then the Next action (optional).

export type Move = 'working' | 'your move' | 'blocked' | 'done'
export type Step = { n: number; of: number }
export type PulseLine = { move: Move; step?: Step; next?: string }

const GLYPHS: Record<string, Move> = { '▸': 'working', '◂': 'your move', '■': 'blocked', '✓': 'done' }

const LINE = /^([▸◂■✓])\s*(?:working|your move|blocked|done)?(?:\s*·\s*(\d+)\s*\/\s*(\d+))?(?:\s*·\s*next:\s*(.+?))?\s*$/

export function parsePulseLine(reply: string): PulseLine | null {
  // Claude sometimes sets the line in code or bold; the marks are not part of it.
  const last = (reply.trimEnd().split('\n').at(-1) ?? '').trim().replace(/^[`*_]+|[`*_]+$/g, '').trim()
  const match = LINE.exec(last)
  if (!match) return null
  const [, glyph, n, of, next] = match
  const move = GLYPHS[glyph!]!
  return {
    move,
    ...(n !== undefined && of !== undefined ? { step: { n: Number(n), of: Number(of) } } : {}),
    ...(next !== undefined ? { next } : {}),
  }
}

const GLYPH_OF: Record<Move, string> = { working: '▸', 'your move': '◂', blocked: '■', done: '✓' }

export function formatPulse(line: PulseLine): string {
  return [
    `${GLYPH_OF[line.move]} ${line.move}`,
    ...(line.step ? [`${line.step.n}/${line.step.of}`] : []),
    ...(line.next ? [`next: ${line.next}`] : []),
  ].join(' · ')
}

// The footer label: the Move and the Step, nothing more. The desktop footer crops
// past about 20 characters, so the Next action lives in the pane and the reply.
export function footerLabel(line: PulseLine): string {
  const step = line.step ? ` ${line.step.n}/${line.step.of}` : ''
  return `${GLYPH_OF[line.move]} ${line.move}${step}`
}

export type Tone = 'accent' | 'strong' | 'plain' | 'faint'
export type Part = { text: string; tone: Tone }

// The Pulse line as typeset parts: the glyph and the "next:" in the accent, the
// Move strong, the Step and Next action plain, the separators faint enough almost
// to disappear. Joined, the parts read exactly as formatPulse.
export function pulseParts(line: PulseLine): Part[] {
  const parts: Part[] = [
    { text: `${GLYPH_OF[line.move]} `, tone: 'accent' },
    { text: line.move, tone: 'strong' },
  ]
  const gap: Part = { text: ' · ', tone: 'faint' }
  if (line.step) parts.push(gap, { text: `${line.step.n}/${line.step.of}`, tone: 'plain' })
  if (line.next) parts.push(gap, { text: 'next: ', tone: 'accent' }, { text: line.next, tone: 'plain' })
  return parts
}

// A gauge's bar: how many of its cells a percentage fills. Anything above zero
// shows at least one cell, so a barely used limit still reads as used.
export function gaugeCells(percent: number, width: number): { filled: number; empty: number } {
  const share = Math.min(Math.max(percent, 0), 100) / 100
  const filled = percent > 0 ? Math.max(1, Math.round(share * width)) : 0
  return { filled, empty: width - filled }
}

// The theme colour a gauge fills with: calm while there is room, warmer as it runs out.
export function gaugeColor(percent: number): 'success' | 'warning' | 'error' {
  return percent >= 85 ? 'error' : percent >= 60 ? 'warning' : 'success'
}

// The reply with its Pulse line taken off the end, or null when it ends in none.
export function splitPulseLine(reply: string): { body: string; line: string } | null {
  if (parsePulseLine(reply) === null) return null
  const lines = reply.trimEnd().split('\n')
  const line = lines.pop()!.trim()
  return { body: lines.join('\n').trimEnd(), line }
}
