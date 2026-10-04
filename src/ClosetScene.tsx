import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Grid, Html, OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import type { ClosetProject, ClosetProjectPackage, PartId } from './closet'
import { dimensionsForPart } from './lib/model'
import { mmToM } from './lib/units'
import { migrateHexToId, resolveFinish } from './lib/finishes'
import type { FinishId } from './lib/finishes'
import { getCameraPreset } from './lib/cameraPresets'
import type { CameraPresetName } from './lib/cameraPresets'
import { finishMaterialProps } from './lib/viewerMaterials'

type Props = {
  project: ClosetProject
  projectPackage: ClosetProjectPackage
  selectedPart: PartId | null
  onSelectPart: (part: PartId) => void
  onExportImage: (exporter: () => void) => void
  onExport3D: (exporter: () => void) => void
}

// ---------------------------------------------------------------------------
// NOTE: camera presets live in src/lib/cameraPresets.ts and PBR finish
// tuning in src/lib/viewerMaterials.ts (keeps this file Fast-refresh clean).
// App.tsx layout is untouched — the Front/Iso/Top overlay buttons below
// are rendered inside ClosetScene only.
// ---------------------------------------------------------------------------

function Board({
  part, size, position, grainBase, baseColor, finishId, selected, onSelect, opacity = 1,
}: {
  part: PartId
  size: [number, number, number]
  position: [number, number, number]
  grainBase: THREE.Texture
  baseColor: string
  finishId: FinishId
  selected: PartId | null
  onSelect: (part: PartId) => void
  opacity?: number
}) {
  // Clone the shared grain canvas per board so repeat can follow panel size
  // (grain doesn't stretch on big panels) without re-rendering the canvas.
  // Grain follows the longest edge: rotate 90° on tall panels.
  const { material, grain } = useMemo(() => {
    const clone = grainBase.clone()
    clone.wrapS = THREE.RepeatWrapping
    clone.wrapT = THREE.RepeatWrapping
    clone.center.set(0.5, 0.5)
    const tall = size[1] > size[0]
    clone.rotation = tall ? Math.PI / 2 : 0
    const along = tall ? size[1] : size[0]
    const across = tall ? size[0] : size[1]
    clone.repeat.set(Math.max(1, along / 0.6), Math.max(1, across / 0.6))
    clone.needsUpdate = true
    const pbr = finishMaterialProps(finishId)
    const isSelected = selected === part
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(baseColor).lerp(new THREE.Color('#ffffff'), 0.12),
      map: clone,
      roughness: pbr.roughness,
      metalness: pbr.metalness,
      clearcoat: pbr.clearcoat,
      clearcoatRoughness: pbr.clearcoatRoughness,
      transparent: opacity < 1 || pbr.transparent === true,
      opacity: Math.min(opacity, pbr.opacity ?? 1),
      emissive: new THREE.Color(isSelected ? '#b97c2e' : '#000000'),
      emissiveIntensity: isSelected ? 0.38 : 0,
    })
    return { material: mat, grain: clone }
  }, [grainBase, baseColor, finishId, opacity, part, selected, size])

  useEffect(() => () => {
    material.dispose()
    grain.dispose()
  }, [material, grain])

  return (
    <mesh
      castShadow
      receiveShadow
      position={position}
      material={material}
      onClick={(event) => { event.stopPropagation(); onSelect(part) }}
      userData={{ part }}
    >
      <boxGeometry args={size} />
    </mesh>
  )
}

function makeGrainTexture(color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the material preview texture.')
  context.fillStyle = color
  context.fillRect(0, 0, canvas.width, canvas.height)
  let seed = 27
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  for (let line = 0; line < 180; line += 1) {
    const x = random() * canvas.width
    const alpha = 0.018 + random() * 0.04
    context.beginPath()
    context.moveTo(x, 0)
    context.bezierCurveTo(x - 7 + random() * 14, 80, x - 7 + random() * 14, 176, x - 4 + random() * 8, canvas.height)
    context.strokeStyle = `${random() > 0.48 ? 'rgba(50,35,20,' : 'rgba(255,245,225,'}${alpha})`
    context.lineWidth = 0.5 + random() * 2
    context.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 1)
  return texture
}

function Wardrobe({ project, selectedPart, onSelectPart, groupRef }: {
  project: ClosetProject
  selectedPart: PartId | null
  onSelectPart: (part: PartId) => void
  groupRef: RefObject<THREE.Group | null>
}) {
  // Outer carcass in meters (GPU units). All part sizes come from the
  // canonical model.ts dimensionsForPart (mm) so 3D matches the cut list:
  // sides full-height, top/bottom fit BETWEEN sides (W-36).
  const w = mmToM(project.dimensions.width)
  const h = mmToM(project.dimensions.height)
  const d = mmToM(project.dimensions.depth)
  const gap = project.assembly * 0.28
  const doorAngle = project.doorOpen ? 0.82 : 0

  const finishId = migrateHexToId(project.finish)
  const finishDef = resolveFinish(project.finish)
  const grainBase = useMemo(() => makeGrainTexture(finishDef.color), [finishDef.color])
  useEffect(() => () => grainBase.dispose(), [grainBase])

  // Canonical per-part mm -> per-axis meters at the GPU edge.
  const partM = (part: PartId): [number, number, number] => {
    const dims = dimensionsForPart(project, part)
    return [mmToM(dims.width), mmToM(dims.height), mmToM(dims.depth)]
  }
  const leftM = partM('left')
  const rightM = partM('right')
  const topM = partM('top')
  const bottomM = partM('bottom')
  const backM = partM('back')
  const shelfM = partM('shelf')
  const doorM = partM('door')

  const boardProps = { grainBase, baseColor: finishDef.color, finishId, selected: selectedPart, onSelect: onSelectPart } as const

  // Fixed joinery positions (assembled + exploded offset):
  // - sides: outer faces flush at ±W/2  → center ±(W/2 - t/2), explode outward
  // - top/bottom: centered between sides, outer faces flush at ±H/2
  // - back: inset 2mm from rear outer face, explode further back
  // - shelves: front set back for door clearance, explode slightly forward
  const sideLX = -(w / 2 - leftM[0] / 2) - gap
  const sideRX = w / 2 - rightM[0] / 2 + gap
  const topY = h / 2 - topM[1] / 2 + gap
  const bottomY = -(h / 2 - bottomM[1] / 2) - gap
  const backZ = -(d / 2 - backM[2] / 2 - mmToM(2)) - gap
  // Shelf front sits ~2mm behind the carcass front so doors close:
  // center = front - 2mm - shelfDepth/2 → ≈ +10.5mm for default depths.
  const shelfZ = d / 2 - mmToM(2) - shelfM[2] / 2 + gap * 0.3

  const interiorH = h - mmToM(18) * 2
  const shelfPositions = Array.from({ length: project.shelves }, (_, index) => (
    -h / 2 + mmToM(18) + (interiorH / (project.shelves + 1)) * (index + 1)
  ))

  const doorT = doorM[2]
  const hingeZ = d / 2 + mmToM(2) + doorT / 2 + gap * 0.6

  return (
    <group ref={groupRef} userData={{ formeProject: project }}>
      <Board part="left" size={leftM} position={[sideLX, 0, 0]} {...boardProps} />
      <Board part="right" size={rightM} position={[sideRX, 0, 0]} {...boardProps} />
      <Board part="top" size={topM} position={[0, topY, 0]} {...boardProps} />
      <Board part="bottom" size={bottomM} position={[0, bottomY, 0]} {...boardProps} />
      <Board part="back" size={backM} position={[0, 0, backZ]} {...boardProps} opacity={0.94} />
      {shelfPositions.map((y, index) => (
        <Board key={index} part="shelf" size={shelfM} position={[0, y, shelfZ]} {...boardProps} />
      ))}
      {project.doors && ([-1, 1] as const).map((side) => {
        // Hinge on the outer stile; door panel extends toward the center.
        // Left hinge (side=-1) opens with -Y rotation, right with +Y.
        const hingeX = side * (w / 2 - mmToM(2)) + side * gap * 0.4
        const panelX = -side * (doorM[0] / 2 - mmToM(1))
        return (
          <group key={side} position={[hingeX, 0, hingeZ]} rotation={[0, side * doorAngle, 0]}>
            <Board part="door" size={doorM} position={[panelX, 0, 0]} {...boardProps} />
            <mesh position={[panelX - side * (doorM[0] / 2 - 0.025), 0, doorT / 2 + 0.004]} castShadow>
              <sphereGeometry args={[0.009, 16, 16]} />
              <meshStandardMaterial color="#77736d" metalness={0.72} roughness={0.28} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Thin dimension lines (W/H/D) drawn under/beside the carcass. */
function DimensionLines({ project }: { project: ClosetProject }) {
  const w = mmToM(project.dimensions.width)
  const h = mmToM(project.dimensions.height)
  const d = mmToM(project.dimensions.depth)
  const { geometry, labels } = useMemo(() => {
    const yW = -h / 2 - 0.16
    const zW = d / 2 + 0.16
    const xH = -w / 2 - 0.16
    const xD = w / 2 + 0.16
    const yD = -h / 2 - 0.16
    const tick = 0.035
    const pts: number[] = [
      // Width line (front, below)
      -w / 2, yW, zW, w / 2, yW, zW,
      -w / 2, yW - tick, zW, -w / 2, yW + tick, zW,
      w / 2, yW - tick, zW, w / 2, yW + tick, zW,
      // Height line (left, front plane)
      xH, -h / 2, zW, xH, h / 2, zW,
      xH - tick, -h / 2, zW, xH + tick, -h / 2, zW,
      xH - tick, h / 2, zW, xH + tick, h / 2, zW,
      // Depth line (right, below)
      xD, yD, -d / 2, xD, yD, d / 2,
      xD - tick, yD, -d / 2, xD + tick, yD, -d / 2,
      xD - tick, yD, d / 2, xD + tick, yD, d / 2,
    ]
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return {
      geometry: geo,
      labels: {
        wPos: [0, yW, zW] as [number, number, number],
        hPos: [xH, 0, zW] as [number, number, number],
        dPos: [xD, yD, 0] as [number, number, number],
      },
    }
  }, [w, h, d])
  useEffect(() => () => geometry.dispose(), [geometry])

  const pill: React.CSSProperties = {
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid #cfc9bf',
    borderRadius: 999,
    padding: '1px 8px',
    fontSize: 11,
    fontWeight: 600,
    color: '#4a453e',
    whiteSpace: 'nowrap',
  }
  return (
    <group>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#8a847c" />
      </lineSegments>
      <Html position={labels.wPos} center style={{ pointerEvents: 'none' }}>
        <div style={pill}>{project.dimensions.width} mm</div>
      </Html>
      <Html position={labels.hPos} center style={{ pointerEvents: 'none' }}>
        <div style={pill}>{project.dimensions.height} mm</div>
      </Html>
      <Html position={labels.dPos} center style={{ pointerEvents: 'none' }}>
        <div style={pill}>{project.dimensions.depth} mm</div>
      </Html>
    </group>
  )
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function notifyExportError(message: string) {
  window.dispatchEvent(new CustomEvent('forme:app-notice', { detail: message }))
}

export default function ClosetScene({ project, projectPackage, selectedPart, onSelectPart, onExportImage, onExport3D }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  const applyPreset = (name: CameraPresetName) => {
    const controls = controlsRef.current
    if (!controls) return
    const preset = getCameraPreset(name, project.dimensions)
    controls.object.position.set(...preset.position)
    controls.target.set(...preset.target)
    controls.update()
  }

  useEffect(() => {
    onExport3D(() => {
      void (async () => {
        try {
          const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js')
          const group = groupRef.current
          if (!group) throw new Error('The 3D closet is not ready to export.')
          const scene = new THREE.Scene()
          const exportedGroup = group.clone(true)
          exportedGroup.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            const exportedMaterials = materials.map((material) => material.clone())
            if (object.userData.part) exportedMaterials.forEach((material) => material.color.set('#ffffff'))
            object.material = Array.isArray(object.material) ? exportedMaterials : exportedMaterials[0]
          })
          exportedGroup.userData = { ...exportedGroup.userData, formeProject: projectPackage }
          scene.add(exportedGroup)
          const result = await new Promise<ArrayBuffer>((resolve, reject) => {
            new GLTFExporter().parse(
              scene,
              (output) => output instanceof ArrayBuffer ? resolve(output) : reject(new Error('The 3D exporter did not produce a binary GLB file.')),
              reject,
              { binary: true, onlyVisible: true },
            )
          })
          downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), 'forme-closet-project.glb')
        } catch (error) {
          console.error('Could not export GLB project', error)
          notifyExportError('3D project export failed. Try the editable JSON project export.')
        }
      })()
    })
    onExportImage(() => {
      try {
        const canvas = document.querySelector<HTMLCanvasElement>('.closet-canvas canvas')
        if (!canvas) throw new Error('The 3D viewer is not ready to export an image.')
        const image = new Image()
        image.onerror = () => notifyExportError('Could not render the dimensioned PNG image.')
        image.onload = () => {
          const output = document.createElement('canvas')
          output.width = canvas.width
          output.height = canvas.height
          const context = output.getContext('2d')
          if (!context) {
            notifyExportError('Could not create the PNG image.')
            return
          }
          context.fillStyle = '#f3f1ed'
          context.fillRect(0, 0, output.width, output.height)
          context.drawImage(image, 0, 0)
          context.fillStyle = '#3c3934'
          context.font = '600 18px sans-serif'
          context.fillText(`W ${project.dimensions.width} mm     H ${project.dimensions.height} mm     D ${project.dimensions.depth} mm`, 24, output.height - 28)
          context.font = '14px sans-serif'
          context.fillStyle = '#71695f'
          context.fillText(`Forme · ${project.finish} · ${project.shelves} shelves · ${project.doors ? 'doors' : 'no doors'}`, 24, 27)
          output.toBlob((blob) => {
            if (blob) downloadBlob(blob, 'closet-dimensions.png')
            else notifyExportError('Could not encode the dimensioned PNG image.')
          }, 'image/png')
        }
        image.src = canvas.toDataURL('image/png')
      } catch (error) {
        console.error('Could not export PNG image', error)
        notifyExportError('Could not export the dimensioned PNG image.')
      }
    })
  }, [onExport3D, onExportImage, project, projectPackage])

  const presetButton: React.CSSProperties = {
    border: '1px solid #d8d3ca',
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    color: '#4a453e',
    padding: '4px 8px',
    cursor: 'pointer',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        className="closet-canvas"
        shadows
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [3.5, 2.6, 4.4], fov: 34 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <color attach="background" args={['#f3f1ed']} />
        <ambientLight intensity={0.85} />
        <hemisphereLight args={['#ffffff', '#a69d90', 0.9]} />
        <directionalLight position={[3.5, 5, 4]} intensity={2.8} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-4, 2, -2]} intensity={0.9} />
        <Wardrobe project={project} selectedPart={selectedPart} onSelectPart={onSelectPart} groupRef={groupRef} />
        <DimensionLines project={project} />
        <ContactShadows
          position={[0, -mmToM(project.dimensions.height) / 2 - 0.05, 0]}
          opacity={0.42}
          scale={8}
          blur={2.2}
          far={3}
          resolution={512}
          color="#4a453e"
        />
        <Grid
          position={[0, -project.dimensions.height / 2000 - 0.055, 0]}
          args={[8, 8]}
          cellSize={0.25}
          cellThickness={0.55}
          cellColor="#d3d0ca"
          sectionSize={1}
          sectionThickness={0.9}
          sectionColor="#c5c0b8"
          fadeDistance={8}
          fadeStrength={1}
          infiniteGrid
        />
        <OrbitControls ref={controlsRef} makeDefault minDistance={2.2} maxDistance={8} maxPolarAngle={Math.PI / 2 + 0.08} />
      </Canvas>
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
        {(['front', 'iso', 'top'] as const).map((name) => (
          <button key={name} style={presetButton} onClick={() => applyPreset(name)} aria-label={`${name} camera view`}>
            {name === 'front' ? 'Front' : name === 'iso' ? 'Iso' : 'Top'}
          </button>
        ))}
      </div>
    </div>
  )
}
