import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { FocusReadFocus } from '../types'
import { splitParagraphs } from './split'
import type { SensorProps, Veil } from './paragraph'

const PLUGIN = 'focus-read'
const STORE_MODE = 'mode'
const RETIRED_THEMES = ['dim', 'spotlight', 'ink']

// Dim zero: every paragraph of a finished reply at rest. Deep dim: every paragraph
// but the focused one while a focus exists, in any reply. Focused: drawn as written.
type ParagraphState = 'dimZero' | 'focused' | 'deepDim'

// Mode lives in the store across sessions and in this atom for drawing: a reply or the
// band that reads it redraws the moment it flips, from /focus or the band's button.
const mode = atom({ plugin: 'focus-read', key: 'isOn' } as const, true)
const focus = atom({ plugin: 'focus-read', key: 'focus' } as const, null as FocusReadFocus | null)

async function setMode($: EngineInterface, isOn: boolean) {
  await $.store.set(STORE_MODE, isOn)
  await update($, mode, () => isOn)
  if (!isOn) await update($, focus, () => null)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const stored = await $.store.get(STORE_MODE)
    await update($, mode, () => stored !== false)
    // Some builds ship a built-in /focus and refuse the registration; the command.run
    // hook below answers /focus either way, so a refusal only costs the description.
    try {
      await $.command.register({
        name: 'focus',
        description: 'Reading focus: replies rest dimmed, hover a paragraph to bring it forward.',
        argumentHint: '[on|off]',
      })
    } catch {}
    return next(e)
  })

  on('command.run', { command: 'focus' }, async ($, e) => {
    const wasOn = await read($, mode)
    const arg = e.args.trim().toLowerCase()
    if (arg === 'list' || arg === 'status' || RETIRED_THEMES.includes(arg)) {
      return { text: `${wasOn ? 'on' : 'off'}. One look: dim zero at rest, deep dim around the focus.` }
    }
    const next = arg === '' ? !wasOn : arg === 'on' ? true : arg === 'off' ? false : null
    if (next === null) return { text: `unknown argument "${arg}". Use /focus, /focus on or /focus off.` }
    await setMode($, next)
    return { text: next ? 'on' : 'off' }
  })

  // The toggle: one plain button among the mode labels at the right of the prompt
  // footer, the engine's own labels kept before it.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)
    const isOn = await read($, mode)
    const { Box, Button, Text } = $.ui.resolve(e)
    const modes = e.props.modes.join(' & ')
    return (
      <Box flexDirection="row">
        {modes === '' ? null : <Text dimColor>{`${modes} & `}</Text>}
        <Button
          key="focus-toggle"
          label={isOn ? '◐ reading focus' : '○ reading focus'}
          plain
          dimColor={!isOn}
          onPress={() => setMode($, !isOn)}
        />
      </Box>
    )
  })

  on('ui.message', { component: 'AssistantMessage' }, async ($, e, next) => {
    const data = e.data as { kind?: unknown; index?: unknown }
    const index = typeof data?.index === 'number' && Number.isInteger(data.index) ? data.index : null
    if (index === null) return next(e)
    if (data.kind === 'enter') {
      await update($, focus, () => ({ requestId: e.requestId, index }))
    } else if (data.kind === 'leave') {
      await update($, focus, current =>
        current && current.requestId === e.requestId && current.index === index ? null : current,
      )
    }
    return next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)
    if (!(await read($, mode))) return next(e)

    const paragraphs = splitParagraphs(e.props.text)
    if (paragraphs.length === 0) return next(e)

    const current = await read($, focus)
    const focusedIndex = current && current.requestId === e.requestId ? current.index : null
    const hasVeil = e.surface === 'desktop'
    const { Box, Client, Markdown } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        {paragraphs.map((text, index) => {
          const state: ParagraphState =
            current === null ? 'dimZero' : index === focusedIndex ? 'focused' : 'deepDim'
          const veil: Veil = !hasVeil || state === 'focused' ? 'none' : state === 'deepDim' ? 'deep' : 'zero'
          const sensor: SensorProps = { index, veil }
          return (
            <Box
              flexDirection="column"
              position="relative"
              marginBottom={index === paragraphs.length - 1 ? 0 : 1}
            >
              <Markdown text={text} dimColor={state !== 'focused'} />
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
