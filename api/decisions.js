// Vercel Serverless Function - Receive decisions + webhook to Jack
// Deploy to: api/decisions.js

import { kv } from '@vercel/kv';

// Telegram bot config (read from env vars)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1561081116';
const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL;
const OPENCLAW_GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN;

async function sendTelegramNotification(decision) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('Telegram bot token not configured, skipping notification');
    return;
  }

  const emoji = decision.decision === 'approve' ? '✅' : '❌';
  const actionText = decision.decision === 'approve' ? 'APPROVED' : 'REJECTED';
  
  const message = `${emoji} **Decision Made: ${actionText}**

**${decision.title}**
Category: ${decision.category || 'N/A'}
Priority: ${decision.priority || 'N/A'}

${decision.note ? `📝 Note: "${decision.note}"` : ''}

⏰ Received: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET

I will begin execution immediately.`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    if (response.ok) {
      console.log('✓ Telegram notification sent');
    }
  } catch (e) {
    console.error('Failed to send Telegram notification:', e);
  }
}

async function pingOpenClawGateway(decision) {
  if (!OPENCLAW_GATEWAY_URL) {
    console.log('OpenClaw gateway not configured, skipping ping');
    return;
  }

  try {
    const response = await fetch(`${OPENCLAW_GATEWAY_URL}/wake`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_GATEWAY_TOKEN || ''}`
      },
      body: JSON.stringify({
        text: `DECISION_RECEIVED: ${decision.decision.toUpperCase()} - ${decision.title}`,
        mode: 'now'
      })
    });
    
    if (response.ok) {
      console.log('✓ OpenClaw gateway pinged');
    }
  } catch (e) {
    console.error('Failed to ping OpenClaw gateway:', e);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Retrieve decisions for Jack
  if (req.method === 'GET') {
    try {
      let decisions = [];
      try {
        decisions = await kv.get('pending_decisions') || [];
      } catch (e) {
        // KV not configured
      }

      return res.status(200).json({
        decisions: decisions.filter(d => !d.processed),
        count: decisions.filter(d => !d.processed).length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Receive new decision + trigger webhooks
  if (req.method === 'POST') {
    try {
      const decision = req.body;
      
      if (!decision.id || !decision.decision) {
        return res.status(400).json({ 
          error: 'Missing required fields: id, decision' 
        });
      }

      const enrichedDecision = {
        ...decision,
        receivedAt: new Date().toISOString(),
        status: 'pending_jack_review',
        processed: false,
        source: 'decision-cards-ui',
        webhookSent: false
      };

      // Store in KV
      try {
        let existing = await kv.get('pending_decisions') || [];
        existing.unshift(enrichedDecision);
        if (existing.length > 100) existing = existing.slice(0, 100);
        await kv.set('pending_decisions', existing);
      } catch (e) {
        // KV not configured, continue
      }

      console.log('📥 Decision received:', {
        id: enrichedDecision.id,
        title: enrichedDecision.title,
        decision: enrichedDecision.decision,
        hasNote: !!enrichedDecision.note
      });

      // Trigger webhooks (fire and forget)
      const webhookPromises = [
        sendTelegramNotification(enrichedDecision),
        pingOpenClawGateway(enrichedDecision)
      ];
      
      // Don't await webhooks - respond immediately to client
      Promise.all(webhookPromises).then(() => {
        console.log('✓ All webhooks processed');
      }).catch(e => {
        console.error('Webhook error:', e);
      });

      return res.status(200).json({
        success: true,
        message: 'Decision received - Jack has been notified',
        decisionId: enrichedDecision.id,
        timestamp: enrichedDecision.receivedAt,
        webhookTriggered: true
      });

    } catch (error) {
      console.error('Error processing decision:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}