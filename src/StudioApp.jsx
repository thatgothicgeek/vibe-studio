import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRight,
  Circle,
  Command,
  CornerDownLeft,
  LogOut,
  Sparkles,
  Terminal,
} from 'lucide-react'
import './Studio.css'
import {
  CREATE_MENU,
  MAIN_MENU,
  NEWS_MENU,
  SHELL_COMMANDS,
  getGreeting,
  resolveShellInput,
  suggestShellCommands,
} from './studioShellModel'

const HISTORY_KEY = 'vibe-studio-shell-history-v2'
const GREETING_KEY = 'vibe-studio-shell-greeted-v2'
const CONTEXT_KEY = 'vibe-studio-shell-context-v2'
const SOFT_IDLE_MS = 60 * 60 * 1000

function id() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function vibeMessage(title, {
  copy = null,
  cards = [],
  tone = 'default',
} = {}) {
  return {
    id: id(),
    role: 'vibe',
    title,
    copy,
    cards,
    tone,
    settled: false,
  }
}

function userMessage(text) {
  return {
    id: id(),
    role: 'user',
    title: text,
    copy: null,
    cards: [],
    tone: 'default',
    settled: true,
  }
}

function buildOpeningHistory({ respectGreeting = true } = {}) {
  const greeted = respectGreeting &&
    sessionStorage.getItem(GREETING_KEY) === '1'

  const opening = vibeMessage(
    greeted ? 'What would you like to do?' : `${getGreeting()}, James.`,
    {
      copy: greeted ? null : 'What would you like to do?',
      cards: MAIN_MENU,
      tone: greeted ? 'default' : 'opening',
    },
  )

  sessionStorage.setItem(GREETING_KEY, '1')
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify([opening]))
  sessionStorage.setItem(CONTEXT_KEY, 'home')

  return [opening]
}

function initialHistory() {
  try {
    const saved = sessionStorage.getItem(HISTORY_KEY)

    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    // A damaged session should never prevent Studio from opening.
  }

  return buildOpeningHistory()
}

function initialContext() {
  const saved = sessionStorage.getItem(CONTEXT_KEY)
  return ['home', 'create', 'news'].includes(saved) ? saved : 'home'
}

function responseForAction(action) {
  switch (action) {
    case 'home':
      return {
        context: 'home',
        message: vibeMessage('What would you like to do?', {
          cards: MAIN_MENU,
        }),
      }

    case 'create':
      return {
        context: 'create',
        message: vibeMessage('What are we making?', {
          copy: 'Start with the shape of the thing. The editor can come later.',
          cards: CREATE_MENU,
        }),
      }

    case 'news':
      return {
        context: 'news',
        message: vibeMessage('How do you want to read the field?', {
          copy: 'The live Hub data stays underneath this remodel. We are changing the interface, not throwing away the machinery.',
          cards: NEWS_MENU,
        }),
      }

    case 'resume':
      return {
        context: 'home',
        message: vibeMessage('Nothing is waiting in the new shell yet.', {
          copy: 'Resume will reopen the active draft, idea, or research thread here as soon as workspace state is wired in.',
        }),
      }

    case 'settings':
      return {
        context: 'home',
        message: vibeMessage('Settings stay out of the way.', {
          copy: 'Shell preferences, source controls, and system settings will live behind commands instead of becoming another wall of navigation.',
        }),
      }

    case 'future-idea':
      return {
        context: 'create',
        message: vibeMessage('Future Idea is our first real creation slice.', {
          copy: 'The shell handoff is ready. Next we wire the save path so an idea entered here becomes a real persisted object instead of a demo.',
          tone: 'accent',
        }),
      }

    case 'news-brief':
    case 'guide':
    case 'review':
      return {
        context: 'create',
        message: vibeMessage('That creation flow is staged for a later pass.', {
          copy: 'We are building the common conversation spine first so each content type can plug into the same shell.',
        }),
      }

    case 'news-top':
    case 'news-category':
    case 'news-latest':
      return {
        context: 'news',
        message: vibeMessage('The Signal view plugs in here next.', {
          copy: 'We already have the live Hub endpoints. The next news pass will materialize those results as inline Signal cards instead of rebuilding the data layer.',
          tone: 'accent',
        }),
      }

    default:
      return {
        context: 'home',
        message: vibeMessage('I do not have that action yet.', {
          copy: 'Use /home to return to the main menu.',
        }),
      }
  }
}

function ChoiceCard({ option, active, onChoose }) {
  return (
    <button
      className="shell-choice"
      type="button"
      disabled={!active}
      onClick={() => onChoose(option)}
    >
      <span className="choice-number">{option.number}</span>
      <span className="choice-copy">
        <b>{option.label}</b>
        <small>{option.detail}</small>
      </span>
      <ChevronRight size={16} strokeWidth={1.7} aria-hidden="true" />
    </button>
  )
}

function ConversationBlock({
  item,
  active,
  onChoose,
  rowRef,
}) {
  if (item.role === 'user') {
    return (
      <div ref={rowRef} className="conversation-row user-row">
        <div className="user-message">{item.title}</div>
      </div>
    )
  }

  return (
    <article
      ref={rowRef}
      className={`conversation-row vibe-row tone-${item.tone}`}
    >
      <div className="vibe-marker" aria-hidden="true">
        <Sparkles size={14} strokeWidth={1.7} />
      </div>

      <div className="vibe-message">
        <h2>{item.title}</h2>
        {item.copy && <p>{item.copy}</p>}

        {item.cards?.length > 0 && (
          <div
            className={`choice-grid${active ? ' is-active' : ' is-settled'}`}
            aria-label="Available choices"
          >
            {item.cards.map((option) => (
              <ChoiceCard
                key={option.action}
                option={option}
                active={active}
                onChoose={onChoose}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function CommandMenu({
  suggestions,
  selectedIndex,
  onSelect,
}) {
  if (!suggestions.length) return null

  return (
    <div className="command-menu" role="listbox" aria-label="Vibe commands">
      <div className="command-menu-label">Commands</div>

      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.command}
          type="button"
          role="option"
          aria-selected={index === selectedIndex}
          className={`command-suggestion${index === selectedIndex ? ' is-selected' : ''}`}
          onClick={() => onSelect(suggestion.command)}
        >
          <b>{suggestion.command}</b>
          <span>{suggestion.detail}</span>
        </button>
      ))}
    </div>
  )
}

function StudioApp() {
  const [history, setHistory] = useState(initialHistory)
  const [context, setContext] = useState(initialContext)
  const [input, setInput] = useState('')
  const [idle, setIdle] = useState(false)
  const [focusId, setFocusId] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [commandMenuDismissed, setCommandMenuDismissed] = useState(false)
  const [suggestionIndex, setSuggestionIndex] = useState(0)

  const inputRef = useRef(null)
  const dockRef = useRef(null)
  const headerRef = useRef(null)
  const rowRefs = useRef(new Map())

  const suggestions = useMemo(() => {
    if (!inputFocused || commandMenuDismissed) return []
    return suggestShellCommands(input)
  }, [commandMenuDismissed, input, inputFocused])

  const clearShell = useCallback(() => {
    sessionStorage.removeItem(HISTORY_KEY)
    sessionStorage.removeItem(GREETING_KEY)
    sessionStorage.removeItem(CONTEXT_KEY)

    const fresh = buildOpeningHistory({ respectGreeting: false })

    setHistory(fresh)
    setContext('home')
    writeEditorValue('', false)
    setCommandMenuDismissed(false)
    setSuggestionIndex(0)
    setFocusId(fresh[0].id)
  }, [])

  const appendAction = useCallback((action, label) => {
    if (action === 'clear') {
      clearShell()
      return
    }

    const response = responseForAction(action)

    setHistory((current) => [
      ...current.map((item) => (
        item.cards?.length
          ? { ...item, settled: true }
          : item
      )),
      userMessage(label),
      response.message,
    ])

    setContext(response.context)
    writeEditorValue('', false)
    setCommandMenuDismissed(false)
    setSuggestionIndex(0)
    setFocusId(response.message.id)
  }, [clearShell])

  const chooseOption = useCallback((option) => {
    appendAction(
      option.action,
      `${option.number}. ${option.label}`,
    )
  }, [appendAction])

  const resumeFromIdle = useCallback(() => {
    const welcome = vibeMessage('Welcome back.', {
      copy: 'What would you like to do?',
      cards: MAIN_MENU,
      tone: 'opening',
    })

    setIdle(false)
    setContext('home')

    setHistory((current) => [
      ...current.map((item) => (
        item.cards?.length
          ? { ...item, settled: true }
          : item
      )),
      welcome,
    ])

    setFocusId(welcome.id)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Vibe Studio'

    const elements = []

    const addMeta = (name, content) => {
      const meta = document.createElement('meta')
      meta.name = name
      meta.content = content
      meta.dataset.vibeStudioPwa = 'true'
      document.head.appendChild(meta)
      elements.push(meta)
    }

    const manifest = document.createElement('link')
    manifest.rel = 'manifest'
    manifest.href = '/studio.webmanifest'
    manifest.dataset.vibeStudioPwa = 'true'
    document.head.appendChild(manifest)
    elements.push(manifest)

    const icon = document.createElement('link')
    icon.rel = 'apple-touch-icon'
    icon.href = '/studio-icon.svg'
    icon.dataset.vibeStudioPwa = 'true'
    document.head.appendChild(icon)
    elements.push(icon)

    addMeta('apple-mobile-web-app-capable', 'yes')
    addMeta('apple-mobile-web-app-status-bar-style', 'black-translucent')
    addMeta('apple-mobile-web-app-title', 'Vibe Studio')

    return () => {
      document.title = previousTitle
      elements.forEach((element) => element.remove())
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    sessionStorage.setItem(CONTEXT_KEY, context)
  }, [context])

  useEffect(() => {
    if (!focusId) return

    const frame = window.requestAnimationFrame(() => {
      const node = rowRefs.current.get(focusId)

      if (!node) return

      const headerHeight =
        headerRef.current?.getBoundingClientRect().height ?? 68

      const targetTop =
        window.scrollY +
        node.getBoundingClientRect().top -
        headerHeight -
        14

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [focusId])

  useEffect(() => {
    const viewport = window.visualViewport
    const root = document.documentElement

    const syncViewport = () => {
      const height = viewport?.height ?? window.innerHeight

      root.style.setProperty(
        '--studio-visual-height',
        `${Math.round(height)}px`,
      )

      if (
        inputFocused &&
        viewport &&
        dockRef.current
      ) {
        const pageTop = viewport.pageTop
        const dockHeight = dockRef.current.offsetHeight
        const top = Math.max(
          pageTop + 8,
          pageTop + height - dockHeight - 8,
        )

        root.style.setProperty(
          '--studio-dock-top',
          `${Math.round(top)}px`,
        )
      } else {
        root.style.removeProperty('--studio-dock-top')
      }
    }

    syncViewport()

    viewport?.addEventListener('resize', syncViewport)
    viewport?.addEventListener('scroll', syncViewport)
    window.addEventListener('resize', syncViewport)

    return () => {
      viewport?.removeEventListener('resize', syncViewport)
      viewport?.removeEventListener('scroll', syncViewport)
      window.removeEventListener('resize', syncViewport)
      root.style.removeProperty('--studio-visual-height')
      root.style.removeProperty('--studio-dock-top')
    }
  }, [inputFocused, suggestions.length])

  useEffect(() => {
    let timer

    const armIdleTimer = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIdle(true), SOFT_IDLE_MS)
    }

    const registerActivity = () => {
      armIdleTimer()
    }

    armIdleTimer()
    window.addEventListener('pointerdown', registerActivity)
    window.addEventListener('keydown', registerActivity)
    window.addEventListener('touchstart', registerActivity)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', registerActivity)
      window.removeEventListener('keydown', registerActivity)
      window.removeEventListener('touchstart', registerActivity)
    }
  }, [])

  useEffect(() => {
    if (!idle) return undefined

    const resume = () => resumeFromIdle()
    window.addEventListener('keydown', resume, { once: true })

    return () => window.removeEventListener('keydown', resume)
  }, [idle, resumeFromIdle])

  function placeCaretAtEnd(node) {
    const selection = window.getSelection()
    if (!selection) return

    const range = document.createRange()
    range.selectNodeContents(node)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  function writeEditorValue(value, focus = true) {
    setInput(value)

    window.requestAnimationFrame(() => {
      const node = inputRef.current
      if (!node) return

      if (node.textContent !== value) {
        node.textContent = value
      }

      if (focus) {
        node.focus({ preventScroll: true })
        placeCaretAtEnd(node)
      }
    })
  }

  function completeSuggestion(command) {
    setCommandMenuDismissed(true)
    setSuggestionIndex(0)
    writeEditorValue(command)
  }

  function handleInputChange(event) {
    setInput(event.currentTarget.textContent ?? '')
    setCommandMenuDismissed(false)
    setSuggestionIndex(0)
  }

  function handleInputKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setCommandMenuDismissed(true)
      return
    }

    if (suggestions.length) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSuggestionIndex((current) => (
          (current + 1) % suggestions.length
        ))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSuggestionIndex((current) => (
          (current - 1 + suggestions.length) % suggestions.length
        ))
        return
      }

      const selected = suggestions[suggestionIndex]
      const exact = input.trim().toLowerCase() === selected?.command

      if (
        event.key === 'Tab' ||
        (event.key === 'Enter' && !exact)
      ) {
        event.preventDefault()
        completeSuggestion(selected.command)
        return
      }
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      submitInput()
    }
  }

  function submitInput() {
    const resolved = resolveShellInput(input, context)

    if (resolved.type === 'empty') return

    if (resolved.type === 'command' || resolved.type === 'choice') {
      appendAction(
        resolved.action,
        resolved.type === 'choice'
          ? `${resolved.number}. ${resolved.label}`
          : resolved.label,
      )
      return
    }

    const typed = input.trim()

    const response = vibeMessage(
      resolved.type === 'unknown-command'
        ? `${resolved.label} is not a command yet.`
        : resolved.type === 'unknown-choice'
          ? `${resolved.number} is not an option here.`
          : 'Free-form conversation comes next.',
      {
        copy: resolved.type === 'text'
          ? 'For this foundation pass, use a numbered option or slash command. The response model is being built so natural language can plug into the same spine later.'
          : `Try one of: ${SHELL_COMMANDS.join('  ')}`,
      },
    )

    setHistory((current) => [
      ...current.map((item) => (
        item.cards?.length
          ? { ...item, settled: true }
          : item
      )),
      userMessage(typed),
      response,
    ])

    writeEditorValue('', false)
    setCommandMenuDismissed(false)
    setSuggestionIndex(0)
    setFocusId(response.id)
  }

  const lastActionableId = [...history]
    .reverse()
    .find((item) => item.cards?.length && !item.settled)
    ?.id

  return (
    <div className="studio-shell">
      <header ref={headerRef} className="shell-header">
        <a className="shell-brand" href="/studio" aria-label="Vibe Studio home">
          <span className="shell-mark" aria-hidden="true">V</span>
          <span>
            <b>VIBE</b>
            <small>STUDIO</small>
          </span>
        </a>

        <div className="shell-status">
          <span className="session-state">
            <Circle size={7} fill="currentColor" aria-hidden="true" />
            session active
          </span>

          <form method="post" action="/studio/logout">
            <button className="shell-icon-button" type="submit" aria-label="Sign out">
              <LogOut size={16} strokeWidth={1.7} />
            </button>
          </form>
        </div>
      </header>

      <main className="shell-main">
        <div className="terminal-label">
          <Terminal size={14} strokeWidth={1.6} />
          <span>conversation / control plane</span>
        </div>

        <section className="conversation" aria-live="polite">
          {history.map((item) => (
            <ConversationBlock
              key={item.id}
              item={item}
              active={item.id === lastActionableId}
              onChoose={chooseOption}
              rowRef={(node) => {
                if (node) rowRefs.current.set(item.id, node)
                else rowRefs.current.delete(item.id)
              }}
            />
          ))}

          <div className="conversation-tail" aria-hidden="true" />
        </section>
      </main>

      <div
        ref={dockRef}
        className={`command-dock${inputFocused ? ' is-input-focused' : ''}`}
      >
        <CommandMenu
          suggestions={suggestions}
          selectedIndex={suggestionIndex}
          onSelect={completeSuggestion}
        />

        <div className="command-form" role="search">
          <span className="command-prefix" aria-hidden="true">
            <Command size={15} strokeWidth={1.7} />
          </span>

          <div
            ref={inputRef}
            className="command-editor"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Vibe command"
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            aria-multiline="false"
            data-placeholder="Type a command or choose an option…"
            inputMode="text"
            enterKeyHint="send"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            onInput={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={(event) => {
              if (!dockRef.current?.contains(event.relatedTarget)) {
                setInputFocused(false)
              }
            }}
            onPaste={(event) => {
              event.preventDefault()
              const text = event.clipboardData.getData('text/plain')
              document.execCommand('insertText', false, text)
            }}
          />

          <button
            type="button"
            className="send-button"
            aria-label="Send command"
            onClick={submitInput}
          >
            <CornerDownLeft size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="command-hints" aria-hidden="true">
          <span>type / for commands</span>
          <span>/home</span>
          <span>/create</span>
          <span>/news</span>
          <span>/clear</span>
        </div>
      </div>

      {idle && (
        <button
          type="button"
          className="idle-screen"
          onPointerDown={resumeFromIdle}
          aria-label="Vibe is idle. Press any key or tap to continue."
        >
          <span className="idle-mark">V</span>
          <b>Vibe is idle.</b>
          <small>Press any key to continue.</small>
        </button>
      )}
    </div>
  )
}

export default StudioApp
