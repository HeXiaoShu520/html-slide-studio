import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';

export default function ClaudeTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 创建终端实例
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
      },
    });

    term.open(terminalRef.current);
    xtermRef.current = term;

    // 连接到后端 WebSocket（需要后端支持）
    const ws = new WebSocket('ws://localhost:3001/terminal');

    ws.onopen = () => {
      term.writeln('Claude Code 终端已连接');
      term.writeln('输入命令开始使用...\r\n');
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    term.onData((data) => {
      ws.send(data);
    });

    return () => {
      term.dispose();
      ws.close();
    };
  }, []);

  return <div ref={terminalRef} style={{ height: '100%', width: '100%' }} />;
}
