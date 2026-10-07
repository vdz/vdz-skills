import { mock, type TestBody } from 'claude-code/testing'

type $ = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

export const PLUGIN = 'session-pulse'
export const COMPOSER = { kind: 'composer' } as const

// The test's hooks stand for the engine beneath the mod: a store, a session id,
// the command registry, the reply and command rows, panes and toasts.
export async function boot($: $, on: On, options: { sessionId?: string; entries?: Record<string, unknown>; isPaneRefused?: boolean } = {}) {
  const session = { id: options.sessionId ?? 's1' }
  const seen = { toasts: [] as string[], panes: [] as string[] }
  mock.clock(on)
  mock.store(on, options.entries)
  on('session.id', () => ({ value: session.id }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { tokens: 84_000, window: 200_000, percent: 42 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 61 }],
      cost: { usd: 3.2 },
    },
  }))
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
