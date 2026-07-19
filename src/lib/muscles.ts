import type { MuscleId, MuscleTarget } from '../types'

// ---------------------------------------------------------------------------
// The fixed muscle taxonomy. ~15 groups, organized into regions for display.
// This lives in code (not user data) so the body map and library can rely on it.
// ---------------------------------------------------------------------------

export type Region = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Legs' | 'Core'

export interface Muscle {
  id: MuscleId
  name: string
  region: Region
}

export const MUSCLES: Muscle[] = [
  { id: 'chest', name: 'Chest', region: 'Chest' },
  { id: 'lats', name: 'Lats', region: 'Back' },
  { id: 'upperBack', name: 'Upper Back', region: 'Back' },
  { id: 'traps', name: 'Traps', region: 'Back' },
  { id: 'frontDelts', name: 'Front Delts', region: 'Shoulders' },
  { id: 'sideDelts', name: 'Side Delts', region: 'Shoulders' },
  { id: 'rearDelts', name: 'Rear Delts', region: 'Shoulders' },
  { id: 'biceps', name: 'Biceps', region: 'Arms' },
  { id: 'triceps', name: 'Triceps', region: 'Arms' },
  { id: 'forearms', name: 'Forearms', region: 'Arms' },
  { id: 'quads', name: 'Quads', region: 'Legs' },
  { id: 'hamstrings', name: 'Hamstrings', region: 'Legs' },
  { id: 'glutes', name: 'Glutes', region: 'Legs' },
  { id: 'calves', name: 'Calves', region: 'Legs' },
  { id: 'abs', name: 'Abs', region: 'Core' },
]

export const REGION_ORDER: Region[] = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core']

export const MUSCLE_BY_ID: Record<MuscleId, Muscle> = Object.fromEntries(
  MUSCLES.map((m) => [m.id, m]),
)

/**
 * Tag color per region (RP-style colored muscle chips). Always shown WITH the
 * muscle name — color is reinforcement, never the only signal.
 */
export const REGION_COLORS: Record<Region, string> = {
  Chest: '#fb923c', // orange
  Back: '#38bdf8', // cyan
  Shoulders: '#c084fc', // purple
  Arms: '#f472b6', // pink
  Legs: '#a3e635', // lime
  Core: '#fbbf24', // amber
}

export function muscleRegionColor(id: MuscleId): string {
  const m = MUSCLE_BY_ID[id]
  return m ? REGION_COLORS[m.region] : '#8c95a3'
}

export function muscleName(id: MuscleId): string {
  return MUSCLE_BY_ID[id]?.name ?? id
}

/** Muscles grouped by region, in display order. */
export function musclesByRegion(): { region: Region; muscles: Muscle[] }[] {
  return REGION_ORDER.map((region) => ({
    region,
    muscles: MUSCLES.filter((m) => m.region === region),
  }))
}

// --- Weekly volume targets --------------------------------------------------

const BIG = { min: 10, max: 20 }
const MED = { min: 8, max: 16 }
const SMALL = { min: 6, max: 12 }

export const DEFAULT_MUSCLE_TARGETS: Record<MuscleId, MuscleTarget> = {
  chest: BIG,
  lats: BIG,
  upperBack: BIG,
  quads: BIG,
  hamstrings: BIG,
  glutes: BIG,
  frontDelts: MED,
  sideDelts: MED,
  biceps: MED,
  triceps: MED,
  traps: SMALL,
  rearDelts: SMALL,
  forearms: SMALL,
  calves: SMALL,
  abs: SMALL,
}

// --- Heat-map coloring ------------------------------------------------------

export type VolumeStatus = 'none' | 'under' | 'in' | 'over'

export function volumeStatus(sets: number, target: MuscleTarget | undefined): VolumeStatus {
  if (sets <= 0) return 'none'
  if (!target) return sets > 0 ? 'in' : 'none'
  if (sets < target.min) return 'under'
  if (sets <= target.max) return 'in'
  return 'over'
}

const EMPTY = '#242933'
const UNDER_LO = '#2c3a1a' // dark olive, ramps toward the accent
const UNDER_HI = '#84cc16' // lime-600
const IN = '#a3e635' // lime accent
const OVER = '#f59e0b' // amber
const WAY_OVER = '#f43f5e' // rose

/** Solid status color, used for bars and legends. */
export function statusColor(status: VolumeStatus): string {
  switch (status) {
    case 'none':
      return '#39404d'
    case 'under':
      return UNDER_HI
    case 'in':
      return IN
    case 'over':
      return OVER
  }
}

/**
 * Heat color for the body map: ramps from dim olive → lime while under target,
 * solid lime when in range, amber/rose when over. `target` falls back to BIG.
 */
export function volumeToColor(sets: number, target: MuscleTarget | undefined): string {
  const t = target ?? BIG
  if (sets <= 0) return EMPTY
  if (sets < t.min) return lerpColor(UNDER_LO, UNDER_HI, t.min === 0 ? 1 : sets / t.min)
  if (sets <= t.max) return IN
  if (sets <= t.max * 1.5) return OVER
  return WAY_OVER
}

function lerpColor(a: string, b: string, tRaw: number): string {
  const t = Math.max(0, Math.min(1, tRaw))
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}
