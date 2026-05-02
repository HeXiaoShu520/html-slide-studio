import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { buildSlideHtml } from '../utils/buildSlideHtml'

interface Props {
  slideHtml: string
  globalCss: string
  themeCSS: string
  slideIndex: number
  slideCount: number
  enterAnim?: boolean
  hideNavButtons?: boolean
}

export interface PreviewFrameHandle {
  getIframeRect: () => DOMRect | null
  getIframe: () => HTMLIFrameElement | null
}

const PreviewFrame = forwardRef<PreviewFrameHandle, Props>(({ slideHtml, globalCss, themeCSS, slideIndex, slideCount, enterAnim = false, hideNavButtons = false }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useImperativeHandle(ref, () => ({
    getIframeRect: () => iframeRef.current?.getBoundingClientRect() ?? null,
    getIframe: () => iframeRef.current ?? null,
  }))

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    console.log('[PreviewFrame] render slide:', slideIndex, '/', slideCount, 'htmlLen:', slideHtml.length)
    const html = buildSlideHtml(slideHtml, globalCss, themeCSS, enterAnim, hideNavButtons)
    const doc = iframe.contentDocument
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()
    iframe.contentWindow?.postMessage({ type: 'slide-state', cur: slideIndex, total: slideCount }, '*')
  }, [slideHtml, globalCss, themeCSS, enterAnim, slideIndex, slideCount, hideNavButtons])

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin"
      onContextMenu={e => e.preventDefault()}
      style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
      title="preview"
    />
  )
})

PreviewFrame.displayName = 'PreviewFrame'
export default PreviewFrame

