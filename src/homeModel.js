export const DAILY_WISDOM = [
  'Attention is a form of editing.',
  'Make room for what matters.',
  'Clarity usually arrives after movement.',
  'A small finished thing beats a perfect idea.',
  'Curiosity is useful momentum.',
  'Leave a little quiet around the work.',
  'Follow the signal, not the noise.',
  'Good systems make good instincts easier to trust.',
  'Create first. Organize second.',
  'The next useful step is enough.',
  'Keep the tool quiet and the work visible.',
  'Not everything important needs to be urgent.',
  'A clear path is often made by walking it.',
  'Protect the part of the day that still feels alive.',
]

export const APP_DEFINITIONS = [
  { id: 'signal', label: 'Signal', description: 'Discover what is moving.' },
  { id: 'create', label: 'Create', description: 'Turn something into content.' },
  { id: 'desk', label: 'Desk', description: 'Move active work toward publication.' },
  { id: 'library', label: 'Library', description: 'Find and reuse what already exists.' },
]

export const COMMANDS = [
  { command: '/home', label: 'Go Home', action: 'home' },
  { command: '/signal', label: 'Open Signal', action: 'signal' },
  { command: '/sources', label: 'Open Sources', action: 'signal:sources' },
  { command: '/create', label: 'Open Create', action: 'create' },
  { command: '/desk', label: 'Open Desk', action: 'desk' },
  { command: '/library', label: 'Open Library', action: 'library' },
  { command: '/settings', label: 'Open Settings', action: 'settings' },
]

export function greetingForDate(date = new Date()) {
  const hour = date.getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function wisdomForDate(date = new Date()) {
  const key = Number(
    [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join(''),
  )

  return DAILY_WISDOM[key % DAILY_WISDOM.length]
}

export function commandMatches(query) {
  const normalized = String(query ?? '').trim().toLowerCase()

  if (!normalized.startsWith('/')) return []

  return COMMANDS.filter(({ command, label }) => (
    command.startsWith(normalized) ||
    label.toLowerCase().includes(normalized.slice(1))
  ))
}

export function searchItems(query, signals = [], work = []) {
  const normalized = String(query ?? '').trim().toLowerCase()

  if (!normalized || normalized.startsWith('/')) {
    return {
      signals: [],
      work: [],
    }
  }

  return {
    signals: signals
      .filter((item) => item.headline?.toLowerCase().includes(normalized))
      .slice(0, 5),
    work: work
      .filter((item) => item.title?.toLowerCase().includes(normalized))
      .slice(0, 5),
  }
}
