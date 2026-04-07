const { loadConfig } = require('../src/config');

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns config when all required vars are set', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    const config = loadConfig();

    expect(config.geminiApiKey).toBe('test-gemini-key');
    expect(config.openaiApiKey).toBe('test-openai-key');
    expect(config.logLevel).toBe('info');
  });

  test('uses LOG_LEVEL from env when set', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.LOG_LEVEL = 'debug';

    const config = loadConfig();

    expect(config.logLevel).toBe('debug');
  });

  test('throws when GEMINI_API_KEY is missing', () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.GEMINI_API_KEY;

    expect(() => loadConfig()).toThrow('GEMINI_API_KEY');
  });

  test('returns null openaiApiKey when OPENAI_API_KEY is missing', () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    delete process.env.OPENAI_API_KEY;

    const config = loadConfig();
    expect(config.openaiApiKey).toBeNull();
  });
});
