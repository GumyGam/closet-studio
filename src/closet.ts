export type Language = 'en' | 'he' | 'zh' | 'es'
export type PartId = 'left' | 'right' | 'top' | 'bottom' | 'back' | 'shelf' | 'door'
export type Dimensions = { width: number; height: number; depth: number }
export type ClosetProject = {
  format: 'forme-closet'
  version: 1
  savedAt: string
  name: string
  dimensions: Dimensions
  shelves: number
  doors: boolean
  doorOpen: boolean
  finish: string
  language: Language
  unit: 'mm' | 'cm'
  selectedPart: PartId | null
  partOverrides: Partial<Record<PartId, Partial<Dimensions>>>
  assembly: number
}
export type ClosetProjectPackage = {
  format: 'forme-closet-package'
  version: 1
  project: ClosetProject
  history: ClosetProject[]
  historyIndex: number
}

export const DEFAULT_DIMENSIONS: Dimensions = { width: 1800, height: 2200, depth: 600 }
export const FINISHES = [
  { id: 'oak', color: '#b9966c' },
  { id: 'walnut', color: '#75513d' },
  { id: 'white', color: '#e8e4dc' },
  { id: 'graphite', color: '#4d4b49' },
] as const

export const partLabels: Record<PartId, Record<Language, string>> = {
  left: { en: 'Left side panel', he: 'דופן שמאל', zh: '左侧板', es: 'Lateral izquierdo' },
  right: { en: 'Right side panel', he: 'דופן ימין', zh: '右侧板', es: 'Lateral derecho' },
  top: { en: 'Top panel', he: 'לוח עליון', zh: '顶板', es: 'Panel superior' },
  bottom: { en: 'Bottom panel', he: 'לוח תחתון', zh: '底板', es: 'Panel inferior' },
  back: { en: 'Back panel', he: 'גב הארון', zh: '背板', es: 'Panel trasero' },
  shelf: { en: 'Shelf', he: 'מדף', zh: '层板', es: 'Estante' },
  door: { en: 'Door', he: 'דלת', zh: '柜门', es: 'Puerta' },
}

export function isClosetProject(value: unknown): value is ClosetProject {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ClosetProject>
  const dimensions = candidate.dimensions
  const isInRange = (value: unknown, min: number, max: number) =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
  return candidate.format === 'forme-closet'
    && candidate.version === 1
    && !!dimensions
    && isInRange(dimensions.width, 300, 3600)
    && isInRange(dimensions.height, 300, 3000)
    && isInRange(dimensions.depth, 200, 1200)
    && Number.isInteger(candidate.shelves) && candidate.shelves! >= 0 && candidate.shelves! <= 6
    && typeof candidate.doors === 'boolean'
    && FINISHES.some((finish) => finish.color === candidate.finish)
    && ['en', 'he', 'zh', 'es'].includes(candidate.language ?? '')
    && ['mm', 'cm'].includes(candidate.unit ?? '')
    && isInRange(candidate.assembly, 0, 1)
    && typeof candidate.name === 'string'
    && typeof candidate.savedAt === 'string'
    && typeof candidate.doorOpen === 'boolean'
    && !!candidate.partOverrides
    && typeof candidate.partOverrides === 'object'
    && (candidate.selectedPart === null || Object.prototype.hasOwnProperty.call(partLabels, candidate.selectedPart ?? ''))
    && Object.entries(candidate.partOverrides).every(([part, dimensions]) =>
      Object.prototype.hasOwnProperty.call(partLabels, part)
      && !!dimensions
      && Object.entries(dimensions).every(([axis, dimension]) =>
        ['width', 'height', 'depth'].includes(axis)
        && isInRange(dimension, 9, axis === 'width' ? 3600 : axis === 'height' ? 3000 : 1200),
      ),
    )
}

export function isClosetProjectPackage(value: unknown): value is ClosetProjectPackage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ClosetProjectPackage>
  return candidate.format === 'forme-closet-package'
    && candidate.version === 1
    && isClosetProject(candidate.project)
    && Array.isArray(candidate.history)
    && candidate.history.length > 0 && candidate.history.length <= 80
    && candidate.history.every(isClosetProject)
    && Number.isInteger(candidate.historyIndex)
    && candidate.historyIndex! >= 0 && candidate.historyIndex! < candidate.history.length
}

export function getWarnings(dimensions: Dimensions, shelves: number, doors: boolean, language: Language) {
  const text = {
    en: ['Add a center support or split this tall unit for stability.', 'Wide shelves may sag; add a center divider or reduce the span.', 'Depth below 300 mm may not fit standard hangers.', 'Add doors to check opening clearance.'],
    he: ['בגובה כזה מומלץ להוסיף תמיכה מרכזית או לפצל את היחידה.', 'מדפים רחבים עלולים לשקוע. הוסיפו מחיצה או הקטינו את המפתח.', 'עומק קטן מ־300 מ״מ עלול לא להתאים לקולבים סטנדרטיים.', 'הוסיפו דלתות כדי לבדוק מרווח פתיחה.'],
    zh: ['此高度建议添加中间支撑或拆分柜体。', '宽层板可能下垂，请添加中隔板或缩小跨度。', '深度小于 300 毫米，可能无法容纳标准衣架。', '添加柜门以检查开启空间。'],
    es: ['A esta altura, añade un soporte central o divide el módulo.', 'Los estantes anchos pueden combarse; añade un divisor o reduce el tramo.', 'Con menos de 300 mm de fondo, podrían no caber perchas estándar.', 'Añade puertas para comprobar la apertura.'],
  }[language]
  const warnings: string[] = []
  if (dimensions.height > 2400) warnings.push(text[0])
  if (dimensions.width > 1000 && shelves > 0) warnings.push(text[1])
  if (dimensions.depth < 300) warnings.push(text[2])
  if (!doors) warnings.push(text[3])
  return warnings
}

export function buildCutList(project: ClosetProject) {
  const left = dimensionsForPart(project, 'left')
  const right = dimensionsForPart(project, 'right')
  const top = dimensionsForPart(project, 'top')
  const bottom = dimensionsForPart(project, 'bottom')
  const back = dimensionsForPart(project, 'back')
  const shelf = dimensionsForPart(project, 'shelf')
  const door = dimensionsForPart(project, 'door')
  return [
    { part: 'Left side', quantity: 1, width_mm: left.width, height_mm: left.height, depth_mm: left.depth, material: project.finish },
    { part: 'Right side', quantity: 1, width_mm: right.width, height_mm: right.height, depth_mm: right.depth, material: project.finish },
    { part: 'Top panel', quantity: 1, width_mm: top.width, height_mm: top.height, depth_mm: top.depth, material: project.finish },
    { part: 'Bottom panel', quantity: 1, width_mm: bottom.width, height_mm: bottom.height, depth_mm: bottom.depth, material: project.finish },
    { part: 'Back panel', quantity: 1, width_mm: back.width, height_mm: back.height, depth_mm: back.depth, material: 'back' },
    { part: 'Shelf', quantity: project.shelves, width_mm: shelf.width, height_mm: shelf.height, depth_mm: shelf.depth, material: project.finish },
    ...(project.doors ? [{ part: 'Door', quantity: 2, width_mm: door.width, height_mm: door.height, depth_mm: door.depth, material: project.finish }] : []),
  ]
}

export const copyProject = (project: ClosetProject): ClosetProject =>
  JSON.parse(JSON.stringify(project)) as ClosetProject

export function dimensionsForPart(project: ClosetProject, part: PartId): Dimensions {
  const { width, height, depth } = project.dimensions
  const defaults: Record<PartId, Dimensions> = {
    left: { width: 18, height, depth },
    right: { width: 18, height, depth },
    top: { width, height: 18, depth },
    bottom: { width, height: 18, depth },
    back: { width: width - 36, height: height - 36, depth: 9 },
    shelf: { width: width - 36, height: 18, depth: depth - 25 },
    door: { width: Math.round(width / 2) - 9, height: height - 18, depth: 20 },
  }
  return { ...defaults[part], ...project.partOverrides[part] }
}
