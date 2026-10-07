import { expect, test } from 'claude-code/testing'

import { boot, PLUGIN, reply } from './harness'

const FOOTER = { component: 'SessionMode' as const, props: { modes: ['bypass permissions'] } }

test('the footer shows the Pulse beside the mode labels already there', async ($, on) => {
  await boot($, on)
  await reply($, '◂ your move · 3/5 · next: approve the PR')
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, requestId: `f-${surface}`, ...FOOTER })
    expect(await ui.find({ type: 'Button', text: '◂ your move 3/5' })).toBeTruthy()
    expect((await ui.find({ key: 'tip-footer' }))?.text).toMatch(/open the Pulse pane$/)
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
  // Short at first: context, the limits and cost, no hints and nothing else.
  for (const [name, value] of [['context', '`42%` used'], ['cost', '`$3.20`']]) {
    expect((await pane.find({ type: 'Text', text: new RegExp(`^${name}$`) }))?.props.color).toBe('inactive')
    expect(await pane.find({ type: 'Markdown', text: value })).toBeTruthy()
  }
  expect(await pane.find({ type: 'Markdown', text: '[`61%` used](https://claude.ai/settings/usage)' })).toBeTruthy()
  for (const name of ['compact', 'memory', 'errors', 'branch', 'changes']) expect(await pane.find({ key: `u-${name}` })).toBeUndefined()
  expect(await pane.find({ type: 'Text', text: /^84k of 200k$/ })).toBeUndefined()
  // The block's top-right icon shows the rest, and says so.
  // Padded wide enough to hit, and with no tip: one would open over it and take the click.
  expect((await pane.find({ type: 'Button', key: 'pulse-more' }))?.props.label).toBe('\u00a0\u00a0▾\u00a0\u00a0')
  expect(await pane.find({ key: 'tip-more' })).toBeUndefined()
  // Short, the links need no tips.
  expect((await pane.findAll({ type: 'Box' })).some(b => b.props.display === 'none' && b.text === 'usage on claude.ai')).toBe(false)
  // A pointer on a placed Box is on its parent, so nothing pressable sits in one: only hidden tips are placed.
  const placed = (await pane.findAll({ type: 'Box' })).filter(b => b.props.position === 'absolute')
  expect(placed.every(b => b.props.display === 'none')).toBe(true)
  // `more` shows the rest, each with its hint beneath in the faintest grey.
  await pane.press({ key: 'pulse-more' })
  expect((await pane.find({ type: 'Text', text: /^84k of 200k$/ }))?.props.color).toBe('subtle')
  expect(await pane.find({ type: 'Text', text: /^resets in 2h 10m$/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /^at API prices$/ })).toBeTruthy()
  expect(await pane.find({ key: 'u-branch' })).toBeTruthy()
  expect((await pane.find({ type: 'Button', key: 'pulse-more' }))?.props.label).toBe('\u00a0\u00a0▴\u00a0\u00a0')
  // No hint waits on a hover; what hides is only the tip each link and button carries.
  const hidden = (await pane.findAll({ type: 'Box' })).filter(b => b.props.display === 'none').map(b => b.text)
  expect(hidden).toEqual(expect.arrayContaining(['usage on claude.ai', 'branch on GitHub']))
  expect(hidden.every(tip => !/^84k of 200k$|^at API prices$/.test(tip ?? ''))).toBe(true)
  // Each tip sits at the right end of its own row, over nothing.
  const tip = (await pane.findAll({ type: 'Box' })).find(b => b.props.display === 'none' && b.text === 'usage on claude.ai')
  expect(tip?.props).toMatchObject({ position: 'absolute', top: 0, right: 0 })
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
