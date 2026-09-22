import test from 'node:test'
import assert from 'node:assert/strict'

import {
  commandMatches,
  greetingForDate,
  searchItems,
  wisdomForDate,
} from './homeModel.js'

test('greeting follows the local hour', () => {
  assert.equal(greetingForDate(new Date(2026, 8, 20, 8)), 'Good morning')
  assert.equal(greetingForDate(new Date(2026, 8, 20, 14)), 'Good afternoon')
  assert.equal(greetingForDate(new Date(2026, 8, 20, 20)), 'Good evening')
})

test('daily wisdom is stable for the same date', () => {
  const date = new Date(2026, 8, 20, 14)
  assert.equal(wisdomForDate(date), wisdomForDate(date))
})

test('slash commands filter by prefix', () => {
  assert.deepEqual(
    commandMatches('/s').map(({ command }) => command),
    ['/signal', '/sources', '/settings'],
  )
})

test('search finds signals and work', () => {
  const result = searchItems(
    'apple',
    [{ headline: 'Apple announces something' }],
    [{ title: 'Apple Event Brief' }],
  )

  assert.equal(result.signals.length, 1)
  assert.equal(result.work.length, 1)
})
