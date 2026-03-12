# OpenSpec 架构文档

## 一、项目概述

**OpenSpec** 是一个 AI 原生的规范驱动开发系统（AI-native system for spec-driven development）。它的核心理念是通过轻量级的规范层，在代码编写之前让开发者和 AI 助手就"要构建什么"达成一致。

| 属性 | 值 |
|------|------|
| **项目名称** | @fission-ai/openspec |
| **版本** | 1.2.0 |
| **类型** | TypeScript CLI 工具 |
| **入口文件** | [`bin/openspec.js`](bin/openspec.js) |
| **主模块** | [`src/index.ts`](src/index.ts) |
| **构建脚本** | [`build.js`](build.js) |

---

## 二、整体目录结构

```
OpenSpec/
├── bin/                    # CLI 可执行文件入口
├── src/                    # 核心源代码
│   ├── cli/               # CLI 主程序
│   ├── commands/          # CLI 命令实现
│   ├── core/              # 核心业务逻辑
│   ├── telemetry/         # 遥测/统计数据
│   └── utils/             # 通用工具函数
├── docs/                   # 用户文档
├── openspec/               # 项目自身的 OpenSpec 规范
├── schemas/                # 内置工作流模式
├── assets/                 # 图片资源
└── scripts/                # 构建/安装脚本
```

---

## 三、核心模块详解

### 3.1 CLI 层 ([`src/cli/`](src/cli/))

**主文件**: [`src/cli/index.ts`](src/cli/index.ts)

**职责**: CLI 命令注册和路由，使用 `commander` 库构建。

**主要命令**:

| 命令 | 功能 | 代码位置 |
|------|------|----------|
| `init` | 在项目初始化 OpenSpec | [`src/cli/index.ts:94-132`](src/cli/index.ts#L94-L132) |
| `update` | 更新 AI 工具配置文件 | [`src/cli/index.ts:156-170`](src/cli/index.ts#L156-L170) |
| `list` | 列出变化/规范 | [`src/cli/index.ts:172-190`](src/cli/index.ts#L172-L190) |
| `view` | 交互式仪表板 | [`src/cli/index.ts:192-204`](src/cli/index.ts#L192-L204) |
| `show` | 显示变化/规范详情 | [`src/cli/index.ts:313-337`](src/cli/index.ts#L313-L337) |
| `validate` | 验证结构完整性 | [`src/cli/index.ts:290-310`](src/cli/index.ts#L290-L310) |
| `archive` | 归档完成的变化 | [`src/cli/index.ts:269-283`](src/cli/index.ts#L269-L283) |
| `status` | 显示工件完成状态 | [`src/cli/index.ts:423-437`](src/cli/index.ts#L423-L437) |
| `instructions` | 获取 AI 执行指令 | [`src/cli/index.ts:440-459`](src/cli/index.ts#L440-L459) |
| `templates` | 显示模板路径 | [`src/cli/index.ts:462-475`](src/cli/index.ts#L462-L475) |
| `schemas` | 列出工作流模式 | [`src/cli/index.ts:478-490`](src/cli/index.ts#L478-L490) |
| `config` | 配置管理 | [`src/commands/config.ts`](src/commands/config.ts) |
| `completion` | Shell 自动完成 | [`src/cli/index.ts:356-416`](src/cli/index.ts#L356-L416) |

---

### 3.2 核心层 ([`src/core/`](src/core/))

这是项目的主要业务逻辑所在，包含以下子模块：

#### 3.2.1 命令生成模块 ([`src/core/command-generation/`](src/core/command-generation/))

**功能**: 为 20+ 种 AI 编程工具生成适配的指令文件

**关键文件**:

| 文件 | 功能 |
|------|------|
| [`generator.ts`](src/core/command-generation/generator.ts) | 命令生成器核心逻辑 |
| [`registry.ts`](src/core/command-generation/registry.ts) | 工具注册表管理 |
| [`types.ts`](src/core/command-generation/types.ts) | 类型定义 |
| [`factory.ts`](src/core/command-generation/adapters/factory.ts) | 适配器工厂 |
| [`index.ts`](src/core/command-generation/index.ts) | 模块导出 |

**AI 工具适配器** ([`src/core/command-generation/adapters/`](src/core/command-generation/adapters/)):

| 适配器文件 | 支持的工具 |
|-----------|------------|
| [`claude.ts`](src/core/command-generation/adapters/claude.ts) | Claude Code |
| [`cursor.ts`](src/core/command-generation/adapters/cursor.ts) | Cursor |
| [`cline.ts`](src/core/command-generation/adapters/cline.ts) | Cline |
| [`windsurf.ts`](src/core/command-generation/adapters/windsurf.ts) | Windsurf |
| [`kiro.ts`](src/core/command-generation/adapters/kiro.ts) | Kiro (AWS) |
| [`codex.ts`](src/core/command-generation/adapters/codex.ts) | Codex |
| [`gemini.ts`](src/core/command-generation/adapters/gemini.ts) | Gemini CLI |
| [`continue.ts`](src/core/command-generation/adapters/continue.ts) | Continue |
| [`github-copilot.ts`](src/core/command-generation/adapters/github-copilot.ts) | GitHub Copilot |
| [`amazon-q.ts`](src/core/command-generation/adapters/amazon-q.ts) | Amazon Q Developer |
| [`crush.ts`](src/core/command-generation/adapters/crush.ts) | Crush |
| [`kilocode.ts`](src/core/command-generation/adapters/kilocode.ts) | Kilo Code |
| [`qwen.ts`](src/core/command-generation/adapters/qwen.ts) | Qwen Code |
| [`qoder.ts`](src/core/command-generation/adapters/qoder.ts) | Qoder |
| [`roocode.ts`](src/core/command-generation/adapters/roocode.ts) | RooCode |
| [`trae.ts`](src/core/command-generation/adapters/trae.ts) | Trae |
| [`opencode.ts`](src/core/command-generation/adapters/opencode.ts) | OpenCode |
| [`costrict.ts`](src/core/command-generation/adapters/costrict.ts) | CoStrict |
| [`codebuddy.ts`](src/core/command-generation/adapters/codebuddy.ts) | CodeBuddy Code |
| [`iflow.ts`](src/core/command-generation/adapters/iflow.ts) | iFlow |
| [`auggie.ts`](src/core/command-generation/adapters/auggie.ts) | Auggie (Augment CLI) |
| [`antigravity.ts`](src/core/command-generation/adapters/antigravity.ts) | Antigravity |
| [`pi.ts`](src/core/command-generation/adapters/pi.ts) | Pi |
| [`factory.ts`](src/core/command-generation/adapters/factory.ts) | Factory Droid |

**配置定义**: [`src/core/config.ts`](src/core/config.ts) - 定义所有支持的 AI 工具列表 (`AI_TOOLS`)

---

#### 3.2.2 工件图模块 ([`src/core/artifact-graph/`](src/core/artifact-graph/))

**功能**: 管理工作流中各文档（proposal、specs、design、tasks）的依赖关系

**关键文件**:

| 文件 | 功能 |
|------|------|
| [`graph.ts`](src/core/artifact-graph/graph.ts) | 依赖图实现，使用拓扑排序（Kahn 算法） |
| [`schema.ts`](src/core/artifact-graph/schema.ts) | Schema 加载和解析 |
| [`state.ts`](src/core/artifact-graph/state.ts) | 工件状态管理 |
| [`resolver.ts`](src/core/artifact-graph/resolver.ts) | 模板路径解析 |
| [`instruction-loader.ts`](src/core/artifact-graph/instruction-loader.ts) | 指令加载器 |
| [`types.ts`](src/core/artifact-graph/types.ts) | 类型定义 |
| [`index.ts`](src/core/artifact-graph/index.ts) | 模块导出 |

**依赖关系示例**:

```
                    proposal (根节点)
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
      specs        design       research
         │             │             │
         └─────────────┼─────────────┘
                       │
                       ▼
                    tasks
```

---

#### 3.2.3 模板系统 ([`src/core/templates/`](src/core/templates/))

**功能**: 为各种工作流命令生成 AI 指令模板

**目录结构**:

```
src/core/templates/
├── index.ts                 # 模块导出
├── types.ts                 # 类型定义
├── skill-templates.ts       # 技能模板生成
└── workflows/               # 工作流模板
    ├── propose.ts           # 创建新变化提案
    ├── apply-change.ts      # 应用变化
    ├── archive-change.ts    # 归档变化
    ├── continue-change.ts   # 继续变化
    ├── explore.ts           # 探索性分析
    ├── verify-change.ts     # 验证变化
    ├── onboard.ts           # 新项目引导
    ├── feedback.ts          # 反馈生成
    ├── ff-change.ts         # Fast-forward 变化
    ├── new-change.ts        # 新变化创建
    ├── sync-specs.ts        # 规范同步
    └── bulk-archive-change.ts # 批量归档
```

---

#### 3.2.4 Schema 系统 ([`src/core/schemas/`](src/core/schemas/))

**功能**: 定义工作流的结构和验证规则

**关键文件**:

| 文件 | 功能 |
|------|------|
| [`base.schema.ts`](src/core/schemas/base.schema.ts) | 基础 Schema 定义 |
| [`spec.schema.ts`](src/core/schemas/spec.schema.ts) | 规范验证 |
| [`change.schema.ts`](src/core/schemas/change.schema.ts) | 变化验证 |
| [`index.ts`](src/core/schemas/index.ts) | 模块导出 |

**内置 Schema**:
- `spec-driven` - 标准规范驱动流程（默认）
- 支持自定义 Schema 扩展（通过 [`openspec schema`](src/cli/index.ts) 命令）

---

#### 3.2.5 配置系统

**文件结构**:

| 文件 | 功能 |
|------|------|
| [`config.ts`](src/core/config.ts) | AI 工具配置定义 |
| [`global-config.ts`](src/core/global-config.ts) | 全局配置管理 (`~/.config/openspec/`) |
| [`project-config.ts`](src/core/project-config.ts) | 项目级配置 (`openspec/config.yaml`) |
| [`profiles.ts`](src/core/profiles.ts) | 配置模板（core/custom） |
| [`config-schema.ts`](src/core/config-schema.ts) | 配置 Schema 验证 |
| [`config-prompts.ts`](src/core/config-prompts.ts) | 配置交互提示 |

**配置层级**:
1. **全局配置**: `~/.config/openspec/config.yaml`
2. **项目配置**: `<project>/openspec/config.yaml`

---

#### 3.2.6 核心命令实现

| 文件 | 功能 |
|------|------|
| [`init.ts`](src/core/init.ts) | 项目初始化 |
| [`update.ts`](src/core/update.ts) | 配置文件更新 |
| [`list.ts`](src/core/list.ts) | 列表显示 |
| [`archive.ts`](src/core/archive.ts) | 归档处理 |
| [`view.ts`](src/core/view.ts) | 交互式仪表板 |
| [`specs-apply.ts`](src/core/specs-apply.ts) | 规范合并 |
| [`migration.ts`](src/core/migration.ts) | 数据迁移 |
| [`legacy-cleanup.ts`](src/core/legacy-cleanup.ts) | 遗留文件清理 |
| [`available-tools.ts`](src/core/available-tools.ts) | 可用工具检测 |

---

#### 3.2.7 补全系统 ([`src/core/completions/`](src/core/completions/))

**功能**: 为不同 Shell 生成和安装自动完成脚本

**目录结构**:

```
src/core/completions/
├── command-registry.ts      # 命令注册表
├── completion-provider.ts   # 补全提供者
├── factory.ts               # 工厂函数
├── types.ts                 # 类型定义
├── generators/              # Shell 生成器
│   ├── bash-generator.ts
│   ├── zsh-generator.ts
│   ├── fish-generator.ts
│   └── powershell-generator.ts
├── installers/              # Shell 安装器
│   ├── bash-installer.ts
│   ├── zsh-installer.ts
│   ├── fish-installer.ts
│   └── powershell-installer.ts
└── templates/               # 补全模板
    ├── bash-templates.ts
    ├── zsh-templates.ts
    ├── fish-templates.ts
    └── powershell-templates.ts
```

---

#### 3.2.8 解析器模块 ([`src/core/parsers/`](src/core/parsers/))

**功能**: 解析 Markdown 规范文件和变化文档

| 文件 | 功能 |
|------|------|
| [`markdown-parser.ts`](src/core/parsers/markdown-parser.ts) | Markdown 解析 |
| [`change-parser.ts`](src/core/parsers/change-parser.ts) | 变化文档解析 |
| [`requirement-blocks.ts`](src/core/parsers/requirement-blocks.ts) | 需求块解析 |

---

#### 3.2.9 其他核心模块

| 文件/目录 | 功能 |
|-----------|------|
| [`shared/`](src/core/shared/) | 共享工具（技能生成、工具检测） |
| [`converters/`](src/core/converters/) | 数据转换器（如 JSON 转换器） |
| [`styles/`](src/core/styles/) | 样式和调色板定义 |

---

### 3.3 命令层 ([`src/commands/`](src/commands/))

**功能**: CLI 子命令的具体实现

**主要模块**:

| 文件 | 功能 |
|------|------|
| [`workflow/`](src/commands/workflow/) | 工作流相关命令（status, instructions, templates 等） |
| [`spec.ts`](src/commands/spec.ts) | 规范管理命令 |
| [`change.ts`](src/commands/change.ts) | 变化管理命令 |
| [`config.ts`](src/commands/config.ts) | 配置命令 |
| [`validate.ts`](src/commands/validate.ts) | 验证命令 |
| [`show.ts`](src/commands/show.ts) | 显示命令 |
| [`completion.ts`](src/commands/completion.ts) | 自动完成命令 |
| [`schema.ts`](src/commands/schema.ts) | Schema 管理命令 |
| [`feedback.ts`](src/commands/feedback.ts) | 反馈命令 |

---

### 3.4 工具层 ([`src/utils/`](src/utils/))

**通用工具函数**:

| 文件 | 功能 |
|------|------|
| [`file-system.ts`](src/utils/file-system.ts) | 文件系统操作封装 |
| [`item-discovery.ts`](src/utils/item-discovery.ts) | 项目/变化发现逻辑 |
| [`match.ts`](src/utils/match.ts) | 模糊匹配算法 |
| [`interactive.ts`](src/utils/interactive.ts) | 交互提示（inquirer 封装） |
| [`shell-detection.ts`](src/utils/shell-detection.ts) | Shell 类型检测 |
| [`task-progress.ts`](src/utils/task-progress.ts) | 进度跟踪和显示 |
| [`command-references.ts`](src/utils/command-references.ts) | 命令引用格式化 |
| [`change-metadata.ts`](src/utils/change-metadata.ts) | 变化元数据提取 |
| [`change-utils.ts`](src/utils/change-utils.ts) | 变化相关工具函数 |
| [`index.ts`](src/utils/index.ts) | 模块导出 |

---

### 3.5 遥测层 ([`src/telemetry/`](src/telemetry/))

**文件**:

| 文件 | 功能 |
|------|------|
| [`config.ts`](src/telemetry/config.ts) | 遥测配置 |
| [`index.ts`](src/telemetry/index.ts) | 导出和初始化 |

**功能**: 匿名使用统计（可通过 `OPENSPEC_TELEMETRY=0` 或 `DO_NOT_TRACK=1` 禁用）

**收集内容**: 命令名称、版本号
**不收集**: 参数、路径、内容、PII

---

## 四、工作流概念

### 4.1 核心工作流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        OPENSPEC FLOW                             │
│                                                                  │
│   ┌────────────────┐                                            │
│   │  1. START      │  /opsx:propose (core) 或 /opsx:new (expanded) │
│   │     CHANGE     │                                            │
│   └───────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│   ┌────────────────┐                                            │
│   │  2. CREATE     │  /opsx:ff 或 /opsx:continue (expanded workflow) │
│   │     ARTIFACTS  │  创建顺序：proposal → specs → design → tasks   │
│   │                │  (基于 schema 依赖关系)                      │
│   └───────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│   ┌────────────────┐                                            │
│   │  3. IMPLEMENT  │  /opsx:apply                               │
│   │     TASKS      │  执行任务，逐个勾选完成                     │
│   │                │◄──── 在学习过程中更新工件                   │
│   └───────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│   ┌────────────────┐                                            │
│   │  4. VERIFY     │  /opsx:verify (可选)                       │
│   │     WORK       │  检查实现是否符合规范                       │
│   └───────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│   ┌────────────────┐     ┌──────────────────────────────────────┐ │
│   │  5. ARCHIVE    │────►│  Delta 规范合并到主规范               │ │
│   │     CHANGE     │     │  变化文件夹移动到 archive/            │ │
│   └────────────────┘     │  规范成为更新后的真实来源             │ │
│                          └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 核心文件结构

```
openspec/
├── specs/                    # 规范（系统行为的真实来源）
│   ├── auth/
│   │   └── spec.md
│   ├── payments/
│   │   └── spec.md
│   └── ui/
│       └── spec.md
├── changes/                  # 进行中的变化
│   ├── add-dark-mode/
│   │   ├── proposal.md       # 意图和范围
│   │   ├── design.md         # 技术方案
│   │   ├── tasks.md          # 实现清单
│   │   ├── .openspec.yaml    # 元数据（可选）
│   │   └── specs/            # Delta 规范
│   │       └── ui/
│   │           └── spec.md
│   └── archive/              # 已归档的变化
│       └── 2025-01-23-add-dark-mode/
├── schemas/                  # 工作流定义
│   └── spec-driven/
│       ├── schema.yaml
│       └── templates/
│           ├── proposal.md
│           ├── specs.md
│           ├── design.md
│           └── tasks.md
└── config.yaml               # 项目配置
```

---

## 五、设计哲学

OpenSpec 基于四个核心原则构建：

| 原则 | 含义 |
|------|------|
| **Fluid not rigid** | 无阶段限制，随时可更新任何工件 |
| **Iterative not waterfall** | 渐进式完善，非瀑布式开发 |
| **Easy not complex** | 轻量级设置，最小仪式感 |
| **Brownfield-first** | 专为现有代码库设计，而非仅适用于新项目 |

---

## 六、技术栈

| 类别 | 技术 |
|------|------|
| **语言** | TypeScript (ES Modules) |
| **CLI 框架** | Commander.js |
| **数据验证** | Zod |
| **测试框架** | Vitest |
| **交互提示** | Inquirer (@inquirer/prompts) |
| **加载动画** | Ora |
| **配置格式** | YAML (js-yaml) |
| **终端样式** | Chalk |
| **文件匹配** | Fast Glob |
| **数据分析** | PostHog (可选遥测) |

**开发工具**:

| 工具 | 用途 |
|------|------|
| [`eslint.config.js`](eslint.config.js) | 代码 linting |
| [`build.js`](build.js) | 自定义构建脚本 |
| [`tsconfig.json`](tsconfig.json) | TypeScript 配置 |

---

## 七、关键数据流

### 7.1 初始化流程

```
openspec init
    │
    ▼
[src/core/init.ts](src/core/init.ts)
    │
    ├─► 创建目录结构 (openspec/, openspec/specs/, openspec/changes/)
    │
    ├─► 生成 config.yaml
    │
    ├─► 检测并配置 AI 工具
    │
    └─► 生成工具特定的指令文件
            │
            └─► [src/core/command-generation/](src/core/command-generation/)
                    │
                    └─► 使用适配器格式化并写入文件
```

### 7.2 变化创建流程

```
/opsx:propose <change-name>
    │
    ▼
[src/core/templates/workflows/propose.ts](src/core/templates/workflows/propose.ts)
    │
    ├─► 创建变化目录
    │
    ├─► 生成 proposal.md
    │
    ├─► 生成 .openspec.yaml
    │
    └─► 根据 schema 确定可用工件
```

### 7.3 规范合并流程（Archive）

```
openspec archive <change-name>
    │
    ▼
[src/core/archive.ts](src/core/archive.ts)
    │
    ├─► 验证变化完整性
    │
    ├─► 解析 delta specs
    │
    ├─► [src/core/specs-apply.ts](src/core/specs-apply.ts)
    │       │
    │       ├─► ADDED → 追加到主规范
    │       ├─► MODIFIED → 替换现有需求
    │       └─► REMOVED → 从主规范删除
    │
    └─► 移动变化到 archive/ 目录
```

---

## 八、扩展性设计

### 8.1 添加新的 AI 工具支持

1. 在 [`src/core/command-generation/adapters/`](src/core/command-generation/adapters/) 创建新的适配器文件
2. 在 [`src/core/config.ts`](src/core/config.ts) 的 `AI_TOOLS` 数组中添加工具配置
3. 更新 [`src/core/command-generation/adapters/factory.ts`](src/core/command-generation/adapters/factory.ts) 的映射逻辑

### 8.2 创建自定义工作流 Schema

1. 使用 `openspec schema init <name>` 创建新 schema
2. 或使用 `openspec schema fork <source> <name>` 复制内置 schema
3. 编辑 [`openspec/schemas/<name>/schema.yaml`](openspec/schemas/) 定义工件依赖
4. 自定义模板文件

### 8.3 添加新的工作流命令

1. 在 [`src/core/templates/workflows/`](src/core/templates/workflows/) 创建模板文件
2. 在 CLI 中注册新命令（[`src/cli/index.ts`](src/cli/index.ts)）
3. 实现命令处理逻辑

---

## 九、相关文档

- [CLI 参考](docs/cli.md) - 完整的 CLI 命令文档
- [工作流指南](docs/workflows.md) - 常见模式和使用场景
- [概念说明](docs/concepts.md) - 核心概念详解
- [自定义指南](docs/customization.md) - Schema 和模板定制
- [支持的工具](docs/supported-tools.md) - AI 工具集成列表

---

*最后更新：2026-03-12*
