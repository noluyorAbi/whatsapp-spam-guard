const { classify } = require('../src/classifier');

// Mock both AI SDKs
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn(),
      }),
    })),
  };
});

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

describe('classify', () => {
  let geminiGenerate;
  let openaiCreate;

  beforeEach(() => {
    jest.clearAllMocks();

    geminiGenerate = GoogleGenerativeAI.mock.results[0]?.value
      ?.getGenerativeModel()?.generateContent;
    openaiCreate = OpenAI.mock.results[0]?.value
      ?.chat?.completions?.create;

    // Re-require to get fresh mocks wired
    jest.resetModules();
  });

  test('returns spam=true when Gemini says spam', async () => {
    // Need to set up mocks before requiring the module
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue({
            response: {
              text: () => JSON.stringify({ spam: true, reason: 'Trading group invite' }),
            },
          }),
        }),
      })),
    }));

    const { classify: freshClassify } = require('../src/classifier');
    const config = { geminiApiKey: 'test-key', openaiApiKey: 'test-key' };
    const result = await freshClassify(config, 'Join forex group https://chat.whatsapp.com/ABC');

    expect(result.spam).toBe(true);
    expect(result.reason).toMatch(/trading/i);
  });

  test('falls back to OpenAI when Gemini fails', async () => {
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('Gemini rate limited')),
        }),
      })),
    }));

    jest.doMock('openai', () => {
      return jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: JSON.stringify({ spam: false, reason: 'Legitimate link' }) } }],
            }),
          },
        },
      }));
    });

    const { classify: freshClassify } = require('../src/classifier');
    const config = { geminiApiKey: 'test-key', openaiApiKey: 'test-key' };
    const result = await freshClassify(config, 'Check this https://example.com');

    expect(result.spam).toBe(false);
  });

  test('returns spam=false when both APIs fail (fail-open)', async () => {
    jest.doMock('@google/generative-ai', () => ({
      GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('Gemini down')),
        }),
      })),
    }));

    jest.doMock('openai', () => {
      return jest.fn().mockImplementation(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('OpenAI down')),
          },
        },
      }));
    });

    const { classify: freshClassify } = require('../src/classifier');
    const config = { geminiApiKey: 'test-key', openaiApiKey: 'test-key' };
    const result = await freshClassify(config, 'Some message https://example.com');

    expect(result.spam).toBe(false);
    expect(result.reason).toMatch(/failed/i);
  });
});
