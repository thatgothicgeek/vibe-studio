import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getGreeting,
  resolveShellInput,
} from './studioShellModel.js'

test('resolves slash commands', () => {
  assert.deepEqual(
    resolveShellInput('/create'),
    {
      type: 'command',
      action: 'create',
      label: '/create',
    },
  )
})

test('resolves numbered choices against current context', () => {
  assert.equal(resolveShellInput('2', 'home').action, 'news')
  assert.equal(resolveShellInput('2', 'news').action, 'news-category')
})

test('keeps free text available for future conversational flows', () => {
  assert.deepEqual(
    resolveShellInput('An idea about iPhone security'),
    {
      type: 'text',
      value: 'An idea about iPhone security',
    },
  )
})

test('greeting follows local hour', () => {
  assert.equal(getGreeting(new Date(2026, 8, 20, 9)), 'Good morning')
  assert.equal(getGreeting(new Date(2026, 8, 20, 14)), 'Good afternoon')
  assert.equal(getGreeting(new Date(2026, 8, 20, 21)), 'Good evening')
})
