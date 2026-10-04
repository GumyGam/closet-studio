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
  },
} as const

export type TranslationKey = keyof typeof translations.en
export const translate = (language: Language) => translations[language]
