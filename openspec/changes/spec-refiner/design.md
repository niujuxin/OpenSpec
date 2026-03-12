# Design: Spec Refiner 模块 (MVP)

## 1. 技术方法 (Technical Approach)

### 1.1 核心架构

采用**分层架构**，自上而下分为：

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                           │
│  • CLI Command (`openspec refine`)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                          │
│  • IterationController (迭代控制、状态管理)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Analysis Layer                            │
│  • SpecAnalyzer (模糊性检测 - LLM 驱动)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
│  • Reuse OpenSpec: AskUserQuestion                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 核心组件设计

### 2.1 类型定义 (`types.ts`)

```typescript
/**
 * Spec 分析结果
 */
export interface SpecAnalysis {
  /** 原始 Spec 内容 */
  originalSpec: string;
  /** 识别出的模糊点 */
  ambiguities: Ambiguity[];
  /** 整体质量评分 (0-1) - 可选，MVP 可简化 */
  qualityScore?: number;
}

/**
 * 模糊点
 */
export interface Ambiguity {
  /** 唯一标识 */
  id: string;
  /** 模糊的文本片段 */
  text: string;
  /** 位置（行号或路径） */
  location: string;
  /** 向用户提出的问题 */
  question: string;
  /** 建议的澄清方向 */
  suggestion?: string;
}

/**
 * 迭代状态
 */
export interface IterationState {
  /** 当前迭代次数 */
  currentIteration: number;
  /** 最大迭代次数 */
  maxIterations: number;
  /** 历史分析结果 */
  history: SpecAnalysis[];
  /** 已回答的问题 */
  answeredQuestions: AnsweredQuestion[];
  /** 当前 Spec 内容 */
  currentSpec: string;
  /** 是否完成 */
  isComplete: boolean;
}

/**
 * 已回答的问题
 */
export interface AnsweredQuestion {
  ambiguityId: string;
  question: string;
  answer: string;
  timestamp: Date;
}

/**
 * 配置选项
 */
export interface RefineConfig {
  maxIterations: number;
  output?: string;
}
```

---

### 2.2 模糊性分析器 (`analyzer.ts`)

```typescript
import type { SpecAnalysis, Ambiguity } from './types.js';

/**
 * Spec 模糊性分析器
 *
 * MVP: 使用 LLM 分析识别 Spec 中的模糊点
 */
export class SpecAnalyzer {

  /**
   * 分析 Spec 内容
   */
  async analyze(specContent: string): Promise<SpecAnalysis> {
    // MVP: 直接调用 LLM 分析
    const ambiguities = await this.analyzeWithLLM(specContent);

    return {
      originalSpec: specContent,
      ambiguities,
    };
  }

  /**
   * 使用 LLM 进行深度分析
   */
  private async analyzeWithLLM(specContent: string): Promise<Ambiguity[]> {
    // 调用 LLM 分析 Spec
    // Prompt 示例：
    // "分析以下 Spec 内容，识别其中的模糊点、歧义、遗漏。
    // 对每个模糊点，生成一个向用户提问的问题。"

    // 返回结构化的模糊点列表
  }
}
```

---

### 2.3 迭代控制器 (`iteration.ts`)

```typescript
import { SpecAnalyzer } from './analyzer.js';
import type { IterationState, RefineConfig, Ambiguity } from './types.js';

/**
 * 迭代控制器
 *
 * 管理 "分析 → 提问 → 回答 → 更新" 的完整循环
 */
export class IterationController {
  private state: IterationState;
  private analyzer: SpecAnalyzer;
  private config: RefineConfig;

  constructor(config: RefineConfig, initialSpec: string) {
    this.config = config;
    this.analyzer = new SpecAnalyzer();
    this.state = this.createInitialState(initialSpec);
  }

  /**
   * 执行一次迭代
   */
  async iterate(): Promise<IterationResult> {
    // 1. 分析当前 Spec
    const analysis = await this.analyzer.analyze(this.state.currentSpec);
    this.state.history.push(analysis);

    // 2. 检查是否达到最大迭代次数
    if (this.state.currentIteration >= this.config.maxIterations) {
      this.state.isComplete = true;
      return this.createMaxIterationsResult();
    }

    // 3. 检查是否还有模糊点
    if (analysis.ambiguities.length === 0) {
      this.state.isComplete = true;
      return this.createCompleteResult();
    }

    this.state.currentIteration++;

    return {
      type: 'continue',
      ambiguities: analysis.ambiguities,
      state: this.state,
    };
  }

  /**
   * 处理用户回答
   */
  async processAnswer(ambiguityId: string, answer: string): Promise<void> {
    // 1. 记录回答
    const ambiguity = this.state.history[this.state.history.length - 1]
      .ambiguities.find(a => a.id === ambiguityId);

    this.state.answeredQuestions.push({
      ambiguityId,
      question: ambiguity?.question || '',
      answer,
      timestamp: new Date(),
    });

    // 2. 更新 Spec
    this.state.currentSpec = await this.integrateAnswer(
      this.state.currentSpec,
      ambiguity,
      answer
    );
  }

  /**
   * 获取当前状态
   */
  getState(): IterationState {
    return { ...this.state };
  }

  /**
   * 整合答案到 Spec
   */
  private async integrateAnswer(
    spec: string,
    ambiguity: Ambiguity | undefined,
    answer: string
  ): Promise<string> {
    // 使用 LLM 将答案整合到 Spec 中
    // 保持 Spec 的结构和格式
  }

  private createInitialState(initialSpec: string): IterationState {
    return {
      currentIteration: 0,
      maxIterations: this.config.maxIterations,
      history: [],
      answeredQuestions: [],
      currentSpec: initialSpec,
      isComplete: false,
    };
  }

  private createCompleteResult(): IterationResult {
    return {
      type: 'complete',
      state: this.state,
      finalSpec: this.state.currentSpec,
      reason: 'No more ambiguities detected',
    };
  }

  private createMaxIterationsResult(): IterationResult {
    return {
      type: 'max_iterations',
      state: this.state,
      finalSpec: this.state.currentSpec,
      reason: `Reached max iterations (${this.config.maxIterations})`,
    };
  }
}

export type IterationResult =
  | { type: 'continue'; ambiguities: Ambiguity[]; state: IterationState }
  | { type: 'complete'; state: IterationState; finalSpec: string; reason: string }
  | { type: 'max_iterations'; state: IterationState; finalSpec: string; reason: string };
```

---

## 3. CLI 命令实现

### 3.1 命令实现 (`src/commands/refine.ts`)

```typescript
import { Command } from 'commander';
import { IterationController } from '../core/spec-refiner/iteration.js';
import type { Ambiguity } from '../core/spec-refiner/types.js';
import ora from 'ora';
import { promises as fs } from 'fs';

export class RefineCommand {
  async execute(specPath: string, options: { maxIterations?: number; output?: string }) {
    const spinner = ora('Loading spec...').start();

    try {
      // 1. 读取 Spec 文件
      const specContent = await fs.readFile(specPath, 'utf-8');
      spinner.text = 'Analyzing spec...';

      // 2. 创建迭代控制器
      const controller = new IterationController(
        { maxIterations: options.maxIterations || 5 },
        specContent
      );

      spinner.stop();

      // 3. 开始迭代
      while (true) {
        const result = await controller.iterate();

        if (result.type === 'continue') {
          await this.handleIteration(controller, result.ambiguities);
        } else {
          // 完成
          await this.finalize(controller, result.finalSpec, options.output);
          break;
        }
      }
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private async handleIteration(
    controller: IterationController,
    ambiguities: Ambiguity[]
  ): Promise<void> {
    console.log(`\n--- Iteration ${controller.getState().currentIteration} ---\n`);
    console.log(`Found ${ambiguities.length} ambiguities to clarify.\n`);

    // 处理每个模糊点
    for (const ambiguity of ambiguities) {
      const answer = await this.askUser(ambiguity);
      await controller.processAnswer(ambiguity.id, answer);
    }
  }

  private async askUser(ambiguity: Ambiguity): Promise<string> {
    const { select } = await import('@inquirer/prompts');

    console.log(`\nAmbiguity: ${ambiguity.text}`);
    console.log(`Question: ${ambiguity.question}`);

    if (ambiguity.suggestion) {
      console.log(`Suggestion: ${ambiguity.suggestion}`);
    }

    // 使用 AskUserQuestion 模式
    const answer = await select({
      message: 'Your answer:',
      choices: [
        { value: 'custom', name: 'Enter custom answer' },
        // 可添加预定义选项
      ],
    });

    if (answer === 'custom') {
      const { input } = await import('@inquirer/prompts');
      return await input({ message: 'Your answer:' });
    }

    return answer;
  }

  private async finalize(
    controller: IterationController,
    finalSpec: string,
    outputPath?: string
  ): Promise<void> {
    const state = controller.getState();

    console.log('\n--- Refinement Complete ---\n');
    console.log(`Iterations: ${state.currentIteration}`);
    console.log(`Questions answered: ${state.answeredQuestions.length}`);

    if (outputPath) {
      await fs.writeFile(outputPath, finalSpec, 'utf-8');
      console.log(`\nOutput written to: ${outputPath}`);
    } else {
      console.log('\n--- Refined Spec ---\n');
      console.log(finalSpec);
    }
  }
}
```

---

## 4. 文件结构

```
src/
├── core/
│   └── spec-refiner/
│       ├── index.ts              # 导出：IterationController, SpecAnalyzer, 等
│       ├── types.ts              # 类型定义
│       ├── analyzer.ts           # SpecAnalyzer 类
│       └── iteration.ts          # IterationController 类
├── commands/
│   └── refine.ts                 # CLI 命令实现
└── cli/
    └── index.ts                  # 注册 RefineCommand
```

---

## 5. 与现有功能集成

### 5.1 复用 OpenSpec 接口

| 功能 | 复用方式 |
|------|---------|
| **提问工具** | 使用 `@inquirer/prompts`（与 `AskUserQuestion` 相同模式） |
| **CLI 注册** | 使用 Commander.js（与现有命令相同） |

### 5.2 CLI 集成

```typescript
// src/cli/index.ts
import { RefineCommand } from './commands/refine.js';

program
  .command('refine [spec-path]')
  .description('Iteratively refine a spec through ambiguity analysis and Q&A')
  .option('--max-iterations <n>', 'Max refinement iterations', '5')
  .option('--output <path>', 'Output path for refined spec')
  .action(async (specPath, options) => {
    const command = new RefineCommand();
    await command.execute(specPath, options);
  });
```

---

## 6. MVP 范围

### 包含的功能

- [x] LLM 驱动的模糊性检测
- [x] 交互式问答循环
- [x] Spec 更新整合
- [x] CLI 命令
- [x] 最大迭代次数控制
- [x] 输出到文件

### 暂不包含

- [ ] 量化的质量评分
- [ ] 基于规则的检测
- [ ] Skill 集成
- [ ] 项目级 schema
- [ ] 复杂的问题生成和排序
- [ ] 测试套件

---

*Design 版本：1.0 (MVP)*
*创建日期：2026-03-12*
*最后修改：2026-03-12 - 简化为 MVP 设计*
