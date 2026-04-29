import { useMemo } from 'react'
import { buildSlideHtml } from '../utils/buildSlideHtml'

interface Props {
  slideHtml: string
  globalCss: string
  themeCSS: string
}

export default function PreviewFrame({ slideHtml, globalCss, themeCSS }: Props) {
  const srcdoc = useMemo(
    () => buildSlideHtml(slideHtml, globalCss, themeCSS),
    [slideHtml, globalCss, themeCSS]
  )
  return (
    <iframe
      srcDoc={srcdoc}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
      title="preview"
    />
  )
}
