import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  ArrowLeft,
  ChevronRight,
  Circle,
  Command,
  Compass,
  FilePlus2,
  FolderKanban,
  Home,
  LibraryBig,
  LogOut,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import './Studio.css'
import { fetchSignals } from './dashboardApi'
import {
  APP_DEFINITIONS,
  COMMANDS,
  commandMatches,
  greetingForDate,
  searchItems,
  wisdomForDate,
} from './homeModel'

const WORK_PREVIEW = [
  {
    id: 'iphone-security',
    title: 'The Geek Guide to iPhone Security',
    type: 'Guide',
    state: 'Idea',
    updated: 'Today',
  },
  {
    id: 'weekend-watchlist',
    title: 'Weekend Watchlist',
    type: 'Collection',
    state: 'Draft',
    updated: 'Recently',
  },
  {
    id: 'apple-brief',
    title: 'Apple Event Brief',
    type: 'News Brief',
    state: 'Reviewing',
    updated: 'Recently',
  },
]

const CREATE_TYPES = [
  { label: 'News Brief', detail: 'Turn a Signal into a concise story.' },
  { label: 'Guide', detail: 'Build a structured evergreen guide.' },
  { label: 'Review', detail: 'Start a TV, movie, or product review.' },
  { label: 'Explainer', detail: 'Make something complex easier to understand.' },
]

function displayCategory(category) {
  if (category === 'Gaming') return 'Games'
  if (category === 'Technology') return 'Tech'
  return category || 'Unresolved'
}

function StudioMark() {
  return <span className="os-mark" aria-hidden="true">V</span>
}

function WidgetHeader({ title, Icon, actionLabel, onAction }) {
  return (
    <div className="widget-header">
      <span className="widget-title">
        {Icon && <Icon size={18} strokeWidth={1.7} aria-hidden="true" />}
        {title}
      </span>
      {onAction && (
        <button type="button" onClick={onAction} aria-label={actionLabel ?? `Open ${title}`}>
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>
      )}
    </div>
  )
}

function SignalWidget({ signals, status, onOpen }) {
  const visible = signals.slice(0, 5)
  const lead = visible[0]
  const rest = visible.slice(1)

  return (
    <section className="home-widget signal-widget">
      <WidgetHeader
        title="Signal"
        Icon={Compass}
        actionLabel="Open Signal"
        onAction={() => onOpen('signal')}
      />

      <div className="signal-widget-body" aria-live="polite">
        {status === 'loading' && <p className="widget-state">Checking the field…</p>}
        {status === 'error' && <p className="widget-state">Signal is unavailable right now.</p>}
        {status === 'ready' && visible.length === 0 && <p className="widget-state">Nothing active right now.</p>}

        {lead && (
          <button type="button" className="signal-lead-card" onClick={() => onOpen('signal')}>
            <span className={`rank-pill rank-${lead.rank_tier?.toLowerCase() ?? 'x'}`}>
              {lead.rank_tier ?? '—'}
            </span>
            <span className="signal-lead-copy">
              <small>{displayCategory(lead.category)} · {lead.source_count ?? '—'} sources</small>
              <b>{lead.headline}</b>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        )}

        {rest.length > 0 && (
          <div className="signal-mini-grid">
            {rest.map((signal, index) => (
              <button
                type="button"
                className="signal-mini-card"
                key={signal.signal_id}
                onClick={() => onOpen('signal')}
              >
                <span className="signal-mini-number">{index + 2}</span>
                <span className="signal-mini-copy">
                  <b>{signal.headline}</b>
                  <small>{displayCategory(signal.category)}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function WorkWidget({ onOpen }) {
  return (
    <section className="home-widget work-widget">
      <WidgetHeader
        title="In progress"
        Icon={FolderKanban}
        actionLabel="Open Desk"
        onAction={() => onOpen('desk')}
      />

      <div className="work-card-grid">
        {WORK_PREVIEW.map((item) => (
          <button type="button" className="work-card" key={item.id} onClick={() => onOpen('desk')}>
            <span>
              <small>{item.type} · {item.state}</small>
              <b>{item.title}</b>
            </span>
            <em>{item.updated}</em>
          </button>
        ))}
      </div>
    </section>
  )
}

function CreateWidget({ onOpen }) {
  return (
    <button
      type="button"
      className="home-create-square"
      onClick={() => onOpen('create')}
      aria-label="Create something"
    >
      <span className="home-create-icon"><Plus size={30} strokeWidth={1.8} /></span>
      <span className="home-create-copy">
        <small>New</small>
        <b>Create</b>
      </span>
    </button>
  )
}

function HomeView({ signals, signalStatus, onOpen }) {
  const now = new Date()

  return (
    <div className="home-view">
      <section className="home-hero">
        <div className="home-intro">
          <h1>{greetingForDate(now)}, James.</h1>
          <p className="daily-wisdom">“{wisdomForDate(now)}”</p>
        </div>

        <CreateWidget onOpen={onOpen} />
      </section>

      <div className="widget-board">
        <SignalWidget signals={signals} status={signalStatus} onOpen={onOpen} />
        <WorkWidget onOpen={onOpen} />
      </div>
    </div>
  )
}

function SignalView({ signals, status, onBack }) {
  return (
    <div className="app-view">
      <div className="app-view-heading">
        <button type="button" className="back-button" onClick={onBack}>
          <ArrowLeft size={17} /> Home
        </button>
        <span className="app-kicker">Signal</span>
        <h1>What’s moving.</h1>
        <p>The live field, ranked for attention.</p>
      </div>

      <section className="app-panel">
        {status === 'loading' && <p className="widget-state">Loading Signals…</p>}
        {status === 'error' && <p className="widget-state">Signal is unavailable right now.</p>}
        {signals.map((signal, index) => (
          <article className="full-signal-row" key={signal.signal_id}>
            <span className="signal-number">{index + 1}</span>
            <span className={`rank-pill rank-${signal.rank_tier?.toLowerCase() ?? 'x'}`}>
              {signal.rank_tier ?? '—'}
            </span>
            <div>
              <small>{displayCategory(signal.category)} · {signal.source_count ?? '—'} sources</small>
              <b>{signal.headline}</b>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function CreateView({ onBack }) {
  return (
    <div className="app-view">
      <div className="app-view-heading">
        <button type="button" className="back-button" onClick={onBack}>
          <ArrowLeft size={17} /> Home
        </button>
        <span className="app-kicker">Create</span>
        <h1>What are we making?</h1>
        <p>Choose a starting shape. The guided flow comes next.</p>
      </div>

      <div className="create-type-grid">
        {CREATE_TYPES.map((type) => (
          <button type="button" className="create-type-card" key={type.label}>
            <Sparkles size={18} />
            <b>{type.label}</b>
            <span>{type.detail}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}

function DeskView({ onBack }) {
  return (
    <div className="app-view">
      <div className="app-view-heading">
        <button type="button" className="back-button" onClick={onBack}>
          <ArrowLeft size={17} /> Home
        </button>
        <span className="app-kicker">Desk</span>
        <h1>Work in motion.</h1>
        <p>Ideas, drafts, reviews, and ready-to-publish work will live here.</p>
      </div>

      <section className="app-panel">
        {WORK_PREVIEW.map((item) => (
          <article className="desk-row" key={item.id}>
            <div>
              <small>{item.type} · {item.state}</small>
              <b>{item.title}</b>
            </div>
            <span>{item.updated}</span>
          </article>
        ))}
      </section>
    </div>
  )
}

function LibraryView({ onBack }) {
  return (
    <div className="app-view">
      <div className="app-view-heading">
        <button type="button" className="back-button" onClick={onBack}>
          <ArrowLeft size={17} /> Home
        </button>
        <span className="app-kicker">Library</span>
        <h1>Your archive, without the attic dust.</h1>
        <p>Published work, guides, reviews, explainers, collections, and reusable assets.</p>
      </div>

      <section className="library-empty app-panel">
        <Archive size={26} />
        <b>Library wiring comes after the Home shell.</b>
        <span>The navigation and space are here so we can feel the OS before filling every drawer.</span>
      </section>
    </div>
  )
}

function SearchOverlay({ open, onClose, signals, onNavigate }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const commands = useMemo(() => commandMatches(query), [query])
  const results = useMemo(
    () => searchItems(query, signals, WORK_PREVIEW),
    [query, signals],
  )

  if (!open) return null

  function handleCommand(command) {
    onNavigate(command.action)
    onClose()
  }

  return (
    <div className="spotlight-layer" role="dialog" aria-modal="true" aria-label="Search Vibe">
      <button type="button" className="spotlight-scrim" onClick={onClose} aria-label="Close search" />

      <section className="spotlight">
        <div className="spotlight-input-wrap">
          <Search size={18} strokeWidth={1.8} />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Vibe or run a command"
            autoComplete="off"
            spellCheck="false"
          />
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {query.startsWith('/') && (
          <div className="spotlight-section">
            <span className="spotlight-label">Commands</span>
            {(commands.length ? commands : COMMANDS).map((command) => (
              <button type="button" key={command.command} onClick={() => handleCommand(command)}>
                <Command size={16} />
                <span><b>{command.command}</b><small>{command.label}</small></span>
              </button>
            ))}
          </div>
        )}

        {query && !query.startsWith('/') && (
          <>
            {results.signals.length > 0 && (
              <div className="spotlight-section">
                <span className="spotlight-label">Signals</span>
                {results.signals.map((signal) => (
                  <button type="button" key={signal.signal_id} onClick={() => handleCommand({ action: 'signal' })}>
                    <Compass size={16} />
                    <span><b>{signal.headline}</b><small>{displayCategory(signal.category)}</small></span>
                  </button>
                ))}
              </div>
            )}

            {results.work.length > 0 && (
              <div className="spotlight-section">
                <span className="spotlight-label">Work</span>
                {results.work.map((item) => (
                  <button type="button" key={item.id} onClick={() => handleCommand({ action: 'desk' })}>
                    <FolderKanban size={16} />
                    <span><b>{item.title}</b><small>{item.type} · {item.state}</small></span>
                  </button>
                ))}
              </div>
            )}

            {results.signals.length === 0 && results.work.length === 0 && (
              <div className="spotlight-empty">No matches yet.</div>
            )}
          </>
        )}

        <div className="spotlight-footer">
          <span>⌘K</span>
          <span>Type / for commands</span>
        </div>
      </section>
    </div>
  )
}

function VibeMenu({ open, activeApp, onClose, onNavigate, onSearch }) {
  if (!open) return null

  const menuApps = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'signal', label: 'Signal', Icon: Compass },
    { id: 'create', label: 'Create', Icon: FilePlus2 },
    { id: 'desk', label: 'Desk', Icon: FolderKanban },
    { id: 'library', label: 'Library', Icon: LibraryBig },
  ]

  function go(target) {
    onNavigate(target)
    onClose()
  }

  return (
    <div className="vibe-menu-popover" role="menu" aria-label="Vibe navigation">
      <span className="menu-section-label">Navigate</span>

      {menuApps.map(({ id, label, Icon }) => (
        <button
          type="button"
          key={id}
          className={activeApp === id ? 'is-active' : ''}
          onClick={() => go(id)}
          role="menuitem"
          aria-current={activeApp === id ? 'page' : undefined}
        >
          <Icon size={20} strokeWidth={1.7} />
          <span>{label}</span>
          {activeApp === id && <Circle size={7} fill="currentColor" aria-hidden="true" />}
        </button>
      ))}

      <div className="menu-separator" />

      <button
        type="button"
        onClick={() => {
          onSearch()
          onClose()
        }}
        role="menuitem"
      >
        <Search size={20} strokeWidth={1.7} />
        <span>Search / Command</span>
      </button>

      <div className="vibe-menu-status">
        <Circle size={8} fill="currentColor" />
        <span>Systems normal</span>
      </div>

      <form method="post" action="/studio/logout">
        <button type="submit" role="menuitem">
          <LogOut size={20} strokeWidth={1.7} />
          <span>Sign out</span>
        </button>
      </form>
    </div>
  )
}

function StudioApp() {
  const [activeApp, setActiveApp] = useState('home')
  const [signals, setSignals] = useState({ status: 'loading', data: [] })
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchSignals(controller.signal, 20)
      .then((data) => {
        if (active) setSignals({ status: 'ready', data })
      })
      .catch(() => {
        if (active) setSignals({ status: 'error', data: [] })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    function handleKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((value) => !value)
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMenuOpen(false)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function navigate(target) {
    setActiveApp(target === 'settings' ? 'home' : target)
  }

  const currentApp = APP_DEFINITIONS.find((item) => item.id === activeApp)
  const screenLabel = activeApp === 'home' ? 'Home' : currentApp?.label ?? 'Studio'

  const contextAction = activeApp === 'create'
    ? { label: 'Drafts', action: () => navigate('desk') }
    : activeApp === 'desk'
      ? { label: 'New', action: () => navigate('create') }
      : activeApp === 'signal'
        ? { label: 'Create', action: () => navigate('create') }
        : null

  return (
    <div className="vibe-os">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="os-topbar">
        <div className="vibe-menu-anchor">
          <button
            type="button"
            className={`vibe-button${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Open Vibe navigation"
            aria-expanded={menuOpen}
          >
            <StudioMark />
          </button>

          <VibeMenu
            open={menuOpen}
            activeApp={activeApp}
            onClose={() => setMenuOpen(false)}
            onNavigate={navigate}
            onSearch={() => setSearchOpen(true)}
          />
        </div>

        <div className="topbar-title" aria-label={`The Geek Guide, ${screenLabel}`}>
          <span>THE GEEK GUIDE</span>
          <b>{screenLabel}</b>
        </div>

        <div className="topbar-actions">
          {contextAction && (
            <button
              type="button"
              className="context-button"
              onClick={contextAction.action}
            >
              {contextAction.label}
            </button>
          )}

          <button
            type="button"
            className="search-button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search Vibe"
          >
            <Search size={20} strokeWidth={1.8} />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
        </div>
      </header>

      <main className="os-content">
        {activeApp === 'home' && (
          <HomeView
            signals={signals.data}
            signalStatus={signals.status}
            onOpen={navigate}
          />
        )}
        {activeApp === 'signal' && (
          <SignalView
            signals={signals.data}
            status={signals.status}
            onBack={() => navigate('home')}
          />
        )}
        {activeApp === 'create' && <CreateView onBack={() => navigate('home')} />}
        {activeApp === 'desk' && <DeskView onBack={() => navigate('home')} />}
        {activeApp === 'library' && <LibraryView onBack={() => navigate('home')} />}
      </main>

      {currentApp && activeApp !== 'home' && (
        <span className="current-app-announcement" aria-live="polite">
          {currentApp.label}
        </span>
      )}

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        signals={signals.data}
        onNavigate={navigate}
      />
    </div>
  )
}

export default StudioApp
