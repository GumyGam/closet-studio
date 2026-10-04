// Hardware schedule stub for v2-pro (exports slice).
// Simple deterministic counts derived from the project config.
// No new deps. DXF per-panel output is deferred (see TODO below).
//
// Rules (documented, carpenter-readable):
// - handles: 2 per door leaf (double hinged pair = 2 leaves => 2 handles total?)
//   We count 1 handle per leaf => doors ? 2 : 0. Kept as `handles` for CSV clarity.
// - hinges: 2 per leaf => doors ? 4 : 0 (soft-close flag noted, SKU placeholder).
// - rods: 0 for now — modules/wardrobe-rod catalog not modeled yet in v1 config.
//   Returns 0 with a TODO so production JSON is explicit instead of guessing.

import type { ClosetProject } from '../closet'
import type { ModuleInstance } from './modules'

export type HardwareCounts = {
  handles: number
  hinges: number
  rods: number
  /** Human note for the carpenter / next slice. */
  note: string
}

/** Count handles: 1 per door leaf (double doors = 2 leaves). */
export function countHandles(project: ClosetProject): number {
  return project.doors ? 2 : 0
}

/** Count hinges: 2 per door leaf (double doors = 4). */
export function countHinges(project: ClosetProject): number {
  return project.doors ? 4 : 0
}

/** Count wardrobe rods: 0 until interior modules land (explicit stub). */
export function countRods(_project: ClosetProject): number {
  // TODO(DXF/hardware-pro): derive from hang modules (single/double hang,
  // valet, trouser pull-out) + bay width minus hardware. Needs catalog first.
  return 0
}

/** Full hardware schedule for production JSON + CSV. */
export function hardwareSchedule(project: ClosetProject): HardwareCounts {
  return {
    handles: countHandles(project),
    hinges: countHinges(project),
    rods: countRods(project),
    note: 'Stub counts: 1 handle/leaf, 2 hinges/leaf, rods 0 until modules land. Confirm SKU, soft-close, drill map before manufacture.',
  }
}

/** Rows for the hardware CSV export (SKU column is a placeholder ID). */
export function hardwareCsvRows(project: ClosetProject): Array<{ item: string; sku: string; quantity: number }> {
  const schedule = hardwareSchedule(project)
  return [
    { item: 'Handle', sku: 'HANDLE-BAR-128', quantity: schedule.handles },
    { item: 'Hinge (soft-close 110deg)', sku: 'HINGE-110-SC', quantity: schedule.hinges },
    { item: 'Wardrobe rod', sku: 'ROD-CHROME', quantity: schedule.rods },
  ].filter((row) => row.quantity > 0)
}

// --- Module hardware (appended for the export-engine slice; old imports unchanged) ---

/** Extra counts derived from interior modules (no door hardware here). */
export type ModuleHardwareCounts = {
  rods: number
  slides: number
  leds: number
}

/**
 * Count hardware implied by interior modules (pure, deterministic).
 * - rods: doubleHang 2, longHang 1, valetRod 1 (chrome rod + supports)
 * - slides: 2 per drawer box — drawers3 6, drawersDeep 4 (2 deep boxes),
 *   basket 2, trouserPullout 2 (side-mount pair each)
 * - leds: 1 per ledStrip module (strip + driver share noted in schedule note)
 * Unknown/other modules contribute 0.
 */
export function hardwareForModules(modules: readonly ModuleInstance[]): ModuleHardwareCounts {
  let rods = 0
  let slides = 0
  let leds = 0
  for (const module of modules) {
    switch (module.type) {
      case 'doubleHang':
        rods += 2
        break
      case 'longHang':
        rods += 1
        break
      case 'valetRod':
        rods += 1
        break
      case 'drawers3':
        slides += 6
        break
      case 'drawersDeep':
        slides += 4
        break
      case 'basket':
        slides += 2
        break
      case 'trouserPullout':
        slides += 2
        break
      case 'ledStrip':
        leds += 1
        break
      default:
        break
    }
  }
  return { rods, slides, leds }
}

/** Door counts (existing stub) merged with module counts. */
export type FullHardwareSchedule = {
  handles: number
  hinges: number
  rods: number
  slides: number
  leds: number
  /** Human note for the carpenter / next slice. */
  note: string
}

/**
 * Full schedule: existing door counts + module rods/slides/leds.
 * Backward compatible — `hardwareSchedule` above is untouched; old imports keep working.
 * Pass [] (default) when the project has no modules.
 */
export function fullHardwareSchedule(
  project: ClosetProject,
  modules: readonly ModuleInstance[] = [],
): FullHardwareSchedule {
  const base = hardwareSchedule(project)
  const extra = hardwareForModules(modules)
  return {
    handles: base.handles,
    hinges: base.hinges,
    rods: base.rods + extra.rods,
    slides: extra.slides,
    leds: extra.leds,
    note:
      'Door counts per hardwareSchedule stub + module rods/slides/led per catalog. Confirm SKU, soft-close, slide type, LED power before manufacture.',
  }
}
