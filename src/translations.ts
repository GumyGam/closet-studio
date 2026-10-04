import type { Language } from './closet'

const translations = {
  en: {
    project: 'MY PROJECT', title: 'Walk-in wardrobe', saved: 'Saved on this device', dimensions: 'Dimensions',
    width: 'Width', height: 'Height', depth: 'Depth', structure: 'Structure', shelves: 'Shelves', doors: 'Doors',
    finish: 'Finish', oak: 'Natural oak', walnut: 'Walnut', white: 'Warm white', graphite: 'Graphite',
    selected: 'Selected part', interior: 'Interior layout', assembly: 'ASSEMBLY PREVIEW', assembled: 'Assembled',
    exploded: 'Exploded', rotate: 'Drag to orbit · scroll to zoom', constraints: 'DESIGN CHECK', valid: 'Looking good',
    export: 'Export', import: 'Open project', image: 'Dimensioned image · PNG', spec: 'Production package · JSON',
    model: '3D project · GLB', pdf: 'Dimensioned drawings · PDF', csv: 'Cut list · CSV', language: 'Language', units: 'Units', history: 'History', undo: 'Undo', redo: 'Redo',
    restored: 'Project restored', invalid: 'This file is not a supported Forme project.', support: '18 mm boards · 9 mm back',
    editHint: 'Select a panel in the model to edit its dimensions.', reset: 'Reset design', format: 'JSON project · editable',
    savedElsewhere: 'Export a project file to move it to another device or browser.',
    // Catalog slice: flat dotted keys (stays Record<string,string>-compatible for App.tsx).
    // Door variants (10)
    'doorVariants.open': 'Open (no doors)', 'doorVariants.doubleHinged': 'Double hinged',
    'doorVariants.singleL': 'Single door · left hinge', 'doorVariants.singleR': 'Single door · right hinge',
    'doorVariants.sliding2': 'Sliding · 2 panels', 'doorVariants.sliding3': 'Sliding · 3 panels',
    'doorVariants.bifold': 'Bifold', 'doorVariants.glass': 'Glass doors',
    'doorVariants.mirror': 'Mirrored doors', 'doorVariants.louvered': 'Louvered doors',
    // Interior modules (14)
    'modules.doubleHang': 'Double hang', 'modules.longHang': 'Long hang',
    'modules.drawers3': '3 drawers', 'modules.drawersDeep': 'Deep drawers',
    'modules.shoeFlat': 'Shoe shelf · flat', 'modules.shoeTilt': 'Shoe rack · tilted',
    'modules.basket': 'Wire basket', 'modules.valetRod': 'Valet rod',
    'modules.tieRack': 'Tie & belt rack', 'modules.trouserPullout': 'Trouser pull-out',
    'modules.shelfAdjustable': 'Adjustable shelf', 'modules.glassShelf': 'Glass shelf',
    'modules.ledStrip': 'LED strip', 'modules.interiorMirror': 'Interior mirror',
    // Handles (4)
    'handles.bar': 'Bar handle', 'handles.knob': 'Knob',
    'handles.recessed': 'Recessed pull', 'handles.push': 'Push-to-open',
    // UI chrome (16)
    'ui.doubleHingedDoors': 'Double hinged doors', 'ui.doorPosition': 'Door position',
    'ui.open': 'Open', 'ui.closed': 'Closed', 'ui.carcass': 'Carcass',
    'ui.designs': 'Designs', 'ui.draft': 'Draft', 'ui.preview3d': '3D preview',
    'ui.removeShelf': 'Remove shelf', 'ui.addShelf': 'Add shelf',
    'ui.copyLink': 'Copy link', 'ui.copied': 'Copied',
    'ui.hardware': 'Hardware', 'ui.modulesDoors': 'Modules & doors',
    'ui.plan2d': '2D plan', 'ui.roomFit': 'Room fit',
    // PDF headings — label text only; all dimensions stay numeric mm per CAD/DXF spec (8)
    'pdf.frontElevation': 'FRONT ELEVATION', 'pdf.sideElevation': 'SIDE ELEVATION',
    'pdf.cutList': 'CUT LIST · ALL DIMENSIONS IN MM', 'pdf.designNotes': 'DESIGN NOTES',
    'pdf.finish': 'Finish', 'pdf.board': 'Board', 'pdf.back': 'Back',
    'pdf.generatedPreliminary': 'Generated {date} · Preliminary design — verify dimensions and joinery before manufacture.',
    // PNG overlay (3)
    'png.shelves': 'Shelves', 'png.doors': 'Doors', 'png.noDoors': 'No doors',
    // Notices (5)
    'notes.saveFailed': 'Automatic save failed. Export a project backup to keep your work.',
    'notes.pdfFailed': 'PDF export failed. Export the production JSON or CSV cut list instead.',
    'notes.invalidFile': 'This file is not a supported Forme project.',
    'notes.restored': 'Project restored',
    'notes.confirmReset': 'Reset the design? Unsaved changes will be lost.',
  },
  he: {
    project: 'הפרויקט שלי', title: 'ארון בגדים', saved: 'נשמר במכשיר זה', dimensions: 'מידות',
    width: 'רוחב', height: 'גובה', depth: 'עומק', structure: 'מבנה', shelves: 'מדפים', doors: 'דלתות',
    finish: 'גימור', oak: 'אלון טבעי', walnut: 'אגוז', white: 'לבן חם', graphite: 'גרפיט',
    selected: 'חלק נבחר', interior: 'חלוקה פנימית', assembly: 'תצוגת הרכבה', assembled: 'מורכב',
    exploded: 'מפורק', rotate: 'גררו לסיבוב · גללו להגדלה', constraints: 'בדיקת תכנון', valid: 'נראה מצוין',
    export: 'ייצוא', import: 'פתיחת פרויקט', image: 'תמונה עם מידות · PNG', spec: 'מפרט ייצור · JSON',
    model: 'פרויקט תלת־ממד · GLB', pdf: 'שרטוטים עם מידות · PDF', csv: 'רשימת חיתוך · CSV', language: 'שפה', units: 'יחידות', history: 'היסטוריה', undo: 'ביטול', redo: 'ביצוע חוזר',
    restored: 'הפרויקט שוחזר', invalid: 'הקובץ אינו פרויקט Forme נתמך.', support: 'לוחות 18 מ״מ · גב 9 מ״מ',
    editHint: 'בחרו לוח במודל כדי לערוך את מידותיו.', reset: 'איפוס עיצוב', format: 'פרויקט JSON · ניתן לעריכה',
    savedElsewhere: 'ייצאו קובץ פרויקט כדי להעביר אותו למכשיר או לדפדפן אחר.',
    // Catalog slice: flat dotted keys (stays Record<string,string>-compatible for App.tsx).
    // Door variants (10)
    'doorVariants.open': 'פתוח (ללא דלתות)', 'doorVariants.doubleHinged': 'דלת כנף כפולה',
    'doorVariants.singleL': 'דלת בודדת · ציר שמאל', 'doorVariants.singleR': 'דלת בודדת · ציר ימין',
    'doorVariants.sliding2': 'הזזה · 2 כנפיים', 'doorVariants.sliding3': 'הזזה · 3 כנפיים',
    'doorVariants.bifold': 'דלת מתקפלת', 'doorVariants.glass': 'דלתות זכוכית',
    'doorVariants.mirror': 'דלתות מראה', 'doorVariants.louvered': 'דלתות תריס',
    // Interior modules (14)
    'modules.doubleHang': 'תלייה כפולה', 'modules.longHang': 'תלייה ארוכה',
    'modules.drawers3': '3 מגירות', 'modules.drawersDeep': 'מגירות עמוקות',
    'modules.shoeFlat': 'מדף נעליים ישר', 'modules.shoeTilt': 'מתקן נעליים משופע',
    'modules.basket': 'סל רשת', 'modules.valetRod': 'מוט שירות',
    'modules.tieRack': 'מתקן עניבות וחגורות', 'modules.trouserPullout': 'מתקן מכנסיים נשלף',
    'modules.shelfAdjustable': 'מדף מתכוונן', 'modules.glassShelf': 'מדף זכוכית',
    'modules.ledStrip': 'פס לד', 'modules.interiorMirror': 'מראה פנימית',
    // Handles (4)
    'handles.bar': 'ידית מוט', 'handles.knob': 'כפתור',
    'handles.recessed': 'ידית שקועה', 'handles.push': 'פתיחה בלחיצה',
    // UI chrome (16)
    'ui.doubleHingedDoors': 'דלתות כנף כפולות', 'ui.doorPosition': 'מצב דלת',
    'ui.open': 'פתוח', 'ui.closed': 'סגור', 'ui.carcass': 'גוף הארון',
    'ui.designs': 'עיצובים', 'ui.draft': 'טיוטה', 'ui.preview3d': 'תצוגה תלת־ממדית',
    'ui.removeShelf': 'הסרת מדף', 'ui.addShelf': 'הוספת מדף',
    'ui.copyLink': 'העתקת קישור', 'ui.copied': 'הועתק',
    'ui.hardware': 'פרזול', 'ui.modulesDoors': 'מודולים ודלתות',
    'ui.plan2d': 'תוכנית דו־ממדית', 'ui.roomFit': 'התאמה לחדר',
    // PDF headings — label text only; all dimensions stay numeric mm per CAD/DXF spec (8)
    'pdf.frontElevation': 'מבט חזית', 'pdf.sideElevation': 'מבט צד',
    'pdf.cutList': 'רשימת חיתוך · כל המידות במ״מ', 'pdf.designNotes': 'הערות תכנון',
    'pdf.finish': 'גימור', 'pdf.board': 'לוח', 'pdf.back': 'גב',
    'pdf.generatedPreliminary': 'נוצר ב־{date} · תכנון ראשוני — יש לוודא מידות וחיבורים לפני ייצור.',
    // PNG overlay (3)
    'png.shelves': 'מדפים', 'png.doors': 'דלתות', 'png.noDoors': 'ללא דלתות',
    // Notices (5)
    'notes.saveFailed': 'השמירה האוטומטית נכשלה. ייצאו גיבוי כדי לשמור את העבודה.',
    'notes.pdfFailed': 'ייצוא ה־PDF נכשל. ייצאו JSON או רשימת חיתוך CSV במקום.',
    'notes.invalidFile': 'הקובץ אינו פרויקט Forme נתמך.',
    'notes.restored': 'הפרויקט שוחזר',
    'notes.confirmReset': 'לאפס את העיצוב? שינויים שלא נשמרו יאבדו.',
  },
  zh: {
    project: '我的项目', title: '步入式衣柜', saved: '已保存在此设备', dimensions: '尺寸',
    width: '宽度', height: '高度', depth: '深度', structure: '结构', shelves: '层板', doors: '柜门',
    finish: '饰面', oak: '天然橡木', walnut: '胡桃木', white: '暖白色', graphite: '石墨色',
    selected: '已选部件', interior: '内部布局', assembly: '装配预览', assembled: '已装配',
    exploded: '分解', rotate: '拖动旋转 · 滚动缩放', constraints: '设计检查', valid: '设计合理',
    export: '导出', import: '打开项目', image: '带尺寸的图像 · PNG', spec: '生产规格 · JSON',
    model: '3D 项目 · GLB', pdf: '尺寸图纸 · PDF', csv: '板材清单 · CSV', language: '语言', units: '单位', history: '历史记录', undo: '撤销', redo: '重做',
    restored: '项目已恢复', invalid: '此文件不是支持的 Forme 项目。', support: '18 毫米板材 · 9 毫米背板',
    editHint: '在模型中选择板件以编辑尺寸。', reset: '重置设计', format: 'JSON 项目 · 可编辑',
    savedElsewhere: '导出项目文件，以便在其他设备或浏览器中打开。',
    // Catalog slice: flat dotted keys (stays Record<string,string>-compatible for App.tsx).
    // Door variants (10)
    'doorVariants.open': '开放式（无柜门）', 'doorVariants.doubleHinged': '双开平开门',
    'doorVariants.singleL': '单开门 · 左铰链', 'doorVariants.singleR': '单开门 · 右铰链',
    'doorVariants.sliding2': '推拉门 · 两扇', 'doorVariants.sliding3': '推拉门 · 三扇',
    'doorVariants.bifold': '折叠门', 'doorVariants.glass': '玻璃柜门',
    'doorVariants.mirror': '镜面柜门', 'doorVariants.louvered': '百叶柜门',
    // Interior modules (14)
    'modules.doubleHang': '双排挂衣', 'modules.longHang': '长款挂衣',
    'modules.drawers3': '三层抽屉', 'modules.drawersDeep': '深抽屉',
    'modules.shoeFlat': '平放鞋架', 'modules.shoeTilt': '斜放鞋架',
    'modules.basket': '拉篮', 'modules.valetRod': '暂挂衣杆',
    'modules.tieRack': '领带皮带架', 'modules.trouserPullout': '裤架拉篮',
    'modules.shelfAdjustable': '活动层板', 'modules.glassShelf': '玻璃层板',
    'modules.ledStrip': 'LED 灯带', 'modules.interiorMirror': '内装试衣镜',
    // Handles (4)
    'handles.bar': '拉手杆', 'handles.knob': '圆形拉手',
    'handles.recessed': '嵌入式拉手', 'handles.push': '按压开启',
    // UI chrome (16)
    'ui.doubleHingedDoors': '双开平开门', 'ui.doorPosition': '柜门位置',
    'ui.open': '开启', 'ui.closed': '关闭', 'ui.carcass': '柜体',
    'ui.designs': '设计方案', 'ui.draft': '草稿', 'ui.preview3d': '3D 预览',
    'ui.removeShelf': '移除层板', 'ui.addShelf': '添加层板',
    'ui.copyLink': '复制链接', 'ui.copied': '已复制',
    'ui.hardware': '五金件', 'ui.modulesDoors': '模块与柜门',
    'ui.plan2d': '2D 平面图', 'ui.roomFit': '房间适配',
    // PDF headings — label text only; all dimensions stay numeric mm per CAD/DXF spec (8)
    'pdf.frontElevation': '正立面图', 'pdf.sideElevation': '侧立面图',
    'pdf.cutList': '板材清单 · 所有尺寸单位为毫米', 'pdf.designNotes': '设计说明',
    'pdf.finish': '饰面', 'pdf.board': '板材', 'pdf.back': '背板',
    'pdf.generatedPreliminary': '生成于 {date} · 初步设计——生产前请核对尺寸与结构。',
    // PNG overlay (3)
    'png.shelves': '层板', 'png.doors': '柜门', 'png.noDoors': '无柜门',
    // Notices (5)
    'notes.saveFailed': '自动保存失败。请导出项目备份以保留您的工作。',
    'notes.pdfFailed': 'PDF 导出失败。请改用生产 JSON 或 CSV 板材清单。',
    'notes.invalidFile': '此文件不是支持的 Forme 项目。',
    'notes.restored': '项目已恢复',
    'notes.confirmReset': '确定要重置设计吗？未保存的更改将会丢失。',
  },
  es: {
    project: 'MI PROYECTO', title: 'Vestidor', saved: 'Guardado en este dispositivo', dimensions: 'Dimensiones',
    width: 'Ancho', height: 'Alto', depth: 'Fondo', structure: 'Estructura', shelves: 'Estantes', doors: 'Puertas',
    finish: 'Acabado', oak: 'Roble natural', walnut: 'Nogal', white: 'Blanco cálido', graphite: 'Grafito',
    selected: 'Pieza seleccionada', interior: 'Distribución interior', assembly: 'VISTA DE MONTAJE', assembled: 'Montado',
    exploded: 'Desmontado', rotate: 'Arrastra para girar · desplaza para ampliar', constraints: 'REVISIÓN DEL DISEÑO', valid: 'Todo correcto',
    export: 'Exportar', import: 'Abrir proyecto', image: 'Imagen con medidas · PNG', spec: 'Paquete de producción · JSON',
    model: 'Proyecto 3D · GLB', pdf: 'Planos con medidas · PDF', csv: 'Lista de corte · CSV', language: 'Idioma', units: 'Unidades', history: 'Historial', undo: 'Deshacer', redo: 'Rehacer',
    restored: 'Proyecto restaurado', invalid: 'Este archivo no es un proyecto Forme compatible.', support: 'Tableros 18 mm · trasera 9 mm',
    editHint: 'Selecciona un panel para editar sus medidas.', reset: 'Restablecer diseño', format: 'Proyecto JSON · editable',
    savedElsewhere: 'Exporta un proyecto para abrirlo en otro dispositivo o navegador.',
    // Catalog slice: flat dotted keys (stays Record<string,string>-compatible for App.tsx).
    // Door variants (10)
    'doorVariants.open': 'Abierto (sin puertas)', 'doorVariants.doubleHinged': 'Doble puerta batiente',
    'doorVariants.singleL': 'Puerta individual · bisagra izquierda', 'doorVariants.singleR': 'Puerta individual · bisagra derecha',
    'doorVariants.sliding2': 'Corrediza · 2 hojas', 'doorVariants.sliding3': 'Corrediza · 3 hojas',
    'doorVariants.bifold': 'Puerta plegable', 'doorVariants.glass': 'Puertas de vidrio',
    'doorVariants.mirror': 'Puertas con espejo', 'doorVariants.louvered': 'Puertas de celosía',
    // Interior modules (14)
    'modules.doubleHang': 'Colgado doble', 'modules.longHang': 'Colgado largo',
    'modules.drawers3': '3 cajones', 'modules.drawersDeep': 'Cajones profundos',
    'modules.shoeFlat': 'Zapatero plano', 'modules.shoeTilt': 'Zapatero inclinado',
    'modules.basket': 'Canasta de alambre', 'modules.valetRod': 'Barra de valet',
    'modules.tieRack': 'Portacorbatas y cinturones', 'modules.trouserPullout': 'Pantalonero extraíble',
    'modules.shelfAdjustable': 'Estante ajustable', 'modules.glassShelf': 'Estante de vidrio',
    'modules.ledStrip': 'Tira LED', 'modules.interiorMirror': 'Espejo interior',
    // Handles (4)
    'handles.bar': 'Manija de barra', 'handles.knob': 'Pomo',
    'handles.recessed': 'Manija empotrada', 'handles.push': 'Apertura por presión',
    // UI chrome (16)
    'ui.doubleHingedDoors': 'Puertas dobles batientes', 'ui.doorPosition': 'Posición de la puerta',
    'ui.open': 'Abierta', 'ui.closed': 'Cerrada', 'ui.carcass': 'Estructura',
    'ui.designs': 'Diseños', 'ui.draft': 'Borrador', 'ui.preview3d': 'Vista previa 3D',
    'ui.removeShelf': 'Quitar estante', 'ui.addShelf': 'Añadir estante',
    'ui.copyLink': 'Copiar enlace', 'ui.copied': 'Copiado',
    'ui.hardware': 'Herrajes', 'ui.modulesDoors': 'Módulos y puertas',
    'ui.plan2d': 'Plano 2D', 'ui.roomFit': 'Ajuste al espacio',
    // PDF headings — label text only; all dimensions stay numeric mm per CAD/DXF spec (8)
    'pdf.frontElevation': 'VISTA FRONTAL', 'pdf.sideElevation': 'VISTA LATERAL',
    'pdf.cutList': 'LISTA DE CORTE · TODAS LAS MEDIDAS EN MM', 'pdf.designNotes': 'NOTAS DE DISEÑO',
    'pdf.finish': 'Acabado', 'pdf.board': 'Tablero', 'pdf.back': 'Trasera',
    'pdf.generatedPreliminary': 'Generado el {date} · Diseño preliminar: verifica medidas y ensambles antes de fabricar.',
    // PNG overlay (3)
    'png.shelves': 'Estantes', 'png.doors': 'Puertas', 'png.noDoors': 'Sin puertas',
    // Notices (5)
    'notes.saveFailed': 'Error al guardar automáticamente. Exporta una copia para no perder tu trabajo.',
    'notes.pdfFailed': 'Error al exportar el PDF. Exporta el JSON de producción o la lista de corte CSV.',
    'notes.invalidFile': 'Este archivo no es un proyecto Forme compatible.',
    'notes.restored': 'Proyecto restaurado',
    'notes.confirmReset': '¿Restablecer el diseño? Se perderán los cambios no guardados.',
  },
} as const

export type TranslationKey = keyof typeof translations.en
export const translate = (language: Language) => translations[language]

// Dotted-key lookup with English fallback: t('he', 'ui.open', 'Open').
// Keys are flat dotted strings (not nested objects) so translate() stays a
// Record<string, string> for App.tsx's existing casts and the `pdf` label key.
export function t(language: Language, key: string, fallback?: string): string {
  const dict = translations[language] as Record<string, string>
  const en = translations.en as Record<string, string>
  return dict[key] ?? en[key] ?? fallback ?? key
}
