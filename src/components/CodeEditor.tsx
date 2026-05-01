import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import MonacoEditor from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'

export interface CodeEditorHandle {
  insertSnippet: (code: string) => void
  getSelection: () => string
  replaceAll: (code: string) => void
  getValue: () => string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onQuoteToAI?: (text: string) => void
  onCursorLine?: (line: number) => void
}

const CodeEditor = forwardRef<CodeEditorHandle, Props>(({ value, onChange, onQuoteToAI, onCursorLine }, ref) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const onQuoteRef = useRef(onQuoteToAI)
  onQuoteRef.current = onQuoteToAI
  const onCursorRef = useRef(onCursorLine)
  onCursorRef.current = onCursorLine

  useImperativeHandle(ref, () => ({
    insertSnippet: (code: string) => {
      const editor = editorRef.current
      if (!editor) return
      const selection = editor.getSelection()
      editor.executeEdits('snippet', [{ range: selection!, text: '\n' + code + '\n', forceMoveMarkers: true }])
      editor.focus()
    },
    getSelection: () => {
      const editor = editorRef.current
      if (!editor) return ''
      const sel = editor.getSelection()
      if (!sel || sel.isEmpty()) return ''
      return editor.getModel()?.getValueInRange(sel) ?? ''
    },
    replaceAll: (code: string) => {
      const editor = editorRef.current
      if (!editor) return
      editor.setValue(code)
      editor.focus()
    },
    getValue: () => editorRef.current?.getValue() ?? '',
  }))

  const handleMount = useCallback((editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    editor.onDidChangeCursorPosition((e) => {
      onCursorRef.current?.(e.position.lineNumber)
    })
    editor.addAction({
      id: 'quote-to-ai',
      label: '引用到 AI 助手',
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 0,
      run: (ed) => {
        const sel = ed.getSelection()
        const text = sel && !sel.isEmpty() ? ed.getModel()?.getValueInRange(sel) : ed.getValue()
        if (text) onQuoteRef.current?.(text)
      },
    })
  }, [])

  return (
    <MonacoEditor
      height="100%"
      language="html"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        tabSize: 2,
        lineNumbers: 'on',
        folding: true,
        automaticLayout: true,
      }}
    />
  )
})

CodeEditor.displayName = 'CodeEditor'
export default CodeEditor
