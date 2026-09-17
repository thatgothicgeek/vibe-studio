import { useEffect, useState } from 'react'
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
        <button className="profile-chip" aria-label="Open account menu">JD</button>
      </div>
    </header>
  )
}

function SectionLabel({ children, action }) {
  return <div className="section-label"><span>{children}</span>{action && <button className="text-action">{action}<ArrowUpRight size={13} /></button>}</div>
}

function Dashboard() {
  return (
    <div className="page-stack">
      <section className="welcome-row"><div><h2>Good morning, James.</h2><p>The signal field is quiet. Here&apos;s what deserves your attention.</p></div><div className="pulse-readout"><Activity size={15} /><span>ACTIVE SIGNALS</span><b>31</b><small>in the field</small></div></section>
      <section className="signal-hero">
        <div className="signal-hero-copy"><span className="eyebrow cyan-text">TOP SIGNAL / MOST VIABLE STORY</span><h3>The shape of what comes next</h3><p>A placeholder editorial brief for the strongest emerging signal in the field. This region will become the Studio&apos;s highest-confidence story recommendation.</p><div className="signal-meta"><span className="meta-category">Category / TV</span><span>Viability / 87%</span><span>Sources / 14</span><span>Captured / 12 min ago</span><span>Updated / just now</span></div><div className="signal-badges"><span>EMERGING</span><span>EDITORIAL REVIEW</span></div></div>
        <div className="signal-score"><span>87</span><small>VIABILITY</small><div className="score-line"><i /></div><button className="outline-button">Open signal <ChevronRight size={14} /></button></div>
      </section>
      <div className="dashboard-grid">
        <section className="panel category-panel"><SectionLabel action="View all">CATEGORY SIGNALS</SectionLabel>{categorySignals.map(({ name, count, color, Icon }) => <div className="category-line" key={name}><Icon className={`category-icon ${color}`} size={20} strokeWidth={1.35} aria-hidden="true" /><span>{name}</span><small>{count}</small><ChevronRight size={16} /></div>)}</section>
        <section className="panel"><SectionLabel action="Open desk">NEWS DESK STATUS</SectionLabel><div className="desk-stat"><span className="desk-number">04</span><div><b>Stories in motion</b><p>Across the editorial workflow</p></div></div><div className="mini-pipeline"><span style={{ '--width': '48%' }}>Signal <b>04</b></span><span style={{ '--width': '30%' }}>Developing <b>—</b></span><span style={{ '--width': '18%' }}>Draft <b>—</b></span><span style={{ '--width': '8%' }}>Ready <b>—</b></span><span style={{ '--width': '3%' }}>Published <b>—</b></span></div></section>
      </div>
      <div className="dashboard-grid bottom-grid">
        <section className="panel core-panel"><SectionLabel>SYSTEM / CORE STATUS</SectionLabel><div className="core-status"><div className="core-status-icon"><Boxes size={22} /></div><div><b>Framework ready</b><p>Studio shell is online. Core connection will appear here in a future phase.</p></div></div><div className="status-rule"><span>Studio interface</span><b>ONLINE</b></div><div className="status-rule"><span>Vibe Core connection</span><b className="muted-status">NOT CONNECTED</b></div></section>
        <section className="panel"><SectionLabel action="See activity">RECENT ACTIVITY</SectionLabel><div className="activity-list">{activity.map(([title, copy, time]) => <div className="activity-item" key={title}><span className="activity-icon"><CircleDot size={13} /></span><div><b>{title}</b><p>{copy}</p></div><time>{time}</time></div>)}</div></section>
      </div>
    </div>
  )
}

function Discover() {
  return <div className="page-stack"><section className="intro-block"><span className="eyebrow cyan-text">SIGNAL FIELD / CURATED VIEW</span><h2>Discover what&apos;s moving.</h2><p>A future-facing layout for incoming signals, editorial digests, and the collections that give them context.</p></section><section className="discover-feature-grid"><div className="feature-placeholder"><Sparkles size={22} /><span>FEATURED SIGNAL</span><b>Signal cards will surface here</b><p>High-potential stories with context, velocity, and editorial notes.</p></div><div className="feature-placeholder alt"><Compass size={22} /><span>DAILY DIGEST</span><b>A concise read on the field</b><p>Digest sections will group the day&apos;s most meaningful movement.</p></div></section><section className="panel"><SectionLabel action="Manage categories">CATEGORY ROWS</SectionLabel><div className="discover-rows">{categorySignals.map((item) => <div key={item.name}><span className={`category-bar ${item.color}`} /><b>{item.name}</b><small>{item.count}</small><ChevronRight size={14} /></div>)}</div></section><section className="panel empty-panel"><FolderOpen size={22} /><div><SectionLabel>COLLECTIONS</SectionLabel><p>Saved editorial collections will live here.</p></div><button className="outline-button">New collection <ArrowUpRight size={14} /></button></section></div>
}

function NewsDesk() {
  const stages = ['Signal', 'Developing', 'Draft', 'Ready', 'Published']
  return <div className="page-stack"><section className="intro-block"><span className="eyebrow magenta-text">EDITORIAL PIPELINE / V1</span><h2>Move the right stories forward.</h2><p>The News Desk will be the working surface for turning signals into clear, publishable stories.</p></section><section className="workflow" aria-label="News Desk workflow">{stages.map((stage, index) => <div className={`workflow-stage${index === 0 ? ' current' : ''}`} key={stage}><div className="stage-head"><span>0{index + 1}</span><b>{stage}</b><small>{index === 0 ? '04' : '—'}</small></div><div className="stage-body">{index === 0 ? <><CircleDot size={18} /><p>Incoming signals will wait here for editorial triage.</p></> : <><SlidersHorizontal size={17} /><p>Placeholder workspace for {stage.toLowerCase()} stories.</p></>}</div></div>)}</section></div>
}

function EmptyPage({ page, icon: Icon, label, copy, action }) {
  return <div className="page-stack empty-page"><section className="intro-block"><span className="eyebrow purple-text">STUDIO MODULE / V1</span><h2>{page}</h2><p>{copy}</p></section><section className="empty-module"><div className="empty-module-icon"><Icon size={28} /></div><span className="eyebrow">{label}</span><h3>This workspace is ready for its next layer.</h3><p>Structure is in place so real {page.toLowerCase()} data can slot in later without changing the Studio shell.</p>{action && <button className="outline-button">{action} <ArrowUpRight size={14} /></button>}</section></div>
}

function StudioPage({ page }) {
  if (page === 'Dashboard') return <Dashboard />
  if (page === 'Discover') return <Discover />
  if (page === 'News Desk') return <NewsDesk />
  if (page === 'Create') return <EmptyPage page="Create" icon={FilePlus2} label="COMPOSER ENTRY POINT" copy="The Composer will be the place to shape signals into editorial work, with a clear path from first note to final story." action="Open Composer" />
  const moduleData = { Sources: [Radio, 'SOURCE LIBRARY', 'A future home for feeds, publications, and the trusted inputs behind the signal field.'], Audience: [Users, 'AUDIENCE INTELLIGENCE', 'A future home for reader patterns, feedback, and the people we are making this for.'], Distribution: [BarChart3, 'PUBLICATION CONTROL', 'A future home for channels, schedules, and the final handoff to Publications.'], System: [Settings2, 'SYSTEM CONFIGURATION', 'A future home for Studio preferences, permissions, and the health of connected services.'] }
  const [Icon, label, copy] = moduleData[page]
  return <EmptyPage page={page} icon={Icon} label={label} copy={copy} />
}

function StudioApp() {
  const pageFromPath = () => { const slug = window.location.pathname.replace(/^\/studio\/?/, '').replace(/-/g, ' '); return navItems.find((item) => item.label.toLowerCase() === slug.toLowerCase())?.label || 'Dashboard' }
  const [activePage, setActivePage] = useState(pageFromPath)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { const onPopState = () => setActivePage(pageFromPath()); window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState) }, [])
  function navigate(page) { const slug = page.toLowerCase().replace(/ /g, '-'); window.history.pushState({}, '', `/studio/${slug}`); setActivePage(page); setMenuOpen(false) }

  return <div className="studio-app"><Sidebar activePage={activePage} onNavigate={navigate} open={menuOpen} onClose={() => setMenuOpen(false)} /><div className="studio-main"><Header page={activePage} onMenu={() => setMenuOpen(true)} /><main className="studio-content"><StudioPage page={activePage} /></main><footer className="studio-footer"><span>VIBE STUDIO / INTERNAL CONTROL SURFACE</span><span>PUBLIC SITE <a href="/">THEGEEK.GUIDE <ArrowUpRight size={12} /></a></span></footer></div></div>
}

export default StudioApp
