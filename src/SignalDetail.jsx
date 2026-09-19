import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { fetchSignal } from './dashboardApi'

function Timestamp({ value }) {
  if (!value) return 'Not provided'
  // Core also returns timezone-free timestamps. Preserve those without assuming a zone.
  const zoned = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  const date = new Date(value)
  if (!zoned || Number.isNaN(date.getTime())) return <span>{value}</span>
  return <time dateTime={value}>{new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
  }).format(date)} UTC</time>
}

function Metadata({ label, children }) {
  return <div><dt>{label}</dt><dd>{children ?? 'Not provided'}</dd></div>
}

function articleUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch { return null }
}

export default function SignalDetail({ signalId, onBack }) {
  const [resource, setResource] = useState({ status: 'loading', data: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    fetchSignal(signalId, controller.signal)
      .then((data) => { if (active) setResource({ status: 'ready', data }) })
      .catch(() => { if (active) setResource({ status: 'error', data: null }) })
      .finally(() => window.clearTimeout(timeout))
    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [signalId])

  const signal = resource.data
  return <div className="page-stack signal-detail">
    <button className="outline-button signal-back" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" />Back to Dashboard</button>
    {resource.status === 'loading' && <section className="panel signal-unavailable" role="status" aria-busy="true"><h2>Loading signal…</h2><p>Retrieving editorial context from Vibe Hub.</p></section>}
    {resource.status === 'error' && <section className="panel signal-unavailable" role="alert"><h2>Signal unavailable</h2><p>We couldn’t load this signal. It may no longer be available, or Vibe Hub may be temporarily unreachable. Return to Dashboard and try again.</p></section>}
    {signal && <>
      <section className="signal-hero signal-detail-hero" aria-labelledby="signal-headline">
        <div className="signal-hero-copy">
          <span className="eyebrow cyan-text">SIGNAL / EDITORIAL INSPECTION</span>
          <h2 id="signal-headline">{signal.headline}</h2>
          <p>{signal.category ?? 'Category not assigned'}{signal.story_type && <> / {signal.story_type}</>}</p>
        </div>
        <div className={`signal-score rank-${signal.rank_tier?.toLowerCase() ?? 'unranked'}`}>
          <span>{signal.rank_tier ?? '—'}</span><small>SIGNAL RANK</small>
        </div>
      </section>
      <section className="panel" aria-labelledby="signal-context"><h3 className="section-label" id="signal-context">EDITORIAL CONTEXT</h3>
        <dl className="signal-detail-metadata">
          <Metadata label="Source count">{signal.source_count}</Metadata>
          <Metadata label="Story type">{signal.story_type}</Metadata>
          <Metadata label="Lifecycle">{signal.lifecycle_state}</Metadata>
          <Metadata label="Cluster state">{signal.cluster_state}</Metadata>
          <Metadata label="Last updated"><Timestamp value={signal.updated_at} /></Metadata>
        </dl>
      </section>
      <section className="panel" aria-labelledby="signal-lead"><h3 className="section-label" id="signal-lead">LEAD SOURCE</h3>
        <p className="signal-lead-source">{signal.lead.source_name ?? 'Lead source not provided'}</p>
        {signal.lead.title && <p className="signal-lead-title">{signal.lead.title}</p>}
        <dl className="signal-detail-metadata">
          <Metadata label="Lead timestamp"><Timestamp value={signal.lead.effective_at} /></Metadata>
          <Metadata label="Timestamp basis">{signal.lead.timestamp_basis?.replaceAll('_', ' ')}</Metadata>
        </dl>
        {signal.lead.warning && <p className="signal-lead-warning">{signal.lead.warning}</p>}
      </section>
      <section className="panel" aria-labelledby="signal-sources"><h3 className="section-label" id="signal-sources">SOURCE COVERAGE</h3>
        {signal.articles.length ? <ul className="signal-articles">{signal.articles.map((article, index) => {
          const url = articleUrl(article.url)
          return <li key={`${article.item_id ?? 'article'}-${index}`}>
            <div className="signal-article-source">{article.source_name ?? 'Source not provided'}{article.item_role && <span>{article.item_role}</span>}</div>
            <h4>{url ? <a href={url} target="_blank" rel="noopener noreferrer">{article.title ?? 'Read source article'}<ArrowUpRight size={16} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a> : article.title ?? 'Article title not provided'}</h4>
            <dl className="signal-detail-metadata">
              {article.published_at && <Metadata label="Published"><Timestamp value={article.published_at} /></Metadata>}
              {article.discovered_at && <Metadata label="Discovered"><Timestamp value={article.discovered_at} /></Metadata>}
            </dl>
          </li>
        })}</ul> : <p className="signal-detail-note">No source articles provided.</p>}
      </section>
    </>}
  </div>
}
