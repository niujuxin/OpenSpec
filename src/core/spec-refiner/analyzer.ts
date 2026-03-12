import Anthropic from '@anthropic-ai/sdk';
import type { SpecAnalysis, Ambiguity } from './types.js';

/**
 * Spec 模糊性分析器
 *
 * MVP: 使用 LLM 分析识别 Spec 中的模糊点
 */
export class SpecAnalyzer {
  private client: Anthropic | null = null;
  private model: string;

  constructor(apiKey?: string, baseUrl?: string, model?: string) {
    this.model = model || 'claude-sonnet-4-20250514';

    if (apiKey) {
      const options: { apiKey: string; baseURL?: string } = { apiKey };
      if (baseUrl) {
        options.baseURL = baseUrl;
      }
      this.client = new Anthropic(options);
    }
  }

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
    if (!this.client) {
      // 如果没有 API key，返回空数组（降级模式）
      console.warn('No API key provided. Spec analysis requires ANTHROPIC_API_KEY environment variable.');
      return [];
    }

    const prompt = `Analyze the following specification and identify all ambiguities, vagueness, missing details, and potential contradictions.

For each ambiguity found:
1. Extract the exact text that is ambiguous
2. Identify its location (line number or section)
3. Generate a clarifying question to ask the user
4. Optionally suggest a direction for clarification

SPEC CONTENT:
${specContent}

Respond in JSON format with this structure:
[
  {
    "id": "unique-id-1",
    "text": "the ambiguous text from spec",
    "location": "line 5 or section name",
    "question": "What specific behavior do you want here?",
    "suggestion": "Optional suggestion for clarification"
  }
]

Only return the JSON array. If no ambiguities are found, return an empty array [].`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content.find((c) => c.type === 'text');
      if (!content || content.type !== 'text') {
        return [];
      }

      // 解析 JSON 响应
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const ambiguities: Ambiguity[] = JSON.parse(jsonMatch[0]);
      return this.validateAmbuities(ambiguities);
    } catch (error) {
      console.error('Error analyzing spec:', error);
      return [];
    }
  }

  /**
   * 验证和清理模糊点数据
   */
  private validateAmbuities(ambiguities: any[]): Ambiguity[] {
    if (!Array.isArray(ambiguities)) {
      return [];
    }

    return ambiguities
      .filter((a) => a && typeof a === 'object')
      .map((a, index) => ({
        id: a.id || `ambiguity-${index + 1}`,
        text: a.text || String(a.location || ''),
        location: a.location || `line ${index + 1}`,
        question: a.question || 'Please clarify this point.',
        suggestion: a.suggestion,
      }))
      .filter((a) => a.text && a.question);
  }
}
