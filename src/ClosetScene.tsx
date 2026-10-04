import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { ClosetProject, ClosetProjectPackage, PartId } from './closet'

type Props = {
  project: ClosetProject
  projectPackage: ClosetProjectPackage
  selectedPart: PartId | null
  onSelectPart: (part: PartId) => void
  onExportImage: (exporter: () => void) => void
  onExport3D: (exporter: () => void) => void
}

function Board({
  part, size, position, grain, selected, onSelect, opacity = 1, rotation,
}: {
  part: PartId
  size: [number, number, number]
  position: [number, number, number]
  grain: THREE.Texture
  selected: PartId | null
  onSelect: (part: PartId) => void
  opacity?: number
  rotation?: [number, number, number]
}) {
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: selected === part ? '#d8a36b' : '#ffffff',
    map: grain,
    roughness: 0.52,
    metalness: 0.015,
    transparent: opacity < 1,
    opacity,
  }), [grain, opacity, part, selected])
  return (
    <mesh
      castShadow
      receiveShadow
      position={position}
      rotation={rotation}
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
  texture.repeat.set(2, 2)
  return texture
}

function Wardrobe({ project, selectedPart, onSelectPart, groupRef }: {
  project: ClosetProject
  selectedPart: PartId | null
  onSelectPart: (part: PartId) => void
  groupRef: RefObject<THREE.Group | null>
}) {
  const { width, height, depth } = project.dimensions
  const w = width / 1000
  const h = height / 1000
  const d = depth / 1000
  const thickness = 0.018
  const gap = project.assembly * 0.28
  const doorAngle = project.doorOpen ? 0.82 : 0
  const finish = project.finish
  const grain = useMemo(() => makeGrainTexture(finish), [finish])
  const dimension = (part: PartId, axis: 'width' | 'height' | 'depth', fallback: number) =>
    (project.partOverrides[part]?.[axis] ?? fallback) / 1000
  const shelfPositions = Array.from({ length: project.shelves }, (_, index) => (
    -h / 2 + thickness + ((h - 2 * thickness) / (project.shelves + 1)) * (index + 1)
  ))
  return (
    <group ref={groupRef} userData={{ formeProject: project }}>
      <Board part="left" size={[dimension('left', 'width', 18), dimension('left', 'height', height * 1000), dimension('left', 'depth', depth * 1000)]} position={[-w / 2 - gap, 0, 0]} grain={grain} selected={selectedPart} onSelect={onSelectPart} />
      <Board part="right" size={[dimension('right', 'width', 18), dimension('right', 'height', height * 1000), dimension('right', 'depth', depth * 1000)]} position={[w / 2 + gap, 0, 0]} grain={grain} selected={selectedPart} onSelect={onSelectPart} />
      <Board part="top" size={[dimension('top', 'width', width * 1000), dimension('top', 'height', 18), dimension('top', 'depth', depth * 1000)]} position={[0, h / 2 + gap, 0]} grain={grain} selected={selectedPart} onSelect={onSelectPart} />
      <Board part="bottom" size={[dimension('bottom', 'width', width * 1000), dimension('bottom', 'height', 18), dimension('bottom', 'depth', depth * 1000)]} position={[0, -h / 2 - gap, 0]} grain={grain} selected={selectedPart} onSelect={onSelectPart} />
      <Board part="back" size={[dimension('back', 'width', width * 1000 - 36), dimension('back', 'height', height * 1000 - 36), dimension('back', 'depth', 9)]} position={[0, 0, -d / 2 + 0.006 - gap]} grain={grain} selected={selectedPart} onSelect={onSelectPart} opacity={0.94} />
      {shelfPositions.map((y, index) => (
        <Board key={index} part="shelf" size={[dimension('shelf', 'width', width * 1000 - 36), dimension('shelf', 'height', 18), dimension('shelf', 'depth', depth * 1000 - 25)]} position={[0, y, gap * 0.3]} grain={grain} selected={selectedPart} onSelect={onSelectPart} />
      ))}
      {project.doors && [-1, 1].map((side) => (
        <group key={side} position={[side * 0.008, 0, d / 2 + 0.012]} rotation={[0, side === -1 ? doorAngle : -doorAngle, 0]}>
          <Board
            part="door"
            size={[dimension('door', 'width', width * 500 - 9), dimension('door', 'height', height * 1000 - 18), dimension('door', 'depth', 20)]}
            position={[-side * (w / 4 - 0.009), 0, 0]}
            grain={grain}
            selected={selectedPart}
            onSelect={onSelectPart}
          />
          <mesh position={[-side * (w / 2 - 0.025), 0, 0.013]} castShadow>
            <sphereGeometry args={[0.009, 16, 16]} />
            <meshStandardMaterial color="#77736d" metalness={0.72} roughness={0.28} />
          </mesh>
        </group>
      ))}
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

  return (
    <Canvas
      className="closet-canvas"
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [3.5, 2.6, 4.4], fov: 34 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
      <color attach="background" args={['#f3f1ed']} />
      <ambientLight intensity={1.05} />
      <hemisphereLight args={['#ffffff', '#a69d90', 1.3]} />
      <directionalLight position={[3.5, 5, 4]} intensity={3.2} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-4, 2, -2]} intensity={1.2} />
      <Wardrobe project={project} selectedPart={selectedPart} onSelectPart={onSelectPart} groupRef={groupRef} />
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
      <OrbitControls makeDefault minDistance={2.2} maxDistance={8} maxPolarAngle={Math.PI / 2 + 0.08} />
    </Canvas>
  )
}
