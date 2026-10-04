import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownToLine, Check, ChevronDown, ChevronRight, Clock3, DoorOpen, Download,
  Globe2, Layers3, Ruler, SlidersHorizontal, Sparkles, TriangleAlert, Undo2, Redo2, Upload,
} from 'lucide-react'
import ClosetScene from './ClosetScene'
import Plan2D from './components/Plan2D'
import {
  copyProject, DEFAULT_DIMENSIONS, FINISHES, getWarnings, isClosetProject,
  isClosetProjectPackage, partLabels,
  type ClosetProjectPackage, type Dimensions, type Language, type PartId,
} from './closet'
// Canonical v2-pro geometry: W-36 joinery (top/bottom 1764 at 1800W default).
// Cut-list/PDF/CSV must use this, NOT closet.ts (full-width 36mm mismatch).
import { BOARD_THICKNESS, BACK_THICKNESS, buildCutList, dimensionsForPart } from './lib/model'
import type { ClosetProject } from './lib/model'
import {
  DOOR_VARIANTS, HANDLE_OPTIONS, MODULE_CATALOG, defaultModules,
  doorClearanceNote, moduleDef, moduleWarnings, newModuleId,
} from './lib/modules'
import type { DoorVariantId, HandleId, ModuleTypeId } from './lib/modules'
import { migrateHexToId } from './lib/finishes'
import { fullHardwareSchedule } from './lib/hardware'
import { estimatePrice } from './lib/pricing'
import { systemHoles } from './lib/drilling'
import { panelDxf, type DxfPanel } from './lib/dxf'
import { t, translate } from './translations'

const STORAGE_KEY = 'forme-closet-project-v1'
type HistoryState = { items: ClosetProject[]; index: number }

/**
 * Fill in module/door fields for old v1 saves that predate them.
 * Keeps `isClosetProject` backward compatible (missing fields = valid).
 */
function withModuleDefaults(project: ClosetProject): ClosetProject {
  return {
    ...project,
    modules: project.modules ?? [],
    doorVariant: project.doorVariant ?? (project.doors ? 'doubleHinged' : 'open'),
    handle: project.handle ?? 'bar',
  }
}

function defaultProject(): ClosetProject {
  return {
    format: 'forme-closet',
    version: 1,
    savedAt: new Date().toISOString(),
    name: 'Walk-in wardrobe',
    dimensions: { ...DEFAULT_DIMENSIONS },
    shelves: 3,
    doors: true,
    doorOpen: false,
    finish: FINISHES[0].color,
    selectedPart: null,
    partOverrides: {},
    assembly: 0,
    language: 'en',
    unit: 'mm',
    // Starter interior: both fit the 1800x2200x600 default carcass.
    modules: defaultModules(),
    doorVariant: 'doubleHinged',
    handle: 'bar',
  }
}

function readSaved(): { project: ClosetProject; history: HistoryState } {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (isClosetProjectPackage(value)) {
      return {
        project: withModuleDefaults(copyProject(value.project)),
        history: { items: value.history.map((item) => withModuleDefaults(copyProject(item))), index: Math.max(0, Math.min(value.historyIndex, value.history.length - 1)) },
      }
    }
  } catch (error) {
    console.warn('Could not restore the saved closet project', error)
  }
  const project = defaultProject()
  return { project, history: { items: [project], index: 0 } }
}

function downloadFile(content: BlobPart, type: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function applyChanges(project: ClosetProject, changes: Partial<ClosetProject>): ClosetProject {
  return { ...project, ...changes, savedAt: new Date().toISOString() }
}

// Share-link (v2): encode the full projectPackage JSON -> base64 URL hash.
// localStorage v1 key stays untouched; hash is only read on load + written on Copy.
function encodeShareHash(bundle: ClosetProjectPackage): string {
  const json = JSON.stringify(bundle)
  // Unicode-safe base64 (btoa only handles Latin1).
  const base64 = btoa(unescape(encodeURIComponent(json)))
  return `#p=${base64}`
}

function decodeShareHash(hash: string): unknown {
  const base64 = hash.replace(/^#p=/, '')
  const json = decodeURIComponent(escape(atob(base64)))
  return JSON.parse(json) as unknown
}

function App() {
  const [initial] = useState(readSaved)
  const [project, setProject] = useState(initial.project)
  const [history, setHistory] = useState<HistoryState>(initial.history)
  const [exportImage, setExportImage] = useState<(() => void) | null>(null)
  const [export3D, setExport3D] = useState<(() => void) | null>(null)
  const [exportMenu, setExportMenu] = useState(false)
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const registerImageExporter = useCallback((exporter: () => void) => setExportImage(() => exporter), [])
  const register3DExporter = useCallback((exporter: () => void) => setExport3D(() => exporter), [])
  const ui = translate(project.language)
  const rtl = project.language === 'he'
  // i18n: dotted-key lookup with English fallback — t(project.language, 'ui.open', 'Open').
  const warnings = getWarnings(project.dimensions, project.shelves, project.doors, project.language)
  // Modules slice: fit checks feed the existing design-check area (no new panel).
  // Memoized so the BOM memos below don't recompute every render.
  const modules = useMemo(() => project.modules ?? [], [project.modules])
  const doorVariant: DoorVariantId = project.doorVariant ?? (project.doors ? 'doubleHinged' : 'open')
  const moduleNotes = moduleWarnings(modules, project.dimensions)
  const doorNote = project.doors ? doorClearanceNote(doorVariant) : ''
  // Shared BOM derivations (single source for the sidebar line, production JSON, CSV, DXF).
  const cutListRows = useMemo(() => buildCutList(project, project.language), [project])
  const fullSchedule = useMemo(() => fullHardwareSchedule(project, modules), [project, modules])
  const priceEst = useMemo(
    () => estimatePrice(cutListRows, fullSchedule, migrateHexToId(project.finish)),
    [cutListRows, fullSchedule, project.finish],
  )
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [pendingModule, setPendingModule] = useState<ModuleTypeId>('doubleHang')
  const [planOpen, setPlanOpen] = useState(true)
  const projectPackage: ClosetProjectPackage = useMemo(() => ({
    format: 'forme-closet-package',
    version: 1,
    project,
    history: history.items,
    historyIndex: history.index,
  }), [history, project])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectPackage))
    } catch (error) {
      console.error('Could not save project history to this browser', error)
      window.dispatchEvent(new CustomEvent('forme:app-notice', { detail: t(projectPackage.project.language, 'notes.saveFailed', 'Automatic save failed. Export a project backup to keep your work.') }))
    }
  }, [projectPackage])

  useEffect(() => {
    const showNotice = (event: Event) => {
      setNotice((event as CustomEvent<string>).detail)
    }
    window.addEventListener('forme:app-notice', showNotice)
    return () => window.removeEventListener('forme:app-notice', showNotice)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 4200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const updateProject = (changes: Partial<ClosetProject>) => {
    const next = applyChanges(project, changes)
    setProject(next)
    setHistory((current) => {
      const items = current.items.slice(0, current.index + 1)
      items.push(copyProject(next))
      if (items.length > 80) items.shift()
      return { items, index: items.length - 1 }
    })
  }

  // Modules & doors actions (persist via the same updateProject + history).
  const addModule = () => {
    updateProject({ modules: [...modules, { id: newModuleId(), type: pendingModule }] })
  }
  const removeModule = (id: string) => {
    updateProject({ modules: modules.filter((entry) => entry.id !== id) })
    if (selectedModuleId === id) setSelectedModuleId(null)
  }
  const setDoorVariant = (variant: DoorVariantId) => {
    updateProject({ doorVariant: variant, doors: variant !== 'open', doorOpen: false })
  }

  const restorePackage = (value: unknown) => {
    let bundle: ClosetProjectPackage
    if (isClosetProjectPackage(value)) {
      bundle = value
    } else if (isClosetProject(value)) {
      bundle = { format: 'forme-closet-package', version: 1, project: value, history: [value], historyIndex: 0 }
    } else {
      throw new Error(ui.invalid)
    }
    const restored = withModuleDefaults(copyProject(bundle.project))
    const items = bundle.history.map((item) => withModuleDefaults(copyProject(item)))
    if (!items.length) items.push(restored)
    setProject(restored)
    setHistory({ items, index: Math.max(0, Math.min(bundle.historyIndex, items.length - 1)) })
    setNotice(ui.restored)
  }

  // Share-link restore: if URL has #p=..., decode + validate, keep v1 storage untouched.
  // Runs once on mount; invalid hash shows the standard invalid notice.
  useEffect(() => {
    if (!window.location.hash.startsWith('#p=')) return
    try {
      const value = decodeShareHash(window.location.hash)
      if (isClosetProjectPackage(value) || isClosetProject(value)) {
        restorePackage(value)
      } else {
        throw new Error(ui.invalid)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ui.invalid
      setNotice(message)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const importFile = async (file: File) => {
    try {
      if (file.name.toLowerCase().endsWith('.glb')) {
        const buffer = await file.arrayBuffer()
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
        const data = await new Promise<unknown>((resolve, reject) => {
          new GLTFLoader().parse(
            buffer,
            '',
            (gltf) => {
              let metadata: unknown
              gltf.scene.traverse((object) => {
                if (!metadata && object.userData.formeProject) metadata = object.userData.formeProject
              })
              if (!metadata) reject(new Error(ui.invalid))
              else resolve(metadata)
            },
            reject,
          )
        })
        restorePackage(data)
      } else {
        restorePackage(JSON.parse(await file.text()) as unknown)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ui.invalid
      setNotice(message)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const updateDimension = (key: keyof Dimensions, input: number) => {
    const value = project.unit === 'mm' ? input : Math.round(input * 10)
    const limits = project.selectedPart
      ? [9, key === 'width' ? 3600 : key === 'height' ? 3000 : 1200]
      : key === 'width' ? [300, 3600] : key === 'height' ? [300, 3000] : [200, 1200]
    const clamped = Math.max(limits[0], Math.min(limits[1], value))
    if (!project.selectedPart) {
      updateProject({ dimensions: { ...project.dimensions, [key]: clamped } })
      return
    }
    updateProject({
      partOverrides: {
        ...project.partOverrides,
        [project.selectedPart]: { ...project.partOverrides[project.selectedPart], [key]: clamped },
      },
    })
  }

  const selectedDimensions = project.selectedPart
    ? dimensionsForPart(project, project.selectedPart)
    : project.dimensions

  const downloadProject = () => {
    downloadFile(JSON.stringify(projectPackage, null, 2), 'application/json', 'forme-closet-project.json')
    setExportMenu(false)
  }

  const downloadProduction = () => {
    const spec = {
      ...projectPackage,
      production: {
        units: 'mm',
        boardThickness: BOARD_THICKNESS,
        backThickness: BACK_THICKNESS,
        // Canonical W-36 cut list (translated names + stable finish IDs).
        cutList: cutListRows,
        // Full schedule: door counts + module rods/slides/leds.
        hardware: fullSchedule,
        // ESTIMATE (not a quote) — live price from cut list + hardware + finish.
        priceEstimate: {
          ...priceEst,
          label: 'ESTIMATE',
          note: 'ESTIMATE — not a quote. Placeholder workshop rates; confirm supplier, yield, labor before manufacture.',
        },
        designWarnings: warnings,
        productionNote: t(project.language, 'notes.productionConfirm', 'Confirm hardware, edge banding, joinery, and installation clearances before manufacture.'),
      },
    }
    downloadFile(JSON.stringify(spec, null, 2), 'application/json', 'closet-production-package.json')
    setExportMenu(false)
  }

  const downloadCutList = () => {
    // Canonical columns: translated name + stable IDs, no hex, no qty-0 rows.
    const rows = cutListRows
    const columns = ['part', 'partId', 'quantity', 'width_mm', 'height_mm', 'depth_mm', 'material', 'grain', 'edgeband', 'finishedVsCut'] as const
    const csv = [
      columns.join(','),
      ...rows.map((row) => columns.map((column) => {
        const value = String(row[column as keyof typeof row] ?? '')
        return `"${value.replaceAll('"', '""')}"`
      }).join(',')),
    ].join('\r\n')
    downloadFile(`\uFEFF${csv}`, 'text/csv;charset=utf-8', 'closet-cut-list.csv')
    setExportMenu(false)
  }

  const downloadHardware = () => {
    // Full schedule (doors + modules); SKU column stays a placeholder ID.
    const rows = [
      { item: 'Handle', sku: 'HANDLE-BAR-128', quantity: fullSchedule.handles },
      { item: 'Hinge (soft-close 110deg)', sku: 'HINGE-110-SC', quantity: fullSchedule.hinges },
      { item: 'Wardrobe rod', sku: 'ROD-CHROME', quantity: fullSchedule.rods },
      { item: 'Drawer slide', sku: 'SLIDE-UNDERMOUNT', quantity: fullSchedule.slides },
      { item: 'LED strip', sku: 'LED-STRIP-24V', quantity: fullSchedule.leds },
    ].filter((row) => row.quantity > 0)
    const columns = ['item', 'sku', 'quantity'] as const
    const csv = [
      columns.join(','),
      ...rows.map((row) => columns.map((column) => {
        const value = String(row[column] ?? '')
        return `"${value.replaceAll('"', '""')}"`
      }).join(',')),
    ].join('\r\n')
    downloadFile(`\uFEFF${csv}`, 'text/csv;charset=utf-8', 'closet-hardware.csv')
    setExportMenu(false)
  }

  const downloadDxf = () => {
    // One DXF panel per physical board (quantities expanded: door ×2 → door-1, door-2).
    // Face mapping: sides show depth × height; tops/shelves width × depth; rest width × height.
    // Side panels carry 32mm-system holes (adjustable flag when a shelfAdjustable module exists).
    const adjustable = modules.some((entry) => entry.type === 'shelfAdjustable')
    const panels: DxfPanel[] = cutListRows.flatMap((row) => {
      const count = Math.max(1, Math.round(row.quantity))
      return Array.from({ length: count }, (_, index) => {
        const id = count > 1 ? `${row.partId}-${index + 1}` : row.partId
        switch (row.partId) {
          case 'left':
          case 'right':
            return {
              id,
              w: row.depth_mm,
              h: row.height_mm,
              holes: systemHoles({ w: row.depth_mm, h: row.height_mm, type: 'side', adjustable }),
            } satisfies DxfPanel
          case 'top':
          case 'bottom':
          case 'shelf':
            return { id, w: row.width_mm, h: row.depth_mm } satisfies DxfPanel
          default:
            return { id, w: row.width_mm, h: row.height_mm } satisfies DxfPanel
        }
      })
    })
    downloadFile(panelDxf(panels), 'application/dxf', 'closet-panels.dxf')
    setExportMenu(false)
  }

  const copyShareLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}${encodeShareHash(projectPackage)}`
      await navigator.clipboard.writeText(url)
      // Minimal UI text: translated 'copied' notice.
      setNotice(t(project.language, 'ui.copied', 'Share link copied'))
      window.history.replaceState(null, '', encodeShareHash(projectPackage))
    } catch (error) {
      console.error('Could not copy the share link', error)
      setNotice(ui.invalid)
    }
  }

  const downloadDrawings = async () => {
    try {
    const { jsPDF } = await import('jspdf')
    const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const { width, height, depth } = project.dimensions
    const finishId = migrateHexToId(project.finish)
    const scale = Math.min(94 / width, 105 / height)
    const frontWidth = width * scale
    const frontHeight = height * scale
    const frontX = 24
    const frontY = 47
    document.setFont('helvetica', 'bold')
    document.setFontSize(17)
    document.text('FORME · CLOSET PRODUCTION DRAWING', 16, 18)
    document.setFont('helvetica', 'normal')
    document.setFontSize(9)
    document.text(`${width} × ${height} × ${depth} mm  |  ${t(project.language, 'pdf.board', 'Board')}: ${BOARD_THICKNESS} mm  |  ${t(project.language, 'pdf.back', 'Back')}: ${BACK_THICKNESS} mm  |  ${t(project.language, 'pdf.finish', 'Finish')}: ${finishId}`, 16, 25)
    document.setFontSize(8)
    document.text(t(project.language, 'pdf.frontElevation', 'FRONT ELEVATION'), frontX, 40)
    document.rect(frontX, frontY, frontWidth, frontHeight)
    for (let index = 1; index <= project.shelves; index += 1) {
      const y = frontY + (frontHeight / (project.shelves + 1)) * index
      document.line(frontX, y, frontX + frontWidth, y)
    }
    if (project.doors) {
      document.line(frontX + frontWidth / 2, frontY, frontX + frontWidth / 2, frontY + frontHeight)
      document.circle(frontX + frontWidth / 2 - 2, frontY + frontHeight / 2, 0.8)
      document.circle(frontX + frontWidth / 2 + 2, frontY + frontHeight / 2, 0.8)
    }
    document.text(`W ${width} mm`, frontX, frontY + frontHeight + 8)
    document.text(`H ${height} mm`, frontX, frontY + frontHeight + 14)
    const sideX = 133
    const sideWidth = Math.max(8, Math.min(28, depth * scale))
    document.text(t(project.language, 'pdf.sideElevation', 'SIDE ELEVATION'), sideX, 40)
    document.rect(sideX, frontY, sideWidth, frontHeight)
    document.text(`D ${depth} mm`, sideX, frontY + frontHeight + 8)
    document.setFont('helvetica', 'bold')
    document.text(t(project.language, 'pdf.cutList', 'CUT LIST  ·  ALL DIMENSIONS IN MM'), 185, 40)
    document.setFont('helvetica', 'normal')
    document.setFontSize(7)
    // Translated headings via t() (label text only — dimensions stay numeric mm).
    const headings = [
      t(project.language, 'selected', 'Part / qty'),
      t(project.language, 'width', 'W'),
      t(project.language, 'height', 'H'),
      t(project.language, 'depth', 'D'),
      t(project.language, 'pdf.finish', 'Finish'),
    ]
    const colX = [185, 238, 252, 266, 279]
    headings.forEach((heading, index) => document.text(heading, colX[index], 47))
    document.line(185, 49, 290, 49)
    // Real per-part dims from model.ts (W-36 joinery), never carcass-only.
    const rows = cutListRows
    const rowHeight = 8
    const rowsPerPage = 7
    rows.forEach((row, index) => {
      // Paginate instead of overflowing: 7 rows fit page 1, extras go to page 2+.
      if (index > 0 && index % rowsPerPage === 0) {
        document.addPage()
        document.setFont('helvetica', 'bold')
        document.setFontSize(7)
        headings.forEach((heading, headingIndex) => document.text(heading, colX[headingIndex], 20))
        document.line(185, 22, 290, 22)
        document.setFont('helvetica', 'normal')
      }
      const pageIndex = index % rowsPerPage
      const y = (index < rowsPerPage ? 56 : 29) + pageIndex * rowHeight
      document.text(`${row.part} ×${row.quantity}`, colX[0], y, { maxWidth: 50 })
      document.text(String(row.width_mm), colX[1], y)
      document.text(String(row.height_mm), colX[2], y)
      document.text(String(row.depth_mm), colX[3], y)
      document.text(row.material, colX[4], y, { maxWidth: 11 })
    })
    const noteY = Math.max(169, frontY + frontHeight + 24)
    document.setFontSize(8)
    document.setFont('helvetica', 'bold')
    document.text(t(project.language, 'pdf.designNotes', 'DESIGN NOTES'), 16, noteY)
    document.setFont('helvetica', 'normal')
    document.setFontSize(7)
    const notes = warnings.length ? warnings : [t(project.language, 'notes.productionConfirm', 'Confirm hardware, edge banding, joinery, and installation clearances before manufacture.')]
    notes.slice(0, 3).forEach((note, index) => document.text(`• ${note}`, 16, noteY + 6 + index * 5, { maxWidth: 260 }))
    document.setFontSize(7)
    const generatedAt = new Date(project.savedAt).toLocaleString()
    document.text(t(project.language, 'pdf.generatedPreliminary', 'Generated {date}  ·  Preliminary design — verify dimensions and joinery before manufacture.').replace('{date}', generatedAt), 16, 202)
    document.save('closet-dimensioned-drawings.pdf')
    setExportMenu(false)
    } catch (error) {
      console.error('Could not export the dimensioned PDF', error)
      window.dispatchEvent(new CustomEvent('forme:app-notice', { detail: t(project.language, 'notes.pdfFailed', 'PDF export failed. Export the production JSON or CSV cut list instead.') }))
    }
  }

  const undo = () => {
    if (history.index <= 0) return
    const index = history.index - 1
    setHistory({ ...history, index })
    setProject(copyProject(history.items[index]))
  }
  const redo = () => {
    if (history.index >= history.items.length - 1) return
    const index = history.index + 1
    setHistory({ ...history, index })
    setProject(copyProject(history.items[index]))
  }

  return (
    <main className={`app-shell${rtl ? ' rtl' : ''}`} dir={rtl ? 'rtl' : 'ltr'}>
      <aside className="sidebar">
        <div className="brand-row"><div className="brand-mark"><span /></div><span className="brand-name">forme<span className="brand-dot">.</span></span></div>
        <div className="project-meta">
          <span className="eyebrow">{ui.project}</span>
          <div className="project-title">{ui.title}<ChevronDown size={15} /></div>
          <div className="saved-state"><span className="saved-dot" />{ui.saved}</div>
        </div>
        <div className="sidebar-scroll">
          <section className="control-section">
            <div className="section-heading"><Ruler size={15} /><h2>{ui.dimensions}</h2><span className="heading-unit">{project.unit}</span></div>
            <div className="dimension-grid">
              {(['width', 'height', 'depth'] as const).map((key) => {
                const min = project.selectedPart ? 9 : key === 'width' ? 300 : key === 'height' ? 300 : 200
                const max = key === 'width' ? 3600 : key === 'height' ? 3000 : 1200
                return (
                  <label className="dimension-field" key={key}>
                    <span>{ui[key]}</span>
                    <div className="number-input">
                      <input
                        type="number"
                        min={project.unit === 'mm' ? min : min / 10}
                        max={project.unit === 'mm' ? max : max / 10}
                        step={project.unit === 'mm' ? 10 : 1}
                        value={project.unit === 'mm' ? selectedDimensions[key] : Number((selectedDimensions[key] / 10).toFixed(1))}
                        onChange={(event) => updateDimension(key, Number(event.target.value))}
                        aria-label={`${ui[key]} (${project.unit})`}
                      />
                      <span>{project.unit}</span>
                    </div>
                  </label>
                )
              })}
            </div>
            {project.selectedPart && <p className="field-hint">{ui.editHint}</p>}
          </section>
          <section className="control-section">
            <div className="section-heading"><Layers3 size={15} /><h2>{ui.structure}</h2></div>
            <div className="row-control"><div><span className="control-label">{ui.shelves}</span><small>{ui.interior}</small></div><div className="stepper"><button onClick={() => updateProject({ shelves: Math.max(0, project.shelves - 1) })} aria-label={t(project.language, 'ui.removeShelf', 'Remove shelf')}>−</button><span>{project.shelves}</span><button onClick={() => updateProject({ shelves: Math.min(6, project.shelves + 1) })} aria-label={t(project.language, 'ui.addShelf', 'Add shelf')}>+</button></div></div>
            <div className="row-control"><div><span className="control-label">{ui.doors}</span><small>{t(project.language, 'ui.doubleHingedDoors', 'Double hinged doors')}</small></div><button className={`toggle ${project.doors ? 'active' : ''}`} onClick={() => updateProject(project.doors ? { doors: false, doorOpen: false, doorVariant: 'open' } : { doors: true, doorVariant: doorVariant === 'open' ? 'doubleHinged' : doorVariant })} aria-pressed={project.doors} aria-label={ui.doors}><span /></button></div>
            {project.doors && <div className="row-control"><div><span className="control-label">{t(project.language, 'ui.doorPosition', 'Door position')}</span><small>{project.doorOpen ? t(project.language, 'ui.open', 'Open') : t(project.language, 'ui.closed', 'Closed')}</small></div><button className="text-button" onClick={() => updateProject({ doorOpen: !project.doorOpen })}><DoorOpen size={15} />{project.doorOpen ? t(project.language, 'ui.closed', 'Close') : t(project.language, 'ui.open', 'Open')}</button></div>}
          </section>
          <section className="control-section">
            <div className="section-heading"><Layers3 size={15} /><h2>{t(project.language, 'modulesDoors', 'Modules & Doors')}</h2></div>
            <div className="row-control"><div><span className="control-label">{t(project.language, 'addModule', 'Add module')}</span><small>{t(project.language, 'addModuleHint', 'Interior fitting')}</small></div><button className="text-button" onClick={addModule} aria-label={t(project.language, 'addModule', 'Add module')}>+</button></div>
            <div className="part-select"><span className="part-indicator" /><select value={pendingModule} onChange={(event) => setPendingModule(event.target.value as ModuleTypeId)} aria-label={t(project.language, 'addModule', 'Add module')}>{MODULE_CATALOG.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select><ChevronDown size={15} /></div>
            {modules.map((entry) => {
              const def = moduleDef(entry.type)
              const selected = entry.id === selectedModuleId
              return (
                <div className="row-control" key={entry.id}>
                  <div><span className="control-label">{selected ? `● ${def.label}` : def.label}</span><small>{def.hint}</small></div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="text-button" onClick={() => setSelectedModuleId(selected ? null : entry.id)} aria-label={`Select ${def.label}`}>{selected ? 'Hide' : 'Show'}</button>
                    <button className="text-button" onClick={() => removeModule(entry.id)} aria-label={`Remove ${def.label}`}>×</button>
                  </div>
                </div>
              )
            })}
            {!modules.length && <p className="field-hint">{t(project.language, 'noModules', 'No modules yet — add one above to fit out the interior.')}</p>}
            <div className="row-control"><div><span className="control-label">{t(project.language, 'doorVariant', 'Door variant')}</span><small>{t(project.language, 'doorVariantHint', 'Opening style')}</small></div></div>
            <div className="part-select"><span className="part-indicator" /><select value={doorVariant} onChange={(event) => setDoorVariant(event.target.value as DoorVariantId)} aria-label={t(project.language, 'doorVariant', 'Door variant')}>{DOOR_VARIANTS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select><ChevronDown size={15} /></div>
            {doorNote && <p className="field-hint">{doorNote}</p>}
            <div className="row-control"><div><span className="control-label">{t(project.language, 'handle', 'Handle')}</span><small>{t(project.language, 'handleHint', 'Opening hardware')}</small></div></div>
            <div className="part-select"><span className="part-indicator" /><select value={project.handle ?? 'bar'} onChange={(event) => updateProject({ handle: event.target.value as HandleId })} aria-label={t(project.language, 'handle', 'Handle')}>{HANDLE_OPTIONS.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select><ChevronDown size={15} /></div>
          </section>
          <section className="control-section">
            <div className="section-heading"><Sparkles size={15} /><h2>{ui.finish}</h2></div>
            <div className="finish-list">
              {FINISHES.map((item, index) => {
                const names = ['oak', 'walnut', 'white', 'graphite'] as const
                return <button className={`finish-option ${project.finish === item.color ? 'selected' : ''}`} key={item.id} onClick={() => updateProject({ finish: item.color })} aria-label={ui[names[index]]}><span className="finish-swatch" style={{ backgroundColor: item.color }} /><span>{ui[names[index]]}</span>{project.finish === item.color && <Check size={15} className="finish-check" />}</button>
              })}
            </div>
          </section>
          <section className="control-section">
            <div className="section-heading"><SlidersHorizontal size={15} /><h2>{ui.selected}</h2></div>
            <div className="part-select"><span className="part-indicator" /><select value={project.selectedPart ?? ''} onChange={(event) => updateProject({ selectedPart: (event.target.value || null) as PartId | null })}><option value="">{t(project.language, 'ui.carcass', 'Carcass')}</option>{(Object.keys(partLabels) as PartId[]).map((part) => <option key={part} value={part}>{partLabels[part][project.language]}</option>)}</select><ChevronDown size={15} /></div>
          </section>
          <button className="reset-button" onClick={() => { const fresh = defaultProject(); setProject(fresh); setHistory({ items: [fresh], index: 0 }) }}><Clock3 size={14} />{ui.reset}</button>
          <div className="history-controls"><button onClick={undo} disabled={history.index <= 0}><Undo2 size={14} />{ui.undo}</button><button onClick={redo} disabled={history.index >= history.items.length - 1}><Redo2 size={14} />{ui.redo}</button><span>{history.index + 1}/{history.items.length}</span></div>
          {/* Live BOM estimate (ESTIMATE — not a quote). */}
          <p className="field-hint">{`BOM · ${priceEst.materialM2.toFixed(2)} m² · ESTIMATE $${priceEst.total.toFixed(2)} USD`}</p>
        </div>
        <div className="sidebar-footer">
          <Globe2 size={16} /><span className="language-label">{ui.language}</span>
          <select value={project.language} onChange={(event) => updateProject({ language: event.target.value as Language })} aria-label={ui.language}><option value="en">English</option><option value="he">עברית</option><option value="zh">中文</option><option value="es">Español</option></select>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>{t(project.language, 'ui.designs', 'Designs')}</span><ChevronRight size={14} /><strong>{ui.title}</strong><span className="version-pill">{t(project.language, 'ui.draft', 'Draft')}</span></div>
          <div className="topbar-actions">
            <button className="unit-switch" onClick={() => updateProject({ unit: project.unit === 'mm' ? 'cm' : 'mm' })}><span>{ui.units}</span><strong>{project.unit}</strong><ChevronDown size={13} /></button>
            <button className="import-button" onClick={() => fileRef.current?.click()}><Upload size={15} />{ui.import}</button>
            <input ref={fileRef} hidden type="file" accept=".glb,.json,model/gltf-binary,application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file) }} />
            <div className="export-wrap"><button className="export-button" onClick={() => setExportMenu(!exportMenu)}><ArrowDownToLine size={16} />{ui.export}<ChevronDown size={14} /></button>
              {exportMenu && <div className="export-menu">
                <button onClick={() => { exportImage?.(); setExportMenu(false) }}><Download size={15} />{ui.image}</button>
                <button onClick={() => { export3D?.(); setExportMenu(false) }}><Layers3 size={15} />{ui.model}</button>
                <button onClick={downloadProject}><Download size={15} />{ui.format}</button>
                <button onClick={downloadDrawings}><Download size={15} />{ui.pdf}</button>
                <button onClick={downloadCutList}><Ruler size={15} />{ui.csv}</button>
                <button onClick={downloadHardware}><Ruler size={15} />{t(project.language, 'ui.hardware', 'Hardware')} · CSV</button>
                <button onClick={downloadDxf}><Ruler size={15} />DXF Project · .dxf</button>
                <button onClick={downloadProduction}><Ruler size={15} />{ui.spec}</button>
              </div>}
            </div>
            <button className="import-button" onClick={() => void copyShareLink()}>{t(project.language, 'ui.copyLink', 'Copy Link')}</button>
            <div className="avatar">G</div>
          </div>
        </header>
        <div className="canvas-area">
          <div className="canvas-title"><div><span className="eyebrow">{ui.assembly}</span><h1>{ui.title}</h1></div><div className="material-chip"><span style={{ background: project.finish }} />{ui.support}</div></div>
          <div className="scene-wrap">
            <ClosetScene project={project} projectPackage={projectPackage} selectedPart={project.selectedPart} onSelectPart={(selectedPart) => updateProject({ selectedPart })} onExportImage={registerImageExporter} onExport3D={register3DExporter} />
            <div className="dimension-tag tag-width"><span />{project.dimensions.width}<small>mm</small></div>
            <div className="dimension-tag tag-height"><span />{project.dimensions.height}<small>mm</small></div>
            <div className="dimension-tag tag-depth"><span />{project.dimensions.depth}<small>mm</small></div>
            <div className="view-hint">{ui.rotate}</div>
            <div className="view-tools"><button onClick={() => updateProject({ doorOpen: !project.doorOpen })} aria-label="Toggle doors"><DoorOpen size={17} /></button><button onClick={() => updateProject({ assembly: project.assembly >= 1 ? 0 : 1 })} aria-label="Toggle exploded view"><Layers3 size={17} /></button></div>
          </div>
          <div className="timeline-card"><div className="timeline-heading"><div className="timeline-icon"><Ruler size={16} /></div><div><strong>{t(project.language, 'frontElevation', 'Front elevation · 2D')}</strong><small>{t(project.language, 'frontElevationHint', `${modules.length} modules · click a block to select`)}</small></div><button className="text-button" onClick={() => setPlanOpen(!planOpen)}>{planOpen ? t(project.language, 'hide', 'Hide') : t(project.language, 'show', 'Show')}</button></div>{planOpen && <Plan2D project={{ dimensions: project.dimensions, shelves: project.shelves, doors: project.doors }} modules={modules} doorVariant={doorVariant} selectedId={selectedModuleId} onSelect={setSelectedModuleId} onMove={(id, zone) => updateProject({ modules: modules.map((entry) => (entry.id === id ? { ...entry, zone } : entry)) })} />}</div>
          <div className="timeline-card"><div className="timeline-heading"><div className="timeline-icon"><Layers3 size={16} /></div><div><strong>{ui.assembled}</strong><small>{ui.assembly}</small></div><span className="timeline-time">{Math.round(project.assembly * 100)}%</span></div><input className="assembly-slider" type="range" min="0" max="1" step="0.01" value={project.assembly} onChange={(event) => updateProject({ assembly: Number(event.target.value) })} aria-label={ui.assembly} /><div className="timeline-labels"><span>{ui.assembled}</span><span>{ui.exploded}</span></div></div>
          <div className={`design-check ${warnings.length || moduleNotes.length ? 'has-warning' : ''}`}><div className="check-icon">{warnings.length || moduleNotes.length ? <TriangleAlert size={16} /> : <Check size={16} />}</div><div><strong>{warnings.length || moduleNotes.length ? ui.constraints : ui.valid}</strong><span>{warnings[0] ?? ui.support}</span>{moduleNotes[0] && <span title={moduleNotes.join('\n')}>{moduleNotes[0]}</span>}</div><ChevronRight size={16} className="check-chevron" /></div>
          <footer className="canvas-footer"><span><span className="footer-dot" />{t(project.language, 'ui.preview3d', '3D preview')}</span><span>W {project.dimensions.width} · H {project.dimensions.height} · D {project.dimensions.depth} mm</span></footer>
        </div>
      </section>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )
}

export default App
