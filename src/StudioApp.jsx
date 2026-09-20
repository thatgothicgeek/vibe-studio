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
  Menu,
  Plus,
  Search,
  Settings2,
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

const appIcon = {
  signal: Compass,
  create: FilePlus2,
  desk: FolderKanban,
  library: LibraryBig,
}

function displayCategory(category) {
  if (category === 'Gaming') return 'Games'
  if (category === 'Technology') return 'Tech'
  return category || 'Unresolved'
}

function StudioMark() {
  return <span className="os-mark" aria-hidden="true">V</span>
}

function ShellButton({ active, label, Icon, onClick }) {
  return (
    <button
      type="button"
      className={`dock-app${active ? ' is-active' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      <span className="dock-icon"><Icon size={20} strokeWidth={1.7} /></span>
      <span>{label}</span>
    </button>
  )
}

function WidgetHeader({ title, action, onAction }) {
  return (
    <div className="widget-header">
      <span>{title}</span>
      {action && (
        <button type="button" onClick={onAction}>
          {action} <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

function SignalWidget({ signals, status, onOpen }) {
  const visible = signals.slice(0, 5)

  return (
    <section className="home-widget signal-widget">
      <WidgetHeader title="Signal" action="Open" onAction={() => onOpen('signal')} />

      <div className="signal-list" aria-live="polite">
        {status === 'loading' && <p className="widget-state">Checking the field…</p>}
        {status === 'error' && <p className="widget-state">Signal is unavailable right now.</p>}
        {status === 'ready' && visible.length === 0 && <p className="widget-state">Nothing active right now.</p>}

        {visible.map((signal, index) => (
          <button
            type="button"
            className="signal-item"
            key={signal.signal_id}
            onClick={() => onOpen('signal')}
          >
            <span className="signal-number">{index + 1}</span>
            <span className={`rank-pill rank-${signal.rank_tier?.toLowerCase() ?? 'x'}`}>
              {signal.rank_tier ?? '—'}
            </span>
            <span className="signal-copy">
              <b>{signal.headline}</b>
              <small>
                {displayCategory(signal.category)}
                {signal.source_count != null ? ` · ${signal.source_count} sources` : ''}
              </small>
            </span>
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        ))}
      </div>

      {signals.length > 3 && (
        <button type="button" className="mobile-widget-more" onClick={() => onOpen('signal')}>
          See all {Math.min(signals.length, 5)}
        </button>
      )}
    </section>
  )
}

function WorkWidget({ onOpen }) {
  return (
    <section className="home-widget work-widget">
      <WidgetHeader title="Works in progress" action="Desk" onAction={() => onOpen('desk')} />

      <div className="work-list">
        {WORK_PREVIEW.map((item) => (
          <button type="button" className="work-item" key={item.id} onClick={() => onOpen('desk')}>
            <span className="work-copy">
              <b>{item.title}</b>
              <small>{item.type} · {item.state}</small>
            </span>
            <span className="work-updated">{item.updated}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function CreateWidget({ onOpen }) {
  return (
    <section className="home-widget create-widget">
      <WidgetHeader title="Create" />
      <button type="button" className="create-launch" onClick={() => onOpen('create')}>
        <span className="create-plus"><Plus size={24} strokeWidth={1.7} /></span>
        <span>
          <b>Create something</b>
          <small>Start with an idea, Signal, guide, review, or brief.</small>
        </span>
        <ChevronRight size={18} />
      </button>
    </section>
  )
}

function HomeView({ signals, signalStatus, onOpen }) {
  const now = new Date()

  return (
    <div className="home-view">
      <section className="home-intro">
        <span className="home-kicker">Home</span>
        <div className="home-intro-copy">
          <h1>{greetingForDate(now)}, James.</h1>
          <p className="daily-wisdom">“{wisdomForDate(now)}”</p>
        </div>
      </section>

      <div className="home-grid">
        <SignalWidget signals={signals} status={signalStatus} onOpen={onOpen} />
        <WorkWidget onOpen={onOpen} />
        <CreateWidget onOpen={onOpen} />
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

        {!query && (
          <div className="spotlight-idle">
            <span>Search across Vibe.</span>
            <small>Type / for commands.</small>
          </div>
        )}

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

function VibeMenu({ open, onClose, onHome }) {
  if (!open) return null

  return (
    <div className="vibe-menu-popover">
      <button type="button" onClick={() => { onHome(); onClose() }}>
        <Home size={16} /> Home
      </button>
      <button type="button">
        <Settings2 size={16} /> Settings
      </button>
      <div className="vibe-menu-status"><Circle size={7} fill="currentColor" /> Systems normal</div>
      <form method="post" action="/studio/logout">
        <button type="submit"><LogOut size={16} /> Sign out</button>
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
            aria-label="Open Vibe menu"
          >
            <StudioMark />
          </button>
          <VibeMenu
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            onHome={() => navigate('home')}
          />
        </div>

        <span className="workspace-name">THE GEEK GUIDE</span>

        <button type="button" className="search-button" onClick={() => setSearchOpen(true)}>
          <Search size={18} />
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
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

      <nav className="os-dock" aria-label="Vibe apps">
        {APP_DEFINITIONS.map((app) => {
          const Icon = appIcon[app.id]
          return (
            <ShellButton
              key={app.id}
              active={activeApp === app.id}
              label={app.label}
              Icon={Icon}
              onClick={() => navigate(app.id)}
            />
          )
        })}
      </nav>

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
