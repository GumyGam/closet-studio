// Minimal hand-rolled DXF exporter for the carpenter handoff (spec Sections 5+8).
//
// No npm deps: emits plain-text DXF (ASCII) with LINE-style entities only.
// Units are millimetres (HEADER $INSUNITS = 4). Coordinates are Y-up,
// origin at the bottom-left of the first panel.
//
// Layers:
// - OUTLINE (red, color 1): panel outline rectangles (LWPOLYLINE, closed)
// - DRILL   (green, color 3): 32mm-system holes (CIRCLE, dia 5mm => r=2.5)
// - TEXT    (white, color 7): panel id labels (TEXT, height 8mm)
//
// Panels are laid out in a single row with a 20mm gap so a viewer/CAM
// import sees every panel at once without overlap.
//
// @example unit-test shape (copy into a test runner):
// ```ts
// import { panelDxf } from './dxf'
// const dxf = panelDxf([{ id: 'left', w: 600, h: 2200, holes: [{ x: 37, y: 64 }] }])
// console.assert(dxf.includes('$INSUNITS'), 'missing HEADER units')
// console.assert(dxf.includes('OUTLINE'), 'missing OUTLINE layer')
// console.assert(dxf.includes('CIRCLE'), 'missing drill circle')
// console.assert(dxf.startsWith('0\nSECTION'), 'must start with SECTION')
// console.assert(dxf.trimEnd().endsWith('EOF'), 'must end with EOF')
// ```

/** One panel to export. x/y of holes are in panel-local mm (origin bottom-left). */
export type DxfPanel = {
  id: string
  /** Panel width on its face in mm (for a side panel this is the carcass depth). */
  w: number
  /** Panel height on its face in mm. */
  h: number
  /** Optional 32mm-system holes (see drilling.ts `systemHoles`). */
  holes?: { x: number; y: number }[]
}

/** Gap between panels in the row layout (mm). */
export const DXF_PANEL_GAP = 20

/** Drill hole diameter for the 32mm system (mm). Circles use r = 2.5. */
export const DXF_HOLE_DIA = 5

function fmt(n: number): string {
  // Keep DXF text short but exact for mm integers; allow up to 3 decimals.
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000)
}

/** Strip newlines/control chars so a panel id is safe in a TEXT entity. */
function safeText(id: string): string {
  return id.replace(/[\r\n]+/g, ' ').slice(0, 64)
}

/**
 * Export panels to a minimal valid DXF string.
 * Each panel is offset in a row: panel[i] origin x = sum(w + 20mm gap).
 */
export function panelDxf(panels: DxfPanel[]): string {
  const lines: string[] = []

  // --- HEADER: declare mm units ($INSUNITS = 4) ---
  lines.push(
    '0', 'SECTION',
    '2', 'HEADER',
    '9', '$INSUNITS',
    '70', '4',
    '0', 'ENDSEC',
  )

  // --- TABLES: three layers so the carpenter can toggle outline/holes/labels ---
  const layer = (name: string, color: number): string[] => [
    '0', 'LAYER',
    '2', name,
    '70', '0',
    '62', String(color),
    '6', 'CONTINUOUS',
  ]
  lines.push(
    '0', 'SECTION',
    '2', 'TABLES',
    '0', 'TABLE',
    '2', 'LAYER',
    '70', '3', // 3 layers follow
    ...layer('OUTLINE', 1), // red
    ...layer('DRILL', 3), // green
    ...layer('TEXT', 7), // white
    '0', 'ENDTAB',
    '0', 'ENDSEC',
  )

  // --- ENTITIES: one rect + holes + label per panel ---
  lines.push('0', 'SECTION', '2', 'ENTITIES')

  let xOffset = 0
  for (const panel of panels) {
    const x0 = xOffset
    const w = Math.max(0, panel.w)
    const h = Math.max(0, panel.h)

    // Outline rectangle as a closed LWPOLYLINE (4 vertices, flag 1 = closed).
    lines.push(
      '0', 'LWPOLYLINE',
      '8', 'OUTLINE',
      '90', '4',
      '70', '1',
      '10', fmt(x0), '20', '0',
      '10', fmt(x0 + w), '20', '0',
      '10', fmt(x0 + w), '20', fmt(h),
      '10', fmt(x0), '20', fmt(h),
    )

    // Drill holes as circles (dia 5mm => radius 2.5).
    for (const hole of panel.holes ?? []) {
      lines.push(
        '0', 'CIRCLE',
        '8', 'DRILL',
        '10', fmt(x0 + hole.x), '20', fmt(hole.y), '30', '0.0',
        '40', fmt(DXF_HOLE_DIA / 2),
      )
    }

    // Panel id label just above the panel so it never covers holes.
    lines.push(
      '0', 'TEXT',
      '8', 'TEXT',
      '10', fmt(x0), '20', fmt(h + 5), '30', '0.0',
      '40', '8',
      '1', safeText(panel.id),
    )

    xOffset += w + DXF_PANEL_GAP
  }

  lines.push('0', 'ENDSEC', '0', 'EOF')
  return lines.join('\n') + '\n'
}
