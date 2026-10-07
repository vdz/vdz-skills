import { expect, test } from 'claude-code/testing'

import { boot, PLUGIN, reply } from './harness'

const FOOTER = { component: 'SessionMode' as const, props: { modes: ['bypass permissions'] } }

test('the footer shows the Pulse beside the mode labels already there', async ($, on) => {
  await boot($, on)
  await reply($, '◂ your move · 3/5 · next: approve the PR')
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, requestId: `f-${surface}`, ...FOOTER })
    // A Button, as the desktop footer crops a Markdown and passes on none of its presses.
    expect((await ui.find({ type: 'Button', key: 'pulse-footer' }))?.props.label).toBe('◂ your move 3/5')
    expect(await ui.find({ type: 'Text', text: 'bypass permissions' })).toBeTruthy()
    await ui.unmount()
  }
})

test('a long Next action stays out of the footer, which the desktop crops past ~20 characters', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · 12/20 · next: wire the Jira transition into the release flow and then tell the team')
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'f-long', ...FOOTER })
  expect((await ui.find({ type: 'Button', key: 'pulse-footer' }))?.props.label).toBe('▸ working 12/20')
  await ui.unmount()
})

test('with no Pulse yet the footer is left as it was', async ($, on) => {
  await boot($, on)
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'f-none', ...FOOTER })
  expect(await ui.find({ key: 'pulse-footer' })).toBeUndefined()
  await ui.unmount()
})

test('pressing the footer opens the Pulse pane with the history and the meters', async ($, on) => {
  const { seen } = await boot($, on)
  await reply($, '▸ working · 1/3 · next: write the parser')
  await reply($, '◂ your move · 3/3 · next: approve the PR')
  const footer = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'f-press', ...FOOTER })
  await $.ui.press({ plugin: PLUGIN, key: 'pulse-footer' })
  expect(seen.panes).toEqual(['session-pulse'])
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'session-pulse', component: 'Pane', props: { bodyColumns: 40 } as never })
  expect(await pane.find({ type: 'Text', text: '◂ your move · 3/3 · next: approve the PR' })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: '▸ working · 1/3 · next: write the parser' })).toBeTruthy()
  // No heading and no rule: space alone sets the history and the usage off.
  expect(await pane.find({ type: 'Text', text: /Earlier|─|━/ })).toBeUndefined()
  // Every fact, one line each, the name quiet and the detail grey beside the value.
  for (const name of ['context', 'memory', '5h', 'cost', 'errors', 'branch', 'changes']) expect(await pane.find({ key: `u-${name}` })).toBeTruthy()
  expect((await pane.find({ type: 'Text', text: /^context$/ }))?.props.color).toBe('inactive')
  expect(await pane.find({ type: 'Markdown', text: '`42%` used' })).toBeTruthy()
  expect((await pane.find({ type: 'Text', text: /^84k of 200k · compacts in 76k$/ }))?.props.color).toBe('subtle')
  expect(await pane.find({ type: 'Markdown', text: '[`61%` used](https://claude.ai/settings/usage)' })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /^resets 2h 10m$/ })).toBeTruthy()
  expect(await pane.find({ type: 'Markdown', text: '`$3.20`' })).toBeTruthy()
  expect(await pane.find({ type: 'Markdown', text: '[`feat/x`](https://github.com/vdz/skills/tree/feat/x)' })).toBeTruthy()
  // Narrow, the detail drops beneath the value, aligned with it; the name stays at the top.
  expect((await pane.find({ key: 'u-memory' }))?.props.alignItems).toBe('flex-start')
  expect((await pane.find({ key: 'v-memory' }))?.props).toMatchObject({ flexWrap: 'wrap', minWidth: 0, flexShrink: 1 })
  // Nothing folds, and nothing waits on a hover.
  expect(await pane.find({ key: 'u-compact' })).toBeUndefined()
  expect(await pane.find({ type: 'Markdown', text: /pulse\.invalid\/fold|▾|▴/ })).toBeUndefined()
  const hidden = (await pane.findAll({ type: 'Box' })).filter(b => b.props.display === 'none' || b.props.position === 'absolute')
  expect(hidden).toHaveLength(0)
  await pane.unmount()
  await footer.unmount()
})

test('where no pane can be placed, pressing the footer shows the Pulse as a toast', async ($, on) => {
  const { seen } = await boot($, on, { isPaneRefused: true })
  await reply($, '◂ your move · next: approve the PR')
  const footer = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'f-toast', ...FOOTER })
  await $.ui.press({ plugin: PLUGIN, key: 'pulse-footer' })
  expect(seen.toasts.join('\n')).toContain('◂ your move · next: approve the PR')
  await footer.unmount()
})
