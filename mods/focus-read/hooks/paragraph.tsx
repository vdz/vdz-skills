import type { ClientModule, ClientSurface } from 'claude-code'

export type Veil = 'none' | 'zero' | 'deep'

export type SensorProps = {
  index: number
  /** How far to fade the paragraph under a veil in the transcript's own background. */
  veil: Veil
}

const DEBOUNCE_MS = 80
const TICK_MS = 20

// The desktop page sizes a Client's holder by its content (one row at least), so a
// 100% height here would cover only the paragraph's first line. A tall fixed height
// fills the overlay instead; the page's Client wrapper clips it to the paragraph.
const OVERLAY_ROWS = 400

// The transcript's own background (the page's surface-1 token: #fcfcfb light, #151515
// dark), made translucent. Being the very colour beneath it, the veil draws no shape of
// its own; it only fades what it covers. A colour off by even a little reads as a
// painted box. Over a Markdown already at 60% opacity, dim zero leaves the text near
// 35% and deep dim near 20%.
const VEIL_ALPHA: Record<Exclude<Veil, 'none'>, number> = { zero: 0.42, deep: 0.67 }
const VEIL_LIGHT = '252, 252, 251'
const VEIL_DARK = '21, 21, 21'

type Pending = { kind: 'enter' | 'leave'; at: number }
type MediaList = { matches: boolean; addEventListener?: (type: 'change', fn: () => void) => void }
type MatchMedia = (query: string) => MediaList

const pending = new WeakMap<ClientSurface<unknown>, Pending | null>()
const armed = new WeakSet<ClientSurface<unknown>>()

// The frame on desktop is a real (sandboxed) page, so it can read the appearance;
// the terminal's in-process frame has no matchMedia and draws no veil anyway.
const darkQuery: MediaList | null = (() => {
  const matchMedia = (globalThis as { matchMedia?: MatchMedia }).matchMedia
  return typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
})()

function arm(surface: ClientSurface<unknown>, index: number) {
  if (armed.has(surface)) return
  armed.add(surface)
  let frames = 0
  surface.onPointer(event => {
    if (event.type === 'enter') pending.set(surface, { kind: 'enter', at: frames })
    else if (event.type === 'leave') pending.set(surface, { kind: 'leave', at: frames })
  })
  // The debounce: an enter or leave posts only once it has rested DEBOUNCE_MS,
  // so a diagonal sweep across paragraphs does not flicker the focus.
  surface.every(TICK_MS, () => {
    frames += TICK_MS
    const waiting = pending.get(surface)
    if (!waiting || frames - waiting.at < DEBOUNCE_MS) return
    pending.set(surface, null)
    surface.post({ kind: waiting.kind, index })
  })
  // Redraw the veil when the app switches between light and dark.
  darkQuery?.addEventListener?.('change', () => surface.setState(darkQuery.matches))
}

const Sensor: ClientModule<SensorProps> = (props, surface) => {
  arm(surface, props.index)
  const { Box } = surface.elements
  const veil =
    props.veil === 'none'
      ? undefined
      : `rgba(${darkQuery?.matches ? VEIL_DARK : VEIL_LIGHT}, ${VEIL_ALPHA[props.veil]})`
  return <Box flexGrow={1} width="100%" height={OVERLAY_ROWS} backgroundColor={veil} />
}

export default Sensor
