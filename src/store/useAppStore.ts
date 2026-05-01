import { create } from 'zustand'
import { getThemeCSS } from '../themes/themeCSS'

export type ThemeId = 'dark-tech' | 'mechanical' | 'none'

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
  moveSlide: (from: number, to: number) => void
  insertSlide: (slide: Slide, at: number) => void
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


export const useAppStore = create<AppState>((set) => ({
  slides: [{ id: crypto.randomUUID(), title: '第 1 页', html: DEFAULT_HTML }],
  currentSlideIndex: 0,
  projectName: '未命名项目',
  currentTheme: 'dark-tech',
  globalCss: '',
  previewHtml: null,
  showAIPanel: false,

  setCurrentSlideIndex: (i) => set({ currentSlideIndex: i }),

  updateCurrentSlide: (html) => set(s => {
    const slides = s.slides.map((sl, i) => i === s.currentSlideIndex ? { ...sl, html } : sl)
    return { slides }
  }),

  addSlide: () => set(s => {
    const slides = [...s.slides, {
      id: crypto.randomUUID(),
      title: `第 ${s.slides.length + 1} 页`,
      html: `<div class="page">\n  <h2>新页面</h2>\n  <p>在此编辑内容</p>\n</div>`,
    }]
    const currentSlideIndex = slides.length - 1
    return { slides, currentSlideIndex }
  }),

  deleteSlide: (id) => set(s => {
    if (s.slides.length <= 1) return {}
    const slides = s.slides.filter(sl => sl.id !== id)
    const currentSlideIndex = Math.min(s.currentSlideIndex, slides.length - 1)
    return { slides, currentSlideIndex }
  }),

  setProjectName: (projectName) => set({ projectName }),

  setTheme: (currentTheme) => set({ currentTheme }),

  setGlobalCss: (globalCss) => set({ globalCss }),

  setPreviewHtml: (previewHtml) => set({ previewHtml }),
  setShowAIPanel: (showAIPanel) => set({ showAIPanel }),

  setSlides: (slides) => set(s => {
    return { slides, currentSlideIndex: 0 }
  }),

  moveSlide: (from, to) => set(s => {
    const slides = [...s.slides]
    const [item] = slides.splice(from, 1)
    slides.splice(to, 0, item)
    return { slides, currentSlideIndex: to }
  }),

  insertSlide: (slide, at) => set(s => {
    const slides = [...s.slides]
    slides.splice(at, 0, slide)
    return { slides, currentSlideIndex: at }
  }),
}))

export { getThemeCSS }
