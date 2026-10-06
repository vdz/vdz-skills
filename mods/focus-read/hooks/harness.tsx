import { mock, type TestBody } from 'claude-code/testing'

export const REPLY = {
  component: 'AssistantMessage' as const,
  props: { text: 'first paragraph\n\nsecond paragraph\n\nthird paragraph', isFirstOfReply: true },
}
export const SURFACES = ['terminal', 'desktop'] as const

// The test's hooks stand for the engine: answer the command registration and
// start the session the way the REPL does.
export async function boot($: Parameters<TestBody>[0], on: Parameters<TestBody>[1], entries?: Record<string, unknown>) {
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

export const dimsOf = async (ui: { findAll: (q: { type: string }) => Promise<{ props: Record<string, unknown> }[]> }) =>
  (await ui.findAll({ type: 'Markdown' })).map(m => m.props.dimColor === true)
export const veilsOf = async (ui: { findAll: (q: { type: string }) => Promise<{ props: Record<string, unknown> }[]> }) =>
  (await ui.findAll({ type: 'Client' })).map(c => (c.props.props as { veil: string }).veil)

