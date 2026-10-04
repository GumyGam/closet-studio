import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownToLine, Check, ChevronDown, ChevronRight, Clock3, DoorOpen, Download,
  Globe2, Layers3, Ruler, SlidersHorizontal, Sparkles, TriangleAlert, Undo2, Redo2, Upload,
} from 'lucide-react'
import ClosetScene from './ClosetScene'
import {
  buildCutList, copyProject, DEFAULT_DIMENSIONS, dimensionsForPart, FINISHES, getWarnings, isClosetProject,
  isClosetProjectPackage, partLabels,
  type ClosetProject, type ClosetProjectPackage, type Dimensions, type Language, type PartId,
} from './closet'
import { translate } from './translations'

const STORAGE_KEY = 'forme-closet-project-v1'
type HistoryState = { items: ClosetProject[]; index: number }
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
  }
}

function readSaved(): { project: ClosetProject; history: HistoryState } {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (isClosetProjectPackage(value)) {
      return {
        project: copyProject(value.project),
        history: { items: value.history.map(copyProject), index: Math.max(0, Math.min(value.historyIndex, value.history.length - 1)) },
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
  const warnings = getWarnings(project.dimensions, project.shelves, project.doors, project.language)
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
      window.dispatchEvent(new CustomEvent('forme:app-notice', { detail: 'Automatic save failed. Export a project backup to keep your work.' }))
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

  const restorePackage = (value: unknown) => {
    let bundle: ClosetProjectPackage
    if (isClosetProjectPackage(value)) {
      bundle = value
    } else if (isClosetProject(value)) {
      bundle = { format: 'forme-closet-package', version: 1, project: value, history: [value], historyIndex: 0 }
    } else {
      throw new Error(ui.invalid)
    }
    const restored = copyProject(bundle.project)
    const items = bundle.history.map(copyProject)
    if (!items.length) items.push(restored)
    setProject(restored)
    setHistory({ items, index: Math.max(0, Math.min(bundle.historyIndex, items.length - 1)) })
    setNotice(ui.restored)
  }

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
        boardThickness: 18,
        backThickness: 9,
        cutList: buildCutList(project),
        designWarnings: warnings,
        productionNote: 'Confirm hardware, edge banding, joinery, and installation clearances before manufacture.',
      },
    }
    downloadFile(JSON.stringify(spec, null, 2), 'application/json', 'closet-production-package.json')
    setExportMenu(false)
  }

  const downloadCutList = () => {
    const rows = buildCutList(project)
    const columns = ['part', 'quantity', 'width_mm', 'height_mm', 'depth_mm', 'material']
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

  const downloadDrawings = async () => {
    try {
    const { jsPDF } = await import('jspdf')
    const document = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const { width, height, depth } = project.dimensions
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
    document.text(`${width} × ${height} × ${depth} mm  |  Board: 18 mm  |  Back: 9 mm  |  Finish: ${project.finish}`, 16, 25)
    document.setFontSize(8)
    document.text('FRONT ELEVATION', frontX, 40)
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
    document.text('SIDE ELEVATION', sideX, 40)
    document.rect(sideX, frontY, sideWidth, frontHeight)
    document.text(`D ${depth} mm`, sideX, frontY + frontHeight + 8)
    document.setFont('helvetica', 'bold')
    document.text('CUT LIST  ·  ALL DIMENSIONS IN MM', 185, 40)
    document.setFont('helvetica', 'normal')
    document.setFontSize(7)
    const headings = ['Part / qty', 'W', 'H', 'D']
    const colX = [185, 245, 261, 276]
    headings.forEach((heading, index) => document.text(heading, colX[index], 47))
    document.line(185, 49, 290, 49)
    const rows = buildCutList(project)
    rows.forEach((row, index) => {
      const y = 56 + index * 8
      document.text(`${row.part} ×${row.quantity}`, colX[0], y)
      document.text(String(row.width_mm), colX[1], y)
      document.text(String(row.height_mm), colX[2], y)
      document.text(String(row.depth_mm), colX[3], y)
    })
    const noteY = Math.max(169, frontY + frontHeight + 24)
    document.setFontSize(8)
    document.setFont('helvetica', 'bold')
    document.text('DESIGN NOTES', 16, noteY)
    document.setFont('helvetica', 'normal')
    document.setFontSize(7)
    const notes = warnings.length ? warnings : ['Confirm hardware, edge banding, joinery, and installation clearances before manufacture.']
    notes.slice(0, 3).forEach((note, index) => document.text(`• ${note}`, 16, noteY + 6 + index * 5, { maxWidth: 260 }))
    document.setFontSize(7)
    document.text(`Generated ${new Date(project.savedAt).toLocaleString()}  ·  Preliminary design — verify dimensions and joinery before manufacture.`, 16, 202)
    document.save('closet-dimensioned-drawings.pdf')
    setExportMenu(false)
    } catch (error) {
      console.error('Could not export the dimensioned PDF', error)
      window.dispatchEvent(new CustomEvent('forme:app-notice', { detail: 'PDF export failed. Export the production JSON or CSV cut list instead.' }))
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
            <div className="row-control"><div><span className="control-label">{ui.shelves}</span><small>{ui.interior}</small></div><div className="stepper"><button onClick={() => updateProject({ shelves: Math.max(0, project.shelves - 1) })} aria-label="Remove shelf">−</button><span>{project.shelves}</span><button onClick={() => updateProject({ shelves: Math.min(6, project.shelves + 1) })} aria-label="Add shelf">+</button></div></div>
            <div className="row-control"><div><span className="control-label">{ui.doors}</span><small>Double hinged doors</small></div><button className={`toggle ${project.doors ? 'active' : ''}`} onClick={() => updateProject({ doors: !project.doors, doorOpen: false })} aria-pressed={project.doors} aria-label={ui.doors}><span /></button></div>
            {project.doors && <div className="row-control"><div><span className="control-label">Door position</span><small>{project.doorOpen ? 'Open' : 'Closed'}</small></div><button className="text-button" onClick={() => updateProject({ doorOpen: !project.doorOpen })}><DoorOpen size={15} />{project.doorOpen ? 'Close' : 'Open'}</button></div>}
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
            <div className="part-select"><span className="part-indicator" /><select value={project.selectedPart ?? ''} onChange={(event) => updateProject({ selectedPart: (event.target.value || null) as PartId | null })}><option value="">{project.language === 'he' ? 'גוף הארון' : project.language === 'zh' ? '柜体' : project.language === 'es' ? 'Estructura' : 'Carcass'}</option>{(Object.keys(partLabels) as PartId[]).map((part) => <option key={part} value={part}>{partLabels[part][project.language]}</option>)}</select><ChevronDown size={15} /></div>
          </section>
          <button className="reset-button" onClick={() => { const fresh = defaultProject(); setProject(fresh); setHistory({ items: [fresh], index: 0 }) }}><Clock3 size={14} />{ui.reset}</button>
          <div className="history-controls"><button onClick={undo} disabled={history.index <= 0}><Undo2 size={14} />{ui.undo}</button><button onClick={redo} disabled={history.index >= history.items.length - 1}><Redo2 size={14} />{ui.redo}</button><span>{history.index + 1}/{history.items.length}</span></div>
        </div>
        <div className="sidebar-footer">
          <Globe2 size={16} /><span className="language-label">{ui.language}</span>
          <select value={project.language} onChange={(event) => updateProject({ language: event.target.value as Language })} aria-label={ui.language}><option value="en">English</option><option value="he">עברית</option><option value="zh">中文</option><option value="es">Español</option></select>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>Designs</span><ChevronRight size={14} /><strong>{ui.title}</strong><span className="version-pill">Draft</span></div>
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
                <button onClick={downloadProduction}><Ruler size={15} />{ui.spec}</button>
              </div>}
            </div>
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
          <div className="timeline-card"><div className="timeline-heading"><div className="timeline-icon"><Layers3 size={16} /></div><div><strong>{ui.assembled}</strong><small>{ui.assembly}</small></div><span className="timeline-time">{Math.round(project.assembly * 100)}%</span></div><input className="assembly-slider" type="range" min="0" max="1" step="0.01" value={project.assembly} onChange={(event) => updateProject({ assembly: Number(event.target.value) })} aria-label={ui.assembly} /><div className="timeline-labels"><span>{ui.assembled}</span><span>{ui.exploded}</span></div></div>
          <div className={`design-check ${warnings.length ? 'has-warning' : ''}`}><div className="check-icon">{warnings.length ? <TriangleAlert size={16} /> : <Check size={16} />}</div><div><strong>{warnings.length ? ui.constraints : ui.valid}</strong><span>{warnings[0] ?? ui.support}</span></div><ChevronRight size={16} className="check-chevron" /></div>
          <footer className="canvas-footer"><span><span className="footer-dot" />3D preview</span><span>W {project.dimensions.width} · H {project.dimensions.height} · D {project.dimensions.depth} mm</span></footer>
        </div>
      </section>
      {notice && <div className="toast" role="status">{notice}</div>}
    </main>
  )
}

export default App
