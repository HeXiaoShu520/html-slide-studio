import { THEMES, type ThemeId } from '../store/useAppStore'

/** 生成主题对应的 CSS 变量字符串，注入到 GrapesJS canvas 中 */
export function getThemeCSS(themeId: ThemeId): string {
  const t = THEMES[themeId]
  return `
    :root {
      --primary: ${t.primary};
      --primary-light: ${t.primaryLight};
      --bg-main: ${t.bgMain};
      --bg-card: ${t.bgCard};
      --text-color: ${t.textColor};
      --gradient: linear-gradient(135deg, ${t.primary}, ${t.primaryLight});
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
      background: var(--bg-main);
      color: var(--text-color);
      line-height: 1.6;
    }
    h1, h2, h3 { color: #fff; }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; }
    h2 { font-size: 1.8em; margin-bottom: 0.4em; }
    h3 { font-size: 1.3em; margin-bottom: 0.3em; }
    p { margin-bottom: 1em; color: var(--text-color); }

    .page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 40px;
      position: relative;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 30px;
      margin: 10px;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 40px rgba(0,102,255,0.2);
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      width: 100%;
      max-width: 1000px;
    }
    .flow-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      margin: 20px 0;
    }
    .flow-step {
      background: var(--bg-card);
      border: 1px solid var(--primary);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      min-width: 150px;
    }
    .flow-arrow {
      color: var(--primary);
      font-size: 24px;
    }
    .timeline {
      position: relative;
      max-width: 600px;
      margin: 20px auto;
      padding-left: 30px;
      border-left: 2px solid var(--primary);
    }
    .timeline-item {
      position: relative;
      margin-bottom: 30px;
      padding-left: 20px;
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -36px;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--primary);
    }
    .code-block {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 20px;
      font-family: 'Consolas', monospace;
      font-size: 14px;
      color: #c9d1d9;
      overflow-x: auto;
      white-space: pre;
      margin: 15px 0;
    }
    .packet-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .packet-table th, .packet-table td {
      border: 1px solid rgba(255,255,255,0.15);
      padding: 10px 15px;
      text-align: left;
    }
    .packet-table th {
      background: var(--primary);
      color: #fff;
    }
    .packet-table tr:nth-child(even) {
      background: rgba(255,255,255,0.03);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      background: var(--gradient);
      color: #fff;
    }
    .icon-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 15px;
    }

    /* 动画 */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-50px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(50px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .animate-fadeInUp { animation: fadeInUp 0.6s ease forwards; }
    .animate-fadeIn { animation: fadeIn 0.6s ease forwards; }
    .animate-slideInLeft { animation: slideInLeft 0.6s ease forwards; }
    .animate-slideInRight { animation: slideInRight 0.6s ease forwards; }
  `
}
