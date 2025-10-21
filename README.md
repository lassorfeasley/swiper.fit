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
# Trigger deployment after Vercel outage
