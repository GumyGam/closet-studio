// Modules + door catalog for v2-pro (front-elevation slice).
// Pure data + fit checks — no UI here. Units are mm everywhere.
// (Think of this file as the "menu" of real-life options; Plan2D.tsx
// draws them, App.tsx lets you add/remove them.)

import type { Dimensions } from '../closet'

// --- Interior modules ------------------------------------------------------
// 14 real-life options from the spec (Section 2: drawers + interior).

export type ModuleTypeId =
  | 'doubleHang'
  | 'longHang'
  | 'drawers3'
  | 'drawersDeep'
  | 'shoeFlat'
  | 'shoeTilt'
  | 'basket'
  | 'valetRod'
  | 'tieRack'
  | 'trouserPullout'
  | 'shelfAdjustable'
  | 'glassShelf'
  | 'ledStrip'
  | 'interiorMirror'

export type ModuleDef = {
  id: ModuleTypeId
  /** English label (translate() has no keys for these yet — see t() fallback). */
  label: string
  /** Minimum carcass size this module needs (mm). */
  minW: number
  minH: number
  minD: number
  /** Short why-it-matters hint shown in the list. */
  hint: string
  /** Flat color used for the 2D front-elevation rect. */
  color: string
}

export const MODULE_CATALOG: readonly ModuleDef[] = [
  { id: 'doubleHang', label: 'Double hang (2 rods)', minW: 500, minH: 1500, minD: 500, hint: 'Two rails for shirts', color: '#c9b8a3' },
  { id: 'longHang', label: 'Long hang (dresses)', minW: 500, minH: 1400, minD: 500, hint: 'Full-length rail', color: '#bccfd4' },
  { id: 'drawers3', label: '3 drawers', minW: 400, minH: 450, minD: 400, hint: 'Standard 150 mm fronts', color: '#d9c7a7' },
  { id: 'drawersDeep', label: 'Deep drawers', minW: 450, minH: 500, minD: 450, hint: '250–300 mm deep boxes', color: '#d3b58e' },
  { id: 'shoeFlat', label: 'Shoe shelves (flat)', minW: 500, minH: 200, minD: 350, hint: 'Needs 350+ mm depth', color: '#c4cdbb' },
  { id: 'shoeTilt', label: 'Shoe shelves (tilted)', minW: 500, minH: 250, minD: 350, hint: 'Angled display rows', color: '#b3c6b0' },
  { id: 'basket', label: 'Pull-out basket', minW: 400, minH: 250, minD: 400, hint: 'Wire or canvas', color: '#cfc3b4' },
  { id: 'valetRod', label: 'Valet pull-out rod', minW: 120, minH: 100, minD: 400, hint: 'Temporary hang hook', color: '#c2cdd6' },
  { id: 'tieRack', label: 'Tie / belt rack', minW: 120, minH: 100, minD: 350, hint: 'Side pull-out', color: '#c9c2d4' },
  { id: 'trouserPullout', label: 'Trouser pull-out', minW: 400, minH: 150, minD: 450, hint: 'Needs 450+ mm depth', color: '#b9c4d6' },
  { id: 'shelfAdjustable', label: 'Adjustable shelf', minW: 300, minH: 300, minD: 250, hint: '32 mm system holes', color: '#d8d2c2' },
  { id: 'glassShelf', label: 'Glass shelf', minW: 300, minH: 50, minD: 250, hint: 'Display shelf', color: '#cfe0e4' },
  { id: 'ledStrip', label: 'LED strip', minW: 200, minH: 30, minD: 200, hint: 'Needs power nearby', color: '#f0e3b2' },
  { id: 'interiorMirror', label: 'Interior mirror', minW: 300, minH: 800, minD: 50, hint: 'Mounts on door/back', color: '#dde4e8' },
] as const

export function moduleDef(id: ModuleTypeId): ModuleDef {
  const found = MODULE_CATALOG.find((entry) => entry.id === id)
  // Catalog is closed, so this fallback is only for old/broken save files.
  return found ?? { id, label: id, minW: 300, minH: 300, minD: 200, hint: '', color: '#cccccc' }
}

/** One placed module. `zone` is reserved for the drag-to-position slice. */
export type ModuleInstance = {
  id: string
  type: ModuleTypeId
  /** Optional explicit rect in carcass mm (x/y from bottom-left). Absent = auto-stack. */
  zone?: { x: number; y: number; w: number; h: number }
}

export type FitResult = { ok: boolean; reasons: string[] }

/** Does this module fit the current carcass? Returns reasons when it doesn't. */
export function fitsModule(type: ModuleTypeId, dims: Dimensions): FitResult {
  const def = moduleDef(type)
  const reasons: string[] = []
  if (dims.width < def.minW) reasons.push(`needs ${def.minW} mm width`)
  if (dims.height < def.minH) reasons.push(`needs ${def.minH} mm height`)
  if (dims.depth < def.minD) reasons.push(`needs ${def.minD} mm depth`)
  return { ok: reasons.length === 0, reasons }
}

/** Per-module fit warnings for the design-check area (English + dims). */
export function moduleWarnings(modules: readonly ModuleInstance[], dims: Dimensions): string[] {
  const notes: string[] = []
  for (const instance of modules) {
    const def = moduleDef(instance.type)
    const fit = fitsModule(instance.type, dims)
    if (!fit.ok) {
      notes.push(`"${def.label}" too big: ${fit.reasons.join(', ')} (carcass ${dims.width}×${dims.height}×${dims.depth} mm).`)
    }
  }
  return notes
}

/** Tiny id helper (no new deps — avoids crypto.randomUUID on old browsers). */
export function newModuleId(): string {
  return `m${Date.now().toString(36)}${Math.floor(Math.random() * 10000).toString(36)}`
}

/** One auto-stacked band in the front elevation (mm from interior bottom). */
export type ModuleBand = { instance: ModuleInstance; y: number; h: number }

/**
 * Auto-stack layout: each module gets at least its catalog minH,
 * shrinking proportionally if the stack is taller than the interior.
 * Modules with an explicit `zone` (future drag slice) keep their rect.
 */
export function stackModules(
  modules: readonly ModuleInstance[],
  interiorH: number,
): ModuleBand[] {
  if (!modules.length || interiorH <= 0) return []
  const mins = modules.map((instance) => Math.max(60, moduleDef(instance.type).minH))
  const total = mins.reduce((sum, min) => sum + min, 0)
  const scale = total > interiorH ? interiorH / total : 1
  // Fill leftover space evenly so bands always cover the interior.
  const heights = mins.map((min) => min * scale)
  const leftover = interiorH - heights.reduce((sum, h) => sum + h, 0)
  const extra = leftover > 0 ? leftover / heights.length : 0
  let cursor = 0
  return modules.map((instance, index) => {
    const h = heights[index] + extra
    const band = { instance, y: cursor, h }
    cursor += h
    return band
  })
}

/** Starter set for brand-new projects (both fit the 1800×2200×600 default). */
export function defaultModules(): ModuleInstance[] {
  return [
    { id: newModuleId(), type: 'doubleHang' },
    { id: newModuleId(), type: 'drawers3' },
  ]
}

// --- Door variants ---------------------------------------------------------
// 10 variants from the spec (Section 2: doors) + handle options.

export type DoorVariantId =
  | 'open'
  | 'doubleHinged'
  | 'singleL'
  | 'singleR'
  | 'sliding2'
  | 'sliding3'
  | 'bifold'
  | 'glass'
  | 'mirror'
  | 'louvered'

export type DoorMechanics = 'none' | 'hinged' | 'sliding' | 'bifold'

export type DoorVariantDef = {
  id: DoorVariantId
  label: string
  mechanics: DoorMechanics
  /** Front clearance the doors need to open (mm). 0 = no swing. */
  clearanceFrontMm: number
  /** Extra carcass depth for tracks (sliding only, mm). */
  trackDepthExtraMm: number
  hint: string
}

export const DOOR_VARIANTS: readonly DoorVariantDef[] = [
  { id: 'open', label: 'Open (no doors)', mechanics: 'none', clearanceFrontMm: 0, trackDepthExtraMm: 0, hint: 'Walk-in look' },
  { id: 'doubleHinged', label: 'Double hinged', mechanics: 'hinged', clearanceFrontMm: 500, trackDepthExtraMm: 0, hint: 'Needs 500 mm in front' },
  { id: 'singleL', label: 'Single hinged (left)', mechanics: 'hinged', clearanceFrontMm: 500, trackDepthExtraMm: 0, hint: 'One leaf, left hinge' },
  { id: 'singleR', label: 'Single hinged (right)', mechanics: 'hinged', clearanceFrontMm: 500, trackDepthExtraMm: 0, hint: 'One leaf, right hinge' },
  { id: 'sliding2', label: 'Sliding (2 doors)', mechanics: 'sliding', clearanceFrontMm: 0, trackDepthExtraMm: 25, hint: 'Track adds 25 mm depth' },
  { id: 'sliding3', label: 'Sliding (3 doors)', mechanics: 'sliding', clearanceFrontMm: 0, trackDepthExtraMm: 25, hint: 'Track adds 25 mm depth' },
  { id: 'bifold', label: 'Bifold', mechanics: 'bifold', clearanceFrontMm: 450, trackDepthExtraMm: 0, hint: 'Folds, small swing' },
  { id: 'glass', label: 'Glass front (hinged)', mechanics: 'hinged', clearanceFrontMm: 500, trackDepthExtraMm: 0, hint: 'See-through fronts' },
  { id: 'mirror', label: 'Mirror front (hinged)', mechanics: 'hinged', clearanceFrontMm: 500, trackDepthExtraMm: 0, hint: 'Full-length mirror' },
  { id: 'louvered', label: 'Louvered (hinged)', mechanics: 'hinged', clearanceFrontMm: 500, trackDepthExtraMm: 0, hint: 'Slatted airflow fronts' },
] as const

export function doorVariantDef(id: DoorVariantId): DoorVariantDef {
  const found = DOOR_VARIANTS.find((entry) => entry.id === id)
  return found ?? DOOR_VARIANTS[1]
}

/** Clearance note for the design-check area (empty string = nothing to warn). */
export function doorClearanceNote(variant: DoorVariantId): string {
  const def = doorVariantDef(variant)
  if (def.mechanics === 'hinged') return `"${def.label}" needs ${def.clearanceFrontMm} mm clear space in front to swing open.`
  if (def.mechanics === 'bifold') return `"${def.label}" needs ${def.clearanceFrontMm} mm clear space in front to fold open.`
  if (def.mechanics === 'sliding') return `"${def.label}" needs a track (+${def.trackDepthExtraMm} mm depth) — no swing space needed.`
  return ''
}

// --- Handles ---------------------------------------------------------------

export type HandleId = 'bar' | 'knob' | 'recessed' | 'push'

export const HANDLE_OPTIONS: readonly { id: HandleId; label: string }[] = [
  { id: 'bar', label: 'Bar handle' },
  { id: 'knob', label: 'Knob' },
  { id: 'recessed', label: 'Recessed' },
  { id: 'push', label: 'Push-to-open' },
] as const
