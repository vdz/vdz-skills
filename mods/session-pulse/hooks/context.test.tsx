import { expect, test } from 'claude-code/testing'

import { boot, PLUGIN, reply, type $ } from './harness'

const paneOf = ($: $, surface: 'desktop' | 'terminal' = 'desktop') =>
  $.ui.mount({ plugin: PLUGIN, surface, requestId: 'session-pulse', component: 'Pane', props: { bodyColumns: 40 } as never })

const row = async (pane: Awaited<ReturnType<typeof paneOf>>, name: string) => {
  const box = await pane.find({ key: `u-${name}` })
  return box?.text?.replaceAll('`', '')
}

test('the pane shows the room left before auto-compact, and the memory loaded', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · next: write the parser')
  const pane = await paneOf($)
  // 160k threshold, 84k in the window.
  expect(await row(pane, 'compact')).toMatch(/^compactin 76k.*at 160k$/)
  expect(await row(pane, 'memory')).toMatch(/^memory6\.2k · 2 files.*\.claude\/CLAUDE\.md 2\.1k · repo\/CLAUDE\.md 4\.1k/)
  await pane.unmount()
})

test('a failed tool call counts as an error, the last one named in the hint', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · next: run the tests')
  const before = await paneOf($)
  expect(await row(before, 'errors')).toMatch(/^errors0/)
  await before.unmount()
  await $.tool.call({ tool: 'Bash', command: 'ls' } as never)
  await $.tool.call({ tool: 'Bash', command: 'false' } as never)
  const after = await paneOf($)
  expect(await row(after, 'errors')).toMatch(/^errors1.*last: Bash · Exit code 1/)
  await after.unmount()
})

test('the pane shows the branch and the uncommitted files', async ($, on) => {
  await boot($, on)
  await reply($, '▸ working · next: commit')
  const pane = await paneOf($)
  expect(await row(pane, 'branch')).toMatch(/^branchfeat\/x.*2 ahead$/)
  expect(await row(pane, 'changes')).toMatch(/^changes2 files.*uncommitted$/)
  // The branch is code as a whole, digits and all.
  expect(await pane.find({ type: 'Markdown', text: '`feat/x`' })).toBeTruthy()
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
