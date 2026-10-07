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

const NEXT_SHOWN = 40

// The footer's short form: the glyph alone stands for the Move once a Next action
// follows it, and that Next action is cut to fit beside the mode labels.
export function footerLabel(line: PulseLine): string {
  const glyph = GLYPH_OF[line.move]
  const step = line.step ? [`${line.step.n}/${line.step.of}`] : []
  if (!line.next || line.move === 'done') return [`${glyph} ${line.move}`, ...step].join(' · ')
  const next = line.next.length > NEXT_SHOWN ? `${line.next.slice(0, NEXT_SHOWN - 1).trimEnd()}…` : line.next
  return [glyph, ...step.map(s => `${s} ·`), `next: ${next}`].join(' ')
}

// The reply with its Pulse line taken off the end, or null when it ends in none.
export function splitPulseLine(reply: string): { body: string; line: string } | null {
  if (parsePulseLine(reply) === null) return null
  const lines = reply.trimEnd().split('\n')
  const line = lines.pop()!.trim()
  return { body: lines.join('\n').trimEnd(), line }
}
