import { create } from 'zustand'
import type { Editor } from 'grapesjs'

export type ThemeId = 'electric-blue' | 'mechanical-gray' | 'energy-green'
export type ViewMode = 'edit' | 'preview' | 'code'

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

  leftPanelTab: 'blocks' | 'layers'
  setLeftPanelTab: (tab: 'blocks' | 'layers') => void

  rightPanelTab: 'style' | 'traits' | 'animation'
  setRightPanelTab: (tab: 'style' | 'traits' | 'animation') => void

  showAIPanel: boolean
  setShowAIPanel: (show: boolean) => void

  projectName: string
  setProjectName: (name: string) => void

  previewHtml: string | null
  setPreviewHtml: (html: string | null) => void
}

// 自动保存/加载项目到 localStorage
const STORAGE_KEY = 'atag-project-data'

function loadSavedState(): { projectName?: string; theme?: ThemeId } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return { projectName: data.projectName, theme: data.theme }
    }
  } catch { /* ignore */ }
  return {}
}

const saved = loadSavedState()

export const useAppStore = create<AppState>((set) => ({
  editor: null,
  setEditor: (editor) => set({ editor }),

  currentTheme: saved.theme || 'electric-blue',
  setTheme: (currentTheme) => set({ currentTheme }),

  viewMode: 'edit',
  setViewMode: (viewMode) => set({ viewMode }),

  leftPanelTab: 'blocks',
  setLeftPanelTab: (leftPanelTab) => set({ leftPanelTab }),

  rightPanelTab: 'style',
  setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),

  showAIPanel: false,
  setShowAIPanel: (showAIPanel) => set({ showAIPanel }),

  projectName: saved.projectName || '未命名项目',
  setProjectName: (projectName) => set({ projectName }),

  previewHtml: null,
  setPreviewHtml: (previewHtml) => set({ previewHtml }),
}))

/** 保存完整项目到 localStorage（编辑器内容 + 元数据） */
export function saveProject(editor: import('grapesjs').Editor, projectName: string, theme: ThemeId) {
  const data = {
    projectName,
    theme,
    projectData: editor.getProjectData(),
    timestamp: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** 从 localStorage 加载项目到编辑器 */
export function loadProject(editor: import('grapesjs').Editor): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (data.projectData) {
      editor.loadProjectData(data.projectData)
      return true
    }
  } catch (e) {
    console.error('Load project failed:', e)
  }
  return false
}

/** 导出项目为带元数据注释的 HTML 文件（可重新导入编辑） */
export function exportProjectFile(editor: import('grapesjs').Editor, projectName: string, theme: ThemeId) {
  const html = editor.getHtml()
  const css = editor.getCss()
  // 把主题和项目名存在注释里，导入时读取
  const meta = `<!-- atag-meta: ${JSON.stringify({ projectName, theme })} -->`
  const content = `${meta}\n<style id="atag-css">${css}</style>\n${html}`
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${projectName}.html`
  a.click()
  URL.revokeObjectURL(url)
}

/** 从 HTML 文件导入项目（重新解析） */
export function importProjectFile(file: File): Promise<{ projectName: string; theme: ThemeId; html: string; css: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        // 读取元数据注释
        const metaMatch = text.match(/<!-- atag-meta: ({.*?}) -->/)
        const meta = metaMatch ? JSON.parse(metaMatch[1]) : {}
        // 提取内联 CSS
        const cssMatch = text.match(/<style id="atag-css">([\s\S]*?)<\/style>/)
        const css = cssMatch ? cssMatch[1] : ''
        // 去掉注释和 style 标签，剩下的是 HTML 内容
        const html = text
          .replace(/<!-- atag-meta:.*?-->\n?/, '')
          .replace(/<style id="atag-css">[\s\S]*?<\/style>\n?/, '')
          .trim()
        resolve({ projectName: meta.projectName || file.name.replace('.html', ''), theme: meta.theme || 'electric-blue', html, css })
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
