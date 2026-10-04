// Camera preset poses for the ClosetScene viewer (v2-pro slice).
// Pure helpers: mm in, camera pose out. No App.tsx layout changes —
// ClosetScene renders its own small Front/Iso/Top overlay buttons.
import { mmToM } from './units'

export type CameraPresetName = 'front' | 'iso' | 'top'

/** Camera pose for a preset, scaled to the project size. */
export function getCameraPreset(
  name: CameraPresetName,
  dimsMm: { width: number; height: number; depth: number },
): { position: [number, number, number]; target: [number, number, number] } {
  const w = mmToM(dimsMm.width)
  const h = mmToM(dimsMm.height)
  const d = mmToM(dimsMm.depth)
  const dist = Math.max(w, h, d) * 2 + 1.2
  if (name === 'front') return { position: [0, 0.15, dist * 1.45], target: [0, 0, 0] }
  if (name === 'top') return { position: [0, dist * 1.9, 0.02], target: [0, 0, 0] }
  return { position: [dist * 0.92, dist * 0.62, dist * 1.12], target: [0, 0, 0] }
}
