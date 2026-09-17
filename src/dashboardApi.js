const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const isCount = (value) => Number.isSafeInteger(value) && value >= 0
const optionalText = (value) => typeof value === 'string' && value.trim() ? value : null

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
      || typeof signal.viability_score !== 'number' || !Number.isFinite(signal.viability_score)
      || signal.viability_score < 0 || signal.viability_score > 100) {
      throw new Error('Invalid top signal')
    }
    topSignal = {
      signal_id: optionalText(signal.signal_id),
      headline: signal.headline,
      category: optionalText(signal.category),
      viability_score: signal.viability_score,
      source_count: signal.source_count,
      story_type: optionalText(signal.story_type),
      source_name: optionalText(signal.lead?.source_name),
      lifecycle_state: optionalText(signal.lifecycle_state),
      cluster_state: optionalText(signal.cluster_state),
    }
  }
  return { active_signal_count: data.active_signal_count, category_signal_counts: counts, top_signal: topSignal }
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
    viability_score: typeof data.viability_score === 'number' && Number.isFinite(data.viability_score)
      && data.viability_score >= 0 && data.viability_score <= 100 ? data.viability_score : null,
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
