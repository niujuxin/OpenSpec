# Proposal: Spec Refiner 模块 - 迭代式规范完善

## 1. 意图 (Intent)

为 OpenSpec 添加一个**可选的、非破坏性的** Spec 迭代完善功能，帮助用户从粗略的需求描述出发，通过分析模糊性、反向提问、迭代完善的方式，最终生成清晰、无歧义的规范文档。

### 1.1 问题陈述

当前的 OpenSpec 工作流中，用户需要提供一个相对完整的初始输入（通过 `/opsx:propose` 或 `/opsx:new`），AI 会一次性生成所有工件（proposal、specs、design、tasks）。这种方式存在以下问题：

1. **模糊需求无法处理** - 如果用户初始输入不够清晰，生成的工件质量会大打折扣
2. **缺少澄清循环** - 现有的 `AskUserQuestion` 仅用于简单澄清，没有系统性的迭代完善机制
3. **无法检测歧义** - 没有自动化的 Spec 模糊性/歧义检测能力

### 1.2 目标

| 目标 | 描述 |
|------|------|
| **模糊性检测** | 自动识别 Spec 中的歧义、遗漏、矛盾 |
| **问题生成** | 将模糊点转化为结构化的澄清问题 |
| **迭代循环** | "分析 → 提问 → 收集答案 → 更新 Spec"的完整闭环 |
| **质量评估** | 判断 Spec 何时达到"无歧义"标准 |

### 1.3 非目标

| 非目标 | 说明 |
|--------|------|
| 修改现有工作流 | 不改变 `/opsx:propose`、`/opsx:apply` 等现有命令的行为 |
| 强制启用 | 功能默认禁用，用户可选启用 |
| 替换现有功能 | 是现有功能的补充，而非替代 |

---

## 2. 范围 (Scope)

### 2.1 范围内 (In Scope) - MVP

- [x] 创建新的 `spec-refiner` 模块（`src/core/spec-refiner/`）
- [x] 实现 Spec 模糊性检测器（基于 LLM 分析）
- [x] 实现迭代控制器（状态管理、循环逻辑）
- [x] 实现答案整合功能
- [x] 新增 CLI 命令 `openspec refine`
- [x] 完全复用现有接口（`AskUserQuestion`、模板系统等）
- [x] 不修改任何现有核心代码

### 2.2 范围外 (Out of Scope) - MVP

- [ ] 修改现有 CLI 命令的行为
- [ ] 修改现有 Schema 结构
- [ ] 修改现有 Skill 模板
- [ ] Skill 集成（作为可选 skill）
- [ ] 项目级 schema 定义
- [ ] 模板系统
- [ ] 单元测试/集成测试
- [ ] 自动应用 Spec 变更到代码

### 2.3 后续迭代（MVP 完成后决定）

| 功能 | 说明 |
|------|------|
| **质量评估体系** | 量化的质量评分（清晰度、完整性、一致性、可测试性） |
| **Skill 集成** | 作为可选 skill 通过 `featureFlags` 启用 |
| **Schema 定义** | 定义 refine 工作流的 schema |
| **测试套件** | 单元测试和集成测试 |
| **规则检测** | 基于规则的模糊性检测（作为 LLM 分析的补充） |

---

## 3. 方法 (Approach)

### 3.1 设计原则

| 原则 | 说明 |
|------|------|
| **非破坏性** | 不修改任何现有代码，完全通过扩展点集成 |
| **配置驱动** | 通过 `config.yaml` 控制启用，默认禁用 |
| **可插拔** | 用户可选择安装/卸载此功能 |
| **前向兼容** | 使用 Zod 的 `.passthrough()` 特性 |
| **复用接口** | 自动跟随 OpenSpec 版本更新 |

### 3.2 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenSpec Core                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Schema    │  │   Command   │  │    Skill Generation     │  │
│  │  Resolver   │  │  Registry   │  │       (扩展点)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                      │                │
│         │                │                      │                │
│         ▼                ▼                      ▼                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              OpenSpec Extension Points                       ││
│  │  • config.yaml (featureFlags, passthrough)                  ││
│  │  • registerXXXCommand()                                      ││
│  │  • getSkillTemplates() with config filter                    ││
│  │  • openspec/schema init (project-level)                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 非侵入式扩展
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Spec Refiner Module                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Analyzer  │  │  Question   │  │    Iteration            │  │
│  │  (模糊检测)  │  │  Generator  │  │    Controller           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │   Quality   │  │    CLI      │                               │
│  │   Checker   │  │  Command    │                               │
│  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 模块结构（MVP）

```
src/core/spec-refiner/
├── index.ts              # 公开 API 导出
├── types.ts              # 类型定义
├── analyzer.ts           # Spec 模糊性分析器
├── iteration.ts          # 迭代控制器
└── config.ts             # 配置扩展（可选）
```

### 3.4 工作流程（MVP）

```
┌─────────────────────────────────────────────────────────────────┐
│                Spec Refiner MVP 工作流程                         │
└─────────────────────────────────────────────────────────────────┘

  用户输入粗略 Spec
         │
         ▼
  ┌─────────────────┐
  │  1. LLM 分析     │  analyzer.ts - 识别模糊点、歧义
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  2. 生成问题     │  将模糊点转化为问题
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  3. 用户回答     │  使用 AskUserQuestion 工具
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  4. 更新 Spec    │  整合答案，更新 Spec 内容
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │  5. 达到迭代上限？│  是 → 完成 | 否 → 返回步骤 2
  └─────────────────┘
```

### 3.5 与现有功能集成

| 集成点 | 复用方式 | 文件引用 |
|--------|---------|----------|
| **提问工具** | 复用 `AskUserQuestion` 调用模式 | [`propose.ts`](src/core/templates/workflows/propose.ts#L28-L35) |
| **Spec 解析** | 复用 `ChangeParser` | [`change-parser.ts`](src/core/parsers/change-parser.ts) |
| **CLI 注册** | 复用 Commander.js 模式 | [`cli/index.ts`](src/cli/index.ts) |

### 3.6 配置方式（可选）

MVP 阶段配置通过 CLI 选项直接传递，后续再考虑 config.yaml 扩展：

```bash
# CLI 选项配置
--max-iterations <n>   # 最大迭代次数（默认：5）
--output <path>        # 输出路径
```

### 3.7 CLI 命令设计（MVP）

```bash
# 迭代完善 Spec（交互模式）
openspec refine <spec-path>

# 配置选项
--max-iterations <n>   # 最大迭代次数（默认：5）
--output <path>        # 输出路径
```

---

## 4. 变更内容 (What Changes)

### 4.1 ADDED - 新增文件（MVP）

| 文件路径 | 用途 |
|---------|------|
| `src/core/spec-refiner/types.ts` | 类型定义 |
| `src/core/spec-refiner/analyzer.ts` | 模糊性检测 |
| `src/core/spec-refiner/iteration.ts` | 迭代控制 |
| `src/core/spec-refiner/index.ts` | 模块导出 |
| `src/commands/refine.ts` | CLI 命令实现 |

### 4.2 MODIFIED - 修改文件（MVP）

| 文件路径 | 修改内容 | 说明 |
|---------|---------|------|
| `src/cli/index.ts` | 添加 `RefineCommand` 注册 | 模块化注册，~5 行变更 |

### 4.3 REMOVED - 删除内容

无。此变更不删除任何现有功能。

### 4.4 后续迭代（MVP 完成后决定）

| 文件 | 用途 |
|------|------|
| `src/core/spec-refiner/config.ts` | 配置扩展 |
| `src/core/spec-refiner/skill-template.ts` | Skill 模板 |
| `src/core/shared/skill-generation.ts` | Skill 注册（修改） |
| `openspec/schemas/spec-refiner/` | Schema 定义和模板 |

---

## 5. 风险与缓解 (Risks & Mitigations)

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 与未来 OpenSpec 版本冲突 | 低 | 中 | 复用现有接口，不修改核心代码 |
| 用户配置复杂 | 中 | 低 | 提供默认配置，默认禁用 |
| LLM 分析准确性 | 中 | 中 | 提供人工覆盖选项，支持编辑问题 |
| 迭代次数过多 | 低 | 低 | 配置 `maxIterations` 限制 |

---

## 6. 成功标准 (Success Criteria) - MVP

| 标准 | 验证方式 |
|------|---------|
| 模块可正常运行 | `openspec refine --help` 验证 |
| 不破坏现有功能 | 手动验证 `openspec init`、`openspec list` 正常工作 |
| CLI 命令可正常交互 | 执行 `openspec refine test-spec.md` 验证交互流程 |
| 能输出精炼后的 Spec | 验证输出文件正确生成 |

---

## 7. 参考文件

| 文件 | 说明 |
|------|------|
| [`design.md`](./design.md) | 技术设计和实现方案 |
| [`tasks.md`](./tasks.md) | 实现任务清单（MVP） |

---

## 8. Deltas

### 8.1 新增：Spec Refiner 模块（MVP）

这是一个全新的可选模块，为 OpenSpec 添加迭代式 Spec 完善能力。

MVP 版本专注于最小闭环：
- LLM 驱动的模糊性检测
- 交互式问答循环
- Spec 更新整合

### 8.2 后续迭代

以下功能在第一版 MVP 完成后，根据实际使用情况再决定是否需要：

- 量化的质量评估体系
- Skill 集成（通过 `featureFlags` 启用）
- 项目级 schema 定义
- 基于规则的模糊性检测
- 测试套件

---

*Proposal 版本：1.0*
*创建日期：2026-03-12*
