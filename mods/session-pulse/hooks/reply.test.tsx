import { expect, test } from 'claude-code/testing'

import { boot, PLUGIN } from './harness'

const LINE = '◂ your move · 3/5 · next: approve the PR'
const message = (text: string) => ({ component: 'AssistantMessage' as const, props: { text, isFirstOfReply: true } })

test('the Pulse line stays in the reply, set muted beneath the rest with faint separators', async ($, on) => {
  await boot($, on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: PLUGIN, surface, requestId: `r-${surface}`, ...message(`Tests are green.\n\n${LINE}`) })
    expect(await ui.find({ type: 'Markdown' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: LINE })).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /^◂ your move$/ }))?.props.bold).toBe(true)
    const dots = await ui.findAll({ type: 'Text', text: /^ · $/ })
    expect(dots).toHaveLength(2)
    // The desktop page ignores dimColor on a Text, so there the faint tone is a colour.
    for (const dot of dots) expect(surface === 'desktop' ? dot.props.color : dot.props.dimColor).toBeTruthy()
    expect(await ui.find({ type: 'Text', text: /^Tests are green\.$/ })).toBeTruthy()
    await ui.unmount()
  }
})

test('a reply without a Pulse line is drawn as the engine draws it', async ($, on) => {
  await boot($, on)
  const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', requestId: 'r-plain', ...message('Just an answer.') })
  const texts = await ui.findAll({ type: 'Text' })
  expect(texts.map(t => t.props.dimColor ?? false)).toEqual([false])
  expect(await ui.find({ type: 'Text', text: 'Just an answer.' })).toBeTruthy()
  await ui.unmount()
})
