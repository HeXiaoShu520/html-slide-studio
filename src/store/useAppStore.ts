import { create } from 'zustand'
import { getThemeCSS } from '../themes/themeCSS'

export type ThemeId = 'dark-tech' | 'mechanical'

export interface Slide {
  id: string
  title: string
  html: string
}

interface AppState {
  slides: Slide[]
  currentSlideIndex: number
  projectName: string
  currentTheme: ThemeId
  globalCss: string
  previewHtml: string | null
  showAIPanel: boolean

  setCurrentSlideIndex: (i: number) => void
  updateCurrentSlide: (html: string) => void
  addSlide: () => void
  deleteSlide: (id: string) => void
  setProjectName: (name: string) => void
  setTheme: (theme: ThemeId) => void
  setGlobalCss: (css: string) => void
  setPreviewHtml: (html: string | null) => void
  setShowAIPanel: (show: boolean) => void
  setSlides: (slides: Slide[]) => void
}

const DEFAULT_HTML = `<style>
.hero { text-align: center; padding: 80px 40px; }
.hero h1 { font-size: 3em; margin-bottom: 0.4em; }
.hero p { font-size: 1.2em; opacity: 0.8; }
</style>

<div class="page">
  <div class="hero animate-in">
    <h1>演示标题</h1>
    <p>在左侧编辑代码，右侧实时预览效果</p>
  </div>
</div>`

function persist(state: Pick<AppState, 'projectName' | 'currentTheme' | 'globalCss' | 'slides'>) {
  try { localStorage.setItem('hss-project', JSON.stringify(state)) } catch { /* ignore */ }
}

function load(): Partial<AppState> {
  try { return JSON.parse(localStorage.getItem('hss-project') || '{}') } catch { return {} }
}

const saved = load()

export const useAppStore = create<AppState>((set) => ({
  slides: saved.slides?.length ? saved.slides : [{ id: crypto.randomUUID(), title: '第 1 页', html: DEFAULT_HTML }],
  currentSlideIndex: 0,
  projectName: saved.projectName || '未命名项目',
  currentTheme: (saved.currentTheme as ThemeId) || 'dark-tech',
  globalCss: saved.globalCss || '',
  previewHtml: null,
  showAIPanel: false,

  setCurrentSlideIndex: (i) => set({ currentSlideIndex: i }),

  updateCurrentSlide: (html) => set(s => {
    const slides = s.slides.map((sl, i) => i === s.currentSlideIndex ? { ...sl, html } : sl)
    persist({ projectName: s.projectName, currentTheme: s.currentTheme, globalCss: s.globalCss, slides })
    return { slides }
  }),

  addSlide: () => set(s => {
    const slides = [...s.slides, {
      id: crypto.randomUUID(),
      title: `第 ${s.slides.length + 1} 页`,
      html: `<div class="page">\n  <h2>新页面</h2>\n  <p>在此编辑内容</p>\n</div>`,
    }]
    const currentSlideIndex = slides.length - 1
    persist({ projectName: s.projectName, currentTheme: s.currentTheme, globalCss: s.globalCss, slides })
    return { slides, currentSlideIndex }
  }),

  deleteSlide: (id) => set(s => {
    if (s.slides.length <= 1) return {}
    const slides = s.slides.filter(sl => sl.id !== id)
    const currentSlideIndex = Math.min(s.currentSlideIndex, slides.length - 1)
    persist({ projectName: s.projectName, currentTheme: s.currentTheme, globalCss: s.globalCss, slides })
    return { slides, currentSlideIndex }
  }),

  setProjectName: (projectName) => set(s => {
    persist({ projectName, currentTheme: s.currentTheme, globalCss: s.globalCss, slides: s.slides })
    return { projectName }
  }),

  setTheme: (currentTheme) => set(s => {
    persist({ projectName: s.projectName, currentTheme, globalCss: s.globalCss, slides: s.slides })
    return { currentTheme }
  }),

  setGlobalCss: (globalCss) => set(s => {
    persist({ projectName: s.projectName, currentTheme: s.currentTheme, globalCss, slides: s.slides })
    return { globalCss }
  }),

  setPreviewHtml: (previewHtml) => set({ previewHtml }),
  setShowAIPanel: (showAIPanel) => set({ showAIPanel }),

  setSlides: (slides) => set(s => {
    persist({ projectName: s.projectName, currentTheme: s.currentTheme, globalCss: s.globalCss, slides })
    return { slides, currentSlideIndex: 0 }
  }),
}))

export { getThemeCSS }
