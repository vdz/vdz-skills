/**
 * Splits a reply's markdown into paragraphs: the units focus-read dims or keeps.
 *
 * A paragraph is a run of lines separated from the next by a blank line, with
 * these exceptions, so a unit never breaks a markdown construct:
 *  - a fenced code block (``` or ~~~) is one unit, blank lines inside included;
 *  - a list whose items are separated by blank lines (a "loose" list) stays one
 *    unit, as do its indented continuation lines;
 *  - a heading is glued to the unit that follows it.
 */
const FENCE = /^\s{0,3}(`{3,}|~{3,})/
const HEADING = /^\s{0,3}#{1,6}\s/
const LIST_ITEM = /^\s{0,3}([-*+]|\d{1,9}[.)])\s/
const INDENTED = /^\s{2,}\S/

export function splitParagraphs(text: string): string[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const units: string[][] = []
  let current: string[] = []
  let fence: string | null = null
  let inList = false

  const flush = () => {
    if (current.length > 0) units.push(current)
    current = []
    inList = false
  }

  for (const line of lines) {
    if (fence) {
      current.push(line)
      if (line.trim().startsWith(fence)) fence = null
      continue
    }
    const opening = FENCE.exec(line)
    if (opening) {
      if (!inList) flush()
      fence = opening[1] ?? null
      current.push(line)
      inList = false
      continue
    }
    if (line.trim() === '') {
      if (inList) current.push(line)
      else flush()
      continue
    }
    if (inList && current[current.length - 1]?.trim() === '') {
      // A blank line inside a list: the list goes on only if the next line is
      // another item or an indented continuation; anything else ends it.
      if (LIST_ITEM.test(line) || INDENTED.test(line)) {
        current.push(line)
        continue
      }
      while (current[current.length - 1]?.trim() === '') current.pop()
      flush()
    }
    if (LIST_ITEM.test(line) && current.length === 0) inList = true
    current.push(line)
  }
  while (current[current.length - 1]?.trim() === '') current.pop()
  flush()

  // Glue a lone heading to the unit after it.
  const glued: string[][] = []
  for (const unit of units) {
    const previous = glued[glued.length - 1]
    if (previous && previous.length === 1 && HEADING.test(previous[0] ?? "")) {
      previous.push('', ...unit)
    } else {
      glued.push([...unit])
    }
  }
  return glued.map(unit => unit.join('\n'))
}
