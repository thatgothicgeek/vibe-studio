// Selected Tabler Icons adapted as local React SVG components.
// Tabler Icons are MIT licensed.
// Copyright (c) 2018-2026 Tabler contributors.
// Source: https://github.com/tabler/tabler-icons

function StudioIcon({ size = 24, strokeWidth = 1.8, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconYinYang(props) {
  return (
    <StudioIcon {...props}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 3a4.5 4.5 0 0 0 0 9a4.5 4.5 0 0 1 0 9" />
      <path d="M11.5 7.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0" fill="currentColor" />
      <path d="M11.5 16.5a.5 .5 0 1 0 1 0a.5 .5 0 1 0 -1 0" fill="currentColor" />
    </StudioIcon>
  )
}

export function IconHome(props) {
  return (
    <StudioIcon {...props}>
      <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
      <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
    </StudioIcon>
  )
}

export function IconSignal(props) {
  return (
    <StudioIcon {...props}>
      <path d="M21 12h-8a1 1 0 1 0 -1 1v8a9 9 0 0 0 9 -9" />
      <path d="M16 9a5 5 0 1 0 -7 7" />
      <path d="M20.486 9a9 9 0 1 0 -11.482 11.495" />
    </StudioIcon>
  )
}

export function IconCreate(props) {
  return (
    <StudioIcon {...props}>
      <path d="M12 3c7.2 0 9 1.8 9 9c0 7.2 -1.8 9 -9 9c-7.2 0 -9 -1.8 -9 -9c0 -7.2 1.8 -9 9 -9" />
      <path d="M15 12h-6" />
      <path d="M12 9v6" />
    </StudioIcon>
  )
}

export function IconDesk(props) {
  return (
    <StudioIcon {...props}>
      <path d="M4 4l6 0" />
      <path d="M14 4l6 0" />
      <path d="M4 10a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2l0 -8" />
      <path d="M14 10a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2l0 -2" />
    </StudioIcon>
  )
}

export function IconLibrary(props) {
  return (
    <StudioIcon {...props}>
      <path d="M7 5.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" />
      <path d="M4.012 7.26a2.005 2.005 0 0 0 -1.012 1.737v10c0 1.1 .9 2 2 2h10c.75 0 1.158 -.385 1.5 -1" />
      <path d="M11 7h5" />
      <path d="M11 10h6" />
      <path d="M11 13h3" />
    </StudioIcon>
  )
}

export function IconSearch(props) {
  return (
    <StudioIcon {...props}>
      <path d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
      <path d="M21 21l-6 -6" />
    </StudioIcon>
  )
}

export function IconLogout(props) {
  return (
    <StudioIcon {...props}>
      <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
      <path d="M9 12h12l-3 -3" />
      <path d="M18 15l3 -3" />
    </StudioIcon>
  )
}

export function IconStatus(props) {
  return (
    <StudioIcon {...props}>
      <path d="M3 12h4.5l1.5 -6l4 12l2 -9l1.5 3h4.5" />
    </StudioIcon>
  )
}


export function IconTV(props) {
  return (
    <StudioIcon {...props}>
      <path d="M3 9a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2l0 -9" />
      <path d="M16 3l-4 4l-4 -4" />
    </StudioIcon>
  )
}

export function IconMovie(props) {
  return (
    <StudioIcon {...props}>
      <path d="M4 6a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12" />
      <path d="M8 4l0 16" />
      <path d="M16 4l0 16" />
      <path d="M4 8l4 0" />
      <path d="M4 16l4 0" />
      <path d="M4 12l16 0" />
      <path d="M16 8l4 0" />
      <path d="M16 16l4 0" />
    </StudioIcon>
  )
}

export function IconComics(props) {
  return (
    <StudioIcon {...props}>
      <path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12" />
      <path d="M19 16h-12a2 2 0 0 0 -2 2" />
      <path d="M9 8h6" />
    </StudioIcon>
  )
}

export function IconGames(props) {
  return (
    <StudioIcon {...props}>
      <path d="M12 5h3.5a5 5 0 0 1 0 10h-5.5l-4.015 4.227a2.3 2.3 0 0 1 -3.923 -2.035l1.634 -8.173a5 5 0 0 1 4.904 -4.019h3.4" />
      <path d="M14 15l4.07 4.284a2.3 2.3 0 0 0 3.925 -2.023l-1.6 -8.232" />
      <path d="M8 9v2" />
      <path d="M7 10h2" />
      <path d="M14 10h2" />
    </StudioIcon>
  )
}

export function IconTech(props) {
  return (
    <StudioIcon {...props}>
      <path d="M5 6a1 1 0 0 1 1 -1h12a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-12a1 1 0 0 1 -1 -1l0 -12" />
      <path d="M9 9h6v6h-6l0 -6" />
      <path d="M3 10h2" />
      <path d="M3 14h2" />
      <path d="M10 3v2" />
      <path d="M14 3v2" />
      <path d="M21 10h-2" />
      <path d="M21 14h-2" />
      <path d="M14 21v-2" />
      <path d="M10 21v-2" />
    </StudioIcon>
  )
}

export function IconRefresh(props) {
  return (
    <StudioIcon {...props}>
      <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
    </StudioIcon>
  )
}

export function IconCompassProcess(props) {
  return (
    <StudioIcon {...props}>
      <path d="M6 21l15 -15l-3 -3l-15 15l3 3" />
      <path d="M15 6l3 3" />
      <path d="M9 3a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
      <path d="M19 13a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
    </StudioIcon>
  )
}

export function IconSend(props) {
  return (
    <StudioIcon {...props}>
      <path d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124" />
      <path d="M6.5 12h14.5" />
    </StudioIcon>
  )
}

export function IconExternalLink(props) {
  return (
    <StudioIcon {...props}>
      <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
      <path d="M11 13l9 -9" />
      <path d="M15 4h5v5" />
    </StudioIcon>
  )
}

export function IconClock(props) {
  return (
    <StudioIcon {...props}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
      <path d="M12 7v5l3 3" />
    </StudioIcon>
  )
}

export function IconChevronDown(props) {
  return (
    <StudioIcon {...props}>
      <path d="M6 9l6 6l6 -6" />
    </StudioIcon>
  )
}
