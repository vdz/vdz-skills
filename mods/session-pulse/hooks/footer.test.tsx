import { expect, test } from 'claude-code/testing'

import { boot, PLUGIN, reply } from './harness'

const FOOTER = { component: 'SessionMode' as const, props: { modes: ['bypass permissions'] } }

test('the footer shows the Pulse beside the mode labels already there', async ($, on) => {
  await boot($, on)
  await reply($, '◂ your move · 3/5 · next: approve the PR')
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, requestId: `f-${surface}`, ...FOOTER })
    expect(await ui.find({ type: 'Button', text: '◂ your move 3/5' })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: 'bypass permissions' })).toBeTruthy()
    await ui.unmount()
  }
})

test('a long Next action stays out of the footer, which the desktop crops past ~20 characters', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · 12/20 · next: wire the Jira transition into the release flow and then tell the team')
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'f-long', ...FOOTER })
  const label = String((await ui.find({ type: 'Button' }))?.props.label)
  expect(label).toBe('▸ working 12/20')
  await ui.unmount()
})

test('with no Pulse yet the footer is left as it was', async ($, on) => {
  await boot($, on)
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'f-none', ...FOOTER })
  expect(await ui.findAll({ type: 'Button' })).toHaveLength(0)
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
  // The usage as two columns: the name quiet, the value plain and saying what it counts.
  for (const [name, value] of [['context', '42% used'], ['5h', '61% used'], ['cost', '$3.20']]) {
    expect((await pane.find({ type: 'Text', text: new RegExp(`^${name}$`) }))?.props.color).toBe('inactive')
    expect(await pane.find({ type: 'Text', text: value })).toBeTruthy()
  }
  // Each has a hint, hidden on the desktop until the pointer is over its row.
  expect(await pane.find({ type: 'Text', text: /84k of 200k tokens/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /resets in 2h 10m/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /API price/ })).toBeTruthy()
  // (The test kit's view of a Box leaves out its hover, the reveal itself.)
  // Eight rows: context, compact, memory; 5h, cost; errors, branch, changes.
  expect((await pane.findAll({ type: 'Box' })).filter(b => b.props.display === 'none')).toHaveLength(8)
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

test('the terminal, with no pointer to hover, shows the usage hints outright', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · next: write the parser')
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', requestId: 'session-pulse', component: 'Pane', props: { bodyColumns: 40 } as never })
  expect(await pane.find({ type: 'Text', text: /84k of 200k tokens/ })).toBeTruthy()
  expect((await pane.findAll({ type: 'Box' })).filter(b => b.props.display === 'none')).toHaveLength(0)
  await pane.unmount()
})
