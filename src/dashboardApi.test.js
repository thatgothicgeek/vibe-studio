import test from 'node:test'
import assert from 'node:assert/strict'

import {
  parseDashboard,
  parseRefreshRequest,
  parseSignal,
} from './dashboardApi.js'

test('Signal detail preserves source excerpts', () => {
  const signal = parseSignal({
    signal_id: 'signal-1',
    headline: 'Example story',
    category: 'Tech',
    rank_tier: 'A',
    source_count: 2,
    lead: {
      source_name: 'Example',
      excerpt: 'Lead excerpt',
    },
    articles: [
      {
        item_id: 'source-1',
        title: 'Source story',
        excerpt: 'Article excerpt',
      },
    ],
  })

  assert.equal(signal.lead.excerpt, 'Lead excerpt')
  assert.equal(signal.articles[0].excerpt, 'Article excerpt')
})

test('Dashboard exposes category leaders and refresh metadata', () => {
  const leader = {
    signal_id: 'signal-1',
    headline: 'Top story',
    category: 'TV',
    rank_tier: 'S',
    source_count: 3,
  }

  const dashboard = parseDashboard({
    active_signal_count: 5,
    category_signal_counts: {
      TV: 1,
      Movies: 1,
      Comics: 1,
      Games: 1,
      Tech: 1,
    },
    top_signal: leader,
    top_by_category: {
      TV: leader,
      Movies: null,
      Comics: null,
      Games: null,
      Tech: null,
    },
    last_refresh_at: '2026-09-20T12:00:00.000Z',
    last_refresh_trigger: 'manual',
  })

  assert.equal(dashboard.top_by_category.TV.headline, 'Top story')
  assert.equal(dashboard.last_refresh_trigger, 'manual')
})

test('Refresh request parser accepts queue states', () => {
  const request = parseRefreshRequest({
    request_id: 'refresh-1',
    status: 'CLAIMED',
    requested_at: '2026-09-20T12:00:00.000Z',
  })

  assert.equal(request.request_id, 'refresh-1')
  assert.equal(request.status, 'CLAIMED')
})
