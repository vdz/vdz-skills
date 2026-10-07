import { expect, test } from 'claude-code/testing'

import { boot, PLUGIN, reply } from './harness'

const FOOTER = { component: 'SessionMode' as const, props: { modes: ['bypass permissions'] } }

test('the footer shows the Pulse beside the mode labels already there', async ($, on) => {
  await boot($, on)
  await reply($, '◂ your move · 3/5 · next: approve the PR')
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, requestId: `f-${surface}`, ...FOOTER })
    expect(await ui.find({ type: 'Button', text: '◂ 3/5 · next: approve the PR' })).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: 'bypass permissions' })).toBeTruthy()
    await ui.unmount()
  }
})

test('a long Next action is cut short in the footer', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · next: wire the Jira transition into the release flow and then tell the team')
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'f-long', ...FOOTER })
  const button = await ui.find({ type: 'Button', text: /^▸ next: wire the Jira/ })
  expect(String(button?.props.label).length).toBeLessThanOrEqual(52)
  expect(String(button?.props.label)).toMatch(/…$/)
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
  const pane = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'session-pulse', component: 'Pane', props: {} as never })
  expect(await pane.find({ type: 'Text', text: '◂ your move · 3/3 · next: approve the PR' })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: '▸ working · 1/3 · next: write the parser' })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /context 42%.*5h 61%.*\$3\.20/ })).toBeTruthy()
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
