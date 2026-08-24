/**
 * Centralized Environment Configuration & Validation for Quantum
 */

export interface MissingVariable {
  name: string;
  description?: string;
  isClientSide?: boolean;
}

export class ConfigurationError extends Error {
  public readonly missing: MissingVariable[];
  public readonly isConfigurationError = true;

  constructor(message: string, missing: MissingVariable[] = []) {
    super(message);
    this.name = 'ConfigurationError';
    this.missing = missing;
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }

  static formatErrorMessage(missing: MissingVariable[]): string {
    if (missing.length === 0) {
      return 'Configuration Error: An unknown configuration error occurred.';
    }

    if (missing.length === 1) {
      const item = missing[0];
      const desc = item.description ? ` (${item.description})` : '';
      const side = item.isClientSide ? ' [Client-exposed]' : ' [Server-only]';
      return `Configuration Error: ${item.name}${desc}${side} is not configured. Please add it to your environment variables and restart the application.`;
    }

    const lines: string[] = [
      'Configuration Error: The following required environment variables are missing:\n',
    ];

    for (const item of missing) {
      const desc = item.description ? ` (${item.description})` : '';
      const side = item.isClientSide ? ' [Client-exposed]' : ' [Server-only]';
      lines.push(`  * ${item.name}${desc}${side}`);
    }

    lines.push('\nPlease configure the required environment variables and restart the application.');
    return lines.join('\n').trim();
  }

  static fromMissing(missing: MissingVariable[]): ConfigurationError {
    return new ConfigurationError(this.formatErrorMessage(missing), missing);
  }
}

function getEnv(name: string, env: Record<string, string | undefined> = process.env): string {
  return (env[name] || '').trim();
}

export interface QuantumConfig {
  geminiApiKey: string;
  geminiApiBaseUrl: string;
  geminiModelFlash: string;
  geminiModelPro: string;
  geminiModelUltra: string;
  apiBaseUrl: string;
  accountAppUrl: string;
  quantumAppUrl: string;
  isProduction: boolean;
}

export function validateQuantumServerEnv(
  env: Record<string, string | undefined> = process.env,
): {
  isValid: boolean;
  isProduction: boolean;
  config: QuantumConfig | null;
  error?: ConfigurationError;
  missing: string[];
} {
  const isProduction = env.NODE_ENV === 'production';
  const missing: MissingVariable[] = [];

  const geminiApiKey = getEnv('GEMINI_API_KEY', env);
  if (!geminiApiKey) {
    missing.push({
      name: 'GEMINI_API_KEY',
      description: 'Google Gemini API Key for AI chat interactions',
      isClientSide: false,
    });
  }

  if (missing.length > 0) {
    const error = ConfigurationError.fromMissing(missing);
    return {
      isValid: false,
      isProduction,
      config: null,
      error,
      missing: missing.map(m => m.name),
    };
  }

  const config: QuantumConfig = {
    geminiApiKey,
    geminiApiBaseUrl: getEnv('GEMINI_API_BASE_URL', env) || 'https://generativelanguage.googleapis.com/v1beta',
    geminiModelFlash: getEnv('QUANTUM_GEMINI_MODEL_FLASH', env) || getEnv('GEMINI_MODEL', env) || 'gemini-2.5-flash',
    geminiModelPro: getEnv('QUANTUM_GEMINI_MODEL_PRO', env) || getEnv('GEMINI_MODEL', env) || 'gemini-2.5-flash',
    geminiModelUltra: getEnv('QUANTUM_GEMINI_MODEL_ULTRA', env) || getEnv('GEMINI_MODEL', env) || 'gemini-2.5-pro',
    apiBaseUrl: getEnv('CHEFU_API_BASE_URL', env) || getEnv('NEXT_PUBLIC_API_BASE_URL', env) || 'https://api.chefu.co.za',
    accountAppUrl: getEnv('NEXT_PUBLIC_CHEFU_ACCOUNT_URL', env) || 'https://myaccount.chefu.co.za',
    quantumAppUrl: getEnv('NEXT_PUBLIC_QUANTUM_APP_URL', env) || 'https://quantum.chefu.co.za',
    isProduction,
  };

  return {
    isValid: true,
    isProduction,
    config,
    missing: [],
  };
}

export function assertQuantumServerEnv(
  env: Record<string, string | undefined> = process.env,
): QuantumConfig {
  const result = validateQuantumServerEnv(env);
  if (!result.isValid || !result.config) {
    throw result.error || new ConfigurationError('Invalid Quantum configuration.');
  }
  return result.config;
}
