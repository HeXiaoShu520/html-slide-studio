import { create } from 'zustand'
import { getThemeCSS } from '../themes/themeCSS'

export type ThemeId = 'dark-tech' | 'mechanical' | 'none'

export interface Slide {
  id: string
  title: string
  html: string  // 单页 HTML 片段，不含 DOCTYPE/head，由 buildSlideHtml 包壳后渲染
}

interface AppState {
  slides: Slide[]
  currentSlideIndex: number  // 当前选中页的索引
  projectName: string
  currentTheme: ThemeId
  globalCss: string          // 全局自定义 CSS，导入时从 <head> 提取，buildSlideHtml 时注入
  previewHtml: string | null // 非 null 时触发全屏演示 iframe
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
  setSlides: (slides: Slide[]) => void  // 导入时批量替换，index 重置为 0
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

  setCurrentSlideIndex: (i) => { console.log('[store] setCurrentSlideIndex', i); set({ currentSlideIndex: i }) },

  updateCurrentSlide: (html) => set(s => {
    console.log('[store] updateCurrentSlide len:', html.length)
    const slides = s.slides.map((sl, i) => i === s.currentSlideIndex ? { ...sl, html } : sl)
    return { slides }
  }),

  addSlide: () => set(s => {
    console.log('[store] addSlide, current count:', s.slides.length)
    const slides = [...s.slides, {
      id: crypto.randomUUID(),
      title: `第 ${s.slides.length + 1} 页`,
      html: `<style>\n.new-page{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;color:#fff}\n.new-page h2{font-size:2.4em;font-weight:700;margin-bottom:0.4em}\n.new-page p{font-size:1.1em;opacity:0.5}\n</style>\n<div class="page" style="background:radial-gradient(ellipse at 50% 50%,#0a1628 0%,#050a14 70%,#000 100%)">\n  <div class="new-page">\n    <h2>新页面</h2>\n    <p>在此编辑内容</p>\n  </div>\n</div>`,
    }]
    const currentSlideIndex = slides.length - 1
    return { slides, currentSlideIndex }
  }),

  deleteSlide: (id) => set(s => {
    console.log('[store] deleteSlide', id)
    if (s.slides.length <= 1) return {}
    const slides = s.slides.filter(sl => sl.id !== id)
    const currentSlideIndex = Math.min(s.currentSlideIndex, slides.length - 1)
    return { slides, currentSlideIndex }
  }),

  setProjectName: (projectName) => { console.log('[store] setProjectName', projectName); set({ projectName }) },

  setTheme: (currentTheme) => { console.log('[store] setTheme', currentTheme); set({ currentTheme }) },

  setGlobalCss: (globalCss) => { console.log('[store] setGlobalCss len:', globalCss.length); set({ globalCss }) },

  setPreviewHtml: (previewHtml) => { console.log('[store] setPreviewHtml', previewHtml ? 'set' : 'null'); set({ previewHtml }) },
  setShowAIPanel: (showAIPanel) => { console.log('[store] setShowAIPanel', showAIPanel); set({ showAIPanel }) },

  setSlides: (slides) => set(s => {
    console.log('[store] setSlides count:', slides.length)
    return { slides, currentSlideIndex: 0 }
  }),

  moveSlide: (from, to) => set(s => {
    console.log('[store] moveSlide', from, '->', to)
    const slides = [...s.slides]
    const [item] = slides.splice(from, 1)
    slides.splice(to, 0, item)
    return { slides, currentSlideIndex: to }
  }),

  insertSlide: (slide, at) => set(s => {
    console.log('[store] insertSlide at:', at)
    const slides = [...s.slides]
    slides.splice(at, 0, slide)
    return { slides, currentSlideIndex: at }
  }),
}))

export { getThemeCSS }
