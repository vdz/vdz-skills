import { expect, test } from 'claude-code/testing'

import { footerLabel, parsePulseLine, pulseParts } from './pulse'

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

test('a Pulse line splits into parts: the Move strong, the separators faint', async () => {
  expect(pulseParts({ move: 'your move', step: { n: 3, of: 5 }, next: 'approve the PR' })).toEqual([
    { text: '◂ your move', tone: 'strong' },
    { text: ' · ', tone: 'faint' },
    { text: '3/5', tone: 'plain' },
    { text: ' · ', tone: 'faint' },
    { text: 'next: ', tone: 'faint' },
    { text: 'approve the PR', tone: 'plain' },
  ])
  expect(pulseParts({ move: 'done' })).toEqual([{ text: '✓ done', tone: 'strong' }])
})

test('the footer label is the Move and the Step only, short enough for any footer', async () => {
  expect(footerLabel({ move: 'your move', step: { n: 3, of: 5 }, next: 'approve the PR' })).toBe('◂ your move 3/5')
  expect(footerLabel({ move: 'working', next: 'a very long next action that would never fit' })).toBe('▸ working')
})
