import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ConfigurationError,
  validateQuantumServerEnv,
  assertQuantumServerEnv,
} from './env';

test('validateQuantumServerEnv succeeds when GEMINI_API_KEY is provided', () => {
  const env: Record<string, string | undefined> = {
    GEMINI_API_KEY: 'AIzaSy_fake_test_key_123',
    NEXT_PUBLIC_API_BASE_URL: 'https://api.chefu.co.za',
  };
  const result = validateQuantumServerEnv(env);
  assert.equal(result.isValid, true);
  assert.ok(result.config);
  assert.equal(result.config.geminiApiKey, 'AIzaSy_fake_test_key_123');
  assert.equal(result.config.geminiModelFlash, 'gemini-2.5-flash');
});

test('validateQuantumServerEnv fails when GEMINI_API_KEY is missing', () => {
  const env: Record<string, string | undefined> = {
    GEMINI_API_KEY: '',
  };
  const result = validateQuantumServerEnv(env);
  assert.equal(result.isValid, false);
  assert.deepEqual(result.missing, ['GEMINI_API_KEY']);
  assert.ok(result.error instanceof ConfigurationError);
  assert.match(result.error.message, /Configuration Error: GEMINI_API_KEY/i);
});

test('assertQuantumServerEnv throws ConfigurationError when missing key', () => {
  assert.throws(
    () => assertQuantumServerEnv({}),
    (err: unknown) => {
      assert.ok(err instanceof ConfigurationError);
      assert.match((err as Error).message, /GEMINI_API_KEY/);
      return true;
    },
  );
});

test('assertQuantumServerEnv returns sanitized config without leaking secrets in error strings', () => {
  const secretKey = 'super_secret_raw_gemini_key_to_protect';
  const validEnv: Record<string, string | undefined> = {
    GEMINI_API_KEY: secretKey,
  };
  const config = assertQuantumServerEnv(validEnv);
  assert.equal(config.geminiApiKey, secretKey);
});
