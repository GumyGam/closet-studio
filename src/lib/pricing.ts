// ESTIMATE-only price calculator (pure TypeScript, no deps).
//
// ⚠️ ESTIMATE — not a quote. Material rates are rough workshop averages
// (USD per m² of board face) and hardware prices are placeholder unit
// costs. Real quotes depend on supplier, board size yield, waste %, labor,
// and region. Show "ESTIMATE" next to any number from this file in the UI.
//
// Inputs are structural (not class instances) so App/CSV code can pass
// CutListRow[] from model.ts and HardwareCounts from hardware.ts directly:
// - cutList rows need { width_mm, height_mm, quantity } (face W×H in mm)
// - hardware needs { handles, hinges, rods } + optional { slides, leds }
// - finishId is a stable ID from finishes.ts ('oak' | 'walnut' | ...)

import type { CutListRow } from './model'
import type { HardwareCounts } from './hardware'

// --- ESTIMATE rate tables (USD; placeholders, see header warning) ---

/** Board face rate per finish (USD / m²). Unknown IDs fall back to oak. */
export const BOARD_RATES: Record<string, number> = {
  oak: 90,
  walnut: 120,
  white: 60,
  graphite: 70,
  glass: 150,
  mirror: 140,
  linen: 65,
  concrete: 75,
}

/** Edgebanding rate (USD / linear meter of panel perimeter). */
export const EDGEBAND_RATE_PER_M = 0.8

/** Hardware unit costs (USD each — placeholder catalog prices). */
export const HARDWARE_RATES = {
  handle: 6,
  hinge: 4,
  rod: 12,
  slide: 18,
  led: 25,
} as const

/** Minimal cut-list shape this estimator reads (CutListRow satisfies it). */
export type EstimateCutRow = Pick<CutListRow, 'width_mm' | 'height_mm' | 'quantity'>

/** Minimal hardware shape (HardwareCounts satisfies it; slides/leds optional). */
export type EstimateHardware = Pick<HardwareCounts, 'handles' | 'hinges' | 'rods'> & {
  slides?: number
  leds?: number
}

/** Price result — always USD. All money fields rounded to 2 decimals. */
export type PriceEstimate = {
  /** Total board face area in m² (3 decimals). */
  materialM2: number
  /** Board + edgeband cost in USD. */
  boardCost: number
  /** Hardware cost in USD. */
  hardwareCost: number
  /** Grand total (board + hardware) in USD. */
  total: number
  currency: 'USD'
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * ESTIMATE the project price from cut list + hardware + finish.
 * - materialM2 = Σ(w × h × qty) / 1e6 (face area only; thickness ignored)
 * - boardCost = materialM2 × finishRate + perimeterMeters × 0.8 (edgeband)
 * - hardwareCost = handles×6 + hinges×4 + rods×12 + slides×18 + leds×25
 */
export function estimatePrice(
  cutList: readonly EstimateCutRow[],
  hardware: EstimateHardware,
  finishId: string,
): PriceEstimate {
  const rate = BOARD_RATES[finishId] ?? BOARD_RATES.oak

  let materialM2 = 0
  let perimeterM = 0
  for (const row of cutList) {
    const qty = Math.max(0, row.quantity)
    if (qty === 0) continue
    materialM2 += (row.width_mm * row.height_mm * qty) / 1e6
    perimeterM += ((2 * (row.width_mm + row.height_mm)) / 1000) * qty
  }

  const boardCost = round2(materialM2 * rate + perimeterM * EDGEBAND_RATE_PER_M)
  const hardwareCost = round2(
    hardware.handles * HARDWARE_RATES.handle +
      hardware.hinges * HARDWARE_RATES.hinge +
      hardware.rods * HARDWARE_RATES.rod +
      (hardware.slides ?? 0) * HARDWARE_RATES.slide +
      (hardware.leds ?? 0) * HARDWARE_RATES.led,
  )

  return {
    materialM2: Math.round(materialM2 * 1000) / 1000,
    boardCost,
    hardwareCost,
    total: round2(boardCost + hardwareCost),
    currency: 'USD',
  }
}
