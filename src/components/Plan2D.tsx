// Plan2D — SVG front-elevation of the carcass (2D slice).
// Draws in real mm (viewBox = W x H) so proportions are honest.
// Click a colored module rect to select it; click empty space to deselect.
// Drag a band vertically: 10mm snap, clamped inside the carcass, overlaps
// revert with a toast. Dragged positions persist as `zone` (same top-down
// interior frame as the stackModules bands below) via onMove.

import { useRef, useState } from 'react'
import type { Dimensions } from '../closet'
import { DOOR_VARIANTS, moduleDef, stackModules } from '../lib/modules'
import type { DoorVariantId, ModuleInstance } from '../lib/modules'

type Plan2DProps = {
  project: { dimensions: Dimensions; shelves: number; doors: boolean }
  modules: readonly ModuleInstance[]
  doorVariant?: DoorVariantId
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Persist a dragged band rect (top-down interior frame, mm). */
  onMove?: (id: string, zone: NonNullable<ModuleInstance['zone']>) => void
}

/** Carcass wall thickness used for the interior inset (mm). */
const WALL = 18

/** Drag snap step (mm). */
const SNAP = 10

export default function Plan2D({ project, modules, doorVariant, selectedId, onSelect, onMove }: Plan2DProps) {
  const { width: W, height: H } = project.dimensions
  const margin = Math.max(W, H) * 0.14
  const labelSize = (H + margin * 2) / 15
  const thinStroke = Math.max(W, H) / 500
  const thickStroke = thinStroke * 2

  const interiorW = W - WALL * 2
  const interiorH = H - WALL * 2
  const bands = stackModules(modules, interiorH)
  // Render rects: an explicit zone (from a previous drag) wins,
  // otherwise the auto-stacked band. Same top-down frame for both.
  const rects = bands.map(({ instance, y, h }) => ({
    instance,
    y: instance.zone?.y ?? y,
    h: instance.zone?.h ?? h,
  }))
  const variant: DoorVariantId = doorVariant ?? (project.doors ? 'doubleHinged' : 'open')
  const mechanics = DOOR_VARIANTS.find((entry) => entry.id === variant)?.mechanics ?? 'hinged'
  const showDoors = project.doors && variant !== 'open'

  const svgRef = useRef<SVGSVGElement>(null)
  // True once the pointer moved past tap slop: commits on release AND
  // suppresses the click that follows a drag (reset on next pointer-down).
  const draggedRef = useRef(false)
  const [drag, setDrag] = useState<{ id: string; startClientY: number; dyMm: number } | null>(null)

  // SVG units are mm; convert pointer pixels to mm from the live box.
  const pxToMm = () => {
    const box = svgRef.current?.getBoundingClientRect()
    const span = H + margin * 2
    return box && box.height > 0 ? span / box.height : 1
  }

  const finishDrag = (id: string, baseY: number, h: number, dyMm: number) => {
    setDrag(null)
    if (!draggedRef.current) return // plain click — onClick below handles select
    draggedRef.current = false
    const snapped = Math.round((baseY + dyMm) / SNAP) * SNAP
    const clamped = Math.max(0, Math.min(interiorH - h, snapped))
    const blocked = rects.some(
      (other) => other.instance.id !== id && clamped < other.y + other.h && other.y < clamped + h,
    )
    if (blocked) {
      window.dispatchEvent(new CustomEvent('forme:app-notice', { detail: 'That overlaps another module — reverted.' }))
      return
    }
    onMove?.(id, { x: 0, y: clamped, w: interiorW, h })
  }

  // Shelf lines (even split, mirrors the PDF front elevation).
  const shelfYs: number[] = []
  for (let index = 1; index <= project.shelves; index += 1) {
    shelfYs.push((H / (project.shelves + 1)) * index)
  }

  const doorArc = (hingeX: number, radius: number, flip: 1 | -1) => {
    // Simple dashed quarter-arc from the hinge point (front-elevation hint).
    const endX = hingeX + radius * flip
    return `M ${hingeX} ${H} L ${endX} ${H} A ${radius} ${radius} 0 0 ${flip === 1 ? 0 : 1} ${hingeX} ${H - radius}`
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`${-margin} ${-margin} ${W + margin * 2} ${H + margin * 2}`}
      width="100%"
      height={180}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Front elevation ${W} by ${H} millimetres with ${modules.length} modules`}
      onClick={() => onSelect(null)}
      style={{ display: 'block', cursor: 'default' }}
    >
      {/* Carcass */}
      <rect x={0} y={0} width={W} height={H} fill="#fffdf9" stroke="#8d8578" strokeWidth={thickStroke} rx={W * 0.005} />
      {/* Interior inset */}
      <rect x={WALL} y={WALL} width={interiorW} height={interiorH} fill="none" stroke="#d8d3c8" strokeWidth={thinStroke} strokeDasharray={`${thinStroke * 4} ${thinStroke * 3}`} />

      {/* Shelf lines */}
      {shelfYs.map((y) => (
        <line key={`shelf-${y}`} x1={WALL} y1={y} x2={W - WALL} y2={y} stroke="#b9b2a4" strokeWidth={thinStroke} />
      ))}

      {/* Module bands (click to select, drag vertically to move) */}
      {rects.map(({ instance, y, h }) => {
        const def = moduleDef(instance.type)
        const selected = instance.id === selectedId
        const dragging = drag?.id === instance.id
        const showLabel = h > labelSize * 1.4
        return (
          <g key={instance.id}>
            <title>{def.label}</title>
            <rect
              x={WALL + (instance.zone?.x ?? 0)}
              y={WALL + y + (dragging && drag ? drag.dyMm : 0)}
              width={instance.zone?.w ?? interiorW}
              height={h}
              fill={def.color}
              fillOpacity={0.75}
              stroke={selected ? '#a77b50' : '#8d8578'}
              strokeWidth={selected ? thickStroke * 1.5 : thinStroke}
              onClick={(event) => {
                event.stopPropagation()
                // A drag ends with a click — swallow it so the band doesn't select.
                if (draggedRef.current) {
                  draggedRef.current = false
                  return
                }
                onSelect(instance.id)
              }}
              onPointerDown={(event) => {
                event.stopPropagation()
                event.currentTarget.setPointerCapture(event.pointerId)
                draggedRef.current = false
                setDrag({ id: instance.id, startClientY: event.clientY, dyMm: 0 })
              }}
              onPointerMove={(event) => {
                if (!drag || drag.id !== instance.id) return
                const dyPx = event.clientY - drag.startClientY
                if (Math.abs(dyPx) > 4) draggedRef.current = true
                setDrag({ ...drag, dyMm: dyPx * pxToMm() })
              }}
              onPointerUp={() => finishDrag(instance.id, y, h, dragging && drag ? drag.dyMm : 0)}
              onPointerCancel={() => {
                setDrag(null)
                draggedRef.current = false
              }}
              style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            />
            {showLabel && (
              <text
                x={W / 2}
                y={WALL + y + (dragging && drag ? drag.dyMm : 0) + h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={labelSize * 0.75}
                fill="#4c4943"
                pointerEvents="none"
              >
                {def.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Door overlays */}
      {showDoors && mechanics === 'hinged' && (
        <g stroke="#6f675c" strokeWidth={thinStroke} fill="none">
          <line x1={W / 2} y1={0} x2={W / 2} y2={H} strokeDasharray={`${thinStroke * 3} ${thinStroke * 2}`} />
          <path d={doorArc(0, W / 4, 1)} strokeDasharray={`${thinStroke * 3} ${thinStroke * 2}`} />
          <path d={doorArc(W, W / 4, -1)} strokeDasharray={`${thinStroke * 3} ${thinStroke * 2}`} />
        </g>
      )}
      {showDoors && mechanics === 'sliding' && (
        <g stroke="#6f675c" strokeWidth={thinStroke} fill="#6f675c" fillOpacity={0.08}>
          <rect x={0} y={0} width={W * 0.55} height={H} />
          <rect x={W * 0.45} y={0} width={W * 0.55} height={H} />
        </g>
      )}
      {showDoors && mechanics === 'bifold' && (
        <g stroke="#6f675c" strokeWidth={thinStroke} fill="none">
          <polyline points={`${0},${H} ${W * 0.25},${H * 0.5} ${W * 0.5},${H}`} />
          <polyline points={`${W},${H} ${W * 0.75},${H * 0.5} ${W * 0.5},${H}`} />
        </g>
      )}

      {/* Dimension labels */}
      <text x={W / 2} y={H + margin * 0.55} textAnchor="middle" fontSize={labelSize} fill="#63594c" fontWeight={600}>
        {`W ${W}`}
      </text>
      <text
        x={-margin * 0.55}
        y={H / 2}
        textAnchor="middle"
        fontSize={labelSize}
        fill="#63594c"
        fontWeight={600}
        transform={`rotate(-90 ${-margin * 0.55} ${H / 2})`}
      >
        {`H ${H}`}
      </text>
    </svg>
  )
}
