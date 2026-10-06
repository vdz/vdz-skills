import { expect, mock, test, type TestBody } from 'claude-code/testing'

const REPLY = {
  component: 'AssistantMessage' as const,
  props: { text: 'first paragraph\n\nsecond paragraph\n\nthird paragraph', isFirstOfReply: true },
}
const SURFACES = ['terminal', 'desktop'] as const

// The test's hooks stand for the engine: answer the command registration and
// start the session the way the REPL does.
async function boot($: Parameters<TestBody>[0], on: Parameters<TestBody>[1], entries?: Record<string, unknown>) {
  mock.clock(on)
  mock.store(on, entries)
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('turn.start', (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('command.run', () => ({ text: '' }))
  // The engine's own drawing of a reply, for the cases the mod passes through.
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text key="engine">{e.props.text}</Text>
  })
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
}

const dimsOf = async (ui: { findAll: (q: { type: string }) => Promise<{ props: Record<string, unknown> }[]> }) =>
  (await ui.findAll({ type: 'Markdown' })).map(m => m.props.dimColor === true)
const veilsOf = async (ui: { findAll: (q: { type: string }) => Promise<{ props: Record<string, unknown> }[]> }) =>
  (await ui.findAll({ type: 'Client' })).map(c => (c.props.props as { veil: string }).veil)

test('at rest every paragraph of a finished reply is in dim zero', async ($, on) => {
  await boot($, on)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'focus-read', surface, requestId: `r-${surface}`, ...REPLY })
    const clients = await ui.findAll({ type: 'Client' })
    expect(clients.map(c => c.key)).toEqual(['p0', 'p1', 'p2'])
    expect(await dimsOf(ui)).toEqual([true, true, true])
    expect(await veilsOf(ui)).toEqual(Array(3).fill(surface === 'desktop' ? 'zero' : 'none'))
    const painted = (await ui.findAll({ type: 'Box' })).filter(b => b.props.backgroundColor !== undefined)
    expect(painted).toHaveLength(0)
    await ui.unmount()
  }
})

test('hovering brings one paragraph forward and sends the rest to deep dim', async ($, on) => {
  await boot($, on)
  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'focus-read', surface, requestId: `h-${surface}`, ...REPLY })
    await ui.pointer({ type: 'enter', x: 0, y: 0, in: 'p1' })
    await ui.advance(100)
    expect(await dimsOf(ui)).toEqual([true, false, true])
    // The veils are the desktop's two steps; the terminal has one dim only.
    const [zero, deep] = surface === 'desktop' ? ['zero', 'deep'] : ['none', 'none']
    expect(await veilsOf(ui)).toEqual([deep, 'none', deep])
    await ui.pointer({ type: 'leave', x: 0, y: 0, in: 'p1' })
    await ui.advance(100)
    expect(await dimsOf(ui)).toEqual([true, true, true])
    expect(await veilsOf(ui)).toEqual([zero, zero, zero])
    await ui.unmount()
  }
})

test('a focus in one reply sends every other reply to deep dim', async ($, on) => {
  await boot($, on)
  const here = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'x1', ...REPLY })
  const there = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'x2', ...REPLY })
  await here.pointer({ type: 'enter', x: 0, y: 0, in: 'p0' })
  await here.advance(100)
  expect(await dimsOf(there)).toEqual([true, true, true])
  expect(await veilsOf(there)).toEqual(['deep', 'deep', 'deep'])
  await here.unmount()
  await there.unmount()
})

test('a short hover under the debounce never posts', async ($, on) => {
  await boot($, on)
  const ui = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'd', ...REPLY })
  await ui.pointer({ type: 'enter', x: 0, y: 0, in: 'p2' })
  await ui.advance(40)
  await ui.pointer({ type: 'leave', x: 0, y: 0, in: 'p2' })
  await ui.advance(200)
  expect(await dimsOf(ui)).toEqual([true, true, true])
  expect(await veilsOf(ui)).toEqual(['zero', 'zero', 'zero'])
  await ui.unmount()
})

test('while agents work the replies stay dimmed and a focus holds', async ($, on) => {
  await boot($, on)
  const earlier = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'g0', ...REPLY })
  await $.turn.start({ text: 'go', turnId: 't1' })
  const live = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'g1', ...REPLY })
  expect(await dimsOf(earlier)).toEqual([true, true, true])
  expect(await dimsOf(live)).toEqual([true, true, true])
  await earlier.pointer({ type: 'enter', x: 0, y: 0, in: 'p2' })
  await earlier.advance(100)
  expect(await dimsOf(earlier)).toEqual([true, true, false])
  expect(await veilsOf(live)).toEqual(['deep', 'deep', 'deep'])
  await $.turn.complete({ turnId: 't1', answer: '', durationMs: 1, isAborted: false, reason: 'answer' })
  expect(await dimsOf(earlier)).toEqual([true, true, false])
  await earlier.unmount()
  await live.unmount()
})

test('a switched-off mod passes the reply through', async ($, on) => {
  await boot($, on, { mode: false })
  const off = await $.ui.mount({ plugin: 'focus-read', surface: 'terminal', requestId: 'o', ...REPLY })
  expect(await off.find({ type: 'Client' })).toBeUndefined()
  await off.unmount()
})

test('a single-paragraph reply is dimmed too', async ($, on) => {
  await boot($, on)
  const one = await $.ui.mount({
    plugin: 'focus-read', surface: 'terminal', requestId: 's',
    component: 'AssistantMessage', props: { text: 'only one', isFirstOfReply: true },
  })
  expect(await one.findAll({ type: 'Client' })).toHaveLength(1)
  expect(await dimsOf(one)).toEqual([true])
  await one.unmount()
})

test('/focus toggles and takes on or off; theme names report the one look', async ($, on) => {
  await boot($, on)
  const run = (args: string) =>
    $.command.run({ command: 'focus', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })
  const mount = (requestId: string) => $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId, ...REPLY })

  expect((await run('')).text).toBe('off')
  const off = await mount('t-off')
  expect(await off.find({ type: 'Client' })).toBeUndefined()
  await off.unmount()

  expect((await run('')).text).toBe('on')
  expect((await run('off')).text).toBe('off')
  expect((await run('off')).text).toBe('off')
  expect((await run('on')).text).toBe('on')
  expect((await run('ink')).text).toMatch(/^on\. One look/)
  expect((await run('nope')).text).toMatch(/unknown/i)
  const back = await mount('t-on')
  expect(await back.findAll({ type: 'Client' })).toHaveLength(3)
  await back.unmount()
})

const FOOTER = { component: 'SessionMode' as const, props: { modes: ['memory paused'] } }

test('the footer button toggles the mode and every reply follows', async ($, on) => {
  await boot($, on)
  const footer = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'footer', ...FOOTER })
  const reply = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'b1', ...REPLY })
  const label = async () => (await footer.find({ type: 'Button' }))?.props.label
  expect(await footer.find({ type: 'Text' })).toBeDefined()
  expect(await label()).toBe('◐ reading focus')
  expect(await reply.findAll({ type: 'Client' })).toHaveLength(3)

  await footer.press({ key: 'focus-toggle' })
  expect(await label()).toBe('○ reading focus')
  expect(await reply.find({ type: 'Client' })).toBeUndefined()

  await footer.press({ key: 'focus-toggle' })
  expect(await label()).toBe('◐ reading focus')
  expect(await reply.findAll({ type: 'Client' })).toHaveLength(3)
  await footer.unmount()
  await reply.unmount()
})
