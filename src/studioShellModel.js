export const SHELL_COMMANDS = [
  '/home',
  '/create',
  '/news',
  '/resume',
  '/settings',
]

export const MAIN_MENU = [
  { number: 1, label: 'Create something', action: 'create', detail: 'Start with an idea, story, guide, or review.' },
  { number: 2, label: 'Read the news', action: 'news', detail: 'Open the Signal field and decide what deserves attention.' },
  { number: 3, label: 'Pick up where you left off', action: 'resume', detail: 'Return to the active piece or most recent workspace.' },
]

export const CREATE_MENU = [
  { number: 1, label: 'Future Idea', action: 'future-idea', detail: 'Capture something worth coming back to.' },
  { number: 2, label: 'News Brief', action: 'news-brief', detail: 'Turn a Signal into a concise editorial brief.' },
  { number: 3, label: 'Guide', action: 'guide', detail: 'Build a structured Geek Guide.' },
  { number: 4, label: 'Review', action: 'review', detail: 'Start a TV, movie, or product review.' },
]

export const NEWS_MENU = [
  { number: 1, label: 'Top five', action: 'news-top', detail: 'The strongest Signals in the field.' },
  { number: 2, label: 'By category', action: 'news-category', detail: 'TV, Movies, Comics, Games, and Tech.' },
  { number: 3, label: 'Latest', action: 'news-latest', detail: 'The newest movement from your sources.' },
]

export function getGreeting(date = new Date()) {
  const hour = date.getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function menuForContext(context) {
  if (context === 'create') return CREATE_MENU
  if (context === 'news') return NEWS_MENU
  return MAIN_MENU
}

export function resolveShellInput(value, context = 'home') {
  const input = String(value ?? '').trim()

  if (!input) return { type: 'empty' }

  if (input.startsWith('/')) {
    const command = input.toLowerCase().split(/\s+/)[0]

    if (SHELL_COMMANDS.includes(command)) {
      return {
        type: 'command',
        action: command.slice(1),
        label: command,
      }
    }

    return {
      type: 'unknown-command',
      label: command,
    }
  }

  if (/^\d+$/.test(input)) {
    const number = Number(input)
    const option = menuForContext(context).find((item) => item.number === number)

    if (option) {
      return {
        type: 'choice',
        action: option.action,
        label: option.label,
        number,
      }
    }

    return {
      type: 'unknown-choice',
      number,
    }
  }

  return {
    type: 'text',
    value: input,
  }
}
