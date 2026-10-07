export type SessionPulseMove = 'working' | 'your move' | 'blocked' | 'done'

/** The session's where-are-we, as the last Pulse line left it. */
export type SessionPulse = {
  move: SessionPulseMove
  step?: { n: number; of: number }
  next?: string
  /** When the reply that carried it finished (ms since epoch). */
  at: number
  /** True once a later reply left work open without a Pulse line. */
  isStale: boolean
}

/** The session's failed tool calls: how many, and the last as "<tool> · <first line>". */
export type SessionPulseErrors = { count: number; last?: string }

declare module 'claude-code' {
  interface PluginState {
    'session-pulse': {
      pulse: SessionPulse | null
      history: SessionPulse[]
      errors: SessionPulseErrors
      /** Whether the pane shows every fact, or the short form; the person's, across sessions. */
      isExpanded: boolean
    }
  }
}
