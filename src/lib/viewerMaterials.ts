// Per-finish PBR tuning for the ClosetScene viewer (v2-pro slice).
// Keeps MeshPhysicalMaterial params next to finishes.ts stable IDs.
import type { FinishId } from './finishes'

/** PBR params for MeshPhysicalMaterial, keyed by stable finish ID. */
export function finishMaterialProps(id: FinishId): {
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  transparent?: boolean
  opacity?: number
} {
  switch (id) {
    case 'walnut':
      return { roughness: 0.5, metalness: 0.02, clearcoat: 0.3, clearcoatRoughness: 0.55 }
    case 'white':
      return { roughness: 0.62, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.7 }
    case 'graphite':
      return { roughness: 0.48, metalness: 0.08, clearcoat: 0.2, clearcoatRoughness: 0.5 }
    case 'glass':
      return { roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.38 }
    case 'mirror':
      return { roughness: 0.05, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.05 }
    case 'linen':
      return { roughness: 0.92, metalness: 0, clearcoat: 0, clearcoatRoughness: 1 }
    case 'concrete':
      return { roughness: 0.85, metalness: 0.02, clearcoat: 0.05, clearcoatRoughness: 0.9 }
    case 'oak':
    default:
      return { roughness: 0.55, metalness: 0.015, clearcoat: 0.25, clearcoatRoughness: 0.6 }
  }
}
