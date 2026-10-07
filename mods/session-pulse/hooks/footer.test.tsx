import { expect, test } from 'claude-code/testing'

import { action, boot, PLUGIN, reply } from './harness'

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
  // Short at first: context, the limits and cost, no hints and nothing else.
  for (const [name, value] of [['context', '`42%` used'], ['cost', '`$3.20`']]) {
    expect((await pane.find({ type: 'Text', text: new RegExp(`^${name}$`) }))?.props.color).toBe('inactive')
    expect(await pane.find({ type: 'Markdown', text: value })).toBeTruthy()
  }
  // Each link names where it goes in its own title: the surface's native tooltip.
  expect(await pane.find({ type: 'Markdown', text: '[`61%` used](https://claude.ai/settings/usage "Usage on claude.ai")' })).toBeTruthy()
  for (const name of ['compact', 'memory', 'errors', 'branch', 'changes']) expect(await pane.find({ key: `u-${name}` })).toBeUndefined()
  expect(await pane.find({ type: 'Text', text: /^84k of 200k$/ })).toBeUndefined()
  // The icon at the pane's right edge shows the rest: padded on its left alone, wide
  // enough to hit, the glyph flush right; no tip, as one would open over it and take the click.
  expect((await pane.find({ key: 'pulse-more' }))?.props.text).toBe('[\u00a0\u00a0\u00a0\u00a0▾](https://pulse.invalid/fold "Show every fact")')
  // The icon's row spans the pane, less its padding, so the icon sits at the right edge.
  expect((await pane.findAll({ type: 'Box' })).some(b => b.props.width === 38 && b.props.flexDirection === 'row')).toBe(true)
  // Every control says what it does in a card on hover; no title shows on the desktop.
  const tips = async () => (await pane.findAll({ type: 'Box' })).filter(b => b.props.display === 'none').map(b => b.text)
  expect(await tips()).toEqual(expect.arrayContaining(['Show every fact', 'Open usage on claude.ai']))
  // A pointer on a placed Box is on its parent, so nothing pressable sits in one: only hidden tips are placed.
  const placed = (await pane.findAll({ type: 'Box' })).filter(b => b.props.position === 'absolute')
  expect(placed.every(b => b.props.display === 'none')).toBe(true)
  // `more` shows the rest, each with its hint beneath in the faintest grey.
  await pane.press({ key: 'pulse-more', link: action('fold') })
  expect((await pane.find({ type: 'Text', text: /^84k of 200k$/ }))?.props.color).toBe('subtle')
  expect(await pane.find({ type: 'Text', text: /^resets in 2h 10m$/ })).toBeTruthy()
  expect(await pane.find({ type: 'Text', text: /^at API prices$/ })).toBeTruthy()
  expect(await pane.find({ key: 'u-branch' })).toBeTruthy()
  expect((await pane.find({ key: 'pulse-more' }))?.props.text).toBe('[\u00a0\u00a0\u00a0\u00a0▴](https://pulse.invalid/fold "Show the short form")')
  expect(await pane.find({ type: 'Markdown', text: '[`feat/x`](https://github.com/vdz/skills/tree/feat/x "feat/x on GitHub")' })).toBeTruthy()
  expect(await tips()).toEqual(expect.arrayContaining(['Show the short form', 'Open usage on claude.ai', 'Open feat/x on GitHub', 'Open the file']))
  // No hint waits on a hover: what hides is only the cards.
  expect((await tips()).some(tip => /^84k of 200k$|^at API prices$/.test(tip ?? ''))).toBe(false)
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
