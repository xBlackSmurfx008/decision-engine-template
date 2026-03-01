# Decision Engine Template

A **Tinder-style decision making system** with built-in feedback loop. Swipe to make decisions, report back on outcomes, and build a knowledge base of what actually works.

![Decision Cards Demo](docs/demo.gif)

## What is this?

The Decision Engine helps you:
1. **Make decisions quickly** — Swipe left (reject) or right (approve) on decision cards
2. **Capture context** — Add notes to each decision for future reference
3. **Learn from outcomes** — Report back on completed tasks so the system learns what works
4. **Build institutional knowledge** — Create a searchable database of decisions and their outcomes

Perfect for:
- Personal productivity systems
- Small team decision tracking
- Executive assistants managing principals
- Anyone who wants to make better decisions over time

## Quick Start

### 1. Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/decision-engine-template)

### 2. Set Environment Variables

In your Vercel dashboard, add these environment variables:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

**Optional:** Get a Telegram bot token from [@BotFather](https://t.me/botfather) to receive notifications when decisions are made.

### 3. Start Using

- **Decision Cards**: `https://your-app.vercel.app/decision-cards.html`
- **Task Review**: `https://your-app.vercel.app/task-review.html`

## How It Works

### The Decision Loop

```
┌─────────────────┐
│  Decision Card  │ ← Swipe to decide
│  (with notes)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Webhook/API   │ → Sends to your system
│   Notification  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Time passes... │
│  You complete   │
│  the task       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Task Review   │ ← Report what happened
│   (feedback)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Knowledge Base │ → Stored for future learning
│  (learnings)    │
└─────────────────┘
```

### Decision Cards

- **Swipe Left** = Reject/Kill
- **Swipe Right** = Approve/Keep  
- **Keyboard**: ← reject, → approve
- **Notes field**: Add context for each decision
- **Auto-syncs**: Decisions POST to `/api/decisions`

### Task Review

- **Pending**: Tasks awaiting your feedback (< 3 days)
- **Stale**: Tasks needing attention (> 3 days)
- **Completed**: Tasks you've reported on

**Feedback tags:**
- ✅ Completed as planned
- 🔄 Did it differently
- ⬆️ Exceeded expectations
- ⬇️ Didn't work out
- 💡 Better approach found
- ⏰ Took longer
- 💰 Saved money

## Customization

### Adding Your Own Decision Cards

Edit `decision-cards.html` and modify the `DECISION_CARDS` array:

```javascript
const DECISION_CARDS = [
  {
    id: 'unique-id',
    title: 'Your Decision Title',
    description: 'Detailed description of what needs deciding',
    category: 'business', // or 'personal', 'travel', 'urgent'
    priority: 'high', // 'urgent', 'high', 'medium', 'low'
    dueDate: 'March 15, 2026',
    estimatedCost: '$500',
    context: 'Additional context for the decision'
  },
  // Add more cards...
];
```

### Styling

The UI uses CSS variables for easy theming. Edit the `<style>` sections in each HTML file:

```css
:root {
  --bg-primary: #0a0a0f;
  --accent: #00d4ff;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
}
```

### API Endpoints

The system exposes two API endpoints:

#### POST `/api/decisions`
Receives decision data when user swipes.

**Payload:**
```json
{
  "id": "dc-001",
  "title": "Book DC Trip Flights",
  "decision": "approve",
  "note": "Book earliest Southwest flight",
  "category": "travel",
  "timestamp": "2026-02-28T13:55:00Z"
}
```

#### POST `/api/task-feedback`
Receives feedback when user completes a task.

**Payload:**
```json
{
  "taskId": "dc-001",
  "title": "Book DC Trip Flights",
  "completion": {
    "feedback": "Booked United instead - better times",
    "outcome": "different-approach",
    "tags": ["✅ Completed as planned", "💰 Saved money"]
  }
}
```

## Data Storage

By default, data is stored in:
- **Browser**: `localStorage` for offline-first experience
- **Vercel KV**: Optional server-side storage (requires setup)

To enable persistent server storage, connect a Vercel KV or Redis integration.

## Architecture

```
decision-engine-template/
├── decision-cards.html    # Swipeable decision UI
├── task-review.html       # Feedback collection UI
├── api/
│   ├── decisions.js       # Decision receiving endpoint
│   └── task-feedback.js   # Feedback receiving endpoint
├── package.json           # Dependencies
└── README.md             # This file
```

## Advanced: Connect to Your Own Backend

To send decisions to your own system instead of Telegram:

1. Edit `api/decisions.js` and modify the `sendTelegramNotification` function
2. Or, change the `ENDPOINT` in `decision-cards.html` to point to your API:

```javascript
const ENDPOINT = 'https://your-api.com/decisions';
```

## Privacy & Security

- All data is stored locally in the browser by default
- No external analytics or tracking
- Optional Telegram notifications (requires bot token)
- No personal data is collected

## Contributing

This is a template - feel free to fork and modify for your needs. If you build something cool, share it!

## License

MIT License — use it however you want.

---

Built by [Jack Adams](https://008.mradams.xyz) for Mr. Adams. Inspired by the need for better decision tracking and learning.
