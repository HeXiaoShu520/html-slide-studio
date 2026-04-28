export interface AiStyle {
  id: string
  name: string
  description: string
  animationDescription: string
}

// 自动扫描 /styles/*.ts，启动时加载所有风格
const modules = import.meta.glob('/styles/*.ts', { eager: true }) as Record<string, { default: AiStyle }>

export const AI_STYLES: AiStyle[] = Object.values(modules)
  .map(m => m.default)
  .filter(Boolean)
  .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
