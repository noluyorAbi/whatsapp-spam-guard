const { handleSpam } = require('../src/actions');

describe('handleSpam', () => {
  function createMockMsg({ isAdmin = true, deleteSucceeds = true } = {}) {
    const chat = {
      removeParticipants: jest.fn().mockResolvedValue(true),
    };
    const msg = {
      delete: deleteSucceeds
        ? jest.fn().mockResolvedValue(true)
        : jest.fn().mockRejectedValue(new Error('Already deleted')),
      getChat: jest.fn().mockResolvedValue(chat),
      author: '5511999999999@c.us',
      from: 'group123@g.us',
      body: 'spam message',
    };

    // Mock the bot's admin status
    chat.participants = [
      {
        id: { _serialized: 'botid@c.us' },
        isAdmin: isAdmin,
        isSuperAdmin: false,
      },
      {
        id: { _serialized: '5511999999999@c.us' },
        isAdmin: false,
        isSuperAdmin: false,
      },
    ];

    return { msg, chat };
  }

  test('deletes message and kicks user when bot is admin', async () => {
    const { msg, chat } = createMockMsg();
    const botId = 'botid@c.us';

    const result = await handleSpam(msg, 'Spam detected', botId);

    expect(msg.delete).toHaveBeenCalledWith(true);
    expect(chat.removeParticipants).toHaveBeenCalledWith(['5511999999999@c.us']);
    expect(result.success).toBe(true);
  });

  test('logs warning and skips when bot is not admin', async () => {
    const { msg } = createMockMsg({ isAdmin: false });
    const botId = 'botid@c.us';

    const result = await handleSpam(msg, 'Spam detected', botId);

    expect(msg.delete).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.reason).toMatch(/not admin/i);
  });

  test('continues kicking even if delete fails', async () => {
    const { msg, chat } = createMockMsg({ deleteSucceeds: false });
    const botId = 'botid@c.us';

    const result = await handleSpam(msg, 'Spam detected', botId);

    expect(chat.removeParticipants).toHaveBeenCalledWith(['5511999999999@c.us']);
    expect(result.success).toBe(true);
  });
});
