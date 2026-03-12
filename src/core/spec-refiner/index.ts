/**
 * Spec Refiner Module
 *
 * Iteratively refine specs through ambiguity analysis and Q&A.
 */

export { SpecAnalyzer } from './analyzer.js';
export { IterationController } from './iteration.js';
export type {
  SpecAnalysis,
  Ambiguity,
  IterationState,
  RefineConfig,
  AnsweredQuestion,
  IterationResult,
} from './types.js';
