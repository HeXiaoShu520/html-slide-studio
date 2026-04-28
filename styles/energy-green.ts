import type { AiStyle } from '../src/themes/aiStyles'

const style: AiStyle = {
  id: 'energy-green',
  name: '新能源',
  description: `- 背景色：#0a1a1a（深绿黑）
- 主色调：#00BFA5 和 #64FFDA（绿色系）
- 卡片背景：#112222，圆角 12px，边框 1px solid rgba(0,191,165,0.3)，hover 上移 4px
- 标题：linear-gradient(135deg, #00BFA5, #64FFDA) 渐变文字
- 文字颜色：#e0f2f1`,
  animationDescription: `流畅自然，模拟能量流动感：
- 标题：从下方淡入，时长 0.7s，ease-out
- 卡片：从右侧滑入，stagger 间隔 0.2s
- 流程步骤：从左到右流动出现，带绿色轨迹感
- 强调元素：绿色脉冲波纹扩散动画
- 数据字段：从下方依次弹出，ease-out`,
}

export default style
