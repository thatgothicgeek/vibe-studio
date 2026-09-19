const lockIcon = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <rect width="18" height="11" x="3" y="11" rx="2"></rect>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  <circle cx="12" cy="16" r="1"></circle>
</svg>
`

const arrowIcon = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M5 12h14"></path>
  <path d="m13 6 6 6-6 6"></path>
</svg>
`

export function renderLoginPage({ error = false } = {}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#090b13">
<title>Vibe Studio</title>
<style>
:root {
  color-scheme: dark;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #090b13;
  color: #f4f5fa;
}
* { box-sizing: border-box; }
html, body { min-height: 100%; margin: 0; }
body {
  min-height: 100dvh;
  overflow-x: hidden;
  background:
    radial-gradient(circle at 18% 8%, rgba(138, 92, 246, .18), transparent 32rem),
    radial-gradient(circle at 84% 82%, rgba(22, 210, 226, .12), transparent 34rem),
    linear-gradient(160deg, #0b0d17 0%, #080a11 46%, #10101b 100%);
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .24;
  background-image:
    linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(to bottom, black, transparent 82%);
}
.login-shell {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 28px 18px;
}
.login-card {
  position: relative;
  width: min(100%, 430px);
  padding: clamp(28px, 7vw, 42px);
  border: 1px solid rgba(141, 119, 255, .34);
  border-radius: 28px;
  background:
    linear-gradient(145deg, rgba(23, 25, 39, .96), rgba(13, 15, 26, .94));
  box-shadow:
    0 0 0 1px rgba(255,255,255,.025) inset,
    0 0 36px rgba(128, 88, 255, .11),
    0 30px 80px rgba(0,0,0,.48);
  backdrop-filter: blur(16px);
}
.login-card::before {
  content: "";
  position: absolute;
  inset: -1px;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(
    115deg,
    rgba(150, 91, 255, .55),
    transparent 35%,
    transparent 66%,
    rgba(29, 208, 229, .4)
  );
  filter: blur(18px);
  opacity: .25;
}
.brand-row {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 34px;
}
.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(111, 211, 229, .5);
  border-radius: 13px;
  color: #7ce4ee;
  background: rgba(17, 35, 47, .56);
  box-shadow: 0 0 20px rgba(65, 216, 232, .12);
}
.brand-mark svg,
.login-button svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.brand-copy strong {
  display: block;
  font-size: 13px;
  letter-spacing: .13em;
}
.brand-copy span {
  display: block;
  margin-top: 4px;
  color: #74798d;
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-size: clamp(31px, 8vw, 42px);
  line-height: 1.02;
  letter-spacing: -.045em;
}
.intro {
  margin: 14px 0 30px;
  max-width: 33ch;
  color: #8f94a8;
  font-size: 14px;
  line-height: 1.65;
}
form {
  display: grid;
  gap: 11px;
}
label {
  color: #aaadbd;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
}
input {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border: 1px solid #343747;
  border-radius: 15px;
  outline: none;
  background: rgba(7, 9, 16, .72);
  color: #f4f5fa;
  font: inherit;
  transition: border-color .18s ease, box-shadow .18s ease;
}
input:focus {
  border-color: #7d6cff;
  box-shadow:
    0 0 0 3px rgba(125,108,255,.12),
    0 0 24px rgba(125,108,255,.08);
}
.login-button {
  display: flex;
  width: 100%;
  min-height: 52px;
  margin-top: 8px;
  padding: 0 18px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid rgba(127, 108, 255, .6);
  border-radius: 15px;
  background:
    linear-gradient(135deg, rgba(121,87,235,.95), rgba(76,70,190,.95));
  color: white;
  font: inherit;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: .03em;
  cursor: pointer;
  box-shadow: 0 0 25px rgba(112, 82, 232, .15);
}
.login-button:hover {
  filter: brightness(1.08);
}
.login-error {
  margin: 0 0 17px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 106, 151, .32);
  border-radius: 13px;
  background: rgba(136, 39, 72, .14);
  color: #ffc1d5;
  font-size: 12px;
  line-height: 1.5;
}
.footer {
  margin: 28px 0 0;
  color: #555a6c;
  font-size: 10px;
  letter-spacing: .08em;
  text-align: center;
  text-transform: uppercase;
}
@media (max-width: 480px) {
  .login-shell { padding: 18px 14px; }
  .login-card { border-radius: 23px; }
}
@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}
</style>
</head>
<body>
<main class="login-shell">
  <section class="login-card">
    <div class="brand-row">
      <div class="brand-mark">${lockIcon}</div>
      <div class="brand-copy">
        <strong>VIBE STUDIO</strong>
        <span>Private editorial system</span>
      </div>
    </div>

    <h1>Welcome back.</h1>
    <p class="intro">Sign in to your private workspace for Signal, Discover, and The Geek Guide.</p>

    ${error ? '<p class="login-error" role="alert">Unable to sign in. Check your password and try again.</p>' : ''}

    <form method="post" action="/studio/login">
      <label for="password">Studio password</label>
      <input
        id="password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
        autofocus
      >
      <button class="login-button" type="submit">
        Enter Studio
        ${arrowIcon}
      </button>
    </form>

    <p class="footer">The Geek Guide / Private workspace</p>
  </section>
</main>
</body>
</html>`
}
