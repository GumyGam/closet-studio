// 32mm cabinet-system drill map (pure function, no deps).
//
// The 32mm system is the carpenter standard for adjustable shelves:
// rows of 5mm holes spaced 32mm apart, so shelf pins can move in 32mm steps.
//
// Rules used here (documented for the cut-list / DXF handoff):
// - Two columns, inset 37mm from the front and back edges of the panel face.
//   For a side panel the "face width" w is the carcass depth (e.g. 600mm),
//   so columns sit at x = 37 and x = w - 37.
// - Rows every 32mm, starting 64mm from the top and bottom edges
//   (i.e. y = 64, 96, 128, ... up to h - 64). Y origin = panel bottom.
// - Only tall side panels (h > 400mm) get holes. Short panels (plinth,
//   small fillers) return [] — drilling them wastes machine time.
// - `adjustable` flag (e.g. a shelfAdjustable module is present) forces
//   holes even for shorter panels: pass { adjustable: true }.
// - Non-side types ('top' | 'bottom' | 'shelf' | 'door' | 'back' | ...) get
//   no holes unless `adjustable` is set.
// - Hole diameter is 5mm (see DXF_HOLE_DIA in dxf.ts); this function only
//   returns center points — diameter lives with the exporter.
//
// Coordinate note: panel { w, h } is the 2D face, NOT the 3D Dimensions
// triple. Map from model.ts like: side panel face w = depth, h = height.

/** Pitch between rows (mm). */
export const SYSTEM_PITCH = 32

/** First/last row offset from top/bottom edges (mm). */
export const SYSTEM_EDGE = 64

/** Column inset from front/back edges (mm). */
export const SYSTEM_INSET = 37

/** Hole diameter (mm). */
export const SYSTEM_HOLE_DIA = 5

/** Minimum side-panel height that earns holes without the adjustable flag. */
export const SYSTEM_MIN_H = 400

/** Input face panel. `type` accepts 'side'/'left'/'right' for sides. */
export type DrillPanel = {
  /** Face width in mm (for sides: carcass depth). */
  w: number
  /** Face height in mm. */
  h: number
  /** Panel kind: 'side' | 'left' | 'right' | 'top' | 'shelf' | ... */
  type: string
  /** Force holes (e.g. shelfAdjustable module present). Default false. */
  adjustable?: boolean
}

/**
 * Compute 32mm-system hole centers for a panel face.
 * Pure function — same input always gives the same output, no side effects.
 */
export function systemHoles(panel: DrillPanel): { x: number; y: number }[] {
  const kind = panel.type.toLowerCase()
  const isSide = kind === 'side' || kind === 'left' || kind === 'right'
  const wantsHoles = panel.adjustable === true

  // Non-sides only drill when explicitly flagged (e.g. adjustable shelf bay).
  if (!isSide && !wantsHoles) return []
  // Short sides drill only when flagged (avoids holes in plinths/fillers).
  if (panel.h <= SYSTEM_MIN_H && !wantsHoles) return []
  // Face too narrow for two inset columns — nothing sensible to drill.
  if (panel.w < SYSTEM_INSET * 2 + 10) return []
  // Not enough height for even one row.
  if (panel.h < SYSTEM_EDGE * 2) return []

  // Two columns at 37mm insets; collapse to one centered column if the
  // panel is so narrow the columns would nearly touch (< 32mm apart).
  const leftX = SYSTEM_INSET
  const rightX = panel.w - SYSTEM_INSET
  const columns = rightX - leftX < SYSTEM_PITCH ? [panel.w / 2] : [leftX, rightX]

  const holes: { x: number; y: number }[] = []
  for (let y = SYSTEM_EDGE; y <= panel.h - SYSTEM_EDGE; y += SYSTEM_PITCH) {
    for (const x of columns) holes.push({ x, y })
  }
  return holes
}
