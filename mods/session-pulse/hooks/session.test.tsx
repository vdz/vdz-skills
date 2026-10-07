import { expect, test } from 'claude-code/testing'

import { boot, COMPOSER, pulse, reply } from './harness'

test('a reply ending in a Pulse line becomes the Pulse /pulse answers with', async ($, on) => {
  await boot($, on)
  await reply($, 'Tests are green.\n\n◂ your move · 3/5 · next: approve the PR')
  const { text } = await pulse($)
  expect(text).toContain('◂ your move · 3/5 · next: approve the PR')
})

test("a subagent's reply never moves the Pulse", async ($, on) => {
  await boot($, on)
  await reply($, '◂ your move · next: approve the PR')
  await reply($, '▸ working · 1/9 · next: grep everything', { agentId: 'a1' })
  expect((await pulse($)).text).toContain('◂ your move · next: approve the PR')
})

test('a reply without a Pulse line leaves an open Pulse Stale, a done one never', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · 2/5 · next: run the e2e')
  await reply($, 'Here is the answer to your side question.')
  expect((await pulse($)).text).toMatch(/stale/i)
  await reply($, '✓ done')
  await reply($, 'Another side question answered.')
  expect((await pulse($)).text).not.toMatch(/stale/i)
})

test('every prompt carries the Pulse line rule, and the current Pulse once there is one', async ($, on) => {
  await boot($, on)
  const first = await $.prompt.submit({ text: 'build the thing', wait: false, origin: COMPOSER })
  const rule = (first.context ?? []).join('\n')
  expect(rule).toContain('◂ your move')
  expect(rule).not.toContain('Current Pulse')
  await reply($, '▸ working · 2/5 · next: run the e2e')
  const later = await $.prompt.submit({ text: 'status?', wait: false, origin: COMPOSER })
  expect(later.text).toBe('status?')
  expect((later.context ?? []).join('\n')).toContain('Current Pulse: ▸ working · 2/5 · next: run the e2e')
})

test('a resumed or restarted session finds its Pulse where it left it', async ($, on) => {
  const saved = { move: 'your move', next: 'approve the PR', at: 1, isStale: false }
  await boot($, on, { sessionId: 's9', entries: { 'session:s9': { pulse: saved, history: [saved] } } })
  expect((await pulse($)).text).toContain('◂ your move · next: approve the PR')
})

test('/clear starts a fresh Pulse and keeps the earlier ones in the history', async ($, on) => {
  const { switchTo } = await boot($, on)
  await reply($, '✓ done')
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })
  switchTo('s2')
  const { text } = await pulse($)
  expect(text).toContain('No Pulse yet')
  expect(text).toContain('✓ done')
  await reply($, '▸ working · next: start the new thing')
  expect((await pulse($)).text).toMatch(/^▸ working · next: start the new thing/)
})
