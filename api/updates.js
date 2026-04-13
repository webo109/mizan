// Mizan HQ — Telegram Updates Reader
// Returns Asaad's latest messages to the bot (for agents to read his replies)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['x-relay-secret'];
  if (authHeader !== process.env.RELAY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  try {
    const tgResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?offset=-10`
    );
    const result = await tgResponse.json();

    if (!result.ok) {
      return res.status(500).json({ error: 'Telegram API error', details: result });
    }

    // Filter to only Asaad's messages
    const messages = (result.result || [])
      .filter(u => u.message && String(u.message.chat.id) === chatId)
      .map(u => ({
        text: u.message.text,
        date: u.message.date,
        message_id: u.message.message_id,
      }));

    return res.status(200).json({ messages });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch', details: err.message });
  }
}
