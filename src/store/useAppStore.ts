import { create } from 'zustand'
import type { Editor } from 'grapesjs'

export type ThemeId = 'electric-blue' | 'mechanical-gray' | 'energy-green'
export type ViewMode = 'edit' | 'preview' | 'code'

export interface Slide {
  id: string
  html: string
  css: string
}

export interface ThemeConfig {
  id: ThemeId
  name: string
  primary: string
  primaryLight: string
  bgMain: string
  bgCard: string
  textColor: string
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'electric-blue': {
    id: 'electric-blue',
    name: '电动蓝',
    primary: '#0066FF',
    primaryLight: '#00D9FF',
    bgMain: '#0a0a2e',
    bgCard: '#111133',
    textColor: '#e0e0e0',
  },
  'mechanical-gray': {
    id: 'mechanical-gray',
    name: '机械灰',
    primary: '#607D8B',
    primaryLight: '#90A4AE',
    bgMain: '#1a1a1a',
    bgCard: '#2a2a2a',
    textColor: '#e0e0e0',
  },
  'energy-green': {
    id: 'energy-green',
    name: '新能源绿',
    primary: '#00BFA5',
    primaryLight: '#64FFDA',
    bgMain: '#0a1a1a',
    bgCard: '#112222',
    textColor: '#e0e0e0',
  },
}

interface AppState {
  editor: Editor | null
  setEditor: (editor: Editor | null) => void

  currentTheme: ThemeId
  setTheme: (theme: ThemeId) => void

  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  leftPanelTab: 'slides' | 'blocks' | 'layers'
  setLeftPanelTab: (tab: 'slides' | 'blocks' | 'layers') => void

  rightPanelTab: 'style' | 'traits' | 'animation'
  setRightPanelTab: (tab: 'style' | 'traits' | 'animation') => void

  showAIPanel: boolean
  setShowAIPanel: (show: boolean) => void

  projectName: string
  setProjectName: (name: string) => void

  previewHtml: string | null
  setPreviewHtml: (html: string | null) => void

  globalCss: string
  setGlobalCss: (css: string) => void

  slides: Slide[]
  currentSlideIndex: number
  setCurrentSlideIndex: (index: number) => void
  addSlide: () => void
  deleteSlide: (index: number) => void
  updateCurrentSlide: (html: string, css: string) => void
}

// 自动保存/加载项目到 localStorage
const STORAGE_KEY = 'atag-project-data'

const DEFAULT_SLIDE_HTML = `<div class="page" style="text-align:center;">
  <h1 style="background:linear-gradient(135deg,var(--primary),var(--primary-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:3em;">HTML Slide Studio</h1>
  <p style="font-size:1.2em;max-width:600px;margin:20px auto;">从左侧拖拽组件开始编辑，或使用 AI 自动生成内容</p>
</div>`

function loadSavedState(): { projectName?: string; theme?: ThemeId; slides?: Slide[]; globalCss?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return { projectName: data.projectName, theme: data.theme, slides: data.slides, globalCss: data.globalCss }
    }
  } catch { /* ignore */ }
  return {}
}

const saved = loadSavedState()
const initialSlides: Slide[] = saved.slides || [{ id: crypto.randomUUID(), html: DEFAULT_SLIDE_HTML, css: '' }]

export const useAppStore = create<AppState>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),

  currentTheme: saved.theme || 'mechanical-gray',
  setTheme: (currentTheme) => set({ currentTheme }),

  viewMode: 'edit',
  setViewMode: (viewMode) => set({ viewMode }),

  leftPanelTab: 'slides',
  setLeftPanelTab: (leftPanelTab) => set({ leftPanelTab }),

  rightPanelTab: 'style',
  setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),

  showAIPanel: false,
  setShowAIPanel: (showAIPanel) => set({ showAIPanel }),

  projectName: saved.projectName || '未命名项目',
  setProjectName: (projectName) => set({ projectName }),

  previewHtml: null,
  setPreviewHtml: (previewHtml) => set({ previewHtml }),

  globalCss: saved.globalCss || '',
  setGlobalCss: (globalCss) => set({ globalCss }),

  slides: initialSlides,
  currentSlideIndex: 0,
  setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
  addSlide: () => set((state) => ({
    slides: [...state.slides, { id: crypto.randomUUID(), html: DEFAULT_SLIDE_HTML, css: '' }],
    currentSlideIndex: state.slides.length,
  })),
  deleteSlide: (index) => set((state) => {
    if (state.slides.length <= 1) return state
    const slides = state.slides.filter((_, i) => i !== index)
    return { slides, currentSlideIndex: Math.min(state.currentSlideIndex, slides.length - 1) }
  }),
  updateCurrentSlide: (html, css) => set((state) => {
    const slides = [...state.slides]
    slides[state.currentSlideIndex] = { ...slides[state.currentSlideIndex], html, css }
    return { slides }
  }),
}))

/** 保存完整项目到 localStorage */
export function saveProject(projectName: string, theme: ThemeId, slides: Slide[], globalCss = '') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ projectName, theme, slides, globalCss, timestamp: Date.now() }))
}

/** 从 localStorage 加载项目，返回 slides 数组 */
export function loadProject(): { projectName: string; theme: ThemeId; slides: Slide[]; globalCss: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data.slides) return { projectName: data.projectName, theme: data.theme, slides: data.slides, globalCss: data.globalCss || '' }
  } catch { /* ignore */ }
  return null
}

/** 导出项目为完整 HTML 文件 */
export function exportProjectFile(projectName: string, theme: ThemeId, slides: Slide[], globalCss = '') {
  const allHtml = slides.map(s => s.html).join('\n')
  const perSlideCss = slides.map(s => s.css).filter(Boolean).join('\n')
  const content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${projectName}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
html{scroll-behavior:smooth}
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
${globalCss}
${perSlideCss}
</style>
</head>
<body>${allHtml}</body>
</html>`
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.html`
  a.click()
  URL.revokeObjectURL(url)
}

/** 从 HTML 文件导入项目（重新解析） */
export function importProjectFile(file: File): Promise<{ projectName: string; theme: ThemeId; slides: Slide[]; globalCss: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string

        // 优先读取我们自己导出的元数据格式
        const metaMatch = text.match(/<!-- atag-meta: ([\s\S]*?) -->/)
        if (metaMatch) {
          const meta = JSON.parse(metaMatch[1])
          const slides: Slide[] = meta.slides || [{ id: crypto.randomUUID(), html: text, css: '' }]
          return resolve({
            projectName: meta.projectName || file.name.replace('.html', ''),
            theme: meta.theme || 'electric-blue',
            slides,
            globalCss: meta.globalCss || '',
          })
        }

        // 兼容普通 HTML：<style> → globalCss，按 .slide/.page 拆分，每页 css 为空
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/html')
        const globalCss = [...doc.querySelectorAll('style')].map(s => s.textContent || '').join('\n')
        const slideEls = doc.querySelectorAll('.slide, .page')
        const slides: Slide[] = slideEls.length > 0
          ? [...slideEls].map(el => ({ id: crypto.randomUUID(), html: el.outerHTML, css: '' }))
          : [{ id: crypto.randomUUID(), html: doc.body.innerHTML, css: '' }]

        resolve({
          projectName: doc.title || file.name.replace('.html', ''),
          theme: 'electric-blue',
          slides,
          globalCss,
        })
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
