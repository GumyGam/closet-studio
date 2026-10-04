// Canonical v2-pro model (exports slice).
// Fixes the corner-overlap bug in `dimensionsForPart`:
// sides run full-height; top/bottom fit BETWEEN the sides (width - 36).
// Also owns the fixed `buildCutList` (translated names, stable finish IDs,
// skip shelf when 0, grain/edgeband/finishedVsCut columns) so App.tsx
// cut-list/PDF/CSV match the 3D (W-36 joinery) instead of old closet.ts.
//
// Board rules (all mm):
// - board thickness 18, back 9, door 20
// - sides: 18 x H x D (full height)
// - top/bottom: (W - 36) x 18 x D (fit between sides)
// - back: (W - 36) x (H - 36) x 9
// - shelf: (W - 36) x 18 x (D - 25)
// - door: (round(W / 2) - 9) x (H - 18) x 20

import {
  copyProject,
  DEFAULT_DIMENSIONS,
  FINISHES,
  getWarnings,
  isClosetProject,
  isClosetProjectPackage,
  partLabels,
} from '../closet'
import type {
  ClosetProject as BaseClosetProject,
  ClosetProjectPackage,
  Dimensions,
  Language,
  PartId,
} from '../closet'
import type { DoorVariantId, HandleId, ModuleInstance } from './modules'
import { migrateHexToId } from './finishes'

/**
 * v2-pro project = v1 project + optional modules/doors.
 * Optional (not required) so old v1 save files still validate:
 * `isClosetProject` ignores unknown/missing extra fields, and
 * `copyProject` (JSON round-trip) preserves them automatically.
 */
export type ClosetProject = BaseClosetProject & {
  modules?: ModuleInstance[]
  doorVariant?: DoorVariantId
  handle?: HandleId
}

export {
  copyProject,
  DEFAULT_DIMENSIONS,
  FINISHES,
  getWarnings,
  isClosetProject,
  isClosetProjectPackage,
  partLabels,
}
export type { ClosetProjectPackage, Dimensions, Language, PartId }
export type { DoorVariantId, HandleId, ModuleInstance } from './modules'

/** Board + carcass constants (mm). */
export const BOARD_THICKNESS = 18
export const BACK_THICKNESS = 9
export const DOOR_THICKNESS = 20
export const SHELF_DEPTH_INSET = 25

/** Validation ranges carried over from v1 (mm). */
export const LIMITS = {
  width: { min: 300, max: 3600 },
  height: { min: 300, max: 3000 },
  depth: { min: 200, max: 1200 },
  shelves: { min: 0, max: 6 },
  partAxis: { min: 9, max: 3600 },
} as const

/**
 * Fixed per-part dimensions with corner-overlap joinery.
 * Same signature as v1 `dimensionsForPart` — drop-in replacement.
 */
export function dimensionsForPart(project: ClosetProject, part: PartId): Dimensions {
  const { width, height, depth } = project.dimensions
  const defaults: Record<PartId, Dimensions> = {
    left: { width: BOARD_THICKNESS, height, depth },
    right: { width: BOARD_THICKNESS, height, depth },
    // Fit between the sides so corners don't double-count 18mm each side.
    top: { width: width - BOARD_THICKNESS * 2, height: BOARD_THICKNESS, depth },
    bottom: { width: width - BOARD_THICKNESS * 2, height: BOARD_THICKNESS, depth },
    back: {
      width: width - BOARD_THICKNESS * 2,
      height: height - BOARD_THICKNESS * 2,
      depth: BACK_THICKNESS,
    },
    shelf: {
      width: width - BOARD_THICKNESS * 2,
      height: BOARD_THICKNESS,
      depth: depth - SHELF_DEPTH_INSET,
    },
    door: {
      width: Math.round(width / 2) - 9,
      height: height - BOARD_THICKNESS,
      depth: DOOR_THICKNESS,
    },
  }
  return { ...defaults[part], ...project.partOverrides[part] }
}

/**
 * One row of the carpenter cut list (all dims in mm).
 * - `part`: translated display name (via partLabels + language)
 * - `partId`: stable English ID for machines / CSV joins
 * - `material`: stable finish ID (e.g. 'oak'), never a hex string
 * - `grain` / `edgeband` / `finishedVsCut`: simple constants for now
 *   (no UI change); full per-edge banding lands with the catalog slice.
 */
export type CutListRow = {
  part: string
  partId: PartId
  quantity: number
  width_mm: number
  height_mm: number
  depth_mm: number
  material: string
  grain: 'along-longest'
  edgeband: '2mm-front'
  finishedVsCut: 'finished'
}

/**
 * Canonical cut list — matches 3D W-36 joinery.
 * Skips the shelf row when shelves=0 and the door row when doors=false.
 * Verify: default 1800W -> top/bottom width 1764 (1800 - 36).
 */
export function buildCutList(project: ClosetProject, language?: Language): CutListRow[] {
  const lang = language ?? project.language
  const finishId = migrateHexToId(project.finish)
  const row = (partId: PartId, quantity: number): CutListRow => {
    const dims = dimensionsForPart(project, partId)
    return {
      part: partLabels[partId][lang],
      partId,
      quantity,
      width_mm: dims.width,
      height_mm: dims.height,
      depth_mm: dims.depth,
      material: finishId,
      grain: 'along-longest',
      edgeband: '2mm-front',
      finishedVsCut: 'finished',
    }
  }
  const rows: CutListRow[] = [
    row('left', 1),
    row('right', 1),
    row('top', 1),
    row('bottom', 1),
    row('back', 1),
  ]
  // Skip zero-qty shelf (old closet.ts always emitted qty 0 — carpenter bug).
  if (project.shelves > 0) rows.push(row('shelf', project.shelves))
  if (project.doors) rows.push(row('door', 2))
  return rows
}
