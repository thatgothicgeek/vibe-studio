import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Boxes,
  Clapperboard,
  ChevronRight,
  CircleDot,
  Compass,
  FilePlus2,
  FolderOpen,
  Gamepad2,
  LayoutDashboard,
  Laptop,
  Menu,
  Newspaper,
  Radio,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Tv,
  Users,
  X,
} from 'lucide-react'
import './Studio.css'
import SignalDetail from './SignalDetail'
import { fetchDashboardResource, fetchSignals, parseDashboard, parseHealth } from './dashboardApi'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Discover', icon: Compass },
  { label: 'News Desk', icon: Newspaper, badge: '04' },
  { label: 'Create', icon: FilePlus2 },
  { label: 'Sources', icon: Radio },
  { label: 'Audience', icon: Users },
  { label: 'Distribution', icon: BarChart3 },
  { label: 'System', icon: Settings2 },
]

const categorySignals = [
  { name: 'TV', count: '12 signals', color: 'cyan', Icon: Tv },
  { name: 'Movies', count: '08 signals', color: 'purple', Icon: Clapperboard },
  { name: 'Comics', count: '08 signals', color: 'purple', Icon: BookOpen },
  { name: 'Games', count: '06 signals', color: 'magenta', Icon: Gamepad2 },
  { name: 'Tech', count: '05 signals', color: 'cyan', Icon: Laptop },
]

const activity = [
  ['Signal captured', 'New trailer data is ready for review', '12 min ago'],
  ['Desk updated', 'A story moved to Developing', '38 min ago'],
  ['Collection edited', 'Weekend Watchlist received a note', '1 hr ago'],
]

function StudioMark() {
  return (
    <div className="studio-mark" aria-hidden="true">
      <span>V</span>
    </div>
  )
}

function Sidebar({ activePage, onNavigate, open, onClose }) {
  return (
    <>
      {open && <button className="sidebar-scrim" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`studio-sidebar${open ? ' is-open' : ''}`}>
        <div className="sidebar-top">
          <a className="studio-wordmark" href="/studio" onClick={onClose}>
            <StudioMark />
            <span><b>VIBE</b> / STUDIO</span>
          </a>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <div className="workspace-label">Editorial control / V1</div>
        <nav className="studio-nav" aria-label="Studio sections">
          {navItems.map(({ label, icon: Icon, badge }) => (
            <button key={label} className={`nav-item${activePage === label ? ' active' : ''}`} onClick={() => onNavigate(label)}>
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {badge && <small>{badge}</small>}
              {activePage === label && <i aria-hidden="true" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="core-pulse"><span className="status-dot" /> Vibe Core <em>standby</em></div>
          <div className="sidebar-version">Studio V1.0 / internal</div>
        </div>
      </aside>
    </>
  )
}

function Header({ page, onMenu }) {
  return (
    <header className="studio-header">
      <div className="header-title">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
        <div><span className="eyebrow">VIBE STUDIO / WORKSPACE</span><h1>{page}</h1></div>
      </div>
      <div className="header-tools">
        <span className="header-date">TUE / 16 SEP 2026</span>
        <span className="header-status"><span className="status-dot" /> SYSTEMS NOMINAL</span>
        {page === 'Signal Detail' ? <span className="profile-chip profile-metadata" aria-label="Account: JD">JD</span> : <button className="profile-chip" aria-label="Open account menu">JD</button>}
      </div>
    </header>
  )
}

function SectionLabel({ children, action }) {
  return <div className="section-label"><span>{children}</span>{action && <button className="text-action">{action}<ArrowUpRight size={13} /></button>}</div>
}

function useDashboardResource(url, parse) {
  const [resource, setResource] = useState({ status: 'loading', data: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = window.setTimeout(() => controller.abort(), 10000)

    fetchDashboardResource(url, controller.signal, parse)
      .then((data) => { if (active) setResource({ status: 'ready', data }) })
      .catch(() => { if (active) setResource({ status: 'error', data: null }) })
      .finally(() => window.clearTimeout(timeout))

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [url, parse])

  return resource
}

function Dashboard({ onOpenSignal }) {
  const dashboard = useDashboardResource('/api/dashboard', parseDashboard)
  const health = useDashboardResource('/api/health', parseHealth)
  const signal = dashboard.data?.top_signal
  const dashboardLoading = dashboard.status === 'loading'
  const dashboardMessage = dashboardLoading ? 'Loading…' : 'Unavailable'
  const healthLoading = health.status === 'loading'
  const coreHealthy = health.data?.coreHealthy === true
  const databaseHealthy = health.data?.databaseHealthy === true
  const healthMessage = healthLoading ? 'Checking…' : 'UNAVAILABLE'

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div><h2>Good morning, James.</h2><p>Here&apos;s what deserves your attention.</p></div>
        <div className="pulse-readout" aria-live="polite" aria-busy={dashboardLoading}>
          <Activity size={15} /><span>ACTIVE SIGNALS</span>
          {dashboard.data ? <b>{dashboard.data.active_signal_count}</b> : <span>{dashboardMessage}</span>}
          <small>in the field</small>
        </div>
      </section>
      <section className="signal-hero" aria-live="polite" aria-busy={dashboardLoading}>
        <div className="signal-hero-copy">
          <span className="eyebrow cyan-text">TOP SIGNAL / MOST VIABLE STORY</span>
          <h3>{signal?.headline ?? (dashboardLoading ? 'Loading top signal…' : dashboard.status === 'error' ? 'Top signal unavailable' : 'No top signal yet')}</h3>
          {signal ? <>
            {signal.source_name && <p>Lead source / {signal.source_name}</p>}
            <div className="signal-meta">
              {signal.category && <span className="meta-category">Category / {signal.category}</span>}
              <span>Viability / {signal.viability_score}%</span>
              <span>Sources / {signal.source_count}</span>
              {signal.story_type && <span>Story type / {signal.story_type}</span>}
            </div>
            <div className="signal-badges">
              {signal.lifecycle_state && <span>{signal.lifecycle_state}</span>}
              {signal.cluster_state && signal.cluster_state !== signal.lifecycle_state && <span>{signal.cluster_state}</span>}
            </div>
          </> : <p>{dashboardLoading ? 'Checking the signal field.' : dashboard.status === 'error' ? 'We couldn’t load signals. Please try again later.' : 'There is no top signal to show right now.'}</p>}
        </div>
        <div className="signal-score">
          <span>{signal?.viability_score ?? '—'}</span><small>VIABILITY</small>
          <div className="score-line"><i style={{ width: signal ? `${signal.viability_score}%` : '0%' }} /></div>
          <button className="outline-button" disabled={!signal?.signal_id} onClick={() => onOpenSignal(signal.signal_id)}>Open signal <ChevronRight size={14} /></button>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel category-panel" aria-live="polite" aria-busy={dashboardLoading}>
          <SectionLabel action="View all">CATEGORY SIGNALS</SectionLabel>
          {categorySignals.map(({ name, color, Icon }) => <div className="category-line" key={name}>
            <Icon className={`category-icon ${color}`} size={20} strokeWidth={1.35} aria-hidden="true" /><span>{name}</span>
            <small>{dashboard.data ? `${dashboard.data.category_signal_counts[name]} signals` : dashboardMessage}</small><ChevronRight size={16} />
          </div>)}
        </section>
        <section className="panel"><SectionLabel action="Open desk">NEWS DESK STATUS</SectionLabel><div className="desk-stat"><span className="desk-number">04</span><div><b>Stories in motion</b><p>Across the editorial workflow</p></div></div><div className="mini-pipeline"><span style={{ '--width': '48%' }}>Signal <b>04</b></span><span style={{ '--width': '30%' }}>Developing <b>—</b></span><span style={{ '--width': '18%' }}>Draft <b>—</b></span><span style={{ '--width': '8%' }}>Ready <b>—</b></span><span style={{ '--width': '3%' }}>Published <b>—</b></span></div></section>
      </div>
      <div className="dashboard-grid bottom-grid">
        <section className="panel core-panel" aria-live="polite" aria-busy={healthLoading}>
          <SectionLabel>SYSTEM / CORE STATUS</SectionLabel>
          <div className="core-status"><div className="core-status-icon"><Boxes size={22} /></div><div>
            <b>{healthLoading ? 'Checking Core…' : coreHealthy && databaseHealthy ? 'Core healthy' : 'Core health unavailable'}</b>
            <p>{healthLoading ? 'Checking the API and database connection.' : health.status === 'error' ? 'We couldn’t check Core health. Please try again later.' : coreHealthy && databaseHealthy ? 'Core API and database are healthy.' : 'Core or database is not reporting healthy. Please try again later.'}</p>
          </div></div>
          <div className="status-rule"><span>Studio interface</span><b>ONLINE</b></div>
          <div className="status-rule"><span>Vibe Core / API</span><b className={coreHealthy ? undefined : 'muted-status'}>{coreHealthy ? 'HEALTHY' : healthMessage}</b></div>
          <div className="status-rule"><span>Database</span><b className={databaseHealthy ? undefined : 'muted-status'}>{databaseHealthy ? 'HEALTHY' : healthMessage}</b></div>
        </section>
        <section className="panel"><SectionLabel action="See activity">RECENT ACTIVITY</SectionLabel><div className="activity-list">{activity.map(([title, copy, time]) => <div className="activity-item" key={title}><span className="activity-icon"><CircleDot size={13} /></span><div><b>{title}</b><p>{copy}</p></div><time>{time}</time></div>)}</div></section>
      </div>
    </div>
  )
}

function displayCategory(category) {
  if (category === 'Gaming') return 'Games'
  if (category === 'Technology') return 'Tech'
  return category || 'Unresolved'
}

function Discover({ onOpenSignal }) {
  const [signals, setSignals] = useState({ status: 'loading', data: [] })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = window.setTimeout(() => controller.abort(), 10000)

    fetchSignals(controller.signal, 24)
      .then((data) => { if (active) setSignals({ status: 'ready', data }) })
      .catch(() => { if (active) setSignals({ status: 'error', data: [] }) })
      .finally(() => window.clearTimeout(timeout))

    return () => {
      active = false
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  const featured = signals.data[0] ?? null
  const feed = signals.data.slice(1)
  const loading = signals.status === 'loading'
  const categoryCounts = Object.fromEntries(categorySignals.map(({ name }) => [name, 0]))

  for (const signal of signals.data) {
    const category = displayCategory(signal.category)
    if (category in categoryCounts) categoryCounts[category] += 1
  }

  return (
    <div className="page-stack">
      <section className="intro-block">
        <span className="eyebrow cyan-text">SIGNAL FIELD / LIVE VIEW</span>
        <h2>Discover what&apos;s moving.</h2>
        <p>Live signals from Vibe Core, ranked for editorial review and ready to inspect.</p>
      </section>

      <section className="discover-feature-grid" aria-live="polite" aria-busy={loading}>
        <div className="feature-placeholder discover-feature-live">
          <Sparkles size={22} />
          <span>FEATURED SIGNAL</span>
          <b>{featured?.headline ?? (loading ? 'Loading featured signal…' : signals.status === 'error' ? 'Signal field unavailable' : 'No active signals')}</b>
          {featured ? <>
            <p>{featured.lead.source_name ? `Lead source / ${featured.lead.source_name}` : 'Lead source unavailable'}</p>
            <div className="discover-feature-meta">
              <span>{displayCategory(featured.category)}</span>
              <span>{featured.viability_score ?? '—'} viability</span>
              <span>{featured.source_count ?? '—'} sources</span>
            </div>
            <button className="outline-button" onClick={() => onOpenSignal(featured.signal_id)}>Open signal <ChevronRight size={14} /></button>
          </> : <p>{signals.status === 'error' ? 'We couldn’t load signals from Core. Try again after checking the local API.' : 'Checking the signal field.'}</p>}
        </div>

        <div className="feature-placeholder alt discover-future">
          <Compass size={22} />
          <span>DAILY DIGEST / FUTURE</span>
          <b>A concise read on the field</b>
          <p>Compass-powered daily digests will group the day&apos;s most meaningful movement here.</p>
        </div>
      </section>

      <section className="panel discover-feed" aria-live="polite" aria-busy={loading}>
        <SectionLabel>LIVE SIGNALS</SectionLabel>
        {loading && <p className="discover-state">Loading signals from Core…</p>}
        {signals.status === 'error' && <p className="discover-state">Signal feed unavailable. Check the local Core API and refresh.</p>}
        {signals.status === 'ready' && signals.data.length === 0 && <p className="discover-state">No active signals are available right now.</p>}
        {feed.map((signal) => (
          <button className="discover-signal-row" key={signal.signal_id} onClick={() => onOpenSignal(signal.signal_id)}>
            <span className="discover-signal-copy">
              <small>{displayCategory(signal.category)}{signal.story_type ? ` / ${signal.story_type}` : ''}</small>
              <b>{signal.headline}</b>
              <span>{signal.lead.source_name ? `Lead / ${signal.lead.source_name}` : 'Lead source unavailable'} · {signal.source_count ?? '—'} sources</span>
            </span>
            <span className="discover-row-score"><b>{signal.viability_score ?? '—'}</b><small>VIABILITY</small></span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        ))}
      </section>

      <section className="panel">
        <SectionLabel>CATEGORY SNAPSHOT</SectionLabel>
        <div className="discover-rows">
          {categorySignals.map((item) => (
            <div key={item.name}>
              <span className={`category-bar ${item.color}`} />
              <b>{item.name}</b>
              <small>{signals.status === 'ready' ? `${categoryCounts[item.name]} in current feed` : loading ? 'Loading…' : 'Unavailable'}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel empty-panel discover-future">
        <FolderOpen size={22} />
        <div><SectionLabel>COLLECTIONS / FUTURE</SectionLabel><p>Saved editorial collections will live here once collection tools are connected.</p></div>
      </section>
    </div>
  )
}

function NewsDesk() {
  const stages = ['Signal', 'Developing', 'Draft', 'Ready', 'Published']
  return <div className="page-stack"><section className="intro-block"><span className="eyebrow magenta-text">EDITORIAL PIPELINE / V1</span><h2>Move the right stories forward.</h2><p>The News Desk will be the working surface for turning signals into clear, publishable stories.</p></section><section className="workflow" aria-label="News Desk workflow">{stages.map((stage, index) => <div className={`workflow-stage${index === 0 ? ' current' : ''}`} key={stage}><div className="stage-head"><span>0{index + 1}</span><b>{stage}</b><small>{index === 0 ? '04' : '—'}</small></div><div className="stage-body">{index === 0 ? <><CircleDot size={18} /><p>Incoming signals will wait here for editorial triage.</p></> : <><SlidersHorizontal size={17} /><p>Placeholder workspace for {stage.toLowerCase()} stories.</p></>}</div></div>)}</section></div>
}

function EmptyPage({ page, icon: Icon, label, copy, action }) {
  return <div className="page-stack empty-page"><section className="intro-block"><span className="eyebrow purple-text">STUDIO MODULE / V1</span><h2>{page}</h2><p>{copy}</p></section><section className="empty-module"><div className="empty-module-icon"><Icon size={28} /></div><span className="eyebrow">{label}</span><h3>This workspace is ready for its next layer.</h3><p>Structure is in place so real {page.toLowerCase()} data can slot in later without changing the Studio shell.</p>{action && <button className="outline-button">{action} <ArrowUpRight size={14} /></button>}</section></div>
}

function StudioPage({ page, onOpenSignal }) {
  if (page === 'Dashboard') return <Dashboard onOpenSignal={onOpenSignal} />
  if (page === 'Discover') return <Discover onOpenSignal={onOpenSignal} />
  if (page === 'News Desk') return <NewsDesk />
  if (page === 'Create') return <EmptyPage page="Create" icon={FilePlus2} label="COMPOSER ENTRY POINT" copy="The Composer will be the place to shape signals into editorial work, with a clear path from first note to final story." action="Open Composer" />
  const moduleData = { Sources: [Radio, 'SOURCE LIBRARY', 'A future home for feeds, publications, and the trusted inputs behind the signal field.'], Audience: [Users, 'AUDIENCE INTELLIGENCE', 'A future home for reader patterns, feedback, and the people we are making this for.'], Distribution: [BarChart3, 'PUBLICATION CONTROL', 'A future home for channels, schedules, and the final handoff to Publications.'], System: [Settings2, 'SYSTEM CONFIGURATION', 'A future home for Studio preferences, permissions, and the health of connected services.'] }
  const [Icon, label, copy] = moduleData[page]
  return <EmptyPage page={page} icon={Icon} label={label} copy={copy} />
}

function routeFromPath() {
  const match = window.location.pathname.match(/^\/studio\/signals\/([^/]+)\/?$/)
  if (match) {
    try { return { page: 'Signal Detail', signalId: decodeURIComponent(match[1]) } }
    catch { return { page: 'Signal Detail', signalId: match[1] } }
  }
  const slug = window.location.pathname.replace(/^\/studio\/?/, '').replace(/\/$/, '').replace(/-/g, ' ')
  return { page: navItems.find((item) => item.label.toLowerCase() === slug.toLowerCase())?.label || 'Dashboard' }
}

function StudioApp() {
  const [route, setRoute] = useState(routeFromPath)
  const [menuOpen, setMenuOpen] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    const onPopState = () => { setRoute(routeFromPath()); setMenuOpen(false) }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    contentRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [route])

  function navigateTo(path) {
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
    setRoute(routeFromPath())
    setMenuOpen(false)
  }
  function navigate(page) { navigateTo(`/studio/${page.toLowerCase().replace(/ /g, '-')}`) }
  function openSignal(signalId) { navigateTo(`/studio/signals/${encodeURIComponent(signalId)}`) }

  return <div className="studio-app"><Sidebar activePage={route.page === 'Signal Detail' ? 'Dashboard' : route.page} onNavigate={navigate} open={menuOpen} onClose={() => setMenuOpen(false)} /><div className="studio-main"><Header page={route.page} onMenu={() => setMenuOpen(true)} /><main className="studio-content" ref={contentRef} tabIndex={-1} aria-label={route.page}>
    {route.page === 'Signal Detail'
      ? <SignalDetail key={route.signalId} signalId={route.signalId} onBack={() => navigate('Dashboard')} />
      : <StudioPage page={route.page} onOpenSignal={openSignal} />}
  </main><footer className="studio-footer"><span>VIBE STUDIO / INTERNAL CONTROL SURFACE</span><span>PUBLIC SITE <a href="/">THEGEEK.GUIDE <ArrowUpRight size={12} /></a></span></footer></div></div>
}

export default StudioApp
