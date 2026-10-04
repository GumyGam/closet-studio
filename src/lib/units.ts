// Foundation units for Closet Studio v2-pro.
// Rule: mm for humans, meters for GPU.
// All project config / dimensions / cut lists stay in integer mm.
// Convert to meters ONLY at the 3D render edge (R3F / three.js).

/** Millimeters per meter edge converter. */
export const MM_TO_M = 0.001

/** Meters per millimeter inverse (1000). Useful for m -> mm. */
export const M_TO_MM = 1000

/** Convert millimeters (human config) to meters (GPU scene). */
export function mmToM(mm: number): number {
  return mm * MM_TO_M
}

/** Convert meters (GPU scene) back to millimeters (human config). */
export function mToMm(m: number): number {
  return m * M_TO_MM
}
