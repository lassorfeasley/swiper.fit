# Swiper

## Local Development Setup

### Running the Development Server

This project uses Vercel CLI for local development to support both the frontend and API routes.

**Prerequisites:**
- Node.js installed
- Vercel CLI installed (included as dev dependency)

**Quick Start:**
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The dev server will start on `http://localhost:3000` and handle both:
- Frontend (Vite/React) - served by Vite
- API routes (`/api/*`) - proxied to production environment (https://www.swiper.fit)

**Note:** API routes are proxied to production for local testing. This allows you to test invitation functionality locally. Invitations will be created in your production database.

**Alternative Commands:**
- `npm run dev` - Standard development (Vite with API proxy to staging)
- `npm run dev:vercel` - Full local development with Vercel CLI (requires Vercel CLI setup)

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration (required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration (required for invitations)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="Swiper <no-reply@swiper.fit>"

# Site URL for local development
PUBLIC_SITE_URL=http://localhost:3000

# Optional: Slack Notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url

# Optional: Internal API Secret
INTERNAL_API_SECRET=your_internal_api_secret
```

**Note:** `.env.local` is already in `.gitignore` and will not be committed to the repository.

### Linking to Vercel Project (Optional)

If you want to use environment variables from your Vercel project:

```bash
# Link to your Vercel project
vercel link

# This will prompt you to:
# - Set up and develop "Y/n"
# - Which scope: select your account
# - Link to existing project: select your project
```

After linking, Vercel CLI will use production environment variables as fallback if `.env.local` is missing values.

### Troubleshooting

**API routes return 404:**
- Make sure you're using `npm run dev` (Vercel CLI) not `npm run dev:vite`
- Check that Vercel CLI is installed: `npx vercel --version`
- Verify your `.env.local` file exists and has required variables

**Invitation emails not sending:**
- Verify `RESEND_API_KEY` is set in `.env.local`
- Check that `EMAIL_FROM` matches a verified sender in Resend
- Check browser console and server logs for errors

**Supabase connection errors:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Ensure your Supabase project is active and accessible

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
