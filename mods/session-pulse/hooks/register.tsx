import { atom, read, update } from 'claude-code'
import type { ElementConstructor, EngineInterface, Register, TextProps } from 'claude-code'

import type { SessionPulse, SessionPulseErrors } from '../types'
import { codeNumbers, fileLink, footerLabel, formatPulse, parseGitStatus, webUrl, parsePulseLine, pulseParts, splitPulseLine, timeLeft, tokens } from './pulse'
import type { GitStatus } from './pulse'
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
const errors = atom({ plugin: 'session-pulse', key: 'errors' } as const, { count: 0 } as SessionPulseErrors)

// `errors` is absent from what an earlier version saved.
type Saved = { pulse: SessionPulse | null; history: SessionPulse[]; errors?: SessionPulseErrors }
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
    await update($, errors, () => saved.errors ?? { count: 0 })
  } else {
    await update($, errors, () => ({ count: 0 }))
    await update($, pulse, () => null)
    if (!isCleared) await update($, history, () => [])
  }
  isCleared = false
}

async function save($: EngineInterface) {
  const saved: Saved = { pulse: await read($, pulse), history: await read($, history), errors: await read($, errors) }
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
const USAGE_PAGE = 'https://claude.ai/settings/usage'
const ERRORS_LISTED = 5
const FILES_LISTED = 5
// How long an answer from GitHub about the branch's pull request holds.
const PR_FRESH_MS = 5 * 60_000

// One line of the pane's facts: a name, its value, and a detail in grey beside it.
// `href` makes the value a link. A detail with `isDetailMarkdown` carries links of its
// own; `onDetailPress` makes the whole detail one control.
type Fact = {
  name: string
  value: string
  detail?: string
  isCode?: boolean
  href?: string
  isAlarm?: boolean
  isDetailMarkdown?: boolean
  onDetailPress?: () => Promise<void>
}

const link = (text: string, href: string) => `[${text}](${href})`

// A control: a link the mod answers itself, so the surface opens nothing (in the
// desktop pane only a link has been seen to take a press). Its href goes nowhere
// (`.invalid` never resolves) in case a surface opens it anyway.
const actionHref = (id: string) => `https://pulse.invalid/${id}`
const escapeLabel = (label: string) => label.replace(/[[\]\\]/g, char => `\\${char}`)

// A memory file by its last two path segments: `.claude/CLAUDE.md`.
const tail = (path: string) => path.split('/').slice(-2).join('/')

// git in the session's folder: its stdout, or null when it fails (outside a repository).
async function git($: EngineInterface, ...args: string[]): Promise<string | null> {
  try {
    const run = await $.process.run(['git', ...args], { timeoutMs: 3000 })
    return run.exitCode === 0 ? run.stdout : null
  } catch {
    return null
  }
}

async function gitStatus($: EngineInterface): Promise<GitStatus | null> {
  const out = await git($, 'status', '--porcelain', '--branch')
  return out === null ? null : parseGitStatus(out)
}

// The branch's open pull request, from `gh`, or null when it has none, or gh is
// missing or signed out. GitHub is a network call away, so an answer holds a while.
type PullRequest = { number: number; url: string }
const pullRequests = new Map<string, { at: number; pr: PullRequest | null }>()
async function pullRequest($: EngineInterface, branch: string): Promise<PullRequest | null> {
  const now = await $.clock.now()
  const known = pullRequests.get(branch)
  if (known !== undefined && now - known.at < PR_FRESH_MS) return known.pr
  let pr: PullRequest | null = null
  try {
    const run = await $.process.run(['gh', 'pr', 'view', '--json', 'number,url'], { timeoutMs: 5000 })
    if (run.exitCode === 0) pr = JSON.parse(run.stdout) as PullRequest
  } catch {}
  pullRequests.set(branch, { at: now, pr })
  return pr
}

// Where the branch was pushed, on the web: `<repo>/tree/<branch>`, or undefined for
// a branch with no upstream or a remote with no web address.
async function branchUrl($: EngineInterface, upstream: string | undefined): Promise<string | undefined> {
  if (upstream === undefined) return undefined
  const [remote = '', ...rest] = upstream.split('/')
  const remoteUrl = await git($, 'remote', 'get-url', remote)
  const web = remoteUrl === null ? null : webUrl(remoteUrl)
  return web === null || rest.length === 0 ? undefined : `${web}/tree/${rest.join('/')}`
}

// The pane's facts in three blocks: the context window, the usage limits and cost,
// and the work itself. Usage figures are all used, never remaining, as the engine
// figures them (no price table of the mod's own).
async function facts($: EngineInterface): Promise<Fact[][]> {
  const usage = await $.session.usage({ breakdown: 'summary' })
  const now = await $.clock.now()
  const { context } = usage
  const breakdown = context.breakdown
  const window: Fact[] = []
  if (context.percent !== undefined) {
    const used = context.tokens ?? 0
    const threshold = breakdown?.isAutoCompactEnabled === true ? breakdown.autoCompactThreshold : undefined
    const compact =
      breakdown === undefined ? []
      : threshold === undefined ? ['auto-compact off']
      : [threshold > used ? `compacts in ${tokens(threshold - used)}` : 'compact due']
    window.push({ name: 'context', value: `${Math.round(context.percent)}% used`, detail: [`${tokens(used)} of ${tokens(context.window)}`, ...compact].join(' · ') })
  }
  const files = breakdown?.memoryFiles ?? []
  if (files.length > 0) {
    const total = files.reduce((sum, file) => sum + file.tokens, 0)
    const detail = files.map(file => `${link(tail(file.path), fileLink(file.path))} ${tokens(file.tokens)}`).join(' · ')
    window.push({ name: 'memory', value: tokens(total), detail, isDetailMarkdown: true })
  }
  const limits: Fact[] = usage.rateLimits.map(limit => ({
    name: LIMIT_NAMES[limit.kind] ?? limit.kind,
    value: `${Math.round(limit.percentUsed)}% used`,
    href: USAGE_PAGE,
    ...(limit.resetsAt === undefined ? {} : { detail: `resets ${timeLeft(Date.parse(limit.resetsAt) - now)}` }),
  }))
  if (usage.cost !== undefined) limits.push({ name: 'cost', value: `$${usage.cost.usd.toFixed(2)}` })
  const failed = await read($, errors)
  const work: Fact[] = [
    failed.last === undefined
      ? { name: 'errors', value: String(failed.count) }
      : { name: 'errors', value: String(failed.count), isAlarm: true, detail: `last: ${failed.last}`, onDetailPress: () => listErrors($) },
  ]
  const status = await gitStatus($)
  if (status !== null) {
    const away = [status.ahead > 0 ? `${status.ahead} ahead` : '', status.behind > 0 ? `${status.behind} behind` : ''].filter(Boolean).join(', ')
    const pr = status.upstream === undefined ? null : await pullRequest($, status.branch)
    const href = pr?.url ?? (await branchUrl($, status.upstream))
    const where = status.upstream === undefined ? 'not pushed' : away === '' ? 'in sync' : away
    const detail = pr === null ? where : `PR #${pr.number} · ${where}`
    work.push({ name: 'branch', value: status.branch, isCode: true, detail, ...(href === undefined ? {} : { href }) })
    const count = status.files.length
    if (count === 0) work.push({ name: 'changes', value: 'none' })
    else {
      const root = ((await git($, 'rev-parse', '--show-toplevel')) ?? '').trim()
      const named = status.files.slice(0, FILES_LISTED).map(file => (root === '' ? tail(file) : link(tail(file), fileLink(`${root}/${file}`))))
      const detail = [...named, ...(count > FILES_LISTED ? [`+${count - FILES_LISTED} more`] : [])].join(' · ')
      work.push({ name: 'changes', value: `${count} file${count === 1 ? '' : 's'}`, detail, isDetailMarkdown: true })
    }
  }
  return [window, limits, work].filter(block => block.length > 0)
}

// The last few failed tool calls, newest first, as a toast.
async function listErrors($: EngineInterface) {
  const failed = await read($, errors)
  const recent = [...(failed.recent ?? (failed.last === undefined ? [] : [failed.last]))].reverse()
  const head = `Last ${recent.length} of ${failed.count} failed tool call${failed.count === 1 ? '' : 's'}:`
  await $.ui.toast([head, ...recent].join('\n'), { timeoutMs: 15_000 })
}

// The facts in one line of text, for /pulse and the toast.
async function meters($: EngineInterface) {
  return (await facts($)).flat().map(f => `${f.name} ${f.value}`).join(' · ')
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
    // A Button: the desktop footer crops a Markdown and passes on none of its presses.
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row">
        <Button key="pulse-footer" label={footerLabel(current)} plain dimColor={current.isStale} onPress={() => openPulse($)} />
        <Text dimColor>{'  '}</Text>
        {rest}
      </Box>
    )
  })

  // The pane: the Pulse, the ones before it, then every fact, one line each. Nothing
  // folds and nothing waits on a hover; the one control is the last error.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    await sync($)
    const { Box, Markdown, Text } = $.ui.resolve(e)
    const current = await read($, pulse)
    const before = earlier(current, await read($, history))
    const blocks = await facts($)
    const set = (p: SessionPulse, isMuted?: boolean) => (
      <Typeset Text={Text} parts={[...pulseParts(p), ...(p.isStale ? [STALE_NOTE] : [])]} isMuted={isMuted} />
    )
    const value = (u: Fact) => {
      if (u.isAlarm === true) return <Text color="error">{u.value}</Text>
      const text = u.isCode ? `\`${u.value}\`` : codeNumbers(u.value)
      return <Markdown text={u.href === undefined ? text : link(text, u.href)} />
    }
    const detail = (u: Fact, text: string) => {
      if (u.onDetailPress !== undefined) {
        const href = actionHref(u.name)
        const press = u.onDetailPress
        return <Markdown key={`pulse-${u.name}`} text={link(escapeLabel(text), href)} dimColor pressableLinks={[href]} onLinkPress={() => void press()} />
      }
      return u.isDetailMarkdown === true ? <Markdown text={text} dimColor /> : <Text color="subtle">{text}</Text>
    }
    // Two columns, the name quiet and at the top. Right of it the value and its detail
    // share a wrapping line: where the pane is too narrow for both, the detail drops
    // beneath the value, aligned with it, and wraps there across the column's width.
    const NAME_CELLS = 9
    // Every Pulse is a paragraph of its own; a blank line sets off the history and each
    // block of facts, no heading and no rule.
    return (
      <Box flexDirection="column" paddingX={1}>
        <Box marginBottom={1}>{current === null ? <Text {...QUIET}>No Pulse yet.</Text> : set(current)}</Box>
        {before.map((p, index) => (
          <Box key={`h${index}`} marginBottom={1} marginTop={index === 0 ? 1 : 0}>
            {set(p, true)}
          </Box>
        ))}
        {blocks.map((block, at) => (
          <Box key={`b${at}`} flexDirection="column" marginTop={1}>
            {block.map(u => (
              <Box key={`u-${u.name}`} flexDirection="row" alignItems="flex-start">
                <Box width={NAME_CELLS} flexShrink={0}>
                  <Text {...QUIET}>{u.name}</Text>
                </Box>
                <Box key={`v-${u.name}`} flexDirection="row" flexWrap="wrap" columnGap={2} flexGrow={1} flexShrink={1} minWidth={0}>
                  <Box flexShrink={0}>{value(u)}</Box>
                  {u.detail === undefined ? null : (
                    <Box flexShrink={1} minWidth={0}>
                      {detail(u, u.detail)}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        ))}
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

  // A failed tool call, the main conversation's or a subagent's, counts as an error.
  // The call itself passes through untouched.
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    if (result.isError === true) {
      await sync($)
      const first = ((result.text ?? '').split('\n')[0] ?? '').trim()
      const last = first === '' ? e.tool : `${e.tool} · ${first.length > 48 ? `${first.slice(0, 47)}…` : first}`
      await update($, errors, failed => ({ count: failed.count + 1, last, recent: [...(failed.recent ?? []), last].slice(-ERRORS_LISTED) }))
      await save($)
    }
    return result
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
