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
    const part = async (text: RegExp) => (await ui.find({ type: 'Text', text }))?.props
    expect(await part(/^your move$/)).toMatchObject({ bold: true })
    expect(await part(/^◂ $/)).toMatchObject({ color: 'claude' })
    expect(await part(/^next: $/)).toMatchObject({ color: 'claude' })
    const dots = await ui.findAll({ type: 'Text', text: /^ · $/ })
    expect(dots.map(d => d.props.color)).toEqual(['subtle', 'subtle'])
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
