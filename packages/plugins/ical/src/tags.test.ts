import { describe, expect, test } from 'vitest'
import { TAG_COLORS, parseEventTag } from './tags'

describe('parseEventTag', () => {
  test('splits a leading [Tag] off the title', () => {
    expect(parseEventTag('[Conf] Opening Talk')).toEqual({ tag: 'Conf', title: 'Opening Talk' })
  })

  test('returns null tag when there is no bracket prefix', () => {
    expect(parseEventTag('Lunch')).toEqual({ tag: null, title: 'Lunch' })
  })

  test('keeps emoji and inner brackets in the title', () => {
    expect(parseEventTag('[Hack] 🚨 Submission deadline')).toEqual({
      tag: 'Hack',
      title: '🚨 Submission deadline'
    })
  })

  test('every known tag has a color', () => {
    for (const tag of ['Conf', 'Workshop', 'Hack', 'Side']) {
      expect(TAG_COLORS[tag]).toMatch(/^#/)
    }
  })
})
