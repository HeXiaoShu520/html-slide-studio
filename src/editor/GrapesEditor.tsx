import { useEffect, useRef } from 'react'
import grapesjs, { type Editor } from 'grapesjs'
import 'grapesjs/dist/css/grapes.min.css'
import './editor-wysiwyg.css'
import { useAppStore, saveProject } from '../store/useAppStore'
import { registerBlocks } from './blocks/registerBlocks'
import { getThemeCSS } from '../themes/themeCSS'

function injectCssToCanvas(editor: Editor, id: string, css: string) {
  try {
    const iframe = editor.Canvas.getFrameEl() as HTMLIFrameElement
    const doc = iframe?.contentDocument
    if (!doc) return
    let el = doc.getElementById(id) as HTMLStyleElement
    if (!el) { el = doc.createElement('style'); el.id = id; doc.head.appendChild(el) }
    el.textContent = css
  } catch { /* cross-origin */ }
}
export default function GrapesEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const prevIndexRef = useRef<number>(0)
  const { setEditor, currentTheme, currentSlideIndex, updateCurrentSlide, globalCss } = useAppStore()

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return

    const initialTheme = useAppStore.getState().currentTheme
    const themeCSS = getThemeCSS(initialTheme)
    const state0 = useAppStore.getState()
    const initialSlide = state0.slides[0]
    const initialGlobalCss = state0.globalCss

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: 'auto',
      fromElement: false,
      components: initialSlide.html,
      style: initialSlide.css || '',
      storageManager: false,
      panels: { defaults: [] },
      canvas: {
        styles: ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'],
      },
      i18n: {
        locale: 'zh',
        messages: {
          zh: {
            styleManager: {
              empty: '选中元素后编辑样式',
              layer: '图层',
              fileButton: '选择文件',
              sectors: {
                dimension: '尺寸',
                typography: '排版',
                decorations: '装饰',
                extra: '布局',
              },
              properties: {
                width: '宽度',
                height: '高度',
                'max-width': '最大宽度',
                'min-height': '最小高度',
                padding: '内边距',
                margin: '外边距',
                'font-family': '字体',
                'font-size': '字号',
                'font-weight': '字重',
                'letter-spacing': '字间距',
                color: '颜色',
                'line-height': '行高',
                'text-align': '对齐',
                'background-color': '背景色',
                'background-image': '背景图',
                border: '边框',
                'border-radius': '圆角',
                'box-shadow': '阴影',
                display: '显示',
                'flex-direction': '方向',
                'justify-content': '主轴对齐',
                'align-items': '交叉轴对齐',
                gap: '间距',
                position: '定位',
                top: '上',
                left: '左',
                right: '右',
                bottom: '下',
                'z-index': '层级',
                overflow: '溢出',
              },
            },
            traitManager: {
              empty: '选中元素后编辑属性',
            },
            domComponents: {
              names: {
                '': '盒子',
                wrapper: '页面',
                text: '文本',
                comment: '注释',
                image: '图片',
                video: '视频',
                label: '标签',
                link: '链接',
                map: '地图',
                tfoot: '表尾',
                tbody: '表体',
                thead: '表头',
                table: '表格',
                row: '行',
                cell: '单元格',
              },
            },
            deviceManager: {
              device: '设备',
              devices: {
                desktop: '桌面',
                tablet: '平板',
                mobileLandscape: '手机横屏',
                mobilePortrait: '手机竖屏',
              },
            },
            panels: {
              buttons: {
                titles: {
                  preview: '预览',
                  fullscreen: '全屏',
                  'sw-visibility': '显示边框',
                  'export-template': '导出',
                  'open-sm': '样式',
                  'open-tm': '属性',
                  'open-layers': '图层',
                  'open-blocks': '组件',
                },
              },
            },
          },
        },
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
          { name: 'dimension', open: true, properties: [
            'width', 'height', 'max-width', 'min-height', 'padding', 'margin',
          ]},
          { name: 'typography', open: true, properties: [
            'font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align',
          ]},
          { name: 'decorations', open: false, properties: [
            'background-color', 'background-image', 'border', 'border-radius', 'box-shadow',
          ]},
          { name: 'extra', open: false, properties: [
            'display', 'flex-direction', 'justify-content', 'align-items', 'gap',
            'position', 'top', 'left', 'right', 'bottom', 'z-index', 'overflow',
          ]},
        ],
      },
    })

    registerBlocks(editor)
    editorRef.current = editor

    // 实时同步到 store（300ms debounce）
    let debounceTimer: ReturnType<typeof setTimeout>
    editor.on('update', () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        useAppStore.getState().updateCurrentSlide(editor.getHtml(), editor.getCss() || '')
        // 自动保存
        const state = useAppStore.getState()
        saveProject(state.projectName, state.currentTheme, state.slides, state.globalCss)
      }, 300)
    })

    editor.on('load', () => {
      injectCssToCanvas(editor, 'gjs-theme-vars', themeCSS)
      injectCssToCanvas(editor, 'gjs-global-css', initialGlobalCss)
      if (initialSlide.css) {
        injectCssToCanvas(editor, 'gjs-slide-css', initialSlide.css)
      }
      setEditor(editor)
    })

    return () => {
      clearTimeout(debounceTimer)
      editor.destroy()
      editorRef.current = null
      setEditor(null)
    }
  }, [])

  // 切换幻灯片
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const prevIndex = prevIndexRef.current
    prevIndexRef.current = currentSlideIndex
    if (prevIndex === currentSlideIndex) return

    // 先把编辑器当前内容保存到 prevIndex 对应的 slide（而非 currentSlideIndex）
    const slides = useAppStore.getState().slides
    if (prevIndex >= 0 && prevIndex < slides.length) {
      const html = editor.getHtml()
      const css = editor.getCss() || ''
      const updated = [...slides]
      updated[prevIndex] = { ...updated[prevIndex], html, css }
      useAppStore.setState({ slides: updated })
    }

    const target = useAppStore.getState().slides[currentSlideIndex]
    if (target) {
      editor.setComponents(target.html)
      editor.setStyle(target.css || '')
      // 只需要更新 globalCss，slide css 由 setStyle 管理
      const curGlobalCss = useAppStore.getState().globalCss
      injectCssToCanvas(editor, 'gjs-global-css', curGlobalCss)
    }
  }, [currentSlideIndex])

  // 主题切换：只注入到 canvas iframe head，不覆盖 setStyle
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    const css = getThemeCSS(currentTheme)
    injectCssToCanvas(editor, 'gjs-theme-vars', css)
  }, [currentTheme])

  return <div ref={containerRef} style={{ flex: 1, height: '100%', overflow: 'hidden' }} />
}
