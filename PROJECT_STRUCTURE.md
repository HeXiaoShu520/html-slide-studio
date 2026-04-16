# ATAG 项目结构

```
ATAG/
├── README.md                  # 项目总览
├── ATAG_METHODOLOGY.md        # 核心方法论
├── ATAG_PROMPTS.md            # 提示词模板库
├── ATAG_GUIDE.md              # 使用指南
├── .gitignore                 # Git 忽略文件
├── LICENSE                    # 开源协议
├── examples/                  # 示例网页
│   ├── uds-diagnostic.html    # UDS 诊断示例
│   ├── someip-communication.html  # SOME/IP 通信示例
│   ├── doip-flashing.html     # DoIP 刷写示例
│   ├── camera-calibration.html    # 相机标定示例
│   └── ota-update.html        # OTA 升级示例
├── assets/                    # 资源文件
│   ├── images/                # 图片资源
│   └── templates/             # 可选的模板文件
└── docs/                      # 额外文档（可选）
    ├── changelog.md           # 更新日志
    └── contributing.md        # 贡献指南
```

## 目录说明

### 根目录文件
- **README.md** - 项目介绍和快速开始
- **ATAG_METHODOLOGY.md** - 设计系统、组件库、技术规范
- **ATAG_PROMPTS.md** - 各主题的提示词模板
- **ATAG_GUIDE.md** - 详细使用指南和最佳实践

### examples/ 目录
存放生成的示例网页，展示 ATAG 的实际效果

### assets/ 目录
存放项目资源文件（图片、模板等）

### docs/ 目录（可选）
存放额外的文档和说明
