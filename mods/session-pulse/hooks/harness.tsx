import { mock, type TestBody } from 'claude-code/testing'

export type $ = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

export const PLUGIN = 'session-pulse'
export const COMPOSER = { kind: 'composer' } as const

// The test's hooks stand for the engine beneath the mod: a store, a session id,
// the command registry, the reply and command rows, panes and toasts.
export async function boot($: $, on: On, options: { sessionId?: string; entries?: Record<string, unknown>; isPaneRefused?: boolean; git?: string | null; pr?: { number: number; url: string } | null } = {}) {
  const session = { id: options.sessionId ?? 's1' }
  const seen = { toasts: [] as string[], panes: [] as string[] }
  mock.clock(on)
  const resetsAt = new Date((2 * 60 + 10) * 60_000).toISOString() // the mock clock starts at 0
  mock.store(on, options.entries)
  on('session.id', () => ({ value: session.id }))
  // The breakdown only when asked for, as the engine counts it only then.
  const breakdown = {
    autoCompactThreshold: 160_000,
    isAutoCompactEnabled: true,
    memoryFiles: [
      { path: '/Users/me/.claude/CLAUDE.md', type: 'User', tokens: 2_100 },
      { path: '/repo/CLAUDE.md', type: 'Project', tokens: 4_100 },
    ],
  }
  on('session.usage', (_$, e) => ({
    value: {
      startedAt: 0,
      context: { tokens: 84_000, window: 200_000, percent: 42, ...(e.breakdown ? { breakdown: breakdown as never } : {}) },
      rateLimits: [{ kind: 'five_hour', percentUsed: 61, resetsAt }],
      cost: { usd: 3.2 },
    },
  }))
  // git in the session's folder: a status, or no repository at all (null).
  const git = options.git === undefined ? '## feat/x...origin/feat/x [ahead 2]\n M a.ts\n?? b.ts\n' : options.git
  const ran = (stdout: string, exitCode = 0) => ({ exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false })
  on('process.run', (_$, e) => ({
    value:
      e.argv[0] === 'gh' ? (options.pr ? ran(JSON.stringify(options.pr)) : ran('', 1))
      : e.argv[0] !== 'git' || git === null ? ran('', 128)
      : e.argv[1] === 'remote' ? (e.argv[3] === 'origin' ? ran('git@github.com:vdz/skills.git\n') : ran('', 2))
      : e.argv[1] === 'rev-parse' ? ran('/repo\n')
      : ran(git),
  }))
  // Tools: `false` fails, as the shell's own does (`false 3` with exit code 3); anything else succeeds.
  on('tool.call', (_$, e) =>
    (e.tool === 'Bash' && e.command.startsWith('false')
      ? { ref: 1, result: {}, text: `Exit code ${e.command.split(' ')[1] ?? 1}`, isError: true }
      : { ref: 1, result: {}, text: 'ok' }) as never,
  )
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('session.end', (_$, e) => ({ sessionId: e.sessionId }))
  on('turn.complete', () => ({ text: '' }))
  on('command.run', () => ({ text: '' }))
  on('prompt.submit', (_$, e) => ({ text: e.text, ...(e.context ? { context: e.context } : {}) }))
  on('ui.open', (_$, e) => {
    seen.panes.push(e.id)
    return { value: options.isPaneRefused ? { isPlaced: false as const, reason: 'no room' } : { isPlaced: true as const } }
  })
  on('ui.toast', (_$, e) => (seen.toasts.push(e.text), { value: undefined }))
  on('ui.render', { component: 'SessionMode' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text key="engine-modes">{e.props.modes.join(' & ')}</Text>
  })
  on('ui.render', { component: 'AssistantMessage' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text key="engine-reply">{e.props.text}</Text>
  })
  await $.session.start({ cwd: '/tmp', surface: 'desktop', isInteractive: true })
  return {
    seen,
    // A new session id from here on, as /clear and /resume leave the engine.
    switchTo: (id: string) => void (session.id = id),
  }
}

// One main-conversation turn ending with this reply.
export const reply = ($: $, answer: string, extra: { agentId?: string } = {}) =>
  $.turn.complete({ turnId: `t-${answer.length}`, answer, durationMs: 1, isAborted: false, reason: 'answer', ...extra })

export const pulse = ($: $, args = '') =>
  $.command.run({ command: 'pulse', args, origin: COMPOSER, presentation: { isFullscreen: false, columns: 120 } })

// The pane's controls are links the mod answers, a press on each named by its href.
export const action = (id: string) => ({ href: `https://pulse.invalid/${id}` })
