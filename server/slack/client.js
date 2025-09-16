// Lightweight Slack client for sending messages via Incoming Webhooks
// Exposes: sendSlackMessage(payload: { text?: string, blocks?: any[], attachments?: any[], username?: string, icon_emoji?: string })

const DEFAULT_TIMEOUT_MS = 8000;

// Ensure a fetch implementation exists (Node 18+ has global fetch; fallback to node-fetch otherwise)
let fetchImpl = globalThis.fetch;
if (!fetchImpl) {
  const mod = await import('node-fetch');
  fetchImpl = mod.default;
}

function getWebhookUrl() {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    throw new Error('SLACK_WEBHOOK_URL is not configured');
  }
  return url;
}

export async function sendSlackMessage(payload, options = {}) {
  const webhookUrl = getWebhookUrl();
  const canAbort = typeof AbortController !== 'undefined';
  const controller = canAbort ? new AbortController() : null;
  const timeout = setTimeout(() => {
    if (controller && canAbort) controller.abort();
  }, options.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const resp = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      ...(controller && canAbort ? { signal: controller.signal } : {}),
    });
    if (!resp.ok) {
      const text = await safeReadText(resp);
      throw new Error(`Slack webhook responded with ${resp.status}: ${text}`);
    }
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

async function safeReadText(resp) {
  try {
    return await resp.text();
  } catch (e) {
    return '<no body>';
  }
}


