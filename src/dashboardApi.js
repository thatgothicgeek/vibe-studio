const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const isCount = (value) => Number.isSafeInteger(value) && value >= 0
const optionalText = (value) => typeof value === 'string' && value.trim() ? value : null
const isRankTier = (value) => ['S', 'A', 'B', 'C', 'D', 'E', 'F'].includes(value)

export function parseDashboard(data) {
  if (!isObject(data) || !isCount(data.active_signal_count) || !isObject(data.category_signal_counts)) {
    throw new Error('Invalid dashboard response')
  }
  const counts = {}
  for (const category of ['TV', 'Movies', 'Comics', 'Games', 'Tech']) {
    if (!isCount(data.category_signal_counts[category])) throw new Error('Invalid category count')
    counts[category] = data.category_signal_counts[category]
  }
  let topSignal = null
  if (data.top_signal !== null) {
    const signal = data.top_signal
    if (!isObject(signal) || !optionalText(signal.headline) || !isCount(signal.source_count)
      || !isRankTier(signal.rank_tier)) {
      throw new Error('Invalid top signal')
    }
    topSignal = {
      signal_id: optionalText(signal.signal_id),
      headline: signal.headline,
      category: optionalText(signal.category),
      rank_tier: signal.rank_tier,
      source_count: signal.source_count,
      story_type: optionalText(signal.story_type),
      source_name: optionalText(signal.lead?.source_name),
      lifecycle_state: optionalText(signal.lifecycle_state),
      cluster_state: optionalText(signal.cluster_state),
    }
  }
  if (!isObject(data.top_by_category)) {
    throw new Error('Invalid category leaders')
  }

  const topByCategory = {}

  for (const category of ['TV', 'Movies', 'Comics', 'Games', 'Tech']) {
    const signal = data.top_by_category[category]

    if (signal === null) {
      topByCategory[category] = null
      continue
    }

    if (!isObject(signal) || !optionalText(signal.headline) || !isCount(signal.source_count)
      || !isRankTier(signal.rank_tier)) {
      throw new Error('Invalid category leader')
    }

    topByCategory[category] = {
      signal_id: optionalText(signal.signal_id),
      headline: signal.headline,
      category: optionalText(signal.category),
      rank_tier: signal.rank_tier,
      source_count: signal.source_count,
      story_type: optionalText(signal.story_type),
      source_name: optionalText(signal.lead?.source_name),
      lifecycle_state: optionalText(signal.lifecycle_state),
      cluster_state: optionalText(signal.cluster_state),
    }
  }

  return {
    active_signal_count: data.active_signal_count,
    category_signal_counts: counts,
    top_signal: topSignal,
    top_by_category: topByCategory,
  }
}

export function parseHealth(data) {
  if (!isObject(data) || !optionalText(data.status) || !optionalText(data.database)) {
    throw new Error('Invalid health response')
  }
  return { coreHealthy: data.status === 'ok', databaseHealthy: data.database === 'ok' }
}

export function parseSignal(data) {
  if (!isObject(data) || !optionalText(data.signal_id) || !optionalText(data.headline)) {
    throw new Error('Invalid signal response')
  }
  const lead = isObject(data.lead) ? data.lead : {}
  return {
    signal_id: data.signal_id,
    headline: data.headline,
    category: optionalText(data.category),
    rank_tier: isRankTier(data.rank_tier) ? data.rank_tier : null,
    source_count: isCount(data.source_count) ? data.source_count : null,
    story_type: optionalText(data.story_type),
    lifecycle_state: optionalText(data.lifecycle_state),
    cluster_state: optionalText(data.cluster_state),
    updated_at: optionalText(data.updated_at),
    lead: Object.fromEntries(['title', 'source_name', 'effective_at', 'timestamp_basis', 'warning']
      .map((key) => [key, optionalText(lead[key])])),
    articles: Array.isArray(data.articles) ? data.articles.filter(isObject).map((article) =>
      Object.fromEntries(['item_id', 'title', 'url', 'source_name', 'published_at', 'discovered_at', 'item_role']
        .map((key) => [key, optionalText(article[key])])) ) : [],
  }
}

export function parseSignals(data) {
  if (!Array.isArray(data)) throw new Error('Invalid signals response')
  return data.map((signal) => parseSignal(signal))
}

export async function fetchSignals(signal, limit = 24) {
  const safeLimit = Number.isSafeInteger(limit) && limit > 0 && limit <= 100 ? limit : 24
  return fetchDashboardResource(`/api/signals?limit=${safeLimit}`, signal, parseSignals)
}

export async function fetchSignal(signalId, signal) {
  const data = await fetchDashboardResource(`/api/signals/${encodeURIComponent(signalId)}`, signal, parseSignal)
  if (data.signal_id !== signalId) throw new Error('Signal response does not match request')
  return data
}

export async function fetchDashboardResource(url, signal, parse) {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    redirect: 'error',
  })
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('API unavailable')
  }
  return parse(await response.json())
}
