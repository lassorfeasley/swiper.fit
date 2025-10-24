# Swiper

## Email (Resend) setup

Environment variables (set in Vercel project settings and/or local `.env`):

```
RESEND_API_KEY=...        # from Resend dashboard
EMAIL_FROM="Swiper <no-reply@swiper.fit>"  # or your verified sender
INTERNAL_API_SECRET=...   # optional: to secure server-to-server calls
```

Endpoint:

- `POST /api/email/notify` accepts either:
  - `{ to, subject, html }` to send a raw email, or
  - `{ to, event, data, context }` to build a formatted email for known events.

Client helper (optional): `postEmailEvent(event, to, data)` in `src/lib/emailEvents.js` mirrors the Slack event helper.

Notes:
- Do not hardcode API keys in source. Configure `RESEND_API_KEY` in environment.
- Verify your sending domain in Resend before production sends.

## Slack notifications setup

Environment variables (set in Vercel project settings and/or local `.env`):

```
SLACK_WEBHOOK_URL=...     # Slack incoming webhook URL
```

To set up Slack notifications:

1. Go to your Slack workspace
2. Create a new app or use an existing one
3. Enable "Incoming Webhooks" feature
4. Create a new webhook for your desired channel
5. Copy the webhook URL and set it as `SLACK_WEBHOOK_URL` environment variable

Endpoint:

- `POST /api/slack/notify` accepts either:
  - `{ text, blocks }` to send a raw Slack message, or
  - `{ event, data, context }` to build a formatted message for known events.

Client helper (optional): `postSlackEvent(event, data)` in `src/lib/slackEvents.ts` for client-side notifications.

Supported events:
- `workout.started` - When a user starts a workout
- `workout.ended` - When a user completes a workout
- `account.created` - When a new user creates an account
- `routine.created` - When a user creates a new routine
- `sharing.connected` - When account sharing is established

Notes:
- Slack notifications are fire-and-forget (failures are logged but don't block the main flow)
- The webhook URL must be configured in production for notifications to work
- Test locally with: `npm run notify:slack -- "test message"`

# Trigger deployment after Vercel outage
