// Mizan HQ — Telegram Relay for Rashid
// Deployed as a Vercel serverless function
// Receives messages from agents, forwards to Asaad via Telegram

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple auth — agents must send the relay secret
  const authHeader = req.headers['x-relay-secret'];
  if (authHeader !== process.env.RELAY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { text, priority, buttons } = req.body;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!text) {
    return res.status(400).json({ error: 'Missing text field' });
  }

  // Add priority emoji prefix
  const priorityMap = { red: '🔴', yellow: '🟡', green: '🟢' };
  const prefix = priorityMap[priority] || '🟢';
  const fullText = `${prefix} ${text}`;

  // Build Telegram API payload
  const payload = {
    chat_id: chatId,
    text: fullText,
    parse_mode: 'Markdown',
  };

  // Add inline keyboard buttons if provided
  if (buttons && buttons.length > 0) {
    payload.reply_markup = JSON.stringify({
      inline_keyboard: [buttons.map(b => ({
        text: b.text,
        callback_data: b.data || b.text,
      }))],
    });
  }

  try {
    const tgResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const result = await tgResponse.json();

    if (!result.ok) {
      return res.status(500).json({ error: 'Telegram API error', details: result });
    }

    return res.status(200).json({ success: true, message_id: result.result.message_id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send', details: err.message });
  }
}
