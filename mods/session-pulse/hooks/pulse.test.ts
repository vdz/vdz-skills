import { expect, test } from 'claude-code/testing'

import { footerLabel, parseGitStatus, parsePulseLine, pulseParts, timeLeft, tokens } from './pulse'

test('a reply ending in a Pulse line yields its Move, Step and Next action', async () => {
  const reply = 'Tests are green.\n\n◂ your move · 3/5 · next: approve the PR'
  expect(parsePulseLine(reply)).toEqual({ move: 'your move', step: { n: 3, of: 5 }, next: 'approve the PR' })
})

test('a reply without a Pulse line as its last line yields none', async () => {
  expect(parsePulseLine('Just an answer.')).toBeNull()
  expect(parsePulseLine('◂ your move · next: x\n\nand then more text')).toBeNull()
  expect(parsePulseLine('')).toBeNull()
})

test('a done Pulse line needs nothing after its Move', async () => {
  expect(parsePulseLine('All merged.\n\n✓ done')).toEqual({ move: 'done' })
})

test('a Pulse line set in code or bold still reads', async () => {
  expect(parsePulseLine('`▸ working · 2/4 · next: run the e2e`')).toEqual({
    move: 'working',
    step: { n: 2, of: 4 },
    next: 'run the e2e',
  })
  expect(parsePulseLine('**■ blocked · next: get a vdz token**')).toEqual({ move: 'blocked', next: 'get a vdz token' })
})

test('a Pulse line splits into parts: the glyph and "next:" accented, the Move strong, the separators faint', async () => {
  expect(pulseParts({ move: 'your move', step: { n: 3, of: 5 }, next: 'approve the PR' })).toEqual([
    { text: '◂ ', tone: 'accent' },
    { text: 'your move', tone: 'strong' },
    { text: ' · ', tone: 'faint' },
    { text: '3/5', tone: 'plain' },
    { text: ' · ', tone: 'faint' },
    { text: 'next: ', tone: 'accent' },
    { text: 'approve the PR', tone: 'plain' },
  ])
  expect(pulseParts({ move: 'done' })).toEqual([
    { text: '✓ ', tone: 'accent' },
    { text: 'done', tone: 'strong' },
  ])
})

test('the footer label is the Move and the Step only, short enough for any footer', async () => {
  expect(footerLabel({ move: 'your move', step: { n: 3, of: 5 }, next: 'approve the PR' })).toBe('◂ your move 3/5')
  expect(footerLabel({ move: 'working', next: 'a very long next action that would never fit' })).toBe('▸ working')
})

test('the time left to a reset reads in its two largest units', async () => {
  const minute = 60_000
  expect(timeLeft((2 * 60 + 10) * minute)).toBe('2h 10m')
  expect(timeLeft((3 * 24 * 60 + 4 * 60 + 30) * minute)).toBe('3d 4h')
  expect(timeLeft(12 * minute)).toBe('12m')
  expect(timeLeft(-5 * minute)).toBe('now')
})

test('token counts read short: whole hundreds, one decimal under ten thousand, whole thousands above', async () => {
  expect([820, 6_240, 38_400, 1_000_000].map(tokens)).toEqual(['820', '6.2k', '38k', '1000k'])
})

test('git status reads as the branch, how far it is from its upstream, and the uncommitted files', async () => {
  const out = '## feat/session-pulse-mod...origin/feat/session-pulse-mod [ahead 2, behind 1]\n M a.ts\n?? b.ts\n'
  expect(parseGitStatus(out)).toEqual({ branch: 'feat/session-pulse-mod', ahead: 2, behind: 1, changed: 2 })
  expect(parseGitStatus('## main\n')).toEqual({ branch: 'main', ahead: 0, behind: 0, changed: 0 })
  expect(parseGitStatus('## No commits yet on main\n')).toEqual({ branch: 'main', ahead: 0, behind: 0, changed: 0 })
  expect(parseGitStatus('## HEAD (no branch)\n M x\n')).toEqual({ branch: 'detached', ahead: 0, behind: 0, changed: 1 })
})
