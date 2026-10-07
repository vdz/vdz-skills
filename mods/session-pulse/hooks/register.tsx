import { atom, read, update } from 'claude-code'
import type { ElementConstructor, EngineInterface, Register, TextProps } from 'claude-code'

import type { SessionPulse } from '../types'
import { footerLabel, formatPulse, gaugeCells, gaugeColor, parsePulseLine, pulseParts, splitPulseLine } from './pulse'
import type { Part, Tone } from './pulse'

const COMMAND = 'pulse'
const HISTORY_KEPT = 50
const HISTORY_SHOWN = 5

// What the model reads beside every prompt, never shown to the person: the rule
// the CLAUDE.md "restate state every turn" line used to carry, plus where things stand.
const RULE = [
  'Pulse line: while work is open, end every reply with exactly one line of the form',
  '`<glyph> <move> · <n>/<m> · next: <next action>`, glyph+move one of',
  '`▸ working` (you are proceeding), `◂ your move` (waiting on the user), `■ blocked`, `✓ done`.',
  'Leave out `n/m` when there are no counted steps. When the work is finished, end with `✓ done`.',
  'No Pulse line on replies that open no work.',
].join(' ')

// The Pulse and its history for drawing, mirrored into the store under the
// session's id so they outlive compaction, resume and a restart.
const pulse = atom({ plugin: 'session-pulse', key: 'pulse' } as const, null as SessionPulse | null)
const history = atom({ plugin: 'session-pulse', key: 'history' } as const, [] as SessionPulse[])

type Saved = { pulse: SessionPulse | null; history: SessionPulse[] }
const storeKey = (sessionId: string) => `session:${sessionId}`

// Which session's Pulse the atoms hold, and whether the last one ended in /clear
// (its history then carries into the next). The module's own: a reload reloads.
let loadedFor: string | null = null
let isCleared = false

// /clear and /resume continue under a new session id, and session.start does not
// fire after /clear, so every hook that reads or writes the Pulse syncs first.
async function sync($: EngineInterface) {
  const id = await $.session.id()
  if (id === loadedFor) return
  loadedFor = id
  const saved = (await $.store.get(storeKey(id))) as Saved | undefined
  if (saved) {
    await update($, pulse, () => saved.pulse)
    await update($, history, () => saved.history)
  } else {
    await update($, pulse, () => null)
    if (!isCleared) await update($, history, () => [])
  }
  isCleared = false
}

async function save($: EngineInterface) {
  const saved: Saved = { pulse: await read($, pulse), history: await read($, history) }
  await $.store.set(storeKey(await $.session.id()), saved)
}

// The Pulses before the current one, newest first. The current one is always the
// history's last entry; matched by time, not identity, as a Pulse read back from the
// store is a copy and a Stale one keeps its time.
function earlier(current: SessionPulse | null, list: SessionPulse[]) {
  const isLastCurrent = current !== null && list.at(-1)?.at === current.at
  return (isLastCurrent ? list.slice(0, -1) : list).slice(-HISTORY_SHOWN).reverse()
}

const describe = (p: SessionPulse) =>
  `${formatPulse(p)}${p.isStale ? ' (stale: the last reply carried no Pulse line)' : ''}`

async function report($: EngineInterface) {
  const current = await read($, pulse)
  const before = earlier(current, await read($, history))
  const usage = await meters($)
  return [
    current === null ? 'No Pulse yet.' : describe(current),
    ...(before.length === 0 ? [] : ['', 'Earlier:', ...before.map(p => `  ${formatPulse(p)}`)]),
    ...(usage === '' ? [] : ['', usage]),
  ].join('\n')
}

const PANE = 'session-pulse'

// Colours are the engine's theme keys, so each follows the light or dark theme on
// every surface (a desktop Text ignores dimColor, but honours these). `claude` is
// the Claude orange, `inactive` a readable grey, `subtle` a grey all but gone.
const TONE: Record<Tone, TextProps> = {
  accent: { color: 'claude' },
  strong: { bold: true },
  plain: {},
  faint: { color: 'subtle' },
}
const QUIET: TextProps = { color: 'inactive' }

// A Pulse line set in its tones. Muted is the voice of a line that sits beside
// other things, the reply's last line and the Earlier ones: its plain parts grey.
function Typeset(props: { Text: ElementConstructor<TextProps>; parts: Part[]; isMuted?: boolean }) {
  const { Text, parts, isMuted = false } = props
  const style = (tone: Tone): TextProps =>
    isMuted && (tone === 'plain' || tone === 'strong') ? { ...TONE[tone], ...QUIET } : TONE[tone]
  return (
    <Text>
      {parts.map((part, index) => (
        <Text key={`t${index}`} {...style(part.tone)}>
          {part.text}
        </Text>
      ))}
    </Text>
  )
}

const STALE_NOTE: Part = { text: ' (stale: the last reply carried no Pulse line)', tone: 'faint' }
const LIMIT_NAMES: Record<string, string> = { five_hour: '5h', seven_day: '7d' }

type Gauge = { name: string; percent: number }

// The gauges: context fill and each rate-limit window, as the engine itself figures
// them, and the session's cost (no price table of the mod's own).
async function gauges($: EngineInterface): Promise<{ list: Gauge[]; cost?: string }> {
  const usage = await $.session.usage()
  const list = [
    ...(usage.context.percent === undefined ? [] : [{ name: 'context', percent: usage.context.percent }]),
    ...usage.rateLimits.map(limit => ({ name: LIMIT_NAMES[limit.kind] ?? limit.kind, percent: limit.percentUsed })),
  ]
  return { list, cost: usage.cost === undefined ? undefined : `$${usage.cost.usd.toFixed(2)}` }
}

// The gauges in one line of text, for /pulse and the toast.
async function meters($: EngineInterface) {
  const { list, cost } = await gauges($)
  return [...list.map(g => `${g.name} ${Math.round(g.percent)}%`), ...(cost === undefined ? [] : [cost])].join(' · ')
}

// A press is the person asking, so the pane seats at any width; where the surface
// still has no room for it, the Pulse comes up as a toast instead.
async function openPulse($: EngineInterface) {
  const opened = await $.ui.open({ id: PANE, title: 'Pulse' })
  if (!opened.isPlaced) await $.ui.toast(await report($))
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({ name: COMMAND, description: "Where this session stands: whose move, which step, what's next.", argumentHint: '[pane]' })
    } catch {}
    await sync($)
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      isCleared = true
      await update($, pulse, () => null)
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId !== undefined || e.reason !== 'answer') return result
    await sync($)
    const line = parsePulseLine(e.answer)
    if (line === null) {
      // Work left open with no word on it: keep the Pulse, say it may be out of date.
      const current = await read($, pulse)
      if (current !== null && current.move !== 'done' && !current.isStale) {
        await update($, pulse, () => ({ ...current, isStale: true }))
        await save($)
      }
      return result
    }
    const fresh: SessionPulse = { ...line, at: await $.clock.now(), isStale: false }
    await update($, pulse, () => fresh)
    await update($, history, list => [...list, fresh].slice(-HISTORY_KEPT))
    await save($)
    return result
  })

  on('prompt.submit', async ($, e, next) => {
    await sync($)
    const current = await read($, pulse)
    const now = current === null ? [] : [`Current Pulse: ${describe(current)}`]
    return next({ ...e, context: [...(e.context ?? []), [RULE, ...now].join('\n')] })
  })

  // The footer: the Pulse as one plain button ahead of whatever the engine and the
  // other mods there draw, so focus-read's Toggle and the mode labels stay.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const rest = await next(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return rest
    const current = await read($, pulse)
    if (current === null) return rest
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row">
        <Button key="pulse-footer" label={footerLabel(current)} plain dimColor={current.isStale} onPress={() => openPulse($)} />
        <Text dimColor>{'  '}</Text>
        {rest}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await sync($)
    const { Box, Text } = $.ui.resolve(e)
    const current = await read($, pulse)
    const before = earlier(current, await read($, history))
    const { list, cost } = await gauges($)
    const across = Math.max((e.props.bodyColumns ?? 40) - 2, 10)
    const rule = (
      <Box marginBottom={1}>
        <Text color="subtle" wrap="truncate-end">
          {'─'.repeat(across)}
        </Text>
      </Box>
    )
    const set = (p: SessionPulse, isMuted?: boolean) => (
      <Typeset Text={Text} parts={[...pulseParts(p), ...(p.isStale ? [STALE_NOTE] : [])]} isMuted={isMuted} />
    )
    const NAME_CELLS = 9
    const VALUE_CELLS = 5
    const cells = Math.max(Math.min(across - NAME_CELLS - VALUE_CELLS, 20), 6)
    const gauge = (g: Gauge) => {
      const { filled, empty } = gaugeCells(g.percent, cells)
      return (
        <Box key={`g-${g.name}`} flexDirection="row">
          <Box width={NAME_CELLS}>
            <Text {...QUIET}>{g.name}</Text>
          </Box>
          <Text>
            {filled > 0 ? <Text color={gaugeColor(g.percent)}>{'━'.repeat(filled)}</Text> : null}
            {empty > 0 ? <Text color="subtle">{'━'.repeat(empty)}</Text> : null}
          </Text>
          <Text>{` ${Math.round(g.percent)}%`}</Text>
        </Box>
      )
    }
    // Every Pulse is a paragraph of its own, a blank line beneath it; rules set the
    // history and the gauges off.
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1}>{current === null ? <Text {...QUIET}>No Pulse yet.</Text> : set(current)}</Box>
        {before.length === 0 ? null : rule}
        {before.map((p, index) => (
          <Box key={`h${index}`} marginBottom={1}>
            {set(p, true)}
          </Box>
        ))}
        {list.length === 0 && cost === undefined ? null : rule}
        {list.map(gauge)}
        {cost === undefined ? null : (
          <Box flexDirection="row">
            <Box width={NAME_CELLS}>
              <Text {...QUIET}>cost</Text>
            </Box>
            <Text>{cost}</Text>
          </Box>
        )}
      </Box>
    )
  })

  // The Pulse line stays in the reply, so nothing is hidden state, but drawn dim
  // beneath the rest. The body goes down the chain, so focus-read still splits it.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop') return next(e)
    const split = splitPulseLine(e.props.text)
    if (split === null) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const line = parsePulseLine(split.line)!
    const body = split.body === '' ? null : await next({ ...e, props: { ...e.props, text: split.body } })
    return (
      <Box flexDirection="column">
        {body}
        <Box key="pulse-line" marginTop={body === null ? 0 : 1}>
          <Typeset Text={Text} parts={pulseParts(line)} isMuted />
        </Box>
      </Box>
    )
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    await sync($)
    if (e.args.trim().toLowerCase() === 'pane') {
      await openPulse($)
      return { text: 'Pulse pane opened.' }
    }
    return { text: await report($) }
  })
}
