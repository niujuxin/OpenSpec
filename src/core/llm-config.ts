import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * LLM 配置接口
 *
 * 对应 ~/.claude/settings.json 中的配置字段
 */
export interface LLMConfig {
  /** API Key (对应 settings.json 中的 ANTHROPIC_AUTH_TOKEN) */
  apiKey?: string;
  /** Base URL (对应 settings.json 中的 ANTHROPIC_BASE_URL) */
  baseUrl?: string;
  /** Model name (对应 settings.json 中的 ANTHROPIC_MODEL) */
  model?: string;
}

/**
 * 内部配置接口，对应 settings.json 的实际结构
 */
interface SettingsJson {
  env?: {
    ANTHROPIC_AUTH_TOKEN?: string;
    ANTHROPIC_BASE_URL?: string;
    ANTHROPIC_MODEL?: string;
    [key: string]: string | undefined;
  };
}

/**
 * 从 ~/.claude/settings.json 加载 LLM 配置
 *
 * @returns 配置对象，如果文件不存在或解析失败则返回 null
 */
export async function loadLLMConfig(): Promise<LLMConfig | null> {
  try {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
      return null;
    }

    const settingsPath = path.join(homeDir, '.claude', 'settings.json');

    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings: SettingsJson = JSON.parse(content);

      const result: LLMConfig = {};

      if (settings.env) {
        // 映射配置字段
        if (settings.env.ANTHROPIC_AUTH_TOKEN) {
          result.apiKey = settings.env.ANTHROPIC_AUTH_TOKEN;
        }
        if (settings.env.ANTHROPIC_BASE_URL) {
          result.baseUrl = settings.env.ANTHROPIC_BASE_URL;
        }
        if (settings.env.ANTHROPIC_MODEL) {
          result.model = settings.env.ANTHROPIC_MODEL;
        }
      }

      // 如果没有任何有效配置，返回 null
      if (!result.apiKey && !result.baseUrl && !result.model) {
        return null;
      }

      return result;
    } catch (error) {
      // 文件不存在或 JSON 解析失败
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      console.warn('Warning: Failed to parse ~/.claude/settings.json:', (error as Error).message);
      return null;
    }
  } catch (error) {
    // 其他错误（如路径问题）
    console.warn('Warning: Failed to load ~/.claude/settings.json:', (error as Error).message);
    return null;
  }
}

/**
 * 合并配置：优先使用 settings.json，回退到环境变量，最终回退到默认值
 *
 * @param settingsConfig 从 settings.json 加载的配置
 * @returns 合并后的配置
 */
export function mergeConfig(settingsConfig: LLMConfig | null): LLMConfig {
  const result: LLMConfig = {
    // 默认值
    model: 'claude-sonnet-4-20250514',
  };

  // 环境变量回退
  if (process.env.ANTHROPIC_API_KEY) {
    result.apiKey = process.env.ANTHROPIC_API_KEY;
  }
  if (process.env.ANTHROPIC_BASE_URL) {
    result.baseUrl = process.env.ANTHROPIC_BASE_URL;
  }
  if (process.env.ANTHROPIC_MODEL) {
    result.model = process.env.ANTHROPIC_MODEL;
  }

  // settings.json 优先级更高
  if (settingsConfig) {
    if (settingsConfig.apiKey) {
      result.apiKey = settingsConfig.apiKey;
    }
    if (settingsConfig.baseUrl) {
      result.baseUrl = settingsConfig.baseUrl;
    }
    if (settingsConfig.model) {
      result.model = settingsConfig.model;
    }
  }

  return result;
}
