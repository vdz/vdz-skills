export type FocusReadFocus = {
  /** The reply block (its `requestId`) whose paragraph is under the pointer. */
  requestId: string
  /** Which paragraph of that block, 0-based. */
  index: number
}

/** One of the Styles the mod ships (hooks/styles.ts). */
export type FocusReadStyle = 'calm' | 'spotlight' | 'typewriter' | 'solo'

declare module 'claude-code' {
  interface PluginState {
    'focus-read': {
      isOn: boolean
      focus: FocusReadFocus | null
      style: FocusReadStyle
    }
  }
}
