// Stable finish identities for v2-pro.
// v1 stored raw hex in `project.finish` (e.g. '#b9966c').
// v2 uses stable IDs ('oak', 'walnut', ...) so materials, textures,
// cut lists and translations never depend on a hex string.

export type FinishId =
  | 'oak'
  | 'walnut'
  | 'white'
  | 'graphite'
  | 'glass'
  | 'mirror'
  | 'linen'
  | 'concrete'

export type FinishDef = {
  id: FinishId
  /** Base color used until PBR textures land. */
  color: string
  /** Texture slot name for future PBR sets (null = flat color for now). */
  texture: string | null
  /** Whether this finish is in the v1-compatible core set. */
  core: boolean
}

export const FINISHES_V2: readonly FinishDef[] = [
  { id: 'oak', color: '#b9966c', texture: 'wood-oak', core: true },
  { id: 'walnut', color: '#75513d', texture: 'wood-walnut', core: true },
  { id: 'white', color: '#e8e4dc', texture: null, core: true },
  { id: 'graphite', color: '#4d4b49', texture: null, core: true },
  // Stubs for the full-pro catalog — color + slot reserved, textures land later.
  { id: 'glass', color: '#c9d8dd', texture: 'glass-clear', core: false },
  { id: 'mirror', color: '#dfe3e6', texture: 'mirror', core: false },
  { id: 'linen', color: '#d9d2c4', texture: 'fabric-linen', core: false },
  { id: 'concrete', color: '#a9a9a6', texture: 'stone-concrete', core: false },
] as const

const HEX_TO_ID: Record<string, FinishId> = {
  '#b9966c': 'oak',
  '#75513d': 'walnut',
  '#e8e4dc': 'white',
  '#4d4b49': 'graphite',
}

const ID_TO_HEX: Record<FinishId, string> = Object.fromEntries(
  FINISHES_V2.map((finish) => [finish.id, finish.color]),
) as Record<FinishId, string>

/**
 * Migrate an old file value (hex like '#b9966c' or an id like 'oak')
 * to a stable finish ID. Unknown values fall back to 'oak'.
 */
export function migrateHexToId(value: string): FinishId {
  if (!value) return 'oak'
  const lower = value.toLowerCase()
  // Already a stable id?
  if ((FINISHES_V2 as readonly FinishDef[]).some((finish) => finish.id === lower)) {
    return lower as FinishId
  }
  return HEX_TO_ID[lower] ?? 'oak'
}

/** Resolve a finish ID (or legacy hex) to its full definition. */
export function resolveFinish(value: string): FinishDef {
  const id = migrateHexToId(value)
  return FINISHES_V2.find((finish) => finish.id === id) ?? FINISHES_V2[0]
}

/** Get the display color for a finish ID (or legacy hex). */
export function finishColor(value: string): string {
  return resolveFinish(value).color
}

/** Backwards-compatible lookup: stable ID -> legacy hex. */
export function finishIdToHex(id: FinishId): string {
  return ID_TO_HEX[id] ?? ID_TO_HEX.oak
}
