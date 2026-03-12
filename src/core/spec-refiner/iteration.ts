import { SpecAnalyzer } from './analyzer.js';
import type { IterationState, RefineConfig, Ambiguity, IterationResult, AnsweredQuestion } from './types.js';
import Anthropic from '@anthropic-ai/sdk';

/**
 * 迭代控制器
 *
 * 管理 "分析 → 提问 → 回答 → 更新" 的完整循环
 */
export class IterationController {
  private state: IterationState;
  private analyzer: SpecAnalyzer;
  private config: RefineConfig;
  private client: Anthropic | null = null;
  private model: string;

  constructor(config: RefineConfig, initialSpec: string, apiKey?: string, baseUrl?: string, model?: string) {
    this.config = config;
    this.model = model || 'claude-sonnet-4-20250514';
    this.analyzer = new SpecAnalyzer(apiKey, baseUrl, this.model);
    this.state = this.createInitialState(initialSpec);

    if (apiKey) {
      const options: { apiKey: string; baseURL?: string } = { apiKey };
      if (baseUrl) {
        options.baseURL = baseUrl;
      }
      this.client = new Anthropic(options);
    }
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
    const lastAnalysis = this.state.history[this.state.history.length - 1];
    const ambiguity = lastAnalysis?.ambiguities.find((a) => a.id === ambiguityId);

    if (!ambiguity) {
      throw new Error(`Ambiguity with id ${ambiguityId} not found`);
    }

    this.state.answeredQuestions.push({
      ambiguityId,
      question: ambiguity.question,
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
    ambiguity: Ambiguity,
    answer: string
  ): Promise<string> {
    if (!this.client) {
      // 降级模式：简单地将答案追加到 Spec 末尾的澄清部分
      const clarificationSection = `\n\n## Clarifications\n\n- **${ambiguity.question}**: ${answer}`;
      return spec + clarificationSection;
    }

    try {
      const prompt = `You are refining a specification document. Integrate the following clarification into the spec naturally.

ORIGINAL SPEC:
${spec}

---
AMBIGUITY THAT WAS CLARIFIED:
- Text: "${ambiguity.text}"
- Location: "${ambiguity.location}"
- Question: "${ambiguity.question}"

USER'S ANSWER:
${answer}

---
INSTRUCTIONS:
1. Update the spec to incorporate this clarification
2. Replace or modify the ambiguous text with the clarified version
3. Keep the spec's structure and formatting
4. Return ONLY the updated spec content, no explanations

Updated spec:`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content.find((c) => c.type === 'text');
      if (!content || content.type !== 'text') {
        // 降级：追加到末尾
        const clarificationSection = `\n\n## Clarifications\n\n- **${ambiguity.question}**: ${answer}`;
        return spec + clarificationSection;
      }

      return content.text.trim();
    } catch (error) {
      console.error('Error integrating answer:', error);
      // 降级：追加到末尾
      const clarificationSection = `\n\n## Clarifications\n\n- **${ambiguity.question}**: ${answer}`;
      return spec + clarificationSection;
    }
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
