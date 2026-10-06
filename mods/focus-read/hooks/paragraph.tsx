import type { ClientModule, ClientSurface } from 'claude-code'

export type Veil = 'none' | 'soft' | 'lit' | 'zero' | 'deep' | 'hidden'

export type SensorProps = {
  index: number
  /** How far to fade the paragraph under a veil in the transcript's own background. */
  veil: Veil
  /** How long a hover must rest before it is reported (the Style's Rest delay). */
  restDelayMs: number
}

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
// Soft eases a bright paragraph off full contrast (white on near-black) by a tenth.
const VEIL_ALPHA: Record<Exclude<Veil, 'none' | 'lit'>, number> = { soft: 0.1, zero: 0.42, deep: 0.8, hidden: 1 }
const VEIL_LIGHT = '252, 252, 251'
const VEIL_DARK = '21, 21, 21'
// The Highlight, "ember": a warm orange laid over the pin. Being over the text, not
// behind it, it tints both: on dark, a deep amber ground under cream text; on light, a
// peach ground under brown-black text. Either way a little less contrast than plain.
const EMBER = 'rgba(255, 159, 67, 0.15)'

type Pending = { kind: 'enter' | 'leave'; at: number }
type MediaList = { matches: boolean; addEventListener?: (type: 'change', fn: () => void) => void }
type MatchMedia = (query: string) => MediaList

const pending = new WeakMap<ClientSurface<unknown>, Pending | null>()
const armed = new WeakSet<ClientSurface<unknown>>()
// The latest Rest delay per instance: a Style switch redraws with new props, but the
// timer armed on the first draw keeps running.
const delays = new WeakMap<ClientSurface<unknown>, number>()

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
    // A click pins (for a Pinned Style; the hooks ignore it otherwise) and gives this
    // region the keys. Escape never arrives: the page keeps it to take the keys back.
    else if (event.type === 'down' && event.button === 'left') surface.post({ kind: 'pin', index })
  })
  surface.onKey(event => surface.post({ kind: 'key', index, key: event.key }))
  // The Rest delay: an enter or leave posts only once it has rested that long, so a
  // diagonal sweep across paragraphs does not flicker the focus.
  surface.every(TICK_MS, () => {
    frames += TICK_MS
    const waiting = pending.get(surface)
    if (!waiting || frames - waiting.at < (delays.get(surface) ?? 0)) return
    pending.set(surface, null)
    surface.post({ kind: waiting.kind, index })
  })
  // Redraw the veil when the app switches between light and dark.
  darkQuery?.addEventListener?.('change', () => surface.setState(darkQuery.matches))
}

const Sensor: ClientModule<SensorProps> = (props, surface) => {
  delays.set(surface, props.restDelayMs)
  arm(surface, props.index)
  const { Box } = surface.elements
  const veil =
    props.veil === 'none'
      ? undefined
      : props.veil === 'lit'
        ? EMBER
        : `rgba(${darkQuery?.matches ? VEIL_DARK : VEIL_LIGHT}, ${VEIL_ALPHA[props.veil]})`
  return <Box flexGrow={1} width="100%" height={OVERLAY_ROWS} backgroundColor={veil} />
}

export default Sensor
