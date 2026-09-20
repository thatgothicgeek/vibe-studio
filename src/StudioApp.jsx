import { useCallback, useEffect, useRef, useState } from 'react'
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
} from './studioShellModel'

const HISTORY_KEY = 'vibe-studio-shell-history-v2'
const GREETING_KEY = 'vibe-studio-shell-greeted-v2'
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

  const greeted = sessionStorage.getItem(GREETING_KEY) === '1'
  const history = [
    vibeMessage(
      greeted ? 'What would you like to do?' : `${getGreeting()}, James.`,
      {
        copy: greeted ? null : 'What would you like to do?',
        cards: MAIN_MENU,
        tone: greeted ? 'default' : 'opening',
      },
    ),
  ]

  sessionStorage.setItem(GREETING_KEY, '1')
  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))

  return history
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

function ConversationBlock({ item, active, onChoose }) {
  if (item.role === 'user') {
    return (
      <div className="conversation-row user-row">
        <div className="user-message">{item.title}</div>
      </div>
    )
  }

  return (
    <article className={`conversation-row vibe-row tone-${item.tone}`}>
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

function StudioApp() {
  const [history, setHistory] = useState(initialHistory)
  const [context, setContext] = useState('home')
  const [input, setInput] = useState('')
  const [idle, setIdle] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const appendAction = useCallback((action, label) => {
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
    setInput('')
  }, [])

  const chooseOption = useCallback((option) => {
    appendAction(
      option.action,
      `${option.number}. ${option.label}`,
    )
  }, [appendAction])

  const resumeFromIdle = useCallback(() => {
    setIdle(false)
    setContext('home')

    setHistory((current) => [
      ...current.map((item) => (
        item.cards?.length
          ? { ...item, settled: true }
          : item
      )),
      vibeMessage('Welcome back.', {
        copy: 'What would you like to do?',
        cards: MAIN_MENU,
        tone: 'opening',
      }),
    ])

    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [history])

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

  function handleSubmit(event) {
    event.preventDefault()

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

    setHistory((current) => [
      ...current.map((item) => (
        item.cards?.length
          ? { ...item, settled: true }
          : item
      )),
      userMessage(typed),
      vibeMessage(
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
      ),
    ])

    setInput('')
  }

  const lastActionableId = [...history]
    .reverse()
    .find((item) => item.cards?.length && !item.settled)
    ?.id

  return (
    <div className="studio-shell">
      <header className="shell-header">
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
            />
          ))}
          <div ref={bottomRef} />
        </section>
      </main>

      <div className="command-dock">
        <form className="command-form" onSubmit={handleSubmit}>
          <span className="command-prefix" aria-hidden="true">
            <Command size={15} strokeWidth={1.7} />
          </span>

          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a command or choose an option…"
            aria-label="Vibe command"
            autoComplete="off"
            spellCheck="false"
          />

          <button type="submit" className="send-button" aria-label="Send command">
            <CornerDownLeft size={16} strokeWidth={1.8} />
          </button>
        </form>

        <div className="command-hints" aria-hidden="true">
          <span>/home</span>
          <span>/create</span>
          <span>/news</span>
          <span>/resume</span>
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
