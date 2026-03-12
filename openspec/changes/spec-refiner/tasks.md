# Tasks: Spec Refiner 模块实现

## 最小闭环实现任务清单

---

## 1. 核心模块实现

### 1.1 类型定义

- [ ] 1.1.1 创建 `src/core/spec-refiner/types.ts`
  - [ ] 定义 `SpecAnalysis` 接口
  - [ ] 定义 `Ambiguity` 接口
  - [ ] 定义 `IterationState` 接口
  - [ ] 定义 `RefineConfig` 接口

### 1.2 模糊性分析器

- [ ] 1.2.1 创建 `src/core/spec-refiner/analyzer.ts`
  - [ ] 实现 `detectAmbiguities()` - 基于 LLM 分析
  - [ ] 实现 `analyze()` - 主分析入口

### 1.3 迭代控制器

- [ ] 1.3.1 创建 `src/core/spec-refiner/iteration.ts`
  - [ ] 实现 `IterationController` 类
  - [ ] 实现 `iterate()` - 执行一次迭代
  - [ ] 实现 `processAnswer()` - 处理用户回答
  - [ ] 实现 `integrateAnswer()` - 整合答案到 Spec
  - [ ] 实现状态管理

### 1.4 模块导出

- [ ] 1.4.1 创建 `src/core/spec-refiner/index.ts`
  - [ ] 导出所有公共类和类型

---

## 2. CLI 命令实现

### 2.1 命令实现

- [ ] 2.1.1 创建 `src/commands/refine.ts`
  - [ ] 实现 `RefineCommand` 类
  - [ ] 实现 `execute()` 方法（交互式迭代）
  - [ ] 添加 `--max-iterations` 选项
  - [ ] 添加 `--output` 选项

### 2.2 CLI 集成

- [ ] 2.2.1 修改 `src/cli/index.ts`
  - [ ] 导入 `RefineCommand`
  - [ ] 调用 `RefineCommand(program)`

---

## 3. 配置（可选）

### 3.1 配置扩展

- [ ] 3.1.1 创建 `src/core/spec-refiner/config.ts`
  - [ ] 实现 `RefineConfigSchema`（使用 `.passthrough()`）
  - [ ] 导出配置类型

---

## 任务依赖关系

```
1.1 类型定义
    │
    ▼
1.2 分析器 ──┐
             ├──► 1.3 迭代控制器 ──► 2.1 命令实现 ──► 2.2 CLI 集成
1.4 模块导出 ─┘
```

---

## 进度追踪

| 阶段 | 任务数 | 已完成 | 进度 |
|------|--------|--------|------|
| 1. 核心模块 | 4 | 0 | 0% |
| 2. CLI 命令 | 2 | 0 | 0% |
| 3. 配置 | 1 | 0 | 0% |
| **总计** | **7** | **0** | **0%** |

---

## 后续任务（暂不实现）

以下任务在第一版闭环完成后，根据实际使用情况再决定是否需要：

- Skill 集成（作为可选 skill）
- 项目级 schema 定义
- 模板系统
- 单元测试/集成测试
- 复杂的质量评估体系
- 文档更新

---

*Tasks 版本：1.0 (MVP)*
*创建日期：2026-03-12*
*最后修改：2026-03-12 - 删除测试部分，简化为最小闭环*
