import { expect, test } from 'claude-code/testing'

import { boot, PLUGIN, reply, type $ } from './harness'

// The pane with every fact shown: `more` pressed once, which it then remembers.
let isExpanded = false
const paneOf = async ($: $, surface: 'desktop' | 'terminal' = 'desktop') => {
  const pane = await $.ui.mount({ plugin: PLUGIN, surface, requestId: 'session-pulse', component: 'Pane', props: { bodyColumns: 40 } as never })
  if (!isExpanded) await pane.press({ key: 'pulse-more' })
  isExpanded = true
  return pane
}
const fresh = () => void (isExpanded = false)

const row = async (pane: Awaited<ReturnType<typeof paneOf>>, name: string) => {
  const box = await pane.find({ key: `u-${name}` })
  // As read: code marks dropped, a link as its text.
  return box?.text?.replaceAll('`', '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
}

test('the pane shows the room left before auto-compact, and the memory loaded', async ($, on) => {
  fresh()
  await boot($, on)
  await reply($, '▸ working · next: write the parser')
  const pane = await paneOf($)
  // 160k threshold, 84k in the window.
  expect(await row(pane, 'compact')).toMatch(/^compactin 76k.*at 160k$/)
  expect(await row(pane, 'memory')).toMatch(/^memory6\.2k · 2 files.*\.claude\/CLAUDE\.md 2\.1k · repo\/CLAUDE\.md 4\.1k/)
  // Each memory file opens from its name.
  expect(await pane.find({ type: 'Markdown', text: /\[\.claude\/CLAUDE\.md\]\(file:\/\/\/Users\/me\/\.claude\/CLAUDE\.md\) 2\.1k/ })).toBeTruthy()
  await pane.unmount()
})

test('a failed tool call counts as an error, in red, the last one named in the hint', async ($, on) => {
  fresh()
  await boot($, on)
  await reply($, '▸ working · next: run the tests')
  const before = await paneOf($)
  expect(await row(before, 'errors')).toMatch(/^errors0/)
  expect(await before.find({ type: 'Text', text: /^0$/ })).toBeUndefined()
  await before.unmount()
  await $.tool.call({ tool: 'Bash', command: 'ls' } as never)
  await $.tool.call({ tool: 'Bash', command: 'false' } as never)
  const after = await paneOf($)
  expect(await row(after, 'errors')).toMatch(/^errors1.*last: Bash · Exit code 1/)
  expect((await after.find({ type: 'Text', text: /^1$/ }))?.props.color).toBe('error')
  await after.unmount()
})

test('the pane shows the branch, linked to its upstream, and the uncommitted files', async ($, on) => {
  fresh()
  await boot($, on)
  await reply($, '▸ working · next: commit')
  const pane = await paneOf($)
  expect(await row(pane, 'branch')).toMatch(/^branchfeat\/x.*2 ahead$/)
  expect(await row(pane, 'changes')).toMatch(/^changes2 files.*uncommitted$/)
  // The branch is code as a whole, digits and all, and opens where it was pushed.
  expect(await pane.find({ type: 'Markdown', text: '[`feat/x`](https://github.com/vdz/skills/tree/feat/x)' })).toBeTruthy()
  await pane.unmount()
})

test('a branch never pushed is no link', async ($, on) => {
  fresh()
  await boot($, on, { git: '## feat/y\n' })
  await reply($, '▸ working · next: push')
  const pane = await paneOf($)
  expect(await pane.find({ type: 'Markdown', text: '`feat/y`' })).toBeTruthy()
  await pane.unmount()
})

test('outside a git repository there is no branch and no changes', async ($, on) => {
  fresh()
  await boot($, on, { git: null })
  await reply($, '▸ working · next: commit')
  const pane = await paneOf($)
  expect(await pane.find({ key: 'u-branch' })).toBeUndefined()
  expect(await pane.find({ key: 'u-changes' })).toBeUndefined()
  await pane.unmount()
})
