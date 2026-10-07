import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { FocusReadFocus } from '../types'
import { isStyleName, nextStyle, STYLE_ORDER, STYLES, type StyleName } from './styles'
import { splitParagraphs } from './split'
import type { SensorProps, Veil } from './paragraph'

const PLUGIN = 'focus-read'
const STORE_MODE = 'mode'
const STORE_STYLE = 'style'
const RETIRED_THEMES = ['dim', 'ink']

// Rest: every paragraph while no focus exists (dim zero, unless the Style rests at
// none), and every paragraph out of the focus's reach. Near: the focus's neighbours
// in a Style with a Gradient, drawn at rest strength. Deep: every other paragraph
// while a focus exists. Focused: drawn as written.
type ParagraphState = 'rest' | 'near' | 'focused' | 'deep'

// A marker's faint amber behind the Focus. Translucent, so the one colour sits on the
// light and the dark transcript alike; the desktop only, as a terminal cell's
// background would hide whatever the terminal's own theme draws.
// Room inside the Highlight (the sensor's lit veil). Every paragraph of a highlighting Style gets it, lit or
// not, so pinning one moves no text.
const HIGHLIGHT_PAD = { paddingX: 2, paddingY: 1 }

// Mode lives in the store across sessions and in this atom for drawing: a reply or the
// band that reads it redraws the moment it flips, from /focus or the band's button.
const mode = atom({ plugin: 'focus-read', key: 'isOn' } as const, true)
const focus = atom({ plugin: 'focus-read', key: 'focus' } as const, null as FocusReadFocus | null)
const style = atom({ plugin: 'focus-read', key: 'style' } as const, 'calm' as StyleName)

// Every reply block drawn, in the order first drawn (the transcript's order, top to
// bottom, as it mounts), with its paragraph count: where a key moves a pin past a
// reply's edge. The module's own, so a reload starts it over.
const replies = new Map<string, number>()

const MOVE_KEYS: Record<string, 1 | -1> = { j: 1, down: 1, k: -1, up: -1 }
const RELEASE_KEY = 'x'

const paragraphKey = (pin: FocusReadFocus) => `${pin.requestId}:${pin.index}`

function movePin(pin: FocusReadFocus, step: 1 | -1): FocusReadFocus {
  const index = pin.index + step
  if (index >= 0 && index < (replies.get(pin.requestId) ?? 0)) return { ...pin, index }
  const order = [...replies.keys()]
  const neighbour = order[order.indexOf(pin.requestId) + step]
  if (neighbour === undefined) return pin
  return { requestId: neighbour, index: step === 1 ? 0 : (replies.get(neighbour) ?? 1) - 1 }
}

async function setMode($: EngineInterface, isOn: boolean) {
  await $.store.set(STORE_MODE, isOn)
  await update($, mode, () => isOn)
  if (!isOn) await update($, focus, () => null)
}

async function setStyle($: EngineInterface, name: StyleName) {
  await $.store.set(STORE_STYLE, name)
  await update($, style, () => name)
  await update($, focus, () => null)
}

const styleList = (current: StyleName) =>
  `Styles: ${STYLE_ORDER.map(name => (name === current ? `${name} (current)` : name)).join(', ')}.`

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const stored = await $.store.get(STORE_MODE)
    await update($, mode, () => stored !== false)
    const storedStyle = await $.store.get(STORE_STYLE)
    await update($, style, () => (isStyleName(storedStyle) ? storedStyle : 'calm'))
    // Some builds ship a built-in /focus and refuse the registration; the command.run
    // hook below answers /focus either way, so a refusal only costs the description.
    try {
      await $.command.register({
        name: 'focus',
        description: 'Reading focus: bring one paragraph forward, step the rest back. Styles: calm, spotlight, typewriter, solo.',
        argumentHint: `[on|off|list|${STYLE_ORDER.join('|')}]`,
      })
    } catch {}
    return next(e)
  })

  on('command.run', { command: 'focus' }, async ($, e) => {
    const wasOn = await read($, mode)
    const current = await read($, style)
    const arg = e.args.trim().toLowerCase()
    const state = (isOn: boolean, name: StyleName) => `${isOn ? 'on' : 'off'} · ${name}`
    if (arg === 'list' || arg === 'status') return { text: `${state(wasOn, current)}. ${styleList(current)}` }
    if (RETIRED_THEMES.includes(arg)) return { text: `"${arg}" is retired. ${styleList(current)}` }
    if (isStyleName(arg)) {
      await setStyle($, arg)
      await setMode($, true)
      return { text: state(true, arg) }
    }
    const next = arg === '' ? !wasOn : arg === 'on' ? true : arg === 'off' ? false : null
    if (next === null) {
      return { text: `unknown argument "${arg}". Use /focus, /focus on|off|list or a Style: ${STYLE_ORDER.join(', ')}.` }
    }
    await setMode($, next)
    return { text: state(next, current) }
  })

  // The Toggle: two plain buttons among the mode labels at the right of the prompt
  // footer, the engine's own labels kept before them. One flips the Mode, the
  // other names the Style and moves to the next.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    // What the engine and the mods beneath draw there (the mode labels, a Pulse)
    // comes first, so this mod never hides theirs.
    const rest = await next(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return rest
    const isOn = await read($, mode)
    const current = await read($, style)
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row">
        {rest}
        {e.props.modes.length === 0 ? null : <Text dimColor>{' & '}</Text>}
        <Button
          key="focus-toggle"
          label={isOn ? '◐ focus' : '○ focus'}
          plain
          dimColor={!isOn}
          onPress={() => setMode($, !isOn)}
        />
        <Button
          key="focus-style"
          label={`· ${current}`}
          plain
          dimColor
          onPress={() => setStyle($, nextStyle(current))}
        />
      </Box>
    )
  })

  on('ui.message', { component: 'AssistantMessage' }, async ($, e, next) => {
    const data = e.data as { kind?: unknown; index?: unknown; key?: unknown }
    const index = typeof data?.index === 'number' && Number.isInteger(data.index) ? data.index : null
    if (index === null) return next(e)
    const here: FocusReadFocus = { requestId: e.requestId, index }
    const isHere = (f: FocusReadFocus | null) => f !== null && f.requestId === here.requestId && f.index === here.index
    const trigger = STYLES[await read($, style)].trigger
    if (trigger === 'hover') {
      if (data.kind === 'enter') await update($, focus, () => here)
      else if (data.kind === 'leave') await update($, focus, current => (isHere(current) ? null : current))
    } else if (data.kind === 'pin') {
      await update($, focus, current => (isHere(current) ? null : here))
    } else if (data.kind === 'key' && typeof data.key === 'string') {
      const key = data.key.toLowerCase()
      const step = MOVE_KEYS[key]
      if (key === RELEASE_KEY) await update($, focus, () => null)
      else if (step !== undefined) {
        // No typewriter scrolling: the desktop answers $.ui.scroll with "transcript not
        // scrollable here", and a render hook's own Box keys are not scroll targets.
        await update($, focus, current => (current ? movePin(current, step) : current))
      }
    }
    return next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)
    if (!(await read($, mode))) return next(e)

    const paragraphs = splitParagraphs(e.props.text)
    if (paragraphs.length === 0) return next(e)
    replies.set(e.requestId, paragraphs.length)

    const current = await read($, focus)
    const look = STYLES[await read($, style)]
    const focusedIndex = current && current.requestId === e.requestId ? current.index : null
    const hasVeil = e.surface === 'desktop'
    const { Box, Client, Markdown } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {paragraphs.map((text, index) => {
          const state: ParagraphState =
            current === null || (look.reach === 'own' && focusedIndex === null)
              ? 'rest'
              : index === focusedIndex
                ? 'focused'
                : look.gradient && focusedIndex !== null && Math.abs(index - focusedIndex) === 1
                  ? 'near'
                  : 'deep'
          const isDim = state === 'deep' || state === 'near' || (state === 'rest' && look.rest !== 'none')
          const veil: Veil = !hasVeil
            ? 'none'
            : !isDim
              ? look.highlight && state === 'focused' ? 'lit' : 'soft'
              : state === 'deep' ? (look.deep === 'hidden' ? 'hidden' : 'deep') : 'zero'
          const sensor: SensorProps = { index, veil, restDelayMs: look.restDelayMs }
          const isPadded = hasVeil && look.highlight
          return (
            <Box
              key={paragraphKey({ requestId: e.requestId, index })}
              {...(isPadded ? HIGHLIGHT_PAD : {})}
              flexDirection="column"
              position="relative"
              marginBottom={index === paragraphs.length - 1 ? 0 : 1}
            >
              <Markdown text={text} dimColor={isDim} />
              <Box position="absolute" top={0} bottom={0} left={0} right={0}>
                <Client key={`p${index}`} module="./paragraph.tsx" props={sensor} width="100%" height="100%" />
              </Box>
            </Box>
          )
        })}
      </Box>
    )
  })
}
