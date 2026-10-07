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

// The time until a reset in its two largest units: "2h 10m", "3d 4h", "12m".
export function timeLeft(ms: number): string {
  const minutes = Math.round(ms / 60_000)
  if (minutes <= 0) return 'now'
  const [d, h, m] = [Math.floor(minutes / 1440), Math.floor((minutes % 1440) / 60), minutes % 60]
  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}

// A token count read short: "820", "6.2k", "38k".
export function tokens(n: number): string {
  if (n < 1000) return String(Math.round(n))
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  return `${Math.round(n / 1000)}k`
}

export type GitStatus = { branch: string; ahead: number; behind: number; changed: number }

// `git status --porcelain --branch`: its header line names the branch and how far
// it is from its upstream; every other line is one uncommitted file.
export function parseGitStatus(out: string): GitStatus {
  const [head = '', ...files] = out.split('\n').filter(line => line !== '')
  const name = head.replace(/^## /, '').replace(/^No commits yet on /, '')
  const branch = name.startsWith('HEAD (no branch)') ? 'detached' : (name.split('...')[0] ?? '').split(' ')[0] ?? ''
  const count = (word: string) => Number(head.match(new RegExp(`${word} (\\d+)`))?.[1] ?? 0)
  return { branch, ahead: count('ahead'), behind: count('behind'), changed: files.length }
}

// The reply with its Pulse line taken off the end, or null when it ends in none.
export function splitPulseLine(reply: string): { body: string; line: string } | null {
  if (parsePulseLine(reply) === null) return null
  const lines = reply.trimEnd().split('\n')
  const line = lines.pop()!.trim()
  return { body: lines.join('\n').trimEnd(), line }
}
