import { describe, expect, test } from 'claude-code/testing'

import { splitParagraphs } from './split'

describe('splitParagraphs', () => {
  test('splits on blank lines', async () => {
    expect(splitParagraphs('one\n\ntwo\n\n\nthree')).toEqual(['one', 'two', 'three'])
  })

  test('keeps a fenced block whole, blank lines inside included', async () => {
    const text = 'intro\n\n```ts\nconst a = 1\n\nconst b = 2\n```\n\noutro'
    expect(splitParagraphs(text)).toEqual(['intro', '```ts\nconst a = 1\n\nconst b = 2\n```', 'outro'])
  })

  test('keeps a loose list as one paragraph', async () => {
    const text = '- a\n\n- b\n  more b\n\n- c\n\nafter'
    expect(splitParagraphs(text)).toEqual(['- a\n\n- b\n  more b\n\n- c', 'after'])
  })

  test('keeps a numbered list and a table whole', async () => {
    const text = '1. a\n2. b\n\n| x | y |\n|---|---|\n| 1 | 2 |'
    expect(splitParagraphs(text)).toEqual(['1. a\n2. b', '| x | y |\n|---|---|\n| 1 | 2 |'])
  })

  test('glues a heading to the paragraph after it', async () => {
    expect(splitParagraphs('## Title\n\nbody\n\nnext')).toEqual(['## Title\n\nbody', 'next'])
  })

  test('a single paragraph is one unit; windows line endings are fine', async () => {
    expect(splitParagraphs('just one\r\nline pair')).toEqual(['just one\nline pair'])
  })
})
