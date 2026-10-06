// A Style is a preset over the properties below; Mode says whether the mod acts,
// the Style says how. See CONTEXT.md for each term.

export type StyleName = 'calm' | 'spotlight' | 'typewriter' | 'solo'

export type Style = {
  /** How far back a Paragraph sits with no Focus; none leaves it as written. */
  rest: 'none' | 'soft'
  /** How far back every Paragraph but the Focus sits while a Focus exists. */
  deep: 'strong' | 'hidden'
  /** A marker-like tint behind the Focus. */
  highlight: boolean
  /** Hover: the pointer resting moves the Focus. Pinned: a click sets it, keys move it. */
  trigger: 'hover' | 'pinned'
  /** How long a hover must rest before the Focus moves. */
  restDelayMs: number
  /** The Focus's neighbours in its Reply sit at the rest strength, between it and deep. */
  gradient: boolean
  /** Deep dim over every Reply, or only the Focus's own (the others stay at rest). */
  reach: 'all' | 'own'
}

export const STYLES: Record<StyleName, Style> = {
  calm: { rest: 'soft', deep: 'strong', highlight: false, trigger: 'hover', restDelayMs: 150, gradient: false, reach: 'all' },
  spotlight: { rest: 'none', deep: 'strong', highlight: false, trigger: 'hover', restDelayMs: 250, gradient: false, reach: 'all' },
  typewriter: { rest: 'soft', deep: 'strong', highlight: true, trigger: 'pinned', restDelayMs: 0, gradient: true, reach: 'own' },
  solo: { rest: 'soft', deep: 'hidden', highlight: false, trigger: 'pinned', restDelayMs: 0, gradient: false, reach: 'all' },
}

export const STYLE_ORDER = Object.keys(STYLES) as StyleName[]

export const isStyleName = (name: unknown): name is StyleName =>
  typeof name === 'string' && (STYLE_ORDER as string[]).includes(name)

export const nextStyle = (name: StyleName): StyleName =>
  STYLE_ORDER[(STYLE_ORDER.indexOf(name) + 1) % STYLE_ORDER.length] ?? 'calm'
