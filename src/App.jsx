import { useState } from 'react'
import { BookOpen, Clapperboard, Laptop, Mail, Orbit, Tv } from 'lucide-react'
import './App.css'

const categories = [
  { label: 'TV', Icon: Tv },
  { label: 'MOVIES', Icon: Clapperboard },
  { label: 'COMICS', Icon: BookOpen },
  { label: 'TECH', Icon: Laptop },
  { label: 'BEYOND', Icon: Orbit },
]

const KIT_FORM_ENDPOINT = 'https://app.kit.com/forms/9927128/subscriptions'
const KIT_FORM_UID = '4fd6e59aa9'

function Logo() {
  return (
    <h1 className="logo">
      <span className="sr-only">The Geek Guide</span>
      <svg viewBox="0 0 336 306" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="logo-frame" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset=".52" stopColor="#df5ca8" />
            <stop offset="1" stopColor="#61d7e4" />
          </linearGradient>
        </defs>
        <rect className="logo-interior" x="6" y="6" width="324" height="294" />
        <rect className="logo-frame" x="6" y="6" width="324" height="294" />
        <text x="29" y="54" className="logo-the">THE</text>
        <text x="25" y="168" className="logo-g">G</text>
        <text x="101" y="168" textLength="210" lengthAdjust="spacingAndGlyphs" className="logo-rest">EEK</text>
        <text x="25" y="279" className="logo-g">G</text>
        <text x="101" y="279" textLength="210" lengthAdjust="spacingAndGlyphs" className="logo-rest">UIDE</text>
      </svg>
    </h1>
  )
}

function Environment() {
  return (
    <div className="environment" aria-hidden="true">
      <div className="stars stars-one" />
      <div className="stars stars-two" />
      <div className="environment-shade" />
    </div>
  )
}

function CategoryRow() {
  return (
    <ul className="categories" aria-label="The Geek Guide categories">
      {categories.map(({ label, Icon }, index) => (
        <li key={label}>
          <Icon size={22} strokeWidth={1.35} aria-hidden="true" className={index % 2 ? 'accent-purple' : 'accent-cyan'} />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}

function SignupForm() {
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (status === 'submitting') return

    setStatus('submitting')
    setErrorMessage('')

    const formData = new FormData(event.currentTarget)
    const submission = new URLSearchParams()
    submission.set('email_address', String(formData.get('email_address') || ''))

    try {
      const response = await fetch(KIT_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: submission.toString(),
      })

      if (!response.ok) throw new Error('Kit rejected the signup request.')
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMessage('We couldn’t save your email. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <section className="signup signup-success" aria-labelledby="signup-success-title" role="status">
        <h3 id="signup-success-title">Check your inbox 📬</h3>
        <p>One more step. Confirm your email to join The Geek Guide launch list.</p>
      </section>
    )
  }

  return (
    <form className="signup" action={KIT_FORM_ENDPOINT} method="post" data-sv-form="9927128" data-uid={KIT_FORM_UID} onSubmit={handleSubmit}>
      <label htmlFor="email">Join the launch list</label>
      <div className="signup-controls">
        <div className="email-field">
          <Mail size={18} strokeWidth={1.5} aria-hidden="true" />
          <input id="email" name="email_address" type="email" autoComplete="email" placeholder="Your email address" required aria-describedby="signup-note" />
        </div>
        <button type="submit" aria-label="Keep me posted" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
          <span className="button-label">{status === 'submitting' ? 'Joining...' : 'Keep Me Posted'}</span>
          <span className="button-arrow" aria-hidden="true">↗</span>
        </button>
      </div>
      <p id="signup-note" className={`signup-note${status === 'error' ? ' signup-error' : ''}`} role={status === 'error' ? 'alert' : 'status'}>
        {status === 'error' ? errorMessage : 'We’ll send a confirmation email to complete your signup.'}
      </p>
    </form>
  )
}

function App() {
  return (
    <div className="page">
      <Environment />
      <main>
        <Logo />
        <p className="brand-line">Culture <span>/</span> Curiosity <span>/</span> What&apos;s Next</p>
        <section className="announcement" aria-labelledby="coming-soon">
          <h2 id="coming-soon">Coming Soon</h2>
          <p className="intro">Your guide to what&apos;s worth watching, reading, playing, and knowing.</p>
        </section>
        <CategoryRow />
        <SignupForm />
      </main>
      <footer>TheGeek.Guide</footer>
    </div>
  )
}

export default App
