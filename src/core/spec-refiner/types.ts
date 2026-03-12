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
 * 已回答的问题
 */
export interface AnsweredQuestion {
  ambiguityId: string;
  question: string;
  answer: string;
  timestamp: Date;
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
 * 配置选项
 */
export interface RefineConfig {
  maxIterations: number;
  output?: string;
  /** API Key for Anthropic */
  apiKey?: string;
  /** Custom base URL for Anthropic API */
  baseUrl?: string;
  /** Model name to use */
  model?: string;
}

/**
 * 迭代结果
 */
export type IterationResult =
  | { type: 'continue'; ambiguities: Ambiguity[]; state: IterationState }
  | { type: 'complete'; state: IterationState; finalSpec: string; reason: string }
  | { type: 'max_iterations'; state: IterationState; finalSpec: string; reason: string };
