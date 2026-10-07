import { expect, test } from 'claude-code/testing'

import { parsePulseLine } from './pulse'

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
