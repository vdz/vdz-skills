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
  // A rule, not an "Earlier" heading, sets the history off; another sets off the gauges.
  expect(await pane.find({ type: 'Text', text: /Earlier/ })).toBeUndefined()
  expect(await pane.findAll({ type: 'Text', text: /^─{10,}$/ })).toHaveLength(2)
  // Each gauge a bar: its filled cells coloured by how full it is, its value beside.
  expect(await pane.find({ type: 'Text', text: /^context/ })).toBeTruthy()
  const bars = await pane.findAll({ type: 'Text', text: /^━+$/ })
  const fills = bars.filter(b => b.props.color !== undefined && b.props.color !== 'subtle').map(b => [b.text?.length, b.props.color])
  expect(fills).toEqual([[8, 'success'], [12, 'warning']])
  expect(await pane.find({ type: 'Text', text: /42%/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /61%/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /\$3\.20/ })).toBeTruthy()
  // Each is a paragraph of its own: the Pulse, every Earlier entry, and the two rules.
  const spaced = (await pane.findAll({ type: 'Box' })).filter(b => b.props.marginBottom === 1)
  expect(spaced).toHaveLength(4)
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
