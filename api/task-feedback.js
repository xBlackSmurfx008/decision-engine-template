// Vercel Serverless Function - Receive task feedback
import { kv } from '@vercel/kv';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1561081116';

async function notifyJack(feedback) {
  if (!TELEGRAM_BOT_TOKEN) return;

  const emoji = { 'success': '✅', 'exceeded': '🚀', 'different-approach': '🔄', 'failed': '❌' }[feedback.completion.outcome] || '✅';

  const message = `${emoji} **Task Feedback: ${feedback.title}**

Outcome: ${feedback.completion.outcome.toUpperCase()}

${feedback.completion.feedback.substring(0, 150)}${feedback.completion.feedback.length > 150 ? '...' : ''}

🏷️ ${feedback.completion.tags.join(', ') || 'No tags'}

Learning logged for future use.`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.error('Notify failed:', e);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const feedback = req.body;
    if (!feedback.taskId || !feedback.completion) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store learning
    try {
      let learnings = await kv.get('jack_learnings') || [];
      learnings.unshift({
        type: 'task_feedback',
        category: feedback.category,
        title: feedback.title,
        lesson: feedback.completion.feedback,
        tags: feedback.completion.tags,
        timestamp: new Date().toISOString()
      });
      if (learnings.length > 200) learnings = learnings.slice(0, 200);
      await kv.set('jack_learnings', learnings);
    } catch (e) {}

    notifyJack(feedback);

    return res.status(200).json({
      success: true,
      message: "Feedback received and added to Jack's knowledge base"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}