import { useEffect, useRef } from 'react'
import grapesjs, { type Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'
import { useAppStore, loadProject, saveProject } from '../store/useAppStore'
import { registerBlocks } from './blocks/registerBlocks'
import { getThemeCSS } from '../themes/themeCSS'

const DEFAULT_CONTENT = `
<div class="page" style="text-align:center;">
  <h1 style="background:linear-gradient(135deg,var(--primary),var(--primary-light));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:3em;">
    ATAG Studio
  </h1>
  <p style="font-size:1.2em;max-width:600px;margin:20px auto;">
    车载技术演示文档生成系统<br>
    从左侧拖拽组件到此处开始编辑，或使用 AI 自动生成内容
  </p>
</div>
`

export default function GrapesEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { setEditor, currentTheme, projectName } = useAppStore()
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: 'auto',
      fromElement: false,
      components: DEFAULT_CONTENT,
      style: getThemeCSS('electric-blue'),
      storageManager: false,

      // 隐藏默认面板，我们用自己的 UI
      panels: { defaults: [] },

      canvas: {
        styles: [
          'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        ],
      },

      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '375px', widthMedia: '480px' },
        ],
      },

      styleManager: {
        sectors: [
          {
            name: '尺寸',
            open: true,
            properties: ['width', 'height', 'max-width', 'min-height', 'padding', 'margin'],
          },
          {
            name: '排版',
            open: true,
            properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align'],
          },
          {
            name: '背景',
            open: false,
            properties: ['background', 'background-color', 'background-image'],
          },
          {
            name: '边框',
            open: false,
            properties: ['border', 'border-radius', 'box-shadow'],
          },
          {
            name: '布局',
            open: false,
            properties: ['display', 'flex-direction', 'justify-content', 'align-items', 'gap', 'position', 'top', 'left', 'right', 'bottom', 'z-index', 'overflow'],
          },
        ],
      },
    })

    registerBlocks(editor)
    editorRef.current = editor

    // 等待编辑器完全加载后再暴露给其他组件
    editor.on('load', () => {
      // 尝试加载上次保存的项目
      const loaded = loadProject(editor)
      if (loaded) {
        console.log('已加载上次保存的项目')
      }
      setEditor(editor)
    })

    // 自动保存：每 5 秒保存一次
    const autoSaveInterval = setInterval(() => {
      if (editorRef.current) {
        saveProject(editorRef.current, projectName, currentTheme)
      }
    }, 5000)

    return () => {
      clearInterval(autoSaveInterval)
      editor.destroy()
      editorRef.current = null
      setEditor(null)
    }
  }, [])

  // 主题切换时更新 canvas 样式
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.setStyle(getThemeCSS(currentTheme))
  }, [currentTheme])

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, height: '100%', overflow: 'hidden' }}
    />
  )
}
