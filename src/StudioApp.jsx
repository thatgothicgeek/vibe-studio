import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Archive,
  ChevronRight,
  Command,
  Sparkles,
  X,
} from 'lucide-react'
import './Studio.css'
import {
  IconClock,
  IconComics,
  IconCompassProcess,
  IconCreate,
  IconDesk,
  IconEdit,
  IconBug,
  IconExternalLink,
  IconGames,
  IconHome,
  IconLibrary,
  IconLogout,
  IconMovie,
  IconRefresh,
  IconSearch,
  IconSend,
  IconSignal,
  IconStatus,
  IconTV,
  IconTech,
  IconYinYang,
} from './StudioIcons'
import {
  correctSignalCategory,
  fetchDashboard,
  fetchRefreshRequest,
  fetchSignal,
  fetchSignals,
  requestManualRefresh,
} from './dashboardApi'
import {
  APP_DEFINITIONS,
  COMMANDS,
  commandMatches,
  greetingForDate,
  searchItems,
  wisdomForDate,
} from './homeModel'

const CATEGORY_ORDER = ['TV', 'Movies', 'Comics', 'Games', 'Tech']
const DESK_SESSION_KEY = 'vibe-studio-desk-signals-v1'

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

function normalizeCategory(category) {
  if (category === 'Gaming') return 'Games'
  if (category === 'Technology') return 'Tech'
  return CATEGORY_ORDER.includes(category) ? category : 'Other'
}

function CategoryIcon({ category, size = 18 }) {
  const normalized = normalizeCategory(category)
  const props = { size, strokeWidth: 1.8 }

  if (normalized === 'TV') return <IconTV {...props} />
  if (normalized === 'Movies') return <IconMovie {...props} />
  if (normalized === 'Comics') return <IconComics {...props} />
  if (normalized === 'Games') return <IconGames {...props} />
  if (normalized === 'Tech') return <IconTech {...props} />

  return <IconSignal {...props} />
}

function categoryLabel(category) {
  const normalized = normalizeCategory(category)
  return normalized === 'Other' ? 'Unresolved' : normalized
}

function safeArticleUrl(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

function formatRefreshTime(value) {
  if (!value) return 'No refresh recorded yet'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function topByCategoryFromSignals(signals) {
  const leaders = Object.fromEntries(
    CATEGORY_ORDER.map((category) => [category, null]),
  )

  for (const signal of signals) {
    const category = normalizeCategory(signal.category)

    if (
      Object.hasOwn(leaders, category) &&
      leaders[category] === null
    ) {
      leaders[category] = signal
    }
  }

  return leaders
}

function StudioMark() {
  return (
    <span className="os-mark" aria-hidden="true">
      <IconYinYang size={28} strokeWidth={1.8} />
    </span>
  )
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

function SignalWidget({ leaders, status, onOpen, onPreview }) {
  const stories = CATEGORY_ORDER
    .map((category) => ({
      category,
      signal: leaders?.[category] ?? null,
    }))
    .filter(({ signal }) => signal)

  return (
    <section className="home-widget signal-widget">
      <WidgetHeader
        title="Top Signals"
        Icon={IconSignal}
        actionLabel="Open Signal"
        onAction={() => onOpen('signal')}
      />

      {status === 'loading' && <p className="widget-state">Checking the field…</p>}
      {status === 'error' && <p className="widget-state">Signal is unavailable right now.</p>}
      {status === 'ready' && stories.length === 0 && <p className="widget-state">Nothing active right now.</p>}

      {stories.length > 0 && (
        <div className="category-leader-grid" aria-label="Top Signal by category">
          {stories.map(({ category, signal }) => (
            <button
              type="button"
              className="category-leader-card"
              key={category}
              onClick={() => onPreview(signal.signal_id)}
              aria-label={`${category}: ${signal.headline}`}
            >
              <span
                className={`category-icon category-${category.toLowerCase()}`}
                title={category}
                aria-hidden="true"
              >
                <CategoryIcon category={category} size={20} />
              </span>

              <span className="category-leader-copy">
                <b>{signal.headline}</b>
                <small>{signal.source_count ?? '—'} sources</small>
              </span>

              <ChevronRight size={17} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function WorkWidget({ onOpen }) {
  return (
    <section className="home-widget work-widget">
      <WidgetHeader
        title="In progress"
        Icon={IconDesk}
        actionLabel="Open Desk"
        onAction={() => onOpen('desk')}
      />

      <div className="work-card-rail" aria-label="Works in progress">
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

function HomeView({
  leaders,
  signalStatus,
  onOpen,
  onPreview,
}) {
  const now = new Date()

  return (
    <div className="home-view">
      <section className="home-intro">
        <h1>{greetingForDate(now)}, James.</h1>
        <p className="daily-wisdom">“{wisdomForDate(now)}”</p>
      </section>

      <div className="widget-board">
        <SignalWidget
          leaders={leaders}
          status={signalStatus}
          onOpen={onOpen}
          onPreview={onPreview}
        />
        <WorkWidget onOpen={onOpen} />
      </div>
    </div>
  )
}

function RefreshStatus({ dashboard, refreshState }) {
  const label = refreshState.status === 'PENDING'
    ? 'Refresh queued'
    : refreshState.status === 'CLAIMED'
      ? 'Refreshing…'
      : refreshState.status === 'FAILED'
        ? 'Refresh failed'
        : null

  return (
    <div className="signal-refresh-status">
      <span>
        <IconClock size={16} strokeWidth={1.8} />
        Last refresh: {formatRefreshTime(dashboard?.last_refresh_at)}
      </span>
      {label && <em>{label}</em>}
    </div>
  )
}

function CategoryFilter({ value, onChange }) {
  return (
    <div className="category-filter" aria-label="Filter Signal digest by category">
      <button
        type="button"
        className={value === 'All' ? 'is-active' : ''}
        onClick={() => onChange('All')}
      >
        All
      </button>

      {CATEGORY_ORDER.map((category) => (
        <button
          type="button"
          key={category}
          className={value === category ? 'is-active' : ''}
          onClick={() => onChange(category)}
        >
          <CategoryIcon category={category} size={17} />
          <span>{category}</span>
        </button>
      ))}
    </div>
  )
}

function DigestCard({ signal, variant = 'standard', onPreview }) {
  return (
    <button
      type="button"
      className={`digest-card digest-card-${variant}`}
      onClick={() => onPreview(signal.signal_id)}
    >
      <span className="digest-card-copy">
        <b>{signal.headline}</b>
        <small>
          {signal.lead?.source_name || 'Source pending'}
          {signal.source_count != null ? ` · ${signal.source_count} sources` : ''}
        </small>
      </span>

      <ChevronRight size={18} aria-hidden="true" />
    </button>
  )
}

function DigestSection({ category, stories, onPreview, expanded = false }) {
  if (!stories.length) return null

  const [lead, ...rest] = stories
  const secondary = rest.slice(0, expanded ? 8 : 3)

  return (
    <section className="digest-category-section">
      <header className="digest-section-header">
        <span className="digest-section-title">
          <CategoryIcon category={category} size={22} />
          <span>{category}</span>
        </span>
        <small>{stories.length} active</small>
      </header>

      <div className="digest-magazine-layout">
        <DigestCard
          signal={lead}
          variant="hero"
          onPreview={onPreview}
        />

        {secondary.length > 0 && (
          <div className="digest-secondary-grid">
            {secondary.map((signal) => (
              <DigestCard
                key={signal.signal_id}
                signal={signal}
                variant="compact"
                onPreview={onPreview}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function SignalView({
  signals,
  status,
  dashboard,
  refreshState,
  onRefresh,
  onPreview,
}) {
  const [category, setCategory] = useState('All')

  const grouped = useMemo(() => {
    const next = Object.fromEntries(
      CATEGORY_ORDER.map((name) => [name, []]),
    )

    for (const signal of signals) {
      const normalized = normalizeCategory(signal.category)
      if (Object.hasOwn(next, normalized)) {
        next[normalized].push(signal)
      }
    }

    return next
  }, [signals])

  const refreshing = ['requesting', 'PENDING', 'CLAIMED'].includes(refreshState.status)
  const visibleCategories = category === 'All'
    ? CATEGORY_ORDER
    : [category]

  return (
    <div className="app-view signal-digest-view">
      <div className="signal-digest-heading">
        <div className="app-view-heading">
          <span className="app-kicker">Signal</span>
          <h1>Digest</h1>
          <p>Top stories organized by topic. Ranking stays behind the curtain.</p>
        </div>

        <div className="signal-refresh-block">
          <RefreshStatus dashboard={dashboard} refreshState={refreshState} />
          <button
            type="button"
            className="signal-refresh-button"
            onClick={onRefresh}
            disabled={refreshing}
          >
            <IconRefresh
              size={18}
              strokeWidth={1.8}
              className={refreshing ? 'is-spinning' : undefined}
            />
            {refreshing ? 'Refreshing' : 'Refresh Signal'}
          </button>
        </div>
      </div>

      {refreshState.status === 'FAILED' && (
        <p className="signal-refresh-error" role="alert">
          {refreshState.message || 'Manual refresh is unavailable right now.'}
        </p>
      )}

      <CategoryFilter value={category} onChange={setCategory} />

      <div className="signal-magazine" aria-live="polite">
        {status === 'loading' && <p className="widget-state">Loading Signals…</p>}
        {status === 'error' && <p className="widget-state">Signal is unavailable right now.</p>}

        {status === 'ready' && visibleCategories.every((name) => grouped[name].length === 0) && (
          <p className="widget-state">No active stories in this category.</p>
        )}

        {visibleCategories.map((name) => (
          <DigestSection
            key={name}
            category={name}
            stories={grouped[name]}
            onPreview={onPreview}
            expanded={category !== 'All'}
          />
        ))}
      </div>
    </div>
  )
}

function StoryPreview({
  signalId,
  onClose,
  onSendToDesk,
  onCategoryCorrected,
  deskSignalIds,
}) {
  const [resource, setResource] = useState({
    status: 'loading',
    data: null,
  })
  const [editingCategory, setEditingCategory] = useState(false)
  const [pendingCategory, setPendingCategory] = useState('')
  const [categoryState, setCategoryState] = useState({
    status: 'idle',
    message: null,
  })

  useEffect(() => {
    if (!signalId) return undefined

    const controller = new AbortController()
    let active = true

    setResource({ status: 'loading', data: null })
    setEditingCategory(false)
    setCategoryState({ status: 'idle', message: null })

    fetchSignal(signalId, controller.signal)
      .then((data) => {
        if (!active) return
        setResource({ status: 'ready', data })
        setPendingCategory(normalizeCategory(data.category))
      })
      .catch(() => {
        if (active) setResource({ status: 'error', data: null })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [signalId])

  useEffect(() => {
    if (!signalId) return undefined

    const root = document.documentElement
    const body = document.body
    const scrollY = window.scrollY
    const previous = {
      rootOverflow: root.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
    }

    root.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    return () => {
      root.style.overflow = previous.rootOverflow
      body.style.position = previous.bodyPosition
      body.style.top = previous.bodyTop
      body.style.width = previous.bodyWidth
      body.style.overflow = previous.bodyOverflow
      window.scrollTo(0, scrollY)
    }
  }, [signalId])

  useEffect(() => {
    if (!signalId) return undefined

    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [signalId, onClose])

  if (!signalId) return null

  const story = resource.data
  const excerpt = story?.lead?.excerpt ||
    story?.articles?.find((article) => article.excerpt)?.excerpt ||
    null
  const sourceUrl = safeArticleUrl(
    story?.articles?.find((article) => article.url)?.url,
  )
  const inDesk = story ? deskSignalIds.has(story.signal_id) : false

  async function saveCategoryCorrection() {
    if (
      !story ||
      !CATEGORY_ORDER.includes(pendingCategory) ||
      normalizeCategory(story.category) === pendingCategory
    ) {
      setEditingCategory(false)
      return
    }

    setCategoryState({ status: 'saving', message: null })

    try {
      await correctSignalCategory(
        story.signal_id,
        pendingCategory,
      )

      setResource((current) => ({
        ...current,
        data: current.data
          ? { ...current.data, category: pendingCategory }
          : current.data,
      }))
      setCategoryState({
        status: 'saved',
        message: 'Correction saved as Signal feedback.',
      })
      setEditingCategory(false)
      await onCategoryCorrected?.()
    } catch (error) {
      setCategoryState({
        status: 'error',
        message: error?.message || 'Could not save category correction.',
      })
    }
  }

  return (
    <div className="story-preview-layer" role="dialog" aria-modal="true" aria-label="Signal story preview">
      <button type="button" className="story-preview-scrim" onClick={onClose} aria-label="Close story preview" />

      <article className="story-preview">
        <header className="story-preview-header">
          <span className="story-preview-category">
            {story && <CategoryIcon category={story.category} size={20} />}
            <span>{story ? categoryLabel(story.category) : 'Signal'}</span>
          </span>
          <button type="button" className="story-preview-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="story-preview-scroll">
          {resource.status === 'loading' && (
            <div className="story-preview-state">Loading story preview…</div>
          )}

          {resource.status === 'error' && (
            <div className="story-preview-state" role="alert">
              This story could not be loaded right now.
            </div>
          )}

          {story && (
            <div className="story-preview-copy">
              <h2>{story.headline}</h2>
              <p className="story-preview-source">
                {story.lead?.source_name || 'Source unavailable'}
                {story.source_count != null ? ` · ${story.source_count} sources` : ''}
              </p>

              <div className="story-preview-excerpt">
                <span>Excerpt</span>
                <p>{excerpt || 'No source excerpt is available for this story yet.'}</p>
              </div>

              {editingCategory && (
                <div className="category-correction">
                  <div className="category-correction-heading">
                    <IconBug size={18} />
                    <span>
                      Correct category
                      <small>This is saved as Signal feedback so Compass/Core can learn from the miss later.</small>
                    </span>
                  </div>

                  <div className="category-correction-options">
                    {CATEGORY_ORDER.map((category) => (
                      <button
                        type="button"
                        key={category}
                        className={pendingCategory === category ? 'is-selected' : ''}
                        onClick={() => setPendingCategory(category)}
                      >
                        <CategoryIcon category={category} size={17} />
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="category-correction-actions">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveCategoryCorrection}
                      disabled={categoryState.status === 'saving'}
                    >
                      {categoryState.status === 'saving' ? 'Saving…' : 'Save correction'}
                    </button>
                  </div>
                </div>
              )}

              {categoryState.message && !editingCategory && (
                <p
                  className={`category-correction-message is-${categoryState.status}`}
                  role={categoryState.status === 'error' ? 'alert' : undefined}
                >
                  {categoryState.message}
                </p>
              )}
            </div>
          )}
        </div>

        {story && (
          <footer className="story-preview-actions">
            <button
              type="button"
              className="story-action"
              onClick={() => {
                setPendingCategory(normalizeCategory(story.category))
                setEditingCategory((value) => !value)
              }}
            >
              <IconEdit size={19} />
              Edit category
            </button>

            <button
              type="button"
              className="story-action compass-action"
              disabled
              title="Compass processing will be enabled later"
            >
              <IconCompassProcess size={19} />
              Compass
              <small>Soon</small>
            </button>

            <button
              type="button"
              className="story-action desk-action"
              onClick={() => onSendToDesk(story)}
              disabled={inDesk}
            >
              <IconSend size={19} />
              {inDesk ? 'In Desk' : 'Send to Desk'}
            </button>

            {sourceUrl && (
              <a
                className="story-action source-action"
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExternalLink size={19} />
                Read source
              </a>
            )}
          </footer>
        )}
      </article>
    </div>
  )
}

function CreateView() {
  return (
    <div className="app-view">
      <div className="app-view-heading">
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

function DeskView({ signalItems }) {
  return (
    <div className="app-view">
      <div className="app-view-heading">
        <span className="app-kicker">Desk</span>
        <h1>Work in motion.</h1>
        <p>Ideas, drafts, reviewing, and stories you have pulled in from Signal.</p>
      </div>

      {signalItems.length > 0 && (
        <section className="desk-signal-section">
          <h2>From Signal</h2>
          <div className="app-panel">
            {signalItems.map((item) => (
              <article className="desk-row" key={item.signal_id}>
                <div>
                  <small>
                    <CategoryIcon category={item.category} size={14} />
                    Signal · {categoryLabel(item.category)}
                  </small>
                  <b>{item.headline}</b>
                </div>
                <span>Added</span>
              </article>
            ))}
          </div>
        </section>
      )}

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

function LibraryView() {
  return (
    <div className="app-view">
      <div className="app-view-heading">
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
          <IconSearch size={19} strokeWidth={1.8} />
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
                    <IconSignal size={17} strokeWidth={1.8} />
                    <span><b>{signal.headline}</b><small>{categoryLabel(signal.category)}</small></span>
                  </button>
                ))}
              </div>
            )}

            {results.work.length > 0 && (
              <div className="spotlight-section">
                <span className="spotlight-label">Work</span>
                {results.work.map((item) => (
                  <button type="button" key={item.id} onClick={() => handleCommand({ action: 'desk' })}>
                    <IconDesk size={17} strokeWidth={1.8} />
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
    { id: 'home', label: 'Home', Icon: IconHome },
    { id: 'signal', label: 'Signal', Icon: IconSignal },
    { id: 'create', label: 'Create', Icon: IconCreate },
    { id: 'desk', label: 'Desk', Icon: IconDesk },
    { id: 'library', label: 'Library', Icon: IconLibrary },
  ]

  function go(target) {
    onNavigate(target)
    onClose()
  }

  return (
    <div className="vibe-menu-popover" role="menu" aria-label="Vibe navigation">
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
        <IconSearch size={20} strokeWidth={1.8} />
        <span>Search / Command</span>
      </button>

      <div className="vibe-menu-status">
        <IconStatus size={19} strokeWidth={1.8} />
        <span>Systems normal</span>
      </div>

      <form method="post" action="/studio/logout">
        <button type="submit" role="menuitem">
          <IconLogout size={20} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>
      </form>
    </div>
  )
}

function readDeskSignals() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DESK_SESSION_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function StudioApp() {
  const [activeApp, setActiveApp] = useState('home')
  const [signals, setSignals] = useState({ status: 'loading', data: [] })
  const [dashboard, setDashboard] = useState({ status: 'loading', data: null })
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedSignalId, setSelectedSignalId] = useState(null)
  const [deskSignals, setDeskSignals] = useState(readDeskSignals)
  const [refreshState, setRefreshState] = useState({
    status: 'idle',
    requestId: null,
    message: null,
  })

  const loadSignalData = useCallback(async (signal) => {
    const [signalResult, dashboardResult] = await Promise.allSettled([
      fetchSignals(signal, 100),
      fetchDashboard(signal),
    ])

    if (signalResult.status === 'fulfilled') {
      setSignals({ status: 'ready', data: signalResult.value })
    } else {
      setSignals({ status: 'error', data: [] })
    }

    if (dashboardResult.status === 'fulfilled') {
      setDashboard({ status: 'ready', data: dashboardResult.value })
    } else {
      setDashboard({ status: 'error', data: null })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadSignalData(controller.signal)
    return () => controller.abort()
  }, [loadSignalData])

  useEffect(() => {
    sessionStorage.setItem(
      DESK_SESSION_KEY,
      JSON.stringify(deskSignals),
    )
  }, [deskSignals])

  useEffect(() => {
    if (
      !refreshState.requestId ||
      !['PENDING', 'CLAIMED'].includes(refreshState.status)
    ) {
      return undefined
    }

    const controller = new AbortController()
    const timer = window.setInterval(async () => {
      try {
        const request = await fetchRefreshRequest(
          refreshState.requestId,
          controller.signal,
        )

        setRefreshState((current) => ({
          ...current,
          status: request.status,
          message: request.error_message,
        }))

        if (request.status === 'COMPLETE') {
          window.clearInterval(timer)
          await loadSignalData()
        }

        if (request.status === 'FAILED') {
          window.clearInterval(timer)
        }
      } catch {
        // Keep the request alive. A transient status read should not create
        // a second refresh request or erase the current state.
      }
    }, 2000)

    return () => {
      window.clearInterval(timer)
      controller.abort()
    }
  }, [
    loadSignalData,
    refreshState.requestId,
    refreshState.status,
  ])

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
    const next = target === 'settings' ? 'home' : target
    setActiveApp(next)
    setMenuOpen(false)
  }

  async function handleManualRefresh() {
    if (['requesting', 'PENDING', 'CLAIMED'].includes(refreshState.status)) {
      return
    }

    setRefreshState({
      status: 'requesting',
      requestId: null,
      message: null,
    })

    try {
      const request = await requestManualRefresh()

      setRefreshState({
        status: request.status,
        requestId: request.request_id,
        message: request.error_message,
      })

      if (request.status === 'COMPLETE') {
        await loadSignalData()
      }
    } catch (error) {
      setRefreshState({
        status: 'FAILED',
        requestId: null,
        message: error?.message || 'Manual refresh is unavailable.',
      })
    }
  }

  function sendSignalToDesk(signal) {
    setDeskSignals((current) => {
      if (current.some((item) => item.signal_id === signal.signal_id)) {
        return current
      }

      return [
        {
          signal_id: signal.signal_id,
          headline: signal.headline,
          category: signal.category,
          added_at: new Date().toISOString(),
        },
        ...current,
      ]
    })
  }

  const leaders = dashboard.data?.top_by_category ||
    topByCategoryFromSignals(signals.data)
  const signalStatus =
    signals.status === 'error' && dashboard.status === 'error'
      ? 'error'
      : signals.status === 'loading' && dashboard.status === 'loading'
        ? 'loading'
        : 'ready'
  const deskSignalIds = useMemo(
    () => new Set(deskSignals.map((item) => item.signal_id)),
    [deskSignals],
  )
  const currentApp = APP_DEFINITIONS.find((item) => item.id === activeApp)

  return (
    <div className="vibe-os">
      <div className="os-environment" aria-hidden="true">
        <div className="os-stars os-stars-one" />
        <div className="os-stars os-stars-two" />
        <div className="os-environment-shade" />
      </div>

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

        <button
          type="button"
          className="site-title-button"
          onClick={() => navigate('home')}
          aria-label="Go to Home"
        >
          THE GEEK GUIDE
        </button>

        <button
          type="button"
          className="search-button"
          onClick={() => setSearchOpen(true)}
          aria-label="Search Vibe"
        >
          <IconSearch size={21} strokeWidth={1.8} />
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
      </header>

      <main className="os-content">
        {activeApp === 'home' && (
          <HomeView
            leaders={leaders}
            signalStatus={signalStatus}
            onOpen={navigate}
            onPreview={setSelectedSignalId}
          />
        )}

        {activeApp === 'signal' && (
          <SignalView
            signals={signals.data}
            status={signals.status}
            dashboard={dashboard.data}
            refreshState={refreshState}
            onRefresh={handleManualRefresh}
            onPreview={setSelectedSignalId}
          />
        )}

        {activeApp === 'create' && <CreateView />}
        {activeApp === 'desk' && <DeskView signalItems={deskSignals} />}
        {activeApp === 'library' && <LibraryView />}
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

      <StoryPreview
        signalId={selectedSignalId}
        onClose={() => setSelectedSignalId(null)}
        onSendToDesk={sendSignalToDesk}
        onCategoryCorrected={() => loadSignalData()}
        deskSignalIds={deskSignalIds}
      />
    </div>
  )
}

export default StudioApp
