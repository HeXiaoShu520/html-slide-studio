import { useMemo, useRef, useImperativeHandle, forwardRef } from 'react'
import { buildSlideHtml } from '../utils/buildSlideHtml'

interface Props {
  slideHtml: string
  globalCss: string
  themeCSS: string
}

export interface PreviewFrameHandle {
  getIframeRect: () => DOMRect | null
  getIframe: () => HTMLIFrameElement | null
}

const PreviewFrame = forwardRef<PreviewFrameHandle, Props>(({ slideHtml, globalCss, themeCSS }, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useImperativeHandle(ref, () => ({
    getIframeRect: () => iframeRef.current?.getBoundingClientRect() ?? null,
    getIframe: () => iframeRef.current ?? null,
  }))

  const srcdoc = useMemo(
    () => buildSlideHtml(slideHtml, globalCss, themeCSS),
    [slideHtml, globalCss, themeCSS]
  )
  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcdoc}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
      title="preview"
    />
  )
})

PreviewFrame.displayName = 'PreviewFrame'
export default PreviewFrame

