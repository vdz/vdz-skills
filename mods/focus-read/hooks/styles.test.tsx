import { expect, test, type TestBody } from 'claude-code/testing'

import { boot, dimsOf, veilsOf } from './harness'

const FOOTER = { component: 'SessionMode' as const, props: { modes: [] as string[] } }
const run = ($: Parameters<TestBody>[0], args: string) =>
  $.command.run({ command: 'focus', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 120 } })

test('the footer names the current Style and a press moves to the next', async ($, on) => {
  await boot($, on)
  const footer = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'f', ...FOOTER })
  const styleLabel = async () =>
    (await footer.findAll({ type: 'Button' })).find(b => b.key === 'focus-style')?.props.label
  expect(await styleLabel()).toBe('· calm')
  for (const next of ['spotlight', 'typewriter', 'solo', 'calm']) {
    await footer.press({ key: 'focus-style' })
    expect(await styleLabel()).toBe(`· ${next}`)
  }
  await footer.unmount()
})

test('/focus <style> picks a Style and turns the mod on; /focus list names them all', async ($, on) => {
  await boot($, on, { mode: false })
  expect((await run($, 'solo')).text).toBe('on · solo')
  expect((await run($, 'list')).text).toBe('on · solo. Styles: calm, spotlight, typewriter, solo (current).')
  expect((await run($, 'off')).text).toBe('off · solo')
  expect((await run($, 'ink')).text).toMatch(/^"ink" is retired\. Styles: calm, spotlight/)
})

test('the Style is remembered across sessions', async ($, on) => {
  await boot($, on, { style: 'typewriter' })
  const footer = await $.ui.mount({ plugin: 'focus-read', surface: 'terminal', requestId: 'f2', ...FOOTER })
  const labels = (await footer.findAll({ type: 'Button' })).map(b => b.props.label)
  expect(labels).toEqual(['◐ focus', '· typewriter'])
  await footer.unmount()
})

const REPLY3 = {
  component: 'AssistantMessage' as const,
  props: { text: 'one\n\ntwo\n\nthree', isFirstOfReply: true },
}

test('Calm waits 150 ms before a hover moves the Focus', async ($, on) => {
  await boot($, on)
  const ui = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'c', ...REPLY3 })
  await ui.pointer({ type: 'enter', x: 0, y: 0, in: 'p1' })
  await ui.advance(120)
  expect(await dimsOf(ui)).toEqual([true, true, true])
  await ui.advance(60)
  expect(await dimsOf(ui)).toEqual([true, false, true])
  await ui.unmount()
})

test('Spotlight steps nothing back at rest, then deep dims around a hover after 250 ms', async ($, on) => {
  await boot($, on, { style: 'spotlight' })
  const ui = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 's', ...REPLY3 })
  expect(await dimsOf(ui)).toEqual([false, false, false])
  expect(await veilsOf(ui)).toEqual(['soft', 'soft', 'soft'])
  await ui.pointer({ type: 'enter', x: 0, y: 0, in: 'p2' })
  await ui.advance(200)
  expect(await dimsOf(ui)).toEqual([false, false, false])
  await ui.advance(80)
  expect(await dimsOf(ui)).toEqual([true, true, false])
  expect(await veilsOf(ui)).toEqual(['deep', 'deep', 'soft'])
  await ui.unmount()
})

test('Solo: a hover moves nothing; a click pins a paragraph and hides the rest', async ($, on) => {
  await boot($, on, { style: 'solo' })
  const ui = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'p', ...REPLY3 })
  const other = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'q', ...REPLY3 })
  await ui.pointer({ type: 'enter', x: 0, y: 0, in: 'p1' })
  await ui.advance(400)
  expect(await dimsOf(ui)).toEqual([true, true, true])

  await ui.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'p1' })
  await ui.advance(20)
  expect(await dimsOf(ui)).toEqual([true, false, true])
  expect(await veilsOf(ui)).toEqual(['hidden', 'soft', 'hidden'])
  expect(await veilsOf(other)).toEqual(['hidden', 'hidden', 'hidden'])

  await ui.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'p1' })
  await ui.advance(20)
  expect(await veilsOf(ui)).toEqual(['zero', 'zero', 'zero'])
  await ui.unmount()
  await other.unmount()
})

test('a pin moves with j/k and the arrows, across replies, and x releases it', async ($, on) => {
  await boot($, on, { style: 'solo' })
  const a = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'a', ...REPLY3 })
  const b = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'b', ...REPLY3 })
  const lit = async () => [...(await dimsOf(a)), ...(await dimsOf(b))].indexOf(false)

  await a.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'p2' })
  await a.advance(20)
  expect(await lit()).toBe(2)
  // Keys reach the Client the click focused, whichever paragraph holds the pin now.
  for (const [key, at] of [['j', 3], ['down', 4], ['k', 3], ['up', 2], ['k', 1], ['k', 0], ['k', 0]] as const) {
    await a.key({ key, in: 'p2' })
    await a.advance(20)
    expect(await lit()).toBe(at)
  }
  await a.key({ key: 'x', in: 'p2' })
  await a.advance(20)
  expect(await lit()).toBe(-1)
  await a.unmount()
  await b.unmount()
})

const REPLY5 = {
  component: 'AssistantMessage' as const,
  props: { text: 'a\n\nb\n\nc\n\nd\n\ne', isFirstOfReply: true },
}

test('Typewriter: a Highlight on the pin, its neighbours at rest, deep dim in its own reply only', async ($, on) => {
  await boot($, on, { style: 'typewriter' })
  const page = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'w', ...REPLY5 })
  const other = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'v', ...REPLY3 })
  const painted = async (ui: typeof page) =>
    (await ui.findAll({ type: 'Box' })).filter(b => b.props.backgroundColor !== undefined).length

  await page.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'p2' })
  await page.advance(20)
  expect(await dimsOf(page)).toEqual([true, true, false, true, true])
  // The Highlight is the sensor's lit veil laid over the pin; the hook paints nothing.
  expect(await veilsOf(page)).toEqual(['deep', 'zero', 'lit', 'zero', 'deep'])
  expect(await painted(page)).toBe(0)
  expect(await veilsOf(other)).toEqual(['zero', 'zero', 'zero'])
  expect(await painted(other)).toBe(0)
  await page.unmount()
  await other.unmount()
})

test('Typewriter pads every paragraph alike so the Highlight has room and pinning moves no text', async ($, on) => {
  const padsOf = async (ui: { findAll: (q: { type: string }) => Promise<{ props: Record<string, unknown> }[]> }) =>
    (await ui.findAll({ type: 'Box' }))
      .filter(b => b.props.position === 'relative')
      .map(b => [b.props.paddingX ?? 0, b.props.paddingY ?? 0])
  await boot($, on, { style: 'typewriter' })
  const page = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'w', ...REPLY3 })
  expect(await padsOf(page)).toEqual(Array(3).fill([2, 1]))
  await page.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'p1' })
  await page.advance(20)
  expect(await padsOf(page)).toEqual(Array(3).fill([2, 1]))
  await page.unmount()

  await run($, 'calm')
  const calm = await $.ui.mount({ plugin: 'focus-read', surface: 'desktop', requestId: 'c', ...REPLY3 })
  expect(await padsOf(calm)).toEqual(Array(3).fill([0, 0]))
  await calm.unmount()
})

test('in the terminal a Highlight paints nothing and every deep level is its one dim', async ($, on) => {
  await boot($, on, { style: 'typewriter' })
  const page = await $.ui.mount({ plugin: 'focus-read', surface: 'terminal', requestId: 't', ...REPLY5 })
  await page.pointer({ type: 'down', x: 0, y: 0, button: 'left', in: 'p0' })
  await page.advance(20)
  expect(await dimsOf(page)).toEqual([false, true, true, true, true])
  expect(await veilsOf(page)).toEqual(Array(5).fill('none'))
  expect((await page.findAll({ type: 'Box' })).filter(b => b.props.backgroundColor !== undefined)).toHaveLength(0)
  await page.unmount()
})
