import { Command } from 'commander';
import { IterationController } from '../core/spec-refiner/iteration.js';
import type { Ambiguity } from '../core/spec-refiner/types.js';
import ora from 'ora';
import { promises as fs } from 'fs';
import { input, select } from '@inquirer/prompts';
import { loadLLMConfig, mergeConfig } from '../core/llm-config.js';

export interface RefineCommandOptions {
  maxIterations?: number;
  output?: string;
}

export class RefineCommand {
  async execute(specPath: string, options: RefineCommandOptions): Promise<void> {
    // 1. 加载配置：优先从 ~/.claude/settings.json，回退到环境变量
    const settingsConfig = await loadLLMConfig();
    const config = mergeConfig(settingsConfig);

    const apiKey = config.apiKey;
    const baseUrl = config.baseUrl;
    const model = config.model;

    if (!apiKey) {
      console.warn('\n⚠️  Warning: No API key found.');
      console.warn('Spec refinement requires an API key for LLM-powered analysis.');
      console.warn('Please set ANTHROPIC_AUTH_TOKEN in ~/.claude/settings.json or ANTHROPIC_API_KEY environment variable.\n');
    }

    const spinner = ora('Loading spec...').start();

    try {
      // 2. 读取 Spec 文件
      const specContent = await fs.readFile(specPath, 'utf-8');
      spinner.text = 'Analyzing spec...';

      // 3. 创建迭代控制器
      const controller = new IterationController(
        { maxIterations: options.maxIterations || 5, output: options.output },
        specContent,
        apiKey,
        baseUrl,
        model
      );

      spinner.stop();

      // 3. 开始迭代
      while (true) {
        const result = await controller.iterate();

        if (result.type === 'continue') {
          await this.handleIteration(controller, result.ambiguities);
        } else {
          // 完成
          await this.finalize(controller, result.finalSpec, result.reason, options.output);
          break;
        }
      }
    } catch (error) {
      spinner.stop();
      if ((error as any)?.message?.includes('ENOENT')) {
        throw new Error(`Spec file not found: ${specPath}`);
      }
      throw error;
    }
  }

  private async handleIteration(
    controller: IterationController,
    ambiguities: Ambiguity[]
  ): Promise<void> {
    const state = controller.getState();
    console.log(`\n--- Iteration ${state.currentIteration} ---\n`);
    console.log(`Found ${ambiguities.length} ambiguities to clarify.\n`);

    // 处理每个模糊点
    for (const ambiguity of ambiguities) {
      const answer = await this.askUser(ambiguity);
      await controller.processAnswer(ambiguity.id, answer);
    }
  }

  private async askUser(ambiguity: Ambiguity): Promise<string> {
    console.log(`\n📍 Ambiguity: "${ambiguity.text}"`);
    console.log(`   Location: ${ambiguity.location}`);
    console.log(`   ❓ Question: ${ambiguity.question}`);

    if (ambiguity.suggestion) {
      console.log(`   💡 Suggestion: ${ambiguity.suggestion}`);
    }

    const answerType = await select({
      message: 'How would you like to answer?',
      choices: [
        { value: 'custom', name: 'Enter custom answer', description: 'Type your own answer' },
        { value: 'skip', name: 'Skip this question', description: 'Skip and continue' },
      ],
    });

    if (answerType === 'skip') {
      return '[Skipped - user chose not to answer]';
    }

    const answer = await input({
      message: 'Your answer:',
    });

    return answer;
  }

  private async finalize(
    controller: IterationController,
    finalSpec: string,
    reason: string,
    outputPath?: string
  ): Promise<void> {
    const state = controller.getState();

    console.log('\n--- Refinement Complete ---\n');
    console.log(`Iterations: ${state.currentIteration}`);
    console.log(`Questions answered: ${state.answeredQuestions.length}`);
    console.log(`Reason: ${reason}`);

    if (outputPath) {
      await fs.writeFile(outputPath, finalSpec, 'utf-8');
      console.log(`\nOutput written to: ${outputPath}`);
    } else {
      console.log('\n--- Refined Spec ---\n');
      console.log(finalSpec);
    }
  }
}

/**
 * Register the refine command with the program.
 */
export function registerRefineCommand(program: Command): void {
  program
    .command('refine [spec-path]')
    .description('Iteratively refine a spec through ambiguity analysis and Q&A')
    .option('--max-iterations <n>', 'Max refinement iterations', '5')
    .option('--output <path>', 'Output path for refined spec')
    .action(async (specPath, options) => {
      try {
        const command = new RefineCommand();
        await command.execute(specPath, {
          maxIterations: parseInt(options.maxIterations, 10),
          output: options.output,
        });
      } catch (error) {
        console.log();
        ora().fail(`Error: ${(error as Error).message}`);
        process.exit(1);
      }
    });
}
