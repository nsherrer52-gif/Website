/**
 * Tiny WebAudio beeper for the rest timer — no audio asset needed.
 *
 * Browsers only allow audio that originates from a user gesture, so call
 * primeAudio() from a tap handler (we use the set "done" tap that starts the
 * rest timer); beep() can then play later when the countdown ends.
 */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  try {
    ctx ??= new (window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    return ctx
  } catch {
    return null
  }
}

/** Create/resume the audio context during a user gesture. */
export function primeAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

/** Two short rising pulses. */
export function beep() {
  const c = getCtx()
  if (!c || c.state !== 'running') return
  const t0 = c.currentTime
  const pulses: [number, number, number][] = [
    [0, 0.15, 880],
    [0.22, 0.2, 1175],
  ]
  for (const [start, dur, freq] of pulses) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t0 + start)
    gain.gain.exponentialRampToValueAtTime(0.35, t0 + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur)
    osc.connect(gain).connect(c.destination)
    osc.start(t0 + start)
    osc.stop(t0 + start + dur + 0.05)
  }
}
