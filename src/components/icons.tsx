/**
 * Minimal stroke icon set (24×24, stroke = currentColor). Replaces emoji so
 * the chrome reads as designed UI rather than text.
 */

function base(props: { className?: string }) {
  return {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: props.className ?? 'h-5 w-5',
  }
}

export function IconDumbbell(props: { className?: string }) {
  return (
    <svg {...base(props)}>
      <path d="M6.5 9v6M4 10v4M17.5 9v6M20 10v4M6.5 12h11" />
    </svg>
  )
}

export function IconHome(props: { className?: string }) {
  return (
    <svg {...base(props)}>
      <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5h-5v5H4z" />
    </svg>
  )
}

export function IconClipboard(props: { className?: string }) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7" />
    </svg>
  )
}

export function IconChart(props: { className?: string }) {
  return (
    <svg {...base(props)}>
      <path d="M4 19h16M6.5 15.5v-4M11 15.5V8M15.5 15.5v-6M20 15.5V5" />
    </svg>
  )
}

export function IconScale(props: { className?: string }) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9 9.5a4.5 3.5 0 0 1 6 0M12 8v1.5" />
    </svg>
  )
}

export function IconSliders(props: { className?: string }) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconTimer(props: { className?: string }) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 10v3.5l2.2 1.5M10 3h4" />
    </svg>
  )
}

export function IconCheckCircle(props: { className?: string }) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.4 2.4 4.6-5.4" />
    </svg>
  )
}
