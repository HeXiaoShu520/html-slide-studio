import * as vscode from 'vscode';
import * as fs from 'fs';

// 查找每页在文件中的行号范围
function findPageRanges(htmlContent: string): { start: number; end: number }[] {
  const lines = htmlContent.split('\n');
  const ranges: { start: number; end: number }[] = [];
  let currentStart = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<!-- PAGE -->')) {
      if (currentStart !== -1) {
        ranges.push({ start: currentStart, end: i - 1 });
      }
      currentStart = i + 1;
    } else if (lines[i].includes('<!-- SLIDE-NAV-BEGIN -->')) {
      if (currentStart !== -1) {
        ranges.push({ start: currentStart, end: i - 1 });
      }
      break;
    }
  }

  return ranges;
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('slide.preview', (uri: vscode.Uri) => {
    new SlideEditorProvider(context, uri);
  });

  context.subscriptions.push(disposable);
}

class SlideEditorProvider {
  private panel: vscode.WebviewPanel;
  private fileUri: vscode.Uri;
  private pageRanges: { start: number; end: number }[] = [];
  private currentPage: number = 0;
  private editor: vscode.TextEditor | undefined;

  constructor(context: vscode.ExtensionContext, uri: vscode.Uri) {
    this.fileUri = uri;

    // 解析文件，找到每页的行号范围
    const htmlContent = fs.readFileSync(uri.fsPath, 'utf-8');
    this.pageRanges = findPageRanges(htmlContent);

    // 打开文件在左侧编辑器
    vscode.window.showTextDocument(uri, { viewColumn: vscode.ViewColumn.One }).then(editor => {
      this.editor = editor;
      this.focusPage(0);

      // 监听光标位置变化
      vscode.window.onDidChangeTextEditorSelection(e => {
        if (e.textEditor === this.editor) {
          this.onCursorMove(e.selections[0].active.line);
        }
      });
    });

    // 创建预览面板（右侧）
    this.panel = vscode.window.createWebviewPanel(
      'slidePreview',
      '预览',
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );
    this.updatePreview();

    // 创建导航控制面板
    this.createNavigationPanel(context);

    context.subscriptions.push(this.panel);
  }

  private onCursorMove(line: number) {
    if (!this.editor) return;

    const lineText = this.editor.document.lineAt(line).text;

    // 提取 class 属性
    const classMatch = lineText.match(/class="([^"]+)"/);
    if (classMatch) {
      const className = classMatch[1].split(' ')[0]; // 取第一个类名
      this.panel.webview.postMessage({ type: 'highlight', selector: `.${className}` });
    }
  }

  private async focusPage(pageIndex: number) {
    if (!this.editor || pageIndex < 0 || pageIndex >= this.pageRanges.length) return;

    const range = this.pageRanges[pageIndex];

    // 折叠所有
    await vscode.commands.executeCommand('editor.foldAll');

    // 跳转到当前页
    const position = new vscode.Position(range.start, 0);
    this.editor.selection = new vscode.Selection(position, position);
    this.editor.revealRange(
      new vscode.Range(range.start, 0, range.end, 0),
      vscode.TextEditorRevealType.InCenter
    );

    // 展开当前页
    await vscode.commands.executeCommand('editor.unfold', { levels: 1, direction: 'down' });
  }

  private updatePreview() {
    const htmlContent = fs.readFileSync(this.fileUri.fsPath, 'utf-8');

    // 注入高亮脚本
    const injectedHtml = htmlContent.replace('</body>', `
<script>
window.addEventListener('message', event => {
  const msg = event.data;
  if (msg.type === 'highlight') {
    // 移除之前的高亮
    document.querySelectorAll('.vscode-highlight').forEach(el => {
      el.classList.remove('vscode-highlight');
    });

    // 高亮新元素
    if (msg.selector) {
      const el = document.querySelector(msg.selector);
      if (el) {
        el.classList.add('vscode-highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
});
</script>
<style>
.vscode-highlight {
  outline: 3px solid #0e639c !important;
  outline-offset: 2px;
  background: rgba(14, 99, 156, 0.1) !important;
}
</style>
</body>`);

    this.panel.webview.html = injectedHtml;
  }
  private createNavigationPanel(context: vscode.ExtensionContext) {
    const navPanel = vscode.window.createWebviewPanel(
      'slideNav',
      '导航',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    navPanel.webview.html = this.getNavHtml();

    navPanel.webview.onDidReceiveMessage(msg => {
      if (msg.type === 'prev' && this.currentPage > 0) {
        this.currentPage--;
        this.focusPage(this.currentPage);
        this.panel.webview.postMessage({ type: 'goto', page: this.currentPage });
        navPanel.webview.html = this.getNavHtml();
      } else if (msg.type === 'next' && this.currentPage < this.pageRanges.length - 1) {
        this.currentPage++;
        this.focusPage(this.currentPage);
        this.panel.webview.postMessage({ type: 'goto', page: this.currentPage });
        navPanel.webview.html = this.getNavHtml();
      }
    });

    context.subscriptions.push(navPanel);
  }

  private getNavHtml(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 16px; background: #1e1e1e; color: #ccc; font-family: sans-serif; }
    .toolbar { display: flex; gap: 8px; align-items: center; }
    button { padding: 8px 16px; background: #0e639c; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background: #1177bb; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .info { margin-left: 12px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="toolbar">
    <button id="prev" ${this.currentPage === 0 ? 'disabled' : ''}>上一页</button>
    <button id="next" ${this.currentPage === this.pageRanges.length - 1 ? 'disabled' : ''}>下一页</button>
    <span class="info">第 ${this.currentPage + 1} / ${this.pageRanges.length} 页</span>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    document.getElementById('prev').onclick = () => vscode.postMessage({ type: 'prev' });
    document.getElementById('next').onclick = () => vscode.postMessage({ type: 'next' });
  </script>
</body>
</html>`;
  }
}

export function deactivate() {}
