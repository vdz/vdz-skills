import { expect, test } from 'claude-code/testing'

import { action, boot, PLUGIN, reply, type $ } from './harness'

const paneOf = ($: $, surface: 'desktop' | 'terminal' = 'desktop') =>
  $.ui.mount({ plugin: PLUGIN, surface, requestId: 'session-pulse', component: 'Pane', props: { bodyColumns: 40 } as never })

// A row as read: code marks dropped, a link as its text.
const row = async (pane: Awaited<ReturnType<typeof paneOf>>, name: string) =>
  (await pane.find({ key: `u-${name}` }))?.text?.replaceAll('`', '').replace(/\[([^\]]*)\]\([^[]*?\)/g, '$1')

test('the context line says the room left before auto-compact; the memory line names each file loaded', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · next: write the parser')
  const pane = await paneOf($)
  // 160k threshold, 84k in the window.
  expect(await row(pane, 'context')).toBe('context42% used84k of 200k · compacts in 76k')
  expect(await row(pane, 'memory')).toBe('memory6.2k.claude/CLAUDE.md 2.1k · repo/CLAUDE.md 4.1k')
  // Each memory file opens from its name.
  expect(await pane.find({ type: 'Markdown', text: '[.claude/CLAUDE.md](file:///Users/me/.claude/CLAUDE.md) 2.1k · [repo/CLAUDE.md](file:///repo/CLAUDE.md) 4.1k' })).toBeTruthy()
  await pane.unmount()
})

test('a failed tool call counts as an error, in red, the last one named beside it', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · next: run the tests')
  const before = await paneOf($)
  expect(await row(before, 'errors')).toBe('errors0')
  expect(await before.find({ type: 'Text', text: /^0$/ })).toBeUndefined()
  await before.unmount()
  await $.tool.call({ tool: 'Bash', command: 'ls' } as never)
  await $.tool.call({ tool: 'Bash', command: 'false' } as never)
  const after = await paneOf($)
  expect(await row(after, 'errors')).toBe('errors1last: Bash · Exit code 1')
  expect((await after.find({ type: 'Text', text: /^1$/ }))?.props.color).toBe('error')
  await after.unmount()
})

test('pressing the last error lists the last five, newest first', async ($, on) => {
  const { seen } = await boot($, on)
  await reply($, '▸ working · next: run the tests')
  for (const n of [1, 2, 3, 4, 5, 6]) await $.tool.call({ tool: 'Bash', command: `false ${n}` } as never)
  const pane = await paneOf($)
  expect(await row(pane, 'errors')).toMatch(/^errors6.*last: Bash · Exit code 6/)
  expect((await pane.find({ key: 'pulse-errors' }))?.props.text).toBe('[last: Bash · Exit code 6](https://pulse.invalid/errors)')
  await pane.press({ key: 'pulse-errors', link: action('errors') })
  expect(seen.toasts.at(-1)).toBe(['Last 5 of 6 failed tool calls:', ...[6, 5, 4, 3, 2].map(n => `Bash · Exit code ${n}`)].join('\n'))
  await pane.unmount()
})

test('the pane shows the branch, linked to its upstream, and the uncommitted files', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · next: commit')
  const pane = await paneOf($)
  expect(await row(pane, 'branch')).toBe('branchfeat/x2 ahead')
  expect(await row(pane, 'changes')).toBe('changes2 filesa.ts · b.ts')
  // Each uncommitted file opens from its name, found from the repository's root.
  expect(await pane.find({ type: 'Markdown', text: '[a.ts](file:///repo/a.ts) · [b.ts](file:///repo/b.ts)' })).toBeTruthy()
  // The branch is code as a whole, digits and all, and opens where it was pushed.
  expect(await pane.find({ type: 'Markdown', text: '[`feat/x`](https://github.com/vdz/skills/tree/feat/x)' })).toBeTruthy()
  await pane.unmount()
})

test('a branch with an open pull request links to it, and says which', async ($, on) => {
  await boot($, on, { pr: { number: 42, url: 'https://github.com/vdz/skills/pull/42' } })
  await reply($, '◂ your move · next: review')
  const pane = await paneOf($)
  expect(await pane.find({ type: 'Markdown', text: '[`feat/x`](https://github.com/vdz/skills/pull/42)' })).toBeTruthy()
  expect(await row(pane, 'branch')).toBe('branchfeat/xPR #42 · 2 ahead')
  await pane.unmount()
})

test('past five uncommitted files the rest are counted, not listed', async ($, on) => {
  await boot($, on, { git: `## main\n${[1, 2, 3, 4, 5, 6, 7].map(n => `?? f${n}.ts`).join('\n')}\n` })
  await reply($, '▸ working · next: commit')
  const pane = await paneOf($)
  expect(await row(pane, 'changes')).toMatch(/f5\.ts · \+2 more$/)
  await pane.unmount()
})

test('a branch never pushed is no link', async ($, on) => {
  await boot($, on, { git: '## feat/y\n' })
  await reply($, '▸ working · next: push')
  const pane = await paneOf($)
  expect(await pane.find({ type: 'Markdown', text: '`feat/y`' })).toBeTruthy()
  await pane.unmount()
})

test('outside a git repository there is no branch and no changes', async ($, on) => {
  await boot($, on, { git: null })
  await reply($, '▸ working · next: commit')
  const pane = await paneOf($)
  expect(await pane.find({ key: 'u-branch' })).toBeUndefined()
  expect(await pane.find({ key: 'u-changes' })).toBeUndefined()
  await pane.unmount()
})

test('a clean tree says so, with no files beside it', async ($, on) => {
  await boot($, on, { git: '## main...origin/main\n' })
  await reply($, '✓ done')
  const pane = await paneOf($)
  expect(await row(pane, 'branch')).toBe('branchmainin sync')
  expect(await row(pane, 'changes')).toBe('changesnone')
  await pane.unmount()
})
